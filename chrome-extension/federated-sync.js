// Federated Memory Sync Manager
// Cross-device synchronization with Supabase backend and end-to-end encryption

class FederatedSyncManager {
    constructor(supabaseClient, config = {}) {
        this.supabase = supabaseClient;
        
        this.config = {
            syncInterval: config.syncInterval || 30000, // 30 seconds
            encryptionEnabled: config.encryptionEnabled !== false,
            conflictResolution: config.conflictResolution || 'latest-wins',
            batchSize: config.batchSize || 100,
            retryAttempts: config.retryAttempts || 3,
            retryDelay: config.retryDelay || 1000
        };
        
        this.syncState = {
            lastSync: null,
            isSyncing: false,
            pendingChanges: [],
            conflictQueue: []
        };
        
        this.encryptionKey = null;
        this.deviceId = null; // Will be set async in initialize()
        
        // Subscribe to real-time updates
        this.subscription = null;
    }
    
    /**
     * Initialize sync manager
     */
    async initialize(encryptionPassword = null) {
        // Get or create device ID
        this.deviceId = await this.getOrCreateDeviceId();
        
        // Generate or derive encryption key
        if (this.config.encryptionEnabled && encryptionPassword) {
            this.encryptionKey = await this.deriveKey(encryptionPassword);
        }
        
        // Load last sync timestamp
        const stored = await this.loadLocalState();
        if (stored) {
            this.syncState.lastSync = stored.lastSync;
        }
        
        // Subscribe to real-time updates
        await this.subscribeToUpdates();
        
        // Start periodic sync
        this.startPeriodicSync();
        
        console.log('FederatedSyncManager initialized for device:', this.deviceId);
    }
    
    /**
     * Get or create device ID
     */
    async getOrCreateDeviceId() {
        // Use chrome.storage instead of localStorage for service worker compatibility
        const stored = await chrome.storage.local.get(['void_device_id']);
        let deviceId = stored.void_device_id;
        
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            await chrome.storage.local.set({ void_device_id: deviceId });
        }
        
