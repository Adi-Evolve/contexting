// @ts-nocheck
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
        
        // Add metadata
        const timestamp = new Date().toLocaleString();
        const messageCount = messages.length;
        const exchanges = Math.floor(messageCount / 2);
        const platform = conversation.platform || 'unknown';
        
        // Extract all 7 components
        const userIntent = this.extractUserIntent(messages);
        const conversationAbout = this.extractConversationAbout(messages);
        const keyKnowledge = this.extractKeyKnowledge(messages);
        const failures = this.findFailuresAndRules(messages);
        const preferences = this.extractUserPreferences(messages);
        const importantPrompts = this.extractMeaningfulPrompts(messages);
        const openTasks = this.extractFutureTasks(messages);
        
        let markdown = `# 🧠 CONTEXT SUMMARY — ${title}
*(Paste this in new chat for full continuity)*

*Generated: ${timestamp} | ${exchanges} exchanges | Source: ${platform}*

---

## 1️⃣ User Intent
${userIntent}

## 2️⃣ What This Conversation Is About
${conversationAbout}

## 3️⃣ Key Knowledge We Agreed
${keyKnowledge}

## 4️⃣ Failures & Must-Follow Rules
`;

        if (failures.length > 0) {
            markdown += `| Mistake in conversation | Rule to enforce |\n`;
            markdown += `|-----------------------|----------------|\n`;
            failures.forEach(f => {
                markdown += `| ${f.mistake} | ${f.rule} |\n`;
            });
        } else {
            markdown += `No failures detected - conversation went smoothly.\n`;
        }
        
        markdown += `\n## 5️⃣ User Preferences

**The model must:**
${preferences.must}

**The model must not:**
${preferences.mustNot}

## 6️⃣ Important Prompts (Meaning-Carrying Examples)
${importantPrompts}

## 7️⃣ Open Tasks / Future Actions
${openTasks}
        
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
        
        // Add compressed summary section
        markdown += `\n---

## 📝 Full Conversation Log

