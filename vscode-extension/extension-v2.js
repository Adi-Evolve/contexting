// Remember VS Code Extension v2.0
// Enhanced with error handling, storage management, multiple export formats, and keyboard shortcuts

const vscode = require('vscode');
const fs = require('fs').promises;
const path = require('path');

// Load all feature modules
const ConversationThreader = require('./conversation-threader.js');
const CodeLanguageDetector = require('./code-language-detector.js');
const ToolUsageTracker = require('./tool-usage-tracker.js');
const ErrorHandler = require('./error-handler.js');
const StorageManager = require('./storage-manager.js');

// Load original context extractor
const EnhancedContextExtractorBase = require('./extension.js');

let errorHandler;
let storageManager;
let currentConversation = null;

/**
 * Activate extension
 */
function activate(context) {
    console.log('🧠 Remember VS Code Extension v2.0 activated');

    // Initialize managers
    errorHandler = new ErrorHandler();
    storageManager = new StorageManager(context);

    // Register all commands
    registerCommands(context);

    // Start conversation monitoring
    startConversationMonitoring(context);

    // Show activation message
    vscode.window.showInformationMessage('🧠 Remember: AI Memory active');
}

/**
 * Register all commands
 */
function registerCommands(context) {
    // Capture current conversation
    context.subscriptions.push(
        vscode.commands.registerCommand('remember.captureConversation', async () => {
            await captureCurrentConversation();
        })
    );

    // View all conversations
    context.subscriptions.push(
        vscode.commands.registerCommand('remember.viewConversations', async () => {
            await viewConversations();
        })
    );

    // Export conversations - Multiple formats
    context.subscriptions.push(
        vscode.commands.registerCommand('remember.exportConversations', async () => {
            await exportConversationsWithFormat();
        })
    );

    // Export as JSON
    context.subscriptions.push(
        vscode.commands.registerCommand('remember.exportAsJSON', async () => {
            await exportConversations('json');
        })
    );

    // Export as Markdown
    context.subscriptions.push(
        vscode.commands.registerCommand('remember.exportAsMarkdown', async () => {
            await exportConversations('markdown');
        })
    );

    // Export as Text
    context.subscriptions.push(
        vscode.commands.registerCommand('remember.exportAsText', async () => {
            await exportConversations('txt');
        })
    );

    // Export as HTML
    context.subscriptions.push(
        vscode.commands.registerCommand('remember.exportAsHTML', async () => {
            await exportConversations('html');
        })
    );

    // Merge conversations
    context.subscriptions.push(
        vscode.commands.registerCommand('remember.mergeConversations', async () => {
            await mergeConversations();
        })
    );

    // Show statistics
    context.subscriptions.push(
        vscode.commands.registerCommand('remember.showStats', async () => {
            await showStats();
        })
    );

    // Download archive
    context.subscriptions.push(
        vscode.commands.registerCommand('remember.downloadArchive', async () => {
            await downloadArchive();
        })
    );

    // Clear all conversations
    context.subscriptions.push(
        vscode.commands.registerCommand('remember.clearAll', async () => {
            await clearAllConversations();
        })
    );

    // Search conversations
    context.subscriptions.push(
        vscode.commands.registerCommand('remember.searchConversations', async () => {
            await searchConversations();
        })
    );
}

/**
 * Capture current conversation
 */
