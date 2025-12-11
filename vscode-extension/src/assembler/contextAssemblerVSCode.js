// Context Assembler V2 for VS Code
// Port of Chrome extension's Context Assembler with 4-layer architecture

const vscode = require('vscode');

class ContextAssemblerVSCode {
    constructor(storageManager) {
        this.storage = storageManager;
        this.tokenLimits = {
            layer0: 200,  // Role & Persona
            layer1: 600,  // Canonical State
            layer2: 500,  // Recent Context
            layer3: 300,  // Relevant History
            total: 1600   // Maximum total
        };
        
        this.config = {
            recentMessageCount: 5,
            relevantHistoryCount: 3,
            maxDecisions: 5,
            maxFailures: 3,
            compressionLevel: 'smart' // 'none', 'smart', 'aggressive'
        };
    }
    
    async assembleForNewSession(conversationId, newPrompt = null) {
        console.log(`🔧 Assembling context for conversation: ${conversationId}`);
        
        const conversation = await this.storage.getConversation(conversationId);
        
        if (!conversation) {
            throw new Error(`Conversation ${conversationId} not found`);
        }
        
        // Build all 4 layers
        const layers = {
            layer0: this.extractRolePersona(conversation),
            layer1: this.extractCanonicalState(conversation),
            layer2: this.getRecentMessages(conversation, this.config.recentMessageCount),
            layer3: await this.getRelevantHistory(conversation, newPrompt)
        };
        
        // Estimate tokens
        let tokens = this.estimateTokens(layers);
        console.log(`📊 Initial token count: ${tokens}`);
        
        // Compress if needed
        if (tokens > this.tokenLimits.total) {
            console.log(`⚠️ Exceeds budget (${tokens} > ${this.tokenLimits.total}), compressing...`);
            layers = this.compressToFit(layers);
            tokens = this.estimateTokens(layers);
            console.log(`✅ Compressed to ${tokens} tokens`);
        }
        
        // Format for different outputs
        const formatted = {
            markdown: this.formatAsMarkdown(layers, newPrompt),
            copilot: this.formatForCopilot(layers, newPrompt),
            json: this.formatAsJSON(layers, newPrompt)
        };
        
        return {
            formatted: formatted,
            tokens: tokens,
            layers: layers,
            metadata: {
                conversationId: conversationId,
                conversationTitle: conversation.title,
                platform: conversation.platform,
                assembledAt: Date.now(),
                messageCount: conversation.messages?.length || 0,
                compressionApplied: tokens !== this.estimateTokens(layers)
            }
        };
    }
    
    extractRolePersona(conversation) {
        const userMessages = conversation.messages?.filter(m => m.role === 'user') || [];
        
        if (userMessages.length === 0) {
            return {
                style: 'unknown',
                preferences: [],
                summary: 'No user context available'
            };
        }
        
        const style = this.analyzeStyle(userMessages);
        const preferences = this.extractPreferences(conversation);
        
        return {
            style: style,
            preferences: preferences,
            summary: `User prefers ${style.tone} communication with focus on ${style.focus}`
        };
    }
    
    analyzeStyle(userMessages) {
        const allText = userMessages.map(m => m.content || '').join(' ').toLowerCase();
        
        // Analyze tone
        const formalWords = ['please', 'could you', 'would you', 'kindly'];
        const casualWords = ['hey', 'yo', 'lol', 'cool', 'awesome'];
        
        const formalCount = formalWords.reduce((sum, word) => 
            sum + (allText.match(new RegExp(word, 'g')) || []).length, 0
        );
        
        const casualCount = casualWords.reduce((sum, word) => 
            sum + (allText.match(new RegExp(word, 'g')) || []).length, 0
        );
        
        const tone = formalCount > casualCount ? 'formal' : 'casual';
        
        // Analyze focus
        const technicalWords = ['function', 'class', 'api', 'database', 'algorithm'];
        const conceptualWords = ['why', 'how', 'explain', 'understand', 'concept'];
        
        const technicalCount = technicalWords.reduce((sum, word) => 
            sum + (allText.match(new RegExp(word, 'g')) || []).length, 0
        );
        
        const conceptualCount = conceptualWords.reduce((sum, word) => 
            sum + (allText.match(new RegExp(word, 'g')) || []).length, 0
        );
        
        const focus = technicalCount > conceptualCount ? 'implementation' : 'understanding';
        
        return { tone, focus };
    }
    
