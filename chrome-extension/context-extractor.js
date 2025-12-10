// MemoryForge - Intelligent Context Extractor
// Converts raw conversations into optimal 7-point LLM context format

class ContextExtractor {
    constructor() {
        this.failureKeywords = [
            'no', 'wrong', 'not this', 'you failed', 'again', 'issue', 'incorrect',
            'that\'s not what i asked', 'try again', 'misunderstand', 'don\'t do',
            'stop', 'never', 'always include', 'you missed', 'forgotten'
        ];
        
        this.preferenceIndicators = [
            'always', 'never', 'prefer', 'i want', 'i need', 'make sure',
            'remember to', 'don\'t forget', 'include', 'exclude', 'step by step'
        ];
    }

    // Main extraction method
    extractContext(conversation) {
        console.log('🧠 Starting context extraction...');
        
        // Step 1: Parse and normalize
        const normalized = this.normalizeConversation(conversation);
        
        // Step 2: Extract components using heuristics
        const userIdentity = this.extractUserIdentity(normalized);
        const purpose = this.extractPurpose(conversation);
        const keyInfo = this.extractKeyInformation(conversation, normalized);
        const failures = this.extractFailuresAndRules(normalized);
        const preferences = this.extractPreferences(normalized);
        const importantPrompts = this.extractImportantPrompts(normalized);
        const openTasks = this.extractOpenTasks(normalized);
        
        // Step 3: Generate final context file
        const contextFile = this.generateContextFile({
            userIdentity,
            purpose,
            keyInfo,
            failures,
            preferences,
            importantPrompts,
            openTasks,
            metadata: {
                conversationId: conversation.id,
                messageCount: conversation.messageCount,
                timestamp: new Date().toISOString()
            }
        });
        
        console.log('✅ Context extraction complete');
        return contextFile;
    }

    // Step 1: Clean & Normalize
    normalizeConversation(conversation) {
        return conversation.messages.map(msg => ({
            role: msg.role,
            content: msg.content.trim(),
            timestamp: msg.timestamp,
            length: msg.content.length,
            hasQuestion: msg.content.includes('?'),
            index: msg.index
        }));
    }

    // Extract user identity and communication style
    extractUserIdentity(messages) {
        const userMessages = messages.filter(m => m.role === 'user');
        
        // Analyze communication patterns
        const avgLength = userMessages.reduce((sum, m) => sum + m.length, 0) / userMessages.length;
        const questionRatio = userMessages.filter(m => m.hasQuestion).length / userMessages.length;
        
        // Detect style
        let style = [];
        
        if (avgLength > 200) {
            style.push('Detailed explanations preferred');
        } else if (avgLength < 50) {
            style.push('Concise, direct communication');
        }
        
        if (questionRatio > 0.6) {
            style.push('Inquiry-driven, asks many questions');
        }
        
        // Detect technical vs casual
        const technicalWords = ['function', 'class', 'api', 'server', 'code', 'implement', 'debug'];
        const hasTechnical = userMessages.some(m => 
            technicalWords.some(word => m.content.toLowerCase().includes(word))
        );
        
        if (hasTechnical) {
            style.push('Technical, development-focused');
        }
        
        return {
            style: style.length > 0 ? style : ['General conversation style'],
            messageCount: userMessages.length,
            avgLength: Math.round(avgLength)
        };
    }

    // Extract purpose
    extractPurpose(conversation) {
        const title = conversation.title || 'Untitled Conversation';
        const firstUserMessage = conversation.messages.find(m => m.role === 'user')?.content || '';
        
        // Try to extract intent from first message
        let purpose = title;
        
        // Look for goal-oriented phrases
        const goalPhrases = [
            'i want to', 'i need to', 'help me', 'how do i', 'can you',
            'trying to', 'working on', 'building', 'creating'
        ];
        
        const lowerFirst = firstUserMessage.toLowerCase();
        for (const phrase of goalPhrases) {
            const index = lowerFirst.indexOf(phrase);
            if (index !== -1) {
                // Extract 50 chars after the phrase
                const excerpt = firstUserMessage.substring(index, index + 100).split('.')[0];
                purpose = excerpt.trim();
                break;
            }
        }
        
        return purpose;
    }

