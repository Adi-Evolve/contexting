const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

// Import context extractor (same logic as Chrome extension)
class ContextExtractor {
    // ... (we'll copy the same extraction logic)
    
    extractContext(conversation) {
        const components = {
            userIdentity: this.extractUserIdentity(conversation.messages),
            purpose: this.extractPurpose(conversation),
            keyInfo: this.extractKeyInformation(conversation),
            failures: this.extractFailuresAndRules(conversation.messages),
            preferences: this.extractPreferences(conversation.messages),
            importantPrompts: this.extractImportantPrompts(conversation.messages),
            openTasks: this.extractOpenTasks(conversation.messages),
            metadata: {
                conversationId: conversation.id,
                timestamp: new Date().toISOString(),
                messageCount: conversation.messages.length
            }
        };
        
        return this.generateContextFile(components);
    }

    extractUserIdentity(messages) {
        const userMessages = messages.filter(m => m.role === 'user');
        const totalLength = userMessages.reduce((sum, m) => sum + m.content.length, 0);
        const avgLength = userMessages.length > 0 ? Math.round(totalLength / userMessages.length) : 0;
        
        const styles = [];
        if (avgLength < 50) styles.push('Concise, direct communication');
        else if (avgLength > 200) styles.push('Detailed, thorough explanations');
        else styles.push('Balanced, clear communication');
        
        const hasCode = userMessages.some(m => m.content.includes('```') || m.content.includes('function') || m.content.includes('const '));
        if (hasCode) styles.push('Technical, code-focused');
        
        return {
            style: styles,
            messageCount: userMessages.length,
            avgLength
        };
    }

    extractPurpose(conversation) {
        if (conversation.title) return conversation.title;
        
        const firstUserMsg = conversation.messages.find(m => m.role === 'user');
        if (firstUserMsg) {
            return firstUserMsg.content.substring(0, 100).trim();
        }
        
        return 'VS Code conversation';
    }

    extractKeyInformation(conversation) {
        const keyFacts = [];
        const messages = conversation.messages;
        
        // Extract file names mentioned
        const filePattern = /[a-zA-Z0-9_-]+\.(js|ts|py|java|cpp|css|html|json|md|txt)/g;
        const files = new Set();
        messages.forEach(m => {
            const matches = m.content.match(filePattern);
            if (matches) matches.forEach(f => files.add(f));
        });
        
        if (files.size > 0) {
            keyFacts.push(`Files discussed: ${Array.from(files).slice(0, 5).join(', ')}`);
        }
        
        // Extract key topics
        const hasError = messages.some(m => m.content.toLowerCase().includes('error') || m.content.toLowerCase().includes('bug'));
        if (hasError) keyFacts.push('Debugging/error resolution');
        
        const hasImplement = messages.some(m => m.content.toLowerCase().includes('implement') || m.content.toLowerCase().includes('create'));
        if (hasImplement) keyFacts.push('Implementation task');
        
        const hasRefactor = messages.some(m => m.content.toLowerCase().includes('refactor') || m.content.toLowerCase().includes('improve'));
        if (hasRefactor) keyFacts.push('Code refactoring');
        
        return keyFacts.length > 0 ? keyFacts : ['General coding discussion'];
    }

    extractFailuresAndRules(messages) {
        const failures = [];
        const failureKeywords = ['wrong', 'no', 'not this', 'incorrect', 'failed', 'error', 'bug', 'issue', 'problem', 'doesn\'t work'];
        
        for (let i = 0; i < messages.length - 1; i++) {
            const current = messages[i];
            const next = messages[i + 1];
            
            if (current.role === 'assistant' && next.role === 'user') {
                const hasFailureKeyword = failureKeywords.some(keyword => 
                    next.content.toLowerCase().includes(keyword)
                );
                
                if (hasFailureKeyword) {
                    failures.push({
                        whatHappened: current.content.substring(0, 100),
                        correction: next.content.substring(0, 100),
                        rule: this.extractRuleFromCorrection(next.content)
                    });
                }
            }
        }
        
        return failures;
    }

