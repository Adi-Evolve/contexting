# 🎯 PROJECT IMPLEMENTATION PLAN
## Context Window Solution - Complete Development Roadmap

**Date**: December 11, 2025  
**Project**: Context Assembler V2 Implementation  
**Timeline**: 4-6 days  
**Status**: Planning → Ready to Execute

---

## 📋 TODO LIST (Updated)

### 🔴 PHASE 1: Core Context Assembler (Days 1-2) - CRITICAL

- [ ] **Task 1.1**: Create `context-assembler-v2.js` base structure
  - [ ] Class initialization with configuration
  - [ ] Token limit definitions
  - [ ] Error handling wrapper
  - [ ] Logging system integration

- [ ] **Task 1.2**: Implement Layer 0 (Role & Persona Extraction)
  - [ ] `extractRoleContext()` method
  - [ ] `inferAssistantMode()` helper
  - [ ] `inferBehaviorStyle()` helper
  - [ ] `extractPatterns()` helper
  - [ ] Unit tests for role extraction

- [ ] **Task 1.3**: Implement Layer 0 (User Profile Extraction)
  - [ ] `extractUserProfile()` method
  - [ ] `inferCommunicationStyle()` helper
  - [ ] `inferTechnicalLevel()` helper
  - [ ] `extractUserPreferences()` helper
  - [ ] Unit tests for profile extraction

- [ ] **Task 1.4**: Enhance Layer 1 (Canonical State)
  - [ ] `getCanonicalStateEnhanced()` method
  - [ ] Integrate with existing `ContextExtractor`
  - [ ] Add contradiction detection
  - [ ] Add decision timestamps
  - [ ] Unit tests for canonical state

- [ ] **Task 1.5**: Simplify Layer 2 (Recent Context)
  - [ ] `getImmediateContext()` method (already exists, verify)
  - [ ] Format recent messages properly
  - [ ] Unit tests

- [ ] **Task 1.6**: Optimize Layer 3 (Relevant History)
  - [ ] `getRelevantHistorySimplified()` method
  - [ ] Limit to 300 tokens max
  - [ ] Limit to 2-3 snippets
  - [ ] Add relevance explanation
  - [ ] Unit tests

- [ ] **Task 1.7**: Implement Contradiction Detection
  - [ ] `detectContradictions()` method
  - [ ] `areConflicting()` helper
  - [ ] Integration with CausalReasoner
  - [ ] Unit tests

- [ ] **Task 1.8**: Implement Prompt Composition
  - [ ] `composePromptV2()` method
  - [ ] XML structure generation
  - [ ] All 4 layers integration
  - [ ] Token estimation
  - [ ] Unit tests

### 🟡 PHASE 2: Model-Specific Formats (Day 3) - HIGH PRIORITY

- [ ] **Task 2.1**: Model Detection & Selection
  - [ ] Create model type enum
  - [ ] Add model selector to UI
  - [ ] Store user's preferred model

- [ ] **Task 2.2**: ChatGPT Format Export
  - [ ] `formatForChatGPT()` method
  - [ ] JSON structure generation
  - [ ] Test with real ChatGPT API

- [ ] **Task 2.3**: Claude Format Export
  - [ ] `formatForClaude()` method
  - [ ] XML with thinking tags
  - [ ] Test with Claude API

- [ ] **Task 2.4**: Gemini Format Export
  - [ ] `formatForGemini()` method
  - [ ] Structured JSON generation
  - [ ] Test with Gemini API

- [ ] **Task 2.5**: LLama Format Export
  - [ ] `formatForLLama()` method
  - [ ] Markdown sections generation
  - [ ] Test with LLama models

- [ ] **Task 2.6**: Model-Specific Export Wrapper
  - [ ] `exportForModel()` method
  - [ ] Switch logic for all models
  - [ ] Error handling per model

### 🟢 PHASE 3: UI Integration (Day 4) - MEDIUM PRIORITY

- [ ] **Task 3.1**: Resume Chat Button
  - [ ] Add button to conversation cards in sidebar
  - [ ] Add button to conversation detail view
  - [ ] Hover states and animations
  - [ ] Click handler integration

