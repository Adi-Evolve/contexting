/**
 * LZWCompressor - Custom LZW Compression Algorithm
 * Zero dependencies, dictionary-based compression
 */

class LZWCompressor {
  constructor() {
    this.maxDictSize = 65536; // 16-bit limit
  }

  /**
   * Compress string using LZW algorithm
   * Returns Uint16Array for efficient storage
   */
  compress(text) {
    if (!text || text.length === 0) {
      return new Uint16Array(0);
    }

    // Initialize dictionary with single characters
    const dictionary = new Map();
    let dictSize = 256;
    
    for (let i = 0; i < 256; i++) {
      dictionary.set(String.fromCharCode(i), i);
    }

    let current = '';
    const result = [];

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const combined = current + char;

      if (dictionary.has(combined)) {
        current = combined;
      } else {
        // Output code for current
        result.push(dictionary.get(current));

        // Add new sequence to dictionary
        if (dictSize < this.maxDictSize) {
          dictionary.set(combined, dictSize++);
        }

        current = char;
      }
    }

    // Output code for remaining string
    if (current !== '') {
      result.push(dictionary.get(current));
    }

    return new Uint16Array(result);
  }

  /**
   * Decompress Uint16Array back to string
   */
  decompress(compressed) {
    if (!compressed || compressed.length === 0) {
      return '';
    }

    // Initialize dictionary with single characters
    const dictionary = new Map();
    let dictSize = 256;
    
    for (let i = 0; i < 256; i++) {
      dictionary.set(i, String.fromCharCode(i));
    }

    let previous = String.fromCharCode(compressed[0]);
    let result = previous;

    for (let i = 1; i < compressed.length; i++) {
      const code = compressed[i];
      let entry;

      if (dictionary.has(code)) {
        entry = dictionary.get(code);
      } else if (code === dictSize) {
        entry = previous + previous[0];
      } else {
        throw new Error('Invalid compressed data');
      }

      result += entry;

      // Add new sequence to dictionary
      if (dictSize < this.maxDictSize) {
        dictionary.set(dictSize++, previous + entry[0]);
      }

      previous = entry;
    }

    return result;
  }

  /**
   * Convert Uint16Array to Base64 string for storage
   */
  toBase64(uint16Array) {
    // Convert Uint16Array to Uint8Array (2 bytes per uint16)
    const uint8Array = new Uint8Array(uint16Array.buffer);
    
    // Convert to binary string
    let binaryString = '';
    const chunkSize = 8192; // Process in chunks to avoid stack overflow
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binaryString += String.fromCharCode.apply(null, chunk);
    }
    
    // Convert to base64
    return btoa(binaryString);
  }

  /**
   * Convert Base64 string back to Uint16Array
   */
  fromBase64(base64String) {
    // Decode base64 to binary string
    const binaryString = atob(base64String);
    
    // Convert to Uint8Array
    const uint8Array = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i);
    }
    
    // Convert to Uint16Array
    return new Uint16Array(uint8Array.buffer);
  }

  /**
   * Compress and encode to Base64 in one step
   */
  compressToBase64(text) {
    const compressed = this.compress(text);
    return this.toBase64(compressed);
  }

  /**
   * Decode from Base64 and decompress in one step
   */
  decompressFromBase64(base64String) {
    const compressed = this.fromBase64(base64String);
    return this.decompress(compressed);
  }

  /**
   * Calculate compression ratio
   */
  getCompressionRatio(originalText, compressedBase64) {
    const originalSize = new Blob([originalText]).size;
    const compressedSize = new Blob([compressedBase64]).size;
    
    return {
      originalSize,
      compressedSize,
      ratio: (1 - compressedSize / originalSize) * 100,
      savings: originalSize - compressedSize
    };
  }

  /**
   * Format bytes to human-readable string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Compress with metadata
   */
  compressWithMetadata(text) {
    const startTime = Date.now();
    const compressedBase64 = this.compressToBase64(text);
    const compressionTime = Date.now() - startTime;
    
    const stats = this.getCompressionRatio(text, compressedBase64);
    
    return {
      compressed: compressedBase64,
      metadata: {
        originalSize: stats.originalSize,
        compressedSize: stats.compressedSize,
        ratio: stats.ratio,
        compressionTime,
        timestamp: Date.now()
      }
    };
  }

  /**
   * Test compression on sample data
   */
  test() {
    const samples = [
      'Hello World!',
      'The quick brown fox jumps over the lazy dog. '.repeat(10),
      '{"name":"John","age":30,"city":"New York"}'.repeat(20)
    ];

    console.log('LZW Compression Test Results:');
    samples.forEach((sample, i) => {
      const result = this.compressWithMetadata(sample);
      console.log(`Sample ${i + 1}:`);
      console.log(`  Original: ${this.formatBytes(result.metadata.originalSize)}`);
      console.log(`  Compressed: ${this.formatBytes(result.metadata.compressedSize)}`);
      console.log(`  Ratio: ${result.metadata.ratio.toFixed(2)}%`);
      console.log(`  Time: ${result.metadata.compressionTime}ms`);
      
      // Verify decompression
      const decompressed = this.decompressFromBase64(result.compressed);
      console.log(`  Verified: ${decompressed === sample ? '✓' : '✗'}`);
    });
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.LZWCompressor = LZWCompressor;
}