async function captureCurrentConversation() {
    try {
        if (!currentConversation || !currentConversation.messages || currentConversation.messages.length === 0) {
            vscode.window.showWarningMessage('No active conversation to capture');
            return;
        }

        // Validate conversation
        const validation = errorHandler.validateConversation(currentConversation);
        if (!validation.valid) {
            vscode.window.showErrorMessage(`Invalid conversation: ${validation.errors.join(', ')}`);
            return;
        }

        // Add timestamp if missing
        if (!currentConversation.savedAt) {
            currentConversation.savedAt = Date.now();
        }
        if (!currentConversation.startTime) {
            currentConversation.startTime = Date.now();
        }

        // Store conversation
        const result = await storageManager.storeConversation(currentConversation);

        if (result.success) {
            vscode.window.showInformationMessage(
                `✅ Conversation captured! (${result.total}/${storageManager.MAX_LOCAL_CONVERSATIONS})`
            );
        } else {
            vscode.window.showErrorMessage(`Failed to capture conversation: ${result.error}`);
        }
    } catch (error) {
        errorHandler.handleVSCodeError('captureConversation', error);
    }
}

/**
 * View all conversations
 */
async function viewConversations() {
    try {
        const conversations = await storageManager.getAllConversations();

        if (conversations.length === 0) {
            vscode.window.showInformationMessage('No conversations stored yet');
            return;
        }

        // Create quick pick items
        const items = conversations.map((conv, index) => ({
            label: `${index + 1}. ${conv.title || 'Untitled'}`,
            description: `${conv.messageCount} messages - ${new Date(conv.savedAt).toLocaleString()}`,
            detail: conv.isMerged ? '🔗 Merged conversation' : '',
            conversation: conv
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a conversation to view',
            matchOnDescription: true,
            matchOnDetail: true
        });

        if (selected) {
            await showConversationDetails(selected.conversation);
        }
    } catch (error) {
        errorHandler.handleVSCodeError('viewConversations', error);
    }
}

/**
 * Show conversation details
 */
async function showConversationDetails(conversation) {
    try {
        // Generate context using enhanced extractor
        const extractor = new EnhancedContextExtractorBase.EnhancedContextExtractor();
        const context = extractor.extractContext(conversation);

        // Create a new document with the context
        const doc = await vscode.workspace.openTextDocument({
            content: context,
            language: 'markdown'
        });

        await vscode.window.showTextDocument(doc, { preview: false });
    } catch (error) {
        errorHandler.handleVSCodeError('showConversationDetails', error);
    }
}

/**
 * Export conversations with format selection
 */
async function exportConversationsWithFormat() {
    try {
        const format = await vscode.window.showQuickPick(
            [
                { label: '📊 JSON', description: 'Structured data format', value: 'json' },
                { label: '📝 Markdown', description: 'Human-readable format', value: 'markdown' },
                { label: '📄 Plain Text', description: 'Simple text format', value: 'txt' },
                { label: '🌐 HTML', description: 'Web page format', value: 'html' }
            ],
            {
                placeHolder: 'Select export format'
            }
        );

        if (format) {
            await exportConversations(format.value);
        }
    } catch (error) {
        errorHandler.handleVSCodeError('exportConversationsWithFormat', error);
    }
}

/**
 * Export conversations in specified format
 */
async function exportConversations(format = 'json') {
    try {
        const result = await storageManager.exportConversations(null, format);

        if (result.success) {
            // Save to file
            const saveResult = await storageManager.saveToFile(result, result.filename);
            
            if (saveResult.success) {
                // Show option to open file
                const action = await vscode.window.showInformationMessage(
                    `✅ Exported ${format.toUpperCase()} successfully`,
                    'Open File'
                );

                if (action === 'Open File') {
                    const doc = await vscode.workspace.openTextDocument(saveResult.path);
                    await vscode.window.showTextDocument(doc);
                }
            }
        } else {
            vscode.window.showErrorMessage(`Export failed: ${result.error}`);
        }
    } catch (error) {
        errorHandler.handleVSCodeError('exportConversations', error);
    }
}

/**
 * Merge conversations
 */
async function mergeConversations() {
    try {
        const conversations = await storageManager.getAllConversations();

        if (conversations.length < 2) {
            vscode.window.showInformationMessage('Need at least 2 conversations to merge');
            return;
        }

        // Create checkboxes for selection
        const items = conversations.map((conv, index) => ({
            label: `${index + 1}. ${conv.title || 'Untitled'}`,
            description: `${conv.messageCount} messages - ${new Date(conv.savedAt).toLocaleString()}`,
            picked: false,
            id: conv.id
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select conversations to merge (pick at least 2)',
            canPickMany: true
        });

        if (selected && selected.length >= 2) {
            const conversationIds = selected.map(s => s.id);
            
            const confirm = await vscode.window.showWarningMessage(
                `Merge ${selected.length} conversations? Original conversations will be deleted.`,
                'Merge',
                'Cancel'
            );

            if (confirm === 'Merge') {
                const result = await storageManager.mergeConversations(conversationIds);

                if (result.success) {
                    vscode.window.showInformationMessage(
                        `✅ Merged ${selected.length} conversations into "${result.merged.title}"`
                    );
                } else {
                    vscode.window.showErrorMessage(`Merge failed: ${result.error}`);
                }
            }
        }
    } catch (error) {
        errorHandler.handleVSCodeError('mergeConversations', error);
    }
}

/**
 * Show statistics
 */
async function showStats() {
    try {
        const stats = await storageManager.getStats();

        if (!stats) {
            vscode.window.showErrorMessage('Failed to load statistics');
            return;
        }

        const percentage = stats.percentUsed;
        const storageBar = generateProgressBar(parseFloat(percentage), 20);

        const message = `
📊 Remember Statistics

Active Conversations: ${stats.activeCount}/${stats.limit}
Archived Conversations: ${stats.archivedCount}
Total Messages: ${stats.totalMessages}
Storage Used: ${formatBytes(stats.estimatedSize)}

Storage: ${storageBar} ${percentage}%
        `.trim();

        vscode.window.showInformationMessage(message, { modal: true });
    } catch (error) {
        errorHandler.handleVSCodeError('showStats', error);
    }
}

/**
 * Download archive
 */
async function downloadArchive() {
    try {
        const archived = await storageManager.getArchivedConversations();

        if (archived.length === 0) {
            vscode.window.showInformationMessage('No archived conversations to download');
            return;
        }

        const result = storageManager.exportAsJSON(archived);
        const saveResult = await storageManager.saveToFile(result, result.filename);

        if (saveResult.success) {
            vscode.window.showInformationMessage(
                `✅ Downloaded ${archived.length} archived conversations`
            );
        }
    } catch (error) {
        errorHandler.handleVSCodeError('downloadArchive', error);
    }
}

/**
 * Clear all conversations
 */
async function clearAllConversations() {
    try {
        const confirm = await vscode.window.showWarningMessage(
            '⚠️ Clear all conversations? This cannot be undone.',
            { modal: true },
            'Export First',
            'Clear Without Export',
            'Cancel'
        );

        if (confirm === 'Export First') {
            await exportConversations('json');
            // Ask again after export
            const confirmAgain = await vscode.window.showWarningMessage(
                'Now clear all conversations?',
                'Clear',
                'Cancel'
            );
            
            if (confirmAgain !== 'Clear') {
                return;
            }
        } else if (confirm !== 'Clear Without Export') {
            return;
        }

        const result = await storageManager.clearAll();

        if (result.success) {
            vscode.window.showInformationMessage('✅ All conversations cleared');
        } else {
            vscode.window.showErrorMessage(`Failed to clear: ${result.error}`);
        }
    } catch (error) {
        errorHandler.handleVSCodeError('clearAllConversations', error);
    }
}

/**
 * Search conversations
 */
async function searchConversations() {
    try {
        const query = await vscode.window.showInputBox({
            placeHolder: 'Search conversations...',
            prompt: 'Enter keywords to search'
        });

        if (!query) {
            return;
        }

        const conversations = await storageManager.getAllConversations();
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

        if (results.length === 0) {
            vscode.window.showInformationMessage(`No conversations found for "${query}"`);
            return;
        }

        // Show results
        const items = results.map((conv, index) => ({
            label: `${index + 1}. ${conv.title || 'Untitled'}`,
            description: `${conv.messageCount} messages - ${new Date(conv.savedAt).toLocaleString()}`,
            conversation: conv
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: `Found ${results.length} conversations`
        });

        if (selected) {
            await showConversationDetails(selected.conversation);
        }
    } catch (error) {
        errorHandler.handleVSCodeError('searchConversations', error);
    }
}

/**
 * Start conversation monitoring
 */
function startConversationMonitoring(context) {
    // Monitor clipboard for ChatGPT/Claude conversations
    let lastClipboard = '';
    
    const clipboardMonitor = setInterval(async () => {
        try {
            const clipboard = await vscode.env.clipboard.readText();
            
            if (clipboard && clipboard !== lastClipboard && clipboard.length > 100) {
                lastClipboard = clipboard;
                
                // Check if it looks like a conversation
                if (isConversationText(clipboard)) {
                    const parsed = parseConversationFromClipboard(clipboard);
                    
                    if (parsed && parsed.messages.length >= 2) {
                        currentConversation = parsed;
                        
                        vscode.window.showInformationMessage(
                            '🧠 Conversation detected in clipboard',
                            'Capture'
                        ).then(action => {
                            if (action === 'Capture') {
                                captureCurrentConversation();
                            }
                        });
                    }
                }
            }
        } catch (error) {
            // Silently fail - clipboard monitoring is optional
        }
    }, 2000);

    context.subscriptions.push({ dispose: () => clearInterval(clipboardMonitor) });
}

/**
 * Check if text looks like a conversation
 */
function isConversationText(text) {
    const conversationPatterns = [
        /user:|assistant:/gi,
        /You said:|ChatGPT said:/gi,
        /Human:|AI:/gi,
        /Q:|A:/gi
    ];

    return conversationPatterns.some(pattern => pattern.test(text));
}

/**
 * Parse conversation from clipboard
 */
function parseConversationFromClipboard(text) {
    try {
        const messages = [];
        const lines = text.split('\n');
        
        let currentRole = null;
        let currentContent = '';

        for (const line of lines) {
            if (/^(user|you|human|q):/i.test(line)) {
                if (currentRole && currentContent.trim()) {
                    messages.push({
                        role: currentRole,
                        content: currentContent.trim(),
                        timestamp: Date.now()
                    });
                }
                currentRole = 'user';
                currentContent = line.replace(/^(user|you|human|q):/i, '').trim();
            } else if (/^(assistant|chatgpt|ai|a):/i.test(line)) {
                if (currentRole && currentContent.trim()) {
                    messages.push({
                        role: currentRole,
                        content: currentContent.trim(),
                        timestamp: Date.now()
                    });
                }
                currentRole = 'assistant';
                currentContent = line.replace(/^(assistant|chatgpt|ai|a):/i, '').trim();
            } else if (currentRole) {
                currentContent += '\n' + line;
            }
        }

        // Add last message
        if (currentRole && currentContent.trim()) {
            messages.push({
                role: currentRole,
                content: currentContent.trim(),
                timestamp: Date.now()
            });
        }

        if (messages.length >= 2) {
            return {
                id: `clipboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                title: 'Clipboard Conversation',
                messages,
                messageCount: messages.length,
                startTime: Date.now(),
                savedAt: Date.now(),
                platform: 'Clipboard'
            };
        }

        return null;
    } catch (error) {
        console.error('Failed to parse conversation:', error);
        return null;
    }
}

/**
 * Helper: Format bytes
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Helper: Generate progress bar
 */
function generateProgressBar(percentage, length = 20) {
    const filled = Math.round((percentage / 100) * length);
    const empty = length - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * Deactivate extension
 */
function deactivate() {
    console.log('🧠 Remember VS Code Extension deactivated');
}

module.exports = {
    activate,
    deactivate
};