- [ ] **Task 3.2**: Context Preview Modal
  - [ ] Create modal component
  - [ ] Layer-by-layer breakdown view
  - [ ] Token count display per layer
  - [ ] Total token count
  - [ ] Editable sections

- [ ] **Task 3.3**: Model Selector in Modal
  - [ ] Dropdown for model selection
  - [ ] Format preview updates on selection
  - [ ] Save preference to storage

- [ ] **Task 3.4**: Copy & Insert Functionality
  - [ ] Copy to clipboard button
  - [ ] Success notification
  - [ ] Insert into chat textarea (if possible)
  - [ ] Fallback for manual paste

- [ ] **Task 3.5**: Contradiction Warning UI
  - [ ] Visual warning badge
  - [ ] Expandable contradiction list
  - [ ] Resolution buttons
  - [ ] Update canonical state on resolution

### 🟣 PHASE 4: Token Management (Day 4) - MEDIUM PRIORITY

- [ ] **Task 4.1**: Token Estimation Enhancement
  - [ ] Improve accuracy of `estimateTokens()`
  - [ ] Different estimations per model
  - [ ] Add token counting library (optional)

- [ ] **Task 4.2**: Token Budget Enforcement
  - [ ] `fitToTokenBudget()` method
  - [ ] Prioritization logic (Layer 0 > 1 > 2 > 3)
  - [ ] Intelligent truncation
  - [ ] Warning when budget exceeded

- [ ] **Task 4.3**: Custom Token Limits
  - [ ] UI for custom token limit input
  - [ ] Per-conversation token preferences
  - [ ] Model-specific defaults

### 🔵 PHASE 5: Testing & Validation (Day 5) - HIGH PRIORITY

- [ ] **Task 5.1**: Unit Tests
  - [ ] Test all ContextAssemblerV2 methods
  - [ ] Test role extraction accuracy
  - [ ] Test contradiction detection
  - [ ] Test prompt composition
  - [ ] Test model-specific formats

- [ ] **Task 5.2**: Integration Tests
  - [ ] Test full flow: capture → assemble → export
  - [ ] Test with real conversations
  - [ ] Test with different conversation lengths
  - [ ] Test edge cases (empty, single message, etc.)

- [ ] **Task 5.3**: Performance Tests
  - [ ] Measure assembly time (<100ms target)
  - [ ] Measure memory usage
  - [ ] Test with large conversations (1000+ messages)

- [ ] **Task 5.4**: Cross-Platform Testing
  - [ ] Test on ChatGPT
  - [ ] Test on Claude
  - [ ] Test on Gemini
  - [ ] Verify format compatibility

### 🟠 PHASE 6: Documentation & Polish (Day 6) - MEDIUM PRIORITY

- [ ] **Task 6.1**: Code Documentation
  - [ ] JSDoc comments for all methods
  - [ ] Inline comments for complex logic
  - [ ] README update

- [ ] **Task 6.2**: User Guide
  - [ ] How to use "Resume Chat"
  - [ ] Explanation of layers
  - [ ] Model selection guide
  - [ ] Token budget tips

- [ ] **Task 6.3**: Error Messages
  - [ ] User-friendly error messages
  - [ ] Troubleshooting guide
  - [ ] FAQ section

- [ ] **Task 6.4**: Final Polish
  - [ ] Code cleanup
  - [ ] Remove debug logs
  - [ ] Optimize performance
  - [ ] Final testing round

---

## 🏗️ DETAILED ARCHITECTURE PLAN

### File Structure

```
chrome-extension/
├── context-assembler-v2.js          (NEW - 800-1000 lines)
├── context-extractor-v2.js          (EXISTS - enhance)
├── conversation-tracker.js          (EXISTS - integrate)
├── hierarchy-manager.js             (EXISTS - integrate)
├── causal-reasoner.js               (EXISTS - integrate)
├── content-chatgpt-v2.js            (MODIFY - add UI)
├── popup.js                         (MODIFY - add buttons)
├── styles-v2.css                    (MODIFY - add modal styles)
└── background-v3-step6.js           (MODIFY - add endpoints)
```

### Class Hierarchy

