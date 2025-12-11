// VOID Extension - Background V3 - Step 5: Add MultiModal Handler
// Base: v3-step4 + MultiModalHandler module

console.log('🧠 VOID Background V3-Step5: Starting (Base + 4 modules + MultiModal)...');

// Import modules
const modules = ['hierarchy-manager.js', 'delta-engine.js', 'semantic-fingerprint-v2.js', 'causal-reasoner.js', 'multimodal-handler.js'];
modules.forEach(mod => {
    try {
        importScripts(mod);
        console.log(`✅ ${mod.replace('.js', '')} loaded`);
    } catch (e) {
        console.error(`❌ Failed to load ${mod}:`, e);
    }
});

let conversations = [];
let stats = { count: 0, size: 0 };
let hierarchyManager = null;
let deltaEngine = null;
let semanticFingerprint = null;
let causalReasoner = null;
let multiModalHandler = null;

chrome.runtime.onInstalled.addListener(async () => {
    console.log('🧠 VOID V3-Step5: Extension installed');
    await loadData();
    initializeModules();
});

function initializeModules() {
    try {
        hierarchyManager = new HierarchyManager({ maxDepth: 5, topicShiftThreshold: 0.4, similarityThreshold: 0.7 });
        console.log('✅ HierarchyManager initialized');
    } catch (e) { console.error('❌ HierarchyManager:', e); hierarchyManager = null; }

    try {
        deltaEngine = new DeltaEngine({ maxPatchChainLength: 10, fullSnapshotInterval: 100, compressionThreshold: 0.3, enableVersioning: true });
        console.log('✅ DeltaEngine initialized');
    } catch (e) { console.error('❌ DeltaEngine:', e); deltaEngine = null; }

    try {
        semanticFingerprint = new SemanticFingerprintV2({ hashSize: 64, bloomFilterSize: 10000, bloomFilterHashes: 3, duplicateThreshold: 0.95, similarityThreshold: 0.85 });
        console.log('✅ SemanticFingerprintV2 initialized');
    } catch (e) { console.error('❌ SemanticFingerprintV2:', e); semanticFingerprint = null; }

    try {
        causalReasoner = new CausalReasoner({ maxChainDepth: 10, inferenceThreshold: 0.7, decayRate: 0.1, minConfidence: 0.5 });
        console.log('✅ CausalReasoner initialized');
    } catch (e) { console.error('❌ CausalReasoner:', e); causalReasoner = null; }

    try {
        multiModalHandler = new MultiModalHandler({ maxImageSize: 5 * 1024 * 1024, thumbnailSize: 256, ocrEnabled: false, visualFingerprintEnabled: true, compressionQuality: 0.8 });
        console.log('✅ MultiModalHandler initialized');
    } catch (e) { console.error('❌ MultiModalHandler:', e); multiModalHandler = null; }
}

async function loadData() {
    const data = await chrome.storage.local.get(['conversations', 'stats']);
    if (data.conversations) {
        conversations = data.conversations;
        stats = data.stats || { count: conversations.length, size: 0 };
    }
    console.log(`📚 Loaded ${conversations.length} conversations`);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    handleMessage(request).then(sendResponse).catch(err => sendResponse({ error: err.message }));
    return true;
});

async function handleMessage(request) {
    const actions = {
        storeConversation: () => storeConversation(request.conversation),
        getConversations: () => getConversations(request.filter),
        getConversation: () => getConversation(request.id),
        findConversationByChatId: () => findConversationByChatId(request.chatId),
        searchConversations: () => searchConversations(request.query),
        exportConversations: () => exportConversations(),
        getStats: () => stats,
        mergeConversations: () => mergeConversations(request.conversationIds),
        getHierarchyStats: () => getHierarchyStats(),
        getDeltaStats: () => getDeltaStats(),
        getConversationVersion: () => getConversationVersion(request.id, request.version),
        findSimilarConversations: () => findSimilarConversations(request.conversationId, request.threshold),
        checkDuplicate: () => checkDuplicate(request.text),
        getSemanticStats: () => getSemanticStats(),
        getCausalChain: () => getCausalChain(request.messageId, request.depth),
        getCausalStats: () => getCausalStats(),
        processImage: () => processImage(request.imageUrl, request.metadata),
        getMultiModalStats: () => getMultiModalStats()
    };
    
    if (!actions[request.action]) throw new Error('Unknown action: ' + request.action);
    return await actions[request.action]();
}

