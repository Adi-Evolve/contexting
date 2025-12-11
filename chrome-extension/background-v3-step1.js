// VOID Extension - Background V3 - Step 1: Add Hierarchy Manager
// Base: v3-clean + HierarchyManager module

console.log('🧠 VOID Background V3-Step1: Starting (Base + HierarchyManager)...');

// Import ONLY HierarchyManager
try {
    importScripts('hierarchy-manager.js');
    console.log('✅ HierarchyManager loaded');
} catch (e) {
    console.error('❌ Failed to load HierarchyManager:', e);
}

// Storage (exactly like v2)
let conversations = [];
let stats = { count: 0, size: 0 };

// Hierarchy Manager instance
let hierarchyManager = null;

// Initialize
chrome.runtime.onInstalled.addListener(async () => {
    console.log('🧠 VOID V3-Step1: Extension installed');
    await loadData();
    initializeHierarchyManager();
});

// Initialize Hierarchy Manager
function initializeHierarchyManager() {
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
}

// Load data from storage
async function loadData() {
    const data = await chrome.storage.local.get(['conversations', 'stats']);
    if (data.conversations) {
        conversations = data.conversations;
        stats = data.stats || { count: conversations.length, size: 0 };
    }
    console.log(`📚 Loaded ${conversations.length} conversations`);
}

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    handleMessage(request).then(sendResponse).catch(err => {
        console.error('Error:', err);
        sendResponse({ error: err.message });
    });
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
        
        default:
            throw new Error('Unknown action: ' + request.action);
    }
}

// Store conversation WITH hierarchical organization
async function storeConversation(conversation) {
    try {
        await loadData();
        
        // 🆕 Build hierarchy if HierarchyManager is available
        if (hierarchyManager && conversation.messages) {
            console.log('📊 Building hierarchy for conversation...');
            try {
                // Reset hierarchy for new conversation
                initializeHierarchyManager();
                
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
                
                console.log('✅ Hierarchy built:', conversation.hierarchy.stats);
            } catch (e) {
                console.error('⚠️ Hierarchy building failed:', e);
                conversation.hierarchy = null;
            }
        }
        
        let existingIndex = conversations.findIndex(c => c.id === conversation.id);
        
        if (existingIndex < 0 && conversation.chatId) {
            existingIndex = conversations.findIndex(c => c.chatId === conversation.chatId);
        }
        
        if (existingIndex >= 0) {
            const existing = conversations[existingIndex];
            conversation.startTime = existing.startTime;
            conversations[existingIndex] = conversation;
            console.log(`🔄 Updated conversation: ${conversation.id}`);
        } else {
            conversations.push(conversation);
            console.log(`✅ Stored new conversation: ${conversation.id}`);
        }
        
        conversations.sort((a, b) => b.startTime - a.startTime);
        
        stats.count = conversations.length;
        stats.size = JSON.stringify(conversations).length;
        
        if (conversations.length > 100) {
            conversations = conversations.slice(0, 100);
            stats.count = conversations.length;
        }
        
        await chrome.storage.local.set({ conversations, stats });
        
        return { success: true, id: conversation.id };
    } catch (error) {
        console.error('Error storing conversation:', error);
        return { success: false, error: error.message };
    }
}