    extractRuleFromCorrection(correctionText) {
        const text = correctionText.toLowerCase();
        
        if (text.includes('should') || text.includes('must')) {
            const shouldMatch = correctionText.match(/should [^.!?]+[.!?]/i);
            if (shouldMatch) return shouldMatch[0];
        }
        
        return correctionText.substring(0, 80).trim();
    }

    extractPreferences(messages) {
        const always = [];
        const never = [];
        const alwaysKeywords = ['always', 'make sure', 'remember to', 'don\'t forget'];
        const neverKeywords = ['never', 'don\'t', 'avoid', 'stop'];
        
        messages.filter(m => m.role === 'user').forEach(msg => {
            const text = msg.content.toLowerCase();
            
            alwaysKeywords.forEach(keyword => {
                if (text.includes(keyword)) {
                    const sentence = this.extractSentenceWithKeyword(msg.content, keyword);
                    if (sentence && !always.includes(sentence)) {
                        always.push(sentence);
                    }
                }
            });
            
            neverKeywords.forEach(keyword => {
                if (text.includes(keyword)) {
                    const sentence = this.extractSentenceWithKeyword(msg.content, keyword);
                    if (sentence && !never.includes(sentence)) {
                        never.push(sentence);
                    }
                }
            });
        });
        
        return { always: always.slice(0, 5), never: never.slice(0, 5) };
    }

    extractSentenceWithKeyword(text, keyword) {
        const sentences = text.split(/[.!?]+/);
        const found = sentences.find(s => s.toLowerCase().includes(keyword));
        return found ? found.trim().substring(0, 80) : null;
    }

    extractImportantPrompts(messages) {
        const userMessages = messages.filter(m => m.role === 'user');
        
        const scored = userMessages.map(msg => ({
            content: msg.content,
            score: this.scorePromptImportance(msg, messages)
        }));
        
        scored.sort((a, b) => b.score - a.score);
        
        return scored.slice(0, 3).map(s => s.content.substring(0, 150));
    }

    scorePromptImportance(message, allMessages) {
        let score = 0;
        
        // Length scoring
        score += message.content.length * 0.1;
        
        // Has question
        if (message.content.includes('?')) score += 50;
        
        // Has code block
        if (message.content.includes('```')) score += 100;
        
        // Contains error keywords
        if (/error|bug|issue|problem|wrong/i.test(message.content)) score += 80;
        
        // Contains implementation keywords
        if (/create|implement|add|build|make/i.test(message.content)) score += 60;
        
        return score;
    }

    extractOpenTasks(messages) {
        const tasks = [];
        const recentMessages = messages.slice(-5);
        const taskKeywords = ['todo', 'need to', 'should', 'must', 'can you', 'please', 'next'];
        
        recentMessages.filter(m => m.role === 'user').forEach(msg => {
            const text = msg.content.toLowerCase();
            const hasTaskKeyword = taskKeywords.some(kw => text.includes(kw));
            
            if (hasTaskKeyword && msg.content.includes('?')) {
                tasks.push(msg.content.substring(0, 100).trim());
            }
        });
        
        return tasks.slice(0, 3);
    }

    generateContextFile(components) {
        const { userIdentity, purpose, keyInfo, failures, preferences, importantPrompts, openTasks, metadata } = components;
        
        let markdown = `# Context: ${purpose.substring(0, 60)}

## 1. User Style
${userIdentity.style.join(', ')}

## 2. Goal
${purpose}

## 3. Key Facts
${keyInfo.slice(0, 5).join('; ')}

## 4. Corrections
`;

        if (failures.length > 0) {
            failures.forEach((failure, i) => {
                markdown += `**${i + 1}.** ${failure.correction}\n`;
                markdown += `   Rule: ${failure.rule}\n\n`;
            });
        } else {
            markdown += `None\n\n`;
        }

        markdown += `## 5. Preferences
`;
        
        if (preferences.always.length > 0 || preferences.never.length > 0) {
            if (preferences.always.length > 0) {
                markdown += `Always: ${preferences.always.join(', ')}\n`;
            }
            if (preferences.never.length > 0) {
                markdown += `Never: ${preferences.never.join(', ')}\n`;
            }
        } else {
            markdown += `None specified\n`;
        }

        markdown += `\n## 6. Key Messages
`;
        
        if (importantPrompts.length > 0) {
            importantPrompts.forEach((prompt, i) => {
                markdown += `${i + 1}. ${prompt}\n`;
            });
        } else {
            markdown += `None\n`;
        }

        markdown += `\n## 7. Open Tasks
`;
        
        if (openTasks.length > 0) {
            openTasks.forEach(task => markdown += `- ${task}\n`);
        } else {
            markdown += `None\n`;
        }

        return markdown;
    }
}

