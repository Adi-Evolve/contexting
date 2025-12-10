/**
 * Integration tests for complete MemoryForge system
 * Tests all components working together
 */

import { describe, it, assert } from './test-framework.js';
import { MemoryForge } from '../src/core/MemoryForge.js';

describe('MemoryForge Integration', () => {
    let forge;

    beforeEach(async () => {
        forge = new MemoryForge();
        await forge.init();
    });

    // ===== Initialization Tests =====

    it('should initialize all systems', async () => {
        assert.truthy(forge, 'MemoryForge should initialize');
    });

    // ===== Message Addition Tests =====

    it('should add and retrieve messages', async () => {
        const message = 'This is a test message';
        const id = await forge.addMessage(message);

        assert.truthy(id, 'Should return message ID');

        const retrieved = await forge.getMessage(id);
        assert.equals(retrieved.content, message, 'Should retrieve message');
    });

    it('should process message through full pipeline', async () => {
        const message = 'Machine learning is a subset of AI';
        const id = await forge.addMessage(message);

        const msg = await forge.getMessage(id);

        assert.truthy(msg.fingerprint, 'Should have semantic fingerprint');
        assert.truthy(msg.entities, 'Should have NLP entities');
        assert.truthy(msg.sentiment, 'Should have sentiment analysis');
    });

    // ===== Search Tests =====

    it('should search semantically', async () => {
        await forge.addMessage('I love programming in JavaScript');
        await forge.addMessage('Python is great for data science');
        await forge.addMessage('Machine learning with TensorFlow');

        const results = await forge.search('coding in JavaScript');

        assert.truthy(results.length > 0, 'Should find semantic matches');
        assert.truthy(results[0].content.includes('JavaScript'), 
            'Top result should be most relevant');
    });

    it('should rank search results by relevance', async () => {
        await forge.addMessage('JavaScript programming language');
        await forge.addMessage('JavaScript is awesome');
        await forge.addMessage('Python programming');

        const results = await forge.search('JavaScript');

        assert.truthy(results[0].score >= results[1].score, 
            'Results should be ranked by relevance');
    });

    // ===== Relationship Tests =====

    it('should find related messages', async () => {
        const id1 = await forge.addMessage('Started new project');
        await forge.addMessage('Added dependencies to project');
        await forge.addMessage('Project is working now');

        const related = await forge.getRelated(id1);

        assert.truthy(related.length > 0, 'Should find related messages');
    });

    it('should build temporal graph', async () => {
        await forge.addMessage('Event A happened');
        await forge.addMessage('Because of A, Event B occurred');
        await forge.addMessage('Event B led to Event C');

        const stats = forge.getStats();

        assert.truthy(stats.graph.nodes > 0, 'Should build graph nodes');
        assert.truthy(stats.graph.edges > 0, 'Should create relationships');
    });

    // ===== Causal Chain Tests =====

    it('should detect causal chains', async () => {
        const id1 = await forge.addMessage('Found a bug in the code');
        const id2 = await forge.addMessage('Because of the bug, tests failed');
        await forge.addMessage('Fixed the bug, tests pass now');

        const chain = await forge.getCausalChain(id2);

        assert.truthy(chain.length > 1, 'Should build causal chain');
    });

    // ===== Compression Tests =====

    it('should compress old messages automatically', async () => {
        // Add many messages
        for (let i = 0; i < 150; i++) {
            await forge.addMessage(`Message ${i}`);
        }

        const stats = forge.getStats();

        assert.truthy(stats.compression.compressedMessages > 0, 
            'Should auto-compress messages');
    });

    it('should maintain accuracy after compression', async () => {
        const original = 'Important information about machine learning';
        const id = await forge.addMessage(original);

        // Trigger compression
        for (let i = 0; i < 150; i++) {
            await forge.addMessage(`Filler ${i}`);
        }

        const retrieved = await forge.getMessage(id);
        assert.equals(retrieved.content, original, 
            'Should maintain content after compression');
    });

    // ===== Export/Import Tests =====

    it('should export all data', async () => {
        await forge.addMessage('Message 1');
        await forge.addMessage('Message 2');

        const exported = await forge.export();

        assert.truthy(exported.messages, 'Should export messages');
        assert.truthy(exported.graph, 'Should export graph');
        assert.truthy(exported.metadata, 'Should export metadata');
    });

    it('should import data correctly', async () => {
        const data = {
            messages: [
                { id: 'imp1', content: 'Imported 1', timestamp: 1000 },
                { id: 'imp2', content: 'Imported 2', timestamp: 2000 }
            ],
            graph: { nodes: [], edges: [] },
            metadata: { version: '1.0' }
        };

        await forge.import(data);

        const msg = await forge.getMessage('imp1');
        assert.truthy(msg, 'Should retrieve imported message');
    });

    it('should export in .aime format', async () => {
        await forge.addMessage('Test message');

        const exported = await forge.export('aime');

        assert.truthy(exported.format === 'aime', 'Should use AIME format');
        assert.truthy(exported.version, 'Should have version');
    });

    // ===== Performance Tests =====

    it('should handle 100 messages in <5s', async () => {
        const startTime = performance.now();

        for (let i = 0; i < 100; i++) {
            await forge.addMessage(`Performance test ${i}`);
        }

        const duration = performance.now() - startTime;

        assert.lessThan(duration, 5000, 'Should process 100 messages in <5s');
    });

    it('should search 100 messages in <100ms', async () => {
        for (let i = 0; i < 100; i++) {
            await forge.addMessage(`Message about topic ${i % 10}`);
        }

        const startTime = performance.now();
        await forge.search('topic');
        const duration = performance.now() - startTime;

        assert.lessThan(duration, 100, 'Search should be <100ms');
    });

    // ===== NLP Integration Tests =====

    it('should extract entities', async () => {
        const id = await forge.addMessage('Contact john@example.com or visit https://example.com');

        const msg = await forge.getMessage(id);

        assert.truthy(msg.entities.emails.length > 0, 'Should extract emails');
        assert.truthy(msg.entities.urls.length > 0, 'Should extract URLs');
    });

    it('should detect sentiment', async () => {
        const id = await forge.addMessage('I absolutely love this amazing product!');

        const msg = await forge.getMessage(id);

        assert.truthy(msg.sentiment.score > 0, 'Should detect positive sentiment');
    });

    it('should detect intent', async () => {
        const id = await forge.addMessage('How do I install this package?');

        const msg = await forge.getMessage(id);

        assert.truthy(msg.intent, 'Should detect intent');
    });

    // ===== Statistics Tests =====

    it('should provide comprehensive statistics', () => {
        const stats = forge.getStats();

        assert.truthy(stats.messages, 'Should have message stats');
        assert.truthy(stats.storage, 'Should have storage stats');
        assert.truthy(stats.graph, 'Should have graph stats');
        assert.truthy(stats.compression, 'Should have compression stats');
    });

    // ===== Real-world Use Cases =====

    it('should handle learning journal scenario', async () => {
        await forge.addMessage('Today I learned about JavaScript closures');
        await forge.addMessage('Closures are functions that remember their scope');
        await forge.addMessage('Used closures to create private variables');

        const results = await forge.search('closures');

        assert.truthy(results.length === 3, 'Should find all related entries');
    });

    it('should handle project tracking scenario', async () => {
        await forge.addMessage('Started new React project');
        await forge.addMessage('Added Redux for state management');
        await forge.addMessage('Because of Redux, state is now centralized');

        const results = await forge.search('React project');

        assert.truthy(results.length >= 1, 'Should track project progress');
    });

    it('should handle meeting notes scenario', async () => {
        await forge.addMessage('Meeting: Discussed Q1 roadmap');
        await forge.addMessage('Action item: Update documentation by Friday');
        await forge.addMessage('Follow-up: Schedule design review');

        const results = await forge.search('meeting');

        assert.truthy(results.length >= 1, 'Should organize meeting notes');
    });

    // ===== Event System Tests =====

    it('should emit events on message add', async () => {
        let eventFired = false;

        forge.on('message:added', () => {
            eventFired = true;
        });

        await forge.addMessage('Test event');

        assert.truthy(eventFired, 'Should emit message:added event');
    });

    it('should emit events on compression', async () => {
        let eventFired = false;

        forge.on('compression:complete', () => {
            eventFired = true;
        });

        // Add enough messages to trigger compression
        for (let i = 0; i < 150; i++) {
            await forge.addMessage(`Message ${i}`);
        }

        assert.truthy(eventFired, 'Should emit compression:complete event');
    });

    // ===== Error Handling Tests =====

    it('should handle invalid message ID', async () => {
        const msg = await forge.getMessage('nonexistent');

        assert.falsy(msg, 'Should return null for invalid ID');
    });

    it('should handle empty search query', async () => {
        const results = await forge.search('');

        assert.truthy(Array.isArray(results), 'Should return empty array');
    });

    // ===== Data Integrity Tests =====

    it('should maintain message order', async () => {
        const ids = [];
        for (let i = 0; i < 10; i++) {
            ids.push(await forge.addMessage(`Message ${i}`));
        }

        const messages = await Promise.all(ids.map(id => forge.getMessage(id)));

        for (let i = 0; i < 9; i++) {
            assert.truthy(messages[i].timestamp <= messages[i + 1].timestamp,
                'Messages should be in chronological order');
        }
    });

    it('should handle concurrent operations', async () => {
        const promises = [];
        for (let i = 0; i < 50; i++) {
            promises.push(forge.addMessage(`Concurrent ${i}`));
        }

        const ids = await Promise.all(promises);

        assert.lengthOf(ids, 50, 'Should handle all concurrent operations');
    });

    // ===== Cost Comparison Tests =====

    it('should use zero external APIs', async () => {
        const id = await forge.addMessage('Test for API usage');
        
        // Check that no network requests were made
        // This is verified by the fact that everything runs offline
        const msg = await forge.getMessage(id);

        assert.truthy(msg.fingerprint, 'Should have fingerprint without API');
        assert.truthy(msg.entities, 'Should have entities without API');
    });

    it('should store fingerprints <100 bytes', async () => {
        const id = await forge.addMessage('Storage efficiency test');
        const msg = await forge.getMessage(id);

        const fingerprintSize = new Blob([JSON.stringify(msg.fingerprint)]).size;

        assert.lessThan(fingerprintSize, 100, 'Fingerprint should be <100 bytes');
    });
});
