import express from 'express';
import { KnowledgeGraphEngine } from '../services/knowledge-graph-engine.js';

const router = express.Router();
const graphEngine = new KnowledgeGraphEngine();

/**
 * Get knowledge graph data
 * GET /api/knowledge-graph
 */
router.get('/', async (req, res) => {
  try {
    const { nodeLimit = 100, includeEdges = true, minScore = 0.3 } = req.query;

    const graph = graphEngine.getGraph({
      nodeLimit: parseInt(nodeLimit),
      includeEdges: includeEdges === 'true',
      minScore: parseFloat(minScore)
    });

    res.json({
      success: true,
      graph: {
        nodes: graph.nodes,
        edges: graph.edges,
        stats: {
          totalNodes: graph.nodes.length,
          totalEdges: graph.edges.length,
          nodeTypes: graph.nodeTypes,
          edgeTypes: graph.edgeTypes
        }
      }
    });
  } catch (error) {
    console.error('Get knowledge graph error:', error);
    res.status(500).json({ error: 'Failed to get knowledge graph' });
  }
});

/**
 * Get related nodes for a specific node
 * GET /api/knowledge-graph/related/:nodeId
 */
router.get('/related/:nodeId', async (req, res) => {
  try {
    const { depth = 1, limit = 20 } = req.query;

    const related = graphEngine.getRelatedNodes(req.params.nodeId, {
      depth: parseInt(depth),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      related
    });
  } catch (error) {
    console.error('Get related nodes error:', error);
    res.status(500).json({ error: 'Failed to get related nodes' });
  }
});

/**
 * Get temporal connections (time-based relationships)
 * GET /api/knowledge-graph/temporal
 */
router.get('/temporal', async (req, res) => {
  try {
    const { startDate, endDate, minScore = 0.3 } = req.query;

    const temporal = graphEngine.getTemporalConnections({
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      minScore: parseFloat(minScore)
    });

    res.json({
      success: true,
      temporal: {
        connections: temporal.connections,
        timeline: temporal.timeline,
        patterns: temporal.patterns
      }
    });
  } catch (error) {
    console.error('Get temporal connections error:', error);
    res.status(500).json({ error: 'Failed to get temporal connections' });
  }
});

/**
 * Get causal relationships
 * GET /api/knowledge-graph/causality
 */
router.get('/causality', async (req, res) => {
  try {
    const { nodeId, minConfidence = 0.5 } = req.query;

    const causality = graphEngine.getCausalRelationships({
      nodeId,
      minConfidence: parseFloat(minConfidence)
    });

    res.json({
      success: true,
      causality: {
        causes: causality.causes,
        effects: causality.effects,
        chains: causality.chains
      }
    });
  } catch (error) {
    console.error('Get causality error:', error);
    res.status(500).json({ error: 'Failed to get causal relationships' });
  }
});

/**
 * Get graph statistics
 * GET /api/knowledge-graph/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = graphEngine.getStatistics();

    res.json({
      success: true,
      stats: {
        nodes: stats.nodes,
        edges: stats.edges,
        density: stats.density,
        clustering: stats.clustering,
        centralNodes: stats.centralNodes,
        communities: stats.communities,
        temporalMetrics: stats.temporalMetrics
      }
    });
  } catch (error) {
    console.error('Get graph stats error:', error);
    res.status(500).json({ error: 'Failed to get graph statistics' });
  }
});

/**
 * Export knowledge graph
 * GET /api/knowledge-graph/export
 */
router.get('/export', async (req, res) => {
  try {
    const { format = 'json' } = req.query;

    const exported = graphEngine.exportGraph(format);

    res.setHeader('Content-Disposition', `attachment; filename=knowledge-graph.${format}`);
    res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/plain');
    
    res.send(exported);
  } catch (error) {
    console.error('Export graph error:', error);
    res.status(500).json({ error: 'Failed to export graph' });
  }
});

export default router;
