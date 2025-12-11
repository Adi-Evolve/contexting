// Conversation Sidebar Provider for VS Code
// Provides TreeView for browsing and managing conversations

const vscode = require('vscode');

class ConversationSidebarProvider {
    constructor(storageManager) {
        this.storageManager = storageManager;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element) {
        return element;
    }

    async getChildren(element) {
        if (!element) {
            // Root level - show stats and conversation groups
            const conversations = await this.storageManager.getAllConversations();
            const stats = this.calculateStats(conversations);

            const items = [];

            // Stats item
            items.push(new ConversationTreeItem(
                `📊 ${conversations.length} Conversations | ${stats.totalMessages} Messages`,
                vscode.TreeItemCollapsibleState.None,
                { command: 'remember.showStats', title: 'Show Stats' }
            ));

            // Group by platform
            const grouped = this.groupByPlatform(conversations);
            
            for (const [platform, convos] of Object.entries(grouped)) {
                const platformItem = new ConversationTreeItem(
                    `${this.getPlatformIcon(platform)} ${platform} (${convos.length})`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    null,
                    { platform, conversations: convos }
                );
                items.push(platformItem);
            }

            return items;
        } else if (element.contextValue === 'platform') {
            // Show conversations for this platform
            return element.data.conversations
                .sort((a, b) => b.savedAt - a.savedAt)
                .slice(0, 20) // Limit to recent 20
                .map(conv => new ConversationTreeItem(
                    `💬 ${conv.title || 'Untitled'} (${conv.messageCount} msgs)`,
                    vscode.TreeItemCollapsibleState.None,
                    { 
                        command: 'remember.openConversation', 
                        title: 'Open Conversation',
                        arguments: [conv]
                    },
                    { conversation: conv },
                    'conversation',
                    this.formatDate(conv.savedAt)
                ));
        }

        return [];
    }

    calculateStats(conversations) {
        return {
            totalMessages: conversations.reduce((sum, c) => sum + (c.messageCount || 0), 0),
            platforms: [...new Set(conversations.map(c => c.platform))].length
        };
    }

    groupByPlatform(conversations) {
        const grouped = {};
        for (const conv of conversations) {
            const platform = conv.platform || 'Unknown';
            if (!grouped[platform]) grouped[platform] = [];
            grouped[platform].push(conv);
        }
        return grouped;
    }

    getPlatformIcon(platform) {
        const icons = {
            'ChatGPT': '🤖',
            'Claude': '🧠',
            'Gemini': '💎',
            'Grok': '🚀',
            'Perplexity': '🔍',
            'Clipboard': '📋',
            'VSCode': '💻'
        };
        return icons[platform] || '💬';
    }

    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    }
}

class ConversationTreeItem extends vscode.TreeItem {
    constructor(label, collapsibleState, command = null, data = null, contextValue = 'platform', description = '') {
        super(label, collapsibleState);
        this.command = command;
        this.data = data;
        this.contextValue = contextValue;
        this.description = description;
        
        if (contextValue === 'conversation') {
            this.iconPath = new vscode.ThemeIcon('comment-discussion');
            this.tooltip = `${data.conversation.title}\n${data.conversation.messageCount} messages\nSaved: ${this.formatTooltipDate(data.conversation.savedAt)}`;
        }
    }

    formatTooltipDate(timestamp) {
        return new Date(timestamp).toLocaleString();
    }
}

module.exports = ConversationSidebarProvider;
