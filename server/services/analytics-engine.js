/**
 * Analytics Engine - Memory insights and pattern detection
 * Provides dashboards, trends, and behavioral analysis
 */

export class AnalyticsEngine {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Generate analytics dashboard
   * @param {Array} memories - List of memories
   * @param {string} timeRange - Time range (7d, 30d, 90d, 1y, all)
   * @returns {Object} - Dashboard data
   */
  generateDashboard(memories, timeRange = '30d') {
    const cutoffDate = this.getCutoffDate(timeRange);
    const filtered = memories.filter(m => new Date(m.timestamp) >= cutoffDate);

    return {
      overview: this.getOverview(filtered),
      timeline: this.getTimeline(filtered),
      topics: this.getTopTopics(filtered, 10),
      entities: this.getTopEntities(filtered, 10),
      sentiment: this.getSentimentDistribution(filtered),
      compression: this.getCompressionMetrics(filtered),
      knowledgeGraph: this.getGraphMetrics(filtered)
    };
  }

  /**
   * Detect patterns in memories
   * @param {Array} memories - List of memories
   * @param {string} type - Pattern type (temporal, topical, behavioral, causal, all)
   * @returns {Object} - Detected patterns
   */
  detectPatterns(memories, type = 'all') {
    const patterns = {};

    if (type === 'temporal' || type === 'all') {
      patterns.temporal = this.detectTemporalPatterns(memories);
    }

    if (type === 'topical' || type === 'all') {
      patterns.topical = this.detectTopicalPatterns(memories);
    }

    if (type === 'behavioral' || type === 'all') {
      patterns.behavioral = this.detectBehavioralPatterns(memories);
    }

    if (type === 'causal' || type === 'all') {
      patterns.causal = this.detectCausalPatterns(memories);
    }

    return patterns;
  }

  /**
   * Generate insights
   * @param {Array} memories - List of memories
   * @returns {Object} - Insights
   */
  generateInsights(memories) {
    return {
      key: this.getKeyInsights(memories),
      trends: this.getTrends(memories),
      anomalies: this.detectAnomalies(memories),
      recommendations: this.getRecommendations(memories)
    };
  }

  // ==================== OVERVIEW METHODS ====================

  getOverview(memories) {
    const totalWords = memories.reduce((sum, m) => sum + (m.metadata?.wordCount || 0), 0);
    const totalChars = memories.reduce((sum, m) => sum + (m.metadata?.charCount || 0), 0);

    return {
      totalMemories: memories.length,
      totalWords,
      totalChars,
      averageWordsPerMemory: memories.length > 0 ? totalWords / memories.length : 0,
      roleDistribution: this.getRoleDistribution(memories),
      timespan: this.getTimespan(memories),
      growthRate: this.getGrowthRate(memories)
    };
  }

  getTimeline(memories) {
    // Group by day
    const byDay = new Map();
    
    memories.forEach(m => {
      const day = new Date(m.timestamp).toISOString().split('T')[0];
      if (!byDay.has(day)) {
        byDay.set(day, { count: 0, words: 0 });
      }
      const stats = byDay.get(day);
      stats.count++;
      stats.words += m.metadata?.wordCount || 0;
    });

    return Array.from(byDay.entries())
      .map(([day, stats]) => ({ day, ...stats }))
      .sort((a, b) => a.day.localeCompare(b.day));
  }

