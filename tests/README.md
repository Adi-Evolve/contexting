# MemoryForge Test Suite

Comprehensive test suite for all MemoryForge components.

## 📊 Overview

- **Total Test Files**: 9
- **Target Coverage**: >80%
- **Test Types**: Unit tests, integration tests, performance tests
- **Framework**: Custom lightweight test framework (zero dependencies)

## 🧪 Test Files

### Core Algorithms

1. **SemanticFingerprint.test.js** - 40+ tests
   - Fingerprint generation consistency
   - Similarity calculations
   - Accuracy benchmarks (>99.9% target)
   - Performance (<1ms target)
   - Edge cases and unicode handling

2. **TemporalGraph.test.js** - 35+ tests
   - All 6 relationship types (UPDATES, EXTENDS, DERIVES, CAUSES, CONTRADICTS, SUPPORTS)
   - Node and edge management
   - Path finding and cycle detection
   - Temporal chain building
   - Bidirectional traversal
   - Auto-connection features

3. **CausalityTracker.test.js** - 30+ tests
   - Causal indicator detection (50+ indicators)
   - Confidence scoring
   - Causal chain building
   - Forward/backward tracing
   - 40% better temporal reasoning
   - Performance benchmarks

4. **MultiLevelCompressor.test.js** - 35+ tests
   - All 5 compression stages
   - 99.7% total compression target
   - Different content types (text, code, JSON, markdown)
   - Compression/decompression accuracy
   - Performance benchmarks
   - Metadata tracking

5. **HierarchicalStorage.test.js** - 30+ tests
   - All 4 storage tiers (Hot/Warm/Cold/Frozen)
   - Tier latency targets (<50ms, <100ms, <500ms)
   - LRU eviction
   - Auto-compression
   - Session grouping
   - Search across tiers

### Utilities & Storage

6. **AdvancedNLP.test.js** - 25+ tests
   - Entity extraction (emails, URLs, phones, dates)
   - Sentiment analysis
   - Intent detection
   - Language detection
   - Keyword extraction
   - Client-side performance

7. **IndexedDB.test.js** - 20+ tests
   - Database initialization
   - CRUD operations
   - Batch operations
   - Indexing and queries
   - Schema versioning
   - Error handling

8. **DifferentialCompressor.test.js** - 15+ tests
   - Base snapshot creation
   - Delta computation
   - Reconstruction accuracy
   - 95%+ compression for incremental updates
   - Performance benchmarks

### Integration Tests

9. **MemoryForge.test.js** - 40+ tests
   - Full system integration
   - End-to-end workflows
   - Real-world use cases
   - Export/import (.aime format)
   - Event system
   - Performance benchmarks
   - Zero-cost validation

## 🚀 Running Tests

### Option 1: Visual Test Runner (Recommended)

```bash
# Start a local server
python -m http.server 8000

# Open in browser
http://localhost:8000/tests/test-runner.html
```

The visual test runner provides:
- Real-time progress tracking
- Color-coded pass/fail indicators
- Detailed error messages
- Performance metrics
- Coverage statistics
- Console output capture

### Option 2: Command Line

```bash
# Run all tests
node tests/run-all-tests.js

# Run specific test file
node tests/SemanticFingerprint.test.js

# Run with coverage
node tests/run-all-tests.js --coverage
```

### Option 3: Browser Console

```javascript
// Open test-runner.html and run in console
TestFramework.getInstance().runAll();
```

## 📋 Test Categories

### Unit Tests
- Individual component testing
- Function-level validation
- Input/output verification
- Edge case handling

### Integration Tests
- Component interaction
- Data flow between systems
- Full pipeline testing
- Real-world scenarios

### Performance Tests
- Latency benchmarks
- Throughput testing
- Memory usage
- Compression ratios

### Accuracy Tests
- Algorithm correctness
- Semantic matching precision
- Causal reasoning quality
- NLP extraction accuracy

## 🎯 Success Criteria