async function storeConversation(conversation) {
    try {
        await loadData();
        let existingIndex = conversations.findIndex(c => c.id === conversation.id || (conversation.chatId && c.chatId === conversation.chatId));
        let oldVersion = existingIndex !== -1 ? JSON.parse(JSON.stringify(conversations[existingIndex])) : null;

        // Process images if multiModalHandler available
        if (multiModalHandler && conversation.messages) {
            console.log('🖼️ Processing images...');
            try {
                conversation.multiModalData = { images: [], stats: { totalImages: 0, processedImages: 0 } };
                for (const message of conversation.messages) {
                    if (message.images && Array.isArray(message.images)) {
                        for (const imageUrl of message.images) {
                            try {
                                const processed = await multiModalHandler.processImage(imageUrl, { messageId: message.id || message.timestamp });
                                conversation.multiModalData.images.push(processed);
                                conversation.multiModalData.stats.processedImages++;
                            } catch (e) {
                                console.error('Failed to process image:', e);
                            }
                        }
                        conversation.multiModalData.stats.totalImages += message.images.length;
                    }
                }
                console.log(`✅ Processed ${conversation.multiModalData.stats.processedImages}/${conversation.multiModalData.stats.totalImages} images`);
            } catch (e) {
                console.error('❌ Failed to process images:', e);
            }
        }

        // Build causal graph
        if (causalReasoner && conversation.messages) {
            console.log('🔗 Building causal graph...');
            try {
                conversation.causalData = { graph: { nodes: [], edges: [] }, chains: [], timestamp: Date.now() };
                let previousMessageId = null;
                for (const message of conversation.messages) {
                    if (message.content && message.content.length > 10) {
                        const result = causalReasoner.addMessage(message, previousMessageId);
                        conversation.causalData.graph.nodes.push({ id: result.nodeId, type: message.role, messageId: message.id || message.timestamp, causality: result.causality });
                        previousMessageId = result.nodeId;
                    }
                }
                const chains = causalReasoner.extractCausalChains(10);
                conversation.causalData.chains = chains.map(chain => ({ nodes: chain.nodes.map(n => n.id), confidence: chain.confidence, type: chain.type }));
                console.log(`✅ Causal: ${conversation.causalData.graph.nodes.length} nodes, ${conversation.causalData.chains.length} chains`);
            } catch (e) {
                console.error('❌ Failed causal:', e);
            }
        }

        // Generate semantic fingerprints
        if (semanticFingerprint && conversation.messages) {
            console.log('🔍 Generating fingerprints...');
            try {
                conversation.semanticData = { fingerprints: [], duplicates: [], timestamp: Date.now() };
                for (const message of conversation.messages) {
                    if (message.content && message.content.length > 20) {
                        const fingerprint = semanticFingerprint.generateFingerprint(message.content);
                        const dupCheck = semanticFingerprint.checkDuplicate(message.content);
                        conversation.semanticData.fingerprints.push({ messageId: message.id || message.timestamp, fingerprint, isDuplicate: dupCheck.isDuplicate, confidence: dupCheck.confidence });
                        if (dupCheck.isDuplicate) {
                            conversation.semanticData.duplicates.push({ messageId: message.id || message.timestamp, matches: dupCheck.matches });
                        }
                    }
                }
                const conversationText = conversation.messages.map(m => m.content).filter(c => c && c.length > 0).join(' ');
                if (conversationText.length > 50) {
                    conversation.semanticData.conversationFingerprint = semanticFingerprint.generateFingerprint(conversationText);
                    const similarConvs = await findSimilarConversationsInternal(conversation.semanticData.conversationFingerprint, 0.85);
                    conversation.semanticData.similarConversations = similarConvs.map(c => ({ id: c.id, title: c.title, similarity: c.similarity }));
                }
                console.log(`✅ Semantic: ${conversation.semanticData.fingerprints.length} fingerprints, ${conversation.semanticData.duplicates.length} duplicates`);
            } catch (e) {
                console.error('❌ Failed semantic:', e);
            }
        }

        // Build hierarchy
        if (hierarchyManager && conversation.messages) {
            console.log('📊 Building hierarchy...');
            try {
                initializeModules();
                for (const message of conversation.messages) hierarchyManager.addMessage(message);
                const hierarchyContext = hierarchyManager.getHierarchicalContext(20, 2000);
                conversation.hierarchy = { tree: hierarchyManager.serialize(), context: hierarchyContext, stats: hierarchyManager.getStats() };
                console.log(`✅ Hierarchy: ${conversation.hierarchy.stats.totalNodes} nodes`);
            } catch (e) {
                console.error('❌ Failed hierarchy:', e);
            }
        }

        // Delta compression
        if (deltaEngine && oldVersion && existingIndex !== -1) {
            console.log('🗜️ Delta...');
            try {
                const diff = deltaEngine.calculateDiff(oldVersion, conversation);
                const patch = deltaEngine.generatePatch(diff);
                if (!conversation.deltaInfo) {
                    conversation.deltaInfo = { version: 1, patches: [], baseSnapshot: oldVersion, compressionStats: { originalSize: JSON.stringify(conversation).length, compressedSize: 0, compressionRatio: 0 } };
                }
                conversation.deltaInfo.version++;
                conversation.deltaInfo.patches.push(patch);
                const fullSize = JSON.stringify(conversation).length;
                const deltaSize = JSON.stringify(patch).length;
                conversation.deltaInfo.compressionStats = { originalSize: fullSize, compressedSize: deltaSize, compressionRatio: deltaSize / fullSize, savedBytes: fullSize - deltaSize };
                console.log(`✅ Delta: ${Math.round((1 - deltaSize/fullSize) * 100)}% reduction`);
                if (conversation.deltaInfo.patches.length > deltaEngine.config.maxPatchChainLength) {
                    conversation.deltaInfo.baseSnapshot = conversation;
                    conversation.deltaInfo.patches = [];
                    conversation.deltaInfo.version = 1;
                }
            } catch (e) {
                console.error('❌ Failed delta:', e);
            }
        }

        if (existingIndex !== -1) {
            conversations[existingIndex] = conversation;
        } else {
            conversations.push(conversation);
        }
        stats.count = conversations.length;
        stats.size = JSON.stringify(conversations).length;
        await chrome.storage.local.set({ conversations, stats });
        
        return { success: true, id: conversation.id, hasHierarchy: !!conversation.hierarchy, hasDelta: !!conversation.deltaInfo, hasSemantic: !!conversation.semanticData, hasCausal: !!conversation.causalData, hasMultiModal: !!conversation.multiModalData };
    } catch (error) {
        console.error('❌ Error storing conversation:', error);
        return { success: false, error: error.message };
    }
}

