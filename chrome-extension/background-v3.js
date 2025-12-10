// Remember Background Service Worker v3
// Handles storage management, error handling, export formats, and keyboard shortcuts

console.log('🧠 Remember Background: Starting v3...');

// Import helpers (will be available as globals in content scripts)
let storageManager;
let errorHandler;

// Initialize on install
chrome.runtime.onInstalled.addListener(async () => {
    console.log('🧠 Remember: Extension installed/updated');
    
    // Initialize managers (note: actual classes loaded in content scripts)
    try {
        await loadInitialData();
    } catch (error) {
        console.error('Failed to initialize:', error);
    }
});

// Load initial data
async function loadInitialData() {
    try {
        const stats = await getStats();
        console.log(`📚 Loaded: ${stats.activeCount} active, ${stats.archivedCount} archived conversations`);
    } catch (error) {
        console.error('Failed to load data:', error);
    }
}

// Message handler with error handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    handleMessage(request, sender)
        .then(sendResponse)
        .catch(err => {
            console.error('❌ Error handling message:', err);
            sendResponse({ 
                success: false, 
                error: err.message || 'Unknown error'
            });
        });
    return true; // Keep channel open for async response
});

// Main message handler
async function handleMessage(request, sender) {
    console.log('📨 Message received:', request.action);

    switch (request.action) {
        // Storage operations
        case 'storeConversation':
            return await storeConversation(request.conversation);
        
        case 'getConversations':
            return await getConversations(request.filter);
        
        case 'getConversation':
            return await getConversation(request.id);
        
        case 'deleteConversation':
            return await deleteConversation(request.id);
        
        case 'mergeConversations':
            return await mergeConversations(request.conversationIds);
        
        // Export operations
        case 'exportConversations':
            return await exportConversations(request.conversationIds, request.format);
        
        case 'downloadArchive':
            return await downloadArchive();
        
        // Stats
        case 'getStats':
            return await getStats();
        
        // UI operations
        case 'openSidebar':
            return await openSidebar(sender.tab.id);
        
        case 'openMergeMode':
            return await openMergeMode(sender.tab.id);
        
        case 'openSettings':
            return await openSettings();
        
        // Search
        case 'searchConversations':
            return await searchConversations(request.query);
        
        default:
            throw new Error('Unknown action: ' + request.action);
    }
}

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
    console.log('⌨️ Keyboard shortcut:', command);
    
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (tabs[0]) {
            switch (command) {
                case 'capture-conversation':
                    await captureConversation(tabs[0].id);
                    break;
                
                case 'open-sidebar':
                    await openSidebar(tabs[0].id);
                    break;
            }
        }
    });
});

/**
 * Store conversation with validation and limit enforcement
 */
