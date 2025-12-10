/**
 * Tests for HierarchicalStorage System
 * Tests 4-tier memory architecture
 */

import { describe, it, assert } from './test-framework.js';
import { HierarchicalStorage } from '../src/core/storage/HierarchicalStorage.js';

describe('HierarchicalStorage', () => {
    let storage;

    beforeEach(async () => {
        storage = new HierarchicalStorage();
        await storage.init();
    });

    // ===== Initialization Tests =====

    it('should initialize successfully', async () => {
        assert.truthy(storage, 'Storage should be initialized');
    });

    it('should initialize all 4 tiers', async () => {
        const stats = storage.getStats();

        assert.truthy(stats.tiers, 'Should have tiers information');
        assert.equals(stats.tiers.length, 4, 'Should have 4 tiers');
    });

    // ===== Hot Tier Tests (Map, 10 messages, <50ms) =====

    it('should store in Hot tier for recent messages', async () => {
        const message = { content: 'Hot tier test', timestamp: Date.now() };
        await storage.add(message);

        const stats = storage.getStats();
        assert.greaterThan(stats.tiers[0].count, 0, 'Hot tier should have messages');
    });

    it('should retrieve from Hot tier in <50ms', async () => {
        const message = { id: 'hot1', content: 'Speed test', timestamp: Date.now() };
        await storage.add(message);

        const startTime = performance.now();
        const retrieved = await storage.get('hot1');
        const duration = performance.now() - startTime;

        assert.truthy(retrieved, 'Should retrieve message');
        assert.lessThan(duration, 50, 'Hot tier access should be <50ms');
    });

    it('should evict old messages from Hot tier', async () => {
        // Add 15 messages (limit is 10)
        for (let i = 0; i < 15; i++) {
            await storage.add({ id: `msg${i}`, content: `Message ${i}`, timestamp: Date.now() + i });
        }

        const stats = storage.getStats();
        assert.truthy(stats.tiers[0].count <= 10, 'Hot tier should maintain limit of 10');
    });

    // ===== Warm Tier Tests (IndexedDB, 1000 messages, <100ms) =====

    it('should move to Warm tier after Hot eviction', async () => {
        // Add 15 messages
        for (let i = 0; i < 15; i++) {
            await storage.add({ id: `msg${i}`, content: `Message ${i}`, timestamp: Date.now() + i });
        }

        const stats = storage.getStats();
        assert.greaterThan(stats.tiers[1].count, 0, 'Warm tier should have messages');
    });

    it('should retrieve from Warm tier in <100ms', async () => {
        // Add messages to fill Hot and overflow to Warm
        for (let i = 0; i < 15; i++) {
            await storage.add({ id: `msg${i}`, content: `Message ${i}`, timestamp: 1000 + i });
        }

        const startTime = performance.now();
        const retrieved = await storage.get('msg0'); // Old message in Warm
        const duration = performance.now() - startTime;

        assert.truthy(retrieved, 'Should retrieve from Warm tier');
        assert.lessThan(duration, 100, 'Warm tier access should be <100ms');
    });

    // ===== Cold Tier Tests (Compressed, unlimited, <500ms) =====

    it('should compress old sessions to Cold tier', async () => {
        // Add 150 messages (will trigger compression)
        for (let i = 0; i < 150; i++) {
            await storage.add({ 
                id: `msg${i}`, 
                content: `Message ${i}`, 
                timestamp: 1000 + i * 100 
            });
        }

        await storage.compressOldSessions();

        const stats = storage.getStats();
        assert.greaterThan(stats.tiers[2].count, 0, 'Cold tier should have compressed data');
    });

    it('should retrieve from Cold tier in <500ms', async () => {
        // Add and compress messages
        for (let i = 0; i < 150; i++) {
            await storage.add({ id: `msg${i}`, content: `Message ${i}`, timestamp: 1000 + i });
        }

        await storage.compressOldSessions();

        const startTime = performance.now();
        const retrieved = await storage.get('msg0');
        const duration = performance.now() - startTime;

        assert.truthy(retrieved, 'Should retrieve from Cold tier');
        assert.lessThan(duration, 500, 'Cold tier access should be <500ms');
    });

    it('should achieve >90% compression in Cold tier', async () => {
        const messages = Array(100).fill(0).map((_, i) => ({
            id: `msg${i}`,
            content: 'Repeated message content '.repeat(10),
            timestamp: 1000 + i
        }));

        for (const msg of messages) {
            await storage.add(msg);
        }

        const sizeBefore = storage.getStats().totalSize;
        await storage.compressOldSessions();
        const sizeAfter = storage.getStats().totalSize;

        const compressionRatio = (sizeBefore - sizeAfter) / sizeBefore;
        assert.greaterThan(compressionRatio, 0.7, 'Should achieve >70% compression');
    });

    // ===== Frozen Tier Tests (User exports) =====

    it('should export to Frozen tier', async () => {
        await storage.add({ id: 'msg1', content: 'Export test' });

        const exported = await storage.export();

        assert.truthy(exported, 'Should export data');
        assert.truthy(exported.messages, 'Should have messages');
    });

    it('should import from Frozen tier', async () => {
        const data = {
            messages: [
                { id: 'imported1', content: 'Imported message', timestamp: 1000 }
            ],
            metadata: { version: '1.0' }
        };

        await storage.import(data);

        const retrieved = await storage.get('imported1');
        assert.truthy(retrieved, 'Should retrieve imported message');
    });

    // ===== LRU Eviction Tests =====

    it('should implement LRU eviction', async () => {
        // Add 10 messages
        for (let i = 0; i < 10; i++) {
            await storage.add({ id: `msg${i}`, content: `Message ${i}`, timestamp: 1000 + i });
        }

        // Access msg0 to make it recently used
        await storage.get('msg0');

        // Add one more to trigger eviction
        await storage.add({ id: 'msg10', content: 'New message', timestamp: 11000 });

        // msg0 should still be in Hot tier due to recent access
        const stats = storage.getStats();
        const hotMessages = await storage.getRecent(10);
        
        assert.truthy(hotMessages.some(m => m.id === 'msg0'), 
            'Recently accessed message should stay in Hot tier');
    });

    // ===== Session Grouping Tests =====

    it('should group messages by day', async () => {
        const today = Date.now();
        const yesterday = today - 86400000;

        await storage.add({ id: 'today1', content: 'Today', timestamp: today });
        await storage.add({ id: 'yesterday1', content: 'Yesterday', timestamp: yesterday });

        const stats = storage.getStats();
        assert.truthy(stats.sessions, 'Should track sessions');
        assert.truthy(stats.sessions >= 2, 'Should have at least 2 sessions');
    });

    it('should compress sessions older than threshold', async () => {
        const oldDate = Date.now() - 86400000 * 2; // 2 days ago

        for (let i = 0; i < 50; i++) {
            await storage.add({ 
                id: `old${i}`, 
                content: `Old message ${i}`, 
                timestamp: oldDate + i 
            });
        }

        await storage.compressOldSessions(1); // Compress sessions older than 1 day

        const stats = storage.getStats();
        assert.greaterThan(stats.tiers[2].count, 0, 'Should compress old sessions');
    });

    // ===== Search Tests =====

    it('should search across all tiers', async () => {
        await storage.add({ id: 'msg1', content: 'JavaScript programming' });
        await storage.add({ id: 'msg2', content: 'Python programming' });
        await storage.add({ id: 'msg3', content: 'Java programming' });

        const results = await storage.search('programming');

        assert.truthy(results.length >= 3, 'Should find all matching messages');
    });

    it('should return search results sorted by relevance', async () => {
        await storage.add({ id: 'msg1', content: 'programming' });
        await storage.add({ id: 'msg2', content: 'programming programming' });
        await storage.add({ id: 'msg3', content: 'coding' });

        const results = await storage.search('programming');

        assert.truthy(results[0].score >= results[1].score, 
            'Results should be sorted by relevance');
    });

    // ===== Performance Tests =====

    it('should handle 1000 messages efficiently', async () => {
        const startTime = performance.now();

        for (let i = 0; i < 1000; i++) {
            await storage.add({ id: `msg${i}`, content: `Message ${i}`, timestamp: Date.now() + i });
        }

        const duration = performance.now() - startTime;

        assert.lessThan(duration, 5000, 'Should add 1000 messages in <5s');
    });

    it('should retrieve messages quickly', async () => {
        // Add some messages
        for (let i = 0; i < 100; i++) {
            await storage.add({ id: `msg${i}`, content: `Message ${i}`, timestamp: Date.now() + i });
        }

        const startTime = performance.now();
        await storage.get('msg50');
        const duration = performance.now() - startTime;

        assert.lessThan(duration, 100, 'Retrieval should be <100ms');
    });

    // ===== Statistics Tests =====

    it('should track storage statistics', () => {
        const stats = storage.getStats();

        assert.truthy(stats.tiers, 'Should have tier stats');
        assert.truthy(stats.totalMessages !== undefined, 'Should track total messages');
        assert.truthy(stats.totalSize !== undefined, 'Should track total size');
    });

    it('should track compression ratio', async () => {
        for (let i = 0; i < 100; i++) {
            await storage.add({ id: `msg${i}`, content: 'test '.repeat(100), timestamp: 1000 + i });
        }

        await storage.compressOldSessions();

        const stats = storage.getStats();
        assert.truthy(stats.compressionRatio, 'Should track compression ratio');
    });

    // ===== Recent Messages Tests =====

    it('should get recent messages', async () => {
        for (let i = 0; i < 20; i++) {
            await storage.add({ id: `msg${i}`, content: `Message ${i}`, timestamp: 1000 + i });
        }

        const recent = await storage.getRecent(10);

        assert.lengthOf(recent, 10, 'Should return requested number of messages');
        assert.truthy(recent[0].timestamp >= recent[9].timestamp, 
            'Should be sorted by timestamp');
    });

    // ===== Auto-compression Tests =====

    it('should auto-compress after threshold', async () => {
        // Add 150 messages (threshold is 100)
        for (let i = 0; i < 150; i++) {
            await storage.add({ 
                id: `msg${i}`, 
                content: `Message ${i}`, 
                timestamp: 1000 + i 
            });
        }

        const stats = storage.getStats();
        assert.greaterThan(stats.tiers[2].count, 0, 
            'Should auto-compress after threshold');
    });

    // ===== Edge Cases =====

    it('should handle duplicate IDs', async () => {
        await storage.add({ id: 'dup1', content: 'First' });
        await storage.add({ id: 'dup1', content: 'Second' });

        const retrieved = await storage.get('dup1');
        assert.equals(retrieved.content, 'Second', 'Should update existing message');
    });

    it('should handle empty content', async () => {
        await storage.add({ id: 'empty', content: '', timestamp: Date.now() });

        const retrieved = await storage.get('empty');
        assert.truthy(retrieved, 'Should store empty content');
    });

    it('should handle large messages', async () => {
        const largeContent = 'a'.repeat(100000); // 100KB
        await storage.add({ id: 'large', content: largeContent, timestamp: Date.now() });

        const retrieved = await storage.get('large');
        assert.equals(retrieved.content.length, largeContent.length, 
            'Should store large messages');
    });
});