async function getConversations(filter = {}) {
    await loadData();
    let result = [...conversations];
    if (filter.platform) result = result.filter(c => c.platform === filter.platform);
    if (filter.startDate || filter.endDate) {
        const start = filter.startDate ? new Date(filter.startDate).getTime() : 0;
        const end = filter.endDate ? new Date(filter.endDate).getTime() : Date.now();
        result = result.filter(c => { const timestamp = c.timestamp || 0; return timestamp >= start && timestamp <= end; });
    }
    return result;
}

async function getConversation(id) { await loadData(); return conversations.find(c => c.id === id); }
async function findConversationByChatId(chatId) { await loadData(); return conversations.find(c => c.chatId === chatId); }
async function searchConversations(query) {
    await loadData();
    const lowerQuery = query.toLowerCase();
    return conversations.filter(conv => {
        if (conv.title && conv.title.toLowerCase().includes(lowerQuery)) return true;
        if (conv.messages) return conv.messages.some(msg => msg.content && msg.content.toLowerCase().includes(lowerQuery));
        return false;
    });
}

async function exportConversations() {
    await loadData();
    return { version: '1.0', exportDate: new Date().toISOString(), count: conversations.length, conversations };
}

async function mergeConversations(conversationIds) {
    await loadData();
    if (!conversationIds || conversationIds.length < 2) throw new Error('Need at least 2 conversations');
    const conversationsToMerge = conversationIds.map(id => conversations.find(c => c.id === id)).filter(c => c);
    if (conversationsToMerge.length < 2) throw new Error('Could not find all conversations');
    conversationsToMerge.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    const merged = { id: `merged_${Date.now()}`, title: conversationsToMerge.map(c => c.title || 'Untitled').join(' + '), platform: conversationsToMerge[0].platform, timestamp: conversationsToMerge[0].timestamp, messages: [], mergedFrom: conversationIds, isMerged: true };
    conversationsToMerge.forEach(conv => { if (conv.messages) merged.messages.push(...conv.messages); });
    merged.messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    await storeConversation(merged);
    return merged;
}

