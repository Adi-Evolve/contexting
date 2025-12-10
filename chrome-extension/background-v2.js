// MemoryForge Background Service Worker (Conversation Mode)
// Handles full conversation storage and retrieval

console.log('🧠 MemoryForge Background: Starting (Conversation Mode)...');

// Storage
let conversations = [];
let stats = { count: 0, size: 0 };

// Initialize
chrome.runtime.onInstalled.addListener(async () => {
    console.log('🧠 MemoryForge: Extension installed');
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
        
        default:
            throw new Error('Unknown action: ' + request.action);
    }
}

// Store conversation
async function storeConversation(conversation) {
    try {
        await loadData(); // Ensure we have latest data
        
        // Check for existing conversation by:
        // 1. Same ID (exact match)
        // 2. Same chatId (URL-based deduplication)
        let existingIndex = conversations.findIndex(c => c.id === conversation.id);
        
        if (existingIndex < 0 && conversation.chatId) {
            // No ID match, try chatId (to prevent duplicates for same URL)
            existingIndex = conversations.findIndex(c => c.chatId === conversation.chatId);
        }
        
        if (existingIndex >= 0) {
            // Update existing conversation (merge messages if needed)
            const existing = conversations[existingIndex];
            
            // Keep existing start time, update end time
            conversation.startTime = existing.startTime;
            
            // Replace the conversation
            conversations[existingIndex] = conversation;
            console.log(`🔄 Updated conversation: ${conversation.id} (chatId: ${conversation.chatId})`);
        } else {
            // Add new conversation
            conversations.push(conversation);
            console.log(`✅ Stored new conversation: ${conversation.id} (chatId: ${conversation.chatId})`);
        }
        
        // Sort by most recent first
        conversations.sort((a, b) => b.startTime - a.startTime);
        
        // Update stats
        stats.count = conversations.length;
        stats.size = JSON.stringify(conversations).length;
        
        // Keep only last 100 conversations (storage limit)
        if (conversations.length > 100) {
            conversations = conversations.slice(-100);
            stats.count = conversations.length;
        }
        
        // Save to storage
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
        await loadData(); // Refresh from storage
        
        let filtered = [...conversations];
        
        // Apply time-based filters
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        
        switch (filter) {
            case 'today':
                filtered = filtered.filter(c => now - c.startTime < oneDay);
                break;
            case 'week':
                filtered = filtered.filter(c => now - c.startTime < 7 * oneDay);
                break;
            case 'month':
                filtered = filtered.filter(c => now - c.startTime < 30 * oneDay);
                break;
        }
        
        // Sort by most recent first
        filtered.sort((a, b) => b.startTime - a.startTime);
        
        return {
            conversations: filtered,
            stats: stats
        };
    } catch (error) {
        console.error('Error getting conversations:', error);
        return { conversations: [], stats: stats };
    }
}

// Get single conversation by ID
async function getConversation(id) {
    try {
        await loadData();
        const conversation = conversations.find(c => c.id === id);
        if (!conversation) {
            throw new Error('Conversation not found');
        }
        return { conversation: conversation };
    } catch (error) {
        console.error('Error getting conversation:', error);
        return { error: error.message };
    }
}

// Find conversation by chat ID (URL-based lookup)
async function findConversationByChatId(chatId) {
    try {
        await loadData();
        const conversation = conversations.find(c => c.chatId === chatId);
        if (!conversation) {
            return { conversation: null };
        }
        return { conversation: conversation };
    } catch (error) {
        console.error('Error finding conversation by chat ID:', error);
        return { conversation: null };
    }
}

// Search conversations
async function searchConversations(query) {
    try {
        await loadData();
        
        const lowerQuery = query.toLowerCase();
        
        // Search in title, messages content, and topics
        const results = conversations.filter(conv => {
            // Search in title
            if (conv.title && conv.title.toLowerCase().includes(lowerQuery)) {
                return true;
            }
            
            // Search in message content
            const hasMatch = conv.messages.some(msg => 
                msg.content.toLowerCase().includes(lowerQuery)
            );
            if (hasMatch) return true;
            
            // Search in semantic topics
            if (conv.summary && conv.summary.semantic && conv.summary.semantic.topics) {
                return conv.summary.semantic.topics.some(topic => 
                    topic.includes(lowerQuery)
                );
            }
            
            return false;
        });
        
        // Sort by relevance (simple: most recent matches first)
        results.sort((a, b) => b.startTime - a.startTime);
        
        return { conversations: results };
    } catch (error) {
        console.error('Error searching conversations:', error);
        return { conversations: [] };
    }
}

// Export all conversations
async function exportConversations() {
    try {
        await loadData();
        
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            conversationCount: conversations.length,
            conversations: conversations.map(conv => ({
                ...conv,
                // Include multiple formats for flexibility
                formats: {
                    openai: conv.summary.fullContext,        // OpenAI API format
                    narrative: conv.summary.narrative,        // Plain text
                    xml: conv.summary.xml,                   // Claude XML format
                    contextPrompt: conv.summary.contextPrompt // Ready-to-use prompt
                }
            }))
        };
        
        const data = JSON.stringify(exportData, null, 2);
        
        return {
            success: true,
            data: data
        };
    } catch (error) {
        console.error('Error exporting conversations:', error);
        return { success: false, error: error.message };
    }
}

console.log('✅ MemoryForge Background: Ready (Conversation Mode)');
