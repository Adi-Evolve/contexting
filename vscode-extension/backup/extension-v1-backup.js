const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

// Load conversation threader, language detector, and tool tracker
const ConversationThreader = require('./conversation-threader.js');
const CodeLanguageDetector = require('./code-language-detector.js');
const ToolUsageTracker = require('./tool-usage-tracker.js');

// Enhanced Context Extractor - Compressed 7-Point Format
class EnhancedContextExtractor {
    
    constructor() {
        // Initialize all analyzers
        this.threader = new ConversationThreader();
        this.languageDetector = new CodeLanguageDetector();
        this.toolTracker = new ToolUsageTracker();
    }
    
    extractContext(conversation) {
        return this.generateDetailedContext(conversation);
    }
    
    generateDetailedContext(conversation) {
        const title = conversation.title || 'VS Code Conversation';
        const messages = conversation.messages || [];
        
        // Extract all 7 components
        const userStyle = this.extractUserStyle(messages);
        const purpose = this.extractPurpose(conversation);
        const keyFacts = this.extractKeyFacts(messages);
        const corrections = this.findCorrections(messages);
        const preferences = this.extractPreferences(messages);
        const importantPrompts = this.extractImportantPrompts(messages);
        const openTasks = this.extractOpenTasks(messages);
        
        // Add metadata
        const timestamp = conversation.startedAt ? new Date(conversation.startedAt).toLocaleString() : new Date().toLocaleString();
        const messageCount = messages.length;
        const exchanges = Math.floor(messageCount / 2);
        
        let markdown = `# Context: ${title}

*Generated: ${timestamp} | ${exchanges} exchanges | Source: VS Code*

---


## 1. User Communication Style
${userStyle}

## 2. Purpose & Goal
${purpose}

## 3. Key Information Summary
${keyFacts}

## 4. Corrections & Rules to Prevent Failures
`;

        if (corrections.length > 0) {
            corrections.forEach((correction, i) => {
                markdown += `\n**Issue ${i + 1}:**\n`;
                markdown += `❌ Wrong approach: ${correction.issue}\n`;
                markdown += `✅ Correct approach: ${correction.lesson}\n`;
            });
        } else {
            markdown += `No corrections - conversation went smoothly.\n`;
        }
        
        markdown += `\n## 5. User Preferences & Requirements

`;
        markdown += preferences;
        
        markdown += `\n## 6. Important Prompts to Preserve

`;
        markdown += importantPrompts;
        
        markdown += `\n## 7. Open Tasks & Next Steps

`;
        markdown += openTasks;
        
        // TOOL USAGE TRACKING (if available)
        if (this.toolTracker) {
            const toolUsage = this.toolTracker.trackConversation(messages);
            const toolCount = Object.keys(toolUsage.tools).length + 
                             toolUsage.vscodeExtensions.length + 
                             toolUsage.vscodeCommands.length;
            
            if (toolCount > 0) {
                markdown += `\n---

## 🛠️ Tools & Technologies

`;
                markdown += this.toolTracker.generateSummary(toolUsage);
            }
        }
        
        // CONVERSATION THREADING (if available)
        if (this.threader && messages.length >= 6) {
            const threads = this.threader.analyzeConversation(messages);
            
            if (threads.length > 1) {
                markdown += `\n---

## 🧵 Conversation Threads

*Detected ${threads.length} distinct topics within this conversation:*

`;
                threads.forEach((thread, i) => {
                    markdown += `**Thread ${i + 1}: ${thread.title}**\n`;
                    markdown += `- Topic: ${thread.topic}\n`;
                    markdown += `- Messages: ${thread.startIndex + 1}-${thread.endIndex + 1} (${thread.messages.length} messages)\n`;
                    markdown += `- Confidence: ${(thread.confidence * 100).toFixed(0)}%\n\n`;
                });
            }
        }
        
        markdown += `\n---

## 📝 Compressed Conversation Summary

`;
        
        // COMPRESSED: Only prompts + AI response summaries (NOT full text)
        markdown += this.generateCompressedSummary(messages);
        
        return markdown;
    }

