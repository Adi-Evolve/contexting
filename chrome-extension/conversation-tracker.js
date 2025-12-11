// MemoryForge - Conversation Tracker
// Groups messages into complete conversation threads with full context

class ConversationTracker {
    constructor() {
        this.currentConversation = null;
        this.conversationId = null;
        this.messageBuffer = [];
        this.lastMessageTime = null;
        this.conversationTimeout = 5 * 60 * 1000; // 5 minutes of inactivity = new conversation
        this.currentUrl = window.location.href;
        this.firstUserMessage = null; // Track first user message to identify unique conversations
        this.urlChangeHandler = this.handleUrlChange.bind(this);
        this.saveTimeout = null; // Debounce timer for auto-save
        
        // Monitor URL changes (navigation to different chats)
        this.startUrlMonitoring();
    }

    // Start URL monitoring for chat switches
    startUrlMonitoring() {
        // Check URL every second for changes
        setInterval(() => {
            const newUrl = window.location.href;
            if (newUrl !== this.currentUrl) {
                this.handleUrlChange(newUrl);
            }
        }, 1000);
    }

    // Handle URL change (chat switch)
    handleUrlChange(newUrl) {
        console.log('🔄 URL changed - chat navigation detected');
        console.log('Old:', this.currentUrl);
        console.log('New:', newUrl);
        
        // Check if this is a significant URL change (different chat ID)
        const oldChatId = this.extractChatId(this.currentUrl);
        const newChatId = this.extractChatId(newUrl);
        
        // Only create new conversation if:
        // 1. Both URLs have IDs AND they're different
        // 2. Old URL had no ID but new URL has ID (entering a specific chat)
        const shouldCreateNew = (
            (oldChatId !== null && newChatId !== null && oldChatId !== newChatId) ||
            (oldChatId === null && newChatId !== null)
        );
        
        if (shouldCreateNew) {
            // Definitely switched to a different chat
            if (this.currentConversation && this.currentConversation.messages.length > 0) {
                console.log('💾 Saving conversation before switching to different chat');
                this.saveConversation();
            }
            // Reset tracker and immediately create new conversation
            this.currentConversation = null;
            this.conversationId = null;
            this.firstUserMessage = null;
            console.log('✅ Creating new conversation for different chat');
            this.startNewConversation(true); // Force new conversation
        } else {
            // Same chat, just URL update (e.g., title change or content update)
            console.log('📝 Same chat (ID: ' + newChatId + '), continuing with current conversation');
        }
        
        this.currentUrl = newUrl;
    }
    
    // Extract chat ID from URL - Universal support for all AI platforms
    extractChatId(url) {
        // ChatGPT format: /c/[chat-id]
        const chatGptMatch = url.match(/\/c\/([a-f0-9-]+)/);
        if (chatGptMatch) return chatGptMatch[1];
        
        // Claude format: /chat/[chat-id]
        const claudeMatch = url.match(/\/chat\/([a-z0-9-]+)/);
        if (claudeMatch) return claudeMatch[1];
        
        // Gemini format: /app/[chat-id]
        const geminiMatch = url.match(/\/app\/([a-z0-9-]+)/);
        if (geminiMatch) return geminiMatch[1];
        
        // Grok format: /i/grok/[chat-id]
        const grokMatch = url.match(/\/i\/grok\/([a-z0-9-]+)/);
        if (grokMatch) return grokMatch[1];
        
        // DeepSeek format: /chat/[chat-id]
        const deepseekMatch = url.match(/chat\.deepseek\.com\/.*?([a-z0-9-]+)$/);
        if (deepseekMatch) return deepseekMatch[1];
        
        // Perplexity format: /search/[chat-id]
        const perplexityMatch = url.match(/\/search\/([a-z0-9-]+)/);
        if (perplexityMatch) return perplexityMatch[1];
        
        // Poe format: /[chat-id]
        const poeMatch = url.match(/poe\.com\/([a-zA-Z0-9_-]+)$/);
        if (poeMatch) return poeMatch[1];
        
        // HuggingChat format: /conversation/[chat-id]
        const huggingMatch = url.match(/\/conversation\/([a-z0-9-]+)/);
        if (huggingMatch) return huggingMatch[1];
        
        // Generic fallback: any alphanumeric ID at end of URL
        const genericMatch = url.match(/\/([a-zA-Z0-9_-]{10,})$/);
        if (genericMatch) return genericMatch[1];
        
        return null;
    }
    