```
ContextAssemblerV2
├── Uses: ContextExtractor (Layer 1)
├── Uses: HierarchyManager (Layer 3)
├── Uses: CausalReasoner (Contradictions)
├── Provides: assembleForNewChat()
├── Provides: exportForModel()
└── Provides: detectContradictions()
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER ACTION: Clicks "Resume Chat" button                │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. CONTENT SCRIPT: Triggers context assembly                │
│    - Gets conversation ID                                   │
│    - Sends message to background                            │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. BACKGROUND: Loads conversation from storage              │
│    - chrome.storage.local.get(['conversations'])            │
│    - Finds conversation by ID                               │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. CONTEXT ASSEMBLER: Processes conversation                │
│    ├─ Layer 0: Extract role & persona (200 tokens)         │
│    ├─ Layer 1: Build canonical state (600 tokens)          │
│    ├─ Layer 2: Get recent messages (500 tokens)            │
│    └─ Layer 3: Find relevant history (300 tokens)          │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. PROMPT COMPOSER: Generates structured prompt             │
│    - XML/JSON/Markdown based on model                      │
│    - Estimates token count                                  │
│    - Applies token budget                                   │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. CONTRADICTION DETECTOR: Checks for conflicts             │
│    - Analyzes decisions                                     │
│    - Finds contradictions                                   │
│    - Suggests resolutions                                   │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. RESPONSE: Returns context package                        │
│    - Prompt text                                            │
│    - Token estimate                                         │
│    - Layer breakdown                                        │
│    - Contradictions (if any)                                │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. UI: Shows preview modal                                  │
│    - Display formatted prompt                               │
│    - Show token counts per layer                            │
│    - Model selector                                         │
│    - Edit capabilities                                      │
│    - Contradiction warnings                                 │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. USER ACTION: Copy or Export                             │
│    - Copy to clipboard                                      │
│    - Or export in selected model format                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛡️ ERROR HANDLING STRATEGY

### Error Types & Handlers

```javascript
// Error categories
const ErrorTypes = {
    CONVERSATION_NOT_FOUND: 'ConversationNotFound',
    EXTRACTION_FAILED: 'ExtractionFailed',
    TOKEN_LIMIT_EXCEEDED: 'TokenLimitExceeded',
    INVALID_FORMAT: 'InvalidFormat',
    STORAGE_ERROR: 'StorageError',
    CONTRADICTION_DETECTION_FAILED: 'ContradictionDetectionFailed'
};

// Error handler wrapper
class ErrorHandler {
    static handle(error, context) {
        const errorInfo = {
            type: error.type || 'UnknownError',
            message: error.message,
            context: context,
            timestamp: Date.now(),
            stack: error.stack
        };
        
        // Log to console with emoji for visibility
        console.error('🚨 VOID ERROR:', errorInfo);
        
        // Log to storage for debugging
        this.logError(errorInfo);
        
        // Return user-friendly message
        return this.getUserMessage(errorInfo);
    }
    
    static logError(errorInfo) {
        chrome.storage.local.get(['error_log'], (result) => {
            const log = result.error_log || [];
            log.push(errorInfo);
            
            // Keep only last 50 errors
            if (log.length > 50) {
                log.shift();
            }
            
            chrome.storage.local.set({ error_log: log });
        });
    }
    