    extractUserStyle(messages) {
        const userMessages = messages.filter(m => m.role === 'user');
        
        if (userMessages.length === 0) return 'Not enough data';
        
        const avgLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length;
        const hasCode = userMessages.some(m => m.content.includes('```') || /function|const|class|def /i.test(m.content));
        const questionCount = userMessages.filter(m => m.content.includes('?')).length;
        
        let style = [];
        
        if (avgLength < 50) {
            style.push('Concise, direct questions');
        } else if (avgLength > 200) {
            style.push('Detailed, context-rich communication');
        } else {
            style.push('Balanced, clear communication');
        }
        
        if (hasCode) {
            style.push('Technical, includes code examples');
        }
        
        if (questionCount > userMessages.length * 0.6) {
            style.push('Question-driven learning approach');
        }
        
        return style.join(', ');
    }

    extractPurpose(conversation) {
        if (conversation.title) return conversation.title;
        
        const firstUserMsg = conversation.messages.find(m => m.role === 'user');
        if (firstUserMsg) {
            return firstUserMsg.content.substring(0, 100).trim();
        }
        
        return 'VS Code conversation';
    }

    extractKeyFacts(messages) {
        const facts = [];
        
        // Extract main topics discussed
        const topics = this.extractMainTopics(messages);
        if (topics) {
            facts.push(`**Topics:** ${topics.replace(/\n/g, ', ')}`);
        }
        
        // Count exchanges
        const exchanges = Math.floor(messages.length / 2);
        facts.push(`**Exchanges:** ${exchanges} back-and-forth conversations`);
        
        // Detect programming languages used
        if (this.languageDetector) {
            const langAnalysis = this.languageDetector.analyzeConversation(messages);
            if (langAnalysis.languages.length > 0) {
                const langList = langAnalysis.languages
                    .slice(0, 3)
                    .map(l => `${l.language} (${l.occurrences}x)`)
                    .join(', ');
                facts.push(`**Languages:** ${langList}`);
            }
        } else {
            // Fallback: basic code detection
            const hasCode = messages.some(m => m.content.includes('```'));
            if (hasCode) {
                facts.push(`**Nature:** Technical discussion with code examples`);
            }
        }
        
        return facts.join('\n');
    }
    
    extractMainTopics(messages) {
        const topics = new Set();
        
        messages.forEach(msg => {
            // Extract potential topics from user questions
            if (msg.role === 'user') {
                const questionPatterns = [
                    /what is ([\w\s]+)/gi,
                    /how (to|do|does|can) ([\w\s]+)/gi,
                    /explain ([\w\s]+)/gi,
                    /tell me about ([\w\s]+)/gi,
                    /difference between ([\w\s]+)/gi
                ];
                
                questionPatterns.forEach(pattern => {
                    const matches = msg.content.matchAll(pattern);
                    for (const match of matches) {
                        if (match[1] || match[2]) {
                            const topic = (match[1] || match[2]).trim().substring(0, 50);
                            if (topic.length > 3) {
                                topics.add(topic);
                            }
                        }
                    }
                });
            }
        });
        
        if (topics.size === 0) {
            // Fallback: use first user message
            const firstUser = messages.find(m => m.role === 'user');
            if (firstUser) {
                return `- ${firstUser.content.substring(0, 100)}...\n`;
            }
            return '- General discussion\n';
        }
        
        return Array.from(topics).slice(0, 5).map(t => `- ${t}`).join('\n') + '\n';
    }

