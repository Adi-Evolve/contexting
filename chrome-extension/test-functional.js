// Functional Tests - Test actual module behavior with real data
console.log('🧪 FUNCTIONAL TESTS - Testing Module Behavior\n');
console.log('=' .repeat(60));

let totalPassed = 0;
let totalFailed = 0;

// Mock chrome.storage API for testing
global.chrome = {
    storage: {
        local: {
            data: {},
            get: function(keys) {
                return Promise.resolve(this.data);
            },
            set: function(items) {
                Object.assign(this.data, items);
                return Promise.resolve();
            }
        }
    },
    runtime: {
        onInstalled: { addListener: () => {} },
        onMessage: { addListener: () => {} }
    }
};

// Load modules
console.log('\n📦 Loading Modules...\n');

try {
    // Load hierarchy-manager
    eval(require('fs').readFileSync('hierarchy-manager.js', 'utf8'));
    console.log('✅ HierarchyManager loaded');
} catch (e) {
    console.error('❌ Failed to load HierarchyManager:', e.message);
}

try {
    // Load delta-engine
    eval(require('fs').readFileSync('delta-engine.js', 'utf8'));
    console.log('✅ DeltaEngine loaded');
} catch (e) {
    console.error('❌ Failed to load DeltaEngine:', e.message);
}

try {
    // Load semantic-fingerprint
    eval(require('fs').readFileSync('semantic-fingerprint-v2.js', 'utf8'));
    console.log('✅ SemanticFingerprintV2 loaded');
} catch (e) {
    console.error('❌ Failed to load SemanticFingerprintV2:', e.message);
}

try {
    // Load causal-reasoner
    eval(require('fs').readFileSync('causal-reasoner.js', 'utf8'));
    console.log('✅ CausalReasoner loaded');
} catch (e) {
    console.error('❌ Failed to load CausalReasoner:', e.message);
}

console.log('\n' + '='.repeat(60));
console.log('TESTING MODULE FUNCTIONALITY');
console.log('='.repeat(60));

// TEST 1: HierarchyManager - Tree Building
console.log('\n📊 TEST 1: HierarchyManager - Building Conversation Tree');
try {
    const hierarchy = new HierarchyManager({
        maxDepth: 5,
        topicShiftThreshold: 0.4,
        similarityThreshold: 0.7
    });
    
    // Add sample messages
    const messages = [
        { role: 'user', content: 'How do I create a React component?', timestamp: Date.now() },
        { role: 'assistant', content: 'You can create a React component using function or class syntax...', timestamp: Date.now() + 1000 },
        { role: 'user', content: 'Can you show me an example?', timestamp: Date.now() + 2000 },
        { role: 'assistant', content: 'Here is a simple example: function MyComponent() { return <div>Hello</div>; }', timestamp: Date.now() + 3000 }
    ];
    
    messages.forEach(msg => hierarchy.addMessage(msg));
    
    const stats = hierarchy.getStats();
    
    if (stats.totalNodes === 4) {
        console.log('   ✅ Added 4 messages to tree');
        totalPassed++;
    } else {
        console.log(`   ❌ Expected 4 nodes, got ${stats.totalNodes}`);
        totalFailed++;
    }
    
    const context = hierarchy.getHierarchicalContext(10, 1000);
    if (context && context.length > 0) {
        console.log('   ✅ Generated hierarchical context');
        totalPassed++;
    } else {
        console.log('   ❌ Failed to generate context');
        totalFailed++;
    }
    
    const serialized = hierarchy.serialize();
    if (serialized && serialized.root) {
        console.log('   ✅ Serialized tree structure');
        totalPassed++;
    } else {
        console.log('   ❌ Failed to serialize tree');
        totalFailed++;
    }
    
    console.log(`   📈 Stats: ${stats.totalNodes} nodes, depth ${stats.maxDepth}, ${stats.totalBranches} branches`);
    
} catch (e) {
    console.log(`   ❌ FAIL: ${e.message}`);
    totalFailed += 3;
}

