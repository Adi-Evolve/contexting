/**
 * Compression Engine - Multi-level memory compression
 * Implements differential and semantic compression algorithms
 */

export class CompressionEngine {
  constructor() {
    this.compressionCache = new Map();
  }

  /**
   * Compress a memory
   * @param {Object} memory - Memory to compress
   * @param {Object} options - Compression options
   * @returns {Object} - Compression result
   */
  async compress(memory, options = {}) {
    const { level = 'auto', method = 'differential' } = options;

    const originalSize = new Blob([memory.content]).size;

    let compressed;
    if (method === 'differential') {
      compressed = this.differentialCompress(memory);
    } else if (method === 'semantic') {
      compressed = this.semanticCompress(memory);
    } else {
      // Auto-select best method
      const diff = this.differentialCompress(memory);
      const sem = this.semanticCompress(memory);
      compressed = diff.size < sem.size ? diff : sem;
    }

    const compressedSize = new Blob([compressed.content]).size;
    const ratio = compressedSize / originalSize;

    return {
      content: compressed.content,
      method: compressed.method,
      level: level,
      originalSize,
      compressedSize,
      ratio,
      spaceSaved: originalSize - compressedSize,
      metadata: compressed.metadata
    };
  }

  /**
   * Decompress a memory
   * @param {Object} memory - Compressed memory
   * @returns {Object} - Decompression result
   */
  async decompress(memory) {
    if (!memory.compressed || !memory.compressedContent) {
      throw new Error('Memory is not compressed');
    }

    let decompressed;
    if (memory.compressionMethod === 'differential') {
      decompressed = this.differentialDecompress(memory);
    } else if (memory.compressionMethod === 'semantic') {
      decompressed = this.semanticDecompress(memory);
    } else {
      throw new Error(`Unknown compression method: ${memory.compressionMethod}`);
    }

    return {
      content: decompressed.content,
      size: new Blob([decompressed.content]).size
    };
  }

  /**
   * Get compression statistics
   * @param {Array} memories - List of memories
   * @returns {Object} - Compression stats
   */
  getCompressionStats(memories) {
    const stats = {
      totalMemories: memories.length,
      compressedMemories: 0,
      uncompressedMemories: 0,
      totalOriginalSize: 0,
      totalCompressedSize: 0,
      compressionRatio: 0,
      spaceSaved: 0,
      byLevel: {},
      byMethod: {},
      timeline: []
    };

    memories.forEach(memory => {
      const size = new Blob([memory.content]).size;
      stats.totalOriginalSize += size;

      if (memory.compressed) {
        stats.compressedMemories++;
        
        const compSize = memory.compressedContent ? 
          new Blob([memory.compressedContent]).size : size * (memory.compressionRatio || 1);
        
        stats.totalCompressedSize += compSize;

        // By level
        const level = memory.compressionLevel || 'unknown';
        if (!stats.byLevel[level]) {
          stats.byLevel[level] = { count: 0, saved: 0 };
        }
        stats.byLevel[level].count++;
        stats.byLevel[level].saved += size - compSize;

        // By method
        const method = memory.compressionMethod || 'unknown';
        if (!stats.byMethod[method]) {
          stats.byMethod[method] = { count: 0, saved: 0 };
        }
        stats.byMethod[method].count++;
        stats.byMethod[method].saved += size - compSize;

        // Timeline
        stats.timeline.push({
          timestamp: memory.timestamp,
          saved: size - compSize,
          ratio: memory.compressionRatio
        });
      } else {
        stats.uncompressedMemories++;
        stats.totalCompressedSize += size;
      }
    });

    stats.compressionRatio = stats.totalOriginalSize > 0 ? 
      stats.totalCompressedSize / stats.totalOriginalSize : 1;
    
    stats.spaceSaved = stats.totalOriginalSize - stats.totalCompressedSize;

    return stats;
  }

  // ==================== COMPRESSION METHODS ====================

  /**
   * Differential compression - removes redundancies
   * @param {Object} memory - Memory to compress
   * @returns {Object} - Compressed result
   */
  differentialCompress(memory) {
    const content = memory.content;
    
    // Extract common patterns and replace with tokens
    const patterns = this.extractPatterns(content);
    let compressed = content;
    let tokenMap = {};

    patterns.forEach((pattern, index) => {
      if (pattern.length > 10 && pattern.count > 1) {
        const token = `<T${index}>`;
        compressed = compressed.split(pattern.text).join(token);
        tokenMap[token] = pattern.text;
      }
    });

    // Remove extra whitespace
    compressed = compressed.replace(/\s+/g, ' ').trim();

    return {
      content: JSON.stringify({ compressed, tokenMap }),
      method: 'differential',
      metadata: {
        patternsFound: patterns.length,
        tokensUsed: Object.keys(tokenMap).length
      }
    };
  }

  /**
   * Differential decompression
   * @param {Object} memory - Compressed memory
   * @returns {Object} - Decompressed result
   */
  differentialDecompress(memory) {
    try {
      const { compressed, tokenMap } = JSON.parse(memory.compressedContent);
      
      let decompressed = compressed;
      Object.entries(tokenMap).forEach(([token, original]) => {
        decompressed = decompressed.split(token).join(original);
      });

      return { content: decompressed };
    } catch (error) {
      throw new Error('Failed to decompress: Invalid format');
    }
  }

  /**
   * Semantic compression - keeps semantic meaning, removes details
   * @param {Object} memory - Memory to compress
   * @returns {Object} - Compressed result
   */
  semanticCompress(memory) {
    const content = memory.content;
    
    // Extract key sentences (simple heuristic: keep shorter sentences and those with key terms)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const keyTerms = new Set(['important', 'key', 'main', 'critical', 'essential', 'must', 'need', 'should']);
    
    const compressed = sentences
      .filter(s => {
        const words = s.trim().split(/\s+/);
        // Keep if short OR contains key terms
        return words.length < 15 || words.some(w => keyTerms.has(w.toLowerCase()));
      })
      .join('. ') + '.';

    return {
      content: compressed,
      method: 'semantic',
      metadata: {
        originalSentences: sentences.length,
        compressedSentences: compressed.split(/[.!?]+/).length,
        preservationRatio: compressed.length / content.length
      }
    };
  }

  /**
   * Semantic decompression
   * @param {Object} memory - Compressed memory
   * @returns {Object} - Decompressed result
   */
  semanticDecompress(memory) {
    // Semantic compression is lossy, so we just return the compressed content
    return {
      content: memory.compressedContent + ' [Lossy compression: some details removed]'
    };
  }

  // ==================== HELPER METHODS ====================

  /**
   * Extract repeated patterns from text
   * @param {string} text - Input text
   * @returns {Array} - List of patterns
   */
  extractPatterns(text) {
    const patterns = [];
    const words = text.split(/\s+/);
    
    // Find repeated sequences of 3+ words
    for (let len = 3; len <= Math.min(10, words.length); len++) {
      const sequences = new Map();
      
      for (let i = 0; i <= words.length - len; i++) {
        const seq = words.slice(i, i + len).join(' ');
        sequences.set(seq, (sequences.get(seq) || 0) + 1);
      }

      sequences.forEach((count, seq) => {
        if (count > 1) {
          patterns.push({
            text: seq,
            length: seq.length,
            count: count,
            savings: (seq.length - 5) * (count - 1) // Rough estimate of space saved
          });
        }
      });
    }

    // Sort by potential savings
    return patterns.sort((a, b) => b.savings - a.savings).slice(0, 50);
  }
}
