// VOID Extension - Diagnostic Test Script
// IMPORTANT: Run this in the CONTENT SCRIPT console, NOT webpage console!
// 1. F12 on ChatGPT
// 2. Go to Console tab
// 3. Look for dropdown at top that says "top" or "user messages"
// 4. Select the extension context (look for "content-chatgpt-v2.js" or similar)
// 5. Paste and run this script

console.log('🔍 VOID Extension Diagnostic Starting...\n');

// Quick check if we're in the right context
if (typeof window.ConversationTracker === 'undefined' && typeof chrome !== 'undefined') {
    console.error('⚠️ WARNING: You may be in the webpage console, not the extension console!');
    console.error('Please select the extension context from the dropdown at the top of the console.');
    console.error('Look for entries showing "content-chatgpt-v2.js" or similar.');
}

const tests = {
    passed: 0,
    failed: 0,
    results: []
};

// Test 1: Extension Context
function test1_ExtensionContext() {
    try {
        const hasChrome = typeof chrome !== 'undefined';
        const hasRuntime = hasChrome && chrome.runtime;
        const hasExtensionId = hasRuntime && chrome.runtime.id;
        
        if (hasExtensionId) {
            tests.results.push('✅ Test 1: Extension context available');
            tests.passed++;
            return true;
        } else {
            tests.results.push('❌ Test 1: No extension context (wrong console context?)');
            tests.failed++;
            return false;
        }
    } catch (e) {
        tests.results.push(`❌ Test 1: Error - ${e.message}`);
        tests.failed++;
        return false;
    }
}

// Test 2: Content Script Loaded
function test2_ContentScriptLoaded() {
    try {
        const hasConversationTracker = typeof window.ConversationTracker !== 'undefined';
        const hasContextExtractor = typeof window.ContextExtractor !== 'undefined';
        
        if (hasConversationTracker && hasContextExtractor) {
            tests.results.push('✅ Test 2: Content scripts loaded');
            tests.passed++;
            return true;
        } else {
            tests.results.push(`❌ Test 2: Content scripts missing (Tracker: ${hasConversationTracker}, Extractor: ${hasContextExtractor})`);
            tests.failed++;
            return false;
        }
    } catch (e) {
        tests.results.push(`❌ Test 2: Error - ${e.message}`);
        tests.failed++;
        return false;
    }
}

// Test 3: Sidebar Button Present
function test3_SidebarButton() {
    try {
        const button = document.querySelector('.mf-floating-button, [class*="mf-floating"]');
        
        if (button) {
            tests.results.push('✅ Test 3: Sidebar button found');
            tests.passed++;
            return true;
        } else {
            tests.results.push('❌ Test 3: Sidebar button not found');
            tests.failed++;
            return false;
        }
    } catch (e) {
        tests.results.push(`❌ Test 3: Error - ${e.message}`);
        tests.failed++;
        return false;
    }
}

// Test 4: Background Communication
async function test4_BackgroundComm() {
    try {
        const response = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: 'getStats' }, (resp) => {
                resolve(resp);
            });
        });
        
        if (response && !chrome.runtime.lastError) {
            tests.results.push(`✅ Test 4: Background communication OK (${response.count || 0} conversations)`);
            tests.passed++;
            return true;
        } else {
            tests.results.push(`❌ Test 4: Background error - ${chrome.runtime.lastError?.message || 'No response'}`);
            tests.failed++;
            return false;
        }
    } catch (e) {
        tests.results.push(`❌ Test 4: Error - ${e.message}`);
        tests.failed++;
        return false;
    }
}

// Test 5: ContextAssembler Available
async function test5_ContextAssembler() {
    try {
        const response = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: 'getAssemblerStats' }, (resp) => {
                resolve(resp);
            });
        });
        
        if (response && response.initialized) {
            tests.results.push('✅ Test 5: ContextAssemblerV2 initialized');
            tests.passed++;
            return true;
        } else {
            tests.results.push(`❌ Test 5: ContextAssembler not initialized - ${response?.error || 'Unknown'}`);
            tests.failed++;
            return false;
        }
    } catch (e) {
        tests.results.push(`❌ Test 5: Error - ${e.message}`);
        tests.failed++;
        return false;
    }
}

// Test 6: Test Context Assembly (if conversations exist)
async function test6_TestAssembly() {
    try {
        const convResponse = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: 'getConversations' }, (resp) => {
                resolve(resp);
            });
        });
        
        if (!convResponse || !convResponse.conversations || convResponse.conversations.length === 0) {
            tests.results.push('⏭️ Test 6: No conversations to test (create one first)');
            return true;
        }
        
        const testConv = convResponse.conversations[0];
        const assembleResponse = await new Promise((resolve) => {
            chrome.runtime.sendMessage({
                action: 'assembleContext',
                conversationId: testConv.id
            }, (resp) => {
                resolve(resp);
            });
        });
        
        if (assembleResponse && assembleResponse.success) {
            tests.results.push(`✅ Test 6: Context assembly works (${assembleResponse.tokenEstimate} tokens)`);
            tests.passed++;
            return true;
        } else {
            tests.results.push(`❌ Test 6: Assembly failed - ${assembleResponse?.error || 'Unknown'}`);
            tests.failed++;
            return false;
        }
    } catch (e) {
        tests.results.push(`❌ Test 6: Error - ${e.message}`);
        tests.failed++;
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('Running diagnostics...\n');
    
    test1_ExtensionContext();
    test2_ContentScriptLoaded();
    test3_SidebarButton();
    await test4_BackgroundComm();
    await test5_ContextAssembler();
    await test6_TestAssembly();
    
    console.log('\n' + '='.repeat(50));
    console.log('DIAGNOSTIC RESULTS');
    console.log('='.repeat(50) + '\n');
    
    tests.results.forEach(result => console.log(result));
    
    console.log('\n' + '-'.repeat(50));
    console.log(`Total: ${tests.passed + tests.failed} tests`);
    console.log(`Passed: ${tests.passed} ✅`);
    console.log(`Failed: ${tests.failed} ❌`);
    console.log(`Success Rate: ${Math.round((tests.passed / (tests.passed + tests.failed)) * 100)}%`);
    console.log('-'.repeat(50) + '\n');
    
    if (tests.failed === 0) {
        console.log('🎉 All tests passed! Extension is working correctly.');
    } else {
        console.log('⚠️ Some tests failed. Check the results above for details.');
        console.log('\nCommon fixes:');
        console.log('1. Reload the extension (chrome://extensions/)');
        console.log('2. Refresh this page (F5)');
        console.log('3. Check background console for errors');
        console.log('4. Verify all files are present in extension folder');
    }
}

// Execute
runAllTests();
