// Conversation Threading Engine
// Detects topic shifts and sub-conversations within a chat session

class ConversationThreader {
    constructor(config = {}) {
        this.config = {
            // Core thresholds
            threadBoundaryThreshold: config.threadBoundaryThreshold || 0.35,
            minThreadLength: config.minThreadLength || 2,
            maxThreadGap: config.maxThreadGap || 15, // minutes
            
            // Weights for hybrid scoring
            semanticWeight: config.semanticWeight || 0.40,
            structuralWeight: config.structuralWeight || 0.25,
            timeWeight: config.timeWeight || 0.20,
            entityWeight: config.entityWeight || 0.15,
            
            // Detection markers
            topicShiftMarkers: [
                "let's", "now", "next", "how about", "what about", "moving to",
                "switching to", "instead", "different", "another", "new topic"
            ],
            completionMarkers: [
                "done", "thanks", "got it", "perfect", "great", "understood",
                "makes sense", "clear", "appreciate"
            ],
            
            // Entity lists
            programmingLanguages: [
                "python", "javascript", "java", "c++", "rust", "go", "typescript",
                "ruby", "php", "swift", "kotlin", "c#", "scala", "r", "matlab"
            ],
            frameworks: [
                "react", "vue", "angular", "svelte", "flask", "django", "spring",
                "express", "fastapi", "rails", "laravel", "dotnet", "tensorflow"
            ],
            tools: [
                "git", "docker", "kubernetes", "vscode", "npm", "webpack", "babel",
                "jenkins", "github", "gitlab", "aws", "azure", "gcp"
            ]
        };
    }
    
    /**
     * Main entry point - analyzes conversation and returns threads
     * @param {Array} messages - Array of {role, content, timestamp?}
     * @returns {Array} Array of thread objects
     */
    analyzeConversation(messages) {
        if (!messages || messages.length < this.config.minThreadLength) {
            return [{
                id: 'thread_1',
                title: 'Single Thread',
                startIndex: 0,
                endIndex: messages.length - 1,
                messages: messages,
                topic: 'General discussion',
                confidence: 1.0
            }];
        }
        
        // Step 1: Preprocess messages
        const enrichedMessages = this.preprocessMessages(messages);
        
        // Step 2: Calculate boundary scores
        const boundaries = this.detectBoundaries(enrichedMessages);
        
        // Step 3: Create threads from boundaries
        const threads = this.createThreads(messages, boundaries);
        
        // Step 4: Generate thread titles and topics
        return threads.map(thread => this.enrichThread(thread));
    }
    
    /**
     * Extract keywords, entities, and metadata from messages
     */
    preprocessMessages(messages) {
        return messages.map((msg, index) => ({
            ...msg,
            index,
            keywords: this.extractKeywords(msg.content),
            entities: this.extractEntities(msg.content),
            hasQuestion: msg.content.includes('?'),
            timestamp: msg.timestamp || Date.now()
        }));
    }
    
