// VOID Core Integration
// Orchestrates all advanced memory modules into a unified system

class VOIDCore {
    constructor(supabaseClient = null, config = {}) {
        this.supabaseClient = supabaseClient; // Optional - only for website, not extension
        
        this.config = {
            // HierarchyManager config
            maxDepth: config.maxDepth || 5,
            similarityThreshold: config.similarityThreshold || 0.7,
            
            // DeltaEngine config
            compressionThreshold: config.compressionThreshold || 0.3,
            maxPatchChain: config.maxPatchChain || 10,
            
            // SemanticFingerprint config
            duplicateThreshold: config.duplicateThreshold || 0.95,
            
            // CausalReasoner config
            maxChainDepth: config.maxChainDepth || 10,
            inferenceThreshold: config.inferenceThreshold || 0.7,
            
            // MultiModalHandler config
            ocrEnabled: config.ocrEnabled !== false,
            visualFingerprintEnabled: config.visualFingerprintEnabled !== false,
            
            // FederatedSync config (disabled by default for local-only operation)
            syncInterval: config.syncInterval || 30000,
            encryptionEnabled: config.encryptionEnabled !== false,
            
            // LLMQueryEngine config
            maxResults: config.maxResults || 10,
            defaultTokenLimit: config.defaultTokenLimit || 4000,
            
            // Global config - autoSync disabled by default for local-only extension
            autoSync: false, // Disabled - extension runs 100% locally
            storagePrefix: config.storagePrefix || 'void_'
        };
        
        // Initialize all modules
        this.hierarchyManager = new HierarchyManager({
            maxDepth: this.config.maxDepth,
            similarityThreshold: this.config.similarityThreshold
        });
        
        this.deltaEngine = new DeltaEngine({
            compressionThreshold: this.config.compressionThreshold,
            maxPatchChain: this.config.maxPatchChain
        });
        
        this.semanticFingerprint = new SemanticFingerprintV2({
            duplicateThreshold: this.config.duplicateThreshold
        });
        
        this.causalReasoner = new CausalReasoner({
            maxChainDepth: this.config.maxChainDepth,
            inferenceThreshold: this.config.inferenceThreshold
        });
        
        this.multiModalHandler = new MultiModalHandler({
            ocrEnabled: this.config.ocrEnabled,
            visualFingerprintEnabled: this.config.visualFingerprintEnabled
        });
        
        // Only initialize federated sync if Supabase client is provided
        // Extension runs 100% locally without cloud sync
        this.federatedSync = supabaseClient ? new FederatedSyncManager(supabaseClient, {
            syncInterval: this.config.syncInterval,
            encryptionEnabled: this.config.encryptionEnabled
        }) : null;
        
        this.queryEngine = new LLMQueryEngine(
            this.hierarchyManager,
            this.causalReasoner,
            this.semanticFingerprint,
            this.multiModalHandler,
            {
                maxResults: this.config.maxResults,
                defaultTokenLimit: this.config.defaultTokenLimit
            }
        );
        
        this.isInitialized = false;
        this.stats = {
            messagesProcessed: 0,
            imagesProcessed: 0,
            queriesExecuted: 0,
            syncOperations: 0,
            startTime: Date.now()
        };
    }
    
    /**
     * Initialize the system
     */
    async initialize(encryptionPassword = null) {
        if (this.isInitialized) {
            console.warn('VOID already initialized');
            return;
        }
        
        console.log('Initializing VOID Core...');
        
        try {
            // Initialize federated sync only if available and enabled
            // Extension runs 100% locally, so this will be skipped
            if (this.federatedSync && this.config.autoSync) {
                await this.federatedSync.initialize(encryptionPassword);
            }
            
            // Load persisted state
            await this.loadState();
            
            // Set up event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('VOID Core initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize VOID:', error);
            throw error;
        }
    }
    