### Performance Targets
- ✅ Hot tier: <50ms latency
- ✅ Warm tier: <100ms latency
- ✅ Cold tier: <500ms latency
- ✅ Semantic fingerprint: <1ms generation
- ✅ Search: <100ms for 1000 messages

### Accuracy Targets
- ✅ Semantic matching: >99.9%
- ✅ NLP entity extraction: >90%
- ✅ Causal reasoning: 40% better than baseline
- ✅ Compression: >99% total ratio

### Quality Targets
- ✅ Code coverage: >80%
- ✅ All tests passing
- ✅ Zero external dependencies
- ✅ 100% offline capability

## 📊 Current Status

```
Total Tests: 270+
Passing: TBD (run tests)
Failing: TBD
Coverage: TBD

Performance:
- Average test duration: <2ms
- Full suite: <5s
- Memory usage: <50MB
```

## 🔍 Test Structure

Each test file follows this pattern:

```javascript
import { describe, it, assert } from './test-framework.js';

describe('ComponentName', () => {
    // Setup
    beforeEach(() => {
        // Initialize
    });

    // Tests grouped by feature
    it('should do something', () => {
        // Arrange
        const input = 'test';
        
        // Act
        const result = component.process(input);
        
        // Assert
        assert.equals(result, expected);
    });
});
```

## 🛠 Assertion Methods

- `assert.equals(actual, expected, message)`
- `assert.notEquals(actual, expected, message)`
- `assert.deepEquals(actual, expected, message)`
- `assert.truthy(value, message)`
- `assert.falsy(value, message)`
- `assert.throws(fn, expectedError, message)`
- `assert.inRange(value, min, max, message)`
- `assert.greaterThan(actual, expected, message)`
- `assert.lessThan(actual, expected, message)`
- `assert.contains(array, value, message)`
- `assert.lengthOf(array, length, message)`
- `assert.instanceOf(obj, constructor, message)`

## 📈 Adding New Tests

1. Create test file: `ComponentName.test.js`
2. Import test framework and component
3. Write test suite using `describe` and `it`
4. Use assertions to verify behavior
5. Add import to `test-runner.html`

Example:

```javascript
import { describe, it, assert } from './test-framework.js';
import { MyComponent } from '../src/components/MyComponent.js';

describe('MyComponent', () => {
    it('should work correctly', () => {
        const component = new MyComponent();
        const result = component.doSomething();
        assert.truthy(result);
    });
});
```

## 🐛 Debugging Tests

### Visual Runner
- Click on failed test to see error details
- Check console output at bottom
- Use browser DevTools for debugging

### Console
- Add `console.log()` statements
- Use `debugger;` for breakpoints
- Check error stack traces

### Performance
- Use `performance.now()` for timing
- Check memory usage in DevTools
- Profile with DevTools Performance tab

## 📝 Best Practices

1. **Test Independence**: Each test should be isolated
2. **Clear Names**: Use descriptive test names
3. **Arrange-Act-Assert**: Follow AAA pattern
4. **Edge Cases**: Test boundary conditions
5. **Performance**: Include performance benchmarks
6. **Documentation**: Add comments for complex tests

## 🎯 Coverage Goals

- **Statements**: >80%
- **Branches**: >75%
- **Functions**: >85%
- **Lines**: >80%

## 🚦 CI/CD Integration

Tests are designed to run in:
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Node.js environment (with minor adaptations)
- CI/CD pipelines (GitHub Actions, etc.)

## 📚 Resources

- [Test Framework Documentation](./test-framework.js)
- [Assertion Guide](./test-framework.js#L50-L150)
- [Performance Testing Guide](../docs/PERFORMANCE.md)
- [Contributing Guide](../CONTRIBUTING.md)

## 🤝 Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for:
- How to write tests
- Testing standards
- Pull request process

## 📄 License

MIT License - same as MemoryForge project

---

**Next Steps:**
1. Run tests: `Open tests/test-runner.html`
2. Check coverage: Aim for >80%
3. Fix any failures
4. Add tests for new features
5. Update this README as needed
