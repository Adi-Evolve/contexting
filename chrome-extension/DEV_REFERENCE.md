# 🚀 Resume Chat - Developer Quick Reference

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    RESUME CHAT FEATURE                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Content Script (content-chatgpt-v2.js)                     │
│  ├── Resume Button in Sidebar                                │
│  ├── Context Preview Modal                                   │
│  └── Insert/Copy Controls                                    │
│                      │                                        │
│                      ▼ chrome.runtime.sendMessage            │
│                                                               │
│  Background Worker (background-v3-step6.js)                  │
│  ├── assembleContext action                                  │
│  ├── exportContextForModel action                            │
│  └── getAssemblerStats action                                │
│                      │                                        │
│                      ▼ calls                                  │
│                                                               │
│  Context Assembler V2 (context-assembler-v2.js)             │
│  ├── Layer 0: extractRoleAndPersona()                        │
│  ├── Layer 1: extractCanonicalState()                        │
│  ├── Layer 2: extractRecentContext()                         │
│  ├── Layer 3: extractRelevantHistory()                       │
│  ├── detectContradictions()                                  │
│  ├── fitToTokenBudget()                                      │
│  └── exportForModel()                                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
chrome-extension/
├── context-assembler-v2.js     # Core: 4-layer assembly + budget
├── content-chatgpt-v2.js        # UI: Resume button + modal
├── background-v3-step6.js       # API: Message handlers
├── styles-v2.css                # Styling for modal
├── manifest.json                # Extension config
├── USER_GUIDE.md               # End-user documentation
├── TESTING_GUIDE.md            # Testing procedures
└── QUICKSTART.md               # Developer setup
```

## API Reference

### Background API Endpoints

#### `assembleContext`
```javascript
chrome.runtime.sendMessage({
    action: 'assembleContext',
    conversationId: 'conv_123',
    userQuery: null  // optional
}, (response) => {
    // response.success: bool
    // response.prompt: string (formatted context)
    // response.tokenEstimate: number
    // response.layers: { layer0, layer1, layer2, layer3 }
    // response.contradictions: array
    // response.wasTruncated: bool
});
```

#### `exportContextForModel`
```javascript
chrome.runtime.sendMessage({
    action: 'exportContextForModel',
    conversationId: 'conv_123',
    model: 'claude',  // chatgpt|claude|gemini|llama
    userQuery: null
}, (response) => {
    // response.success: bool
    // response.formatted: string
    // response.model: string
});
```

#### `getAssemblerStats`
```javascript
chrome.runtime.sendMessage({
    action: 'getAssemblerStats'
}, (response) => {
    // response.initialized: bool
    // response.config: object
    // response.cacheStats: object
});
```

## Core Classes & Methods

### ContextAssemblerV2

**Constructor**
```javascript
new ContextAssemblerV2({
    tokenLimits: {
        layer0: 200,   // Role & Persona
        layer1: 600,   // Canonical State
        layer2: 500,   // Recent Context
        layer3: 300,   // Relevant History
        total: 1600    // Maximum total
    },
    logging: {
        level: 1,      // 0=ERROR, 1=INFO, 2=DEBUG
        enablePerformanceMetrics: true
    }
})
```

**Key Methods**

| Method | Purpose | Returns |
|--------|---------|---------|
| `assembleForNewChat(convId, query)` | Full 4-layer assembly | Context object |
| `extractRoleAndPersona(conv)` | Layer 0 extraction | String |
| `extractCanonicalState(conv)` | Layer 1 extraction | Object |
| `extractRecentContext(conv, limit)` | Layer 2 extraction | Array |
| `extractRelevantHistory(conv, query)` | Layer 3 extraction | Array |
| `detectContradictions(messages)` | Find conflicts | Array |
| `fitToTokenBudget(context, max)` | Compress to fit | Context object |
| `exportForModel(context, model)` | Format output | String |
| `estimateTokens(text)` | Count tokens | Number |

## Token Budget Algorithm

**6-Step Progressive Truncation**

```javascript
// Priority: Preserve Layer 2 (recent) > Layer 1 (decisions) > Layer 0 (role)

Step 1: Remove Layer 3 (relevant history)        // -300 tokens
Step 2: Trim Layer 1 decisions to top 3          // ~-200 tokens
Step 3: Trim Layer 1 failures to top 2           // ~-100 tokens
Step 4: Simplify Layer 0 (remove patterns)       // ~-50 tokens
Step 5: Remove Layer 0 entirely (emergency)      // -200 tokens
Step 6: Truncate Layer 2 to last 3 messages      // Last resort
```

## Contradiction Detection

**Patterns Matched**
- "don't use X" / "use X instead"
- "enable X" / "disable X"
- "should X" / "shouldn't X"
- "X is good" / "X is bad"
- Explicit reversals: "actually, ...", "on second thought, ..."

**Confidence Scoring**
- Exact reversal: 0.9-1.0
- Clear contradiction: 0.7-0.9
- Possible conflict: 0.5-0.7

## Model Export Formats

### ChatGPT
```
I'm resuming our previous conversation about [topic].

