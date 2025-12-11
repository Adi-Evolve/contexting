// Test Suite for Core Modules
// Tests each module individually before integration

console.log('🧪 Starting Core Module Tests...\n');

// Test Data
const testConversation = {
    id: 'test_conv_1',
    title: 'Test Conversation',
    messages: [
        { role: 'user', content: 'Hello, how are you?', timestamp: Date.now() - 10000 },
        { role: 'assistant', content: 'I am doing well, thank you!', timestamp: Date.now() - 5000 },
        { role: 'user', content: 'Can you help me with JavaScript?', timestamp: Date.now() }
    ],
    startTime: Date.now() - 10000,
    platform: 'chatgpt'
};

const testState = {
    tree: {
        nodes: new Map([
            ['root', { id: 'root', type: 'root', content: 'Root Node' }],
            ['node1', { id: 'node1', type: 'message', content: 'Test message' }]
        ]),
        branches: new Map(),
        currentPath: ['root']
    }
};

// Test Results Tracker
let testResults = {
    passed: 0,
    failed: 0,
    tests: []
};

function logTest(moduleName, testName, passed, error = null) {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${moduleName}: ${testName}`);
    if (error) console.error('   Error:', error.message);
    
    testResults.tests.push({ moduleName, testName, passed, error });
    if (passed) testResults.passed++;
    else testResults.failed++;
}

// ============================================
// TEST 1: Hierarchy Manager
// ============================================
console.log('\n📦 Testing Hierarchy Manager...');
try {
    const HierarchyManager = require('./hierarchy-manager.js');
    
    // Test 1.1: Instantiation
    try {
        const hierarchyManager = new HierarchyManager();
        logTest('HierarchyManager', 'Instantiation', true);
    } catch (e) {
        logTest('HierarchyManager', 'Instantiation', false, e);
    }
    
    // Test 1.2: Add Message
    try {
        const hierarchyManager = new HierarchyManager();
        const message = {
            role: 'user',
            content: 'Test message',
            timestamp: Date.now()
        };
        const node = hierarchyManager.addMessage(message);
        logTest('HierarchyManager', 'Add Message', node && node.id, new Error('No node returned'));
    } catch (e) {
        logTest('HierarchyManager', 'Add Message', false, e);
    }
    
    // Test 1.3: Get Hierarchy
    try {
        const hierarchyManager = new HierarchyManager();
        hierarchyManager.addMessage({ role: 'user', content: 'Test', timestamp: Date.now() });
        const tree = hierarchyManager.getHierarchy();
        logTest('HierarchyManager', 'Get Hierarchy', tree && tree.root, new Error('No tree returned'));
    } catch (e) {
        logTest('HierarchyManager', 'Get Hierarchy', false, e);
    }
    
} catch (e) {
    console.error('❌ HierarchyManager module not found or has syntax errors:', e.message);
    logTest('HierarchyManager', 'Module Load', false, e);
}

// ============================================
// TEST 2: Delta Engine
// ============================================
console.log('\n📦 Testing Delta Engine...');
try {
    const DeltaEngine = require('./delta-engine.js');
    
    // Test 2.1: Instantiation
    try {
        const deltaEngine = new DeltaEngine();
        logTest('DeltaEngine', 'Instantiation', true);
    } catch (e) {
        logTest('DeltaEngine', 'Instantiation', false, e);
    }
    
    // Test 2.2: Calculate Diff
    try {
        const deltaEngine = new DeltaEngine();
        const oldState = { ...testState };
        const newState = { ...testState };
        newState.tree.nodes.set('node2', { id: 'node2', content: 'New node' });
        
        const diff = deltaEngine.calculateDiff(oldState, newState);
        logTest('DeltaEngine', 'Calculate Diff', diff && diff.changes, new Error('No diff returned'));
    } catch (e) {
        logTest('DeltaEngine', 'Calculate Diff', false, e);
    }
    
    // Test 2.3: Save with Versioning
    try {
        const deltaEngine = new DeltaEngine();
        const result = deltaEngine.saveWithVersioning(testState);
        logTest('DeltaEngine', 'Save with Versioning', result && result.type, new Error('No save result'));
    } catch (e) {
        logTest('DeltaEngine', 'Save with Versioning', false, e);
    }
    
} catch (e) {
    console.error('❌ DeltaEngine module not found or has syntax errors:', e.message);
    logTest('DeltaEngine', 'Module Load', false, e);
}

// ============================================
// TEST 3: Semantic Fingerprint
// ============================================
console.log('\n📦 Testing Semantic Fingerprint...');
try {
    const SemanticFingerprint = require('./semantic-fingerprint-v2.js');
    
    // Test 3.1: Instantiation
    try {
        const semanticFP = new SemanticFingerprint();
        logTest('SemanticFingerprint', 'Instantiation', true);
    } catch (e) {
        logTest('SemanticFingerprint', 'Instantiation', false, e);
    }
    
    // Test 3.2: Generate Fingerprint
    try {
        const semanticFP = new SemanticFingerprint();
        const content = 'This is a test message for fingerprinting';
        const fingerprint = semanticFP.generateFingerprint(content);
        logTest('SemanticFingerprint', 'Generate Fingerprint', fingerprint && fingerprint.hash, new Error('No fingerprint'));
    } catch (e) {
        logTest('SemanticFingerprint', 'Generate Fingerprint', false, e);
    }
    
    // Test 3.3: Check Duplicate
    try {
        const semanticFP = new SemanticFingerprint();
        const content1 = 'Test message';
        const content2 = 'Test message';
        
        semanticFP.generateFingerprint(content1);
        const isDuplicate = semanticFP.checkDuplicate(content2);
        logTest('SemanticFingerprint', 'Check Duplicate', isDuplicate === true);
    } catch (e) {
        logTest('SemanticFingerprint', 'Check Duplicate', false, e);
    }
    
} catch (e) {
    console.error('❌ SemanticFingerprint module not found or has syntax errors:', e.message);
    logTest('SemanticFingerprint', 'Module Load', false, e);
}

// ============================================
// TEST 4: Causal Reasoner
// ============================================
console.log('\n📦 Testing Causal Reasoner...');
try {
    const CausalReasoner = require('./causal-reasoner.js');
    
    // Test 4.1: Instantiation
    try {
        const causalReasoner = new CausalReasoner();
        logTest('CausalReasoner', 'Instantiation', true);
    } catch (e) {
        logTest('CausalReasoner', 'Instantiation', false, e);
    }
    
    // Test 4.2: Analyze Message
    try {
        const causalReasoner = new CausalReasoner();
        const message = { role: 'user', content: 'Because of X, Y happened', timestamp: Date.now() };
        const analysis = causalReasoner.analyzeMessage(message);
        logTest('CausalReasoner', 'Analyze Message', analysis && analysis.relationships);
    } catch (e) {
        logTest('CausalReasoner', 'Analyze Message', false, e);
    }
    
} catch (e) {
    console.error('❌ CausalReasoner module not found or has syntax errors:', e.message);
    logTest('CausalReasoner', 'Module Load', false, e);
}

// ============================================
// TEST 5: Multimodal Handler
// ============================================
console.log('\n📦 Testing Multimodal Handler...');
try {
    const MultimodalHandler = require('./multimodal-handler.js');
    
    // Test 5.1: Instantiation
    try {
        const multimodalHandler = new MultimodalHandler();
        logTest('MultimodalHandler', 'Instantiation', true);
    } catch (e) {
        logTest('MultimodalHandler', 'Instantiation', false, e);
    }
    
    // Test 5.2: Process Text Message
    try {
        const multimodalHandler = new MultimodalHandler();
        const message = { role: 'user', content: 'Test message', timestamp: Date.now() };
        const result = multimodalHandler.processMessage(message);
        logTest('MultimodalHandler', 'Process Text Message', result && result.type === 'text');
    } catch (e) {
        logTest('MultimodalHandler', 'Process Text Message', false, e);
    }
    
} catch (e) {
    console.error('❌ MultimodalHandler module not found or has syntax errors:', e.message);
    logTest('MultimodalHandler', 'Module Load', false, e);
}

// ============================================
// TEST 6: LLM Query Engine
// ============================================
console.log('\n📦 Testing LLM Query Engine...');
try {
    const LLMQueryEngine = require('./llm-query-engine.js');
    
    // Test 6.1: Instantiation
    try {
        const llmEngine = new LLMQueryEngine();
        logTest('LLMQueryEngine', 'Instantiation', true);
    } catch (e) {
        logTest('LLMQueryEngine', 'Instantiation', false, e);
    }
    
    // Test 6.2: Query Processing
    try {
        const llmEngine = new LLMQueryEngine();
        const query = 'Find messages about JavaScript';
        const result = llmEngine.processQuery(query, [testConversation]);
        logTest('LLMQueryEngine', 'Query Processing', result && result.results);
    } catch (e) {
        logTest('LLMQueryEngine', 'Query Processing', false, e);
    }
    
} catch (e) {
    console.error('❌ LLMQueryEngine module not found or has syntax errors:', e.message);
    logTest('LLMQueryEngine', 'Module Load', false, e);
}

// ============================================
// FINAL RESULTS
// ============================================
console.log('\n' + '='.repeat(50));
console.log('📊 TEST RESULTS SUMMARY');
console.log('='.repeat(50));
console.log(`✅ Passed: ${testResults.passed}`);
console.log(`❌ Failed: ${testResults.failed}`);
console.log(`📈 Success Rate: ${((testResults.passed / testResults.tests.length) * 100).toFixed(1)}%`);
console.log('='.repeat(50));

if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests
        .filter(t => !t.passed)
        .forEach(t => console.log(`   - ${t.moduleName}: ${t.testName}`));
}

console.log('\n✅ Testing complete!');
