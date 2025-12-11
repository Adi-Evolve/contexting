// VOID Extension - Background Service Worker V3 (Incremental Build)
// Starting with V2 functionality, will add modules step by step

console.log('🧠 VOID Background V3: Starting (Clean Base - No Modules Yet)...');

// Storage (exactly like v2)
let conversations = [];
let stats = { count: 0, size: 0 };

// Initialize
chrome.runtime.onInstalled.addListener(async () => {
    console.log('🧠 VOID V3: Extension installed');
    await loadData();
});

// Load data from storage
async function loadData() {
    const data = await chrome.storage.local.get(['conversations', 'stats']);
    if (data.conversations) {
        conversations = data.conversations;
        stats = data.stats || { count: conversations.length, size: 0 };
    }
    console.log(`📚 Loaded ${conversations.length} conversations`);
}

// Message handler (exactly like v2)
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
        
        default:
            throw new Error('Unknown action: ' + request.action);
    }
}

// Store conversation (exactly like v2)
async function storeConversation(conversation) {
    try {
        await loadData();
        
        let existingIndex = conversations.findIndex(c => c.id === conversation.id);
        
        if (existingIndex < 0 && conversation.chatId) {
            existingIndex = conversations.findIndex(c => c.chatId === conversation.chatId);
        }
        
        if (existingIndex >= 0) {
            const existing = conversations[existingIndex];
            conversation.startTime = existing.startTime;
            conversations[existingIndex] = conversation;
            console.log(`🔄 Updated conversation: ${conversation.id} (chatId: ${conversation.chatId})`);
        } else {
            conversations.push(conversation);
            console.log(`✅ Stored new conversation: ${conversation.id} (chatId: ${conversation.chatId})`);
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

// Get conversations with optional filter
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
            // Search in title
            if (conv.title && conv.title.toLowerCase().includes(searchLower)) {
                return true;
            }
            
            // Search in messages
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
        
        // Generate summary for merged conversation
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

console.log('✅ VOID Background V3 (Clean Base) loaded - Ready to test!');
