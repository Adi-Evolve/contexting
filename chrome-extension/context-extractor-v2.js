// Enhanced Context Extractor - Detailed Narrative Format
// Converts conversations into LLM-friendly context with full details

class EnhancedContextExtractor {
    
    constructor() {
        // Initialize conversation threader if available
        this.threader = typeof ConversationThreader !== 'undefined' 
            ? new ConversationThreader() 
            : null;
        
        // Initialize code language detector if available
        this.languageDetector = typeof CodeLanguageDetector !== 'undefined'
            ? new CodeLanguageDetector()
            : null;
        
        // Initialize tool usage tracker if available
        this.toolTracker = typeof ToolUsageTracker !== 'undefined'
            ? new ToolUsageTracker()
            : null;
    }
    
    extractContext(conversation) {
        return this.generateDetailedContext(conversation);
    }
    
    generateDetailedContext(conversation) {
        const title = conversation.title || 'Conversation';
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
        const timestamp = new Date().toLocaleString();
        const messageCount = messages.length;
        const exchanges = Math.floor(messageCount / 2);
        const platform = conversation.platform || (title.includes('ChatGPT') ? 'ChatGPT' : title.includes('Claude') ? 'Claude' : 'Web');
        
        let markdown = `# Context: ${title}

*Generated: ${timestamp} | ${exchanges} exchanges | Source: ${platform}*

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
        if (conversation.title && conversation.title !== 'New Conversation') {
            return conversation.title;
        }
        
        const firstUser = conversation.messages.find(m => m.role === 'user');
        if (firstUser) {
            return firstUser.content.substring(0, 150).trim();
        }
        
        return 'General discussion';
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
    
    generateConversationNarrative(messages) {
        let narrative = '';
        let conversationNumber = 1;
        
        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            
            if (msg.role === 'user') {
                narrative += `\n**${conversationNumber}. User Request:**\n`;
                
                // Intelligently summarize user message
                const userSummary = this.intelligentSummary(msg.content, 'user');
                narrative += `${userSummary}\n`;
                
                // Check for AI response
                if (i + 1 < messages.length && messages[i + 1].role === 'assistant') {
                    const aiMsg = messages[i + 1];
                    const aiSummary = this.intelligentSummary(aiMsg.content, 'assistant');
                    
                    narrative += `\n**AI Response:**\n`;
                    narrative += `${aiSummary}\n`;
                    
                    i++; // Skip next message as we processed it
                }
                
                conversationNumber++;
            }
        }
        
        return narrative;
    }
    
    intelligentSummary(content, role) {
        // If short enough, return as-is
        if (content.length <= 200) {
            return content;
        }
        
        // For longer content, extract key points
        const lines = content.split('\n').filter(l => l.trim().length > 0);
        
        if (role === 'user') {
            // For user messages, focus on the question/request
            const firstLine = lines[0];
            if (lines.length > 1) {
                return `${firstLine}\n...(and ${lines.length - 1} more lines of context)`;
            }
            return firstLine;
        } else {
            // For AI messages, extract structure
            const hasCodeBlocks = content.includes('```');
            const hasLists = /^[-*•]\s/m.test(content) || /^\d+\.\s/m.test(content);
            const hasSections = content.includes('##') || content.includes('**');
            
            let summary = lines.slice(0, 3).join('\n');
            
            if (hasCodeBlocks) {
                const codeBlockCount = (content.match(/```/g) || []).length / 2;
                summary += `\n\n[Contains ${codeBlockCount} code example${codeBlockCount > 1 ? 's' : ''}]`;
            }
            
            if (hasLists) {
                summary += `\n[Includes detailed list/steps]`;
            }
            
            if (lines.length > 5) {
                summary += `\n\n...(${lines.length - 3} more lines)`;
            }
            
            return summary;
        }
    }
    
    extractMainTopics(messages) {
        const topics = new Set();
        const topicKeywords = [];
        
        messages.forEach(msg => {
            // Extract potential topics from user questions
            if (msg.role === 'user') {
                const words = msg.content.toLowerCase().split(/\s+/);
                
                // Look for question words followed by nouns
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
        const correctionKeywords = ['no', 'wrong', 'incorrect', 'not this', 'actually', 'mistake', 'error', 'fix'];
        
        for (let i = 0; i < messages.length - 1; i++) {
            if (messages[i].role === 'assistant' && messages[i + 1].role === 'user') {
                const userResponse = messages[i + 1].content.toLowerCase();
                
                // Check if user is correcting
                const isCorrection = correctionKeywords.some(kw => userResponse.includes(kw));
                
                if (isCorrection) {
                    corrections.push({
                        issue: messages[i].content.substring(0, 150) + '...',
                        userFix: messages[i + 1].content.substring(0, 150),
                        lesson: this.extractLesson(messages[i + 1].content)
                    });
                }
            }
        }
        
        return corrections;
    }
    
    extractLesson(correctionText) {
        // Try to extract the key learning
        const sentences = correctionText.split(/[.!?]+/).filter(s => s.trim().length > 10);
        
        if (sentences.length > 0) {
            // Return the most informative sentence
            const longest = sentences.reduce((a, b) => a.length > b.length ? a : b);
            return longest.trim();
        }
        
        return correctionText.substring(0, 100);
    }
    
    extractKeyInformation(messages) {
        let keyInfo = '';
        
        // Look for messages with important markers
        const importantPatterns = [
            /important/gi,
            /remember/gi,
            /note that/gi,
            /key point/gi,
            /in summary/gi,
            /to summarize/gi,
            /main thing/gi,
            /crucial/gi,
            /essential/gi
        ];
        
        messages.forEach((msg, i) => {
            const hasImportantMarker = importantPatterns.some(pattern => pattern.test(msg.content));
            
            if (hasImportantMarker) {
                const snippet = msg.content.substring(0, 200);
                keyInfo += `- ${snippet}${msg.content.length > 200 ? '...' : ''}\n`;
            }
        });
        
        if (!keyInfo) {
            // Fallback: extract from last few messages
            const lastMessages = messages.slice(-3);
            lastMessages.forEach(msg => {
                if (msg.content.length < 150) {
                    keyInfo += `- ${msg.content}\n`;
                }
            });
        }
        
        return keyInfo || '- Refer to full conversation history above\n';
    }
    
    isImportantMessage(msg, allMessages, index) {
        // Message is important if:
        // 1. It's a user correction
        // 2. It contains code blocks
        // 3. It's unusually long (detailed explanation)
        // 4. It has "important" keywords
        
        const hasCodeBlock = msg.content.includes('```');
        const isLong = msg.content.length > 500;
        const hasImportantKeyword = /(important|remember|note|key|crucial)/i.test(msg.content);
        
        // Check if next message is a correction
        const isFollowedByCorrection = 
            index + 1 < allMessages.length && 
            allMessages[index + 1].role === 'user' &&
            /(no|wrong|incorrect|not this)/i.test(allMessages[index + 1].content);
        
        return hasCodeBlock || isLong || hasImportantKeyword || isFollowedByCorrection;
    }
}

// Export for use
window.EnhancedContextExtractor = EnhancedContextExtractor;