    static getUserMessage(errorInfo) {
        const messages = {
            ConversationNotFound: 'Could not find the conversation. Please try again.',
            ExtractionFailed: 'Failed to extract context. The conversation may be corrupted.',
            TokenLimitExceeded: 'Context is too large. Try reducing the number of messages.',
            InvalidFormat: 'Invalid data format. Please refresh the page.',
            StorageError: 'Storage error. Your browser may be full.',
            ContradictionDetectionFailed: 'Could not detect contradictions. Continuing without this check.'
        };
        
        return messages[errorInfo.type] || 'An unexpected error occurred. Please try again.';
    }
}
```

### Error Handling at Each Layer

#### **Layer 0: Role Extraction**
```javascript
try {
    const roleContext = this.extractRoleContext(conversation);
} catch (error) {
    console.warn('⚠️ Role extraction failed, using defaults:', error);
    // Fallback to default role context
    roleContext = {
        mode: 'General assistant',
        behaviorStyle: 'Balanced',
        establishedPatterns: []
    };
}
```

#### **Layer 1: Canonical State**
```javascript
try {
    const canonical = this.getCanonicalStateEnhanced(conversation);
} catch (error) {
    console.error('❌ Canonical state extraction failed:', error);
    throw new Error({
        type: ErrorTypes.EXTRACTION_FAILED,
        message: 'Failed to build canonical state',
        originalError: error
    });
}
```

#### **Layer 2: Recent Messages**
```javascript
try {
    const immediate = this.getImmediateContext(conversation);
} catch (error) {
    console.error('❌ Recent context extraction failed:', error);
    // This is critical - cannot proceed without recent messages
    throw new Error({
        type: ErrorTypes.EXTRACTION_FAILED,
        message: 'Failed to get recent messages',
        originalError: error
    });
}
```

#### **Layer 3: Relevant History**
```javascript
try {
    const relevant = userQuery 
        ? await this.getRelevantHistorySimplified(conversation, userQuery)
        : null;
} catch (error) {
    console.warn('⚠️ Relevant history extraction failed, skipping:', error);
    // Non-critical - can proceed without this layer
    relevant = null;
}
```

#### **Contradiction Detection**
```javascript
try {
    const contradictions = this.detectContradictions(conversation);
} catch (error) {
    console.warn('⚠️ Contradiction detection failed, skipping:', error);
    // Non-critical - proceed without contradiction detection
    contradictions = [];
}
```

#### **Prompt Composition**
```javascript
try {
    const prompt = this.composePromptV2(roleContext, userProfile, canonical, recent, relevant, userQuery);
} catch (error) {
    console.error('❌ Prompt composition failed:', error);
    throw new Error({
        type: ErrorTypes.INVALID_FORMAT,
        message: 'Failed to generate prompt',
        originalError: error
    });
}
```

---

## 🚨 POTENTIAL ISSUES & PRECAUTIONS

### Issue 1: Large Conversations (1000+ messages)

**Problem**: Processing takes too long, UI freezes

**Precautions**:
1. Implement progress indicator
2. Use web workers for heavy processing
3. Add timeout limits (max 5 seconds)
4. Cache processed results
5. Implement pagination for large conversations

```javascript
// Timeout wrapper
async function withTimeout(promise, timeoutMs = 5000) {
    return Promise.race([
        promise,
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
        )
    ]);
}

// Usage
try {
    const context = await withTimeout(
        assembler.assembleForNewChat(conversationId),
        5000
    );
} catch (error) {
    if (error.message === 'Operation timed out') {
        console.error('⏱️ Context assembly timed out');
        // Show user a message to try with fewer messages
    }
}
```

### Issue 2: Memory Leaks

**Problem**: Large objects not garbage collected

**Precautions**:
1. Clear references after use
2. Use WeakMap for caches
3. Limit cache sizes
4. Monitor memory usage

```javascript
class ContextAssemblerV2 {
    constructor() {
        // Use WeakMap for automatic garbage collection
        this.conversationCache = new WeakMap();
        
        // Limit regular cache size
        this.MAX_CACHE_SIZE = 10;
        this.cache = new Map();
    }
    
    clearCache() {
        this.cache.clear();
        console.log('🧹 Cache cleared');
    }
}
```

### Issue 3: Storage Quota Exceeded

**Problem**: Chrome storage limit (10MB) reached

**Precautions**:
1. Monitor storage usage
2. Implement automatic cleanup
3. Compress stored data
4. Warn user at 80% capacity

```javascript
async function checkStorageQuota() {
    const estimate = await navigator.storage.estimate();
    const percentUsed = (estimate.usage / estimate.quota) * 100;
    
    console.log(`💾 Storage: ${percentUsed.toFixed(2)}% used`);
    
    if (percentUsed > 80) {
        console.warn('⚠️ Storage quota above 80%');
        // Trigger cleanup or warn user
    }
    
    return percentUsed;
}
```

### Issue 4: Race Conditions

**Problem**: Multiple simultaneous assembly requests

**Precautions**:
1. Implement request queue
2. Lock mechanism for single request at a time
3. Cancel previous requests

```javascript
class ContextAssemblerV2 {
    constructor() {
        this.isProcessing = false;
        this.requestQueue = [];
    }
    
