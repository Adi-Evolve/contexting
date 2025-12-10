import express from 'express';
import { SemanticEngine } from '../services/semantic-engine.js';

const router = express.Router();
const semanticEngine = new SemanticEngine();

// In-memory storage (replace with PostgreSQL in production)
const memories = new Map();

/**
 * Store a new memory
 * POST /api/memories
 */
router.post('/', async (req, res) => {
  try {
    const { role, content, context, timestamp } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Generate semantic fingerprint
    const fingerprint = semanticEngine.generateFingerprint(content);

    // Create memory object
    const memory = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: role || 'user',
      content,
      context: context || {},
      fingerprint,
      timestamp: timestamp || new Date().toISOString(),
      compressed: false,
      compressionRatio: 1.0,
      metadata: {
        wordCount: content.split(/\s+/).length,
        charCount: content.length,
        entities: semanticEngine.extractEntities(content),
        topics: semanticEngine.extractTopics(content),
        sentiment: semanticEngine.analyzeSentiment(content)
      }
    };

    memories.set(memory.id, memory);

    // Update knowledge graph
    await semanticEngine.addToKnowledgeGraph(memory);

    res.status(201).json({
      success: true,
      memory: {
        id: memory.id,
        role: memory.role,
        timestamp: memory.timestamp,
        metadata: memory.metadata
      },
      stats: {
        totalMemories: memories.size,
        compressed: memory.compressed,
        compressionRatio: memory.compressionRatio
      }
    });
  } catch (error) {
    console.error('Store memory error:', error);
    res.status(500).json({ error: 'Failed to store memory' });
  }
});

/**
 * Get all memories
 * GET /api/memories
 */
router.get('/', (req, res) => {
  try {
    const { limit = 100, offset = 0, role, sortBy = 'timestamp' } = req.query;

    let memoryList = Array.from(memories.values());

    // Filter by role
    if (role) {
      memoryList = memoryList.filter(m => m.role === role);
    }

    // Sort
    memoryList.sort((a, b) => {
      if (sortBy === 'timestamp') {
        return new Date(b.timestamp) - new Date(a.timestamp);
      }
      return 0;
    });

    // Paginate
    const total = memoryList.length;
    memoryList = memoryList.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      success: true,
      memories: memoryList.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        metadata: m.metadata
      })),
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total
      }
    });
  } catch (error) {
    console.error('Get memories error:', error);
    res.status(500).json({ error: 'Failed to retrieve memories' });
  }
});

/**
 * Get a single memory
 * GET /api/memories/:id
 */
router.get('/:id', (req, res) => {
  try {
    const memory = memories.get(req.params.id);

    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    res.json({
      success: true,
      memory
    });
  } catch (error) {
    console.error('Get memory error:', error);
    res.status(500).json({ error: 'Failed to retrieve memory' });
  }
});

/**
 * Delete a memory
 * DELETE /api/memories/:id
 */
router.delete('/:id', (req, res) => {
  try {
    const existed = memories.delete(req.params.id);

    if (!existed) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    res.json({
      success: true,
      message: 'Memory deleted successfully'
    });
  } catch (error) {
    console.error('Delete memory error:', error);
    res.status(500).json({ error: 'Failed to delete memory' });
  }
});

/**
 * Get memory stats
 * GET /api/memories/stats
 */
router.get('/stats/summary', (req, res) => {
  try {
    const memoryList = Array.from(memories.values());

    const stats = {
      total: memoryList.length,
      byRole: {},
      totalSize: 0,
      compressed: 0,
      averageCompressionRatio: 0,
      topTopics: {},
      topEntities: {}
    };

    memoryList.forEach(memory => {
      // Count by role
      stats.byRole[memory.role] = (stats.byRole[memory.role] || 0) + 1;

      // Size
      stats.totalSize += memory.metadata.charCount;

      // Compression
      if (memory.compressed) {
        stats.compressed++;
        stats.averageCompressionRatio += memory.compressionRatio;
      }

      // Topics
      memory.metadata.topics?.forEach(topic => {
        stats.topTopics[topic] = (stats.topTopics[topic] || 0) + 1;
      });

      // Entities
      memory.metadata.entities?.forEach(entity => {
        stats.topEntities[entity] = (stats.topEntities[entity] || 0) + 1;
      });
    });

    if (stats.compressed > 0) {
      stats.averageCompressionRatio /= stats.compressed;
    }

    // Sort top topics and entities
    stats.topTopics = Object.entries(stats.topTopics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {});

    stats.topEntities = Object.entries(stats.topEntities)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {});

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;
export { memories };
