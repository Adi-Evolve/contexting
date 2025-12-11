// Test service worker for debugging imports
console.log('Background test worker starting...');

try {
    console.log('Attempting to import test-simple.js...');
    importScripts('core/test-simple.js');
    console.log('✅ test-simple.js loaded!');
} catch (e) {
    console.error('❌ Failed to load test-simple.js:', e);
}

try {
    console.log('Attempting to import hierarchy-manager.js...');
    importScripts('core/hierarchy-manager.js');
    console.log('✅ hierarchy-manager.js loaded!');
} catch (e) {
    console.error('❌ Failed to load hierarchy-manager.js:', e);
}

console.log('Background test worker ready');
