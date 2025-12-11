// VOID Extension - Background V3 - Step 6: Add LLM Query Engine + Context Assembler V2
// Base: v3-step5 + LLMQueryEngine + ContextAssemblerV2 (PRODUCTION READY)

console.log('🧠 VOID Background V3-Step6: Starting (Background Modules)...');

// Import background-compatible modules only
// NOTE: context-extractor-v2.js and conversation-tracker.js are content scripts (use window/document)
const modules = [
    'hierarchy-manager.js', 
    'delta-engine.js', 
    'semantic-fingerprint-v2.js', 
    'causal-reasoner.js', 
    'multimodal-handler.js', 
    'llm-query-engine.js',
    'context-assembler-v2.js'  // Resume Chat feature
];
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
let hierarchyManager, deltaEngine, semanticFingerprint, causalReasoner, multiModalHandler, llmQueryEngine, contextAssembler;

chrome.runtime.onInstalled.addListener(async () => {
    console.log('🧠 VOID V3-Step6: Extension installed - Background modules active');
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

    try {
        llmQueryEngine = new LLMQueryEngine(hierarchyManager, causalReasoner, semanticFingerprint, multiModalHandler, { maxResults: 10, defaultTokenLimit: 4000, minRelevance: 0.3, useSemanticSearch: true, useCausalReasoning: true });
        console.log('✅ LLMQueryEngine initialized');
    } catch (e) { console.error('❌ LLMQueryEngine:', e); llmQueryEngine = null; }

    try {
        contextAssembler = new ContextAssemblerV2({
            tokenLimits: {
                layer0: 200,  // Role & Persona
                layer1: 600,  // Canonical State
                layer2: 500,  // Recent Context
                layer3: 300,  // Relevant History
                total: 1600   // Maximum total
            },
            logging: {
                level: 1,  // INFO level
                enablePerformanceMetrics: true
            }
        });
        console.log('✅ ContextAssemblerV2 initialized');
    } catch (e) { console.error('❌ ContextAssemblerV2:', e); contextAssembler = null; }
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
    // Ensure modules are initialized (service worker may have restarted)
    if (!contextAssembler || !hierarchyManager) {
        console.log('🔄 Modules not initialized, reinitializing...');
        initializeModules();
        // Give modules a moment to initialize
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const actions = {
        storeConversation: () => storeConversation(request.conversation),
        getConversations: () => getConversations(request.filter),
        getConversation: () => getConversation(request.id),
        deleteConversation: () => deleteConversation(request.id),
        findConversationByChatId: () => findConversationByChatId(request.chatId),
        searchConversations: () => searchConversations(request.query),
        exportConversations: () => exportConversations(request.format),
        getStats: () => getPopupStats(),
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
        getMultiModalStats: () => getMultiModalStats(),
        queryNL: () => queryNaturalLanguage(request.query, request.options),
        getQueryStats: () => getQueryStats(),
        // NEW: Context Assembler V2 endpoints
        assembleContext: () => assembleContextForNewChat(request.conversationId, request.userQuery),
        exportContextForModel: () => exportContextForModel(request.conversationId, request.model, request.userQuery),
        getAssemblerStats: () => getAssemblerStats(),
        // Popup-specific actions
        openSidebar: () => openSidebar(request.conversationId),
        openMergeMode: () => openMergeMode(),
        downloadArchive: () => downloadArchive(),
        openSettings: () => openSettings()
    };
    
    if (!actions[request.action]) throw new Error('Unknown action: ' + request.action);
    return await actions[request.action]();
}

async function storeConversation(conversation) {
    try {
        await loadData();
        let existingIndex = conversations.findIndex(c => c.id === conversation.id || (conversation.chatId && c.chatId === conversation.chatId));
        let oldVersion = existingIndex !== -1 ? JSON.parse(JSON.stringify(conversations[existingIndex])) : null;

        // Process images
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
                            } catch (e) { console.error('Failed to process image:', e); }
                        }
                        conversation.multiModalData.stats.totalImages += message.images.length;
                    }
                }
                console.log(`✅ Images: ${conversation.multiModalData.stats.processedImages}/${conversation.multiModalData.stats.totalImages}`);
            } catch (e) { console.error('❌ Images failed:', e); }
        }

        // Causal graph
        if (causalReasoner && conversation.messages) {
            console.log('🔗 Causal...');
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
                // Extract causal chain from last message
                const lastNodeId = previousMessageId;
                if (lastNodeId) {
                    const chain = causalReasoner.getCausalChain(lastNodeId, 10);
                    conversation.causalData.chains = [{ nodes: chain.map(n => n.id), length: chain.length }];
                }
                console.log(`✅ Causal: ${conversation.causalData.graph.nodes.length} nodes`);
            } catch (e) { console.error('❌ Causal failed:', e); }
        }

        // Semantic fingerprints
        if (semanticFingerprint && conversation.messages) {
            console.log('🔍 Semantic...');
            try {
                conversation.semanticData = { fingerprints: [], duplicates: [], timestamp: Date.now() };
                for (const message of conversation.messages) {
                    if (message.content && message.content.length > 20) {
                        const fingerprint = semanticFingerprint.generateFingerprint(message.content);
                        const dupCheck = semanticFingerprint.checkDuplicate(fingerprint);
                        conversation.semanticData.fingerprints.push({ messageId: message.id || message.timestamp, fingerprint, isDuplicate: dupCheck.isDuplicate, confidence: dupCheck.confidence });
                        if (dupCheck.isDuplicate) conversation.semanticData.duplicates.push({ messageId: message.id || message.timestamp, matches: dupCheck.matches });
                    }
                }
                const conversationText = conversation.messages.map(m => m.content).filter(c => c && c.length > 0).join(' ');
                if (conversationText.length > 50) {
                    conversation.semanticData.conversationFingerprint = semanticFingerprint.generateFingerprint(conversationText);
                    const similarConvs = await findSimilarConversationsInternal(conversation.semanticData.conversationFingerprint, 0.85);
                    conversation.semanticData.similarConversations = similarConvs.map(c => ({ id: c.id, title: c.title, similarity: c.similarity }));
                }
                console.log(`✅ Semantic: ${conversation.semanticData.fingerprints.length} fingerprints`);
            } catch (e) { console.error('❌ Semantic failed:', e); }
        }

        // Hierarchy
        if (hierarchyManager && conversation.messages) {
            console.log('📊 Hierarchy...');
            try {
                initializeModules();
                for (const message of conversation.messages) hierarchyManager.addMessage(message);
                const hierarchyContext = hierarchyManager.getHierarchicalContext(20, 2000);
                conversation.hierarchy = { tree: hierarchyManager.serialize(), context: hierarchyContext, stats: hierarchyManager.getStats() };
                console.log(`✅ Hierarchy: ${conversation.hierarchy.stats.totalNodes} nodes`);
            } catch (e) { console.error('❌ Hierarchy failed:', e); }
        }

        // Delta compression
        if (deltaEngine && oldVersion && existingIndex !== -1) {
            console.log('🗜️ Delta...');
            try {
                const diff = deltaEngine.calculateDiff(oldVersion, conversation);
                const patch = deltaEngine.generatePatch(diff);
                if (!conversation.deltaInfo) conversation.deltaInfo = { version: 1, patches: [], baseSnapshot: oldVersion, compressionStats: { originalSize: JSON.stringify(conversation).length, compressedSize: 0, compressionRatio: 0 } };
                conversation.deltaInfo.version++;
                conversation.deltaInfo.patches.push(patch);
                const fullSize = JSON.stringify(conversation).length;
                const deltaSize = JSON.stringify(patch).length;
                conversation.deltaInfo.compressionStats = { originalSize: fullSize, compressedSize: deltaSize, compressionRatio: deltaSize / fullSize, savedBytes: fullSize - deltaSize };
                console.log(`✅ Delta: ${Math.round((1 - deltaSize/fullSize) * 100)}%`);
                if (conversation.deltaInfo.patches.length > deltaEngine.config.maxPatchChainLength) {
                    conversation.deltaInfo.baseSnapshot = conversation;
                    conversation.deltaInfo.patches = [];
                    conversation.deltaInfo.version = 1;
                }
            } catch (e) { console.error('❌ Delta failed:', e); }
        }

        if (existingIndex !== -1) conversations[existingIndex] = conversation;
        else conversations.push(conversation);
        
        stats.count = conversations.length;
        stats.size = JSON.stringify(conversations).length;
        await chrome.storage.local.set({ conversations, stats });
        
        return { success: true, id: conversation.id, hasHierarchy: !!conversation.hierarchy, hasDelta: !!conversation.deltaInfo, hasSemantic: !!conversation.semanticData, hasCausal: !!conversation.causalData, hasMultiModal: !!conversation.multiModalData, modulesActive: 6 };
    } catch (error) {
        console.error('❌ Error storing:', error);
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
    return { conversations: result, stats };
}

