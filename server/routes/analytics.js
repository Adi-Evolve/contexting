import express from 'express';
import { AnalyticsEngine } from '../services/analytics-engine.js';
import { memories } from './memories.js';

const router = express.Router();
const analyticsEngine = new AnalyticsEngine();

/**
 * Get analytics dashboard
 * GET /api/analytics
 */
router.get('/', async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;

    const memoryList = Array.from(memories.values());
    const analytics = analyticsEngine.generateDashboard(memoryList, timeRange);

    res.json({
      success: true,
      analytics: {
        overview: analytics.overview,
        timeline: analytics.timeline,
        topics: analytics.topics,
        entities: analytics.entities,
        sentiment: analytics.sentiment,
        compression: analytics.compression,
        knowledgeGraph: analytics.knowledgeGraph
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

/**
 * Get temporal patterns
 * GET /api/analytics/patterns
 */
router.get('/patterns', async (req, res) => {
  try {
    const { type = 'all' } = req.query;

    const memoryList = Array.from(memories.values());
    const patterns = analyticsEngine.detectPatterns(memoryList, type);

    res.json({
      success: true,
      patterns: {
        temporal: patterns.temporal,
        topical: patterns.topical,
        behavioral: patterns.behavioral,
        causal: patterns.causal
      }
    });
  } catch (error) {
    console.error('Get patterns error:', error);
    res.status(500).json({ error: 'Failed to detect patterns' });
  }
});

/**
 * Get insights
 * GET /api/analytics/insights
 */
router.get('/insights', async (req, res) => {
  try {
    const memoryList = Array.from(memories.values());
    const insights = analyticsEngine.generateInsights(memoryList);

    res.json({
      success: true,
      insights: {
        key: insights.key,
        trends: insights.trends,
        anomalies: insights.anomalies,
        recommendations: insights.recommendations
      }
    });
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

export default router;
