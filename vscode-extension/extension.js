// Remember VS Code Extension v4.0
// Enhanced with multi-layer capture, context assembler, and smart features

const vscode = require('vscode');
const fs = require('fs').promises;
const path = require('path');

// Load all feature modules
const ConversationThreader = require('./conversation-threader.js');
const CodeLanguageDetector = require('./code-language-detector.js');
const ToolUsageTracker = require('./tool-usage-tracker.js');
const ErrorHandler = require('./error-handler.js');
const StorageManager = require('./storage-manager.js');
const ConversationSidebarProvider = require('./conversation-sidebar.js');

// Load enhanced context extractor v2 (7-point format)
const EnhancedContextExtractor = require('./context-extractor-v2.js');

// NEW: Advanced capture and assembly modules
const EditorContextCapture = require('./src/capture/editorContextCapture.js');
const SmartClipboardMonitor = require('./src/capture/smartClipboard.js');
const ContextAssemblerVSCode = require('./src/assembler/contextAssemblerVSCode.js');

let errorHandler;
let storageManager;
let sidebarProvider;
let currentConversation = null;

// NEW: Advanced modules
let editorContextCapture;
let smartClipboard;
let contextAssembler;
let captureButton;

/**
 * Activate extension
 */
function activate(context) {
    console.log('🧠 Remember VS Code Extension v4.0 activated');

    // Initialize managers
    errorHandler = new ErrorHandler();
    storageManager = new StorageManager(context);

    // Initialize sidebar
    sidebarProvider = new ConversationSidebarProvider(storageManager);
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('remember-sidebar', sidebarProvider)
    );

    // NEW: Initialize advanced capture modules
    editorContextCapture = new EditorContextCapture(context);
    contextAssembler = new ContextAssemblerVSCode(storageManager);
    
    smartClipboard = new SmartClipboardMonitor(async (detectedConversation) => {
        await handleDetectedConversation(detectedConversation);
    });
    
    // NEW: Create quick capture button in status bar
    captureButton = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    captureButton.text = '$(comment-discussion) Capture Chat';
    captureButton.command = 'remember.quickCapture';
    captureButton.tooltip = 'Quick capture last AI conversation (Ctrl+Shift+C)';
    captureButton.show();
    context.subscriptions.push(captureButton);

    // Register all commands
    registerCommands(context);

    // Start conversation monitoring
    startConversationMonitoring(context);
    
    // NEW: Start smart clipboard monitoring
    smartClipboard.startMonitoring(2000);

    // Show activation message with new features
    vscode.window.showInformationMessage('🧠 Remember v4.0: Enhanced AI Memory active!', 'What\'s New')
        .then(action => {
            if (action === 'What\'s New') {
                showWhatsNew();
            }
        });
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

    // Open conversation from sidebar
    context.subscriptions.push(
        vscode.commands.registerCommand('remember.openConversation', async (conversation) => {
            await openConversationInEditor(conversation);
        })
    );

    // Refresh sidebar
    context.subscriptions.push(
        vscode.commands.registerCommand('remember.refreshSidebar', () => {
            sidebarProvider.refresh();
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
    
    // NEW: Quick capture command
    context.subscriptions.push(
        vscode.commands.registerCommand('remember.quickCapture', async () => {
            await quickCaptureConversation();
        })
    );
    
    // NEW: Resume in Copilot command
    context.subscriptions.push(
        vscode.commands.registerCommand('remember.resumeInCopilot', async () => {
            await resumeInCopilot();
        })
    );
    
    // NEW: Show editor context command
    context.subscriptions.push(
        vscode.commands.registerCommand('remember.showEditorContext', async () => {
            await showEditorContext();
        })
    );
    
    // NEW: Assemble context preview
    context.subscriptions.push(
        vscode.commands.registerCommand('remember.previewContext', async () => {
            await previewContextAssembly();
        })
    );
}

/**
 * Open conversation in editor with highlighting
 */
async function openConversationInEditor(conversation) {
    try {
        const doc = await vscode.workspace.openTextDocument({
            content: formatConversationForDisplay(conversation),
            language: 'markdown'
        });
        
        const editor = await vscode.window.showTextDocument(doc, {
            preview: false,
            viewColumn: vscode.ViewColumn.One
        });

        // Highlight the first few lines
        const range = new vscode.Range(0, 0, 3, 0);
        editor.setDecorations(
            vscode.window.createTextEditorDecorationType({
                backgroundColor: new vscode.ThemeColor('editor.findMatchHighlightBackground')
            }),
            [range]
        );

        // Auto-clear highlight after 2 seconds
        setTimeout(() => {
            editor.setDecorations(
                vscode.window.createTextEditorDecorationType({}),
                []
            );
        }, 2000);

        vscode.window.showInformationMessage(`📖 Opened: ${conversation.title}`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to open conversation: ${error.message}`);
    }
}

/**
 * Format conversation for display
 */
function formatConversationForDisplay(conversation) {
    let content = `# ${conversation.title || 'Untitled Conversation'}\n\n`;
    content += `**Platform:** ${conversation.platform || 'Unknown'}\n`;
    content += `**Messages:** ${conversation.messageCount || 0}\n`;
    content += `**Saved:** ${new Date(conversation.savedAt).toLocaleString()}\n\n`;
    content += `---\n\n`;

    if (conversation.messages && conversation.messages.length > 0) {
        conversation.messages.forEach((msg, idx) => {
            content += `## Message ${idx + 1} - ${msg.role || 'Unknown'}\n\n`;
            content += `${msg.content || ''}\n\n`;
            
            if (msg.code && msg.code.length > 0) {
                content += `### Code Snippets\n\n`;
                msg.code.forEach(snippet => {
                    content += `\`\`\`${snippet.language || 'text'}\n${snippet.content}\n\`\`\`\n\n`;
                });
            }
        });
    }

    return content;
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
            // Refresh sidebar to show new conversation
            sidebarProvider.refresh();
            
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
        // Generate context using enhanced extractor v2 (7-point format)
        console.log('✅ Using EnhancedContextExtractor v2 for 7-point format...');
        const extractor = new EnhancedContextExtractor();
        const context = extractor.extractContext(conversation);
        
        if (!context) {
            console.error('❌ Context extraction returned null/undefined!');
            vscode.window.showErrorMessage('Failed to generate context');
            return;
        }
        
        console.log('✅ Generated context:', context.substring(0, 100) + '...');

        // Create a new document with the context
        const doc = await vscode.workspace.openTextDocument({
            content: context,
            language: 'markdown'
        });

        await vscode.window.showTextDocument(doc, { preview: false });
        vscode.window.showInformationMessage('✅ Generated 7-point context summary!');
    } catch (error) {
        console.error('❌ Context extraction failed:', error);
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
 * NEW: Handle detected conversation from clipboard
 */
async function handleDetectedConversation(detectedConversation) {
    try {
        const action = await vscode.window.showInformationMessage(
            `🧠 ${detectedConversation.platform} conversation detected (${detectedConversation.metadata.messageCount} messages)`,
            'Capture Now',
            'Preview',
            'Ignore'
        );
        
        if (action === 'Capture Now') {
            // Convert to our format
            const conversation = {
                id: `clipboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                title: `${detectedConversation.platform} Conversation`,
                messages: detectedConversation.messages,
                messageCount: detectedConversation.metadata.messageCount,
                startTime: Date.now(),
                savedAt: Date.now(),
                platform: detectedConversation.platform,
                metadata: detectedConversation.metadata
            };
            
            const result = await storageManager.storeConversation(conversation);
            
            if (result.success) {
                sidebarProvider.refresh();
                vscode.window.showInformationMessage(
                    `✅ Captured ${detectedConversation.platform} conversation!`
                );
            }
        } else if (action === 'Preview') {
            await showConversationPreview(detectedConversation);
        }
    } catch (error) {
        console.error('Failed to handle detected conversation:', error);
    }
}

/**
 * NEW: Quick capture conversation
 */
async function quickCaptureConversation() {
    try {
        // Check if we have editor context that suggests AI usage
        const aiUsage = editorContextCapture.inferAIAssistantUsage();
        
        if (aiUsage.likelyAISession) {
            const snapshot = editorContextCapture.buildContextSnapshot();
            
            // Create a conversation from editor context
            const conversation = {
                id: `editor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                title: `Editor Session - ${snapshot.workspace || 'Unknown'}`,
                messages: [{
                    role: 'system',
                    content: `Editor context captured. Likely AI assistant session detected.\n\nFiles: ${snapshot.recentActivity.fileSwitches.length}\nEdits: ${snapshot.recentActivity.edits.length}\nSelections: ${snapshot.recentActivity.selections.length}`,
                    timestamp: Date.now()
                }],
                messageCount: 1,
                startTime: Date.now(),
                savedAt: Date.now(),
                platform: 'Editor Context',
                metadata: {
                    aiUsageInference: aiUsage,
                    snapshot: snapshot
                }
            };
            
            const result = await storageManager.storeConversation(conversation);
            
            if (result.success) {
                sidebarProvider.refresh();
                vscode.window.showInformationMessage(
                    `✅ Editor context captured! (Confidence: ${(aiUsage.confidence * 100).toFixed(0)}%)`
                );
            }
        } else {
            // Fall back to clipboard capture
            await vscode.window.showInformationMessage(
                'No active AI session detected. Copy a conversation to clipboard first.',
                'Check Clipboard'
            ).then(action => {
                if (action === 'Check Clipboard') {
                    smartClipboard.checkClipboard();
                }
            });
        }
    } catch (error) {
        errorHandler.handleVSCodeError('quickCaptureConversation', error);
    }
}

/**
 * NEW: Resume conversation in Copilot
 */
async function resumeInCopilot() {
    try {
        const conversations = await storageManager.getAllConversations();
        
        if (conversations.length === 0) {
            vscode.window.showInformationMessage('No conversations to resume');
            return;
        }
        
        // Let user select conversation
        const items = conversations.map((conv, index) => ({
            label: `${index + 1}. ${conv.title || 'Untitled'}`,
            description: `${conv.messageCount} messages - ${new Date(conv.savedAt).toLocaleString()}`,
            detail: conv.platform,
            conversation: conv
        }));
        
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a conversation to resume',
            matchOnDescription: true
        });
        
        if (!selected) return;
        
        // Ask for new prompt (optional)
        const newPrompt = await vscode.window.showInputBox({
            placeHolder: 'Enter your new question or leave empty',
            prompt: 'Optional: What do you want to ask?',
            value: ''
        });
        
        // Assemble context
        vscode.window.showInformationMessage('🔧 Assembling context...');
        
        const assembled = await contextAssembler.assembleForNewSession(
            selected.conversation.id,
            newPrompt || null
        );
        
        // Show preview
        const previewAction = await showContextPreview(assembled);
        
        if (previewAction === 'Copy to Clipboard') {
            await vscode.env.clipboard.writeText(assembled.formatted.copilot);
            
            const action = await vscode.window.showInformationMessage(
                `✅ Context copied! (${assembled.tokens} tokens) - Ready to paste into Copilot Chat`,
                'Open Copilot Chat',
                'Done'
            );
            
            if (action === 'Open Copilot Chat') {
                // Try to open Copilot Chat
                try {
                    await vscode.commands.executeCommand('github.copilot.openChat');
                } catch (e) {
                    vscode.window.showWarningMessage('Could not open Copilot Chat. Please open it manually.');
                }
            }
        }
    } catch (error) {
        errorHandler.handleVSCodeError('resumeInCopilot', error);
    }
}

/**
 * NEW: Show editor context
 */
async function showEditorContext() {
    try {
        const snapshot = editorContextCapture.buildContextSnapshot();
        const aiUsage = snapshot.aiUsageInference;
        
        let content = `# Editor Context Snapshot\n\n`;
        content += `**Timestamp:** ${new Date(snapshot.timestamp).toLocaleString()}\n`;
        content += `**Workspace:** ${snapshot.workspace || 'Unknown'}\n\n`;
        
        if (snapshot.activeFile) {
            content += `## Active File\n`;
            content += `- **File:** ${snapshot.activeFile.fileName}\n`;
            content += `- **Language:** ${snapshot.activeFile.languageId}\n`;
            content += `- **Lines:** ${snapshot.activeFile.lineCount}\n\n`;
        }
        
        content += `## AI Assistant Detection\n`;
        content += `- **Likely AI Session:** ${aiUsage.likelyCopilotSession ? 'Yes' : 'No'}\n`;
        content += `- **Confidence:** ${(aiUsage.confidence * 100).toFixed(0)}%\n`;
        content += `- **Indicators:**\n`;
        content += `  - Rapid File Switches: ${aiUsage.indicators.rapidFileSwitches}\n`;
        content += `  - Code Selections: ${aiUsage.indicators.hasSelections}\n`;
        content += `  - Rapid Edits: ${aiUsage.indicators.rapidEdits}\n\n`;
        
        content += `## Recent Activity\n`;
        content += `- **Edits:** ${snapshot.recentActivity.edits.length}\n`;
        content += `- **File Switches:** ${snapshot.recentActivity.fileSwitches.length}\n`;
        content += `- **Selections:** ${snapshot.recentActivity.selections.length}\n`;
        content += `- **Commands:** ${snapshot.recentActivity.commands.length}\n\n`;
        
        if (snapshot.recentActivity.selections.length > 0) {
            content += `### Recent Code Selections\n`;
            snapshot.recentActivity.selections.slice(0, 3).forEach((sel, idx) => {
                content += `\n#### Selection ${idx + 1}\n`;
                content += `**File:** ${sel.file}\n`;
                content += `**Lines:** ${sel.range.start}-${sel.range.end}\n`;
                content += `\`\`\`${sel.languageId}\n${sel.text}\n\`\`\`\n`;
            });
        }
        
        const doc = await vscode.workspace.openTextDocument({
            content: content,
            language: 'markdown'
        });
        
        await vscode.window.showTextDocument(doc, { preview: false });
    } catch (error) {
        errorHandler.handleVSCodeError('showEditorContext', error);
    }
}

/**
 * NEW: Preview context assembly
 */
async function previewContextAssembly() {
    try {
        const conversations = await storageManager.getAllConversations();
        
        if (conversations.length === 0) {
            vscode.window.showInformationMessage('No conversations available');
            return;
        }
        
        // Let user select conversation
        const items = conversations.map((conv, index) => ({
            label: `${index + 1}. ${conv.title || 'Untitled'}`,
            description: `${conv.messageCount} messages`,
            conversation: conv
        }));
        
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select conversation to preview context assembly'
        });
        
        if (!selected) return;
        
        // Assemble context
        const assembled = await contextAssembler.assembleForNewSession(
            selected.conversation.id
        );
        
        await showContextPreview(assembled);
    } catch (error) {
        errorHandler.handleVSCodeError('previewContextAssembly', error);
    }
}

/**
 * NEW: Show context preview
 */
async function showContextPreview(assembled) {
    const content = `# Context Assembly Preview\n\n` +
        `**Token Count:** ${assembled.tokens} / ${contextAssembler.tokenLimits.total}\n` +
        `**Compression:** ${assembled.metadata.compressionApplied ? 'Applied' : 'Not needed'}\n` +
        `**Platform:** ${assembled.metadata.platform}\n\n` +
        `---\n\n` +
        assembled.formatted.markdown;
    
    const doc = await vscode.workspace.openTextDocument({
        content: content,
        language: 'markdown'
    });
    
    await vscode.window.showTextDocument(doc, { preview: false });
    
    return await vscode.window.showInformationMessage(
        `📋 Context Preview (${assembled.tokens} tokens)`,
        'Copy to Clipboard',
        'Copy as JSON',
        'Close'
    );
}

/**
 * NEW: Show conversation preview
 */
async function showConversationPreview(detectedConversation) {
    let content = `# Detected ${detectedConversation.platform} Conversation\n\n`;
    content += `**Confidence:** ${(detectedConversation.confidence * 100).toFixed(0)}%\n`;
    content += `**Messages:** ${detectedConversation.metadata.messageCount}\n`;
    content += `**Has Code:** ${detectedConversation.metadata.hasCodeBlocks ? 'Yes' : 'No'}\n\n`;
    content += `---\n\n`;
    
    detectedConversation.messages.forEach((msg, idx) => {
        content += `## Message ${idx + 1} - ${msg.role}\n\n`;
        content += `${msg.content}\n\n`;
        
        if (msg.codeBlocks && msg.codeBlocks.length > 0) {
            content += `### Code Blocks\n\n`;
            msg.codeBlocks.forEach(block => {
                content += `\`\`\`${block.language}\n${block.code}\n\`\`\`\n\n`;
            });
        }
    });
    
    const doc = await vscode.workspace.openTextDocument({
        content: content,
        language: 'markdown'
    });
    
    await vscode.window.showTextDocument(doc, { preview: false });
}

/**
 * NEW: Show what's new
 */
async function showWhatsNew() {
    const content = `# 🎉 What's New in Remember v4.0

## 🚀 Major Features

### 1. Multi-Layer Capture System
- **Editor Context Capture**: Automatically tracks your coding activity
- **Smart Clipboard Monitoring**: Detects conversations from 5+ AI platforms
- **AI Session Detection**: Infers when you're using Copilot with 70%+ confidence

### 2. Context Assembler V2
- **4-Layer Architecture**: Role, Canonical State, Recent Context, Relevant History
- **Token Budget Management**: Automatically fits within 1,600 tokens
- **Smart Compression**: Prioritized compression when needed
- **Multi-Format Output**: Markdown, Copilot-optimized, JSON

### 3. Resume Chat Feature
- **One-Click Resume**: Continue any conversation with full context
- **Editable Preview**: Review and edit before sending
- **Copilot Integration**: Auto-open Copilot Chat
- **Cross-Platform**: Works with ChatGPT, Claude, Gemini, and more

### 4. Quick Capture
- **Status Bar Button**: Always-visible capture button
- **Smart Detection**: Suggests capture after AI activity
- **Keyboard Shortcut**: Ctrl+Shift+C for quick capture

## 🎨 Improvements
- Enhanced clipboard detection (5+ AI platforms)
- Better conversation parsing
- Improved error handling
- Richer editor context

## 🔧 New Commands
- \`Remember: Quick Capture\` (Ctrl+Shift+C)
- \`Remember: Resume in Copilot\`
- \`Remember: Show Editor Context\`
- \`Remember: Preview Context\`

## 💡 Tips
1. Copy any AI conversation to clipboard - Remember will detect it
2. Use "Resume in Copilot" to continue conversations seamlessly
3. Check "Show Editor Context" to see if AI usage is detected
4. The status bar button shows when capture is available

Enjoy the enhanced AI memory! 🧠✨
`;
    
    const doc = await vscode.workspace.openTextDocument({
        content: content,
        language: 'markdown'
    });
    
    await vscode.window.showTextDocument(doc, { preview: false });
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