    async assembleForNewChat(conversationId, userQuery = null) {
        // Wait if already processing
        if (this.isProcessing) {
            console.log('⏳ Assembly in progress, queuing request...');
            return new Promise((resolve, reject) => {
                this.requestQueue.push({ conversationId, userQuery, resolve, reject });
            });
        }
        
        this.isProcessing = true;
        
        try {
            const result = await this._doAssemble(conversationId, userQuery);
            
            // Process queue
            if (this.requestQueue.length > 0) {
                const next = this.requestQueue.shift();
                this.assembleForNewChat(next.conversationId, next.userQuery)
                    .then(next.resolve)
                    .catch(next.reject);
            } else {
                this.isProcessing = false;
            }
            
            return result;
        } catch (error) {
            this.isProcessing = false;
            throw error;
        }
    }
}
```

### Issue 5: Context Extractor Not Found

**Problem**: Existing modules not properly imported

**Precautions**:
1. Verify module loading
2. Fallback mechanisms
3. Clear error messages

```javascript
async function initializeModules() {
    const modules = {
        ContextExtractor: typeof ContextExtractor !== 'undefined',
        HierarchyManager: typeof HierarchyManager !== 'undefined',
        CausalReasoner: typeof CausalReasoner !== 'undefined'
    };
    
    const missing = Object.entries(modules)
        .filter(([name, loaded]) => !loaded)
        .map(([name]) => name);
    
    if (missing.length > 0) {
        console.error('❌ Missing required modules:', missing);
        throw new Error(`Required modules not loaded: ${missing.join(', ')}`);
    }
    
    console.log('✅ All required modules loaded');
}
```

### Issue 6: Invalid Conversation Data

**Problem**: Corrupted or incomplete conversation data

**Precautions**:
1. Validate conversation structure
2. Sanitize input data
3. Provide clear error messages

```javascript
function validateConversation(conversation) {
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
    
    if (conversation.messages.length === 0) {
        errors.push('Conversation has no messages');
    }
    
    // Check message structure
    conversation.messages.forEach((msg, index) => {
        if (!msg.role) {
            errors.push(`Message ${index} missing role`);
        }
        if (!msg.content) {
            errors.push(`Message ${index} missing content`);
        }
    });
    
    if (errors.length > 0) {
        console.error('❌ Invalid conversation data:', errors);
        throw new Error({
            type: ErrorTypes.INVALID_FORMAT,
            message: 'Invalid conversation data',
            errors: errors
        });
    }
    
    return true;
}
```

---

## 📝 LOGGING STRATEGY

### Log Levels

```javascript
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
    
    // Performance logging
    time(label) {
        console.time(`⏱️ [${this.module}] ${label}`);
    }
    
    timeEnd(label) {
        console.timeEnd(`⏱️ [${this.module}] ${label}`);
    }
}

// Usage
const logger = new Logger('ContextAssemblerV2', LogLevel.DEBUG);

logger.debug('Starting context assembly...');
logger.time('Assembly');
// ... do work ...
logger.timeEnd('Assembly');
logger.info('Context assembled successfully');
```

### Key Logging Points

```javascript
// 1. Module initialization
logger.info('ContextAssemblerV2 initialized', { config: this.config });

// 2. Method entry
logger.debug('assembleForNewChat called', { conversationId, userQuery });

// 3. Layer processing
logger.debug('Processing Layer 0: Role context');
logger.time('Layer 0');
// ... process ...
logger.timeEnd('Layer 0');

// 4. Intermediate results
logger.debug('Role context extracted', { 
    mode: roleContext.mode, 
    patternCount: roleContext.patterns.length 
});

// 5. Errors (already logged by ErrorHandler)

