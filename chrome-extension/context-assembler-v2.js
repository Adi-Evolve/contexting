/**
 * @fileoverview Context Assembler V2 - Optimal Context Window Solution
 * @description Implements 4-layer context architecture for AI memory persistence
 * 
 * Layer 0: Role & Persona (200 tokens) - WHO the assistant was
 * Layer 1: Canonical State (600 tokens) - WHAT has been decided
 * Layer 2: Recent Context (500 tokens) - WHERE we are now
 * Layer 3: Relevant History (300 tokens) - WHY it matters
 * 
 * Total: ~1600 tokens (optimal for all LLM context windows)
 * 
 * @author VOID Memory Extension
 * @version 2.0.0
 * @date 2025-12-11
 */

'use strict';

// ============================================================================
// LOGGING SYSTEM
// ============================================================================

const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

class Logger {
    constructor(module, minLevel = LogLevel.INFO) {
        this.module = module;
        this.minLevel = minLevel;
        this.performanceMarks = new Map();
    }
    
    debug(message, ...args) {
        if (this.minLevel <= LogLevel.DEBUG) {
            console.debug(`🔍 [${this.module}] ${message}`, ...args);
        }
    }
    
    info(message, ...args) {
        if (this.minLevel <= LogLevel.INFO) {
            console.log(`ℹ️ [${this.module}] ${message}`, ...args);
        }
    }
    
    warn(message, ...args) {
        if (this.minLevel <= LogLevel.WARN) {
            console.warn(`⚠️ [${this.module}] ${message}`, ...args);
        }
    }
    
    error(message, ...args) {
        if (this.minLevel <= LogLevel.ERROR) {
            console.error(`❌ [${this.module}] ${message}`, ...args);
        }
    }
    
    time(label) {
        const key = `${this.module}:${label}`;
        this.performanceMarks.set(key, performance.now());
        console.time(`⏱️ [${this.module}] ${label}`);
    }
    
    timeEnd(label) {
        const key = `${this.module}:${label}`;
        const duration = performance.now() - (this.performanceMarks.get(key) || 0);
        console.timeEnd(`⏱️ [${this.module}] ${label}`);
        this.performanceMarks.delete(key);
        return duration;
    }
}

// ============================================================================
// ERROR HANDLING SYSTEM
// ============================================================================

const ErrorTypes = {
    CONVERSATION_NOT_FOUND: 'ConversationNotFound',
    EXTRACTION_FAILED: 'ExtractionFailed',
    TOKEN_LIMIT_EXCEEDED: 'TokenLimitExceeded',
    INVALID_FORMAT: 'InvalidFormat',
    STORAGE_ERROR: 'StorageError',
    CONTRADICTION_DETECTION_FAILED: 'ContradictionDetectionFailed',
    MODULE_NOT_LOADED: 'ModuleNotLoaded',
    TIMEOUT: 'Timeout',
    VALIDATION_FAILED: 'ValidationFailed'
};

class VoidError extends Error {
    constructor(type, message, originalError = null, context = {}) {
        super(message);
        this.name = 'VoidError';
        this.type = type;
        this.originalError = originalError;
        this.context = context;
        this.timestamp = Date.now();
    }
}

class ErrorHandler {
    static logger = new Logger('ErrorHandler');
    
    /**
     * Handle error with logging and user message generation
     */
    static handle(error, context = {}) {
        const errorInfo = {
            type: error.type || ErrorTypes.UNKNOWN,
            message: error.message,
            context: context,
            timestamp: Date.now(),
            stack: error.stack,
            originalError: error.originalError
        };
        
        // Log to console with emoji for visibility
        this.logger.error('Error occurred:', errorInfo);
        
        // Log to storage for debugging
        this.logToStorage(errorInfo);
        
        // Return user-friendly message
        return this.getUserMessage(errorInfo);
    }
    
    /**
     * Log error to storage for debugging
     */
    static async logToStorage(errorInfo) {
        try {
            const result = await chrome.storage.local.get(['error_log']);
            const log = result.error_log || [];
            
            log.push(errorInfo);
            
            // Keep only last 50 errors
            if (log.length > 50) {
                log.shift();
            }
            
            await chrome.storage.local.set({ error_log: log });
        } catch (storageError) {
            console.error('❌ Failed to log error to storage:', storageError);
        }
    }
    
    /**
     * Get user-friendly error message
     */
    static getUserMessage(errorInfo) {
        const messages = {
            ConversationNotFound: 'Could not find the conversation. Please try again.',
            ExtractionFailed: 'Failed to extract context. The conversation may be corrupted.',
            TokenLimitExceeded: 'Context is too large. Try reducing the number of messages.',
            InvalidFormat: 'Invalid data format. Please refresh the page.',
            StorageError: 'Storage error. Your browser may be full.',
            ContradictionDetectionFailed: 'Could not detect contradictions. Continuing without this check.',
            ModuleNotLoaded: 'Required module not loaded. Please refresh the page.',
            Timeout: 'Operation timed out. The conversation may be too large.',
            ValidationFailed: 'Invalid conversation data. Please try a different conversation.'
        };
        
        return messages[errorInfo.type] || 'An unexpected error occurred. Please try again.';
    }
    
