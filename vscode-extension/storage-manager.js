// VS Code Extension Storage Manager
// Handles conversation storage with 50 limit and multiple export formats

const vscode = require('vscode');
const fs = require('fs').promises;
const path = require('path');

class StorageManager {
    constructor(context) {
        this.context = context;
        this.MAX_LOCAL_CONVERSATIONS = 50;
    }

    /**
     * Store a conversation with automatic cleanup
     */
    async storeConversation(conversation) {
        try {
            if (!conversation.savedAt) {
                conversation.savedAt = Date.now();
            }

            // Get existing conversations
            const conversations = await this.getAllConversations();
            
            // Check if conversation already exists
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

            // Save to workspace state
            await this.context.workspaceState.update('remember_conversations', conversations);
            
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
            const conversations = this.context.workspaceState.get('remember_conversations') || [];
            return conversations;
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
            await this.context.workspaceState.update('remember_conversations', conversations);
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
                platform: toMerge[0].platform || 'VS Code',
                mergedFrom: conversationIds,
                isMerged: true
            };

            // Merge all messages
            toMerge.forEach(conv => {
                merged.messages.push(...conv.messages);
            });

            merged.messageCount = merged.messages.length;
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
     * Archive old conversations
     */
    async archiveConversations(conversations) {
        try {
            const archived = await this.getArchivedConversations();
            archived.push(...conversations);
            
            if (archived.length > 200) {
                archived.sort((a, b) => b.savedAt - a.savedAt);
                archived.splice(200);
            }
            
            await this.context.workspaceState.update('remember_archived', archived);
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
            return this.context.workspaceState.get('remember_archived') || [];
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
            
            if (conversationIds && conversationIds.length > 0) {
                conversations = conversations.filter(c => conversationIds.includes(c.id));
            }

            if (!conversationIds) {
                const archived = await this.getArchivedConversations();
                conversations.push(...archived);
            }

            conversations.sort((a, b) => b.savedAt - a.savedAt);

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
            source: 'Remember - AI Memory (VS Code)',
            count: conversations.length,
            conversations: conversations
        };
        
        return {
            success: true,
            data: JSON.stringify(data, null, 2),
            filename: `remember-vscode-export-${Date.now()}.json`,
            extension: '.json'
        };
    }

    /**
     * Export as Markdown
     */
    exportAsMarkdown(conversations) {
        let md = `# Remember - VS Code Conversation Export\n\n`;
        md += `**Exported:** ${new Date().toISOString()}\n`;
        md += `**Total Conversations:** ${conversations.length}\n\n`;
        md += `---\n\n`;

        conversations.forEach((conv, i) => {
            md += `## ${i + 1}. ${conv.title || 'Untitled Conversation'}\n\n`;
            md += `- **Date:** ${new Date(conv.startTime || conv.savedAt).toLocaleString()}\n`;
            md += `- **Platform:** ${conv.platform || 'VS Code'}\n`;
            md += `- **Messages:** ${conv.messageCount}\n\n`;

            if (conv.summary && conv.summary.optimalContext) {
                md += conv.summary.optimalContext + '\n\n';
            } else {
                conv.messages.forEach((msg) => {
                    const role = msg.role === 'user' ? '**User:**' : '**Assistant:**';
                    md += `${role} ${msg.content}\n\n`;
                });
            }

            md += `---\n\n`;
        });

        return {
            success: true,
            data: md,
            filename: `remember-vscode-export-${Date.now()}.md`,
            extension: '.md'
        };
    }

    /**
     * Export as plain text
     */
    exportAsText(conversations) {
        let txt = `REMEMBER - VS CODE CONVERSATION EXPORT\n`;
        txt += `Exported: ${new Date().toISOString()}\n`;
        txt += `Total Conversations: ${conversations.length}\n\n`;
        txt += `${'='.repeat(60)}\n\n`;

        conversations.forEach((conv, i) => {
            txt += `[${i + 1}] ${conv.title || 'Untitled Conversation'}\n`;
            txt += `Date: ${new Date(conv.startTime || conv.savedAt).toLocaleString()}\n`;
            txt += `Platform: ${conv.platform || 'VS Code'}\n`;
            txt += `Messages: ${conv.messageCount}\n\n`;

            conv.messages.forEach((msg) => {
                txt += `${msg.role.toUpperCase()}: ${msg.content}\n\n`;
            });

            txt += `${'-'.repeat(60)}\n\n`;
        });

        return {
            success: true,
            data: txt,
            filename: `remember-vscode-export-${Date.now()}.txt`,
            extension: '.txt'
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
    <title>Remember - VS Code Conversation Export</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            max-width: 900px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        h1 { color: #007acc; }
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
    <h1>🧠 Remember - VS Code Conversation Export</h1>
    <div class="meta">
        <strong>Exported:</strong> ${new Date().toISOString()}<br>
        <strong>Total Conversations:</strong> ${conversations.length}
    </div>
`;

        conversations.forEach((conv, i) => {
            const title = this.escapeHTML(conv.title || 'Untitled Conversation');
            const date = new Date(conv.startTime || conv.savedAt).toLocaleString();
            
            html += `
    <div class="conversation">
        <h2>${i + 1}. ${title}</h2>
        <div class="conversation-meta">
            <strong>Date:</strong> ${date} |
            <strong>Platform:</strong> ${conv.platform || 'VS Code'} |
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
            filename: `remember-vscode-export-${Date.now()}.html`,
            extension: '.html'
        };
    }

    /**
     * Get storage statistics
     */
    async getStats() {
        try {
            const conversations = await this.getAllConversations();
            const archived = await this.getArchivedConversations();
            
            const totalMessages = conversations.reduce((sum, c) => sum + (c.messageCount || 0), 0);
            const estimatedSize = Buffer.byteLength(JSON.stringify(conversations), 'utf8');

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
     * Clear all data
     */
    async clearAll() {
        try {
            await this.context.workspaceState.update('remember_conversations', undefined);
            await this.context.workspaceState.update('remember_archived', undefined);
            return { success: true };
        } catch (error) {
            console.error('Failed to clear storage:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Save export to file
     */
    async saveToFile(exportResult, defaultFilename) {
        try {
            const uri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(defaultFilename),
                filters: {
                    'All Files': ['*']
                }
            });

            if (uri) {
                await fs.writeFile(uri.fsPath, exportResult.data, 'utf8');
                vscode.window.showInformationMessage(`✅ Exported to ${path.basename(uri.fsPath)}`);
                return { success: true, path: uri.fsPath };
            }

            return { success: false, cancelled: true };
        } catch (error) {
            console.error('Failed to save file:', error);
            vscode.window.showErrorMessage(`Failed to save file: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Helper: Escape HTML
     */
    escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}

module.exports = StorageManager;