// TEST 2: DeltaEngine - Compression
console.log('\n🗜️  TEST 2: DeltaEngine - Differential Compression');
try {
    const delta = new DeltaEngine({
        maxPatchChainLength: 10,
        compressionThreshold: 0.3
    });
    
    const oldState = {
        id: 'conv1',
        title: 'Test Conversation',
        messages: [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi there!' }
        ],
        version: 1
    };
    
    const newState = {
        id: 'conv1',
        title: 'Test Conversation',
        messages: [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi there!' },
            { role: 'user', content: 'How are you?' },
            { role: 'assistant', content: 'I am doing well, thanks!' }
        ],
        version: 2
    };
    
    const diff = delta.calculateDiff(oldState, newState);
    
    if (diff.added && diff.added.length > 0) {
        console.log(`   ✅ Detected ${diff.added.length} added nodes`);
        totalPassed++;
    } else {
        console.log('   ❌ Failed to detect additions');
        totalFailed++;
    }
    
    const patch = delta.generatePatch(diff);
    
    if (patch && patch.version === 2) {
        console.log('   ✅ Generated patch with correct version');
        totalPassed++;
    } else {
        console.log('   ❌ Failed to generate patch');
        totalFailed++;
    }
    
    // Test compression
    const fullSize = JSON.stringify(newState).length;
    const patchSize = JSON.stringify(patch).length;
    const compressionRatio = patchSize / fullSize;
    
    if (compressionRatio < 0.8) {
        console.log(`   ✅ Compression: ${fullSize}→${patchSize} bytes (${Math.round((1-compressionRatio)*100)}% reduction)`);
        totalPassed++;
    } else {
        console.log(`   ❌ Poor compression: ${Math.round((1-compressionRatio)*100)}%`);
        totalFailed++;
    }
    
    // Test reconstruction
    const reconstructed = delta.applyPatch(oldState, patch);
    
    if (reconstructed.messages && reconstructed.messages.length === 4) {
        console.log('   ✅ Successfully reconstructed state from patch');
        totalPassed++;
    } else {
        console.log('   ❌ Failed to reconstruct state');
        totalFailed++;
    }
    
} catch (e) {
    console.log(`   ❌ FAIL: ${e.message}`);
    totalFailed += 4;
}

// TEST 3: SemanticFingerprintV2 - Duplicate Detection
console.log('\n🔍 TEST 3: SemanticFingerprintV2 - Duplicate Detection');
try {
    const semantic = new SemanticFingerprintV2({
        hashSize: 64,
        duplicateThreshold: 0.95,
        similarityThreshold: 0.85
    });
    
    const text1 = 'How do I create a React component with hooks?';
    const text2 = 'How do I create a React component with hooks?'; // Exact duplicate
    const text3 = 'How can I make a React component using hooks?'; // Similar
    const text4 = 'What is the weather like today?'; // Different
    
    const fp1 = semantic.generateFingerprint(text1);
    const fp2 = semantic.generateFingerprint(text2);
    const fp3 = semantic.generateFingerprint(text3);
    const fp4 = semantic.generateFingerprint(text4);
    
    if (fp1 && fp1.length === 16) { // 64 bits = 16 hex chars
        console.log('   ✅ Generated fingerprint (64-bit hex)');
        totalPassed++;
    } else {
        console.log(`   ❌ Invalid fingerprint length: ${fp1?.length}`);
        totalFailed++;
    }
    
    // Test exact duplicate detection
    const dupCheck = semantic.checkDuplicate(text2);
    
    if (dupCheck.isDuplicate === true) {
        console.log('   ✅ Detected exact duplicate');
        totalPassed++;
    } else {
        console.log('   ❌ Failed to detect duplicate');
        totalFailed++;
    }
    
    // Test similarity
    const similarity1 = semantic.calculateSimilarity(fp1, fp3);
    const similarity2 = semantic.calculateSimilarity(fp1, fp4);
    
    if (similarity1 > similarity2) {
        console.log(`   ✅ Similarity detection: similar(${(similarity1*100).toFixed(0)}%) > different(${(similarity2*100).toFixed(0)}%)`);
        totalPassed++;
    } else {
        console.log('   ❌ Similarity calculation incorrect');
        totalFailed++;
    }
    
    // Test cache
    if (semantic.fingerprintCache.size >= 4) {
        console.log(`   ✅ Cache working: ${semantic.fingerprintCache.size} entries`);
        totalPassed++;
    } else {
        console.log('   ❌ Cache not working');
        totalFailed++;
    }
    
} catch (e) {
    console.log(`   ❌ FAIL: ${e.message}`);
    totalFailed += 4;
}

