# VOID Extension - Testing Guide

## Running Tests

### Option 1: Simple HTTP Server (Recommended)

```powershell
# Navigate to chrome-extension directory
cd "c:\Users\adiin\OneDrive\Desktop\new shit\chrome-extension"

# Start Python HTTP server (if Python installed)
python -m http.server 8000

# OR use Node.js http-server (if installed)
npx http-server -p 8000

# Then open in browser:
# http://localhost:8000/tests/test-runner.html
# http://localhost:8000/tests/benchmark-runner.html
```

### Option 2: Direct Chrome Extension Test

1. Open Chrome: `chrome://extensions`
2. Enable Developer Mode
3. Click "Load Unpacked"
4. Select: `c:\Users\adiin\OneDrive\Desktop\new shit\chrome-extension`
5. Open Chrome DevTools Console
6. Run tests manually:

```javascript
// Load all modules first via background script
// Then in console:

// Quick smoke test
const manager = new HierarchyManager();
manager.addMessage({
    id: 'test_1',
    role: 'user',
    content: 'Test message',
    timestamp: Date.now()
});
console.log('Hierarchy test passed:', manager.tree.nodes.size === 1);

// Test delta engine
const engine = new DeltaEngine();
engine.saveState({ test: 'data' });
console.log('Delta test passed:', engine.versions.size > 0);
```

## Test Suites

### 1. Integration Tests (`test-runner.html`)
Tests all 7 modules with ~40 test cases:
- ✅ Hierarchy Manager (6 tests)
- ✅ Delta Engine (5 tests)
- ✅ Semantic Fingerprint (5 tests)
- ✅ Causal Reasoner (5 tests)
- ✅ Multi-Modal Handler (4 tests)
- ✅ LLM Query Engine (5 tests)
- ✅ Full Integration (8 tests)

**Expected Results:**
- All tests should pass
- Total execution time: ~2-3 seconds
- Success rate: 95%+ (some tests may fail without Tesseract.js)

### 2. Performance Benchmarks (`benchmark-runner.html`)
Tests performance targets:

| Test | Target | Expected |
|------|--------|----------|
| Message Processing | <50ms | 30-40ms |
| Context Retrieval | <100ms | 50-80ms |
| Semantic Dedup | <10ms | 3-7ms |
| Compression Ratio | >90% | 90-95% |
| Query Execution | <100ms | 60-90ms |
| State Reconstruction | <150ms | 80-120ms |

**Expected Results:**
- All benchmarks should pass
- Total execution time: ~10-15 seconds

## Manual Testing Checklist

### Background Script
- [ ] Extension installs without errors
- [ ] VOID Core initializes successfully
- [ ] Badge shows message count
- [ ] Context menu "Query VOID Memory" appears

### Content Scripts
Test on https://chat.openai.com:
- [ ] Messages are captured
- [ ] Images are extracted
- [ ] Query interface appears
- [ ] Context injection works

Test on https://claude.ai:
- [ ] Same as above

### Hierarchy Manager
```javascript
// Test topic shift detection
const manager = new HierarchyManager();

manager.addMessage({
    id: 'msg_1',
    role: 'user',
    content: 'How do I build a REST API?',
    timestamp: Date.now()
});

const result = manager.addMessage({
    id: 'msg_2',
    role: 'user',
    content: 'What is the weather today?', // Topic shift!
    timestamp: Date.now()
});

console.log('Topic shift detected:', result.isTopicShift === true);
```

### Delta Engine
```javascript
// Test compression
const engine = new DeltaEngine();

engine.saveState({ messages: [1, 2, 3] });
engine.saveState({ messages: [1, 2, 3, 4] }); // Should be delta
engine.saveState({ messages: [1, 2, 3, 4, 5] }); // Should be delta

const stats = engine.getStats();
console.log('Compression ratio:', stats.compressionRatio);
// Should be >90%
```

### Semantic Fingerprint
```javascript
// Test duplicate detection
const fingerprint = new SemanticFingerprintV2();

const fp1 = fingerprint.generateFingerprint('How do I build a REST API?');
const fp2 = fingerprint.generateFingerprint('How can I create a REST API?');

const similarity = fingerprint.calculateSimilarity(fp1, fp2);
console.log('Similarity:', similarity);
// Should be >0.5 for semantic duplicates
```

### Causal Reasoner
```javascript
// Test causal inference
const reasoner = new CausalReasoner();

reasoner.addMessage({
    id: 'msg_1',
    role: 'user',
    content: 'Why did we choose React?',
    timestamp: Date.now()
});

const result = reasoner.addMessage({
    id: 'msg_2',
    role: 'assistant',
    content: 'We chose React because it has better TypeScript support.',
    timestamp: Date.now() + 1000
}, 'msg_1');

console.log('Causality detected:', result.causality.causes.length > 0);

const explanation = reasoner.explainWhy('msg_2');
console.log('Explanation:', explanation);
```

