// Test Step 3: Syntax and Module Loading
console.log('🧪 Testing Step 3: Hierarchy + Delta + Semantic\n');

let passed = 0;
let failed = 0;

// Test 1: Check if files exist
console.log('📦 Test 1: File Existence');
const fs = require('fs');
try {
    const files = [
        'background-v3-step3.js',
        'hierarchy-manager.js',
        'delta-engine.js',
        'semantic-fingerprint-v2.js'
    ];
    
    files.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`   ✅ ${file} exists`);
        } else {
            throw new Error(`${file} not found`);
        }
    });
    passed++;
} catch (e) {
    console.log(`   ❌ FAIL: ${e.message}`);
    failed++;
}

// Test 2: Syntax validation
console.log('\n📦 Test 2: Syntax Validation');
const { execSync } = require('child_process');
try {
    execSync('node --check background-v3-step3.js', { stdio: 'pipe' });
    console.log('   ✅ background-v3-step3.js - Valid syntax');
    
    execSync('node --check hierarchy-manager.js', { stdio: 'pipe' });
    console.log('   ✅ hierarchy-manager.js - Valid syntax');
    
    execSync('node --check delta-engine.js', { stdio: 'pipe' });
    console.log('   ✅ delta-engine.js - Valid syntax');
    
    execSync('node --check semantic-fingerprint-v2.js', { stdio: 'pipe' });
    console.log('   ✅ semantic-fingerprint-v2.js - Valid syntax');
    
    passed++;
} catch (e) {
    console.log(`   ❌ FAIL: Syntax error detected`);
    failed++;
}

// Test 3: Check importScripts calls
console.log('\n📦 Test 3: Module Import Declarations');
try {
    const content = fs.readFileSync('background-v3-step3.js', 'utf8');
    
    if (content.includes("importScripts('hierarchy-manager.js')")) {
        console.log('   ✅ HierarchyManager import found');
    } else {
        throw new Error('HierarchyManager import missing');
    }
    
    if (content.includes("importScripts('delta-engine.js')")) {
        console.log('   ✅ DeltaEngine import found');
    } else {
        throw new Error('DeltaEngine import missing');
    }
    
    if (content.includes("importScripts('semantic-fingerprint-v2.js')")) {
        console.log('   ✅ SemanticFingerprintV2 import found');
    } else {
        throw new Error('SemanticFingerprintV2 import missing');
    }
    
    passed++;
} catch (e) {
    console.log(`   ❌ FAIL: ${e.message}`);
    failed++;
}

// Test 4: Check initialization code
console.log('\n📦 Test 4: Module Initialization');
try {
    const content = fs.readFileSync('background-v3-step3.js', 'utf8');
    
    if (content.includes('new HierarchyManager(')) {
        console.log('   ✅ HierarchyManager initialization found');
    } else {
        throw new Error('HierarchyManager initialization missing');
    }
    
    if (content.includes('new DeltaEngine(')) {
        console.log('   ✅ DeltaEngine initialization found');
    } else {
        throw new Error('DeltaEngine initialization missing');
    }
    
    if (content.includes('new SemanticFingerprintV2(')) {
        console.log('   ✅ SemanticFingerprintV2 initialization found');
    } else {
        throw new Error('SemanticFingerprintV2 initialization missing');
    }
    
    passed++;
} catch (e) {
    console.log(`   ❌ FAIL: ${e.message}`);
    failed++;
}

// Test 5: Check integration points
console.log('\n📦 Test 5: Integration Points');
try {
    const content = fs.readFileSync('background-v3-step3.js', 'utf8');
    
    if (content.includes('semanticFingerprint.generateFingerprint')) {
        console.log('   ✅ Semantic fingerprinting integration found');
    } else {
        throw new Error('Semantic fingerprinting integration missing');
    }
    
    if (content.includes('findSimilarConversations')) {
        console.log('   ✅ findSimilarConversations action found');
    } else {
        throw new Error('findSimilarConversations action missing');
    }
    
    if (content.includes('checkDuplicate')) {
        console.log('   ✅ checkDuplicate action found');
    } else {
        throw new Error('checkDuplicate action missing');
    }
    
    if (content.includes('getSemanticStats')) {
        console.log('   ✅ getSemanticStats action found');
    } else {
        throw new Error('getSemanticStats action missing');
    }
    
    passed++;
} catch (e) {
    console.log(`   ❌ FAIL: ${e.message}`);
    failed++;
}

// Test 6: Check manifest configuration
console.log('\n📦 Test 6: Manifest Configuration');
try {
    const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
    
    if (manifest.background.service_worker === 'background-v3-step3.js') {
        console.log('   ✅ Manifest points to background-v3-step3.js');
    } else {
        throw new Error(`Manifest points to ${manifest.background.service_worker} instead`);
    }
    
    passed++;
} catch (e) {
    console.log(`   ❌ FAIL: ${e.message}`);
    failed++;
}

// Test 7: Check file size (should be larger with semantic features)
console.log('\n📦 Test 7: File Size Check');
try {
    const stats = fs.statSync('background-v3-step3.js');
    const sizeKB = (stats.size / 1024).toFixed(1);
    
    if (stats.size > 15000) { // Should be >15KB with all features
        console.log(`   ✅ File size: ${sizeKB}KB (contains all features)`);
    } else {
        throw new Error(`File size too small: ${sizeKB}KB`);
    }
    
    passed++;
} catch (e) {
    console.log(`   ❌ FAIL: ${e.message}`);
    failed++;
}

// Summary
console.log('\n' + '='.repeat(50));
console.log(`✅ Step 3 Validation Complete!`);
console.log('='.repeat(50));
console.log(`✅ Passed: ${passed}/7`);
console.log(`❌ Failed: ${failed}/7`);
console.log(`📊 Success Rate: ${Math.round(passed/7 * 100)}%\n`);

if (passed === 7) {
    console.log('🎉 All tests passed! Step 3 is ready for Chrome testing.');
    console.log('\n💡 Next Steps:');
    console.log('   1. Reload extension in Chrome');
    console.log('   2. Test conversation capture with semantic fingerprinting');
    console.log('   3. Check for duplicate detection in console');
    console.log('   4. Verify similar conversations are found');
    console.log('   5. If working, proceed to Step 4\n');
} else {
    console.log('⚠️  Some tests failed. Review errors above.\n');
    process.exit(1);
}