    // Find existing conversation by chat ID
    async findConversationByChatId(chatId) {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({
                action: 'findConversationByChatId',
                chatId: chatId
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.warn('Could not check for existing conversation');
                    resolve(null);
                    return;
                }
                resolve(response?.conversation || null);
            });
        });
    }

    // Start a new conversation or load existing one
    async startNewConversation(forceNew = false) {
        const currentChatId = this.extractChatId(window.location.href);
        
        // IMMEDIATELY create conversation object to prevent race conditions
        // This must happen synchronously before any async operations
        this.conversationId = currentChatId 
            ? `conv_${currentChatId}` 
            : `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        this.currentConversation = {
            id: this.conversationId,
            chatId: currentChatId, // Store chat ID for lookup
            title: null, // Will be generated from first message or page title
            messages: [],
            startTime: Date.now(),
            endTime: null,
            messageCount: 0,
            url: window.location.href,
            platform: this.detectPlatform(),
            firstUserMessage: null // Track first message to identify this conversation
        };
        console.log(`🆕 Started new conversation: ${this.conversationId}`);
        
        // Try to find existing conversation with same chat ID (only if not forcing new)
        // This happens AFTER creating the object to prevent null reference errors
        if (currentChatId && !forceNew) {
            const existingConv = await this.findConversationByChatId(currentChatId);
            if (existingConv) {
                // Found existing - but on page reload, we want fresh capture
                // So we'll keep the new conversation and let it save/update later
                console.log(`📝 Found existing conversation ${existingConv.id}, but will capture fresh messages`);
            }
        }
    }

    // Detect platform (ChatGPT or Claude)
    detectPlatform() {
        if (window.location.hostname.includes('openai.com')) return 'chatgpt';
        if (window.location.hostname.includes('claude.ai')) return 'claude';
        return 'unknown';
    }

    // Add message to current conversation
    async addMessage(role, content) {
        const now = Date.now();
        
        console.log(`🔵 addMessage called: ${role}, content length: ${content.length}`);
        
        // Safety check - conversation should already exist (initialized in content script)
        if (!this.currentConversation) {
            console.error('❌ No current conversation! This should not happen.');
            return;
        }
        
        // Track first user message for conversation identification
        if (role === 'user' && !this.currentConversation.firstUserMessage) {
            this.currentConversation.firstUserMessage = content;
            this.firstUserMessage = content;
            console.log('📝 Set first user message for conversation');
        }
        
        // Check for timeout-based conversation separation (only with URL change)
        if (this.lastMessageTime && now - this.lastMessageTime > this.conversationTimeout) {
            // Timeout based separation (only if URL also changed or very long gap)
            const urlChanged = window.location.href !== this.currentUrl;
            if (urlChanged && this.currentConversation.messages.length > 0) {
                console.log('⏱️ Timeout + URL change - saving and starting new');
                this.saveConversation();
                this.startNewConversation();
            }
            // Otherwise just continue with current conversation (same chat, just long pause)
        }

        // Add message to current conversation
        const message = {
            role: role,
            content: content,
            timestamp: now,
            index: this.currentConversation.messages.length
        };

        this.currentConversation.messages.push(message);
        this.currentConversation.messageCount++;
        this.lastMessageTime = now;
        
        console.log(`✅ Added message to conversation. Total messages: ${this.currentConversation.messages.length}, Title: "${this.currentConversation.title || 'NOT SET'}"`);

        // Generate title from first user message (only if no title set yet)
        if (!this.currentConversation.title && role === 'user') {
            this.currentConversation.title = this.generateTitle(content);
            console.log(`📝 Generated title from first message: "${this.currentConversation.title}"`);
        }

        // Debounce auto-save: Save after assistant messages, but wait 1 second for more messages
        if (role === 'assistant') {
            if (this.saveTimeout) clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(() => {
                this.saveConversation();
            }, 1000); // Wait 1 second after last assistant message
        }

        console.log(`📝 Added ${role} message to conversation ${this.conversationId}`);
    }

    // Generate a short title from content
    generateTitle(content) {
        const cleaned = content.trim().replace(/\s+/g, ' ');
        if (cleaned.length <= 60) return cleaned;
        return cleaned.substring(0, 57) + '...';
    }

    // Save conversation to storage
    async saveConversation() {
        if (!this.currentConversation || this.currentConversation.messages.length === 0) {
            console.log('⏭️ Not saving - no conversation or no messages');
            return;
        }

        this.currentConversation.endTime = Date.now();

        console.log(`💾 Saving conversation: ${this.conversationId}`);
        console.log(`   - Title: "${this.currentConversation.title || 'UNTITLED'}"`);
        console.log(`   - Messages: ${this.currentConversation.messages.length}`);
        console.log(`   - ChatId: ${this.currentConversation.chatId}`);

        // Generate LLM-friendly summary
        const summary = this.generateLLMSummary(this.currentConversation);

        // Prepare conversation data
        const conversationData = {
            ...this.currentConversation,
            summary: summary,
            compressed: this.compressConversation(this.currentConversation),
            tokens: this.estimateTokens(summary.fullContext)
        };

        // Send to background script for storage (upsert)
        chrome.runtime.sendMessage({
            action: 'storeConversation',
            conversation: conversationData,
            upsert: true // Update if exists, create if new
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.warn('🔄 Extension context lost. Caching locally...');
                this.cacheLocally(conversationData);
                // Reinitialize conversation after caching
                this.startNewConversation(true);
                return;
            }
            if (response?.success) {
                console.log(`✅ Saved/Updated conversation: ${this.conversationId}`);
                // Notify content script to refresh sidebar
                window.dispatchEvent(new CustomEvent('conversationSaved', { 
                    detail: { id: this.conversationId } 
                }));
                // Reinitialize conversation for continued tracking
                this.startNewConversation(true);
            }
        });
    }

    // Generate LLM-friendly conversation summary
    generateLLMSummary(conversation) {
        const messages = conversation.messages;
        
        // Full context in LLM format (like ChatGPT API format)
        const fullContext = messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        // Create a compressed narrative format
        const narrative = messages.map((msg, i) => {
            const prefix = msg.role === 'user' ? 'Human' : 'Assistant';
            return `${prefix}: ${msg.content}`;
        }).join('\n\n');

        // Create XML-style format (Claude-friendly)
        const xmlFormat = `<conversation>
<metadata>
  <platform>${conversation.platform}</platform>
  <started>${new Date(conversation.startTime).toISOString()}</started>
  <messages>${conversation.messageCount}</messages>
</metadata>
<exchanges>
${messages.map((msg, i) => `  <turn index="${i}" role="${msg.role}">
    ${this.escapeXml(msg.content)}
  </turn>`).join('\n')}
</exchanges>
</conversation>`;

        // Create a semantic summary
        const semanticSummary = this.createSemanticSummary(messages);

        // 🆕 Generate detailed context format using ContextExtractor
        let optimalContext = null;
        if (typeof ContextExtractor !== 'undefined') {
            try {
                console.log('✅ ContextExtractor found, generating 7-point context...');
                const extractor = new ContextExtractor();
                optimalContext = extractor.extractContext(conversation);
                console.log('✅ Generated optimalContext:', optimalContext ? optimalContext.substring(0, 100) + '...' : 'NULL');
            } catch (e) {
                console.error('❌ Context extraction failed:', e);
            }
        } else {
            console.error('❌ ContextExtractor not found! Script may not have loaded.');
        }

        return {
            fullContext: fullContext,           // OpenAI API format
            narrative: narrative,               // Plain narrative
            xml: xmlFormat,                     // Claude XML format
            semantic: semanticSummary,          // Semantic keywords/topics
            contextPrompt: this.createContextPrompt(conversation),  // Ready-to-use prompt
            optimalContext: optimalContext      // 🆕 7-point format (best for LLMs)
        };
    }

    // Create semantic summary (topics, keywords, intent)
    createSemanticSummary(messages) {
        const allText = messages.map(m => m.content).join(' ');
        
        // Extract key topics (simple word frequency)
        const words = allText.toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 4); // Words longer than 4 chars

        const frequency = {};
        words.forEach(w => frequency[w] = (frequency[w] || 0) + 1);
        
        const topics = Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(e => e[0]);

        return {
            topics: topics,
            messageCount: messages.length,
            userMessageCount: messages.filter(m => m.role === 'user').length,
            assistantMessageCount: messages.filter(m => m.role === 'assistant').length,
            totalLength: allText.length
        };
    }

    // Create a ready-to-use context prompt
    createContextPrompt(conversation) {
        const msgs = conversation.messages.slice(0, 5); // First 5 exchanges for context
        
        return `Here is the context from a previous conversation:

Title: ${conversation.title || 'Untitled Conversation'}
Platform: ${conversation.platform}
Started: ${new Date(conversation.startTime).toLocaleString()}
Total messages: ${conversation.messageCount}

Previous exchanges:
${msgs.map((msg, i) => `${i + 1}. ${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content.substring(0, 200)}${msg.content.length > 200 ? '...' : ''}`).join('\n')}

${conversation.messageCount > 5 ? `[... and ${conversation.messageCount - 5} more exchanges]` : ''}

You can now continue this conversation with full context.`;
    }

    // Compress conversation using delta encoding
    compressConversation(conversation) {
        // Store full messages but with compression hints
        return {
            id: conversation.id,
            title: conversation.title,
            times: [conversation.startTime, conversation.endTime],
            msgs: conversation.messages.map(m => [
                m.role === 'user' ? 'u' : 'a',
                m.content,
                m.timestamp - conversation.startTime
            ])
        };
    }

    // Estimate token count (rough approximation)
    estimateTokens(fullContext) {
        const text = JSON.stringify(fullContext);
        return Math.ceil(text.length / 4); // Rough: 1 token ≈ 4 chars
    }

    // Escape XML special characters
    escapeXml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    // Cache locally if extension context is lost
    cacheLocally(conversationData) {
        try {
            const cached = JSON.parse(localStorage.getItem('mf_cached_conversations') || '[]');
            cached.push(conversationData);
            localStorage.setItem('mf_cached_conversations', JSON.stringify(cached.slice(-10))); // Keep last 10
            console.log('💾 Cached conversation locally');
        } catch (e) {
            console.error('Failed to cache locally:', e);
        }
    }

    // Calculate similarity between two strings (simple word overlap)
    calculateSimilarity(str1, str2) {
        const words1 = new Set(str1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
        const words2 = new Set(str2.toLowerCase().split(/\s+/).filter(w => w.length > 3));
        
        if (words1.size === 0 || words2.size === 0) return 0;
        
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        
        return intersection.size / union.size; // Jaccard similarity
    }

    // Force save current conversation
    forceSave() {
        if (this.currentConversation && this.currentConversation.messages.length > 0) {
            this.saveConversation();
        }
    }
}

// Export for use in content scripts
window.ConversationTracker = ConversationTracker;