// 6. Method completion
logger.info('Context assembly complete', {
    tokenEstimate: result.tokenEstimate,
    layerCount: Object.keys(result.layers).length
});
```

---

## 🔧 CONFIGURATION MANAGEMENT

```javascript
// Default configuration
const DEFAULT_CONFIG = {
    tokenLimits: {
        layer0: 200,
        layer1: 600,
        layer2: 500,
        layer3: 300,
        total: 1600
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
    }
};

// Load user configuration
async function loadConfig() {
    const stored = await chrome.storage.sync.get(['assembler_config']);
    return {
        ...DEFAULT_CONFIG,
        ...(stored.assembler_config || {})
    };
}

// Save user configuration
async function saveConfig(config) {
    await chrome.storage.sync.set({ assembler_config: config });
}
```

---

## 📈 PERFORMANCE TARGETS

| Metric | Target | Acceptable | Unacceptable |
|--------|--------|------------|--------------|
| Assembly Time | <100ms | <500ms | >1000ms |
| Memory Usage | <10MB | <50MB | >100MB |
| Token Estimate Accuracy | ±5% | ±10% | >15% |
| UI Response Time | <50ms | <100ms | >200ms |
| Storage Usage | <5MB | <8MB | >10MB |

---

## 🎯 SUCCESS CRITERIA

### Phase 1 Success (Core Assembler)
- ✅ All 4 layers implemented and tested
- ✅ Token estimation within ±10% accuracy
- ✅ Assembly completes in <500ms for typical conversations
- ✅ Error handling covers all major failure modes
- ✅ Logging provides clear debugging information

### Phase 2 Success (Model Formats)
- ✅ All 4 model formats implemented
- ✅ Format switching works correctly
- ✅ Each format tested with respective model
- ✅ Export functions handle errors gracefully

### Phase 3 Success (UI Integration)
- ✅ Resume button appears on all conversation cards
- ✅ Modal opens smoothly (<100ms)
- ✅ Context preview is readable and well-formatted
- ✅ Copy to clipboard works 100% of the time
- ✅ Contradiction warnings display correctly

### Phase 4 Success (Token Management)
- ✅ Token budget enforcement works correctly
- ✅ Truncation preserves most important information
- ✅ User can set custom token limits
- ✅ Warning appears when budget exceeded

### Phase 5 Success (Testing)
- ✅ All unit tests pass (>90% coverage)
- ✅ Integration tests pass with real data
- ✅ Performance tests meet targets
- ✅ No critical bugs found

### Phase 6 Success (Polish)
- ✅ Code fully documented
- ✅ User guide complete and clear
- ✅ Error messages user-friendly
- ✅ Final testing complete

---

## 🚀 IMPLEMENTATION ORDER

### Day 1: Foundation
1. Create `context-assembler-v2.js` file structure
2. Implement Logger and ErrorHandler
3. Implement Layer 0 (Role & Persona)
4. Implement Layer 0 (User Profile)
5. Unit tests for Layer 0

### Day 2: Core Assembly
6. Enhance Layer 1 (Canonical State)
7. Verify Layer 2 (Recent Context)
8. Optimize Layer 3 (Relevant History)
9. Implement contradiction detection
10. Implement prompt composition
11. Unit tests for all layers

### Day 3: Model Formats
12. Implement model detection
13. Implement ChatGPT format
14. Implement Claude format
15. Implement Gemini format
16. Implement LLama format
17. Test all formats

### Day 4: UI & Token Management
18. Add Resume Chat button
19. Create context preview modal
20. Add model selector
21. Implement copy/export functionality
22. Implement token budget enforcement
23. Add contradiction warning UI

### Day 5: Testing
24. Write comprehensive unit tests
25. Run integration tests
26. Performance testing
27. Cross-platform testing
28. Bug fixes

### Day 6: Documentation & Polish
29. Complete code documentation
30. Write user guide
31. Improve error messages
32. Final code cleanup
33. Final testing round
34. Deploy!

---

## ✅ READY TO START

**Next Action**: Begin implementation of Phase 1, Task 1.1

**Command**: Create `context-assembler-v2.js` with base structure

**Estimated Time**: 4-6 days total, starting now!

---

**Project Manager Sign-off**: Plan reviewed and approved ✅  
**Developer**: Ready to code! 🚀  
**Status**: GREEN - All systems go! 💚
