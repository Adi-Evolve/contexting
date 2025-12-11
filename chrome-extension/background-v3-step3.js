// VOID Extension - Background V3 - Step 3: Add Semantic Fingerprint
// Base: v3-step2 + SemanticFingerprintV2 module

console.log('🧠 VOID Background V3-Step3: Starting (Base + Hierarchy + Delta + Semantic)...');

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

try {
    importScripts('semantic-fingerprint-v2.js');
    console.log('✅ SemanticFingerprintV2 loaded');
} catch (e) {
    console.error('❌ Failed to load SemanticFingerprintV2:', e);
}

// Storage (exactly like v2)
let conversations = [];
let stats = { count: 0, size: 0 };

// Module instances
let hierarchyManager = null;
let deltaEngine = null;
let semanticFingerprint = null;

// Initialize
chrome.runtime.onInstalled.addListener(async () => {
    console.log('🧠 VOID V3-Step3: Extension installed');
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

    // Initialize SemanticFingerprintV2
    try {
        semanticFingerprint = new SemanticFingerprintV2({
            hashSize: 64,
            bloomFilterSize: 10000,
            bloomFilterHashes: 3,
            duplicateThreshold: 0.95,
            similarityThreshold: 0.85
        });
        console.log('✅ SemanticFingerprintV2 initialized');
    } catch (e) {
        console.error('❌ Failed to initialize SemanticFingerprintV2:', e);
        semanticFingerprint = null;
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
        
        case 'findSimilarConversations':
            return await findSimilarConversations(request.conversationId, request.threshold);
        
        case 'checkDuplicate':
            return await checkDuplicate(request.text);
        
        case 'getSemanticStats':
            return getSemanticStats();
        
        default:
            throw new Error('Unknown action: ' + request.action);
    }
}

// Store conversation WITH hierarchy, delta compression, AND semantic fingerprinting
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
        
        // 🆕 Generate semantic fingerprints for messages
        if (semanticFingerprint && conversation.messages) {
            console.log('🔍 Generating semantic fingerprints...');
            try {
                conversation.semanticData = {
                    fingerprints: [],
                    duplicates: [],
                    timestamp: Date.now()
                };
                
                // Generate fingerprint for each message
                for (const message of conversation.messages) {
                    if (message.content && message.content.length > 20) {
                        const fingerprint = semanticFingerprint.generateFingerprint(message.content);
                        
                        // Check for duplicates
                        const dupCheck = semanticFingerprint.checkDuplicate(message.content);
                        
                        conversation.semanticData.fingerprints.push({
                            messageId: message.id || message.timestamp,
                            fingerprint: fingerprint,
                            isDuplicate: dupCheck.isDuplicate,
                            confidence: dupCheck.confidence
                        });
                        
                        if (dupCheck.isDuplicate) {
                            conversation.semanticData.duplicates.push({
                                messageId: message.id || message.timestamp,
                                matches: dupCheck.matches
                            });
                        }
                    }
                }
                
                // Generate overall conversation fingerprint
                const conversationText = conversation.messages
                    .map(m => m.content)
                    .filter(c => c && c.length > 0)
                    .join(' ');
                
                if (conversationText.length > 50) {
                    conversation.semanticData.conversationFingerprint = 
                        semanticFingerprint.generateFingerprint(conversationText);
                    
                    // Check for similar conversations
                    const similarConvs = await findSimilarConversationsInternal(
                        conversation.semanticData.conversationFingerprint,
                        0.85
                    );
                    
                    conversation.semanticData.similarConversations = similarConvs.map(c => ({
                        id: c.id,
                        title: c.title,
                        similarity: c.similarity
                    }));
                }
                
                console.log(`✅ Generated ${conversation.semanticData.fingerprints.length} fingerprints, found ${conversation.semanticData.duplicates.length} duplicates`);
            } catch (e) {
                console.error('❌ Failed to generate semantic fingerprints:', e);
            }
        }
        
        // Build hierarchy if HierarchyManager is available
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
        
        // Apply delta compression if DeltaEngine is available AND this is an update
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
            hasDelta: !!conversation.deltaInfo,
            hasSemantic: !!conversation.semanticData
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

function getSemanticStats() {
    if (!semanticFingerprint) {
        return { error: 'SemanticFingerprintV2 not initialized' };
    }
    
    let totalFingerprints = 0;
    let totalDuplicates = 0;
    let conversationsWithSemantic = 0;
    
    conversations.forEach(conv => {
        if (conv.semanticData) {
            conversationsWithSemantic++;
            totalFingerprints += conv.semanticData.fingerprints.length;
            totalDuplicates += conv.semanticData.duplicates.length;
        }
    });
    
    return {
        conversationsWithSemantic,
        totalFingerprints,
        totalDuplicates,
        duplicateRate: totalFingerprints > 0 ? totalDuplicates / totalFingerprints : 0,
        cacheSize: semanticFingerprint.fingerprintCache.size,
        config: semanticFingerprint.config
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

async function findSimilarConversations(conversationId, threshold = 0.85) {
    await loadData();
    
    const targetConv = conversations.find(c => c.id === conversationId);
    if (!targetConv || !targetConv.semanticData) {
        return [];
    }
    
    return await findSimilarConversationsInternal(
        targetConv.semanticData.conversationFingerprint,
        threshold
    );
}

async function findSimilarConversationsInternal(targetFingerprint, threshold) {
    if (!semanticFingerprint || !targetFingerprint) {
        return [];
    }
    
    const similar = [];
    
    for (const conv of conversations) {
        if (conv.semanticData && conv.semanticData.conversationFingerprint) {
            if (conv.semanticData.conversationFingerprint === targetFingerprint) {
                continue; // Skip self
            }
            
            const similarity = semanticFingerprint.calculateSimilarity(
                targetFingerprint,
                conv.semanticData.conversationFingerprint
            );
            
            if (similarity >= threshold) {
                similar.push({
                    id: conv.id,
                    title: conv.title,
                    platform: conv.platform,
                    timestamp: conv.timestamp,
                    similarity: similarity
                });
            }
        }
    }
    
    return similar.sort((a, b) => b.similarity - a.similarity);
}

async function checkDuplicate(text) {
    if (!semanticFingerprint) {
        return { error: 'SemanticFingerprintV2 not initialized' };
    }
    
    return semanticFingerprint.checkDuplicate(text);
}

console.log('✅ VOID V3-Step3 background script loaded');