    // Extract key information
    extractKeyInformation(conversation, messages) {
        const keyFacts = [];
        
        // Use semantic topics if available
        if (conversation.summary?.semantic?.topics) {
            keyFacts.push(`Main topics: ${conversation.summary.semantic.topics.slice(0, 5).join(', ')}`);
        }
        
        // Add message count summary
        keyFacts.push(`Total exchanges: ${conversation.messageCount} messages`);
        
        // Extract facts from narrative summary
        if (conversation.summary?.narrative) {
            // Take first 200 chars as condensed summary
            const summary = conversation.summary.narrative.substring(0, 300).trim() + '...';
            keyFacts.push(summary);
        }
        
        // Find messages with definitions or key statements
        const definitionMessages = messages.filter(m => 
            m.role === 'assistant' && (
                m.content.includes('is defined as') ||
                m.content.includes('means that') ||
                m.content.includes('refers to') ||
                m.content.includes(':')
            )
        );
        
        // Extract short definitions
        definitionMessages.slice(0, 3).forEach(msg => {
            const sentences = msg.content.split(/[.!?]/).filter(s => s.length > 20 && s.length < 150);
            if (sentences.length > 0) {
                keyFacts.push(sentences[0].trim());
            }
        });
        
        return keyFacts;
    }

    // Extract failures and rules (CRITICAL for learning)
    extractFailuresAndRules(messages) {
        const failures = [];
        
        for (let i = 0; i < messages.length - 1; i++) {
            const current = messages[i];
            const next = messages[i + 1];
            
            // User correction following AI response
            if (current.role === 'assistant' && next.role === 'user') {
                const lowerContent = next.content.toLowerCase();
                
                // Check for failure keywords
                const hasFailureKeyword = this.failureKeywords.some(keyword => 
                    lowerContent.includes(keyword)
                );
                
                if (hasFailureKeyword) {
                    // Found a correction/failure
                    const failure = {
                        whatHappened: this.summarize(current.content, 100),
                        correction: this.summarize(next.content, 150),
                        rule: this.extractRule(next.content)
                    };
                    
                    failures.push(failure);
                }
            }
        }
        
        return failures;
    }

    // Extract user preferences
    extractPreferences(messages) {
        const preferences = {
            always: [],
            never: []
        };
        
        const userMessages = messages.filter(m => m.role === 'user');
        
        for (const msg of userMessages) {
            const lower = msg.content.toLowerCase();
            
            // Find "always" preferences
            for (const indicator of this.preferenceIndicators) {
                if (lower.includes(indicator)) {
                    // Extract the preference
                    const sentences = msg.content.split(/[.!?]/);
                    const relevantSentence = sentences.find(s => 
                        s.toLowerCase().includes(indicator)
                    );
                    
                    if (relevantSentence) {
                        const pref = relevantSentence.trim();
                        
                        if (lower.includes('never') || lower.includes('don\'t') || lower.includes('stop')) {
                            preferences.never.push(pref);
                        } else if (lower.includes('always') || lower.includes('include') || lower.includes('make sure')) {
                            preferences.always.push(pref);
                        }
                    }
                }
            }
        }
        
        // Remove duplicates
        preferences.always = [...new Set(preferences.always)];
        preferences.never = [...new Set(preferences.never)];
        
        return preferences;
    }

    // Extract important prompts (top scored user messages)
    extractImportantPrompts(messages) {
        const userMessages = messages.filter(m => m.role === 'user');
        
        // Score each message
        const scored = userMessages.map(msg => ({
            content: msg.content,
            score: this.scorePromptImportance(msg, messages)
        }));
        
        // Sort by score and take top 5-7
        scored.sort((a, b) => b.score - a.score);
        
        return scored.slice(0, 7).map(s => s.content);
    }

    // Score how important a prompt is
    scorePromptImportance(message, allMessages) {
        let score = 0;
        
        // Length (longer = more detail = more important)
        score += message.length * 0.1;
        
        // Has question mark
        if (message.hasQuestion) score += 50;
        
        // Has code block
        if (message.content.includes('```')) score += 100;
        
        // Has list/bullets
        if (message.content.includes('-') || message.content.includes('*')) score += 30;
        
        // Check if correction followed (indicates importance)
        const nextMsg = allMessages[message.index + 1];
        if (nextMsg && nextMsg.role === 'assistant') {
            const hasCorrection = allMessages[message.index + 2]?.role === 'user';
            if (hasCorrection) score += 80;
        }
        
        // Has important keywords
        const importantWords = ['how', 'why', 'explain', 'implement', 'fix', 'error', 'issue'];
        const hasImportant = importantWords.some(word => 
            message.content.toLowerCase().includes(word)
        );
        if (hasImportant) score += 40;
        
        return score;
    }