// Get hierarchy stats
function getHierarchyStats() {
    if (!hierarchyManager) {
        return { success: false, error: 'HierarchyManager not available' };
    }
    
    try {
        return {
            success: true,
            stats: hierarchyManager.getStats()
        };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

// Get conversations (unchanged from v2)
async function getConversations(filter = 'all') {
    try {
        await loadData();
        
        let filtered = conversations;
        
        if (filter !== 'all') {
            const now = Date.now();
            const day = 24 * 60 * 60 * 1000;
            
            const filters = {
                'today': now - day,
                'week': now - (7 * day),
                'month': now - (30 * day)
            };
            
            if (filters[filter]) {
                filtered = conversations.filter(c => c.startTime > filters[filter]);
            }
        }
        
        return { 
            success: true, 
            conversations: filtered,
            stats: stats
        };
    } catch (error) {
        console.error('Error getting conversations:', error);
        return { success: false, error: error.message };
    }
}

// Get single conversation
async function getConversation(id) {
    try {
        await loadData();
        const conversation = conversations.find(c => c.id === id);
        
        if (!conversation) {
            return { success: false, error: 'Conversation not found' };
        }
        
        return { success: true, conversation };
    } catch (error) {
        console.error('Error getting conversation:', error);
        return { success: false, error: error.message };
    }
}

// Find conversation by chat ID
async function findConversationByChatId(chatId) {
    try {
        await loadData();
        const conversation = conversations.find(c => c.chatId === chatId);
        return { success: true, conversation: conversation || null };
    } catch (error) {
        console.error('Error finding conversation:', error);
        return { success: false, error: error.message };
    }
}

// Search conversations
async function searchConversations(query) {
    try {
        await loadData();
        
        const searchLower = query.toLowerCase();
        const results = conversations.filter(conv => {
            if (conv.title && conv.title.toLowerCase().includes(searchLower)) {
                return true;
            }
            
            if (conv.messages) {
                return conv.messages.some(msg => 
                    msg.content.toLowerCase().includes(searchLower)
                );
            }
            
            return false;
        });
        
        return { 
            success: true, 
            conversations: results,
            count: results.length
        };
    } catch (error) {
        console.error('Error searching conversations:', error);
        return { success: false, error: error.message };
    }
}

// Export conversations
async function exportConversations() {
    try {
        await loadData();
        return { 
            success: true, 
            data: {
                conversations: conversations,
                stats: stats,
                exportedAt: Date.now()
            }
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Merge conversations
async function mergeConversations(conversationIds) {
    try {
        await loadData();
        
        const toMerge = conversations.filter(c => conversationIds.includes(c.id));
        
        if (toMerge.length < 2) {
            return { success: false, error: 'Need at least 2 conversations to merge' };
        }
        
        toMerge.sort((a, b) => a.startTime - b.startTime);
        
        const merged = {
            id: `merged_${Date.now()}`,
            chatId: null,
            title: `Merged: ${toMerge.map(c => c.title || 'Untitled').join(' + ')}`,
            messages: [],
            startTime: toMerge[0].startTime,
            endTime: toMerge[toMerge.length - 1].endTime || Date.now(),
            messageCount: 0,
            url: 'merged',
            platform: toMerge[0].platform,
            linked: conversationIds,
            firstUserMessage: toMerge[0].firstUserMessage
        };
        
        for (const conv of toMerge) {
            if (conv.messages && conv.messages.length > 0) {
                merged.messages.push(...conv.messages);
            }
        }
        
        merged.messages.sort((a, b) => a.timestamp - b.timestamp);
        
        merged.messages.forEach((msg, index) => {
            msg.index = index;
        });
        
        merged.messageCount = merged.messages.length;
        
        merged.summary = {
            fullContext: merged.messages.map(msg => ({
                role: msg.role,
                content: msg.content
            })),
            narrative: merged.messages.map(msg => 
                `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`
            ).join('\n\n')
        };
        
        merged.compressed = JSON.stringify(merged.messages);
        merged.tokens = JSON.stringify(merged.summary.fullContext).length / 4;
        
        conversations = conversations.filter(c => !conversationIds.includes(c.id));
        conversations.push(merged);
        conversations.sort((a, b) => b.startTime - a.startTime);
        
        stats.count = conversations.length;
        stats.size = JSON.stringify(conversations).length;
        
        await chrome.storage.local.set({ conversations, stats });
        
        console.log(`✅ Merged ${toMerge.length} conversations into: ${merged.id}`);
        
        return { success: true, merged: merged };
    } catch (error) {
        console.error('Error merging conversations:', error);
        return { success: false, error: error.message };
    }
}

console.log('✅ VOID Background V3-Step1 (Base + HierarchyManager) loaded!');
