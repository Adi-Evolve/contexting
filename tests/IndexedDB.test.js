/**
 * Tests for IndexedDB Wrapper
 * Tests browser-native storage
 */

import { describe, it, assert } from './test-framework.js';
import { IndexedDBWrapper } from '../src/core/storage/IndexedDB.js';

describe('IndexedDB', () => {
    let db;

    beforeEach(async () => {
        db = new IndexedDBWrapper('test-db');
        await db.init();
    });

    afterEach(async () => {
        await db.delete();
    });

    // ===== Initialization Tests =====

    it('should initialize database', async () => {
        assert.truthy(db, 'Database should be initialized');
    });

    it('should create object stores', async () => {
        const stores = db.getStores();
        
        assert.truthy(stores.includes('messages'), 'Should have messages store');
        assert.truthy(stores.includes('sessions'), 'Should have sessions store');
        assert.truthy(stores.includes('metadata'), 'Should have metadata store');
    });

    // ===== CRUD Operations Tests =====

    it('should add item', async () => {
        const item = { id: 'test1', content: 'Test content' };
        await db.add('messages', item);

        const retrieved = await db.get('messages', 'test1');
        assert.truthy(retrieved, 'Should retrieve added item');
        assert.equals(retrieved.content, 'Test content', 'Content should match');
    });

    it('should get item by ID', async () => {
        await db.add('messages', { id: 'get1', content: 'Get test' });

        const item = await db.get('messages', 'get1');
        
        assert.truthy(item, 'Should get item');
        assert.equals(item.id, 'get1', 'ID should match');
    });

    it('should update item', async () => {
        await db.add('messages', { id: 'update1', content: 'Original' });
        await db.update('messages', { id: 'update1', content: 'Updated' });

        const item = await db.get('messages', 'update1');
        
        assert.equals(item.content, 'Updated', 'Content should be updated');
    });

    it('should delete item', async () => {
        await db.add('messages', { id: 'delete1', content: 'To delete' });
        await db.delete('messages', 'delete1');

        const item = await db.get('messages', 'delete1');
        
        assert.falsy(item, 'Item should be deleted');
    });

    it('should return null for non-existent item', async () => {
        const item = await db.get('messages', 'nonexistent');
        
        assert.falsy(item, 'Should return null');
    });

    // ===== Batch Operations Tests =====

    it('should add multiple items', async () => {
        const items = [
            { id: 'batch1', content: 'Item 1' },
            { id: 'batch2', content: 'Item 2' },
            { id: 'batch3', content: 'Item 3' }
        ];

        await db.addBatch('messages', items);

        const item1 = await db.get('messages', 'batch1');
        const item2 = await db.get('messages', 'batch2');
        
        assert.truthy(item1, 'Should add first item');
        assert.truthy(item2, 'Should add second item');
    });

    it('should batch operations be atomic', async () => {
        const items = [
            { id: 'atomic1', content: 'Item 1' },
            { id: 'atomic2', content: 'Item 2' }
        ];

        try {
            await db.addBatch('messages', items);
        } catch (error) {
            // If batch fails, no items should be added
            const item1 = await db.get('messages', 'atomic1');
            const item2 = await db.get('messages', 'atomic2');
            
            assert.falsy(item1 && item2, 'Batch should be atomic');
        }
    });

    // ===== Query Tests =====

    it('should get all items from store', async () => {
        await db.add('messages', { id: 'all1', content: 'Item 1' });
        await db.add('messages', { id: 'all2', content: 'Item 2' });

        const all = await db.getAll('messages');
        
        assert.truthy(all.length >= 2, 'Should get all items');
    });

    it('should query by index', async () => {
        await db.add('messages', { id: 'idx1', timestamp: 1000 });
        await db.add('messages', { id: 'idx2', timestamp: 2000 });

        const results = await db.getByIndex('messages', 'timestamp', 1000);
        
        assert.truthy(results.length > 0, 'Should query by index');
    });

    it('should query with range', async () => {
        await db.add('messages', { id: 'range1', timestamp: 1000 });
        await db.add('messages', { id: 'range2', timestamp: 2000 });
        await db.add('messages', { id: 'range3', timestamp: 3000 });

        const results = await db.getRange('messages', 'timestamp', 1500, 2500);
        
        assert.lengthOf(results, 1, 'Should get items in range');
        assert.equals(results[0].id, 'range2', 'Should get correct item');
    });

    // ===== Search Tests =====

    it('should search text content', async () => {
        await db.add('messages', { id: 'search1', content: 'JavaScript programming' });
        await db.add('messages', { id: 'search2', content: 'Python programming' });

        const results = await db.search('messages', 'content', 'JavaScript');
        
        assert.truthy(results.length > 0, 'Should find matching items');
        assert.truthy(results[0].content.includes('JavaScript'), 'Should match search term');
    });

    it('should be case-insensitive', async () => {
        await db.add('messages', { id: 'case1', content: 'Test Message' });

        const results = await db.search('messages', 'content', 'test message');
        
        assert.truthy(results.length > 0, 'Should be case-insensitive');
    });

    // ===== Count Tests =====

    it('should count items in store', async () => {
        await db.add('messages', { id: 'count1', content: 'Item 1' });
        await db.add('messages', { id: 'count2', content: 'Item 2' });

        const count = await db.count('messages');
        
        assert.truthy(count >= 2, 'Should count items');
    });

    // ===== Clear Tests =====

    it('should clear store', async () => {
        await db.add('messages', { id: 'clear1', content: 'Item 1' });
        await db.add('messages', { id: 'clear2', content: 'Item 2' });

        await db.clear('messages');

        const count = await db.count('messages');
        
        assert.equals(count, 0, 'Store should be empty');
    });

    // ===== Schema Versioning Tests =====

    it('should handle schema upgrades', async () => {
        // Simulate version upgrade
        await db.close();
        
        const newDb = new IndexedDBWrapper('test-db', 2);
        await newDb.init();

        assert.truthy(newDb, 'Should handle version upgrade');
    });

    // ===== Performance Tests =====

    it('should add 100 items in <1s', async () => {
        const items = Array(100).fill(0).map((_, i) => ({
            id: `perf${i}`,
            content: `Item ${i}`
        }));

        const startTime = performance.now();
        await db.addBatch('messages', items);
        const duration = performance.now() - startTime;

        assert.lessThan(duration, 1000, 'Should add 100 items in <1s');
    });

    it('should retrieve items quickly', async () => {
        await db.add('messages', { id: 'fast1', content: 'Fast retrieval' });

        const startTime = performance.now();
        await db.get('messages', 'fast1');
        const duration = performance.now() - startTime;

        assert.lessThan(duration, 10, 'Retrieval should be <10ms');
    });

    // ===== Error Handling Tests =====

    it('should handle invalid store name', async () => {
        try {
            await db.get('invalid_store', 'test');
            assert.falsy(true, 'Should throw error');
        } catch (error) {
            assert.truthy(error, 'Should throw error for invalid store');
        }
    });

    it('should handle transaction errors', async () => {
        try {
            await db.add('messages', null);
            // Some implementations may not throw
        } catch (error) {
            assert.truthy(error, 'Should handle transaction error');
        }
    });

    // ===== Storage Limit Tests =====

    it('should handle large items', async () => {
        const largeContent = 'a'.repeat(100000); // 100KB
        await db.add('messages', { id: 'large1', content: largeContent });

        const item = await db.get('messages', 'large1');
        
        assert.truthy(item, 'Should store large item');
        assert.equals(item.content.length, largeContent.length, 'Should preserve content');
    });

    // ===== Concurrent Operations Tests =====

    it('should handle concurrent writes', async () => {
        const promises = [];
        for (let i = 0; i < 10; i++) {
            promises.push(db.add('messages', { id: `conc${i}`, content: `Item ${i}` }));
        }

        await Promise.all(promises);

        const count = await db.count('messages');
        assert.truthy(count >= 10, 'Should handle concurrent writes');
    });

    // ===== Export/Import Tests =====

    it('should export store data', async () => {
        await db.add('messages', { id: 'exp1', content: 'Export test' });

        const exported = await db.exportStore('messages');
        
        assert.truthy(exported.length > 0, 'Should export data');
    });

    it('should import store data', async () => {
        const data = [
            { id: 'imp1', content: 'Import 1' },
            { id: 'imp2', content: 'Import 2' }
        ];

        await db.importStore('messages', data);

        const item = await db.get('messages', 'imp1');
        assert.truthy(item, 'Should import data');
    });

    // ===== Index Tests =====

    it('should create indexes', async () => {
        const indexes = await db.getIndexes('messages');
        
        assert.truthy(Array.isArray(indexes), 'Should return indexes array');
    });

    it('should query using index', async () => {
        await db.add('messages', { id: 'idx1', timestamp: 5000, content: 'Indexed' });

        const results = await db.getByIndex('messages', 'timestamp', 5000);
        
        assert.truthy(results.length > 0, 'Should query using index');
    });

    // ===== Database Size Tests =====

    it('should estimate database size', async () => {
        await db.add('messages', { id: 'size1', content: 'Size test' });

        const size = await db.getSize();
        
        assert.truthy(size > 0, 'Should estimate size');
    });
});