// Conversation storage manager
class ConversationManager {
    constructor(context) {
        this.context = context;
        this.conversations = [];
        this.currentConversation = null;
        this.extractor = new ContextExtractor();
        this.loadConversations();
    }

    loadConversations() {
        const stored = this.context.globalState.get('conversations', []);
        this.conversations = stored;
    }

    saveConversations() {
        const maxConversations = vscode.workspace.getConfiguration('memoryforge').get('maxConversations', 100);
        const toSave = this.conversations.slice(-maxConversations);
        this.context.globalState.update('conversations', toSave);
    }

    startNewConversation() {
        this.currentConversation = {
            id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: 'VS Code Conversation',
            messages: [],
            startedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    addMessage(role, content) {
        if (!this.currentConversation) {
            this.startNewConversation();
        }

        this.currentConversation.messages.push({
            role,
            content,
            timestamp: new Date().toISOString()
        });

        this.currentConversation.updatedAt = new Date().toISOString();

        // Auto-save every 3 messages
        if (this.currentConversation.messages.length % 3 === 0) {
            this.saveCurrentConversation();
        }
    }

    saveCurrentConversation() {
        if (!this.currentConversation || this.currentConversation.messages.length === 0) {
            return;
        }

        // Update title from first message if still default
        if (this.currentConversation.title === 'VS Code Conversation' && this.currentConversation.messages.length > 0) {
            const firstUserMsg = this.currentConversation.messages.find(m => m.role === 'user');
            if (firstUserMsg) {
                this.currentConversation.title = firstUserMsg.content.substring(0, 50).trim();
            }
        }

        // Check if already exists
        const existingIndex = this.conversations.findIndex(c => c.id === this.currentConversation.id);
        if (existingIndex >= 0) {
            this.conversations[existingIndex] = this.currentConversation;
        } else {
            this.conversations.push(this.currentConversation);
        }

        this.saveConversations();
    }

    exportAsOptimalContext(conversationId) {
        const conversation = this.conversations.find(c => c.id === conversationId);
        if (!conversation) return null;

        return this.extractor.extractContext(conversation);
    }

    getAllConversations() {
        return this.conversations.slice().reverse(); // Most recent first
    }
}

// Sidebar tree view provider
class ConversationTreeProvider {
    constructor(conversationManager) {
        this.conversationManager = conversationManager;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element) {
        return element;
    }

    getChildren(element) {
        if (element) {
            return [];
        }

        const conversations = this.conversationManager.getAllConversations();
        
        return conversations.map(conv => {
            const item = new vscode.TreeItem(
                conv.title,
                vscode.TreeItemCollapsibleState.None
            );
            
            item.description = `${conv.messages.length} messages`;
            item.tooltip = `${conv.messages.length} messages\nStarted: ${new Date(conv.startedAt).toLocaleString()}`;
            item.contextValue = 'conversation';
            item.id = conv.id;
            
            item.command = {
                command: 'memoryforge.viewConversationDetail',
                title: 'View Conversation',
                arguments: [conv.id]
            };
            
            return item;
        });
    }
}

let conversationManager;
let treeProvider;

function activate(context) {
    console.log('MemoryForge VS Code extension activated');

    // Initialize conversation manager
    conversationManager = new ConversationManager(context);

    // Initialize tree view
    treeProvider = new ConversationTreeProvider(conversationManager);
    vscode.window.registerTreeDataProvider('memoryforge.conversations', treeProvider);

    // AUTOMATIC CAPTURE: Monitor GitHub Copilot Chat
    const autoCapture = vscode.workspace.getConfiguration('memoryforge').get('autoCapture', true);
    
    if (autoCapture) {
        console.log('🎯 MemoryForge: Auto-capture enabled for Copilot Chat');
        
        // Listen to chat participant API
        setupCopilotChatMonitoring(context);
        
        // Also monitor file changes for chat history
        setupFileSystemMonitoring(context);
    }

    // Command: Capture current conversation
    context.subscriptions.push(
        vscode.commands.registerCommand('memoryforge.captureConversation', async () => {
            const chatPanel = vscode.window.activeTextEditor;
            
            if (!chatPanel) {
                vscode.window.showWarningMessage('No active editor found');
                return;
            }

            // Get selected text or full document
            const selection = chatPanel.selection;
            const text = selection.isEmpty 
                ? chatPanel.document.getText()
                : chatPanel.document.getText(selection);

            if (!text) {
                vscode.window.showWarningMessage('No text to capture');
                return;
            }

            // Parse conversation from text
            const conversation = parseConversationText(text);
            
            if (conversation.messages.length === 0) {
                vscode.window.showWarningMessage('No valid conversation found in text');
                return;
            }

            conversationManager.currentConversation = conversation;
            conversationManager.saveCurrentConversation();
            treeProvider.refresh();

            vscode.window.showInformationMessage(`✅ Captured conversation with ${conversation.messages.length} messages`);
        })
    );

    // Command: Export as optimal context
    context.subscriptions.push(
        vscode.commands.registerCommand('memoryforge.exportContext', async () => {
            const conversations = conversationManager.getAllConversations();
            
            if (conversations.length === 0) {
                vscode.window.showWarningMessage('No conversations to export');
                return;
            }

            // Show quick pick
            const items = conversations.map(conv => ({
                label: conv.title,
                description: `${conv.messages.length} messages`,
                conversationId: conv.id
            }));

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select conversation to export'
            });

            if (!selected) return;

            const optimalContext = conversationManager.exportAsOptimalContext(selected.conversationId);
            
            if (!optimalContext) {
                vscode.window.showErrorMessage('Failed to generate context');
                return;
            }

            // Save to file
            const uri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(`context_${selected.conversationId}.md`),
                filters: {
                    'Markdown': ['md'],
                    'Text': ['txt']
                }
            });

            if (uri) {
                fs.writeFileSync(uri.fsPath, optimalContext, 'utf8');
                vscode.window.showInformationMessage(`✅ Context exported to ${path.basename(uri.fsPath)}`);
                
                // Open the file
                const doc = await vscode.workspace.openTextDocument(uri);
                await vscode.window.showTextDocument(doc);
            }
        })
    );

    // Command: View all conversations
    context.subscriptions.push(
        vscode.commands.registerCommand('memoryforge.viewConversations', () => {
            vscode.commands.executeCommand('workbench.view.extension.memoryforge-sidebar');
        })
    );

    // Command: View conversation detail
    context.subscriptions.push(
        vscode.commands.registerCommand('memoryforge.viewConversationDetail', async (conversationId) => {
            const conversations = conversationManager.getAllConversations();
            const conversation = conversations.find(c => c.id === conversationId);
            
            if (!conversation) return;

            // Create a new document with conversation details
            const content = formatConversationForDisplay(conversation);
            const doc = await vscode.workspace.openTextDocument({
                content,
                language: 'markdown'
            });
            
            await vscode.window.showTextDocument(doc, { preview: true });
        })
    );

    // Command: Import context
    context.subscriptions.push(
        vscode.commands.registerCommand('memoryforge.importContext', async () => {
            const uris = await vscode.window.showOpenDialog({
                canSelectMany: false,
                filters: {
                    'Markdown': ['md'],
                    'Text': ['txt']
                },
                title: 'Import Context File'
            });

            if (!uris || uris.length === 0) return;

            const content = fs.readFileSync(uris[0].fsPath, 'utf8');
            
            // Open in new document
            const doc = await vscode.workspace.openTextDocument({
                content,
                language: 'markdown'
            });
            
            await vscode.window.showTextDocument(doc);
            
            vscode.window.showInformationMessage('✅ Context imported! You can now copy this to your chat.');
        })
    );
}

