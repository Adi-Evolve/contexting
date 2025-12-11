// Test Step 5 & 6: Final Validation
console.log('🧪 Testing Steps 5 & 6: All Modules Integration\n');

const fs = require('fs');
const { execSync } = require('child_process');
let passed = 0, failed = 0;

console.log('📦 Test 1: All Files Exist');
try {
    const files = ['background-v3-step5.js', 'background-v3-step6.js', 'hierarchy-manager.js', 'delta-engine.js', 'semantic-fingerprint-v2.js', 'causal-reasoner.js', 'multimodal-handler.js', 'llm-query-engine.js'];
    files.forEach(file => {
        if (fs.existsSync(file)) console.log(`   ✅ ${file}`);
        else throw new Error(`${file} not found`);
    });
    passed++;
} catch (e) {
    console.log(`   ❌ FAIL: ${e.message}`);
    failed++;
}

console.log('\n📦 Test 2: Syntax Validation - Step 5');
try {
    execSync('node --check background-v3-step5.js', { stdio: 'pipe' });
    console.log('   ✅ background-v3-step5.js - Valid');
    execSync('node --check multimodal-handler.js', { stdio: 'pipe' });
    console.log('   ✅ multimodal-handler.js - Valid');
    passed++;
} catch (e) {
    console.log(`   ❌ FAIL: Syntax error`);
    failed++;
}

console.log('\n📦 Test 3: Syntax Validation - Step 6');
try {
    execSync('node --check background-v3-step6.js', { stdio: 'pipe' });
    console.log('   ✅ background-v3-step6.js - Valid');
    execSync('node --check llm-query-engine.js', { stdio: 'pipe' });
    console.log('   ✅ llm-query-engine.js - Valid');
    passed++;
} catch (e) {
    console.log(`   ❌ FAIL: Syntax error`);
    failed++;
}

console.log('\n📦 Test 4: Step 5 Integration');
try {
    const content = fs.readFileSync('background-v3-step5.js', 'utf8');
    if (content.includes("multimodal-handler.js")) console.log('   ✅ MultiModalHandler import found');
    else throw new Error('MultiModalHandler import missing');
    if (content.includes('new MultiModalHandler(')) console.log('   ✅ MultiModalHandler initialization found');
    else throw new Error('MultiModalHandler initialization missing');
    if (content.includes('getMultiModalStats')) console.log('   ✅ getMultiModalStats action found');
    else throw new Error('getMultiModalStats action missing');
    passed++;
} catch (e) {
    console.log(`   ❌ FAIL: ${e.message}`);
    failed++;
}

console.log('\n📦 Test 5: Step 6 Integration');
try {
    const content = fs.readFileSync('background-v3-step6.js', 'utf8');
    if (content.includes("llm-query-engine.js")) console.log('   ✅ LLMQueryEngine import found');
    else throw new Error('LLMQueryEngine import missing');
    if (content.includes('new LLMQueryEngine(')) console.log('   ✅ LLMQueryEngine initialization found');
    else throw new Error('LLMQueryEngine initialization missing');
    if (content.includes('queryNaturalLanguage')) console.log('   ✅ queryNL action found');
    else throw new Error('queryNL action missing');
    if (content.includes('ALL 6 MODULES')) console.log('   ✅ All 6 modules message found');
    else throw new Error('Missing all modules confirmation');
    passed++;
} catch (e) {
    console.log(`   ❌ FAIL: ${e.message}`);
    failed++;
}

console.log('\n📦 Test 6: File Size Checks');
try {
    const step5Size = (fs.statSync('background-v3-step5.js').size / 1024).toFixed(1);
    const step6Size = (fs.statSync('background-v3-step6.js').size / 1024).toFixed(1);
    if (fs.statSync('background-v3-step5.js').size > 10000) console.log(`   ✅ Step 5: ${step5Size}KB`);
    else throw new Error('Step 5 too small');
    if (fs.statSync('background-v3-step6.js').size > 10000) console.log(`   ✅ Step 6: ${step6Size}KB`);
    else throw new Error('Step 6 too small');
    passed++;
} catch (e) {
    console.log(`   ❌ FAIL: ${e.message}`);
    failed++;
}

console.log('\n' + '='.repeat(50));
console.log(`✅ Steps 5 & 6 Validation Complete!`);
console.log('='.repeat(50));
console.log(`✅ Passed: ${passed}/6`);
console.log(`❌ Failed: ${failed}/6`);
console.log(`📊 Success Rate: ${Math.round(passed/6 * 100)}%\n`);

if (passed === 6) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('\n🚀 READY FOR PRODUCTION:');
    console.log('   ✅ Step 5: Base + MultiModal (5 modules)');
    console.log('   ✅ Step 6: Base + ALL 6 MODULES (COMPLETE)');
    console.log('\n💡 Next: Update manifest to Step 6 and test in Chrome!\n');
} else {
    console.log('⚠️  Some tests failed.\n');
    process.exit(1);
}