async function storeConversation(conversation) {
    try {
        // Validate conversation
        if (!conversation || !conversation.id) {
            throw new Error('Invalid conversation object');
        }

        // Add timestamp
        conversation.savedAt = conversation.savedAt || Date.now();

        // Get existing conversations
        let conversations = await getStorage('remember_conversations') || [];
        
        // Check if updating existing
        const existingIndex = conversations.findIndex(c => c.id === conversation.id);
        if (existingIndex !== -1) {
            conversations[existingIndex] = conversation;
            console.log('🔄 Updated conversation:', conversation.id);
        } else {
            conversations.push(conversation);
            console.log('✅ Stored new conversation:', conversation.id);
        }

        // Sort by savedAt (newest first)
        conversations.sort((a, b) => b.savedAt - a.savedAt);

        // Enforce 50 conversation limit
        const MAX_LOCAL = 50;
        if (conversations.length > MAX_LOCAL) {
            const toArchive = conversations.splice(MAX_LOCAL);
            await archiveConversations(toArchive);
            console.log(`📦 Archived ${toArchive.length} old conversations`);
        }

        // Save to storage
        await setStorage('remember_conversations', conversations);

        return { 
            success: true, 
            id: conversation.id,
            total: conversations.length
        };
    } catch (error) {
        console.error('Failed to store conversation:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all conversations
 */
async function getConversations(filter = null) {
    try {
        let conversations = await getStorage('remember_conversations') || [];
        
        // Apply filter if provided
        if (filter) {
            if (filter.platform) {
                conversations = conversations.filter(c => c.platform === filter.platform);
            }
            if (filter.startDate) {
                conversations = conversations.filter(c => c.startTime >= filter.startDate);
            }
            if (filter.endDate) {
                conversations = conversations.filter(c => c.startTime <= filter.endDate);
            }
        }

        return { 
            success: true, 
            conversations,
            count: conversations.length 
        };
    } catch (error) {
        console.error('Failed to get conversations:', error);
        return { success: false, error: error.message, conversations: [] };
    }
}

/**
 * Get single conversation
 */
async function getConversation(id) {
    try {
        const conversations = await getStorage('remember_conversations') || [];
        const conversation = conversations.find(c => c.id === id);
        
        if (!conversation) {
            // Check archived
            const archived = await getStorage('remember_archived') || [];
            const archivedConv = archived.find(c => c.id === id);
            
            if (!archivedConv) {
                throw new Error('Conversation not found');
            }
            
            return { success: true, conversation: archivedConv, archived: true };
        }

        return { success: true, conversation };
    } catch (error) {
        console.error('Failed to get conversation:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete conversation
 */
async function deleteConversation(id) {
    try {
        let conversations = await getStorage('remember_conversations') || [];
        conversations = conversations.filter(c => c.id !== id);
        await setStorage('remember_conversations', conversations);

        console.log('🗑️ Deleted conversation:', id);
        return { success: true };
    } catch (error) {
        console.error('Failed to delete conversation:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Merge multiple conversations
 */
async function mergeConversations(conversationIds) {
    try {
        if (!conversationIds || conversationIds.length < 2) {
            throw new Error('Need at least 2 conversations to merge');
        }

        const conversations = await getStorage('remember_conversations') || [];
        const toMerge = conversations.filter(c => conversationIds.includes(c.id));
        
        if (toMerge.length !== conversationIds.length) {
            throw new Error('Some conversations not found');
        }

        // Sort by startTime
        toMerge.sort((a, b) => a.startTime - b.startTime);

        // Create merged conversation
        const merged = {
            id: `merged_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: `Merged: ${toMerge.map(c => c.title).join(' + ')}`,
            messages: [],
            startTime: toMerge[0].startTime,
            endTime: toMerge[toMerge.length - 1].endTime || Date.now(),
            messageCount: 0,
            savedAt: Date.now(),
            platform: toMerge[0].platform,
            url: toMerge[0].url,
            mergedFrom: conversationIds,
            isMerged: true
        };

        // Merge all messages
        toMerge.forEach(conv => {
            merged.messages.push(...conv.messages);
        });

        merged.messageCount = merged.messages.length;

        // Sort messages by timestamp
        merged.messages.sort((a, b) => a.timestamp - b.timestamp);

        // Store merged conversation
        await storeConversation(merged);

        // Delete original conversations
        for (const id of conversationIds) {
            await deleteConversation(id);
        }

        console.log('🔗 Merged conversations:', conversationIds);
        return { success: true, merged };
    } catch (error) {
        console.error('Failed to merge conversations:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Archive conversations
 */
async function archiveConversations(conversations) {
    try {
        let archived = await getStorage('remember_archived') || [];
        archived.push(...conversations);
        
        // Keep only last 200 archived
        if (archived.length > 200) {
            archived.sort((a, b) => b.savedAt - a.savedAt);
            archived = archived.slice(0, 200);
        }
        
        await setStorage('remember_archived', archived);
        console.log(`📦 Archived ${conversations.length} conversations`);
    } catch (error) {
        console.error('Failed to archive:', error);
    }
}

/**
 * Export conversations in specified format
 */
async function exportConversations(conversationIds = null, format = 'json') {
    try {
        let conversations = await getStorage('remember_conversations') || [];
        
        // Filter by IDs if provided
        if (conversationIds && conversationIds.length > 0) {
            conversations = conversations.filter(c => conversationIds.includes(c.id));
        }

        // Include archived if exporting all
        if (!conversationIds) {
            const archived = await getStorage('remember_archived') || [];
            conversations.push(...archived);
        }

        // Sort by date
        conversations.sort((a, b) => b.savedAt - a.savedAt);

        // Export based on format
        switch (format) {
            case 'json':
                return exportAsJSON(conversations);
            case 'markdown':
                return exportAsMarkdown(conversations);
            case 'txt':
                return exportAsText(conversations);
            case 'html':
                return exportAsHTML(conversations);
            default:
                return exportAsJSON(conversations);
        }
    } catch (error) {
        console.error('Export failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Export as JSON
 */
function exportAsJSON(conversations) {
    const data = {
        exported: new Date().toISOString(),
        version: '2.0',
        source: 'Remember - AI Memory',
        count: conversations.length,
        conversations: conversations
    };
    
    return {
        success: true,
        data: JSON.stringify(data, null, 2),
        filename: `remember-export-${Date.now()}.json`,
        mimeType: 'application/json'
    };
}

/**
 * Export as Markdown
 */
function exportAsMarkdown(conversations) {
    let md = `# Remember - Conversation Export\n\n`;
    md += `**Exported:** ${new Date().toISOString()}\n`;
    md += `**Total Conversations:** ${conversations.length}\n\n`;
    md += `---\n\n`;

    conversations.forEach((conv, i) => {
        md += `## ${i + 1}. ${conv.title}\n\n`;
        md += `- **Date:** ${new Date(conv.startTime).toLocaleString()}\n`;
        md += `- **Platform:** ${conv.platform}\n`;
        md += `- **Messages:** ${conv.messageCount}\n\n`;

        // Add context if available
        if (conv.summary && conv.summary.optimalContext) {
            md += conv.summary.optimalContext + '\n\n';
        } else {
            // Fallback to simple message list
            conv.messages.forEach((msg, j) => {
                const role = msg.role === 'user' ? '**User:**' : '**Assistant:**';
                md += `${role} ${msg.content}\n\n`;
            });
        }

        md += `---\n\n`;
    });

    return {
        success: true,
        data: md,
        filename: `remember-export-${Date.now()}.md`,
        mimeType: 'text/markdown'
    };
}

/**
 * Export as plain text
 */
function exportAsText(conversations) {
    let txt = `REMEMBER - CONVERSATION EXPORT\n`;
    txt += `Exported: ${new Date().toISOString()}\n`;
    txt += `Total Conversations: ${conversations.length}\n\n`;
    txt += `${'='.repeat(60)}\n\n`;

    conversations.forEach((conv, i) => {
        txt += `[${i + 1}] ${conv.title}\n`;
        txt += `Date: ${new Date(conv.startTime).toLocaleString()}\n`;
        txt += `Platform: ${conv.platform}\n`;
        txt += `Messages: ${conv.messageCount}\n\n`;

        conv.messages.forEach((msg, j) => {
            txt += `${msg.role.toUpperCase()}: ${msg.content}\n\n`;
        });

        txt += `${'-'.repeat(60)}\n\n`;
    });

    return {
        success: true,
        data: txt,
        filename: `remember-export-${Date.now()}.txt`,
        mimeType: 'text/plain'
    };
}

/**
 * Export as HTML
 */
function exportAsHTML(conversations) {
    let html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Remember - Conversation Export</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            max-width: 900px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        h1 { color: #667eea; }
        .meta { color: #666; font-size: 14px; margin-bottom: 30px; }
        .conversation {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
            background: #f9f9f9;
        }
        .conversation h2 { margin-top: 0; color: #333; }
        .conversation-meta {
            font-size: 13px;
            color: #666;
            margin-bottom: 15px;
        }
        .message {
            margin: 15px 0;
            padding: 12px;
            border-radius: 6px;
        }
        .message.user {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
        }
        .message.assistant {
            background: #f3e5f5;
            border-left: 4px solid #9c27b0;
        }
        .message-role {
            font-weight: 600;
            margin-bottom: 5px;
            text-transform: uppercase;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <h1>🧠 Remember - Conversation Export</h1>
    <div class="meta">
        <strong>Exported:</strong> ${new Date().toISOString()}<br>
        <strong>Total Conversations:</strong> ${conversations.length}
    </div>
`;

    conversations.forEach((conv, i) => {
        html += `
    <div class="conversation">
        <h2>${i + 1}. ${escapeHTML(conv.title)}</h2>
        <div class="conversation-meta">
            <strong>Date:</strong> ${new Date(conv.startTime).toLocaleString()} |
            <strong>Platform:</strong> ${conv.platform} |
            <strong>Messages:</strong> ${conv.messageCount}
        </div>
`;

        conv.messages.forEach(msg => {
            html += `
        <div class="message ${msg.role}">
            <div class="message-role">${msg.role}</div>
            <div>${escapeHTML(msg.content).replace(/\n/g, '<br>')}</div>
        </div>
`;
        });

        html += `    </div>\n`;
    });

    html += `</body>\n</html>`;

    return {
        success: true,
        data: html,
        filename: `remember-export-${Date.now()}.html`,
        mimeType: 'text/html'
    };
}

/**
 * Download archived conversations
 */
async function downloadArchive() {
    try {
        const archived = await getStorage('remember_archived') || [];
        
        if (archived.length === 0) {
            return { success: true, count: 0 };
        }

        const data = {
            exported: new Date().toISOString(),
            version: '2.0',
            source: 'Remember - Archived Conversations',
            count: archived.length,
            conversations: archived
        };

        return {
            success: true,
            data: JSON.stringify(data, null, 2),
            filename: `remember-archive-${Date.now()}.json`,
            mimeType: 'application/json',
            count: archived.length
        };
    } catch (error) {
        console.error('Failed to download archive:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get statistics
 */
async function getStats() {
    try {
        const conversations = await getStorage('remember_conversations') || [];
        const archived = await getStorage('remember_archived') || [];
        
        const totalMessages = conversations.reduce((sum, c) => sum + (c.messageCount || 0), 0);
        const estimatedSize = new Blob([JSON.stringify(conversations)]).size;
        const MAX_LOCAL = 50;

        return {
            success: true,
            stats: {
                activeCount: conversations.length,
                archivedCount: archived.length,
                totalCount: conversations.length + archived.length,
                totalMessages,
                estimatedSize,
                limit: MAX_LOCAL,
                percentUsed: (conversations.length / MAX_LOCAL * 100).toFixed(1)
            }
        };
    } catch (error) {
        console.error('Failed to get stats:', error);
        return { 
            success: false, 
            error: error.message,
            stats: { activeCount: 0, archivedCount: 0, totalCount: 0 }
        };
    }
}

/**
 * Search conversations
 */
async function searchConversations(query) {
    try {
        const conversations = await getStorage('remember_conversations') || [];
        const lowerQuery = query.toLowerCase();
        
        const results = conversations.filter(conv => {
            // Search in title
            if (conv.title && conv.title.toLowerCase().includes(lowerQuery)) {
                return true;
            }
            
            // Search in messages
            if (conv.messages) {
                return conv.messages.some(msg => 
                    msg.content && msg.content.toLowerCase().includes(lowerQuery)
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
        console.error('Search failed:', error);
        return { success: false, error: error.message, conversations: [] };
    }
}

/**
 * Open sidebar in tab
 */
async function openSidebar(tabId) {
    try {
        await chrome.tabs.sendMessage(tabId, { action: 'openSidebar' });
        return { success: true };
    } catch (error) {
        console.error('Failed to open sidebar:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Open merge mode in sidebar
 */
async function openMergeMode(tabId) {
    try {
        await chrome.tabs.sendMessage(tabId, { action: 'openMergeMode' });
        return { success: true };
    } catch (error) {
        console.error('Failed to open merge mode:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Open settings
 */
async function openSettings() {
    try {
        chrome.runtime.openOptionsPage();
        return { success: true };
    } catch (error) {
        console.error('Failed to open settings:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Capture conversation via keyboard shortcut
 */
async function captureConversation(tabId) {
    try {
        await chrome.tabs.sendMessage(tabId, { action: 'captureConversation' });
        
        // Show notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon128.png',
            title: 'Remember',
            message: 'Capturing conversation...',
            priority: 0
        });
        
        return { success: true };
    } catch (error) {
        console.error('Failed to capture conversation:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Storage helpers
 */
async function getStorage(key) {
    return new Promise((resolve) => {
        chrome.storage.local.get(key, (result) => {
            resolve(result[key]);
        });
    });
}

async function setStorage(key, value) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set({ [key]: value }, () => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve();
            }
        });
    });
}

/**
 * HTML escape helper
 */
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, char => {
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return escapeMap[char];
    });
}

console.log('🧠 Remember Background: Ready');