  getTopTopics(memories, limit = 10) {
    const topicCounts = new Map();
    
    memories.forEach(m => {
      m.metadata?.topics?.forEach(topic => {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      });
    });

    return Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([topic, count]) => ({ topic, count }));
  }

  getTopEntities(memories, limit = 10) {
    const entityCounts = new Map();
    
    memories.forEach(m => {
      m.metadata?.entities?.forEach(entity => {
        entityCounts.set(entity, (entityCounts.get(entity) || 0) + 1);
      });
    });

    return Array.from(entityCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([entity, count]) => ({ entity, count }));
  }

  getSentimentDistribution(memories) {
    const distribution = { positive: 0, neutral: 0, negative: 0 };
    const scores = [];

    memories.forEach(m => {
      const sentiment = m.metadata?.sentiment;
      if (sentiment) {
        distribution[sentiment.label]++;
        scores.push(sentiment.score);
      }
    });

    return {
      distribution,
      averageScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0.5,
      timeline: this.getSentimentTimeline(memories)
    };
  }

  getCompressionMetrics(memories) {
    const compressed = memories.filter(m => m.compressed);
    
    return {
      total: memories.length,
      compressed: compressed.length,
      compressionRate: memories.length > 0 ? compressed.length / memories.length : 0,
      averageRatio: compressed.length > 0 ? 
        compressed.reduce((sum, m) => sum + (m.compressionRatio || 1), 0) / compressed.length : 1
    };
  }

  getGraphMetrics(memories) {
    // Simplified graph metrics
    return {
      nodes: memories.length,
      estimatedEdges: Math.floor(memories.length * 1.5), // Rough estimate
      avgConnections: 1.5
    };
  }

  // ==================== PATTERN DETECTION ====================

  detectTemporalPatterns(memories) {
    const patterns = [];
    
    // Hour of day pattern
    const hourCounts = new Array(24).fill(0);
    memories.forEach(m => {
      const hour = new Date(m.timestamp).getHours();
      hourCounts[hour]++;
    });

    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
    patterns.push({
      type: 'peak-hour',
      hour: peakHour,
      count: hourCounts[peakHour]
    });

    // Day of week pattern
    const dayCounts = new Array(7).fill(0);
    memories.forEach(m => {
      const day = new Date(m.timestamp).getDay();
      dayCounts[day]++;
    });

    const peakDay = dayCounts.indexOf(Math.max(...dayCounts));
    patterns.push({
      type: 'peak-day',
      day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][peakDay],
      count: dayCounts[peakDay]
    });

    return patterns;
  }

  detectTopicalPatterns(memories) {
    const patterns = [];
    
    // Topic co-occurrence
    const coOccurrence = new Map();
    
    memories.forEach(m => {
      const topics = m.metadata?.topics || [];
      for (let i = 0; i < topics.length; i++) {
        for (let j = i + 1; j < topics.length; j++) {
          const pair = [topics[i], topics[j]].sort().join('::');
          coOccurrence.set(pair, (coOccurrence.get(pair) || 0) + 1);
        }
      }
    });

    const topPairs = Array.from(coOccurrence.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    topPairs.forEach(([pair, count]) => {
      const [topic1, topic2] = pair.split('::');
      patterns.push({
        type: 'topic-correlation',
        topic1,
        topic2,
        count
      });
    });

    return patterns;
  }

  detectBehavioralPatterns(memories) {
    const patterns = [];

    // Average session length
    const sessions = this.detectSessions(memories);
    const avgLength = sessions.length > 0 ?
      sessions.reduce((sum, s) => sum + s.length, 0) / sessions.length : 0;

    patterns.push({
      type: 'session-length',
      averageLength: avgLength,
      sessionCount: sessions.length
    });

    // Response patterns (user vs assistant)
    const userMems = memories.filter(m => m.role === 'user');
    const assistantMems = memories.filter(m => m.role === 'assistant');

    if (userMems.length > 0 && assistantMems.length > 0) {
      patterns.push({
        type: 'interaction-ratio',
        userMessages: userMems.length,
        assistantMessages: assistantMems.length,
        ratio: assistantMems.length / userMems.length
      });
    }

    return patterns;
  }

  detectCausalPatterns(memories) {
    const patterns = [];

    // Simple causal keywords detection
    const causalKeywords = ['because', 'therefore', 'thus', 'hence', 'so', 'result', 'cause'];
    
    const causalMemories = memories.filter(m => {
      const content = m.content.toLowerCase();
      return causalKeywords.some(kw => content.includes(kw));
    });

    if (causalMemories.length > 0) {
      patterns.push({
        type: 'causal-language-usage',
        count: causalMemories.length,
        percentage: (causalMemories.length / memories.length) * 100
      });
    }

    return patterns;
  }

  // ==================== INSIGHTS ====================

  getKeyInsights(memories) {
    const insights = [];

    // Most active period
    const timeline = this.getTimeline(memories);
    if (timeline.length > 0) {
      const mostActive = timeline.reduce((max, day) => day.count > max.count ? day : max);
      insights.push({
        type: 'most-active-day',
        message: `Most active on ${mostActive.day} with ${mostActive.count} memories`,
        date: mostActive.day,
        count: mostActive.count
      });
    }

    // Dominant topic
    const topics = this.getTopTopics(memories, 1);
    if (topics.length > 0) {
      insights.push({
        type: 'dominant-topic',
        message: `Primary focus: "${topics[0].topic}" (${topics[0].count} mentions)`,
        topic: topics[0].topic,
        count: topics[0].count
      });
    }

    // Sentiment trend
    const sentiment = this.getSentimentDistribution(memories);
    insights.push({
      type: 'overall-sentiment',
      message: `Overall sentiment: ${sentiment.averageScore > 0.6 ? 'Positive' : sentiment.averageScore < 0.4 ? 'Negative' : 'Neutral'}`,
      score: sentiment.averageScore
    });

    return insights;
  }

  getTrends(memories) {
    const trends = [];

    // Growth trend
    const growthRate = this.getGrowthRate(memories);
    trends.push({
      type: 'growth',
      direction: growthRate > 0 ? 'increasing' : 'decreasing',
      rate: Math.abs(growthRate)
    });

    return trends;
  }

  detectAnomalies(memories) {
    const anomalies = [];

    // Unusually long memories
    const avgLength = memories.reduce((sum, m) => sum + (m.metadata?.wordCount || 0), 0) / memories.length;
    const threshold = avgLength * 3;

    const longMemories = memories.filter(m => (m.metadata?.wordCount || 0) > threshold);
    
    if (longMemories.length > 0) {
      anomalies.push({
        type: 'unusually-long',
        count: longMemories.length,
        message: `${longMemories.length} unusually long memories detected`
      });
    }

    return anomalies;
  }

  getRecommendations(memories) {
    const recommendations = [];

    // Check compression opportunities
    const uncompressed = memories.filter(m => !m.compressed);
    if (uncompressed.length > 50) {
      recommendations.push({
        type: 'compression',
        priority: 'medium',
        message: `Consider compressing ${uncompressed.length} old memories to save space`
      });
    }

    // Check for gaps in timeline
    const gaps = this.detectTimelineGaps(memories);
    if (gaps.length > 0) {
      recommendations.push({
        type: 'timeline-gaps',
        priority: 'low',
        message: `${gaps.length} significant time gaps detected in your memory timeline`
      });
    }

    return recommendations;
  }

  // ==================== HELPER METHODS ====================

  getCutoffDate(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '1y': return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default: return new Date(0); // All time
    }
  }

  getRoleDistribution(memories) {
    const dist = {};
    memories.forEach(m => {
      dist[m.role] = (dist[m.role] || 0) + 1;
    });
    return dist;
  }

  getTimespan(memories) {
    if (memories.length === 0) return 0;
    
    const timestamps = memories.map(m => new Date(m.timestamp).getTime());
    return Math.max(...timestamps) - Math.min(...timestamps);
  }

  getGrowthRate(memories) {
    if (memories.length < 2) return 0;

    const sorted = memories.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const midpoint = Math.floor(sorted.length / 2);
    
    const firstHalf = sorted.slice(0, midpoint).length;
    const secondHalf = sorted.slice(midpoint).length;

    return (secondHalf - firstHalf) / firstHalf;
  }

  getSentimentTimeline(memories) {
    const byDay = new Map();
    
    memories.forEach(m => {
      const day = new Date(m.timestamp).toISOString().split('T')[0];
      if (!byDay.has(day)) {
        byDay.set(day, { scores: [], count: 0 });
      }
      const stats = byDay.get(day);
      stats.scores.push(m.metadata?.sentiment?.score || 0.5);
      stats.count++;
    });

    return Array.from(byDay.entries())
      .map(([day, stats]) => ({
        day,
        avgScore: stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length,
        count: stats.count
      }))
      .sort((a, b) => a.day.localeCompare(b.day));
  }

  detectSessions(memories) {
    const sessions = [];
    let currentSession = [];
    const sessionGapMs = 60 * 60 * 1000; // 1 hour

    const sorted = memories.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    sorted.forEach((m, i) => {
      if (i === 0) {
        currentSession.push(m);
      } else {
        const prevTime = new Date(sorted[i - 1].timestamp).getTime();
        const currTime = new Date(m.timestamp).getTime();
        
        if (currTime - prevTime > sessionGapMs) {
          sessions.push(currentSession);
          currentSession = [m];
        } else {
          currentSession.push(m);
        }
      }
    });

    if (currentSession.length > 0) {
      sessions.push(currentSession);
    }

    return sessions;
  }

  detectTimelineGaps(memories) {
    const gaps = [];
    const sorted = memories.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const gapThresholdMs = 7 * 24 * 60 * 60 * 1000; // 7 days

    for (let i = 1; i < sorted.length; i++) {
      const prevTime = new Date(sorted[i - 1].timestamp).getTime();
      const currTime = new Date(sorted[i].timestamp).getTime();
      const gap = currTime - prevTime;

      if (gap > gapThresholdMs) {
        gaps.push({
          start: sorted[i - 1].timestamp,
          end: sorted[i].timestamp,
          duration: gap
        });
      }
    }

    return gaps;
  }
}