// Parse conversation text into structured format
function parseConversationText(text) {
    const conversation = {
        id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: 'Captured Conversation',
        messages: [],
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    // Try to detect conversation format
    const lines = text.split('\n');
    let currentRole = null;
    let currentContent = [];

    for (const line of lines) {
        // Detect role changes
        if (line.match(/^(User|Human|You):/i)) {
            if (currentRole && currentContent.length > 0) {
                conversation.messages.push({
                    role: currentRole,
                    content: currentContent.join('\n').trim(),
                    timestamp: new Date().toISOString()
                });
            }
            currentRole = 'user';
            currentContent = [line.replace(/^(User|Human|You):/i, '').trim()];
        } else if (line.match(/^(Assistant|AI|Copilot|GitHub Copilot):/i)) {
            if (currentRole && currentContent.length > 0) {
                conversation.messages.push({
                    role: currentRole,
                    content: currentContent.join('\n').trim(),
                    timestamp: new Date().toISOString()
                });
            }
            currentRole = 'assistant';
            currentContent = [line.replace(/^(Assistant|AI|Copilot|GitHub Copilot):/i, '').trim()];
        } else if (currentRole) {
            currentContent.push(line);
        }
    }

    // Add last message
    if (currentRole && currentContent.length > 0) {
        conversation.messages.push({
            role: currentRole,
            content: currentContent.join('\n').trim(),
            timestamp: new Date().toISOString()
        });
    }

    // If no structured format detected, treat as single user message
    if (conversation.messages.length === 0) {
        conversation.messages.push({
            role: 'user',
            content: text.trim(),
            timestamp: new Date().toISOString()
        });
    }

    // Set title from first message
    if (conversation.messages.length > 0) {
        const firstMsg = conversation.messages[0];
        conversation.title = firstMsg.content.substring(0, 50).trim();
    }

    return conversation;
}

// Format conversation for display
function formatConversationForDisplay(conversation) {
    let output = `# ${conversation.title}\n\n`;
    output += `**Started:** ${new Date(conversation.startedAt).toLocaleString()}\n`;
    output += `**Messages:** ${conversation.messages.length}\n\n`;
    output += `---\n\n`;

    conversation.messages.forEach((msg, index) => {
        const roleLabel = msg.role === 'user' ? '👤 User' : '🤖 Assistant';
        output += `## ${roleLabel} (Message ${index + 1})\n\n`;
        output += `${msg.content}\n\n`;
        output += `---\n\n`;
    });

    return output;
}

// AUTOMATIC MONITORING: GitHub Copilot Chat
function setupCopilotChatMonitoring(context) {
    // Monitor chat requests and responses
    try {
        // Listen to language model chat requests (VS Code API)
        const chatRequestHandler = vscode.chat.registerChatRequestHandler(
            'memoryforge',
            async (request, context, stream, token) => {
                // Capture user message
                const userMessage = request.prompt;
                conversationManager.addMessage('user', userMessage);
                
                console.log('✅ Captured user message:', userMessage.substring(0, 50));
                
                // This handler doesn't respond, just captures
                return { metadata: { captured: true } };
            }
        );
        
        context.subscriptions.push(chatRequestHandler);
    } catch (error) {
        console.log('⚠️ Chat API not available, using fallback monitoring');
        setupFallbackMonitoring(context);
    }
}

// FALLBACK: Monitor clipboard and active editor for chat patterns
function setupFallbackMonitoring(context) {
    // Watch for changes in active text editor
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument((event) => {
            const doc = event.document;
            
            // Check if this is a chat-related document
            if (doc.uri.scheme === 'vscode-chat' || 
                doc.fileName.includes('copilot') || 
                doc.fileName.includes('chat')) {
                
                // Extract conversation from document changes
                const text = doc.getText();
                const messages = extractMessagesFromText(text);
                
                if (messages.length > 0) {
                    messages.forEach(msg => {
                        conversationManager.addMessage(msg.role, msg.content);
                    });
                    
                    console.log(`✅ Auto-captured ${messages.length} messages from chat`);
                }
            }
        })
    );
    
    // Monitor clipboard for copied chat conversations
    let lastClipboard = '';
    setInterval(async () => {
        try {
            const currentClipboard = await vscode.env.clipboard.readText();
            
            if (currentClipboard !== lastClipboard && currentClipboard.length > 50) {
                lastClipboard = currentClipboard;
                
                // Check if clipboard contains chat conversation
                if (isChatConversation(currentClipboard)) {
                    const messages = extractMessagesFromText(currentClipboard);
                    
                    if (messages.length >= 2) {
                        conversationManager.startNewConversation();
                        messages.forEach(msg => {
                            conversationManager.addMessage(msg.role, msg.content);
                        });
                        conversationManager.saveCurrentConversation();
                        treeProvider.refresh();
                        
                        vscode.window.showInformationMessage(
                            `🧠 MemoryForge: Auto-captured ${messages.length} messages`
                        );
                    }
                }
            }
        } catch (error) {
            // Clipboard access error
        }
    }, 2000); // Check every 2 seconds
}