Here's the relevant context:
[context]

Now, [query]
```

### Claude
```
Let me provide context from our previous conversation:

<context>
[context]
</context>

Based on this, [query]
```

### Gemini
```
Context from our previous discussion:

[context]

---

Continuing from above: [query]
```

### LLaMA
```
### Previous Context
[context]

### Current Query
[query]
```

## Event Flow

```
User clicks Resume button
        ↓
resumeConversation(convId)
        ↓
chrome.runtime.sendMessage({ action: 'assembleContext' })
        ↓
Background: handleMessage()
        ↓
assembleContextForNewChat(convId)
        ↓
contextAssembler.assembleForNewChat()
        ↓
Extract 4 layers + detect contradictions + fit budget
        ↓
Return context object
        ↓
showContextPreviewModal(contextData)
        ↓
User selects model, edits, then Copy/Insert
```

## Performance Benchmarks

| Operation | Target | Typical |
|-----------|--------|---------|
| Full assembly | < 500ms | 200-300ms |
| Token estimation | < 50ms | 10-20ms |
| Modal render | < 100ms | 30-50ms |
| Model export | < 20ms | 5-10ms |
| Contradiction detection | < 100ms | 40-60ms |

## Error Handling

**Common Errors**

```javascript
// ContextAssembler not initialized
{ error: 'ContextAssemblerV2 not initialized' }

// Conversation not found
{ error: 'Conversation not found', conversationId: 'xxx' }

// Invalid model
{ error: 'Invalid model: xxx' }

// Assembly failed
{ 
    success: false, 
    error: 'message',
    errorType: 'ValidationError|RuntimeError',
    context: { /* debug info */ }
}
```

## Testing Checklist

```javascript
// Unit tests (not yet implemented)
- [ ] Layer 0 extraction
- [ ] Layer 1 extraction  
- [ ] Layer 2 extraction
- [ ] Layer 3 extraction
- [ ] Token estimation accuracy
- [ ] Contradiction detection
- [ ] Token budget enforcement
- [ ] Model format exports

// Integration tests
- [ ] Full assembly pipeline
- [ ] Background → Assembler communication
- [ ] Content → Background communication

// E2E tests  
- [ ] Resume button click
- [ ] Modal open/close
- [ ] Copy to clipboard
- [ ] Insert into chat
- [ ] Model selector
- [ ] Context editing
```

## Configuration

**Token Limits** (context-assembler-v2.js init)
```javascript
tokenLimits: {
    layer0: 200,   // Adjust for more/less role info
    layer1: 600,   // Adjust for more/less decisions
    layer2: 500,   // Adjust for more/less recent msgs
    layer3: 300,   // Adjust for more/less history
    total: 1600    // Total budget
}
```

**Logging**
```javascript
logging: {
    level: 1,      // 0=ERROR, 1=INFO, 2=DEBUG
    enablePerformanceMetrics: true
}
```

**Contradiction Detection**
```javascript
// In extractCanonicalState()
const contradictions = this.detectContradictions(messages);
// Threshold: 0.7 confidence minimum
```

## Extending the System

### Add New Model Format

1. Edit `exportForModel()` in context-assembler-v2.js:
```javascript
case 'newmodel':
    return this._formatForNewModel(context, userQuery);
```

2. Implement formatter:
```javascript
_formatForNewModel(context, userQuery) {
    return `Custom format: ${context.prompt}`;
}
```

3. Add to UI dropdown in content-chatgpt-v2.js

### Add New Layer

1. Create extraction method:
```javascript
extractLayerN(conversation, options) {
    // Your logic
    return layerData;
}
```

2. Add to assembly pipeline:
```javascript
const layerN = this.extractLayerN(conversation);
layers.layerN = layerN;
```

3. Update token limits config

### Customize Truncation

Edit `fitToTokenBudget()` in context-assembler-v2.js:
```javascript
// Add custom step
if (currentTokens > maxTokens) {
    // Your truncation logic
    contextData.layers.layerX = truncated;
    currentTokens = this.estimateTokens(
        this._rebuildContext(contextData)
    );
}
```

## Debug Mode

Enable verbose logging:
```javascript
// In context-assembler-v2.js
this.logger = new Logger({ 
    level: 2,  // DEBUG mode
    enablePerformanceMetrics: true 
});
```

Check background console:
```
chrome://extensions/ → void → service worker → Console
```

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Modal blank | Context assembly failed | Check background console |
| No Resume button | Content script not loaded | Refresh page |
| Context empty | No messages in conversation | Check conversation data |
| Truncation too aggressive | Token limits too strict | Adjust config |
| Contradictions missed | Patterns not matched | Add patterns to detector |

## Resources

- **USER_GUIDE.md** - End-user documentation
- **TESTING_GUIDE.md** - Testing procedures
- **Context Assembler V2** - 1,200 lines, fully documented
- **Background Console** - Real-time logs

---

**Last Updated**: December 2025  
**Version**: 1.0.0