    findCorrections(messages) {
        const corrections = [];
        const failureKeywords = ['wrong', 'no', 'not this', 'incorrect', 'failed', 'error', 'bug', 'issue', 'doesn\'t work'];
        
        for (let i = 0; i < messages.length - 1; i++) {
            const current = messages[i];
            const next = messages[i + 1];
            
            if (current.role === 'assistant' && next.role === 'user') {
                const hasFailure = failureKeywords.some(kw => next.content.toLowerCase().includes(kw));
                
                if (hasFailure) {
                    corrections.push({
                        issue: current.content.substring(0, 80) + '...',
                        lesson: next.content.substring(0, 100) + '...'
                    });
                }
            }
        }
        
        return corrections;
    }

    extractPreferences(messages) {
        const preferences = {
            always: [],
            never: []
        };
        
        const alwaysKeywords = ['always', 'make sure', 'remember to', "don't forget", 'please'];
        const neverKeywords = ['never', "don't", 'avoid', 'stop', "shouldn't"];
        
        messages.filter(m => m.role === 'user').forEach(msg => {
            const lower = msg.content.toLowerCase();
            
            alwaysKeywords.forEach(kw => {
                if (lower.includes(kw)) {
                    const sentence = this.extractSentence(msg.content, kw);
                    if (sentence && !preferences.always.includes(sentence)) {
                        preferences.always.push(sentence);
                    }
                }
            });
            
            neverKeywords.forEach(kw => {
                if (lower.includes(kw)) {
                    const sentence = this.extractSentence(msg.content, kw);
                    if (sentence && !preferences.never.includes(sentence)) {
                        preferences.never.push(sentence);
                    }
                }
            });
        });
        
        let result = '';
        
        if (preferences.always.length > 0) {
            result += `**Always:**\n${preferences.always.slice(0, 3).map(p => `- ${p}`).join('\n')}\n\n`;
        }
        
        if (preferences.never.length > 0) {
            result += `**Never:**\n${preferences.never.slice(0, 3).map(p => `- ${p}`).join('\n')}\n`;
        }
        
        if (!result) {
            result = 'No specific preferences mentioned.';
        }
        
        return result;
    }
    
    extractSentence(text, keyword) {
        const sentences = text.split(/[.!?]+/);
        const found = sentences.find(s => s.toLowerCase().includes(keyword.toLowerCase()));
        return found ? found.trim().substring(0, 100) : null;
    }

    extractImportantPrompts(messages) {
        const userMessages = messages.filter(m => m.role === 'user');
        
        // Score each prompt
        const scored = userMessages.map(msg => ({
            content: msg.content,
            score: this.scorePromptImportance(msg, messages)
        }));
        
        // Sort by score and take top 5
        scored.sort((a, b) => b.score - a.score);
        
        const top = scored.slice(0, 5);
        
        if (top.length === 0) return 'No prompts captured.';
        
        return top.map((p, i) => `${i + 1}. ${p.content.substring(0, 150)}${p.content.length > 150 ? '...' : ''}`).join('\n');
    }
    
    scorePromptImportance(msg, allMessages) {
        let score = 0;
        
        // Length scoring
        score += msg.content.length * 0.1;
        
        // Has question mark
        if (msg.content.includes('?')) score += 50;
        
        // Has code
        if (msg.content.includes('```') || /function|const|class/i.test(msg.content)) score += 100;
        
        // Contains keywords
        if (/explain|how|what|why|describe/i.test(msg.content)) score += 40;
        
        // Is a correction
        if (/wrong|no|not this|incorrect|fix/i.test(msg.content)) score += 80;
        
        return score;
    }

    extractOpenTasks(messages) {
        const recent = messages.slice(-5);
        const tasks = [];
        
        const taskKeywords = ['todo', 'need to', 'should', 'can you', 'please', 'next', 'also'];
        
        recent.filter(m => m.role === 'user').forEach(msg => {
            const hasTaskKeyword = taskKeywords.some(kw => msg.content.toLowerCase().includes(kw));
            
            if (hasTaskKeyword || msg.content.includes('?')) {
                tasks.push(msg.content.substring(0, 100));
            }
        });
        
        if (tasks.length === 0) return 'All tasks completed.';
        
        return tasks.slice(0, 3).map((t, i) => `${i + 1}. ${t}${t.length >= 100 ? '...' : ''}`).join('\n');
    }
    