// AUTOMATIC: Monitor file system for chat history files
function setupFileSystemMonitoring(context) {
    // VS Code stores chat history in workspace storage
    const chatHistoryPattern = new vscode.RelativePattern(
        vscode.workspace.workspaceFolders?.[0] || vscode.Uri.file(process.env.HOME || ''),
        '**/.vscode/chat_history*.json'
    );
    
    const watcher = vscode.workspace.createFileSystemWatcher(chatHistoryPattern);
    
    watcher.onDidChange(async (uri) => {
        try {
            const content = await vscode.workspace.fs.readFile(uri);
            const text = Buffer.from(content).toString('utf8');
            const data = JSON.parse(text);
            
            // Process chat history
            if (data.messages && Array.isArray(data.messages)) {
                conversationManager.startNewConversation();
                data.messages.forEach(msg => {
                    conversationManager.addMessage(
                        msg.role || 'user',
                        msg.content || msg.text || ''
                    );
                });
                conversationManager.saveCurrentConversation();
                treeProvider.refresh();
                
                console.log('✅ Auto-captured conversation from file system');
            }
        } catch (error) {
            console.log('Chat history file monitoring error:', error);
        }
    });
    
    context.subscriptions.push(watcher);
}

// Helper: Detect if text is a chat conversation
function isChatConversation(text) {
    const chatIndicators = [
        /^(User|Human|You):/im,
        /^(Assistant|AI|Copilot|GitHub Copilot):/im,
        /(User|You|Human).*(Assistant|AI|Copilot)/is,
        /\n\s*>\s*.+\n/m // Quoted text
    ];
    
    return chatIndicators.some(pattern => pattern.test(text));
}

