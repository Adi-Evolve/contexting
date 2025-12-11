// VOID Extension - Background Service Worker (Manifest V3)
// Integrates all 7 advanced memory modules
// Runs 100% locally - no cloud dependencies

// Import core modules
importScripts('hierarchy-manager.js');
importScripts('delta-engine.js');
importScripts('semantic-fingerprint-v2.js');
importScripts('causal-reasoner.js');
importScripts('multimodal-handler.js');
importScripts('federated-sync.js'); // Not used in local mode
importScripts('llm-query-engine.js');
importScripts('void-core.js');

// Global VOID instance (runs locally without cloud sync)
let voidCore = null;

// Configuration (minimal - no Supabase needed)
let config = {
    encryptionPassword: null // Optional local encryption
};

/**
 * Initialize VOID on extension install/update
 */
chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('VOID Extension installed/updated:', details.reason);
    
    // Load configuration
    await loadConfig();
    
    // Initialize VOID
    await initializeVOID();
    
    // Set up alarm for periodic tasks
    chrome.alarms.create('void-maintenance', {
        periodInMinutes: 30
    });
});

/**
 * Initialize VOID on startup
 */
chrome.runtime.onStartup.addListener(async () => {
    console.log('VOID Extension starting...');
    
    await loadConfig();
    await initializeVOID();
});

/**
 * Load configuration from storage
 */
async function loadConfig() {
    const stored = await chrome.storage.local.get(['encryptionPassword']);
    
    config = {
        encryptionPassword: stored.encryptionPassword || null
    };
    
    console.log('Configuration loaded:', {
        hasEncryption: !!config.encryptionPassword,
        mode: 'local-only'
    });
}

/**
 * Initialize VOID Core (100% local - no cloud sync)
 */
async function initializeVOID() {
    try {
        console.log('🚀 Initializing VOID Core...');
        
        // Create VOID instance without Supabase (runs 100% locally)
        voidCore = new VOIDCore(null, {
            autoSync: false, // Disabled - local-only mode
            ocrEnabled: true,
            visualFingerprintEnabled: true,
            maxDepth: 5,
            similarityThreshold: 0.7,
            compressionThreshold: 0.3,
            duplicateThreshold: 0.95,
            maxChainDepth: 10,
            syncInterval: 30000,
            encryptionEnabled: !!config.encryptionPassword
        });
        
        // Initialize
        await voidCore.initialize(config.encryptionPassword);
        
        console.log('✅ VOID Core initialized successfully in LOCAL-ONLY mode');
        
        // Send status to popup
        broadcastStatus({
            initialized: true,
            stats: voidCore.getStats()
        });
        
    } catch (error) {
        console.error('❌ Failed to initialize VOID:', error);
        console.error('Stack:', error.stack);
        
        // Set voidCore to null so we know it failed
        voidCore = null;
        
        console.warn('⚠️ VOID Core disabled - falling back to basic storage');
        
        broadcastStatus({
            initialized: false,
            error: error.message
        });
    }
}

/**
 * Handle messages from content scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Message received:', message.type, 'from', sender.tab?.url);
    
    handleMessage(message, sender)
        .then(response => sendResponse(response))
        .catch(error => {
            console.error('Error handling message:', error);
            sendResponse({ success: false, error: error.message });
        });
    
    return true; // Keep channel open for async response
});

/**
 * Handle different message types
 */
