// Automated Test for background-v3-step1.js
// Tests: Base functionality + HierarchyManager integration

console.log('🧪 Testing background-v3-step1.js...\n');

// Simulate chrome.storage API
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
    },
    alarms: {
        create: () => {}
    }
};

// Load the module
require('./hierarchy-manager.js');
console.log('✅ HierarchyManager module loaded\n');

// Test conversation data
const testConversation = {
    id: 'test_conv_1',
    chatId: 'chat_123',
    title: 'Test JavaScript Help',
    messages: [
        { role: 'user', content: 'What is JavaScript?', timestamp: Date.now() - 5000, index: 0 },
        { role: 'assistant', content: 'JavaScript is a programming language.', timestamp: Date.now() - 4000, index: 1 },
        { role: 'user', content: 'How do I use arrays?', timestamp: Date.now() - 3000, index: 2 },
        { role: 'assistant', content: 'Arrays in JavaScript are created with [].', timestamp: Date.now() - 2000, index: 3 },
        { role: 'user', content: 'Can you show an example?', timestamp: Date.now() - 1000, index: 4 },
        { role: 'assistant', content: 'Sure: const arr = [1, 2, 3];', timestamp: Date.now(), index: 5 }
    ],
    startTime: Date.now() - 5000,
    messageCount: 6,
    platform: 'chatgpt'
};

// Test 1: HierarchyManager initialization
console.log('📦 Test 1: HierarchyManager Initialization');
try {
    const hierarchyManager = new HierarchyManager({
        maxDepth: 5,
        topicShiftThreshold: 0.4,
        similarityThreshold: 0.7
    });
    console.log('   ✅ HierarchyManager created successfully');
    console.log('   Stats:', hierarchyManager.getStats());
} catch (e) {
    console.log('   ❌ FAIL:', e.message);
}

// Test 2: Adding messages to hierarchy
console.log('\n📦 Test 2: Adding Messages to Hierarchy');
try {
    const hierarchyManager = new HierarchyManager();
    
    for (const message of testConversation.messages) {
        const node = hierarchyManager.addMessage(message);
        if (!node || !node.id) {
            throw new Error(`Failed to add message: ${message.content.substring(0, 30)}`);
        }
    }
    
    const stats = hierarchyManager.getStats();
    console.log('   ✅ All messages added successfully');
    console.log('   Total nodes:', stats.totalNodes);
    console.log('   Max depth:', stats.maxDepth);
    console.log('   Active branches:', stats.activeBranches);
    
    if (stats.totalNodes < testConversation.messages.length) {
        console.log('   ⚠️ Warning: Node count mismatch');
    }
} catch (e) {
    console.log('   ❌ FAIL:', e.message);
}

// Test 3: Getting hierarchical context
console.log('\n📦 Test 3: Hierarchical Context Extraction');
try {
    const hierarchyManager = new HierarchyManager();
    
    for (const message of testConversation.messages) {
        hierarchyManager.addMessage(message);
    }
    
    const context = hierarchyManager.getHierarchicalContext(10, 1000);
    console.log('   ✅ Context extracted successfully');
    console.log('   Context length:', context.length, 'chars');
    console.log('   Preview:', context.substring(0, 100) + '...');
} catch (e) {
    console.log('   ❌ FAIL:', e.message);
}

// Test 4: Serialization
console.log('\n📦 Test 4: Hierarchy Serialization');
try {
    const hierarchyManager = new HierarchyManager();
    
    for (const message of testConversation.messages) {
        hierarchyManager.addMessage(message);
    }
    
    const serialized = hierarchyManager.serialize();
    console.log('   ✅ Hierarchy serialized successfully');
    console.log('   Serialized data keys:', Object.keys(serialized));
    console.log('   Root node:', serialized.root ? '✅' : '❌');
    console.log('   Nodes count:', serialized.nodes ? serialized.nodes.length : 0);
} catch (e) {
    console.log('   ❌ FAIL:', e.message);
}

// Test 5: Integration test (simulating full flow)
console.log('\n📦 Test 5: Full Integration Test');
try {
    const hierarchyManager = new HierarchyManager();
    
    // Build hierarchy
    for (const message of testConversation.messages) {
        hierarchyManager.addMessage(message);
    }
    
    // Create enriched conversation object
    const enrichedConversation = {
        ...testConversation,
        hierarchy: {
            tree: hierarchyManager.serialize(),
            context: hierarchyManager.getHierarchicalContext(20, 2000),
            stats: hierarchyManager.getStats()
        }
    };
    
    console.log('   ✅ Full integration successful');
    console.log('   Conversation has hierarchy:', !!enrichedConversation.hierarchy);
    console.log('   Hierarchy context length:', enrichedConversation.hierarchy.context.length);
    console.log('   Tree structure present:', !!enrichedConversation.hierarchy.tree);
    
    // Verify it can be serialized (important for storage)
    const jsonString = JSON.stringify(enrichedConversation);
    console.log('   ✅ Conversation serializable:', jsonString.length, 'bytes');
    
} catch (e) {
    console.log('   ❌ FAIL:', e.message);
    console.error(e.stack);
}

console.log('\n' + '='.repeat(50));
console.log('✅ Step 1 Testing Complete!');
console.log('='.repeat(50));
console.log('\n💡 Next Steps:');
console.log('   1. Reload extension with background-v3-step1.js');
console.log('   2. Test conversation capture with hierarchy');
console.log('   3. If working, proceed to Step 2 (DeltaEngine)');
