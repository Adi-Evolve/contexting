import express from 'express';
import { CompressionEngine } from '../services/compression-engine.js';
import { memories } from './memories.js';

const router = express.Router();
const compressionEngine = new CompressionEngine();

/**
 * Get compression statistics
 * GET /api/compression/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const memoryList = Array.from(memories.values());
    
    const stats = compressionEngine.getCompressionStats(memoryList);

    res.json({
      success: true,
      stats: {
        totalMemories: stats.totalMemories,
        compressedMemories: stats.compressedMemories,
        compressionRatio: stats.compressionRatio,
        spaceSaved: stats.spaceSaved,
        byLevel: stats.byLevel,
        byMethod: stats.byMethod,
        timeline: stats.timeline
      }
    });
  } catch (error) {
    console.error('Get compression stats error:', error);
    res.status(500).json({ error: 'Failed to get compression statistics' });
  }
});

/**
 * Compress specific memories
 * POST /api/compression/compress
 */
router.post('/compress', async (req, res) => {
  try {
    const { memoryIds, level = 'auto', method = 'differential' } = req.body;

    if (!memoryIds || !Array.isArray(memoryIds)) {
      return res.status(400).json({ error: 'memoryIds array is required' });
    }

    const results = [];

    for (const id of memoryIds) {
      const memory = memories.get(id);
      if (!memory) {
        results.push({ id, success: false, error: 'Memory not found' });
        continue;
      }

      try {
        const compressed = await compressionEngine.compress(memory, { level, method });
        
        // Update memory with compressed version
        memory.compressed = true;
        memory.compressedContent = compressed.content;
        memory.compressionRatio = compressed.ratio;
        memory.compressionMethod = compressed.method;
        memory.compressionLevel = compressed.level;
        
        memories.set(id, memory);

        results.push({
          id,
          success: true,
          ratio: compressed.ratio,
          originalSize: compressed.originalSize,
          compressedSize: compressed.compressedSize,
          spaceSaved: compressed.spaceSaved
        });
      } catch (compError) {
        results.push({ id, success: false, error: compError.message });
      }
    }

    const successCount = results.filter(r => r.success).length;

    res.json({
      success: true,
      message: `Compressed ${successCount}/${memoryIds.length} memories`,
      results
    });
  } catch (error) {
    console.error('Compress memories error:', error);
    res.status(500).json({ error: 'Failed to compress memories' });
  }
});

/**
 * Decompress specific memories
 * POST /api/compression/decompress
 */
router.post('/decompress', async (req, res) => {
  try {
    const { memoryIds } = req.body;

    if (!memoryIds || !Array.isArray(memoryIds)) {
      return res.status(400).json({ error: 'memoryIds array is required' });
    }

    const results = [];

    for (const id of memoryIds) {
      const memory = memories.get(id);
      if (!memory) {
        results.push({ id, success: false, error: 'Memory not found' });
        continue;
      }

      if (!memory.compressed) {
        results.push({ id, success: false, error: 'Memory is not compressed' });
        continue;
      }

      try {
        const decompressed = await compressionEngine.decompress(memory);
        
        // Update memory with decompressed version
        memory.compressed = false;
        memory.content = decompressed.content;
        delete memory.compressedContent;
        delete memory.compressionRatio;
        delete memory.compressionMethod;
        delete memory.compressionLevel;
        
        memories.set(id, memory);

        results.push({
          id,
          success: true,
          restoredSize: decompressed.size
        });
      } catch (decompError) {
        results.push({ id, success: false, error: decompError.message });
      }
    }

    const successCount = results.filter(r => r.success).length;

    res.json({
      success: true,
      message: `Decompressed ${successCount}/${memoryIds.length} memories`,
      results
    });
  } catch (error) {
    console.error('Decompress memories error:', error);
    res.status(500).json({ error: 'Failed to decompress memories' });
  }
});

/**
 * Auto-compress old memories
 * POST /api/compression/auto-compress
 */
router.post('/auto-compress', async (req, res) => {
  try {
    const { olderThanDays = 30, minAccessCount = 5 } = req.body;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const memoryList = Array.from(memories.values());
    const candidates = memoryList.filter(m => 
      !m.compressed && 
      new Date(m.timestamp) < cutoffDate &&
      (m.accessCount || 0) < minAccessCount
    );

    const results = [];

    for (const memory of candidates) {
      try {
        const compressed = await compressionEngine.compress(memory, { level: 'auto', method: 'differential' });
        
        memory.compressed = true;
        memory.compressedContent = compressed.content;
        memory.compressionRatio = compressed.ratio;
        memory.compressionMethod = compressed.method;
        memory.compressionLevel = compressed.level;
        
        memories.set(memory.id, memory);

        results.push({
          id: memory.id,
          success: true,
          ratio: compressed.ratio
        });
      } catch (compError) {
        results.push({ id: memory.id, success: false, error: compError.message });
      }
    }

    res.json({
      success: true,
      message: `Auto-compressed ${results.filter(r => r.success).length} memories`,
      stats: {
        totalCandidates: candidates.length,
        compressed: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      },
      results: results.slice(0, 20) // Return first 20 for brevity
    });
  } catch (error) {
    console.error('Auto-compress error:', error);
    res.status(500).json({ error: 'Failed to auto-compress memories' });
  }
});

export default router;
