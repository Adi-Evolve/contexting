// Enhanced Context Extractor - Detailed Narrative Format
// Converts conversations into LLM-friendly context with full details

class EnhancedContextExtractor {
    
    extractContext(conversation) {
        return this.generateDetailedContext(conversation);
    }
    
    generateDetailedContext(conversation) {
        const title = conversation.title || 'Conversation';
        const messages = conversation.messages || [];
        const userMessages = messages.filter(m => m.role === 'user');
        const aiMessages = messages.filter(m => m.role === 'assistant');
        
        let markdown = `# 🧠 Context File: ${title}

**📊 Stats:**
- Total Messages: ${messages.length}
- User Messages: ${userMessages.length}
- AI Responses: ${aiMessages.length}
- Started: ${new Date(conversation.startedAt).toLocaleString()}
- Last Updated: ${new Date(conversation.updatedAt).toLocaleString()}

---

## 📖 Conversation Flow (Detailed Summary)

`;

        // Generate detailed conversation narrative
        markdown += this.generateConversationNarrative(messages);
        
        markdown += `\n---

## 🎯 Main Topics Discussed

`;
        markdown += this.extractMainTopics(messages);
        
        markdown += `\n---

## ⚠️ Corrections & Learning Points

`;
        const corrections = this.findCorrections(messages);
        if (corrections.length > 0) {
            corrections.forEach((correction, i) => {
                markdown += `\n### Correction ${i + 1}\n`;
                markdown += `**What went wrong:** ${correction.issue}\n`;
                markdown += `**User's correction:** ${correction.userFix}\n`;
                markdown += `**Lesson:** ${correction.lesson}\n`;
            });
        } else {
            markdown += `No corrections needed - conversation went smoothly.\n`;
        }
        
        markdown += `\n---

## 🔑 Key Information to Remember

`;
        markdown += this.extractKeyInformation(messages);
        
        markdown += `\n---

## 💬 Complete Message History

`;
        
        // Full conversation with better formatting
        messages.forEach((msg, i) => {
            const roleIcon = msg.role === 'user' ? '👤' : '🤖';
            const roleLabel = msg.role === 'user' ? 'USER' : 'ASSISTANT';
            
            markdown += `\n### ${roleIcon} ${roleLabel} - Message ${i + 1}\n\n`;
            
            // Smart truncation - keep more if it's important
            const isImportant = this.isImportantMessage(msg, messages, i);
            const maxLength = isImportant ? 500 : 300;
            
            if (msg.content.length > maxLength) {
                markdown += `${msg.content.substring(0, maxLength)}...\n\n`;
                markdown += `*[Truncated - ${msg.content.length} total characters]*\n`;
            } else {
                markdown += `${msg.content}\n`;
            }
        });
        
        markdown += `\n---

## 📝 How to Use This Context

When starting a new chat, paste this entire context file. The AI will:
1. ✅ Remember all topics discussed
2. ✅ Understand your communication style
3. ✅ Know what corrections were made
4. ✅ Continue from where you left off

**Format optimized for maximum LLM comprehension.**

`;
        
        return markdown;
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