    // Extract open/unfinished tasks
    extractOpenTasks(messages) {
        const tasks = [];
        const lastFewMessages = messages.slice(-5); // Check last 5 messages
        
        for (const msg of lastFewMessages) {
            if (msg.role === 'user') {
                const lower = msg.content.toLowerCase();
                
                // Check for task indicators
                const taskIndicators = [
                    'todo', 'to do', 'need to', 'next', 'then', 'after',
                    'remaining', 'still', 'not yet', 'pending', 'waiting'
                ];
                
                const hasTaskIndicator = taskIndicators.some(ind => lower.includes(ind));
                
                if (hasTaskIndicator || msg.hasQuestion) {
                    // Check if it was answered
                    const nextMsg = messages[msg.index + 1];
                    const wasAnswered = nextMsg && nextMsg.role === 'assistant';
                    
                    if (!wasAnswered || msg.index >= messages.length - 3) {
                        // Likely still open
                        tasks.push(this.summarize(msg.content, 100));
                    }
                }
            }
        }
        
        return tasks;
    }

    // Extract rule from correction message
    extractRule(correctionText) {
        const lower = correctionText.toLowerCase();
        
        // Look for explicit rules
        if (lower.includes('instead')) {
            const parts = correctionText.split(/instead|rather than/i);
            return `Use ${parts[1]?.trim() || 'correct approach'}`;
        }
        
        if (lower.includes('always')) {
            const sentences = correctionText.split(/[.!?]/);
            const ruleSentence = sentences.find(s => s.toLowerCase().includes('always'));
            return ruleSentence?.trim() || 'Follow user preference';
        }
        
        if (lower.includes('never')) {
            const sentences = correctionText.split(/[.!?]/);
            const ruleSentence = sentences.find(s => s.toLowerCase().includes('never'));
            return ruleSentence?.trim() || 'Avoid this pattern';
        }
        
        // Default: summarize the correction
        return this.summarize(correctionText, 80);
    }

    // Summarize text to max length
    summarize(text, maxLength) {
        if (text.length <= maxLength) return text.trim();
        
        // Try to cut at sentence boundary
        const truncated = text.substring(0, maxLength);
        const lastPeriod = truncated.lastIndexOf('.');
        const lastQuestion = truncated.lastIndexOf('?');
        const lastExclaim = truncated.lastIndexOf('!');
        
        const cutPoint = Math.max(lastPeriod, lastQuestion, lastExclaim);
        
        if (cutPoint > maxLength * 0.7) {
            return text.substring(0, cutPoint + 1).trim();
        }
        
        return truncated.trim() + '...';
    }

    // Generate final markdown context file
    generateContextFile(components) {
        const { userIdentity, purpose, keyInfo, failures, preferences, importantPrompts, openTasks, metadata } = components;
        
        let markdown = `# Context: ${purpose.substring(0, 60)}

## 1. User Style
${userIdentity.style.join(', ')}

## 2. Goal
${purpose}

## 3. Key Facts
${keyInfo.slice(0, 5).join('; ')}

`;

        // Only show failures if they exist
        if (failures.length > 0) {
            markdown += `## 4. Corrections\n`;
            failures.forEach((failure, i) => {
                markdown += `**${i + 1}.** ${failure.correction}\n`;
                markdown += `   Rule: ${failure.rule}\n\n`;
            });
        }

        // Only show preferences if they exist
        const hasPrefs = preferences.always.length > 0 || preferences.never.length > 0;
        if (hasPrefs) {
            markdown += `## 5. Preferences\n`;
            if (preferences.always.length > 0) {
                markdown += `Always: ${preferences.always.join(', ')}\n`;
            }
            if (preferences.never.length > 0) {
                markdown += `Never: ${preferences.never.join(', ')}\n`;
            }
            markdown += `\n`;
        }

        // Top 3 important prompts only
        const topPrompts = importantPrompts.slice(0, 3);
        if (topPrompts.length > 0) {
            markdown += `## 6. Key Messages\n`;
            topPrompts.forEach((prompt, i) => {
                markdown += `${i + 1}. ${prompt}\n`;
            });
            markdown += `\n`;
        }

        // Only show open tasks if they exist
        if (openTasks.length > 0) {
            markdown += `## 7. Open Tasks\n`;
            openTasks.forEach(task => markdown += `- ${task}\n`);
        }

        return markdown;
    }
}

// Export for use
window.ContextExtractor = ContextExtractor;