async function getConversation(id) { await loadData(); return conversations.find(c => c.id === id); }
async function deleteConversation(id) {
    await loadData();
    const index = conversations.findIndex(c => c.id === id);
    if (index === -1) return { success: false, error: 'Conversation not found' };
    
    conversations.splice(index, 1);
    stats.count = conversations.length;
    stats.size = JSON.stringify(conversations).length;
    await chrome.storage.local.set({ conversations, stats });
    
    console.log(`🗑️ Deleted conversation: ${id}`);
    return { success: true };
}
async function findConversationByChatId(chatId) { await loadData(); return conversations.find(c => c.chatId === chatId); }
async function searchConversations(query) {
    await loadData();
    const lowerQuery = query.toLowerCase();
    const filtered = conversations.filter(conv => {
        if (conv.title && conv.title.toLowerCase().includes(lowerQuery)) return true;
        if (conv.messages) return conv.messages.some(msg => msg.content && msg.content.toLowerCase().includes(lowerQuery));
        return false;
    });
    return { conversations: filtered, stats: { count: filtered.length, size: JSON.stringify(filtered).length } };
}

async function exportConversations(format = 'json') {
    await loadData();
    
    const timestamp = Date.now();
    
    switch (format) {
        case 'markdown': {
            let markdown = `# MemoryForge Conversations Export\n\n`;
            markdown += `**Export Date:** ${new Date().toISOString()}\n`;
            markdown += `**Total Conversations:** ${conversations.length}\n\n`;
            markdown += `---\n\n`;
            
            conversations.forEach((conv, idx) => {
                markdown += `## ${idx + 1}. ${conv.title || 'Untitled'}\n\n`;
                markdown += `- **Platform:** ${conv.platform || 'Unknown'}\n`;
                markdown += `- **Date:** ${new Date(conv.timestamp || conv.startTime).toLocaleString()}\n`;
                markdown += `- **Messages:** ${conv.messages?.length || 0}\n\n`;
                
                if (conv.messages) {
                    conv.messages.forEach((msg, msgIdx) => {
                        markdown += `### Message ${msgIdx + 1} (${msg.role})\n\n`;
                        markdown += `${msg.content}\n\n`;
                    });
                }
                markdown += `---\n\n`;
            });
            
            return {
                success: true,
                data: markdown,
                filename: `memoryforge-export-${timestamp}.md`,
                mimeType: 'text/markdown'
            };
        }
        
        case 'txt': {
            let text = `MEMORYFORGE CONVERSATIONS EXPORT\n`;
            text += `Export Date: ${new Date().toISOString()}\n`;
            text += `Total Conversations: ${conversations.length}\n\n`;
            text += `${'='.repeat(80)}\n\n`;
            
            conversations.forEach((conv, idx) => {
                text += `[${idx + 1}] ${conv.title || 'Untitled'}\n`;
                text += `Platform: ${conv.platform || 'Unknown'}\n`;
                text += `Date: ${new Date(conv.timestamp || conv.startTime).toLocaleString()}\n`;
                text += `Messages: ${conv.messages?.length || 0}\n\n`;
                
                if (conv.messages) {
                    conv.messages.forEach((msg, msgIdx) => {
                        text += `  [${msgIdx + 1}] ${msg.role.toUpperCase()}:\n`;
                        text += `  ${msg.content}\n\n`;
                    });
                }
                text += `${'-'.repeat(80)}\n\n`;
            });
            
            return {
                success: true,
                data: text,
                filename: `memoryforge-export-${timestamp}.txt`,
                mimeType: 'text/plain'
            };
        }
        
        case 'html': {
            let html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>MemoryForge Export</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        .conversation { border: 1px solid #ddd; margin: 20px 0; padding: 15px; border-radius: 8px; }
        .message { margin: 10px 0; padding: 10px; border-left: 3px solid #007bff; }
        .user { border-left-color: #28a745; }
        .assistant { border-left-color: #007bff; }
        .system { border-left-color: #ffc107; }
        .meta { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <h1>🧠 MemoryForge Conversations</h1>
    <p class="meta">Export Date: ${new Date().toISOString()}</p>
    <p class="meta">Total Conversations: ${conversations.length}</p>
`;
            
            conversations.forEach((conv, idx) => {
                html += `    <div class="conversation">
        <h2>${idx + 1}. ${conv.title || 'Untitled'}</h2>
        <p class="meta">Platform: ${conv.platform || 'Unknown'} | Date: ${new Date(conv.timestamp || conv.startTime).toLocaleString()} | Messages: ${conv.messages?.length || 0}</p>
`;
                
                if (conv.messages) {
                    conv.messages.forEach((msg) => {
                        html += `        <div class="message ${msg.role}">
            <strong>${msg.role.toUpperCase()}:</strong><br>
            ${msg.content.replace(/\n/g, '<br>')}
        </div>
`;
                    });
                }
                
                html += `    </div>\n`;
            });
            
            html += `</body>
</html>`;
            
            return {
                success: true,
                data: html,
                filename: `memoryforge-export-${timestamp}.html`,
                mimeType: 'text/html'
            };
        }
        
        case 'json':
        default:
            return {
                success: true,
                data: JSON.stringify({ version: '1.0', exportDate: new Date().toISOString(), count: conversations.length, conversations }, null, 2),
                filename: `memoryforge-export-${timestamp}.json`,
                mimeType: 'application/json'
            };
    }
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
    return { conversationsWithDelta, totalOriginal, totalCompressed, overallCompressionRatio: totalOriginal > 0 ? totalCompressed / totalOriginal : 0, savedBytes: totalOriginal - totalCompressed };
}

function getSemanticStats() {
    if (!semanticFingerprint) return { error: 'Not initialized' };
    let totalFingerprints = 0, totalDuplicates = 0, conversationsWithSemantic = 0;
    conversations.forEach(conv => { if (conv.semanticData) { conversationsWithSemantic++; totalFingerprints += conv.semanticData.fingerprints.length; totalDuplicates += conv.semanticData.duplicates.length; } });
    return { conversationsWithSemantic, totalFingerprints, totalDuplicates, duplicateRate: totalFingerprints > 0 ? totalDuplicates / totalFingerprints : 0 };
}

function getCausalStats() {
    if (!causalReasoner) return { error: 'Not initialized' };
    let totalNodes = 0, totalChains = 0, conversationsWithCausal = 0;
    conversations.forEach(conv => { if (conv.causalData) { conversationsWithCausal++; totalNodes += conv.causalData.graph.nodes.length; totalChains += conv.causalData.chains.length; } });
    return { conversationsWithCausal, totalNodes, totalChains };
}

function getMultiModalStats() {
    if (!multiModalHandler) return { error: 'Not initialized' };
    let totalImages = 0, processedImages = 0, conversationsWithImages = 0;
    conversations.forEach(conv => { if (conv.multiModalData) { conversationsWithImages++; totalImages += conv.multiModalData.stats.totalImages; processedImages += conv.multiModalData.stats.processedImages; } });
    return { conversationsWithImages, totalImages, processedImages };
}

function getQueryStats() {
    if (!llmQueryEngine) return { error: 'Not initialized' };
    return { queryHistoryLength: llmQueryEngine.queryHistory.length, config: llmQueryEngine.config };
}

function getCausalChain(messageId, depth = 5) { if (!causalReasoner) return { error: 'Not initialized' }; return causalReasoner.getCausalChain(messageId, depth); }

async function queryNaturalLanguage(query, options = {}) {
    if (!llmQueryEngine) return { error: 'LLMQueryEngine not initialized' };
    await loadData();
    return await llmQueryEngine.query(query, conversations, options);
}

async function getConversationVersion(id, version) {
    await loadData();
    const conversation = conversations.find(c => c.id === id);
    if (!conversation) throw new Error('Conversation not found');
    if (!conversation.deltaInfo) return conversation;
    if (!deltaEngine) throw new Error('DeltaEngine not initialized');
    if (version === undefined || version === conversation.deltaInfo.version) return conversation;
    if (version < 1 || version > conversation.deltaInfo.version) throw new Error(`Invalid version`);
    return deltaEngine.reconstructState(conversation.deltaInfo.baseSnapshot, conversation.deltaInfo.patches.slice(0, version));
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
        if (conv.semanticData && conv.semanticData.conversationFingerprint && conv.semanticData.conversationFingerprint !== targetFingerprint) {
            const similarity = semanticFingerprint.calculateSimilarity(targetFingerprint, conv.semanticData.conversationFingerprint);
            if (similarity >= threshold) similar.push({ id: conv.id, title: conv.title, platform: conv.platform, timestamp: conv.timestamp, similarity });
        }
    }
    return similar.sort((a, b) => b.similarity - a.similarity);
}

async function checkDuplicate(text) { 
    if (!semanticFingerprint || !text) return { isDuplicate: false }; 
    const fingerprint = semanticFingerprint.generateFingerprint(text); 
    return semanticFingerprint.checkDuplicate(fingerprint); 
}

async function processImage(imageUrl, metadata) { 
    if (!multiModalHandler) return { error: 'Not initialized' }; 
    return await multiModalHandler.processImage(imageUrl, metadata); 
}

// ============================================================================
// CONTEXT ASSEMBLER V2 ENDPOINTS
// ============================================================================

/**
 * Assemble context for resuming in a new chat
 * @param {string} conversationId - ID of conversation to assemble context from
 * @param {string|null} userQuery - Optional user query for relevance filtering
 * @returns {Promise<Object>} Context package with prompt, tokens, layers
 */
async function assembleContextForNewChat(conversationId, userQuery = null) {
    if (!contextAssembler) {
        return { error: 'ContextAssemblerV2 not initialized' };
    }
    
    try {
        console.log(`🔄 Assembling context for conversation: ${conversationId}`);
        const startTime = performance.now();
        
        const result = await contextAssembler.assembleForNewChat(conversationId, userQuery);
        
        const duration = performance.now() - startTime;
        console.log(`✅ Context assembled in ${duration.toFixed(2)}ms`);
        console.log(`📊 Token estimate: ${result.tokenEstimate} tokens`);
        console.log(`⚠️ Contradictions: ${result.contradictions.length}`);
        
        return {
            success: true,
            ...result,
            performance: {
                assemblyTime: duration,
                timestamp: Date.now()
            }
        };
        
    } catch (error) {
        console.error('❌ Context assembly failed:', error);
        return {
            success: false,
            error: error.message || 'Failed to assemble context',
            errorType: error.type || 'Unknown',
            context: error.context || {}
        };
    }
}

/**
 * Export context in model-specific format
 * @param {string} conversationId - ID of conversation
 * @param {string} model - Model name (chatgpt, claude, gemini, llama)
 * @param {string|null} userQuery - Optional user query
 * @returns {Promise<Object>} Formatted context for specific model
 */
async function exportContextForModel(conversationId, model = 'chatgpt', userQuery = null) {
    if (!contextAssembler) {
        return { error: 'ContextAssemblerV2 not initialized' };
    }
    
    try {
        console.log(`📤 Exporting context for model: ${model}`);
        
        // First assemble the context
        const context = await contextAssembler.assembleForNewChat(conversationId, userQuery);
        
        // Then format for specific model
        const formatted = contextAssembler.exportForModel(context, model);
        
        console.log(`✅ Context exported for ${model}`);
        
        return {
            success: true,
            model: model,
            formatted: formatted,
            tokenEstimate: context.tokenEstimate,
            contradictions: context.contradictions
        };
        
    } catch (error) {
        console.error('❌ Context export failed:', error);
        return {
            success: false,
            error: error.message || 'Failed to export context',
            errorType: error.type || 'Unknown'
        };
    }
}

/**
 * Get ContextAssembler statistics
 * @returns {Object} Assembler stats and cache info
 */
function getAssemblerStats() {
    if (!contextAssembler) {
        return { error: 'ContextAssemblerV2 not initialized' };
    }
    
    const cacheStats = contextAssembler.getCacheStats();
    
    return {
        initialized: true,
        config: contextAssembler.config,
        cacheStats: cacheStats,
        isProcessing: contextAssembler.isProcessing,
        queueLength: contextAssembler.requestQueue.length
    };
}

// ============================================================================
// POPUP HELPER FUNCTIONS
// ============================================================================

/**
 * Get comprehensive stats for popup
 */
async function getPopupStats() {
    await loadData();
    
    const totalMessages = conversations.reduce((sum, conv) => sum + (conv.messages?.length || 0), 0);
    const estimatedSize = JSON.stringify(conversations).length;
    const storageLimit = 5242880; // 5MB for chrome.storage.local
    const percentUsed = Math.round((estimatedSize / storageLimit) * 100);
    
    return {
        success: true,
        stats: {
            activeCount: conversations.length,
            totalMessages: totalMessages,
            estimatedSize: estimatedSize,
            percentUsed: percentUsed,
            limit: 1000
        }
    };
}

/**
 * Open sidebar in active tab
 */
async function openSidebar(conversationId = null) {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]) {
            await chrome.tabs.sendMessage(tabs[0].id, { 
                action: 'openSidebar',
                conversationId: conversationId 
            });
            return { success: true };
        }
        return { success: false, error: 'No active tab' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Open merge mode in sidebar
 */
async function openMergeMode() {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]) {
            await chrome.tabs.sendMessage(tabs[0].id, { action: 'openMergeMode' });
            return { success: true };
        }
        return { success: false, error: 'No active tab' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Download archived conversations
 */
async function downloadArchive() {
    await loadData();
    
    const archived = conversations.filter(c => c.archived);
    
    if (archived.length === 0) {
        return { success: true, count: 0 };
    }
    
    const data = JSON.stringify(archived, null, 2);
    const filename = `memoryforge-archive-${Date.now()}.json`;
    
    return {
        success: true,
        count: archived.length,
        data: data,
        filename: filename,
        mimeType: 'application/json'
    };
}

/**
 * Open settings page
 */
async function openSettings() {
    // For now, just open sidebar in settings mode
    return await openSidebar();
}

console.log('✅ VOID V3-Step6: ALL 7 MODULES LOADED - Ready for production!');