    /**
     * Wrap async function with timeout
     */
    static async withTimeout(promise, timeoutMs = 5000, operationName = 'Operation') {
        return Promise.race([
            promise,
            new Promise((_, reject) => 
                setTimeout(() => reject(
                    new VoidError(ErrorTypes.TIMEOUT, `${operationName} timed out after ${timeoutMs}ms`)
                ), timeoutMs)
            )
        ]);
    }
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG = {
    tokenLimits: {
        layer0: 200,  // Role & Persona
        layer1: 600,  // Canonical State
        layer2: 500,  // Recent Context
        layer3: 300,  // Relevant History
        total: 1600   // Maximum total
    },
    
    performance: {
        timeout: 5000,
        maxCacheSize: 10,
        enableWebWorkers: false
    },
    
    features: {
        contradictionDetection: true,
        relevantHistory: true,
        roleExtraction: true,
        userProfile: true
    },
    
    logging: {
        level: LogLevel.INFO,
        enablePerformanceMetrics: true
    },
    
    models: {
        default: 'chatgpt',
        available: ['chatgpt', 'claude', 'gemini', 'llama']
    },
    
    recentMessageCount: 5,  // Number of recent messages to include
    maxHistorySnippets: 3   // Maximum relevant history snippets
};

// ============================================================================
// CONTEXT ASSEMBLER V2 - MAIN CLASS
// ============================================================================

class ContextAssemblerV2 {
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.logger = new Logger('ContextAssemblerV2', this.config.logging.level);
        this.cache = new Map();
        this.isProcessing = false;
        this.requestQueue = [];
        
        this.logger.info('ContextAssemblerV2 initialized', { config: this.config });
        
        // Verify required modules are loaded
        this.verifyModules();
    }
    
    /**
     * Verify that required modules are loaded
     * Note: ContextExtractor is a content script, not available in background worker
     */
    verifyModules() {
        const required = {
            HierarchyManager: typeof HierarchyManager !== 'undefined',
            CausalReasoner: typeof CausalReasoner !== 'undefined'
        };
        
        const optional = {
            SemanticFingerprintV2: typeof SemanticFingerprintV2 !== 'undefined',
            MultiModalHandler: typeof MultiModalHandler !== 'undefined'
        };
        
        const missing = Object.entries(required)
            .filter(([name, loaded]) => !loaded)
            .map(([name]) => name);
        
        const missingOptional = Object.entries(optional)
            .filter(([name, loaded]) => !loaded)
            .map(([name]) => name);
        
        if (missing.length > 0) {
            this.logger.warn('Critical modules not loaded:', missing);
            // Don't throw error - gracefully degrade functionality
        }
        
        if (missingOptional.length > 0) {
            this.logger.debug('Optional modules not loaded:', missingOptional);
        }
        
        if (missing.length === 0) {
            this.logger.info('✅ All required modules loaded');
        }
    }
    
    /**
     * Main method: Assemble context for new chat
     * @param {string} conversationId - ID of the conversation
     * @param {string|null} userQuery - Optional user query for relevance filtering
     * @returns {Promise<Object>} Context package with prompt, tokens, layers
     */
    async assembleForNewChat(conversationId, userQuery = null) {
        this.logger.info('assembleForNewChat called', { conversationId, userQuery });
        this.logger.time('Total Assembly');
        
        // Handle concurrent requests
        if (this.isProcessing) {
            this.logger.warn('Assembly already in progress, queuing request');
            return new Promise((resolve, reject) => {
                this.requestQueue.push({ conversationId, userQuery, resolve, reject });
            });
        }
        
        this.isProcessing = true;
        
        try {
            // Wrap entire operation in timeout
            const result = await ErrorHandler.withTimeout(
                this._doAssemble(conversationId, userQuery),
                this.config.performance.timeout,
                'Context Assembly'
            );
            
            this.logger.timeEnd('Total Assembly');
            this.logger.info('Context assembly complete', {
                tokenEstimate: result.tokenEstimate,
                layerCount: Object.keys(result.layers).length,
                hasContradictions: result.contradictions.length > 0
            });
            
            // Process next request in queue
            this._processQueue();
            
            return result;
            
        } catch (error) {
            this.isProcessing = false;
            this.logger.error('Context assembly failed', { error });
            
            throw new VoidError(
                error.type || ErrorTypes.EXTRACTION_FAILED,
                'Failed to assemble context',
                error,
                { conversationId, userQuery }
            );
        }
    }
    
    /**
     * Process next request in queue
     */
    _processQueue() {
        if (this.requestQueue.length > 0) {
            const next = this.requestQueue.shift();
            this.assembleForNewChat(next.conversationId, next.userQuery)
                .then(next.resolve)
                .catch(next.reject);
        } else {
            this.isProcessing = false;
        }
    }
    
