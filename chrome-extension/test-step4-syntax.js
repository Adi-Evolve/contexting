// Test Step 4: Syntax and Module Loading
console.log('🧪 Testing Step 4: Hierarchy + Delta + Semantic + Causal\n');

let passed = 0;
let failed = 0;

const fs = require('fs');
const { execSync } = require('child_process');

console.log('📦 Test 1: File Existence');
try {
    const files = ['background-v3-step4.js', 'hierarchy-manager.js', 'delta-engine.js', 'semantic-fingerprint-v2.js', 'causal-reasoner.js'];
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

console.log('\n📦 Test 2: Syntax Validation');
try {
    execSync('node --check background-v3-step4.js', { stdio: 'pipe' });
    console.log('   ✅ background-v3-step4.js - Valid syntax');
    execSync('node --check causal-reasoner.js', { stdio: 'pipe' });
    console.log('   ✅ causal-reasoner.js - Valid syntax');
    passed++;
} catch (e) {
    console.log(`   ❌ FAIL: Syntax error detected`);
    failed++;
}

console.log('\n📦 Test 3: Module Import Declarations');
try {
    const content = fs.readFileSync('background-v3-step4.js', 'utf8');
    if (content.includes("importScripts('causal-reasoner.js')")) {
        console.log('   ✅ CausalReasoner import found');
    } else {
        throw new Error('CausalReasoner import missing');
    }
    passed++;
} catch (e) {
    console.log(`   ❌ FAIL: ${e.message}`);
    failed++;
}

console.log('\n📦 Test 4: Module Initialization');
try {
    const content = fs.readFileSync('background-v3-step4.js', 'utf8');
    if (content.includes('new CausalReasoner(')) {
        console.log('   ✅ CausalReasoner initialization found');
    } else {
        throw new Error('CausalReasoner initialization missing');
    }
    passed++;
} catch (e) {
    console.log(`   ❌ FAIL: ${e.message}`);
    failed++;
}

console.log('\n📦 Test 5: Integration Points');
try {
    const content = fs.readFileSync('background-v3-step4.js', 'utf8');
    if (content.includes('causalReasoner.addMessage')) {
        console.log('   ✅ Causal reasoning integration found');
    } else {
        throw new Error('Causal reasoning integration missing');
    }
    if (content.includes('getCausalChain')) {
        console.log('   ✅ getCausalChain action found');
    } else {
        throw new Error('getCausalChain action missing');
    }
    if (content.includes('getCausalStats')) {
        console.log('   ✅ getCausalStats action found');
    } else {
        throw new Error('getCausalStats action missing');
    }
    passed++;
} catch (e) {
    console.log(`   ❌ FAIL: ${e.message}`);
    failed++;
}

console.log('\n' + '='.repeat(50));
console.log(`✅ Step 4 Validation Complete!`);
console.log('='.repeat(50));
console.log(`✅ Passed: ${passed}/5`);
console.log(`❌ Failed: ${failed}/5`);
console.log(`📊 Success Rate: ${Math.round(passed/5 * 100)}%\n`);

if (passed === 5) {
    console.log('🎉 All tests passed! Step 4 ready for Chrome testing.\n');
} else {
    console.log('⚠️  Some tests failed. Review errors above.\n');
    process.exit(1);
}