`;
        
        // Add all messages in compact format
        let msgCount = 1;
        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            if (msg.role === 'user') {
                markdown += `\n## User Prompt ${msgCount}\n${msg.content}\n`;
                
                // Check for assistant response
                if (i + 1 < messages.length && messages[i + 1].role === 'assistant') {
                    markdown += `\n### Assistant Response ${msgCount}\n${messages[i + 1].content.substring(0, 200)}${messages[i + 1].content.length > 200 ? '...\n' : '\n'}`;
                    i++; // Skip next as we processed it
                }
                
                msgCount++;
            }
        }
        
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
            // Don't truncate - preserve full context
            return firstUser.content.trim();
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
        // Preserve full sentence - no truncation
        return found ? found.trim() : null;
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
        
        // Preserve full prompt text - no truncation
        return top.map((p, i) => `${i + 1}. ${p.content}`).join('\n');
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
                // Preserve full task text
                tasks.push(msg.content);
            }
        });
        
        if (tasks.length === 0) return 'All tasks completed.';
        
        return tasks.slice(0, 3).map((t, i) => `${i + 1}. ${t}`).join('\n');
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
                        issue: messages[i].content,
                        userFix: messages[i + 1].content,
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
            // Return the most informative sentence (preserve full text)
            const longest = sentences.reduce((a, b) => a.length > b.length ? a : b);
            return longest.trim();
        }
        
        // Preserve full text if sentence splitting fails
        return correctionText.trim();
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
    
    // NEW: Extract user's overall intent/goal
    extractUserIntent(messages) {
        const userMessages = messages.filter(m => m.role === 'user');
        if (userMessages.length === 0) return 'Unknown intent';
        
        // Look for goal-indicating phrases
        const intentKeywords = [
            /want to (create|build|make|design|implement)/i,
            /trying to (solve|fix|understand)/i,
            /need (help|to)/i,
            /how (do|can|to)/i,
            /looking for/i
        ];
        
        let intent = '';
        for (const msg of userMessages) {
            for (const pattern of intentKeywords) {
                const match = msg.content.match(pattern);
                if (match) {
                    // Extract the sentence containing the intent
                    const sentences = msg.content.split(/[.!?]+/);
                    const intentSentence = sentences.find(s => pattern.test(s));
                    if (intentSentence) {
                        intent = intentSentence.trim();
                        break;
                    }
                }
            }
            if (intent) break;
        }
        
        // Fallback: use first user message
        if (!intent && userMessages.length > 0) {
            intent = userMessages[0].content.split(/[.!?]+/)[0].trim();
        }
        
        return intent || 'User wants to understand the topic discussed';
    }
    
    // NEW: What conversation is about
    extractConversationAbout(messages) {
        const topics = [];
        
        // Look at first few user messages to understand the topic
        const userMessages = messages.filter(m => m.role === 'user').slice(0, 5);
        
        for (const msg of userMessages) {
            if (msg.content.length < 200) {
                topics.push(`- ${msg.content}`);
            } else {
                topics.push(`- ${msg.content.substring(0, 150)}...`);
            }
        }
        
        return topics.length > 0 ? topics.join('\n') : 'General discussion and Q&A';
    }
    
    // NEW: Extract key knowledge/agreements
    extractKeyKnowledge(messages) {
        const knowledge = [];
        const assistantMessages = messages.filter(m => m.role === 'assistant');
        
        // Look for definitive statements
        const knowledgePatterns = [
            /best (approach|way|method|practice|format) (is|for)/i,
            /you (should|must|need to)/i,
            /the (answer|solution|key) is/i,
            /(important|crucial|essential) to/i,
            /works (best|better) (for|with)/i
        ];
        
        for (const msg of assistantMessages) {
            const sentences = msg.content.split(/[.!?]+/);
            for (const sentence of sentences) {
                if (knowledgePatterns.some(p => p.test(sentence)) && sentence.length < 200) {
                    knowledge.push(`- ${sentence.trim()}`);
                }
            }
        }
        
        // Limit to top 8 most relevant
        return knowledge.slice(0, 8).join('\n') || '- Key discussion points captured above';
    }
    
    // NEW: Find failures and rules
    findFailuresAndRules(messages) {
        const failures = [];
        const correctionKeywords = ['no', 'wrong', 'incorrect', 'not this', 'actually', 'mistake', 'not what', "don't"];
        
        for (let i = 0; i < messages.length - 1; i++) {
            if (messages[i].role === 'assistant' && messages[i + 1].role === 'user') {
                const userResponse = messages[i + 1].content.toLowerCase();
                
                // Check if user is correcting
                const isCorrection = correctionKeywords.some(kw => userResponse.includes(kw));
                
                if (isCorrection) {
                    const mistake = this.summarizeMessage(messages[i].content, 80);
                    const rule = this.summarizeMessage(messages[i + 1].content, 80);
                    
                    failures.push({
                        mistake: mistake,
                        rule: rule
                    });
                }
            }
        }
        
        return failures;
    }
    
    // NEW: Extract user preferences in must/must not format
    extractUserPreferences(messages) {
        const must = [];
        const mustNot = [];
        
        const userMessages = messages.filter(m => m.role === 'user');
        
        for (const msg of userMessages) {
            const lower = msg.content.toLowerCase();
            
            // Positive preferences
            if (/always|make sure|remember to|please|must|should|need to/i.test(lower)) {
                const sentences = msg.content.split(/[.!?]+/);
                for (const s of sentences) {
                    if (/always|make sure|remember to|please|must|should|need to/i.test(s)) {
                        must.push(`- ${s.trim()}`);
                    }
                }
            }
            
            // Negative preferences
            if (/never|don't|avoid|stop|shouldn't|not|no need/i.test(lower)) {
                const sentences = msg.content.split(/[.!?]+/);
                for (const s of sentences) {
                    if (/never|don't|avoid|stop|shouldn't|not|no need/i.test(s)) {
                        mustNot.push(`- ${s.trim()}`);
                    }
                }
            }
        }
        
        return {
            must: must.length > 0 ? must.slice(0, 5).join('\n') : '- No specific requirements stated',
            mustNot: mustNot.length > 0 ? mustNot.slice(0, 5).join('\n') : '- No prohibitions stated'
        };
    }
    
    // NEW: Extract meaningful prompts (not all user messages)
    extractMeaningfulPrompts(messages) {
        const userMessages = messages.filter(m => m.role === 'user');
        const meaningful = [];
        
        for (const msg of userMessages) {
            // Score based on meaning-carrying content
            let score = 0;
            
            if (msg.content.includes('?')) score += 2;
            if (msg.content.length > 50) score += 1;
            if (/how|what|why|which|when|where|explain|tell me/i.test(msg.content)) score += 2;
            if (msg.content.includes('```')) score += 3;
            if (/create|build|make|design|implement/i.test(msg.content)) score += 2;
            
            if (score >= 2) {
                meaningful.push({ content: msg.content, score });
            }
        }
        
        // Sort by score and take top 6
        meaningful.sort((a, b) => b.score - a.score);
        const top = meaningful.slice(0, 6);
        
        return top.length > 0 
            ? top.map((p, i) => `${i + 1}. "${p.content}"`).join('\n')
            : 'No specific prompts to preserve';
    }
    
    // NEW: Extract future tasks
    extractFutureTasks(messages) {
        const tasks = [];
        const taskKeywords = ['todo', 'next', 'need to', 'will', 'should', 'can you', 'later', 'future'];
        
        // Check last 3 messages for open items
        const recentMessages = messages.slice(-3);
        
        for (const msg of recentMessages) {
            if (msg.role === 'user' || msg.content.includes('?')) {
                const lower = msg.content.toLowerCase();
                if (taskKeywords.some(kw => lower.includes(kw)) || msg.content.includes('?')) {
                    tasks.push(`- ${this.summarizeMessage(msg.content, 100)}`);
                }
            }
        }
        
        return tasks.length > 0 ? tasks.slice(0, 3).join('\n') : '- All tasks completed';
    }
    
    // Helper: Summarize message to max length
    summarizeMessage(content, maxLen) {
        if (content.length <= maxLen) return content;
        return content.substring(0, maxLen) + '...';
    }
}

// Export for use
window.EnhancedContextExtractor = EnhancedContextExtractor;
