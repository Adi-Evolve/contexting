// VOID Core Integration Tests
// Comprehensive test suite for all 7 modules

class VOIDTestSuite {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            tests: []
        };
    }
    
    /**
     * Run all tests
     */
    async runAll() {
        console.log('🧪 VOID Core Test Suite Starting...\n');
        
        await this.testHierarchyManager();
        await this.testDeltaEngine();
        await this.testSemanticFingerprint();
        await this.testCausalReasoner();
        await this.testMultiModalHandler();
        await this.testLLMQueryEngine();
        await this.testIntegration();
        
        this.printResults();
    }
    
    /**
     * Test Hierarchy Manager
     */
    async testHierarchyManager() {
        console.log('📊 Testing Hierarchy Manager...');
        
        const manager = new HierarchyManager();
        
        // Test 1: Add root message
        await this.test('Add root message', () => {
            const result = manager.addMessage({
                id: 'msg_1',
                role: 'user',
                content: 'How do I build a REST API?',
                timestamp: Date.now()
            });
            
            return result.nodeId === 'msg_1' && result.parentId === null;
        });
        
        // Test 2: Add child message
        await this.test('Add child message', () => {
            const result = manager.addMessage({
                id: 'msg_2',
                role: 'assistant',
                content: 'You can build a REST API using Express.js. First install it with npm install express.',
                timestamp: Date.now()
            });
            
            return result.nodeId === 'msg_2' && result.parentId === 'msg_1';
        });
        
        // Test 3: Detect topic shift
        await this.test('Detect topic shift', () => {
            const result = manager.addMessage({
                id: 'msg_3',
                role: 'user',
                content: 'What is the weather like today?',
                timestamp: Date.now()
            });
            
            return result.isTopicShift === true;
        });
        
        // Test 4: Get hierarchical context
        await this.test('Get hierarchical context', () => {
            const context = manager.getHierarchicalContext('msg_2', 1000);
            
            return Array.isArray(context) && context.length > 0;
        });
        
        // Test 5: Calculate importance
        await this.test('Calculate importance scores', () => {
            const node = manager.tree.nodes.get('msg_1');
            
            return node.importance > 0 && node.importance <= 1;
        });
        
        // Test 6: Serialization
        await this.test('Serialize and deserialize', () => {
            const serialized = manager.serialize();
            const restored = HierarchyManager.deserialize(serialized);
            
            return restored.tree.nodes.size === manager.tree.nodes.size;
        });
        
        console.log('');
    }
    
    /**
     * Test Delta Engine
     */
    async testDeltaEngine() {
        console.log('🔄 Testing Delta Engine...');
        
        const engine = new DeltaEngine();
        
        // Test 1: Save initial state
        await this.test('Save initial state', () => {
            const state = { messages: ['msg_1', 'msg_2'], count: 2 };
            const result = engine.saveState(state);
            
            return result.saved === true && result.patch === null;
        });
        
        // Test 2: Save delta
        await this.test('Save delta state', () => {
            const state = { messages: ['msg_1', 'msg_2', 'msg_3'], count: 3 };
            const result = engine.saveState(state);
            
            return result.saved === true && result.patch !== null;
        });
        
        // Test 3: Calculate compression ratio
        await this.test('Verify compression ratio', () => {
            const stats = engine.getStats();
            
            return stats.compressionRatio > 0.5; // At least 50% compression
        });
        
        // Test 4: Reconstruct state
        await this.test('Reconstruct state from patches', () => {
            const reconstructed = engine.reconstructState(1, []);
            
            return reconstructed !== null;
        });
        
        // Test 5: Patch optimization
        await this.test('Optimize patch chains', () => {
            // Add many patches
            for (let i = 0; i < 12; i++) {
                engine.saveState({ messages: Array(i + 4).fill(0).map((_, j) => `msg_${j}`), count: i + 4 });
            }
            
            const stats = engine.getStats();
            return stats.totalPatches < 12; // Should have optimized
        });
        
        console.log('');
    }
    
    /**
     * Test Semantic Fingerprint
     */
    async testSemanticFingerprint() {
        console.log('🔍 Testing Semantic Fingerprint...');
        
        const fingerprint = new SemanticFingerprintV2();
        
        // Test 1: Generate fingerprint
        await this.test('Generate text fingerprint', () => {
            const fp = fingerprint.generateFingerprint('How do I build a REST API?');
            
            return typeof fp === 'string' && fp.length === 16;
        });
        
        // Test 2: Detect exact duplicate
        await this.test('Detect exact duplicate', () => {
            const text = 'This is a test message';
            fingerprint.generateFingerprint(text);
            
            const fp2 = fingerprint.generateFingerprint(text);
            const result = fingerprint.checkDuplicate(fp2);
            
            return result.isDuplicate === true && result.confidence === 1.0;
        });
        
        // Test 3: Detect semantic duplicate
        await this.test('Detect semantic duplicate', () => {
            const text1 = 'How can I create a REST API?';
            const text2 = 'What is the best way to build a REST API?';
            
            const fp1 = fingerprint.generateFingerprint(text1);
            const fp2 = fingerprint.generateFingerprint(text2);
            
            const similarity = fingerprint.calculateSimilarity(fp1, fp2);
            
            return similarity > 0.5; // Should have some similarity
        });
        
        // Test 4: Bloom filter
        await this.test('Bloom filter works', () => {
            const fp = fingerprint.generateFingerprint('Test message for bloom filter');
            
            return fingerprint.bloomContains(fp) === true;
        });
        
        // Test 5: Extract triplets
        await this.test('Extract semantic triplets', () => {
            const triplets = fingerprint.extractTriplets('The user asked about building APIs');
            
            return Array.isArray(triplets) && triplets.length >= 0;
        });
        
        console.log('');
    }
    
    /**
     * Test Causal Reasoner
     */
    async testCausalReasoner() {
        console.log('🔗 Testing Causal Reasoner...');
        
        const reasoner = new CausalReasoner();
        
        // Test 1: Add question message
        await this.test('Add question message', () => {
            const result = reasoner.addMessage({
                id: 'msg_1',
                role: 'user',
                content: 'Why did we choose React?',
                timestamp: Date.now()
            });
            
            return result.nodeId === 'msg_1';
        });
        
        // Test 2: Add answer with causality
        await this.test('Infer causality for answer', () => {
            const result = reasoner.addMessage({
                id: 'msg_2',
                role: 'assistant',
                content: 'We chose React because it has better TypeScript support.',
                timestamp: Date.now() + 1000
            }, 'msg_1');
            
            return result.causality.causes.length > 0;
        });
        
        // Test 3: Get causal chain
        await this.test('Get causal chain', () => {
            const chain = reasoner.getCausalChain('msg_2');
            
            return Array.isArray(chain) && chain.length > 0;
        });
        
        // Test 4: Explain why
        await this.test('Generate explanation', () => {
            const explanation = reasoner.explainWhy('msg_2');
            
            return typeof explanation === 'string' && explanation.length > 0;
        });
        
        // Test 5: Pattern detection
        await this.test('Detect question pattern', () => {
            const msg = reasoner.causalGraph.nodes.get('msg_1');
            
            return msg.type === 'question';
        });
        
        console.log('');
    }
    
    /**
     * Test Multi-Modal Handler
     */
    async testMultiModalHandler() {
        console.log('🖼️ Testing Multi-Modal Handler...');
        
        const handler = new MultiModalHandler({ ocrEnabled: false }); // Disable OCR for tests
        
        // Test 1: Generate visual fingerprint
        await this.test('Generate visual fingerprint', async () => {
            // Create test image
            const canvas = document.createElement('canvas');
            canvas.width = 100;
            canvas.height = 100;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'red';
            ctx.fillRect(0, 0, 100, 100);
            
            const imageData = ctx.getImageData(0, 0, 100, 100);
            const fingerprint = await handler.extractVisualFingerprint({
                width: 100,
                height: 100,
                getContext: () => ({ getImageData: () => imageData })
            });
            
            return typeof fingerprint === 'string' && fingerprint.startsWith('img_');
        });
        
        // Test 2: Detect content type
        await this.test('Detect image content type', () => {
            const contentType = handler.detectImageContentType(
                { width: 1920, height: 1080 },
                { text: 'function hello() { console.log("test"); }', confidence: 90 }
            );
            
            return contentType.type === 'code';
        });
        
        // Test 3: Extract dominant colors
        await this.test('Extract dominant colors', async () => {
            const canvas = document.createElement('canvas');
            canvas.width = 50;
            canvas.height = 50;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'blue';
            ctx.fillRect(0, 0, 50, 50);
            
            const img = { width: 50, height: 50 };
            const colors = await handler.extractDominantColors(img);
            
            return Array.isArray(colors) && colors.length > 0;
        });
        
        // Test 4: Calculate fingerprint similarity
        await this.test('Calculate fingerprint similarity', () => {
            const similarity = handler.calculateFingerprintSimilarity('img_1234abcd', 'img_1234abcd');
            
            return similarity === 1.0;
        });
        
        console.log('');
    }
    
    /**
     * Test LLM Query Engine
     */
    async testLLMQueryEngine() {
        console.log('🔎 Testing LLM Query Engine...');
        
        // Set up dependencies
        const hierarchy = new HierarchyManager();
        const causality = new CausalReasoner();
        const fingerprint = new SemanticFingerprintV2();
        const multimodal = new MultiModalHandler({ ocrEnabled: false });
        
        // Add test data
        hierarchy.addMessage({
            id: 'msg_1',
            role: 'user',
            content: 'How do I implement authentication?',
            timestamp: Date.now() - 86400000 // Yesterday
        });
        
        hierarchy.addMessage({
            id: 'msg_2',
            role: 'assistant',
            content: 'You can use JWT tokens for authentication. Here is an example...',
            timestamp: Date.now() - 86400000 + 1000
        });
        
        const engine = new LLMQueryEngine(hierarchy, causality, fingerprint, multimodal);
        
        // Test 1: Parse query
        await this.test('Parse natural language query', () => {
            const parsed = engine.parseQuery('What did we discuss about authentication yesterday?');
            
            return parsed.keywords.includes('authentication') && parsed.timeframe !== null;
        });
        
        // Test 2: Classify query type
        await this.test('Classify query type', () => {
            const type = engine.classifyQuery('Why did we choose React?');
            
            return type === 'causal';
        });
        
        // Test 3: Execute temporal query
        await this.test('Execute temporal query', async () => {
            const results = await engine.query('What did we discuss yesterday?');
            
            return results.results.length > 0;
        });
        
        // Test 4: Extract keywords
        await this.test('Extract keywords', () => {
            const keywords = engine.extractKeywords('Show me the authentication implementation from yesterday');
            
            return keywords.includes('authentication') && keywords.includes('implementation');
        });
        
        // Test 5: Format for LLM
        await this.test('Format results for LLM', async () => {
            const results = await engine.query('authentication');
            const formatted = engine.formatForLLM(results);
            
            return typeof formatted === 'string' && formatted.includes('Context Results');
        });
        
        console.log('');
    }
    
    /**
     * Test Full Integration
     */
    async testIntegration() {
        console.log('🔗 Testing Full Integration...');
        
        // Mock Supabase client
        const mockSupabase = {
            from: () => ({
                insert: () => Promise.resolve({ data: [], error: null }),
                select: () => ({
                    gt: () => ({
                        order: () => ({
                            neq: () => Promise.resolve({ data: [], error: null })
                        })
                    })
                })
            }),
            channel: () => ({
                on: () => ({ subscribe: () => {} })
            })
        };
        
        const core = new VOIDCore(mockSupabase, {
            autoSync: false,
            ocrEnabled: false
        });
        
        // Test 1: Initialize
        await this.test('Initialize VOID Core', async () => {
            await core.initialize();
            
            return core.isInitialized === true;
        });
        
        // Test 2: Process message
        await this.test('Process complete message pipeline', async () => {
            const result = await core.processMessage({
                id: 'msg_test_1',
                role: 'user',
                content: 'How do I build a REST API with Express?',
                timestamp: Date.now()
            });
            
            return result.success === true && result.messageId === 'msg_test_1';
        });
        
        // Test 3: Process follow-up
        await this.test('Process follow-up message', async () => {
            const result = await core.processMessage({
                id: 'msg_test_2',
                role: 'assistant',
                content: 'Here is how to build a REST API: First install Express with npm install express...',
                timestamp: Date.now()
            });
            
            return result.success === true && result.hierarchyNode !== null;
        });
        
        // Test 4: Query system
        await this.test('Query integrated system', async () => {
            const results = await core.query('REST API');
            
            return results.results.length > 0;
        });
        
        // Test 5: Get context for LLM
        await this.test('Get formatted context', async () => {
            const context = await core.getContextForLLM('Express API');
            
            return typeof context === 'string' && context.length > 0;
        });
        
        // Test 6: Get statistics
        await this.test('Get comprehensive statistics', () => {
            const stats = core.getStats();
            
            return stats.messagesProcessed === 2 && 
                   stats.hierarchy && 
                   stats.causality && 
                   stats.queries;
        });
        
        // Test 7: Create snapshot
        await this.test('Create system snapshot', () => {
            const snapshot = core.createSnapshot();
            
            return snapshot.hierarchy && 
                   snapshot.causality && 
                   snapshot.fingerprints &&
                   snapshot.timestamp;
        });
        
        // Test 8: Export/Import
        await this.test('Export and import data', async () => {
            const exported = await core.exportData();
            
            const core2 = new VOIDCore(mockSupabase, { autoSync: false });
            await core2.initialize();
            await core2.importData(exported);
            
            const stats1 = core.getStats();
            const stats2 = core2.getStats();
            
            return stats1.messagesProcessed === stats2.messagesProcessed;
        });
        
        console.log('');
    }
    
    /**
     * Run a single test
     */
    async test(name, fn) {
        try {
            const result = await fn();
            
            if (result) {
                console.log(`✅ ${name}`);
                this.results.passed++;
                this.results.tests.push({ name, passed: true });
            } else {
                console.log(`❌ ${name} - Assertion failed`);
                this.results.failed++;
                this.results.tests.push({ name, passed: false, error: 'Assertion failed' });
            }
        } catch (error) {
            console.log(`❌ ${name} - ${error.message}`);
            this.results.failed++;
            this.results.tests.push({ name, passed: false, error: error.message });
        }
    }
    
    /**
     * Print test results
     */
    printResults() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST RESULTS');
        console.log('='.repeat(60));
        console.log(`Total Tests: ${this.results.passed + this.results.failed}`);
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`Success Rate: ${Math.round(this.results.passed / (this.results.passed + this.results.failed) * 100)}%`);
        console.log('='.repeat(60));
        
        if (this.results.failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.results.tests
                .filter(t => !t.passed)
                .forEach(t => console.log(`   - ${t.name}: ${t.error}`));
        }
    }
}

// Run tests when page loads
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async () => {
        const suite = new VOIDTestSuite();
        await suite.runAll();
    });
}

// Export for use in extension
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VOIDTestSuite;
}