    generateCompressedSummary(messages) {
        let summary = '';
        let count = 1;
        
        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            
            if (msg.role === 'user') {
                summary += `\n**Q${count}:** ${msg.content.substring(0, 150)}${msg.content.length > 150 ? '...' : ''}\n`;
                
                // Find AI response
                if (i + 1 < messages.length && messages[i + 1].role === 'assistant') {
                    const aiMsg = messages[i + 1];
                    const aiSummary = this.compressAIResponse(aiMsg.content);
                    summary += `**A${count}:** ${aiSummary}\n`;
                    i++; // Skip next
                }
                
                count++;
            }
        }
        
        return summary;
    }
    
    compressAIResponse(response) {
        // COMPRESS AI response intelligently
        
        // If short, return as-is
        if (response.length <= 100) {
            return response;
        }
        
        // Extract key info
        const hasCode = response.includes('```');
        const hasLists = /^[-*]\s/m.test(response) || /^\d+\.\s/m.test(response);
        const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 10);
        
        let compressed = '';
        
        // Take first sentence as main point
        if (sentences.length > 0) {
            compressed = sentences[0].trim() + '.';
        }
        
        // Add structure notes
        if (hasCode) {
            const codeCount = (response.match(/```/g) || []).length / 2;
            compressed += ` [Includes ${codeCount} code example${codeCount > 1 ? 's' : ''}]`;
        }
        
        if (hasLists) {
            const listItems = (response.match(/^[-*•]\s/gm) || []).length + (response.match(/^\d+\.\s/gm) || []).length;
            compressed += ` [${listItems} point list]`;
        }
        
        if (sentences.length > 3) {
            compressed += ` [+${sentences.length - 1} more details]`;
        }
        
        return compressed;
    }
}

// Conversation storage manager
class ConversationManager {
    constructor(context) {
        this.context = context;
        this.conversations = [];
        this.currentConversation = null;
        this.extractor = new EnhancedContextExtractor();
        this.loadConversations();
    }

    loadConversations() {
        const stored = this.context.globalState.get('conversations', []);
        this.conversations = stored;
    }

    saveConversations() {
        const maxConversations = vscode.workspace.getConfiguration('remember').get('maxConversations', 100);
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
                command: 'remember.viewConversationDetail',
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
    console.log('Remember VS Code extension activated');

    // Initialize conversation manager
    conversationManager = new ConversationManager(context);

    // Initialize tree view
    treeProvider = new ConversationTreeProvider(conversationManager);
    vscode.window.registerTreeDataProvider('remember.conversations', treeProvider);

    // AUTOMATIC CAPTURE: Monitor GitHub Copilot Chat
    const autoCapture = vscode.workspace.getConfiguration('remember').get('autoCapture', true);
    
    if (autoCapture) {
        console.log('🎯 Remember: Auto-capture enabled for Copilot Chat');
        
        // Listen to chat participant API
        setupCopilotChatMonitoring(context);
        
        // Also monitor file changes for chat history
        setupFileSystemMonitoring(context);
    }

    // Command: Capture current conversation
    context.subscriptions.push(
        vscode.commands.registerCommand('remember.captureConversation', async () => {
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
        vscode.commands.registerCommand('remember.exportContext', async () => {
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
        vscode.commands.registerCommand('remember.viewConversations', () => {
            vscode.commands.executeCommand('workbench.view.extension.remember-sidebar');
        })
    );

    // Command: View conversation detail
    context.subscriptions.push(
        vscode.commands.registerCommand('remember.viewConversationDetail', async (conversationId) => {
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
        vscode.commands.registerCommand('remember.importContext', async () => {
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
            'remember',
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
                            `🧠 Remember: Auto-captured ${messages.length} messages`
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