    /**
     * Extract significant keywords (basic stopword removal)
     */
    extractKeywords(text) {
        const stopwords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'been', 'be',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
            'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his',
            'her', 'its', 'our', 'their', 'me', 'him', 'them', 'what', 'which',
            'who', 'when', 'where', 'why', 'how'
        ]);
        
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopwords.has(word))
            .slice(0, 20); // Top 20 keywords
    }
    
    /**
     * Extract programming entities (languages, frameworks, tools)
     */
    extractEntities(text) {
        const textLower = text.toLowerCase();
        const entities = {
            languages: [],
            frameworks: [],
            tools: []
        };
        
        this.config.programmingLanguages.forEach(lang => {
            if (textLower.includes(lang)) entities.languages.push(lang);
        });
        
        this.config.frameworks.forEach(fw => {
            if (textLower.includes(fw)) entities.frameworks.push(fw);
        });
        
        this.config.tools.forEach(tool => {
            if (textLower.includes(tool)) entities.tools.push(tool);
        });
        
        return entities;
    }
    
    /**
     * Detect thread boundaries using hybrid scoring
     */
    detectBoundaries(enrichedMessages) {
        const boundaries = [0]; // First message is always a boundary
        
        for (let i = 1; i < enrichedMessages.length; i++) {
            const prev = enrichedMessages[i - 1];
            const curr = enrichedMessages[i];
            
            // Only check user messages as potential boundaries
            if (curr.role !== 'user') continue;
            
            // Calculate 4 signals
            const semanticScore = this.calculateSemanticSimilarity(prev, curr);
            const structuralScore = this.calculateStructuralScore(curr);
            const timeScore = this.calculateTimeGapScore(prev, curr);
            const entityScore = this.calculateEntitySimilarity(prev, curr);
            
            // Combined weighted score
            const combinedScore = 
                (this.config.semanticWeight * semanticScore) +
                (this.config.structuralWeight * structuralScore) +
                (this.config.timeWeight * timeScore) +
                (this.config.entityWeight * entityScore);
            
            // If score is below threshold, it's a new thread
            if (combinedScore < this.config.threadBoundaryThreshold) {
                boundaries.push(i);
            }
        }
        
        boundaries.push(enrichedMessages.length); // End boundary
        return boundaries;
    }
    
    /**
     * Calculate semantic similarity using Jaccard coefficient
     */
    calculateSemanticSimilarity(msg1, msg2) {
        const set1 = new Set(msg1.keywords);
        const set2 = new Set(msg2.keywords);
        
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        
        return union.size > 0 ? intersection.size / union.size : 0;
    }
    
    /**
     * Calculate structural score based on explicit markers
     */
    calculateStructuralScore(message) {
        const textLower = message.content.toLowerCase();
        let score = 1.0; // Start at max (high similarity)
        
        // Check for topic shift markers (reduce score = new thread)
        const hasTopicShift = this.config.topicShiftMarkers.some(marker => 
            textLower.includes(marker)
        );
        
        if (hasTopicShift) {
            score -= 0.6; // Strong signal for new thread
        }
        
        // New question might be new topic
        if (message.hasQuestion) {
            score -= 0.2;
        }
        
        return Math.max(0, score);
    }
    
    /**
     * Calculate time gap score
     */
    calculateTimeGapScore(msg1, msg2) {
        if (!msg1.timestamp || !msg2.timestamp) return 1.0;
        
        const gapMinutes = (msg2.timestamp - msg1.timestamp) / (1000 * 60);
        
        if (gapMinutes > this.config.maxThreadGap) {
            return 0.0; // Definite break
        } else if (gapMinutes > 5) {
            return 0.5; // Possible break
        }
        
        return 1.0; // Continuous conversation
    }
    
    /**
     * Calculate entity similarity
     */
    calculateEntitySimilarity(msg1, msg2) {
        const allEntities1 = [
            ...msg1.entities.languages,
            ...msg1.entities.frameworks,
            ...msg1.entities.tools
        ];
        
        const allEntities2 = [
            ...msg2.entities.languages,
            ...msg2.entities.frameworks,
            ...msg2.entities.tools
        ];
        
        if (allEntities1.length === 0 && allEntities2.length === 0) {
            return 1.0; // No entities, assume same topic
        }
        
        const set1 = new Set(allEntities1);
        const set2 = new Set(allEntities2);
        
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        
        return union.size > 0 ? intersection.size / union.size : 0;
    }
    
    /**
     * Create thread objects from boundaries
     */
    createThreads(messages, boundaries) {
        const threads = [];
        
        for (let i = 0; i < boundaries.length - 1; i++) {
            const startIndex = boundaries[i];
            const endIndex = boundaries[i + 1] - 1;
            
            // Skip if too short
            if (endIndex - startIndex + 1 < this.config.minThreadLength) {
                continue;
            }
            
            threads.push({
                id: `thread_${threads.length + 1}`,
                startIndex,
                endIndex,
                messages: messages.slice(startIndex, endIndex + 1)
            });
        }
        
        // If no threads created, return entire conversation as one thread
        if (threads.length === 0) {
            threads.push({
                id: 'thread_1',
                startIndex: 0,
                endIndex: messages.length - 1,
                messages: messages
            });
        }
        
        return threads;
    }
    
    /**
     * Generate title and topic for a thread
     */
    enrichThread(thread) {
        const userMessages = thread.messages.filter(m => m.role === 'user');
        
        // Try to extract title from first user message
        let title = 'Discussion';
        if (userMessages.length > 0) {
            const firstMsg = userMessages[0].content;
            
            // If it's a question, use it
            if (firstMsg.includes('?')) {
                title = firstMsg.substring(0, 60).trim();
                if (title.length >= 60) title += '...';
            } else {
                // Extract key phrase
                title = this.extractKeyPhrase(firstMsg);
            }
        }
        
        // Extract topic from all messages
        const allKeywords = thread.messages
            .flatMap(m => this.extractKeywords(m.content))
            .reduce((acc, word) => {
                acc[word] = (acc[word] || 0) + 1;
                return acc;
            }, {});
        
        // Get top 3 keywords
        const topKeywords = Object.entries(allKeywords)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([word]) => word);
        
        const topic = topKeywords.join(', ') || 'General discussion';
        
        // Calculate confidence based on thread clarity
        const confidence = this.calculateThreadConfidence(thread);
        
        return {
            ...thread,
            title,
            topic,
            confidence
        };
    }
    
    /**
     * Extract a meaningful key phrase from text
     */
    extractKeyPhrase(text) {
        // Look for patterns like "how to X", "explain X", "what is X"
        const patterns = [
            /(?:how to|how do|how can|how does)\s+([^.?!]+)/i,
            /(?:explain|describe|tell me about)\s+([^.?!]+)/i,
            /(?:what is|what are|what's)\s+([^.?!]+)/i,
            /(?:create|build|make|implement)\s+([^.?!]+)/i
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                let phrase = match[1].trim().substring(0, 50);
                return phrase.charAt(0).toUpperCase() + phrase.slice(1);
            }
        }
        
        // Fallback: first few words
        const words = text.split(/\s+/).slice(0, 6).join(' ');
        return words.substring(0, 50);
    }
    
    /**
     * Calculate confidence score for thread detection
     */
    calculateThreadConfidence(thread) {
        let confidence = 0.7; // Base confidence
        
        // More messages = higher confidence
        if (thread.messages.length >= 6) confidence += 0.1;
        if (thread.messages.length >= 10) confidence += 0.1;
        
        // Has clear entities = higher confidence
        const hasEntities = thread.messages.some(m => {
            const entities = this.extractEntities(m.content);
            return entities.languages.length > 0 || 
                   entities.frameworks.length > 0 ||
                   entities.tools.length > 0;
        });
        
        if (hasEntities) confidence += 0.1;
        
        return Math.min(1.0, confidence);
    }
}

// Export for use in Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConversationThreader;
}
