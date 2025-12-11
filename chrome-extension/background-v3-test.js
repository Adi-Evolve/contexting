// VOID Extension - Background Service Worker (Manifest V3) - TEST VERSION
// Testing module loading step by step

console.log('🧪 VOID Test: Starting background script...');

// Test 1: Basic script execution
console.log('✅ Test 1: Basic execution works');

// Test 2: Try loading first module
try {
    console.log('🔄 Test 2: Loading hierarchy-manager.js...');
    importScripts('core/hierarchy-manager.js');
    console.log('✅ Test 2: hierarchy-manager.js loaded');
} catch (error) {
    console.error('❌ Test 2 Failed:', error);
}

// Test 3: Try loading second module
try {
    console.log('🔄 Test 3: Loading delta-engine.js...');
    importScripts('core/delta-engine.js');
    console.log('✅ Test 3: delta-engine.js loaded');
} catch (error) {
    console.error('❌ Test 3 Failed:', error);
}

// Test 4: Try loading all remaining modules
try {
    console.log('🔄 Test 4: Loading remaining modules...');
    importScripts('core/semantic-fingerprint-v2.js');
    importScripts('core/causal-reasoner.js');
    importScripts('core/multimodal-handler.js');
    importScripts('core/federated-sync.js');
    importScripts('core/llm-query-engine.js');
    importScripts('core/void-core.js');
    console.log('✅ Test 4: All modules loaded');
} catch (error) {
    console.error('❌ Test 4 Failed:', error);
}

// Test 5: Try creating VOID instance
try {
    console.log('🔄 Test 5: Creating VOID instance...');
    const testVoid = new VOIDCore(null, {
        autoSync: false,
        ocrEnabled: true
    });
    console.log('✅ Test 5: VOID instance created:', testVoid);
} catch (error) {
    console.error('❌ Test 5 Failed:', error);
}

// Test 6: Try initializing VOID
try {
    console.log('🔄 Test 6: Initializing VOID...');
    const testVoid2 = new VOIDCore(null);
    testVoid2.initialize().then(() => {
        console.log('✅ Test 6: VOID initialized successfully');
    }).catch(err => {
        console.error('❌ Test 6 initialization error:', err);
    });
} catch (error) {
    console.error('❌ Test 6 Failed:', error);
}

console.log('🧪 VOID Test: All tests executed');