function getHierarchyStats() { if (!hierarchyManager) return { error: 'Not initialized' }; return hierarchyManager.getStats(); }
function getDeltaStats() {
    if (!deltaEngine) return { error: 'Not initialized' };
    let totalOriginal = 0, totalCompressed = 0, conversationsWithDelta = 0;
    conversations.forEach(conv => { if (conv.deltaInfo) { conversationsWithDelta++; totalOriginal += conv.deltaInfo.compressionStats.originalSize; totalCompressed += conv.deltaInfo.compressionStats.compressedSize; } });
    return { conversationsWithDelta, totalOriginal, totalCompressed, overallCompressionRatio: totalOriginal > 0 ? totalCompressed / totalOriginal : 0, savedBytes: totalOriginal - totalCompressed, config: deltaEngine.config };
}

function getSemanticStats() {
    if (!semanticFingerprint) return { error: 'Not initialized' };
    let totalFingerprints = 0, totalDuplicates = 0, conversationsWithSemantic = 0;
    conversations.forEach(conv => { if (conv.semanticData) { conversationsWithSemantic++; totalFingerprints += conv.semanticData.fingerprints.length; totalDuplicates += conv.semanticData.duplicates.length; } });
    return { conversationsWithSemantic, totalFingerprints, totalDuplicates, duplicateRate: totalFingerprints > 0 ? totalDuplicates / totalFingerprints : 0, cacheSize: semanticFingerprint.fingerprintCache.size, config: semanticFingerprint.config };
}

function getCausalStats() {
    if (!causalReasoner) return { error: 'Not initialized' };
    let totalNodes = 0, totalChains = 0, conversationsWithCausal = 0;
    conversations.forEach(conv => { if (conv.causalData) { conversationsWithCausal++; totalNodes += conv.causalData.graph.nodes.length; totalChains += conv.causalData.chains.length; } });
    return { conversationsWithCausal, totalNodes, totalChains, averageChainsPerConv: conversationsWithCausal > 0 ? totalChains / conversationsWithCausal : 0, config: causalReasoner.config };
}

function getMultiModalStats() {
    if (!multiModalHandler) return { error: 'Not initialized' };
    let totalImages = 0, processedImages = 0, conversationsWithImages = 0;
    conversations.forEach(conv => { if (conv.multiModalData) { conversationsWithImages++; totalImages += conv.multiModalData.stats.totalImages; processedImages += conv.multiModalData.stats.processedImages; } });
    return { conversationsWithImages, totalImages, processedImages, config: multiModalHandler.config };
}

function getCausalChain(messageId, depth = 5) { if (!causalReasoner) return { error: 'Not initialized' }; return causalReasoner.getCausalChain(messageId, depth); }

async function getConversationVersion(id, version) {
    await loadData();
    const conversation = conversations.find(c => c.id === id);
    if (!conversation) throw new Error('Conversation not found');
    if (!conversation.deltaInfo) return conversation;
    if (!deltaEngine) throw new Error('DeltaEngine not initialized');
    if (version === undefined || version === conversation.deltaInfo.version) return conversation;
    if (version < 1 || version > conversation.deltaInfo.version) throw new Error(`Invalid version: ${version}`);
    const baseSnapshot = conversation.deltaInfo.baseSnapshot;
    const patchesToApply = conversation.deltaInfo.patches.slice(0, version);
    return deltaEngine.reconstructState(baseSnapshot, patchesToApply);
}

async function findSimilarConversations(conversationId, threshold = 0.85) {
    await loadData();
    const targetConv = conversations.find(c => c.id === conversationId);
    if (!targetConv || !targetConv.semanticData) return [];
    return await findSimilarConversationsInternal(targetConv.semanticData.conversationFingerprint, threshold);
}

async function findSimilarConversationsInternal(targetFingerprint, threshold) {
    if (!semanticFingerprint || !targetFingerprint) return [];
    const similar = [];
    for (const conv of conversations) {
        if (conv.semanticData && conv.semanticData.conversationFingerprint) {
            if (conv.semanticData.conversationFingerprint === targetFingerprint) continue;
            const similarity = semanticFingerprint.calculateSimilarity(targetFingerprint, conv.semanticData.conversationFingerprint);
            if (similarity >= threshold) similar.push({ id: conv.id, title: conv.title, platform: conv.platform, timestamp: conv.timestamp, similarity });
        }
    }
    return similar.sort((a, b) => b.similarity - a.similarity);
}

async function checkDuplicate(text) { if (!semanticFingerprint) return { error: 'Not initialized' }; return semanticFingerprint.checkDuplicate(text); }
async function processImage(imageUrl, metadata) { if (!multiModalHandler) return { error: 'Not initialized' }; return await multiModalHandler.processImage(imageUrl, metadata); }

console.log('✅ VOID V3-Step5 background script loaded');