async function handleMessage(message, sender) {
    // Try to initialize VOID if not already done (non-blocking)
    if (voidCore === null) {
        console.log('⚠️ VOID Core not initialized, attempting init...');
        await initializeVOID();
    }
    
    // Handle legacy action-based messages (for backward compatibility with content scripts)
    // These work even if VOID Core fails
    if (message.action) {
        console.log(`📥 Handling legacy action: ${message.action}`);
        switch (message.action) {
            case 'storeConversation':
                return await storeConversation(message.conversation);
            
            case 'getConversations':
                return await getConversations(message.filter);
            
            case 'getConversation':
                return await getConversation(message.id);
            
            case 'findConversationByChatId':
                return await findConversationByChatId(message.chatId);
            
            case 'searchConversations':
                return await searchConversations(message.query);
            
            case 'exportConversations':
                return await exportConversations();
            
            case 'getStats':
                return await getStorageStats();
            
            case 'mergeConversations':
                return await mergeConversations(message.conversationIds);
        }
    }
    
    // Handle new type-based messages (VOID Core) - only if VOID is initialized
    if (!voidCore) {
        console.warn('⚠️ VOID Core not available, skipping advanced features');
        return { success: false, error: 'VOID Core not initialized' };
    }
    switch (message.type) {
        case 'PROCESS_MESSAGE':
            return await processMessage(message.data, sender);
        
        case 'QUERY_MEMORY':
            return await queryMemory(message.data);
        
        case 'GET_CONTEXT':
            return await getContext(message.data);
        
        case 'GET_STATS':
            return await getStats();
        
        case 'UPDATE_CONFIG':
            return await updateConfig(message.data);
        
        case 'EXPORT_DATA':
            return await exportData();
        
        case 'IMPORT_DATA':
            return await importData(message.data);
        
        case 'CLEAR_MEMORY':
            return await clearMemory();
        
        default:
            return { success: false, error: 'Unknown message type' };
    }
}

/**
 * Process a conversation message
 */