        return deviceId;
    }
    
    /**
     * Derive encryption key from password
     */
    async deriveKey(password) {
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);
        
        // Import password as key material
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            'PBKDF2',
            false,
            ['deriveKey']
        );
        
        // Derive AES-GCM key
        const salt = encoder.encode('void_salt_v1'); // In production, use random salt
        
        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
        
        return key;
    }
    
    /**
     * Encrypt data
     */
    async encrypt(data) {
        if (!this.encryptionKey) {
            return data; // Return plaintext if encryption disabled
        }
        
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(JSON.stringify(data));
        
        // Generate random IV
        const iv = crypto.getRandomValues(new Uint8Array(12));
        
        // Encrypt
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            this.encryptionKey,
            dataBuffer
        );
        
        // Combine IV and encrypted data
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(encrypted), iv.length);
        
        // Convert to base64
        return btoa(String.fromCharCode.apply(null, combined));
    }
    
    /**
     * Decrypt data
     */
    async decrypt(encryptedData) {
        if (!this.encryptionKey) {
            return encryptedData; // Return plaintext if encryption disabled
        }
        
        // Convert from base64
        const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
        
        // Extract IV and encrypted data
        const iv = combined.slice(0, 12);
        const encrypted = combined.slice(12);
        
        // Decrypt
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            this.encryptionKey,
            encrypted
        );
        
        // Convert to string and parse JSON
        const decoder = new TextDecoder();
        const jsonString = decoder.decode(decrypted);
        return JSON.parse(jsonString);
    }
    
    /**
     * Push local changes to server
     * @param {Array} changes - Array of change objects
     */
    async pushChanges(changes) {
        if (changes.length === 0) return;
        
        this.syncState.pendingChanges.push(...changes);
        
        // Process in batches
        while (this.syncState.pendingChanges.length > 0) {
            const batch = this.syncState.pendingChanges.splice(0, this.config.batchSize);
            
            try {
                await this.pushBatch(batch);
            } catch (error) {
                console.error('Error pushing batch:', error);
                
                // Re-add to queue for retry
                this.syncState.pendingChanges.unshift(...batch);
                
                throw error;
            }
        }
    }
    
    /**
     * Push a batch of changes
     */
    async pushBatch(batch) {
        const encrypted = [];
        
        for (const change of batch) {
            const encryptedData = await this.encrypt(change.data);
            
            encrypted.push({
                id: change.id,
                type: change.type,
                data: encryptedData,
                device_id: this.deviceId,
                timestamp: change.timestamp || Date.now(),
                version: change.version || 1
            });
        }
        
        // Insert into Supabase
        const { data, error } = await this.supabase
            .from('memory_changes')
            .insert(encrypted);
        
        if (error) {
            throw new Error('Failed to push changes: ' + error.message);
        }
        
        return data;
    }
    
    /**
     * Pull changes from server
     * @param {number} since - Timestamp to pull changes since
     * @returns {Promise<Array>} Array of changes
     */
    async pullChanges(since = null) {
        since = since || this.syncState.lastSync || 0;
        
        try {
            // Query Supabase for changes
            let query = this.supabase
                .from('memory_changes')
                .select('*')
                .gt('timestamp', since)
                .order('timestamp', { ascending: true });
            
            // Don't pull our own changes
            query = query.neq('device_id', this.deviceId);
            
            const { data, error } = await query;
            
            if (error) {
                throw new Error('Failed to pull changes: ' + error.message);
            }
            
            // Decrypt changes
            const decrypted = [];
            
            for (const change of data || []) {
                const decryptedData = await this.decrypt(change.data);
                
                decrypted.push({
                    id: change.id,
                    type: change.type,
                    data: decryptedData,
                    deviceId: change.device_id,
                    timestamp: change.timestamp,
                    version: change.version
                });
            }
            
            return decrypted;
            
        } catch (error) {
            console.error('Error pulling changes:', error);
            throw error;
        }
    }
    
    /**
     * Sync with server
     */
    async sync() {
        if (this.syncState.isSyncing) {
            console.log('Sync already in progress');
            return;
        }
        
        this.syncState.isSyncing = true;
        
        try {
            // Pull remote changes
            const remoteChanges = await this.pullChanges();
            
            console.log('Pulled', remoteChanges.length, 'remote changes');
            
            // Apply remote changes
            const conflicts = await this.applyChanges(remoteChanges);
            
            // Handle conflicts
            if (conflicts.length > 0) {
                console.log('Detected', conflicts.length, 'conflicts');
                this.syncState.conflictQueue.push(...conflicts);
            }
            
            // Update last sync timestamp
            this.syncState.lastSync = Date.now();
            await this.saveLocalState();
            
        } catch (error) {
            console.error('Sync error:', error);
            throw error;
        } finally {
            this.syncState.isSyncing = false;
        }
    }
    
    /**
     * Apply changes to local state
     * @returns {Array} Array of conflicts
     */
    async applyChanges(changes) {
        const conflicts = [];
        
        for (const change of changes) {
            // Check for conflicts
            const localVersion = await this.getLocalVersion(change.id);
            
            if (localVersion && localVersion.timestamp > change.timestamp) {
                // Local is newer
                if (this.config.conflictResolution === 'latest-wins') {
                    continue; // Keep local
                } else {
                    conflicts.push({
                        id: change.id,
                        local: localVersion,
                        remote: change
                    });
                }
            } else {
                // Apply remote change
                await this.applyChange(change);
            }
        }
        
        return conflicts;
    }
    
    /**
     * Apply single change
     */
    async applyChange(change) {
        // Service worker context - use chrome.runtime.sendMessage instead of window
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.sendMessage({
                type: 'VOID_SYNC_CHANGE',
                data: change
            }).catch(() => {}); // Ignore if no listeners
        }
    }
    
    /**
     * Get local version of object
     */
    async getLocalVersion(id) {
        // This should query local storage
        // For now, return null
        return null;
    }
    
    /**
     * Subscribe to real-time updates
     */
    async subscribeToUpdates() {
        if (!this.supabase.channel) {
            console.warn('Supabase Realtime not available');
            return;
        }
        
        this.subscription = this.supabase
            .channel('memory_changes')
            .on('postgres_changes', 
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'memory_changes' 
                }, 
                async (payload) => {
                    // Ignore our own changes
                    if (payload.new.device_id === this.deviceId) {
                        return;
                    }
                    
                    console.log('Real-time change received:', payload.new.id);
                    
                    // Decrypt and apply
                    const decryptedData = await this.decrypt(payload.new.data);
                    
                    await this.applyChange({
                        id: payload.new.id,
                        type: payload.new.type,
                        data: decryptedData,
                        deviceId: payload.new.device_id,
                        timestamp: payload.new.timestamp,
                        version: payload.new.version
                    });
                }
            )
            .subscribe();
    }
    
    /**
     * Start periodic sync
     */
    startPeriodicSync() {
        this.syncInterval = setInterval(() => {
            this.sync().catch(error => {
                console.error('Periodic sync error:', error);
            });
        }, this.config.syncInterval);
    }
    
    /**
     * Stop periodic sync
     */
    stopPeriodicSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }
    
    /**
     * Resolve conflict
     */
    async resolveConflict(conflictId, resolution) {
        const conflictIndex = this.syncState.conflictQueue.findIndex(c => c.id === conflictId);
        
        if (conflictIndex === -1) {
            throw new Error('Conflict not found');
        }
        
        const conflict = this.syncState.conflictQueue[conflictIndex];
        
        if (resolution === 'keep-local') {
            // Push local version to server
            await this.pushChanges([{
                id: conflict.local.id,
                type: conflict.local.type,
                data: conflict.local.data,
                timestamp: Date.now(),
                version: conflict.local.version + 1
            }]);
        } else if (resolution === 'keep-remote') {
            // Apply remote version
            await this.applyChange(conflict.remote);
        } else if (resolution === 'merge') {
            // Implement custom merge logic
            throw new Error('Merge resolution not implemented');
        }
        
        // Remove from queue
        this.syncState.conflictQueue.splice(conflictIndex, 1);
    }
    
    /**
     * Save local state
     */
    async saveLocalState() {
        const state = {
            lastSync: this.syncState.lastSync,
            deviceId: this.deviceId
        };
        
        await chrome.storage.local.set({ void_sync_state: JSON.stringify(state) });
    }
    
    /**
     * Load local state
     */
    async loadLocalState() {
        const stored = await chrome.storage.local.get(['void_sync_state']);
        return stored.void_sync_state ? JSON.parse(stored.void_sync_state) : null;
    }
    
    /**
     * Get statistics
     */
    getStats() {
        return {
            deviceId: this.deviceId,
            lastSync: this.syncState.lastSync,
            isSyncing: this.syncState.isSyncing,
            pendingChanges: this.syncState.pendingChanges.length,
            conflicts: this.syncState.conflictQueue.length,
            encryptionEnabled: this.config.encryptionEnabled
        };
    }
    
    /**
     * Cleanup
     */
    async cleanup() {
        this.stopPeriodicSync();
        
        if (this.subscription) {
            await this.subscription.unsubscribe();
            this.subscription = null;
        }
    }
}

// Export for use in extension
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FederatedSyncManager;
}