    /**
     * Process a new message
     * @param {Object} message - Message object
     * @returns {Promise<Object>} Processing result
     */
    async processMessage(message) {
        if (!this.isInitialized) {
            throw new Error('VOID not initialized');
        }
        
        const startTime = Date.now();
        
        try {
            // 1. Check for semantic duplicates
            const fingerprint = this.semanticFingerprint.generateFingerprint(message.content);
            const duplicateCheck = this.semanticFingerprint.checkDuplicate(fingerprint);
            
            if (duplicateCheck.isDuplicate) {
                console.log('Duplicate message detected, skipping');
                return {
                    success: true,
                    skipped: true,
                    reason: 'duplicate',
                    matches: duplicateCheck.matches
                };
            }
            
            // 2. Add to hierarchy
            const hierarchyResult = this.hierarchyManager.addMessage(message);
            
            // 3. Add to causal graph
            const causalResult = this.causalReasoner.addMessage(
                message,
                hierarchyResult.parentId
            );
            
            // 4. Process images if any
            const images = await this.multiModalHandler.extractImagesFromMessage(message);
            
            // 5. Create snapshot for delta engine
            const snapshot = this.createSnapshot();
            const deltaResult = this.deltaEngine.saveState(snapshot);
            
            // 6. Sync to cloud if enabled
            if (this.config.autoSync) {
                await this.syncChanges([{
                    id: message.id,
                    type: 'message',
                    data: {
                        message: message,
                        hierarchy: hierarchyResult,
                        causality: causalResult,
                        images: images
                    },
                    timestamp: Date.now()
                }]);
            }
            
            // Update stats
            this.stats.messagesProcessed++;
            this.stats.imagesProcessed += images.length;
            
            return {
                success: true,
                messageId: message.id,
                hierarchyNode: hierarchyResult.nodeId,
                causalNode: causalResult.nodeId,
                images: images.length,
                fingerprint: fingerprint,
                processingTime: Date.now() - startTime
            };
            
        } catch (error) {
            console.error('Error processing message:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Query the memory system
     * @param {string} query - Natural language query
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Query results
     */
    async query(query, options = {}) {
        if (!this.isInitialized) {
            throw new Error('VOID not initialized');
        }
        
        const results = await this.queryEngine.query(query, options);
        
        this.stats.queriesExecuted++;
        
        return results;
    }
    
    /**
     * Get formatted context for LLM
     */
    async getContextForLLM(query, options = {}) {
        const results = await this.query(query, options);
        return this.queryEngine.formatForLLM(results);
    }
    
    /**
     * Get hierarchical context for a specific message
     */
    getHierarchicalContext(messageId, tokenLimit = 4000) {
        return this.hierarchyManager.getHierarchicalContext(messageId, tokenLimit);
    }
    
    /**
     * Get causal explanation for a message
     */
    explainWhy(messageId) {
        return this.causalReasoner.explainWhy(messageId);
    }
    
    /**
     * Search images
     */
    searchImages(query) {
        return this.multiModalHandler.searchByText(query);
    }
    
    /**
     * Sync changes to cloud (disabled for local-only extension)
     */
    async syncChanges(changes) {
        if (!this.federatedSync) {
            console.log('Cloud sync not available - running in local-only mode');
            return;
        }
        
        try {
            await this.federatedSync.pushChanges(changes);
            this.stats.syncOperations++;
        } catch (error) {
            console.error('Sync error:', error);
        }
    }
    
    /**
     * Full sync with cloud (disabled for local-only extension)
     */
    async fullSync() {
        if (!this.federatedSync) {
            console.log('Cloud sync not available - running in local-only mode');
            return;
        }
        
        try {
            await this.federatedSync.sync();
            this.stats.syncOperations++;
        } catch (error) {
            console.error('Full sync error:', error);
        }
    }
    
    /**
     * Create snapshot of current state
     */
    createSnapshot() {
        return {
            hierarchy: this.hierarchyManager.serialize(),
            causality: this.causalReasoner.serialize(),
            fingerprints: this.semanticFingerprint.serialize(),
            images: this.multiModalHandler.serialize(),
            timestamp: Date.now()
        };
    }
    
    /**
     * Restore from snapshot
     */
    restoreSnapshot(snapshot) {
        this.hierarchyManager = HierarchyManager.deserialize(snapshot.hierarchy);
        this.causalReasoner = CausalReasoner.deserialize(snapshot.causality);
        this.semanticFingerprint = SemanticFingerprintV2.deserialize(snapshot.fingerprints);
        this.multiModalHandler = MultiModalHandler.deserialize(snapshot.images);
    }
    
    /**
     * Save state to local storage
     */
    async saveState() {
        const snapshot = this.createSnapshot();
        
        // Use delta engine to compress
        const deltaResult = this.deltaEngine.saveWithVersioning(snapshot);
        
        // Save to IndexedDB
        await this.saveToIndexedDB('state', {
            snapshot: deltaResult.type === 'full' ? deltaResult.data : null,
            patch: deltaResult.type === 'delta' ? deltaResult.data : null,
            baseVersion: this.deltaEngine.baseVersion,
            timestamp: Date.now()
        });
    }
    
    /**
     * Load state from local storage
     */
    async loadState() {
        const stored = await this.loadFromIndexedDB('state');
        
        if (!stored) {
            console.log('No stored state found');
            return;
        }
        
        try {
            // Reconstruct state using delta engine
            let snapshot;
            
            if (stored.patch) {
                snapshot = this.deltaEngine.reconstructState(
                    stored.baseVersion,
                    [stored.patch]
                );
            } else {
                snapshot = stored.snapshot;
            }
            
            // Restore modules
            this.restoreSnapshot(snapshot);
            
            console.log('State loaded successfully');
            
        } catch (error) {
            console.error('Error loading state:', error);
        }
    }
    
    /**
     * Save to IndexedDB
     */
    async saveToIndexedDB(key, value) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('VOID', 1);
            
            request.onerror = () => reject(request.error);
            
            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(['state'], 'readwrite');
                const store = transaction.objectStore('state');
                
                const putRequest = store.put({ key: key, value: value });
                
                putRequest.onsuccess = () => resolve();
                putRequest.onerror = () => reject(putRequest.error);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('state')) {
                    db.createObjectStore('state', { keyPath: 'key' });
                }
            };
        });
    }
    
    /**
     * Load from IndexedDB
     */
    async loadFromIndexedDB(key) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('VOID', 1);
            
            request.onerror = () => reject(request.error);
            
            request.onsuccess = () => {
                const db = request.result;
                
                if (!db.objectStoreNames.contains('state')) {
                    resolve(null);
                    return;
                }
                
                const transaction = db.transaction(['state'], 'readonly');
                const store = transaction.objectStore('state');
                const getRequest = store.get(key);
                
                getRequest.onsuccess = () => {
                    resolve(getRequest.result?.value || null);
                };
                getRequest.onerror = () => reject(getRequest.error);
            };
        });
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Service worker context - use chrome.runtime.onMessage instead of window.addEventListener
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                if (message.type === 'VOID_SYNC_CHANGE') {
                    console.log('Received sync change:', message.data);
                    
                    // Apply change to local state
                    const change = message.data;
                    
                    if (change.type === 'message') {
                        this.processMessage(change.data.message).then(() => {
                            sendResponse({ success: true });
                        }).catch(error => {
                            sendResponse({ success: false, error: error.message });
                        });
                        return true; // Keep channel open for async response
                    }
                }
            });
        }
        
        // Auto-save periodically
        setInterval(() => {
            this.saveState().catch(error => {
                console.error('Auto-save error:', error);
            });
        }, 60000); // Every minute
    }
    
    /**
     * Get comprehensive statistics
     */
    getStats() {
        const uptime = Date.now() - this.stats.startTime;
        
        return {
            uptime: uptime,
            messagesProcessed: this.stats.messagesProcessed,
            imagesProcessed: this.stats.imagesProcessed,
            queriesExecuted: this.stats.queriesExecuted,
            syncOperations: this.stats.syncOperations,
            
            hierarchy: this.hierarchyManager.getStats(),
            delta: this.deltaEngine.getStats(),
            fingerprints: this.semanticFingerprint.getStats(),
            causality: this.causalReasoner.getStats(),
            images: this.multiModalHandler.getStats(),
            sync: this.federatedSync ? this.federatedSync.getStats() : { status: 'disabled', mode: 'local-only' },
            queries: this.queryEngine.getStats()
        };
    }
    
    /**
     * Export all data
     */
    async exportData() {
        const snapshot = this.createSnapshot();
        
        return {
            version: '1.0',
            exportDate: new Date().toISOString(),
            config: this.config,
            snapshot: snapshot,
            stats: this.stats
        };
    }
    
    /**
     * Import data
     */
    async importData(data) {
        if (data.version !== '1.0') {
            throw new Error('Unsupported data version');
        }
        
        this.restoreSnapshot(data.snapshot);
        
        if (data.stats) {
            this.stats = { ...this.stats, ...data.stats };
        }
        
        await this.saveState();
        
        console.log('Data imported successfully');
    }
    
    /**
     * Clean up resources
     */
    async cleanup() {
        console.log('Cleaning up VOID...');
        
        // Save final state
        await this.saveState();
        
        // Clean up modules
        await this.multiModalHandler.cleanup();
        if (this.federatedSync) {
            await this.federatedSync.cleanup();
        }
        
        this.isInitialized = false;
    }
}

// Export for use in extension
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VOIDCore;
}