    /**
     * Internal assembly method
     */
    async _doAssemble(conversationId, userQuery) {
        // 1. Load conversation from storage
        this.logger.time('Load Conversation');
        const conversation = await this._loadConversation(conversationId);
        this.logger.timeEnd('Load Conversation');
        
        // 2. Validate conversation
        this._validateConversation(conversation);
        
        // 3. Extract Layer 0: Role & Persona
        this.logger.time('Layer 0');
        let layer0 = null;
        if (this.config.features.roleExtraction) {
            try {
                layer0 = this.extractRoleContext(conversation);
                this.logger.debug('Layer 0 extracted', { 
                    mode: layer0.assistantRole?.mode,
                    patternCount: layer0.assistantRole?.establishedPatterns?.length || 0
                });
            } catch (error) {
                this.logger.warn('Layer 0 extraction failed, using defaults', { error: error.message });
                layer0 = this._getDefaultRoleContext();
            }
        }
        this.logger.timeEnd('Layer 0');
        
        // 4. Extract Layer 1: Canonical State
        this.logger.time('Layer 1');
        const layer1 = await this.getCanonicalStateEnhanced(conversation);
        this.logger.debug('Layer 1 extracted', { 
            decisionCount: layer1.decisions?.length || 0,
            failureCount: layer1.failures?.length || 0
        });
        this.logger.timeEnd('Layer 1');
        
        // 5. Extract Layer 2: Recent Context
        this.logger.time('Layer 2');
        const layer2 = this.getImmediateContext(conversation);
        this.logger.debug('Layer 2 extracted', { 
            messageCount: layer2.messages?.length || 0
        });
        this.logger.timeEnd('Layer 2');
        
        // 6. Extract Layer 3: Relevant History (if query provided)
        this.logger.time('Layer 3');
        let layer3 = null;
        if (this.config.features.relevantHistory && userQuery) {
            try {
                layer3 = await this.getRelevantHistorySimplified(conversation, userQuery);
                this.logger.debug('Layer 3 extracted', { 
                    snippetCount: layer3?.snippets?.length || 0
                });
            } catch (error) {
                this.logger.warn('Layer 3 extraction failed, skipping', { error: error.message });
                layer3 = null;
            }
        }
        this.logger.timeEnd('Layer 3');
        
        // 7. Detect contradictions
        this.logger.time('Contradiction Detection');
        let contradictions = [];
        if (this.config.features.contradictionDetection) {
            try {
                contradictions = this.detectContradictions(layer1);
                this.logger.debug('Contradictions detected', { count: contradictions.length });
            } catch (error) {
                this.logger.warn('Contradiction detection failed', { error: error.message });
            }
        }
        this.logger.timeEnd('Contradiction Detection');
        
        // 8. Compose final prompt
        this.logger.time('Prompt Composition');
        const prompt = this.composePromptV2(layer0, layer1, layer2, layer3, userQuery);
        this.logger.timeEnd('Prompt Composition');
        
        // 9. Estimate tokens
        const tokenEstimate = this.estimateTokens(prompt);
        const tokenBreakdown = {
            layer0: layer0 ? this.estimateTokens(JSON.stringify(layer0)) : 0,
            layer1: this.estimateTokens(JSON.stringify(layer1)),
            layer2: this.estimateTokens(JSON.stringify(layer2)),
            layer3: layer3 ? this.estimateTokens(JSON.stringify(layer3)) : 0,
            total: tokenEstimate
        };
        
        this.logger.info('Token breakdown', tokenBreakdown);
        
        // 10. Prepare initial context package
        let contextPackage = {
            prompt: prompt,
            tokenEstimate: tokenEstimate,
            tokenBreakdown: tokenBreakdown,
            layers: {
                layer0: layer0,
                layer1: layer1,
                layer2: layer2,
                layer3: layer3
            },
            contradictions: contradictions,
            metadata: {
                conversationId: conversationId,
                userQuery: userQuery,
                timestamp: Date.now(),
                version: '2.0.0'
            },
            wasTruncated: false
        };
        
        // 11. Apply token budget enforcement if needed
        if (tokenEstimate > this.config.tokenLimits.total) {
            this.logger.warn('Token limit exceeded, applying budget enforcement', {
                estimate: tokenEstimate,
                limit: this.config.tokenLimits.total,
                overage: tokenEstimate - this.config.tokenLimits.total
            });
            
            contextPackage = this.fitToTokenBudget(contextPackage, this.config.tokenLimits.total);
        }
        
        return contextPackage;
    }
    
    /**
     * Load conversation from storage
     */
    async _loadConversation(conversationId) {
        try {
            const result = await chrome.storage.local.get(['conversations']);
            const conversations = result.conversations || [];
            
            // Conversations are stored as an array, find by ID
            const conversation = Array.isArray(conversations) 
                ? conversations.find(c => c.id === conversationId)
                : conversations[conversationId]; // Fallback to object format
            
            if (!conversation) {
                this.logger.error('Conversation not found', { 
                    conversationId, 
                    totalConversations: Array.isArray(conversations) ? conversations.length : Object.keys(conversations).length,
                    availableIds: Array.isArray(conversations) 
                        ? conversations.map(c => c.id).slice(0, 5)
                        : Object.keys(conversations).slice(0, 5)
                });
                
                throw new VoidError(
                    ErrorTypes.CONVERSATION_NOT_FOUND,
                    `Conversation ${conversationId} not found in storage`,
                    null,
                    { conversationId, availableConversations: Array.isArray(conversations) ? conversations.length : Object.keys(conversations).length }
                );
            }
            
            this.logger.debug('Conversation loaded successfully', { 
                conversationId,
                messageCount: conversation.messages?.length || 0,
                hasTitle: !!conversation.title
            });
            
            return conversation;
            
        } catch (error) {
            if (error instanceof VoidError) {
                throw error;
            }
            
            throw new VoidError(
                ErrorTypes.STORAGE_ERROR,
                'Failed to load conversation from storage',
                error,
                { conversationId }
            );
        }
    }
    
    /**
     * Validate conversation structure
     */
    _validateConversation(conversation) {
        const errors = [];
        
        if (!conversation) {
            errors.push('Conversation is null or undefined');
        }
        
        if (!conversation.id) {
            errors.push('Conversation missing ID');
        }
        
        if (!Array.isArray(conversation.messages)) {
            errors.push('Conversation messages is not an array');
        }
        
        if (conversation.messages && conversation.messages.length === 0) {
            errors.push('Conversation has no messages');
        }
        
        // Check message structure
        if (conversation.messages) {
            conversation.messages.forEach((msg, index) => {
                if (!msg.role) {
                    errors.push(`Message ${index} missing role`);
                }
                if (!msg.content && !msg.text) {
                    errors.push(`Message ${index} missing content`);
                }
            });
        }
        
        if (errors.length > 0) {
            this.logger.error('Invalid conversation data', { errors });
            throw new VoidError(
                ErrorTypes.VALIDATION_FAILED,
                'Invalid conversation data',
                null,
                { errors: errors }
            );
        }
        
        return true;
    }
    