### Multi-Modal Handler
```javascript
// Test image processing (without OCR)
const handler = new MultiModalHandler({ ocrEnabled: false });

// Create test image
const canvas = document.createElement('canvas');
canvas.width = 100;
canvas.height = 100;
const ctx = canvas.getContext('2d');
ctx.fillStyle = 'red';
ctx.fillRect(0, 0, 100, 100);

const dataUrl = canvas.toDataURL();

handler.processImage(dataUrl).then(result => {
    console.log('Image processed:', result.fingerprint);
    console.log('Colors:', result.colors);
});
```

### LLM Query Engine
```javascript
// Test natural language queries
const hierarchy = new HierarchyManager();
const causality = new CausalReasoner();
const fingerprint = new SemanticFingerprintV2();
const multimodal = new MultiModalHandler({ ocrEnabled: false });

// Add test data
for (let i = 0; i < 50; i++) {
    hierarchy.addMessage({
        id: `msg_${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Test message about ${i % 3 === 0 ? 'authentication' : i % 3 === 1 ? 'database' : 'API'} number ${i}`,
        timestamp: Date.now() - (50 - i) * 60000 // Spread over last hour
    });
}

const engine = new LLMQueryEngine(hierarchy, causality, fingerprint, multimodal);

// Test queries
engine.query('What did we discuss about authentication?').then(results => {
    console.log('Query results:', results.results.length);
});

engine.query('What happened in the last 30 minutes?').then(results => {
    console.log('Temporal query:', results.results.length);
});
```

### VOID Core Integration
```javascript
// Test full pipeline
const mockSupabase = {
    from: () => ({
        insert: () => Promise.resolve({ data: [], error: null }),
        select: () => ({
            gt: () => ({
                order: () => ({
                    neq: () => Promise.resolve({ data: [], error: null })
                })
            })
        })
    }),
    channel: () => ({
        on: () => ({ subscribe: () => {} })
    })
};

const core = new VOIDCore(mockSupabase, { autoSync: false, ocrEnabled: false });

core.initialize().then(() => {
    console.log('VOID initialized:', core.isInitialized);
    
    // Process message
    return core.processMessage({
        id: 'test_1',
        role: 'user',
        content: 'How do I implement authentication?',
        timestamp: Date.now()
    });
}).then(result => {
    console.log('Message processed:', result.success);
    
    // Query
    return core.query('authentication');
}).then(results => {
    console.log('Query results:', results.results.length);
    
    // Get stats
    const stats = core.getStats();
    console.log('Stats:', stats);
});
```

## Troubleshooting

### Tests Fail to Load
- **Issue**: "Cannot find module"
- **Fix**: Ensure all core modules exist in `core/` directory
- **Check**: 
  - `core/hierarchy-manager.js`
  - `core/delta-engine.js`
  - `core/semantic-fingerprint-v2.js`
  - `core/causal-reasoner.js`
  - `core/multimodal-handler.js`
  - `core/federated-sync.js`
  - `core/llm-query-engine.js`
  - `core/void-core.js`

### OCR Tests Fail
- **Issue**: Tesseract.js not loaded
- **Fix**: This is expected - OCR is disabled in tests
- **To Enable**: Add `<script src="https://cdn.jsdelivr.net/npm/tesseract.js"></script>` to test HTML

### Performance Tests Slow
- **Issue**: Tests take >30 seconds
- **Fix**: Close other Chrome tabs, disable extensions
- **Expected**: 10-15 seconds on modern hardware

### IndexedDB Errors
- **Issue**: "QuotaExceededError"
- **Fix**: Clear browser data, increase quota
- **Check**: Chrome DevTools → Application → Storage

## Success Criteria

### Integration Tests
✅ **Pass Rate**: >95% (38/40 tests)
✅ **Execution Time**: <5 seconds
✅ **No Console Errors**: Except Tesseract warnings

### Performance Benchmarks
✅ **Message Processing**: <50ms average
✅ **Context Retrieval**: <100ms average
✅ **Semantic Dedup**: <10ms average
✅ **Compression Ratio**: >90%
✅ **Query Execution**: <100ms average
✅ **State Reconstruction**: <150ms average

### Manual Testing
✅ **Extension Loads**: No errors in background console
✅ **Messages Captured**: On ChatGPT and Claude
✅ **Queries Work**: Natural language queries return results
✅ **Sync Works**: Cross-device sync (if configured)
✅ **Export/Import**: Data can be exported and imported

## Next Steps After Testing

1. **If tests pass (>95%)**:
   - Proceed with production deployment
   - Set up Supabase configuration
   - Enable real-time sync

2. **If tests fail (<95%)**:
   - Check console for errors
   - Review failed test output
   - Fix issues and re-run

3. **Performance optimization**:
   - If any benchmark fails, investigate bottlenecks
   - Consider adding indexes
   - Optimize critical paths

## Automated Testing (Future)

```json
// package.json
{
  "scripts": {
    "test": "node tests/run-tests.js",
    "test:integration": "node tests/run-integration.js",
    "test:performance": "node tests/run-benchmarks.js",
    "test:watch": "nodemon tests/run-tests.js"
  }
}
```

## CI/CD Integration (Future)

```yaml
# .github/workflows/test.yml
name: VOID Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm test
```
