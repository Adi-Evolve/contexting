/**
 * Tests for DifferentialCompressor
 * Tests base + delta compression approach
 */

import { describe, it, assert } from './test-framework.js';
import { DifferentialCompressor } from '../src/core/compression/DifferentialCompressor.js';

describe('DifferentialCompressor', () => {
    let compressor;

    beforeEach(() => {
        compressor = new DifferentialCompressor();
    });

    // ===== Snapshot Creation Tests =====

    it('should create base snapshot', () => {
        const messages = [
            { id: 1, content: 'Message 1', timestamp: 1000 },
            { id: 2, content: 'Message 2', timestamp: 2000 }
        ];

        const snapshot = compressor.createSnapshot(messages);

        assert.truthy(snapshot, 'Should create snapshot');
        assert.truthy(snapshot.id, 'Should have snapshot ID');
        assert.equals(snapshot.count, 2, 'Should count messages');
    });

    it('should create snapshot every 100 messages', () => {
        for (let i = 0; i < 150; i++) {
            compressor.add({ id: i, content: `Message ${i}`, timestamp: 1000 + i });
        }

        const snapshots = compressor.getSnapshots();
        assert.truthy(snapshots.length >= 1, 'Should create snapshot at threshold');
    });

    it('should store snapshot metadata', () => {
        const messages = [{ id: 1, content: 'Test' }];
        const snapshot = compressor.createSnapshot(messages);

        assert.truthy(snapshot.timestamp, 'Should have timestamp');
        assert.truthy(snapshot.hash, 'Should have hash');
        assert.equals(snapshot.count, 1, 'Should have message count');
    });

    // ===== Delta Computation Tests =====

    it('should compute delta for new messages', () => {
        compressor.add({ id: 1, content: 'Base message', timestamp: 1000 });
        
        const delta = compressor.createDelta([
            { id: 1, content: 'Base message', timestamp: 1000 },
            { id: 2, content: 'New message', timestamp: 2000 }
        ]);

        assert.truthy(delta, 'Should create delta');
        assert.truthy(delta.added.length > 0, 'Should track added messages');
    });

    it('should compute delta for updated messages', () => {
        compressor.add({ id: 1, content: 'Original', timestamp: 1000 });

        const delta = compressor.createDelta([
            { id: 1, content: 'Updated', timestamp: 1000 }
        ]);

        assert.truthy(delta.updated.length > 0, 'Should track updates');
    });

    it('should compute delta for deleted messages', () => {
        compressor.add({ id: 1, content: 'To delete', timestamp: 1000 });
        compressor.add({ id: 2, content: 'Keep', timestamp: 2000 });

        const delta = compressor.createDelta([
            { id: 2, content: 'Keep', timestamp: 2000 }
        ]);

        assert.truthy(delta.deleted.length > 0, 'Should track deletions');
    });

    // ===== Reconstruction Tests =====

    it('should reconstruct from snapshot + deltas', () => {
        // Create base
        compressor.add({ id: 1, content: 'Message 1', timestamp: 1000 });
        compressor.add({ id: 2, content: 'Message 2', timestamp: 2000 });

        // Create snapshot
        const snapshot = compressor.createSnapshot(compressor.getAll());

        // Add more messages
        compressor.add({ id: 3, content: 'Message 3', timestamp: 3000 });

        // Reconstruct
        const reconstructed = compressor.reconstruct(snapshot.id);

        assert.truthy(reconstructed.length > 0, 'Should reconstruct messages');
    });

    it('should reconstruct accurately', () => {
        const original = [
            { id: 1, content: 'Test 1', timestamp: 1000 },
            { id: 2, content: 'Test 2', timestamp: 2000 }
        ];

        compressor.add(original[0]);
        compressor.add(original[1]);

        const snapshot = compressor.createSnapshot(compressor.getAll());
        const reconstructed = compressor.reconstruct(snapshot.id);

        assert.deepEquals(reconstructed, original, 'Reconstruction should match original');
    });

    // ===== Compression Ratio Tests =====

    it('should achieve >95% compression for incremental updates', () => {
        // Add 100 similar messages
        const base = 'Base content that repeats '.repeat(10);
        
        for (let i = 0; i < 100; i++) {
            compressor.add({ 
                id: i, 
                content: base + i, 
                timestamp: 1000 + i 
            });
        }

        const snapshot = compressor.createSnapshot(compressor.getAll());

        // Add one more message
        compressor.add({ id: 100, content: base + 100, timestamp: 101000 });

        const delta = compressor.createDelta(compressor.getAll());

        const snapshotSize = JSON.stringify(snapshot).length;
        const deltaSize = JSON.stringify(delta).length;
        const ratio = deltaSize / snapshotSize;

        assert.lessThan(ratio, 0.1, 'Delta should be <10% of snapshot size');
    });

    it('should compress similar messages efficiently', () => {
        const messages = Array(50).fill(0).map((_, i) => ({
            id: i,
            content: 'Repeated content with minor changes ' + (i % 5),
            timestamp: 1000 + i
        }));

        for (const msg of messages) {
            compressor.add(msg);
        }

        const stats = compressor.getStats();
        const compressionRatio = stats.compressionRatio;

        assert.greaterThan(compressionRatio, 0.8, 'Should achieve >80% compression');
    });

    // ===== Export Changes Tests =====

    it('should export changes since timestamp', () => {
        compressor.add({ id: 1, content: 'Old', timestamp: 1000 });
        compressor.add({ id: 2, content: 'Recent', timestamp: 5000 });

        const changes = compressor.exportChanges(3000);

        assert.truthy(changes.length > 0, 'Should export recent changes');
        assert.truthy(changes.some(c => c.id === 2), 'Should include recent message');
    });

    it('should export changes since snapshot', () => {
        compressor.add({ id: 1, content: 'Base', timestamp: 1000 });
        const snapshot = compressor.createSnapshot(compressor.getAll());

        compressor.add({ id: 2, content: 'After snapshot', timestamp: 2000 });

        const changes = compressor.exportChangesSince(snapshot.id);

        assert.lengthOf(changes, 1, 'Should export changes after snapshot');
        assert.equals(changes[0].id, 2, 'Should be correct message');
    });

    // ===== Performance Tests =====

    it('should create snapshot in <100ms', () => {
        const messages = Array(100).fill(0).map((_, i) => ({
            id: i,
            content: `Message ${i}`,
            timestamp: 1000 + i
        }));

        const startTime = performance.now();
        compressor.createSnapshot(messages);
        const duration = performance.now() - startTime;

        assert.lessThan(duration, 100, 'Snapshot creation should be <100ms');
    });

    it('should compute delta in <50ms', () => {
        for (let i = 0; i < 100; i++) {
            compressor.add({ id: i, content: `Message ${i}`, timestamp: 1000 + i });
        }

        const newMessages = Array(110).fill(0).map((_, i) => ({
            id: i,
            content: `Message ${i}`,
            timestamp: 1000 + i
        }));

        const startTime = performance.now();
        compressor.createDelta(newMessages);
        const duration = performance.now() - startTime;

        assert.lessThan(duration, 50, 'Delta computation should be <50ms');
    });

    it('should reconstruct in <100ms', () => {
        for (let i = 0; i < 100; i++) {
            compressor.add({ id: i, content: `Message ${i}`, timestamp: 1000 + i });
        }

        const snapshot = compressor.createSnapshot(compressor.getAll());

        const startTime = performance.now();
        compressor.reconstruct(snapshot.id);
        const duration = performance.now() - startTime;

        assert.lessThan(duration, 100, 'Reconstruction should be <100ms');
    });

    // ===== Sync Tests =====

    it('should enable fast sync between clients', () => {
        // Client A state
        compressor.add({ id: 1, content: 'Message 1', timestamp: 1000 });
        const snapshot = compressor.createSnapshot(compressor.getAll());

        // Client B adds message
        compressor.add({ id: 2, content: 'Message 2', timestamp: 2000 });

        // Create delta for sync
        const delta = compressor.createDelta(compressor.getAll());

        const deltaSize = JSON.stringify(delta).length;
        const fullSize = JSON.stringify(compressor.getAll()).length;
        const ratio = deltaSize / fullSize;

        assert.lessThan(ratio, 0.5, 'Sync delta should be <50% of full data');
    });

    // ===== Garbage Collection Tests =====

    it('should cleanup old snapshots', () => {
        // Create multiple snapshots
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 100; j++) {
                compressor.add({ 
                    id: i * 100 + j, 
                    content: `Message ${j}`, 
                    timestamp: 1000 + i * 100 + j 
                });
            }
        }

        const snapshots = compressor.getSnapshots();
        compressor.cleanupOldSnapshots(2); // Keep only 2 latest

        const remaining = compressor.getSnapshots();
        assert.truthy(remaining.length <= 2, 'Should cleanup old snapshots');
    });

    // ===== Edge Cases =====

    it('should handle empty messages', () => {
        const snapshot = compressor.createSnapshot([]);
        
        assert.truthy(snapshot, 'Should handle empty array');
        assert.equals(snapshot.count, 0, 'Should have zero count');
    });

    it('should handle duplicate messages', () => {
        compressor.add({ id: 1, content: 'Duplicate', timestamp: 1000 });
        compressor.add({ id: 1, content: 'Duplicate', timestamp: 1000 });

        const all = compressor.getAll();
        assert.equals(all.length, 1, 'Should handle duplicates');
    });

    it('should handle large messages', () => {
        const largeContent = 'a'.repeat(100000);
        compressor.add({ id: 1, content: largeContent, timestamp: 1000 });

        const snapshot = compressor.createSnapshot(compressor.getAll());
        
        assert.truthy(snapshot, 'Should handle large messages');
    });

    // ===== Statistics Tests =====

    it('should track statistics', () => {
        compressor.add({ id: 1, content: 'Test', timestamp: 1000 });
        
        const stats = compressor.getStats();

        assert.truthy(stats.messageCount, 'Should track message count');
        assert.truthy(stats.snapshotCount !== undefined, 'Should track snapshots');
        assert.truthy(stats.compressionRatio !== undefined, 'Should track compression');
    });

    // ===== Hash Verification Tests =====

    it('should verify data integrity with hashes', () => {
        const messages = [
            { id: 1, content: 'Message 1', timestamp: 1000 }
        ];

        const snapshot = compressor.createSnapshot(messages);
        
        assert.truthy(snapshot.hash, 'Should generate hash');
        
        const verified = compressor.verifySnapshot(snapshot.id);
        assert.truthy(verified, 'Should verify snapshot integrity');
    });
});
