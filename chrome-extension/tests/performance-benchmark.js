// VOID Performance Benchmarks
// Tests performance targets for all modules

class VOIDPerformanceBenchmarks {
    constructor() {
        this.results = [];
        this.targets = {
            messageProcessing: 50, // ms
            contextRetrieval: 100, // ms
            semanticDedup: 10, // ms
            compressionRatio: 0.9, // 90%+
            queryExecution: 100, // ms
            stateReconstruction: 150 // ms
        };
    }
    
    /**
     * Run all benchmarks
     */
    async runAll() {
        console.log('⚡ VOID Performance Benchmarks Starting...\n');
        
        await this.benchmarkMessageProcessing();
        await this.benchmarkContextRetrieval();
        await this.benchmarkSemanticDedup();
        await this.benchmarkCompression();
        await this.benchmarkQueryExecution();
        await this.benchmarkStateReconstruction();
        
        this.printResults();
    }
    
    /**
     * Benchmark message processing
     */
    async benchmarkMessageProcessing() {
        console.log('📊 Benchmarking Message Processing...');
        
        // Mock Supabase
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
        
        const core = new VOIDCore(mockSupabase, { autoSync: false, ocrEnabled: false });
        await core.initialize();
        
        // Warm up
        for (let i = 0; i < 5; i++) {
            await core.processMessage({
                id: `warmup_${i}`,
                role: 'user',
                content: 'Test message for warmup',
                timestamp: Date.now()
            });
        }
        
        // Benchmark
        const iterations = 100;
        const times = [];
        
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            
            await core.processMessage({
                id: `msg_${i}`,
                role: i % 2 === 0 ? 'user' : 'assistant',
                content: this.generateTestMessage(i),
                timestamp: Date.now()
            });
            
            const end = performance.now();
            times.push(end - start);
        }
        
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);
        const p95 = this.percentile(times, 0.95);
        
        this.recordResult('Message Processing', {
            target: this.targets.messageProcessing,
            average: avgTime,
            min: minTime,
            max: maxTime,
            p95: p95,
            passed: avgTime <= this.targets.messageProcessing
        });
        
        console.log(`  Avg: ${avgTime.toFixed(2)}ms (target: ${this.targets.messageProcessing}ms)`);
        console.log(`  Min: ${minTime.toFixed(2)}ms | Max: ${maxTime.toFixed(2)}ms | P95: ${p95.toFixed(2)}ms`);
        console.log('');
    }
    
    /**
     * Benchmark context retrieval
     */
    async benchmarkContextRetrieval() {
        console.log('📊 Benchmarking Context Retrieval...');
        
        const manager = new HierarchyManager();
        
        // Add 1000 messages
        for (let i = 0; i < 1000; i++) {
            manager.addMessage({
                id: `msg_${i}`,
                role: i % 2 === 0 ? 'user' : 'assistant',
                content: this.generateTestMessage(i),
                timestamp: Date.now() + i * 1000
            });
        }
        
        // Benchmark retrieval
        const iterations = 100;
        const times = [];
        
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            
            const context = manager.getHierarchicalContext(`msg_${i * 10}`, 4000);
            
            const end = performance.now();
            times.push(end - start);
        }
        
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const p95 = this.percentile(times, 0.95);
        
        this.recordResult('Context Retrieval', {
            target: this.targets.contextRetrieval,
            average: avgTime,
            p95: p95,
            passed: avgTime <= this.targets.contextRetrieval
        });
        
        console.log(`  Avg: ${avgTime.toFixed(2)}ms (target: ${this.targets.contextRetrieval}ms)`);
        console.log(`  P95: ${p95.toFixed(2)}ms`);
        console.log('');
    }
    
    /**
     * Benchmark semantic deduplication
     */
    async benchmarkSemanticDedup() {
        console.log('📊 Benchmarking Semantic Deduplication...');
        
        const fingerprint = new SemanticFingerprintV2();
        
        // Add 1000 fingerprints
        for (let i = 0; i < 1000; i++) {
            fingerprint.generateFingerprint(this.generateTestMessage(i));
        }
        
        // Benchmark duplicate check
        const iterations = 1000;
        const times = [];
        
        for (let i = 0; i < iterations; i++) {
            const fp = fingerprint.generateFingerprint(this.generateTestMessage(i));
            
            const start = performance.now();
            
            fingerprint.checkDuplicate(fp);
            
            const end = performance.now();
            times.push(end - start);
        }
        
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const p95 = this.percentile(times, 0.95);
        
        this.recordResult('Semantic Deduplication', {
            target: this.targets.semanticDedup,
            average: avgTime,
            p95: p95,
            passed: avgTime <= this.targets.semanticDedup
        });
        
        console.log(`  Avg: ${avgTime.toFixed(2)}ms (target: ${this.targets.semanticDedup}ms)`);
        console.log(`  P95: ${p95.toFixed(2)}ms`);
        console.log('');
    }
    
    /**
     * Benchmark compression
     */
    async benchmarkCompression() {
        console.log('📊 Benchmarking Differential Compression...');
        
        const engine = new DeltaEngine();
        
        // Create states
        let state = { messages: [], count: 0 };
        
        // Save initial
        engine.saveState(state);
        
        // Add messages incrementally
        for (let i = 0; i < 100; i++) {
            state.messages.push({
                id: `msg_${i}`,
                content: this.generateTestMessage(i)
            });
            state.count++;
            
            engine.saveState(state);
        }
        
        const stats = engine.getStats();
        const compressionRatio = stats.compressionRatio;
        
        this.recordResult('Compression Ratio', {
            target: this.targets.compressionRatio,
            actual: compressionRatio,
            passed: compressionRatio >= this.targets.compressionRatio
        });
        
        console.log(`  Ratio: ${(compressionRatio * 100).toFixed(1)}% (target: ${this.targets.compressionRatio * 100}%)`);
        console.log(`  Total patches: ${stats.totalPatches}`);
        console.log(`  Total snapshots: ${stats.totalSnapshots}`);
        console.log('');
    }
    
    /**
     * Benchmark query execution
     */
    async benchmarkQueryExecution() {
        console.log('📊 Benchmarking Query Execution...');
        
        const hierarchy = new HierarchyManager();
        const causality = new CausalReasoner();
        const fingerprint = new SemanticFingerprintV2();
        const multimodal = new MultiModalHandler({ ocrEnabled: false });
        
        // Add 500 messages
        for (let i = 0; i < 500; i++) {
            const msg = {
                id: `msg_${i}`,
                role: i % 2 === 0 ? 'user' : 'assistant',
                content: this.generateTestMessage(i),
                timestamp: Date.now() + i * 1000
            };
            
            hierarchy.addMessage(msg);
            causality.addMessage(msg);
        }
        
        const engine = new LLMQueryEngine(hierarchy, causality, fingerprint, multimodal);
        
        // Benchmark queries
        const queries = [
            'What did we discuss about REST API?',
            'Show me authentication examples',
            'Why did we choose React?',
            'What happened yesterday?',
            'Summarize our conversation'
        ];
        
        const times = [];
        
        for (const query of queries) {
            // Run each query 10 times
            for (let i = 0; i < 10; i++) {
                const start = performance.now();
                
                await engine.query(query);
                
                const end = performance.now();
                times.push(end - start);
            }
        }
        
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const p95 = this.percentile(times, 0.95);
        
        this.recordResult('Query Execution', {
            target: this.targets.queryExecution,
            average: avgTime,
            p95: p95,
            passed: avgTime <= this.targets.queryExecution
        });
        
        console.log(`  Avg: ${avgTime.toFixed(2)}ms (target: ${this.targets.queryExecution}ms)`);
        console.log(`  P95: ${p95.toFixed(2)}ms`);
        console.log('');
    }
    
    /**
     * Benchmark state reconstruction
     */
    async benchmarkStateReconstruction() {
        console.log('📊 Benchmarking State Reconstruction...');
        
        const engine = new DeltaEngine();
        
        // Create 50 versions
        let state = { messages: [], count: 0 };
        
        engine.saveState(state);
        
        for (let i = 0; i < 50; i++) {
            state.messages.push({
                id: `msg_${i}`,
                content: this.generateTestMessage(i)
            });
            state.count++;
            
            engine.saveState(state);
        }
        
        // Benchmark reconstruction
        const iterations = 20;
        const times = [];
        
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            
            engine.reconstructState(1, []);
            
            const end = performance.now();
            times.push(end - start);
        }
        
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const p95 = this.percentile(times, 0.95);
        
        this.recordResult('State Reconstruction', {
            target: this.targets.stateReconstruction,
            average: avgTime,
            p95: p95,
            passed: avgTime <= this.targets.stateReconstruction
        });
        
        console.log(`  Avg: ${avgTime.toFixed(2)}ms (target: ${this.targets.stateReconstruction}ms)`);
        console.log(`  P95: ${p95.toFixed(2)}ms`);
        console.log('');
    }
    
    /**
     * Generate test message
     */
    generateTestMessage(index) {
        const templates = [
            `How do I implement authentication in a REST API? I'm using Express.js and need JWT support.`,
            `Here's an example of JWT authentication: First install jsonwebtoken, then create middleware...`,
            `Why did we choose React over Vue for this project?`,
            `We chose React because it has better TypeScript support and a larger ecosystem.`,
            `Can you show me how to handle errors in async functions?`,
            `Error handling in async functions uses try-catch blocks. Here's an example...`,
            `What are the best practices for database migrations?`,
            `Best practices include: version control, backward compatibility, testing...`,
            `I'm getting a CORS error when calling my API from the frontend.`,
            `CORS errors occur when the server doesn't allow cross-origin requests. Add CORS middleware...`
        ];
        
        return templates[index % templates.length] + ` (message ${index})`;
    }
    
    /**
     * Calculate percentile
     */
    percentile(arr, p) {
        const sorted = arr.slice().sort((a, b) => a - b);
        const index = Math.ceil(sorted.length * p) - 1;
        return sorted[index];
    }
    
    /**
     * Record result
     */
    recordResult(name, data) {
        this.results.push({
            name: name,
            ...data
        });
    }
    
    /**
     * Print results summary
     */
    printResults() {
        console.log('\n' + '='.repeat(60));
        console.log('⚡ PERFORMANCE BENCHMARK RESULTS');
        console.log('='.repeat(60));
        
        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;
        
        console.log(`\nTests Passed: ${passed}/${total} (${Math.round(passed / total * 100)}%)\n`);
        
        for (const result of this.results) {
            const status = result.passed ? '✅' : '❌';
            console.log(`${status} ${result.name}`);
            
            if (result.average !== undefined) {
                console.log(`   Average: ${result.average.toFixed(2)}ms (target: ${result.target}ms)`);
            }
            
            if (result.actual !== undefined) {
                console.log(`   Actual: ${(result.actual * 100).toFixed(1)}% (target: ${result.target * 100}%)`);
            }
            
            if (result.p95 !== undefined) {
                console.log(`   P95: ${result.p95.toFixed(2)}ms`);
            }
            
            console.log('');
        }
        
        console.log('='.repeat(60));
    }
}

// Run benchmarks when page loads
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async () => {
        const benchmarks = new VOIDPerformanceBenchmarks();
        await benchmarks.runAll();
    });
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VOIDPerformanceBenchmarks;
}
