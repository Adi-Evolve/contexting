/**
 * Tests for TemporalGraph Algorithm
 * Tests 6 relationship types and temporal chains
 */

import { describe, it, assert } from './test-framework.js';
import { TemporalGraph } from '../src/core/intelligence/TemporalGraph.js';

describe('TemporalGraph', () => {
    let graph;

    // Reset graph before each test
    beforeEach(() => {
        graph = new TemporalGraph();
    });

    // ===== Node Management Tests =====

    it('should add nodes successfully', () => {
        const nodeId = graph.addNode({
            content: 'Test node',
            timestamp: Date.now()
        });

        assert.truthy(nodeId, 'Should return node ID');
        const node = graph.getNode(nodeId);
        assert.truthy(node, 'Should retrieve added node');
        assert.equals(node.content, 'Test node', 'Should store node data');
    });

    it('should store node metadata correctly', () => {
        const timestamp = Date.now();
        const nodeId = graph.addNode({
            content: 'Metadata test',
            timestamp,
            type: 'message',
            tags: ['test', 'metadata']
        });

        const node = graph.getNode(nodeId);
        assert.equals(node.timestamp, timestamp, 'Should store timestamp');
        assert.equals(node.type, 'message', 'Should store type');
        assert.deepEquals(node.tags, ['test', 'metadata'], 'Should store tags');
    });

    // ===== Edge/Relationship Tests =====

    it('should add UPDATES relationship', () => {
        const node1 = graph.addNode({ content: 'Version 1', timestamp: 1000 });
        const node2 = graph.addNode({ content: 'Version 2', timestamp: 2000 });

        graph.addEdge(node1, node2, 'UPDATES', 0.9);

        const edges = graph.getEdges(node1);
        assert.lengthOf(edges, 1, 'Should have one edge');
        assert.equals(edges[0].type, 'UPDATES', 'Should be UPDATES type');
        assert.equals(edges[0].target, node2, 'Should point to correct target');
    });

    it('should add EXTENDS relationship', () => {
        const node1 = graph.addNode({ content: 'Base concept' });
        const node2 = graph.addNode({ content: 'Extended concept' });

        graph.addEdge(node1, node2, 'EXTENDS', 0.8);

        const edges = graph.getEdges(node1);
        assert.equals(edges[0].type, 'EXTENDS', 'Should be EXTENDS type');
    });

    it('should add DERIVES relationship', () => {
        const node1 = graph.addNode({ content: 'Original idea' });
        const node2 = graph.addNode({ content: 'Derived conclusion' });

        graph.addEdge(node1, node2, 'DERIVES', 0.85);

        const edges = graph.getEdges(node1);
        assert.equals(edges[0].type, 'DERIVES', 'Should be DERIVES type');
    });

    it('should add CAUSES relationship', () => {
        const node1 = graph.addNode({ content: 'Action taken' });
        const node2 = graph.addNode({ content: 'Result observed' });

        graph.addEdge(node1, node2, 'CAUSES', 0.95);

        const edges = graph.getEdges(node1);
        assert.equals(edges[0].type, 'CAUSES', 'Should be CAUSES type');
    });

    it('should add CONTRADICTS relationship', () => {
        const node1 = graph.addNode({ content: 'Statement A' });
        const node2 = graph.addNode({ content: 'Opposite of A' });

        graph.addEdge(node1, node2, 'CONTRADICTS', 0.9);

        const edges = graph.getEdges(node1);
        assert.equals(edges[0].type, 'CONTRADICTS', 'Should be CONTRADICTS type');
    });

    it('should add SUPPORTS relationship', () => {
        const node1 = graph.addNode({ content: 'Evidence' });
        const node2 = graph.addNode({ content: 'Claim' });

        graph.addEdge(node1, node2, 'SUPPORTS', 0.85);

        const edges = graph.getEdges(node1);
        assert.equals(edges[0].type, 'SUPPORTS', 'Should be SUPPORTS type');
    });

    // ===== Relationship Finding Tests =====

    it('should find related nodes', () => {
        const node1 = graph.addNode({ content: 'Node 1' });
        const node2 = graph.addNode({ content: 'Node 2' });
        const node3 = graph.addNode({ content: 'Node 3' });

        graph.addEdge(node1, node2, 'UPDATES', 0.9);
        graph.addEdge(node1, node3, 'EXTENDS', 0.8);

        const related = graph.findRelated(node1);
        assert.lengthOf(related, 2, 'Should find 2 related nodes');
    });

    it('should filter by relationship type', () => {
        const node1 = graph.addNode({ content: 'Node 1' });
        const node2 = graph.addNode({ content: 'Node 2' });
        const node3 = graph.addNode({ content: 'Node 3' });

        graph.addEdge(node1, node2, 'UPDATES', 0.9);
        graph.addEdge(node1, node3, 'CAUSES', 0.85);

        const causes = graph.findRelated(node1, 'CAUSES');
        assert.lengthOf(causes, 1, 'Should find 1 CAUSES relationship');
        assert.equals(causes[0].id, node3, 'Should return correct node');
    });

    it('should filter by minimum strength', () => {
        const node1 = graph.addNode({ content: 'Node 1' });
        const node2 = graph.addNode({ content: 'Node 2' });
        const node3 = graph.addNode({ content: 'Node 3' });

        graph.addEdge(node1, node2, 'UPDATES', 0.9);
        graph.addEdge(node1, node3, 'UPDATES', 0.5);

        const strong = graph.findRelated(node1, null, 0.8);
        assert.lengthOf(strong, 1, 'Should find 1 strong relationship');
    });

    // ===== Temporal Chain Tests =====

    it('should build temporal chain', () => {
        const node1 = graph.addNode({ content: 'Event 1', timestamp: 1000 });
        const node2 = graph.addNode({ content: 'Event 2', timestamp: 2000 });
        const node3 = graph.addNode({ content: 'Event 3', timestamp: 3000 });

        graph.addEdge(node1, node2, 'CAUSES', 0.9);
        graph.addEdge(node2, node3, 'CAUSES', 0.85);

        const chain = graph.getTemporalChain(node1);
        assert.truthy(chain.length >= 2, 'Should have chain of at least 2');
    });

    it('should maintain temporal order', () => {
        const timestamps = [1000, 2000, 3000, 4000];
        const nodes = timestamps.map((ts, i) => 
            graph.addNode({ content: `Event ${i}`, timestamp: ts })
        );

        for (let i = 0; i < nodes.length - 1; i++) {
            graph.addEdge(nodes[i], nodes[i + 1], 'UPDATES', 0.9);
        }

        const chain = graph.getTemporalChain(nodes[0]);
        
        for (let i = 0; i < chain.length - 1; i++) {
            assert.truthy(
                chain[i].timestamp <= chain[i + 1].timestamp,
                'Chain should be in temporal order'
            );
        }
    });

    // ===== Path Finding Tests =====

    it('should find shortest path between nodes', () => {
        const node1 = graph.addNode({ content: 'Start' });
        const node2 = graph.addNode({ content: 'Middle' });
        const node3 = graph.addNode({ content: 'End' });

        graph.addEdge(node1, node2, 'UPDATES', 0.9);
        graph.addEdge(node2, node3, 'UPDATES', 0.85);

        const path = graph.findPath(node1, node3);
        assert.truthy(path, 'Should find path');
        assert.lengthOf(path, 3, 'Path should have 3 nodes');
        assert.equals(path[0], node1, 'Should start at node1');
        assert.equals(path[2], node3, 'Should end at node3');
    });

    it('should return null for disconnected nodes', () => {
        const node1 = graph.addNode({ content: 'Isolated 1' });
        const node2 = graph.addNode({ content: 'Isolated 2' });

        const path = graph.findPath(node1, node2);
        assert.falsy(path, 'Should return null for disconnected nodes');
    });

    // ===== Cycle Detection Tests =====

    it('should detect simple cycles', () => {
        const node1 = graph.addNode({ content: 'Node A' });
        const node2 = graph.addNode({ content: 'Node B' });
        const node3 = graph.addNode({ content: 'Node C' });

        graph.addEdge(node1, node2, 'UPDATES', 0.9);
        graph.addEdge(node2, node3, 'UPDATES', 0.9);
        graph.addEdge(node3, node1, 'UPDATES', 0.9);

        const hasCycle = graph.detectCycles();
        assert.truthy(hasCycle, 'Should detect cycle');
    });

    it('should not detect cycles in acyclic graph', () => {
        const node1 = graph.addNode({ content: 'Node A' });
        const node2 = graph.addNode({ content: 'Node B' });
        const node3 = graph.addNode({ content: 'Node C' });

        graph.addEdge(node1, node2, 'UPDATES', 0.9);
        graph.addEdge(node2, node3, 'UPDATES', 0.9);

        const hasCycle = graph.detectCycles();
        assert.falsy(hasCycle, 'Should not detect cycle in acyclic graph');
    });

    // ===== Auto-Connection Tests =====

    it('should auto-connect similar nodes', () => {
        graph.setAutoConnect(true, 0.7);

        const node1 = graph.addNode({ content: 'Machine learning algorithms' });
        const node2 = graph.addNode({ content: 'Machine learning models' });

        const edges = graph.getEdges(node1);
        assert.truthy(edges.length > 0, 'Should auto-connect similar nodes');
    });

    // ===== Edge Strength Decay Tests =====

    it('should apply time-based decay to edge strength', () => {
        const node1 = graph.addNode({ content: 'Old event', timestamp: Date.now() - 86400000 }); // 1 day ago
        const node2 = graph.addNode({ content: 'New event', timestamp: Date.now() });

        graph.addEdge(node1, node2, 'UPDATES', 1.0);

        const edges = graph.getEdges(node1);
        const strength = edges[0].strength;

        assert.lessThan(strength, 1.0, 'Edge strength should decay over time');
    });

    // ===== Performance Tests =====

    it('should handle large graphs efficiently', () => {
        const startTime = performance.now();

        const nodes = [];
        for (let i = 0; i < 1000; i++) {
            nodes.push(graph.addNode({ content: `Node ${i}`, timestamp: Date.now() + i }));
        }

        for (let i = 0; i < 999; i++) {
            graph.addEdge(nodes[i], nodes[i + 1], 'UPDATES', 0.9);
        }

        const duration = performance.now() - startTime;
        assert.lessThan(duration, 1000, 'Should handle 1000 nodes + edges in <1s');
    });

    it('should query large graphs quickly', () => {
        const nodes = [];
        for (let i = 0; i < 100; i++) {
            nodes.push(graph.addNode({ content: `Node ${i}` }));
        }

        for (let i = 0; i < 99; i++) {
            graph.addEdge(nodes[i], nodes[i + 1], 'UPDATES', 0.9);
        }

        const startTime = performance.now();
        graph.findRelated(nodes[0]);
        const duration = performance.now() - startTime;

        assert.lessThan(duration, 10, 'Querying should be <10ms');
    });

    // ===== Bidirectional Traversal Tests =====

    it('should support bidirectional traversal', () => {
        const node1 = graph.addNode({ content: 'Node A' });
        const node2 = graph.addNode({ content: 'Node B' });

        graph.addEdge(node1, node2, 'UPDATES', 0.9);

        const forward = graph.findRelated(node1);
        const backward = graph.findRelated(node2, null, 0, true); // reverse direction

        assert.truthy(forward.length > 0, 'Should find forward relationships');
        assert.truthy(backward.length > 0, 'Should find backward relationships');
    });

    // ===== Statistics Tests =====

    it('should calculate graph statistics', () => {
        const node1 = graph.addNode({ content: 'Node 1' });
        const node2 = graph.addNode({ content: 'Node 2' });
        const node3 = graph.addNode({ content: 'Node 3' });

        graph.addEdge(node1, node2, 'UPDATES', 0.9);
        graph.addEdge(node2, node3, 'CAUSES', 0.85);

        const stats = graph.getStats();

        assert.equals(stats.nodeCount, 3, 'Should count nodes correctly');
        assert.equals(stats.edgeCount, 2, 'Should count edges correctly');
        assert.truthy(stats.relationshipTypes, 'Should track relationship types');
    });

    // ===== Export/Import Tests =====

    it('should export graph structure', () => {
        const node1 = graph.addNode({ content: 'Node 1' });
        const node2 = graph.addNode({ content: 'Node 2' });
        graph.addEdge(node1, node2, 'UPDATES', 0.9);

        const exported = graph.export();

        assert.truthy(exported.nodes, 'Should export nodes');
        assert.truthy(exported.edges, 'Should export edges');
        assert.lengthOf(exported.nodes, 2, 'Should export all nodes');
        assert.lengthOf(exported.edges, 1, 'Should export all edges');
    });

    it('should import graph structure', () => {
        const data = {
            nodes: [
                { id: 'node1', content: 'Node 1', timestamp: 1000 },
                { id: 'node2', content: 'Node 2', timestamp: 2000 }
            ],
            edges: [
                { source: 'node1', target: 'node2', type: 'UPDATES', strength: 0.9 }
            ]
        };

        graph.import(data);

        const node1 = graph.getNode('node1');
        assert.truthy(node1, 'Should import nodes');
        
        const edges = graph.getEdges('node1');
        assert.lengthOf(edges, 1, 'Should import edges');
    });
});
