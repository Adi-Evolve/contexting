// VOID Extension - Background V3 - Step 2: Add Delta Engine
// Base: v3-step1 + DeltaEngine module

console.log('🧠 VOID Background V3-Step2: Starting (Base + HierarchyManager + DeltaEngine)...');

// Import modules
try {
    importScripts('hierarchy-manager.js');
    console.log('✅ HierarchyManager loaded');
} catch (e) {
    console.error('❌ Failed to load HierarchyManager:', e);
}

try {
    importScripts('delta-engine.js');
    console.log('✅ DeltaEngine loaded');
} catch (e) {
    console.error('❌ Failed to load DeltaEngine:', e);
}

// Storage (exactly like v2)
let conversations = [];
let stats = { count: 0, size: 0 };

// Module instances
let hierarchyManager = null;
let deltaEngine = null;

// Initialize
chrome.runtime.onInstalled.addListener(async () => {
    console.log('🧠 VOID V3-Step2: Extension installed');
    await loadData();
    initializeModules();
});

// Initialize modules
function initializeModules() {
    // Initialize HierarchyManager
    try {
        hierarchyManager = new HierarchyManager({
            maxDepth: 5,
            topicShiftThreshold: 0.4,
            similarityThreshold: 0.7
        });
        console.log('✅ HierarchyManager initialized');
    } catch (e) {
        console.error('❌ Failed to initialize HierarchyManager:', e);
        hierarchyManager = null;
    }

    // Initialize DeltaEngine
    try {
        deltaEngine = new DeltaEngine({
            maxPatchChainLength: 10,
            fullSnapshotInterval: 100,
            compressionThreshold: 0.3,
            enableVersioning: true
        });
        console.log('✅ DeltaEngine initialized');
    } catch (e) {
        console.error('❌ Failed to initialize DeltaEngine:', e);
        deltaEngine = null;
    }
}

// Load data from storage
async function loadData() {
    const data = await chrome.storage.local.get(['conversations', 'stats', 'deltaVersions']);
    if (data.conversations) {
        conversations = data.conversations;
        stats = data.stats || { count: conversations.length, size: 0 };
    }
    console.log(`📚 Loaded ${conversations.length} conversations`);
}

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    handleMessage(request)
        .then(sendResponse)
        .catch(err => sendResponse({ error: err.message }));
    return true;
});

async function handleMessage(request) {
    switch (request.action) {
        case 'storeConversation':
            return await storeConversation(request.conversation);
        
        case 'getConversations':
            return await getConversations(request.filter);
        
        case 'getConversation':
            return await getConversation(request.id);
        
        case 'findConversationByChatId':
            return await findConversationByChatId(request.chatId);
        
        case 'searchConversations':
            return await searchConversations(request.query);
        
        case 'exportConversations':
            return await exportConversations();
        
        case 'getStats':
            return stats;
        
        case 'mergeConversations':
            return await mergeConversations(request.conversationIds);
        
        case 'getHierarchyStats':
            return getHierarchyStats();
        
        case 'getDeltaStats':
            return getDeltaStats();
        
        case 'getConversationVersion':
            return await getConversationVersion(request.id, request.version);
        
        default:
            throw new Error('Unknown action: ' + request.action);
    }
}