async function processMessage(messageData, sender) {
    try {
        console.log('Processing message:', messageData.id);
        
        // Add metadata
        messageData.metadata = {
            ...messageData.metadata,
            source: sender.tab?.url || 'unknown',
            tabId: sender.tab?.id,
            platform: detectPlatform(sender.tab?.url)
        };
        
        // Process through VOID
        const result = await voidCore.processMessage(messageData);
        
        console.log('Message processed:', result);
        
        // Update badge
        updateBadge();
        
        return {
            success: true,
            result: result
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
 * Query memory with natural language
 */
async function queryMemory(queryData) {
    try {
        console.log('Querying memory:', queryData.query);
        
        const results = await voidCore.query(queryData.query, queryData.options);
        
        console.log('Query results:', results.results.length, 'items');
        
        return {
            success: true,
            results: results
        };
        
    } catch (error) {
        console.error('Error querying memory:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get formatted context for LLM
 */
async function getContext(contextData) {
    try {
        console.log('Getting context:', contextData.query);
        
        const context = await voidCore.getContextForLLM(
            contextData.query,
            contextData.options
        );
        
        return {
            success: true,
            context: context
        };
        
    } catch (error) {
        console.error('Error getting context:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get statistics
 */
async function getStats() {
    try {
        const stats = voidCore ? voidCore.getStats() : null;
        
        return {
            success: true,
            stats: stats,
            config: {
                hasSupabase: !!config.supabaseUrl,
                autoSync: config.autoSync
            }
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Update configuration
 */
async function updateConfig(newConfig) {
    try {
        // Save to storage
        await chrome.storage.local.set(newConfig);
        
        // Reload config
        await loadConfig();
        
        // Reinitialize if needed
        if (newConfig.supabaseUrl || newConfig.encryptionPassword) {
            await initializeVOID();
        }
        
        return {
            success: true
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Export all data
 */
async function exportData() {
    try {
        const data = await voidCore.exportData();
        
        // Convert to blob
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });
        
        return {
            success: true,
            dataUrl: URL.createObjectURL(blob)
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Import data
 */
async function importData(data) {
    try {
        await voidCore.importData(data);
        
        return {
            success: true
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Clear all memory
 */
async function clearMemory() {
    try {
        // Reinitialize with fresh state
        await initializeVOID();
        
        return {
            success: true
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Detect platform from URL
 */
function detectPlatform(url) {
    if (!url) return 'unknown';
    
    if (url.includes('chat.openai.com')) return 'chatgpt';
    if (url.includes('claude.ai')) return 'claude';
    if (url.includes('gemini.google.com')) return 'gemini';
    
    return 'other';
}

/**
 * Update extension badge
 */
function updateBadge() {
    if (!voidCore) return;
    
    const stats = voidCore.getStats();
    const count = stats.messagesProcessed;
    
    chrome.action.setBadgeText({
        text: count > 999 ? '999+' : count.toString()
    });
    
    chrome.action.setBadgeBackgroundColor({
        color: '#00ff00'
    });
}

/**
 * Broadcast status to all tabs
 */
function broadcastStatus(status) {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
                type: 'VOID_STATUS',
                data: status
            }).catch(() => {}); // Ignore errors
        });
    });
}

/**
 * Handle alarms (periodic tasks)
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'void-maintenance') {
        console.log('Running maintenance tasks...');
        
        if (voidCore) {
            // Apply temporal decay to causal relationships
            voidCore.causalReasoner.applyDecay();
            
            // Prune dead branches
            voidCore.hierarchyManager.pruneDeadBranches();
            
            // Save state
            await voidCore.saveState();
            
            console.log('Maintenance complete');
        }
    }
});

/**
 * Handle context menu (optional - for quick queries)
 */
chrome.contextMenus.create({
    id: 'void-query',
    title: 'Query VOID Memory: "%s"',
    contexts: ['selection']
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'void-query' && info.selectionText) {
        const results = await queryMemory({ query: info.selectionText });
        
        // Send results to content script
        chrome.tabs.sendMessage(tab.id, {
            type: 'VOID_QUERY_RESULTS',
            data: results
        });
    }
});

// ============================================================================
// Legacy Storage Functions (for backward compatibility with existing UI)
// ============================================================================

let legacyConversations = [];
let legacyStats = { count: 0, size: 0 };

/**
 * Load legacy conversations from storage
 */
async function loadLegacyData() {
    const data = await chrome.storage.local.get(['conversations', 'stats']);
    if (data.conversations) {
        legacyConversations = data.conversations;
        legacyStats = data.stats || { count: legacyConversations.length, size: 0 };
    }
}

/**
 * Store conversation (legacy format)
 */
async function storeConversation(conversation) {
    console.log('🔵 storeConversation called with:', conversation.id, 'messages:', conversation.messages?.length);
    
    try {
        await loadLegacyData();
        
        // Check for existing conversation by ID or chatId
        let existingIndex = legacyConversations.findIndex(c => c.id === conversation.id);
        
        if (existingIndex < 0 && conversation.chatId) {
            existingIndex = legacyConversations.findIndex(c => c.chatId === conversation.chatId);
        }
        
        if (existingIndex >= 0) {
            // Update existing
            const existing = legacyConversations[existingIndex];
            conversation.startTime = existing.startTime;
            legacyConversations[existingIndex] = conversation;
            console.log(`🔄 Updated conversation: ${conversation.id}`);
        } else {
            // Add new
            legacyConversations.push(conversation);
            console.log(`✅ Stored new conversation: ${conversation.id}`);
        }
        
        // Sort by most recent
        legacyConversations.sort((a, b) => b.startTime - a.startTime);
        
        // Update stats
        legacyStats.count = legacyConversations.length;
        legacyStats.size = JSON.stringify(legacyConversations).length;
        
        // Keep only last 100
        if (legacyConversations.length > 100) {
            legacyConversations = legacyConversations.slice(0, 100);
            legacyStats.count = legacyConversations.length;
        }
        
        // Save to storage
        await chrome.storage.local.set({ 
            conversations: legacyConversations, 
            stats: legacyStats 
        });
        
        return { success: true, id: conversation.id };
    } catch (error) {
        console.error('Error storing conversation:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get conversations with filter
 */
async function getConversations(filter = 'all') {
    try {
        await loadLegacyData();
        
        let filtered = legacyConversations;
        const now = Date.now();
        
        switch (filter) {
            case 'today':
                const startOfDay = new Date().setHours(0, 0, 0, 0);
                filtered = legacyConversations.filter(c => c.startTime >= startOfDay);
                break;
            case 'week':
                const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
                filtered = legacyConversations.filter(c => c.startTime >= weekAgo);
                break;
            case 'month':
                const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
                filtered = legacyConversations.filter(c => c.startTime >= monthAgo);
                break;
        }
        
        return { 
            conversations: filtered, 
            count: filtered.length,
            stats: legacyStats
        };
    } catch (error) {
        console.error('Error getting conversations:', error);
        return { conversations: [], count: 0, stats: { count: 0, size: 0 } };
    }
}

/**
 * Get single conversation
 */
async function getConversation(id) {
    try {
        await loadLegacyData();
        const conversation = legacyConversations.find(c => c.id === id);
        return conversation ? { success: true, conversation } : { success: false };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Find conversation by chat ID
 */
async function findConversationByChatId(chatId) {
    try {
        await loadLegacyData();
        const conversation = legacyConversations.find(c => c.chatId === chatId);
        return { conversation: conversation || null };
    } catch (error) {
        return { conversation: null };
    }
}

/**
 * Search conversations
 */
async function searchConversations(query) {
    try {
        await loadLegacyData();
        const lowerQuery = query.toLowerCase();
        
        const results = legacyConversations.filter(conv => {
            // Search in title
            if (conv.title?.toLowerCase().includes(lowerQuery)) return true;
            
            // Search in messages
            return conv.messages?.some(msg => 
                msg.content.toLowerCase().includes(lowerQuery)
            );
        });
        
        return { 
            conversations: results, 
            count: results.length 
        };
    } catch (error) {
        return { conversations: [], count: 0 };
    }
}

/**
 * Export conversations
 */
async function exportConversations() {
    try {
        await loadLegacyData();
        return { 
            success: true, 
            data: {
                conversations: legacyConversations,
                stats: legacyStats,
                exportedAt: Date.now()
            }
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Get storage stats
 */
async function getStorageStats() {
    await loadLegacyData();
    return legacyStats;
}

/**
 * Merge multiple conversations into one
 */
async function mergeConversations(conversationIds) {
    try {
        await loadLegacyData();
        
        // Get all conversations to merge
        const toMerge = legacyConversations.filter(c => conversationIds.includes(c.id));
        
        if (toMerge.length < 2) {
            return { success: false, error: 'Need at least 2 conversations to merge' };
        }
        
        // Sort by start time
        toMerge.sort((a, b) => a.startTime - b.startTime);
        
        // Create merged conversation
        const merged = {
            id: `merged_${Date.now()}`,
            chatId: null, // Merged conversations don't have a single chatId
            title: `Merged: ${toMerge.map(c => c.title || 'Untitled').join(' + ')}`,
            messages: [],
            startTime: toMerge[0].startTime,
            endTime: toMerge[toMerge.length - 1].endTime || Date.now(),
            messageCount: 0,
            url: 'merged',
            platform: toMerge[0].platform,
            linked: conversationIds, // Track which conversations were merged
            firstUserMessage: toMerge[0].firstUserMessage
        };
        
        // Merge all messages in chronological order
        for (const conv of toMerge) {
            if (conv.messages && conv.messages.length > 0) {
                merged.messages.push(...conv.messages);
            }
        }
        
        // Sort messages by timestamp
        merged.messages.sort((a, b) => a.timestamp - b.timestamp);
        
        // Update indices
        merged.messages.forEach((msg, index) => {
            msg.index = index;
        });
        
        merged.messageCount = merged.messages.length;
        
        // Generate new summary
        merged.summary = generateMergedSummary(merged);
        merged.compressed = compressConversation(merged);
        merged.tokens = estimateTokens(merged.summary.fullContext);
        
        // Remove old conversations
        legacyConversations = legacyConversations.filter(c => !conversationIds.includes(c.id));
        
        // Add merged conversation
        legacyConversations.push(merged);
        
        // Sort by most recent
        legacyConversations.sort((a, b) => b.startTime - a.startTime);
        
        // Update stats
        legacyStats.count = legacyConversations.length;
        legacyStats.size = JSON.stringify(legacyConversations).length;
        
        // Save
        await chrome.storage.local.set({ 
            conversations: legacyConversations, 
            stats: legacyStats 
        });
        
        console.log(`✅ Merged ${toMerge.length} conversations into: ${merged.id}`);
        
        return { success: true, merged: merged };
    } catch (error) {
        console.error('Error merging conversations:', error);
        return { success: false, error: error.message };
    }
}

function generateMergedSummary(conversation) {
    const messages = conversation.messages;
    
    const fullContext = messages.map(msg => ({
        role: msg.role,
        content: msg.content
    }));
    
    const narrative = messages.map(msg => 
        `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`
    ).join('\n\n');
    
    return {
        fullContext,
        narrative,
        contextPrompt: `This is a merged conversation from multiple chats.\n\n${narrative}`
    };
}

function compressConversation(conversation) {
    return JSON.stringify(conversation.messages);
}

function estimateTokens(context) {
    return JSON.stringify(context).length / 4;
}

console.log('🧠 VOID Background Service Worker loaded');