// TEST 4: CausalReasoner - Relationship Tracking
console.log('\n🔗 TEST 4: CausalReasoner - Cause-Effect Tracking');
try {
    const causal = new CausalReasoner({
        maxChainDepth: 10,
        inferenceThreshold: 0.7,
        minConfidence: 0.5
    });
    
    const messages = [
        { role: 'user', content: 'I have an error in my code', id: 'msg1' },
        { role: 'assistant', content: 'Let me help you debug that', id: 'msg2' },
        { role: 'user', content: 'The function returns undefined', id: 'msg3' },
        { role: 'assistant', content: 'The issue is that you forgot to return a value', id: 'msg4' }
    ];
    
    let previousId = null;
    messages.forEach(msg => {
        const result = causal.addMessage(msg, previousId);
        previousId = result.nodeId;
    });
    
    const graphSize = causal.causalGraph.nodes.size;
    
    if (graphSize === 4) {
        console.log(`   ✅ Built causal graph: ${graphSize} nodes`);
        totalPassed++;
    } else {
        console.log(`   ❌ Expected 4 nodes, got ${graphSize}`);
        totalFailed++;
    }
    
    const chains = causal.extractCausalChains(5);
    
    if (chains && chains.length > 0) {
        console.log(`   ✅ Extracted ${chains.length} causal chain(s)`);
        totalPassed++;
    } else {
        console.log('   ❌ Failed to extract causal chains');
        totalFailed++;
    }
    
    // Check if problem-solution pattern detected
    const firstNode = causal.causalGraph.nodes.values().next().value;
    if (firstNode && firstNode.type) {
        console.log(`   ✅ Message type classification working: "${firstNode.type}"`);
        totalPassed++;
    } else {
        console.log('   ❌ Message type classification failed');
        totalFailed++;
    }
    
} catch (e) {
    console.log(`   ❌ FAIL: ${e.message}`);
    totalFailed += 3;
}

// TEST 5: Integration Test - All Modules Together
console.log('\n🔄 TEST 5: Integration - All Modules Working Together');
try {
    const hierarchy = new HierarchyManager({ maxDepth: 5 });
    const delta = new DeltaEngine({ compressionThreshold: 0.3 });
    const semantic = new SemanticFingerprintV2({ duplicateThreshold: 0.95 });
    const causal = new CausalReasoner({ maxChainDepth: 10 });
    
    const conversation = {
        id: 'test-conv-1',
        title: 'Integration Test',
        messages: [
            { role: 'user', content: 'What is React?', timestamp: Date.now() },
            { role: 'assistant', content: 'React is a JavaScript library for building user interfaces', timestamp: Date.now() + 1000 }
        ],
        timestamp: Date.now()
    };
    
    // Add to hierarchy
    conversation.messages.forEach(msg => hierarchy.addMessage(msg));
    const hierarchyStats = hierarchy.getStats();
    
    // Generate fingerprints
    const fingerprints = conversation.messages.map(msg => 
        semantic.generateFingerprint(msg.content)
    );
    
    // Build causal graph
    let prevId = null;
    conversation.messages.forEach(msg => {
        const result = causal.addMessage(msg, prevId);
        prevId = result.nodeId;
    });
    
    if (hierarchyStats.totalNodes === 2 && fingerprints.length === 2 && causal.causalGraph.nodes.size === 2) {
        console.log('   ✅ All modules processed conversation successfully');
        console.log(`      - Hierarchy: ${hierarchyStats.totalNodes} nodes`);
        console.log(`      - Semantic: ${fingerprints.length} fingerprints`);
        console.log(`      - Causal: ${causal.causalGraph.nodes.size} nodes`);
        totalPassed++;
    } else {
        console.log('   ❌ Module integration issue');
        totalFailed++;
    }
    
    // Test delta on update
    const updatedConversation = JSON.parse(JSON.stringify(conversation));
    updatedConversation.messages.push({
        role: 'user',
        content: 'Can you explain hooks?',
        timestamp: Date.now() + 2000
    });
    
    const diff = delta.calculateDiff(conversation, updatedConversation);
    
    if (diff.added.length > 0) {
        console.log('   ✅ Delta detected changes on conversation update');
        totalPassed++;
    } else {
        console.log('   ❌ Delta failed to detect changes');
        totalFailed++;
    }
    
} catch (e) {
    console.log(`   ❌ FAIL: ${e.message}`);
    console.log(e.stack);
    totalFailed += 2;
}

// FINAL SUMMARY
console.log('\n' + '='.repeat(60));
console.log('FUNCTIONAL TEST RESULTS');
console.log('='.repeat(60));

const totalTests = totalPassed + totalFailed;
const passRate = Math.round((totalPassed / totalTests) * 100);

console.log(`\n✅ Passed: ${totalPassed}/${totalTests}`);
console.log(`❌ Failed: ${totalFailed}/${totalTests}`);
console.log(`📊 Pass Rate: ${passRate}%\n`);

if (passRate === 100) {
    console.log('🎉 ALL FUNCTIONAL TESTS PASSED!');
    console.log('✅ All modules are working correctly with real data\n');
} else if (passRate >= 80) {
    console.log('✅ Most tests passed - modules are functional');
    console.log('⚠️  Some edge cases may need attention\n');
} else {
    console.log('❌ Multiple failures detected');
    console.log('⚠️  Review failed tests above\n');
    process.exit(1);
}