// Store conversation WITH hierarchical organization AND delta compression
async function storeConversation(conversation) {
    try {
        await loadData();
        
        // Find existing conversation
        let existingIndex = conversations.findIndex(c => 
            c.id === conversation.id || (conversation.chatId && c.chatId === conversation.chatId)
        );
        
        let oldVersion = null;
        if (existingIndex !== -1) {
            oldVersion = JSON.parse(JSON.stringify(conversations[existingIndex]));
        }
        
        // 🆕 Build hierarchy if HierarchyManager is available
        if (hierarchyManager && conversation.messages) {
            console.log('📊 Building hierarchy for conversation...');
            try {
                // Reset hierarchy for new conversation
                initializeModules();
                
                // Add all messages to hierarchy
                for (const message of conversation.messages) {
                    hierarchyManager.addMessage(message);
                }
                
                // Get hierarchical context
                const hierarchyContext = hierarchyManager.getHierarchicalContext(20, 2000);
                conversation.hierarchy = {
                    tree: hierarchyManager.serialize(),
                    context: hierarchyContext,
                    stats: hierarchyManager.getStats()
                };
                
                console.log(`✅ Hierarchy built: ${conversation.hierarchy.stats.totalNodes} nodes`);
            } catch (e) {
                console.error('❌ Failed to build hierarchy:', e);
            }
        }
        
        // 🆕 Apply delta compression if DeltaEngine is available AND this is an update
        if (deltaEngine && oldVersion && existingIndex !== -1) {
            console.log('🗜️ Applying delta compression...');
            try {
                // Calculate diff between old and new
                const diff = deltaEngine.calculateDiff(oldVersion, conversation);
                const patch = deltaEngine.generatePatch(diff);
                
                // Store version info
                if (!conversation.deltaInfo) {
                    conversation.deltaInfo = {
                        version: 1,
                        patches: [],
                        baseSnapshot: oldVersion,
                        compressionStats: {
                            originalSize: JSON.stringify(conversation).length,
                            compressedSize: 0,
                            compressionRatio: 0
                        }
                    };
                }
                
                conversation.deltaInfo.version++;
                conversation.deltaInfo.patches.push(patch);
                
                // Calculate compression stats
                const fullSize = JSON.stringify(conversation).length;
                const deltaSize = JSON.stringify(patch).length;
                conversation.deltaInfo.compressionStats = {
                    originalSize: fullSize,
                    compressedSize: deltaSize,
                    compressionRatio: deltaSize / fullSize,
                    savedBytes: fullSize - deltaSize
                };
                
                console.log(`✅ Delta compression: ${fullSize} → ${deltaSize} bytes (${Math.round((1 - deltaSize/fullSize) * 100)}% reduction)`);
                
                // Optimize patch chain if needed
                if (conversation.deltaInfo.patches.length > deltaEngine.config.maxPatchChainLength) {
                    console.log('🔄 Optimizing patch chain...');
                    conversation.deltaInfo.baseSnapshot = conversation;
                    conversation.deltaInfo.patches = [];
                    conversation.deltaInfo.version = 1;
                }
            } catch (e) {
                console.error('❌ Failed to apply delta compression:', e);
            }
        }
        
        // Store or update
        if (existingIndex !== -1) {
            conversations[existingIndex] = conversation;
            console.log(`✏️ Updated conversation: ${conversation.title || conversation.id}`);
        } else {
            conversations.push(conversation);
            console.log(`➕ Added new conversation: ${conversation.title || conversation.id}`);
        }
        
        // Update stats
        stats.count = conversations.length;
        stats.size = JSON.stringify(conversations).length;
        
        // Save to storage
        await chrome.storage.local.set({ conversations, stats });
        
        return { 
            success: true, 
            id: conversation.id,
            hasHierarchy: !!conversation.hierarchy,
            hasDelta: !!conversation.deltaInfo
        };
    } catch (error) {
        console.error('❌ Error storing conversation:', error);
        return { success: false, error: error.message };
    }
}

async function getConversations(filter = {}) {
    await loadData();
    
    let result = [...conversations];
    
    if (filter.platform) {
        result = result.filter(c => c.platform === filter.platform);
    }
    
    if (filter.startDate || filter.endDate) {
        const start = filter.startDate ? new Date(filter.startDate).getTime() : 0;
        const end = filter.endDate ? new Date(filter.endDate).getTime() : Date.now();
        result = result.filter(c => {
            const timestamp = c.timestamp || 0;
            return timestamp >= start && timestamp <= end;
        });
    }
    
    return result;
}