    // ========================================================================
    // LAYER 0: ROLE & PERSONA EXTRACTION
    // ========================================================================
    
    /**
     * Extract role and persona context (Layer 0)
     * @returns {Object} Role context with assistant role and user profile
     */
    extractRoleContext(conversation) {
        this.logger.debug('Extracting role context...');
        
        const assistantRole = this._inferAssistantMode(conversation);
        const userProfile = this._extractUserProfile(conversation);
        
        return {
            assistantRole: assistantRole,
            userProfile: userProfile
        };
    }
    
    /**
     * Infer assistant's mode and behavior style
     */
    _inferAssistantMode(conversation) {
        const messages = conversation.messages || [];
        
        // Analyze first few assistant messages
        const assistantMessages = messages
            .filter(m => m.role === 'assistant')
            .slice(0, 10);
        
        // Detect mode
        let mode = 'General assistant';
        const codeBlockCount = assistantMessages.filter(m => 
            (m.content || m.text || '').includes('```')
        ).length;
        
        if (codeBlockCount > 3) {
            mode = 'Coding assistant';
        } else if (assistantMessages.some(m => 
            /(explain|teach|learn|understand)/i.test(m.content || m.text || '')
        )) {
            mode = 'Educational tutor';
        } else if (assistantMessages.some(m => 
            /(debug|error|fix|issue)/i.test(m.content || m.text || '')
        )) {
            mode = 'Debugging partner';
        }
        
        // Detect behavior style
        let behaviorStyle = 'Balanced';
        const avgLength = assistantMessages.reduce((sum, m) => 
            sum + (m.content || m.text || '').length, 0
        ) / assistantMessages.length;
        
        if (avgLength < 200) {
            behaviorStyle = 'Concise';
        } else if (avgLength > 800) {
            behaviorStyle = 'Detailed';
        }
        
        // Extract established patterns
        const patterns = [];
        if (codeBlockCount > 0) {
            patterns.push('Provides code examples');
        }
        if (assistantMessages.some(m => /step-by-step|first|then|finally/i.test(m.content || m.text || ''))) {
            patterns.push('Uses step-by-step explanations');
        }
        if (assistantMessages.some(m => /\*\*|\*|#/i.test(m.content || m.text || ''))) {
            patterns.push('Uses formatting for clarity');
        }
        
        return {
            mode: mode,
            behaviorStyle: behaviorStyle,
            establishedPatterns: patterns
        };
    }
    
    /**
     * Extract user profile and preferences
     */
    _extractUserProfile(conversation) {
        const messages = conversation.messages || [];
        const userMessages = messages.filter(m => m.role === 'user');
        
        // Infer communication style
        let communicationStyle = 'Standard';
        const avgUserLength = userMessages.reduce((sum, m) => 
            sum + (m.content || m.text || '').length, 0
        ) / userMessages.length;
        
        if (avgUserLength < 100) {
            communicationStyle = 'Brief/Direct';
        } else if (avgUserLength > 300) {
            communicationStyle = 'Detailed/Thorough';
        }
        
        // Infer technical level
        let technicalLevel = 'Intermediate';
        const technicalTerms = ['api', 'function', 'class', 'async', 'await', 'promise', 'callback'];
        const hasTechnicalTerms = userMessages.some(m => 
            technicalTerms.some(term => 
                (m.content || m.text || '').toLowerCase().includes(term)
            )
        );
        
        if (hasTechnicalTerms) {
            technicalLevel = 'Advanced';
        }
        
        // Extract explicit preferences from ContextExtractor
        const preferences = [];
        try {
            if (typeof ContextExtractor !== 'undefined') {
                const extractor = new ContextExtractor();
                const context = extractor.extractContext(conversation);
                if (context.preferences) {
                    preferences.push(...context.preferences);
                }
            }
        } catch (error) {
            this.logger.warn('Failed to extract preferences from ContextExtractor', { error: error.message });
        }
        
        return {
            communicationStyle: communicationStyle,
            technicalLevel: technicalLevel,
            explicitPreferences: preferences
        };
    }
    
    /**
     * Get default role context (fallback)
     */
    _getDefaultRoleContext() {
        return {
            assistantRole: {
                mode: 'General assistant',
                behaviorStyle: 'Balanced',
                establishedPatterns: []
            },
            userProfile: {
                communicationStyle: 'Standard',
                technicalLevel: 'Intermediate',
                explicitPreferences: []
            }
        };
    }
    
    // ========================================================================
    // LAYER 1: CANONICAL STATE (ENHANCED)
    // ========================================================================
    
    /**
     * Get enhanced canonical state with contradiction detection
     */
    async getCanonicalStateEnhanced(conversation) {
        this.logger.debug('Extracting enhanced canonical state...');
        
        try {
            // Extract canonical state directly from conversation
            // This runs in background worker, so we can't use ContextExtractor (content script)
            const context = this._extractCanonicalStateDirectly(conversation);
            
            // Enhance with timestamps and confidence
            const decisions = (context.decisions || []).map((decision, index) => ({
                text: decision.text || decision,
                reason: decision.reason || 'Not specified',
                timestamp: decision.timestamp || this._inferTimestamp(conversation, decision.text || decision),
                confidence: decision.confidence || 0.8,
                index: index
            }));
            
            const failures = (context.failures || []).map((failure, index) => ({
                what: failure.what || failure,
                why: failure.why || 'Reason not specified',
                timestamp: failure.timestamp || this._inferTimestamp(conversation, failure.what || failure),
                index: index
            }));
            
            return {
                goal: context.goal || 'Not specified',
                decisions: decisions,
                constraints: context.constraints || [],
                failures: failures,
                preferences: context.preferences || [],
                currentStatus: this._inferCurrentStatus(conversation),
                metadata: {
                    totalMessages: conversation.messages?.length || 0,
                    userMessageCount: conversation.messages?.filter(m => m.role === 'user').length || 0,
                    assistantMessageCount: conversation.messages?.filter(m => m.role === 'assistant').length || 0
                }
            };
            
        } catch (error) {
            this.logger.error('Failed to extract canonical state', { error });
            
            throw new VoidError(
                ErrorTypes.EXTRACTION_FAILED,
                'Failed to extract canonical state',
                error
            );
        }
    }
    
    /**
     * Extract canonical state directly without ContextExtractor
     * This method analyzes conversation messages to identify:
     * - Goal/Purpose
     * - Key Decisions
     * - Constraints
     * - Failures
     * - Preferences
     */
    _extractCanonicalStateDirectly(conversation) {
        const messages = conversation.messages || [];
        const decisions = [];
        const failures = [];
        const constraints = [];
        const preferences = [];
        let goal = '';
        
        // Analyze messages for patterns
        messages.forEach((msg, index) => {
            const content = (msg.content || msg.text || '').toLowerCase();
            const originalContent = msg.content || msg.text || '';
            
            // Extract goal from early user messages
            if (msg.role === 'user' && index < 3 && !goal) {
                const goalMatch = originalContent.match(/(?:want|need|trying|goal|objective|aim)(?:\s+to)?\s+(.{10,100})[.!?]/i);
                if (goalMatch) {
                    goal = goalMatch[1].trim();
                }
            }
            
            // Detect decisions (user confirms, assistant suggests approved)
            if (content.includes('decide') || content.includes('let\'s go with') || content.includes('i\'ll use') || content.includes('we\'ll use')) {
                const decisionText = originalContent.substring(0, 200);
                decisions.push({ text: decisionText, timestamp: msg.timestamp || Date.now() });
            }
            
            // Detect failures/errors
            if (content.includes('error') || content.includes('failed') || content.includes('not work') || content.includes('issue')) {
                const failureText = originalContent.substring(0, 150);
                failures.push({ what: failureText, timestamp: msg.timestamp || Date.now() });
            }
            
            // Detect constraints
            if (content.includes('must') || content.includes('required') || content.includes('cannot') || content.includes('don\'t')) {
                const constraintMatch = originalContent.match(/(must|required|cannot|don't).{10,80}[.!?]/i);
                if (constraintMatch) {
                    constraints.push(constraintMatch[0]);
                }
            }
            
            // Detect preferences
            if (content.includes('prefer') || content.includes('like') || content.includes('better')) {
                const prefMatch = originalContent.match(/(prefer|like|better).{10,60}[.!?]/i);
                if (prefMatch) {
                    preferences.push(prefMatch[0]);
                }
            }
        });
        
        // Fallback goal if not extracted
        if (!goal && messages.length > 0) {
            const firstUserMsg = messages.find(m => m.role === 'user');
            if (firstUserMsg) {
                const content = firstUserMsg.content || firstUserMsg.text || '';
                goal = content.substring(0, 100) + (content.length > 100 ? '...' : '');
            }
        }
        
        return {
            goal: goal || conversation.title || 'Conversation analysis',
            decisions: decisions.slice(0, 5), // Limit to most important
            failures: failures.slice(0, 3),
            constraints: constraints.slice(0, 5),
            preferences: preferences.slice(0, 3)
        };
    }
    
    /**
     * Infer timestamp of a decision/failure from message history
     */
    _inferTimestamp(conversation, text) {
        const messages = conversation.messages || [];
        
        // Find message containing this text
        const matchingMsg = messages.find(m => 
            (m.content || m.text || '').includes(text)
        );
        
        return matchingMsg?.timestamp || Date.now();
    }
    
    /**
     * Infer current status from last messages
     */
    _inferCurrentStatus(conversation) {
        const messages = conversation.messages || [];
        if (messages.length === 0) {
            return 'No messages yet';
        }
        
        const lastMsg = messages[messages.length - 1];
        const content = (lastMsg.content || lastMsg.text || '').toLowerCase();
        
        // Check for completion indicators
        if (/done|complete|finished|working|success|resolved/i.test(content)) {
            return 'Task completed successfully';
        }
        
        // Check for error indicators
        if (/error|fail|issue|problem|bug|broken/i.test(content)) {
            return 'Encountering issues, troubleshooting in progress';
        }
        
        // Check for question indicators
        if (content.includes('?')) {
            return 'Awaiting clarification on question';
        }
        
        // Check for in-progress indicators
        if (/working on|implementing|trying|testing/i.test(content)) {
            return 'Task in progress';
        }
        
        return 'In progress';
    }
    
    // ========================================================================
    // LAYER 2: RECENT CONTEXT
    // ========================================================================
    
    /**
     * Get immediate context (last N messages)
     */
    getImmediateContext(conversation) {
        this.logger.debug('Extracting immediate context...');
        
        const messages = conversation.messages || [];
        const recentCount = this.config.recentMessageCount;
        const recentMessages = messages.slice(-recentCount);
        
        return {
            messages: recentMessages,
            count: recentMessages.length,
            text: this._formatMessages(recentMessages)
        };
    }
    
    /**
     * Format messages for display
     */
    _formatMessages(messages) {
        return messages.map(m => {
            const content = m.content || m.text || '';
            const role = m.role || 'unknown';
            return `${role}: ${content}`;
        }).join('\n\n');
    }
    
    // ========================================================================
    // LAYER 3: RELEVANT HISTORY (SIMPLIFIED)
    // ========================================================================
    
    /**
     * Get relevant history snippets (max 2-3 snippets, 300 tokens)
     */
    async getRelevantHistorySimplified(conversation, userQuery) {
        this.logger.debug('Extracting relevant history...', { userQuery });
        
        try {
            // Use HierarchyManager if available
            if (typeof HierarchyManager === 'undefined') {
                this.logger.warn('HierarchyManager not loaded, skipping relevant history');
                return null;
            }
            
            const hierarchyManager = new HierarchyManager();
            
            // Build tree from conversation
            const messages = conversation.messages || [];
            messages.forEach(msg => {
                hierarchyManager.addMessage(msg);
            });
            
            // Retrieve relevant context
            const relevant = hierarchyManager.retrieveContext(userQuery, {
                tokenLimit: this.config.tokenLimits.layer3,
                maxResults: this.config.maxHistorySnippets
            });
            
            return {
                snippets: relevant.map(node => ({
                    content: node.content,
                    timestamp: node.metadata?.timestamp,
                    relevance: node.score || 0
                })),
                count: relevant.length
            };
            
        } catch (error) {
            this.logger.warn('Failed to extract relevant history', { error: error.message });
            return null;
        }
    }
    
    // ========================================================================
    // CONTRADICTION DETECTION
    // ========================================================================
    
    /**
     * Detect contradictions in canonical state
     */
    detectContradictions(canonicalState) {
        this.logger.debug('Detecting contradictions...');
        
        const contradictions = [];
        const decisions = canonicalState.decisions || [];
        
        // Check for conflicting decisions
        for (let i = 0; i < decisions.length; i++) {
            for (let j = i + 1; j < decisions.length; j++) {
                if (this._areConflicting(decisions[i], decisions[j])) {
                    contradictions.push({
                        id: `contradiction_${i}_${j}`,
                        decision1: decisions[i],
                        decision2: decisions[j],
                        type: 'conflicting_decisions',
                        severity: 'medium'
                    });
                }
            }
        }
        
        this.logger.debug(`Found ${contradictions.length} contradictions`);
        
        return contradictions;
    }
    
    /**
     * Check if two decisions are conflicting
     */
    _areConflicting(decision1, decision2) {
        const text1 = (decision1.text || '').toLowerCase();
        const text2 = (decision2.text || '').toLowerCase();
        
        // Simple conflict detection patterns
        const conflicts = [
            ['use', 'don\'t use'],
            ['yes', 'no'],
            ['enable', 'disable'],
            ['add', 'remove'],
            ['include', 'exclude']
        ];
        
        return conflicts.some(([word1, word2]) => 
            (text1.includes(word1) && text2.includes(word2)) ||
            (text1.includes(word2) && text2.includes(word1))
        );
    }
    
    // ========================================================================
    // PROMPT COMPOSITION (V2)
    // ========================================================================
    
    /**
     * Compose final prompt with all 4 layers
     */
    composePromptV2(layer0, layer1, layer2, layer3, userQuery) {
        this.logger.debug('Composing prompt...');
        
        let prompt = '';
        
        // Header
        prompt += '<context_from_previous_chat>\n\n';
        
        // LAYER 0: Role & Persona (if available)
        if (layer0) {
            prompt += '<role_and_persona>\n';
            prompt += `Assistant Mode: ${layer0.assistantRole.mode}\n`;
            prompt += `Behavior Style: ${layer0.assistantRole.behaviorStyle}\n`;
            
            if (layer0.assistantRole.establishedPatterns.length > 0) {
                prompt += 'Established Patterns:\n';
                layer0.assistantRole.establishedPatterns.forEach(pattern => {
                    prompt += `- ${pattern}\n`;
                });
            }
            
            prompt += `\nUser Communication Style: ${layer0.userProfile.communicationStyle}\n`;
            prompt += `User Technical Level: ${layer0.userProfile.technicalLevel}\n`;
            
            if (layer0.userProfile.explicitPreferences.length > 0) {
                prompt += 'User Preferences:\n';
                layer0.userProfile.explicitPreferences.forEach(pref => {
                    prompt += `- ${pref}\n`;
                });
            }
            
            prompt += '</role_and_persona>\n\n';
        }
        
        // LAYER 1: Canonical State
        prompt += '<canonical_state>\n';
        prompt += `Goal: ${layer1.goal}\n\n`;
        
        if (layer1.decisions.length > 0) {
            prompt += 'Key Decisions:\n';
            layer1.decisions.forEach(d => {
                prompt += `- ${d.text}`;
                if (d.reason && d.reason !== 'Not specified') {
                    prompt += ` (Reason: ${d.reason})`;
                }
                prompt += '\n';
            });
            prompt += '\n';
        }
        
        if (layer1.constraints.length > 0) {
            prompt += 'Constraints:\n';
            layer1.constraints.forEach(c => {
                prompt += `- ${c}\n`;
            });
            prompt += '\n';
        }
        
        if (layer1.failures.length > 0) {
            prompt += 'What FAILED (do not repeat):\n';
            layer1.failures.forEach(f => {
                prompt += `- ${f.what}`;
                if (f.why && f.why !== 'Reason not specified') {
                    prompt += ` → Failed because: ${f.why}`;
                }
                prompt += '\n';
            });
            prompt += '\n';
        }
        
        prompt += `Current Status: ${layer1.currentStatus}\n`;
        prompt += '</canonical_state>\n\n';
        
        // LAYER 3: Relevant History (if available)
        if (layer3 && layer3.snippets && layer3.snippets.length > 0) {
            prompt += '<relevant_past_discussions>\n';
            layer3.snippets.forEach(snippet => {
                prompt += `- ${snippet.content}\n`;
            });
            prompt += '</relevant_past_discussions>\n\n';
        }
        
        // LAYER 2: Recent Messages
        prompt += '<recent_messages>\n';
        layer2.messages.forEach(msg => {
            const content = msg.content || msg.text || '';
            const role = msg.role || 'unknown';
            prompt += `${role}: ${content}\n\n`;
        });
        prompt += '</recent_messages>\n\n';
        
        prompt += '</context_from_previous_chat>\n\n';
        
        // User's new instruction (if provided)
        if (userQuery) {
            prompt += `Now, please: ${userQuery}`;
        }
        
        return prompt;
    }
    
    // ========================================================================
    // TOKEN ESTIMATION & BUDGET MANAGEMENT
    // ========================================================================
    
    /**
     * Estimate token count (rough: 1 token ≈ 4 characters)
     * @param {string} text - Text to estimate tokens for
     * @returns {number} Estimated token count
     */
    estimateTokens(text) {
        if (!text) return 0;
        return Math.ceil(text.length / 4);
    }
    
    /**
     * Fit context to token budget by intelligently truncating
     * @param {Object} contextData - Full context data from assembly
     * @param {number} maxTokens - Maximum token budget (default: 1600)
     * @returns {Object} Optimized context that fits budget
     */
    fitToTokenBudget(contextData, maxTokens = null) {
        const budget = maxTokens || this.config.tokenLimits.total;
        const currentTokens = contextData.tokenEstimate;
        
        this.logger.info('Fitting to token budget', { current: currentTokens, budget });
        
        // If already within budget, return as-is
        if (currentTokens <= budget) {
            this.logger.info('✅ Context fits within budget');
            return contextData;
        }
        
        this.logger.warn('⚠️ Context exceeds budget, applying truncation', {
            overage: currentTokens - budget,
            percentage: ((currentTokens / budget) * 100).toFixed(1) + '%'
        });
        
        // Priority order: Layer 2 > Layer 1 > Layer 0 > Layer 3
        // We NEVER truncate Layer 2 (recent messages) - that's critical context
        
        const layers = contextData.layers;
        let layer0 = layers.layer0;
        let layer1 = layers.layer1;
        let layer2 = layers.layer2;
        let layer3 = layers.layer3;
        
        // Step 1: Remove Layer 3 (relevant history) if present
        if (layer3 && currentTokens > budget) {
            this.logger.info('Step 1: Removing Layer 3 (relevant history)');
            layer3 = null;
            
            const newPrompt = this.composePromptV2(layer0, layer1, layer2, null, null);
            const newTokens = this.estimateTokens(newPrompt);
            
            if (newTokens <= budget) {
                return this._rebuildContext(contextData, layer0, layer1, layer2, layer3, newPrompt, newTokens);
            }
        }
        
        // Step 2: Trim Layer 1 decisions (keep top 3 most important)
        if (layer1 && layer1.decisions && layer1.decisions.length > 3 && currentTokens > budget) {
            this.logger.info('Step 2: Trimming Layer 1 decisions to top 3');
            const trimmedLayer1 = { ...layer1 };
            trimmedLayer1.decisions = layer1.decisions.slice(0, 3);
            
            const newPrompt = this.composePromptV2(layer0, trimmedLayer1, layer2, layer3, null);
            const newTokens = this.estimateTokens(newPrompt);
            
            if (newTokens <= budget) {
                return this._rebuildContext(contextData, layer0, trimmedLayer1, layer2, layer3, newPrompt, newTokens);
            }
            
            layer1 = trimmedLayer1;
        }
        
        // Step 3: Trim Layer 1 failures (keep top 2 most recent)
        if (layer1 && layer1.failures && layer1.failures.length > 2 && currentTokens > budget) {
            this.logger.info('Step 3: Trimming Layer 1 failures to top 2');
            const trimmedLayer1 = { ...layer1 };
            trimmedLayer1.failures = layer1.failures.slice(-2); // Keep most recent
            
            const newPrompt = this.composePromptV2(layer0, trimmedLayer1, layer2, layer3, null);
            const newTokens = this.estimateTokens(newPrompt);
            
            if (newTokens <= budget) {
                return this._rebuildContext(contextData, layer0, trimmedLayer1, layer2, layer3, newPrompt, newTokens);
            }
            
            layer1 = trimmedLayer1;
        }
        
        // Step 4: Simplify Layer 0 (remove patterns and preferences)
        if (layer0 && currentTokens > budget) {
            this.logger.info('Step 4: Simplifying Layer 0');
            const simplifiedLayer0 = {
                assistantRole: {
                    mode: layer0.assistantRole.mode,
                    behaviorStyle: layer0.assistantRole.behaviorStyle,
                    establishedPatterns: [] // Remove patterns
                },
                userProfile: {
                    communicationStyle: layer0.userProfile.communicationStyle,
                    technicalLevel: layer0.userProfile.technicalLevel,
                    explicitPreferences: [] // Remove preferences
                }
            };
            
            const newPrompt = this.composePromptV2(simplifiedLayer0, layer1, layer2, layer3, null);
            const newTokens = this.estimateTokens(newPrompt);
            
            if (newTokens <= budget) {
                return this._rebuildContext(contextData, simplifiedLayer0, layer1, layer2, layer3, newPrompt, newTokens);
            }
            
            layer0 = simplifiedLayer0;
        }
        
        // Step 5: Remove Layer 0 entirely (last resort)
        if (layer0 && currentTokens > budget) {
            this.logger.warn('Step 5: Removing Layer 0 entirely (last resort)');
            layer0 = null;
            
            const newPrompt = this.composePromptV2(null, layer1, layer2, layer3, null);
            const newTokens = this.estimateTokens(newPrompt);
            
            if (newTokens <= budget) {
                return this._rebuildContext(contextData, null, layer1, layer2, layer3, newPrompt, newTokens);
            }
        }
        
        // Step 6: Emergency - Truncate Layer 2 messages (only if absolutely necessary)
        if (layer2 && layer2.messages && layer2.messages.length > 3) {
            this.logger.error('Step 6: EMERGENCY - Truncating Layer 2 messages');
            const emergencyLayer2 = { ...layer2 };
            emergencyLayer2.messages = layer2.messages.slice(-3); // Keep only last 3
            
            const newPrompt = this.composePromptV2(layer0, layer1, emergencyLayer2, layer3, null);
            const newTokens = this.estimateTokens(newPrompt);
            
            return this._rebuildContext(contextData, layer0, layer1, emergencyLayer2, layer3, newPrompt, newTokens);
        }
        
        // If we're still over budget, return what we have and log warning
        this.logger.error('❌ Unable to fit context within budget after all truncation steps');
        return contextData;
    }
    
    /**
     * Rebuild context object after truncation
     * @private
     */
    _rebuildContext(originalContext, layer0, layer1, layer2, layer3, newPrompt, newTokens) {
        const truncatedContext = {
            ...originalContext,
            prompt: newPrompt,
            tokenEstimate: newTokens,
            layers: {
                layer0: layer0,
                layer1: layer1,
                layer2: layer2,
                layer3: layer3
            },
            tokenBreakdown: {
                layer0: layer0 ? this.estimateTokens(JSON.stringify(layer0)) : 0,
                layer1: this.estimateTokens(JSON.stringify(layer1)),
                layer2: this.estimateTokens(JSON.stringify(layer2)),
                layer3: layer3 ? this.estimateTokens(JSON.stringify(layer3)) : 0,
                total: newTokens
            },
            wasTruncated: true,
            originalTokenCount: originalContext.tokenEstimate
        };
        
        this.logger.info('✅ Successfully fit to budget', {
            original: originalContext.tokenEstimate,
            final: newTokens,
            saved: originalContext.tokenEstimate - newTokens
        });
        
        return truncatedContext;
    }
    
    // ========================================================================
    // MODEL-SPECIFIC EXPORTS
    // ========================================================================
    
    /**
     * Export context in model-specific format
     */
    exportForModel(context, modelName = 'chatgpt') {
        this.logger.info('Exporting for model', { modelName });
        
        const exporters = {
            'chatgpt': () => this.formatForChatGPT(context),
            'claude': () => this.formatForClaude(context),
            'gemini': () => this.formatForGemini(context),
            'llama': () => this.formatForLLama(context)
        };
        
        const exporter = exporters[modelName.toLowerCase()];
        
        if (!exporter) {
            this.logger.warn('Unknown model, using default format', { modelName });
            return context.prompt;
        }
        
        return exporter();
    }
    
    /**
     * Format for ChatGPT (JSON structure)
     */
    formatForChatGPT(context) {
        return {
            role: 'system',
            content: `You are resuming a previous conversation. Here's the context:\n\n${context.prompt}\n\nPlease acknowledge you understand the context and are ready to continue.`
        };
    }
    
    /**
     * Format for Claude (XML with thinking tags)
     */
    formatForClaude(context) {
        return `<context>
${context.prompt}
</context>

<instructions>
Please review the context above from a previous conversation and confirm you understand:
1. The project goal
2. Key decisions made
3. What failed and why
4. Current status

Then continue assisting with the task.
</instructions>`;
    }
    
    /**
     * Format for Gemini (structured JSON)
     */
    formatForGemini(context) {
        return {
            systemInstruction: "You are resuming a previous conversation.",
            context: context.prompt,
            task: "Continue assisting with the project based on the context provided."
        };
    }
    
    /**
     * Format for LLama (Markdown sections)
     */
    formatForLLama(context) {
        return `## Context from Previous Conversation

${context.prompt}

---

**Instructions:** Review the context above and continue the conversation naturally.`;
    }
    
    // ========================================================================
    // CACHE MANAGEMENT
    // ========================================================================
    
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        this.logger.info('🧹 Cache cleared');
    }
    
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            maxSize: this.config.performance.maxCacheSize
        };
    }
}

// ============================================================================
// EXPORT
// ============================================================================

// For use in Chrome Extension
if (typeof window !== 'undefined') {
    window.ContextAssemblerV2 = ContextAssemblerV2;
    window.Logger = Logger;
    window.ErrorHandler = ErrorHandler;
    window.VoidError = VoidError;
    window.ErrorTypes = ErrorTypes;
}

// For use in Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ContextAssemblerV2,
        Logger,
        ErrorHandler,
        VoidError,
        ErrorTypes,
        LogLevel,
        DEFAULT_CONFIG
    };
}

console.log('✅ ContextAssemblerV2 loaded successfully');
