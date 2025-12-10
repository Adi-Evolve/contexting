// Storage Manager with 50 conversation limit and export functionality
// Handles error recovery, quota management, and conversation cleanup

class StorageManager {
    constructor() {
        this.MAX_LOCAL_CONVERSATIONS = 50;
        this.STORAGE_KEY = 'remember_conversations';
        this.ARCHIVED_KEY = 'remember_archived';
        this.SETTINGS_KEY = 'remember_settings';
    }

    /**
     * Store a conversation with automatic cleanup
     */
    async storeConversation(conversation) {
        try {
            // Add timestamp if not present
            if (!conversation.savedAt) {
                conversation.savedAt = Date.now();
            }

            // Get existing conversations
            const conversations = await this.getAllConversations();
            
            // Check if conversation already exists (update it)
            const existingIndex = conversations.findIndex(c => c.id === conversation.id);
            if (existingIndex !== -1) {
                conversations[existingIndex] = conversation;
            } else {
                conversations.push(conversation);
            }

            // Sort by savedAt (newest first)
            conversations.sort((a, b) => b.savedAt - a.savedAt);

            // If over limit, archive old ones
            if (conversations.length > this.MAX_LOCAL_CONVERSATIONS) {
                const toArchive = conversations.splice(this.MAX_LOCAL_CONVERSATIONS);
                await this.archiveConversations(toArchive);
            }

            // Save to storage
            await this.setStorage(this.STORAGE_KEY, conversations);
            
            return { success: true, total: conversations.length };
        } catch (error) {
            console.error('Storage error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all active conversations
     */
    async getAllConversations() {
        try {
            const result = await this.getStorage(this.STORAGE_KEY);
            return result || [];
        } catch (error) {
            console.error('Failed to get conversations:', error);
            return [];
        }
    }

    /**
     * Get a single conversation by ID
     */
    async getConversation(id) {
        try {
            const conversations = await this.getAllConversations();
            const conversation = conversations.find(c => c.id === id);
            
            if (!conversation) {
                // Check archived
                const archived = await this.getArchivedConversations();
                return archived.find(c => c.id === id);
            }
            
            return conversation;
        } catch (error) {
            console.error('Failed to get conversation:', error);
            return null;
        }
    }

    /**
     * Delete a conversation
     */
    async deleteConversation(id) {
        try {
            let conversations = await this.getAllConversations();
            conversations = conversations.filter(c => c.id !== id);
            await this.setStorage(this.STORAGE_KEY, conversations);
            return { success: true };
        } catch (error) {
            console.error('Failed to delete conversation:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Merge multiple conversations
     */
    async mergeConversations(conversationIds) {
        try {
            if (conversationIds.length < 2) {
                throw new Error('Need at least 2 conversations to merge');
            }

            const conversations = await this.getAllConversations();
            const toMerge = conversations.filter(c => conversationIds.includes(c.id));
            
            if (toMerge.length !== conversationIds.length) {
                throw new Error('Some conversations not found');
            }

            // Sort by startTime
            toMerge.sort((a, b) => a.startTime - b.startTime);

            // Create merged conversation
            const merged = {
                id: `merged_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                title: `Merged: ${toMerge[0].title}`,
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
            await this.storeConversation(merged);

            // Delete original conversations
            for (const id of conversationIds) {
                await this.deleteConversation(id);
            }

            return { success: true, merged };
        } catch (error) {
            console.error('Failed to merge conversations:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Archive old conversations (not in active storage)
     */
    async archiveConversations(conversations) {
        try {
            const archived = await this.getArchivedConversations();
            archived.push(...conversations);
            
            // Keep only last 200 archived conversations
            if (archived.length > 200) {
                archived.sort((a, b) => b.savedAt - a.savedAt);
                archived.splice(200);
            }
            
            await this.setStorage(this.ARCHIVED_KEY, archived);
            console.log(`📦 Archived ${conversations.length} conversations`);
        } catch (error) {
            console.error('Failed to archive conversations:', error);
        }
    }

    /**
     * Get archived conversations
     */
    async getArchivedConversations() {
        try {
            const result = await this.getStorage(this.ARCHIVED_KEY);
            return result || [];
        } catch (error) {
            console.error('Failed to get archived conversations:', error);
            return [];
        }
    }

    /**
     * Export conversations for download
     */
    async exportConversations(conversationIds = null, format = 'json') {
        try {
            let conversations = await this.getAllConversations();
            
            // If specific IDs provided, filter
            if (conversationIds && conversationIds.length > 0) {
                conversations = conversations.filter(c => conversationIds.includes(c.id));
            }

            // Include archived if exporting all
            if (!conversationIds) {
                const archived = await this.getArchivedConversations();
                conversations.push(...archived);
            }

            // Sort by date
            conversations.sort((a, b) => b.savedAt - a.savedAt);

            // Format based on requested type
            switch (format) {
                case 'json':
                    return this.exportAsJSON(conversations);
                case 'markdown':
                    return this.exportAsMarkdown(conversations);
                case 'txt':
                    return this.exportAsText(conversations);
                case 'html':
                    return this.exportAsHTML(conversations);
                default:
                    return this.exportAsJSON(conversations);
            }
        } catch (error) {
            console.error('Export failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Export as JSON
     */
    exportAsJSON(conversations) {
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
    exportAsMarkdown(conversations) {
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
    exportAsText(conversations) {
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
    exportAsHTML(conversations) {
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
        <h2>${i + 1}. ${this.escapeHTML(conv.title)}</h2>
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
            <div>${this.escapeHTML(msg.content).replace(/\n/g, '<br>')}</div>
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
     * Get storage statistics
     */
    async getStats() {
        try {
            const conversations = await this.getAllConversations();
            const archived = await this.getArchivedConversations();
            
            const totalMessages = conversations.reduce((sum, c) => sum + c.messageCount, 0);
            const estimatedSize = new Blob([JSON.stringify(conversations)]).size;

            return {
                activeCount: conversations.length,
                archivedCount: archived.length,
                totalCount: conversations.length + archived.length,
                totalMessages,
                estimatedSize,
                limit: this.MAX_LOCAL_CONVERSATIONS,
                percentUsed: (conversations.length / this.MAX_LOCAL_CONVERSATIONS * 100).toFixed(1)
            };
        } catch (error) {
            console.error('Failed to get stats:', error);
            return null;
        }
    }

    /**
     * Clear all data (with confirmation)
     */
    async clearAll() {
        try {
            await chrome.storage.local.remove([this.STORAGE_KEY, this.ARCHIVED_KEY]);
            return { success: true };
        } catch (error) {
            console.error('Failed to clear storage:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Helper: Get from storage
     */
    async getStorage(key) {
        return new Promise((resolve) => {
            chrome.storage.local.get(key, (result) => {
                resolve(result[key]);
            });
        });
    }

    /**
     * Helper: Set to storage
     */
    async setStorage(key, value) {
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
     * Helper: Escape HTML
     */
    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}