async function getConversation(id) {
    await loadData();
    return conversations.find(c => c.id === id);
}

async function findConversationByChatId(chatId) {
    await loadData();
    return conversations.find(c => c.chatId === chatId);
}

async function searchConversations(query) {
    await loadData();
    
    const lowerQuery = query.toLowerCase();
    
    return conversations.filter(conv => {
        if (conv.title && conv.title.toLowerCase().includes(lowerQuery)) {
            return true;
        }
        
        if (conv.messages) {
            return conv.messages.some(msg => 
                msg.content && msg.content.toLowerCase().includes(lowerQuery)
            );
        }
        
        return false;
    });
}

async function exportConversations() {
    await loadData();
    return {
        version: '1.0',
        exportDate: new Date().toISOString(),
        count: conversations.length,
        conversations: conversations
    };
}

async function mergeConversations(conversationIds) {
    await loadData();
    
    if (!conversationIds || conversationIds.length < 2) {
        throw new Error('Need at least 2 conversations to merge');
    }
    
    const conversationsToMerge = conversationIds
        .map(id => conversations.find(c => c.id === id))
        .filter(c => c);
    
    if (conversationsToMerge.length < 2) {
        throw new Error('Could not find all conversations');
    }
    
    conversationsToMerge.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    
    const merged = {
        id: `merged_${Date.now()}`,
        title: conversationsToMerge.map(c => c.title || 'Untitled').join(' + '),
        platform: conversationsToMerge[0].platform,
        timestamp: conversationsToMerge[0].timestamp,
        messages: [],
        mergedFrom: conversationIds,
        isMerged: true
    };
    
    conversationsToMerge.forEach(conv => {
        if (conv.messages) {
            merged.messages.push(...conv.messages);
        }
    });
    
    merged.messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    
    await storeConversation(merged);
    
    return merged;
}

function getHierarchyStats() {
    if (!hierarchyManager) {
        return { error: 'HierarchyManager not initialized' };
    }
    
    return hierarchyManager.getStats();
}

function getDeltaStats() {
    if (!deltaEngine) {
        return { error: 'DeltaEngine not initialized' };
    }
    
    // Calculate overall compression stats
    let totalOriginal = 0;
    let totalCompressed = 0;
    let conversationsWithDelta = 0;
    
    conversations.forEach(conv => {
        if (conv.deltaInfo) {
            conversationsWithDelta++;
            totalOriginal += conv.deltaInfo.compressionStats.originalSize;
            totalCompressed += conv.deltaInfo.compressionStats.compressedSize;
        }
    });
    
    return {
        conversationsWithDelta,
        totalOriginal,
        totalCompressed,
        overallCompressionRatio: totalOriginal > 0 ? totalCompressed / totalOriginal : 0,
        savedBytes: totalOriginal - totalCompressed,
        config: deltaEngine.config
    };
}

async function getConversationVersion(id, version) {
    await loadData();
    
    const conversation = conversations.find(c => c.id === id);
    if (!conversation) {
        throw new Error('Conversation not found');
    }
    
    if (!conversation.deltaInfo) {
        return conversation; // No versioning, return current
    }
    
    if (!deltaEngine) {
        throw new Error('DeltaEngine not initialized');
    }
    
    // Reconstruct specific version
    if (version === undefined || version === conversation.deltaInfo.version) {
        return conversation; // Current version
    }
    
    if (version < 1 || version > conversation.deltaInfo.version) {
        throw new Error(`Invalid version: ${version} (available: 1-${conversation.deltaInfo.version})`);
    }
    
    // Apply patches up to requested version
    const baseSnapshot = conversation.deltaInfo.baseSnapshot;
    const patchesToApply = conversation.deltaInfo.patches.slice(0, version);
    
    return deltaEngine.reconstructState(baseSnapshot, patchesToApply);
}

console.log('✅ VOID V3-Step2 background script loaded');