// Helper: Extract messages from text
function extractMessagesFromText(text) {
    const messages = [];
    const lines = text.split('\n');
    let currentRole = null;
    let currentContent = [];
    
    for (const line of lines) {
        // Detect role changes
        if (line.match(/^(User|Human|You):/i)) {
            if (currentRole && currentContent.length > 0) {
                messages.push({
                    role: currentRole,
                    content: currentContent.join('\n').trim()
                });
            }
            currentRole = 'user';
            currentContent = [line.replace(/^(User|Human|You):/i, '').trim()];
        } else if (line.match(/^(Assistant|AI|Copilot|GitHub Copilot):/i)) {
            if (currentRole && currentContent.length > 0) {
                messages.push({
                    role: currentRole,
                    content: currentContent.join('\n').trim()
                });
            }
            currentRole = 'assistant';
            currentContent = [line.replace(/^(Assistant|AI|Copilot|GitHub Copilot):/i, '').trim()];
        } else if (currentRole) {
            currentContent.push(line);
        }
    }
    
    // Add last message
    if (currentRole && currentContent.length > 0) {
        messages.push({
            role: currentRole,
            content: currentContent.join('\n').trim()
        });
    }
    
    return messages.filter(m => m.content.length > 0);
}

function deactivate() {
    if (conversationManager) {
        conversationManager.saveCurrentConversation();
    }
}

module.exports = {
    activate,
    deactivate
};