    extractPreferences(conversation) {
        const preferences = [];
        const messages = conversation.messages || [];
        
        const preferenceKeywords = [
            { pattern: /prefer\s+(\w+)/gi, type: 'preference' },
            { pattern: /don't\s+use\s+(\w+)/gi, type: 'avoid' },
            { pattern: /always\s+(\w+)/gi, type: 'requirement' },
            { pattern: /never\s+(\w+)/gi, type: 'restriction' }
        ];
        
        messages.forEach(msg => {
            const content = msg.content || '';
            
            preferenceKeywords.forEach(({ pattern, type }) => {
                const matches = content.matchAll(pattern);
                for (const match of matches) {
                    preferences.push({
                        type: type,
                        value: match[1],
                        context: match[0]
                    });
                }
            });
        });
        
        return preferences;
    }
    
    extractCanonicalState(conversation) {
        const messages = conversation.messages || [];
        
        const decisions = this.findDecisions(messages);
        const constraints = this.findConstraints(messages);
        const failures = this.findFailures(messages);
        const goal = conversation.goal || this.inferGoal(conversation);
        const status = this.inferCurrentStatus(conversation);
        
        return {
            goal: goal,
            decisions: decisions.slice(0, this.config.maxDecisions),
            constraints: constraints,
            failures: failures.slice(0, this.config.maxFailures),
            status: status
        };
    }
    
    findDecisions(messages) {
        const decisions = [];
        const decisionKeywords = [
            'decided to', 'we chose', 'will use', 'going with',
            'implemented', 'switched to', 'changed to', 'opted for'
        ];
        
        messages.forEach(msg => {
            const content = msg.content || '';
            const lowerContent = content.toLowerCase();
            
            decisionKeywords.forEach(keyword => {
                if (lowerContent.includes(keyword)) {
                    const decision = this.extractDecisionSentence(content, keyword);
                    if (decision) {
                        decisions.push({
                            decision: decision,
                            timestamp: msg.timestamp,
                            reason: this.extractReason(content)
                        });
                    }
                }
            });
        });
        
        return decisions;
    }
    
    extractDecisionSentence(content, keyword) {
        const sentences = content.split(/[.!?]+/);
        const decisionSentence = sentences.find(s => 
            s.toLowerCase().includes(keyword)
        );
        
        return decisionSentence ? decisionSentence.trim() : null;
    }
    
    extractReason(content) {
        const reasonPatterns = [
            /because\s+([^.!?]+)/i,
            /since\s+([^.!?]+)/i,
            /reason:\s+([^.!?]+)/i
        ];
        
        for (const pattern of reasonPatterns) {
            const match = content.match(pattern);
            if (match) {
                return match[1].trim();
            }
        }
        
        return null;
    }
    
    findConstraints(messages) {
        const constraints = [];
        const constraintKeywords = [
            'must use', 'required to', 'constraint', 'limitation',
            'cannot use', 'restricted to', 'only allowed'
        ];
        
        messages.forEach(msg => {
            const content = msg.content || '';
            const lowerContent = content.toLowerCase();
            
            constraintKeywords.forEach(keyword => {
                if (lowerContent.includes(keyword)) {
                    const sentence = this.extractConstraintSentence(content, keyword);
                    if (sentence) {
                        constraints.push(sentence);
                    }
                }
            });
        });
        
        return constraints;
    }
    
    extractConstraintSentence(content, keyword) {
        const sentences = content.split(/[.!?]+/);
        const sentence = sentences.find(s => 
            s.toLowerCase().includes(keyword)
        );
        
        return sentence ? sentence.trim() : null;
    }
    
    findFailures(messages) {
        const failures = [];
        const failureKeywords = [
            'failed', 'error', 'didn\'t work', 'issue', 'problem',
            'bug', 'crash', 'exception', 'wrong', 'incorrect'
        ];
        
        messages.forEach(msg => {
            const content = msg.content || '';
            const lowerContent = content.toLowerCase();
            
            failureKeywords.forEach(keyword => {
                if (lowerContent.includes(keyword)) {
                    const failure = this.extractFailureSentence(content, keyword);
                    if (failure) {
                        failures.push({
                            issue: failure,
                            timestamp: msg.timestamp
                        });
                    }
                }
            });
        });
        
        return failures;
    }
    
    extractFailureSentence(content, keyword) {
        const sentences = content.split(/[.!?]+/);
        const sentence = sentences.find(s => 
            s.toLowerCase().includes(keyword)
        );
        
        return sentence ? sentence.trim() : null;
    }
    
    inferGoal(conversation) {
        const firstUserMessage = conversation.messages?.find(m => m.role === 'user');
        if (!firstUserMessage) {
            return conversation.title || 'Unknown goal';
        }
        
        const content = firstUserMessage.content || '';
        const firstSentence = content.split(/[.!?]+/)[0];
        
        return this.truncate(firstSentence, 100);
    }
    
    inferCurrentStatus(conversation) {
        const lastMessages = conversation.messages?.slice(-3) || [];
        const hasErrors = lastMessages.some(m => 
            /error|failed|issue|problem/i.test(m.content || '')
        );
        
        if (hasErrors) {
            return 'Debugging issues';
        }
        
        const hasImplementation = lastMessages.some(m =>
            /implemented|done|working|success/i.test(m.content || '')
        );
        
        if (hasImplementation) {
            return 'Implementation complete';
        }
        
        return 'In progress';
    }
    
    getRecentMessages(conversation, count = 5) {
        const messages = conversation.messages || [];
        const recentMessages = messages.slice(-count * 2); // Last N exchanges
        
        return recentMessages.map(m => ({
            role: m.role,
            content: this.truncate(m.content || '', 500),
            hasCode: m.codeBlocks && m.codeBlocks.length > 0,
            timestamp: m.timestamp
        }));
    }
    
    async getRelevantHistory(conversation, newPrompt) {
        if (!newPrompt) {
            return [];
        }
        
        const messages = conversation.messages || [];
        const relevant = this.semanticSearch(messages, newPrompt, this.config.relevantHistoryCount);
        
        return relevant.map(m => ({
            content: this.truncate(m.content || '', 200),
            relevance: m.score,
            timestamp: m.timestamp
        }));
    }
    
    semanticSearch(messages, query, topN = 3) {
        const queryWords = query.toLowerCase().split(/\s+/);
        
        const scored = messages.map(msg => {
            const content = (msg.content || '').toLowerCase();
            const score = queryWords.reduce((sum, word) => {
                return sum + (content.includes(word) ? 1 : 0);
            }, 0) / queryWords.length;
            
            return { ...msg, score };
        });
        
        return scored
            .filter(m => m.score > 0.2)
            .sort((a, b) => b.score - a.score)
            .slice(0, topN);
    }
    
    formatAsMarkdown(layers, newPrompt) {
        let md = `# Context from Previous Session\n\n`;
        
        // Layer 0: Role & Persona
        md += `## Assistant Role\n`;
        md += `${layers.layer0.summary}\n\n`;
        
        if (layers.layer0.preferences.length > 0) {
            md += `**User Preferences:**\n`;
            layers.layer0.preferences.forEach(p => {
                md += `- ${p.type}: ${p.value}\n`;
            });
            md += `\n`;
        }
        
        // Layer 1: Canonical State
        md += `## Project State\n\n`;
        md += `**Goal:** ${layers.layer1.goal}\n\n`;
        
        if (layers.layer1.decisions.length > 0) {
            md += `**Key Decisions:**\n`;
            layers.layer1.decisions.forEach(d => {
                md += `- ${d.decision}`;
                if (d.reason) {
                    md += ` (Reason: ${d.reason})`;
                }
                md += `\n`;
            });
            md += `\n`;
        }
        
        if (layers.layer1.constraints.length > 0) {
            md += `**Constraints:**\n`;
            layers.layer1.constraints.forEach(c => {
                md += `- ${c}\n`;
            });
            md += `\n`;
        }
        
        if (layers.layer1.failures.length > 0) {
            md += `**Previous Failures:**\n`;
            layers.layer1.failures.forEach(f => {
                md += `- ${f.issue}\n`;
            });
            md += `\n`;
        }
        
        md += `**Status:** ${layers.layer1.status}\n\n`;
        
        // Layer 2: Recent Context
        if (layers.layer2.length > 0) {
            md += `## Recent Discussion\n\n`;
            layers.layer2.forEach(m => {
                md += `**${m.role}:** ${m.content}\n\n`;
            });
        }
        
        // Layer 3: Relevant History
        if (layers.layer3.length > 0) {
            md += `## Relevant History\n\n`;
            layers.layer3.forEach(m => {
                md += `- ${m.content} (relevance: ${(m.relevance * 100).toFixed(0)}%)\n`;
            });
            md += `\n`;
        }
        
        // New prompt
        if (newPrompt) {
            md += `## New Request\n\n${newPrompt}\n`;
        }
        
        return md;
    }
    
    formatForCopilot(layers, newPrompt) {
        // Optimized format for Copilot Chat
        let text = `Context from previous session:\n\n`;
        
        text += `Goal: ${layers.layer1.goal}\n`;
        text += `Status: ${layers.layer1.status}\n\n`;
        
        if (layers.layer1.decisions.length > 0) {
            text += `Decisions made:\n`;
            layers.layer1.decisions.forEach(d => {
                text += `- ${d.decision}\n`;
            });
            text += `\n`;
        }
        
        if (layers.layer2.length > 0) {
            text += `Recent exchange:\n`;
            layers.layer2.slice(-4).forEach(m => {
                text += `${m.role}: ${m.content}\n`;
            });
            text += `\n`;
        }
        
        if (newPrompt) {
            text += `New request: ${newPrompt}`;
        }
        
        return text;
    }
    
    formatAsJSON(layers, newPrompt) {
        return JSON.stringify({
            layers: layers,
            newPrompt: newPrompt,
            metadata: {
                assembledAt: Date.now(),
                tokenCount: this.estimateTokens(layers)
            }
        }, null, 2);
    }
    
    estimateTokens(layers) {
        const text = JSON.stringify(layers);
        return Math.ceil(text.length / 4);
    }
    
    compressToFit(layers) {
        const compressed = { ...layers };
        
        // Progressive compression strategy
        while (this.estimateTokens(compressed) > this.tokenLimits.total) {
            // 1. First, reduce layer3 (relevant history)
            if (compressed.layer3.length > 0) {
                compressed.layer3.pop();
                continue;
            }
            
            // 2. Then reduce layer2 (recent messages)
            if (compressed.layer2.length > 2) {
                compressed.layer2.shift();
                continue;
            }
            
            // 3. Then reduce layer1 decisions
            if (compressed.layer1.decisions.length > 3) {
                compressed.layer1.decisions.pop();
                continue;
            }
            
            // 4. Reduce layer1 failures
            if (compressed.layer1.failures.length > 2) {
                compressed.layer1.failures.pop();
                continue;
            }
            
            // 5. Truncate layer1 constraints
            if (compressed.layer1.constraints.length > 2) {
                compressed.layer1.constraints.pop();
                continue;
            }
            
            // 6. Finally, truncate content
            compressed.layer2.forEach(m => {
                m.content = this.truncate(m.content, 200);
            });
            
            break;
        }
        
        return compressed;
    }
    
    truncate(text, maxLength) {
        if (!text || text.length <= maxLength) {
            return text;
        }
        
        return text.substring(0, maxLength - 3) + '...';
    }
}

module.exports = ContextAssemblerVSCode;
