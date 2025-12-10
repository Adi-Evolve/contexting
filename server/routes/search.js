import express from 'express';
import { SemanticEngine } from '../services/semantic-engine.js';
import { memories } from './memories.js';

const router = express.Router();
const semanticEngine = new SemanticEngine();

/**
 * Semantic search across memories
 * POST /api/search
 */
router.post('/', async (req, res) => {
  try {
    const { query, limit = 20, minScore = 0.3, filters = {} } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Generate query fingerprint
    const queryFingerprint = semanticEngine.generateFingerprint(query);

    // Get all memories
    let memoryList = Array.from(memories.values());

    // Apply filters
    if (filters.role) {
      memoryList = memoryList.filter(m => m.role === filters.role);
    }
    if (filters.startDate) {
      memoryList = memoryList.filter(m => new Date(m.timestamp) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      memoryList = memoryList.filter(m => new Date(m.timestamp) <= new Date(filters.endDate));
    }
    if (filters.topics && filters.topics.length > 0) {
      memoryList = memoryList.filter(m => 
        m.metadata.topics?.some(t => filters.topics.includes(t))
      );
    }

    // Calculate similarity scores
    const results = memoryList.map(memory => {
      const score = semanticEngine.calculateSimilarity(queryFingerprint, memory.fingerprint);
      return {
        memory,
        score
      };
    })
    .filter(r => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

    res.json({
      success: true,
      query,
      results: results.map(r => ({
        id: r.memory.id,
        role: r.memory.role,
        content: r.memory.content,
        timestamp: r.memory.timestamp,
        score: r.score,
        metadata: r.memory.metadata
      })),
      stats: {
        totalSearched: memoryList.length,
        resultsFound: results.length,
        avgScore: results.length > 0 ? results.reduce((sum, r) => sum + r.score, 0) / results.length : 0
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

/**
 * Get search suggestions
 * GET /api/search/suggestions
 */
router.get('/suggestions', async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const suggestions = semanticEngine.getSuggestions(query, {
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      query,
      suggestions
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

/**
 * Get related memories
 * GET /api/search/related/:memoryId
 */
router.get('/related/:memoryId', async (req, res) => {
  try {
    const { limit = 10, minScore = 0.3 } = req.query;

    const memory = memories.get(req.params.memoryId);
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    const memoryList = Array.from(memories.values())
      .filter(m => m.id !== req.params.memoryId);

    const related = memoryList.map(m => ({
      memory: m,
      score: semanticEngine.calculateSimilarity(memory.fingerprint, m.fingerprint)
    }))
    .filter(r => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, parseInt(limit));

    res.json({
      success: true,
      memoryId: req.params.memoryId,
      related: related.map(r => ({
        id: r.memory.id,
        role: r.memory.role,
        content: r.memory.content,
        timestamp: r.memory.timestamp,
        score: r.score
      }))
    });
  } catch (error) {
    console.error('Get related error:', error);
    res.status(500).json({ error: 'Failed to get related memories' });
  }
});

export default router;
