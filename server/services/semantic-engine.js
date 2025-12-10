/**
 * Semantic Engine - Advanced NLP and Semantic Fingerprinting
 * Provides semantic understanding, entity extraction, and similarity calculation
 */

export class SemanticEngine {
  constructor() {
    this.vocabulary = new Map();
    this.idf = new Map();
    this.documentCount = 0;
  }

  /**
   * Generate semantic fingerprint for text
   * @param {string} text - Input text
   * @returns {Float32Array} - 256-dimensional fingerprint vector
   */
  generateFingerprint(text) {
    const words = this.tokenize(text);
    const fingerprint = new Float32Array(256);

    // TF-IDF weighted fingerprinting
    const termFreq = new Map();
    words.forEach(word => {
      termFreq.set(word, (termFreq.get(word) || 0) + 1);
    });

    // Calculate TF-IDF and map to vector
    termFreq.forEach((tf, word) => {
      const idf = this.getIDF(word);
      const tfidf = (tf / words.length) * idf;
      
      // Hash word to multiple dimensions for robustness
      for (let i = 0; i < 3; i++) {
        const hash = this.hashToDimension(word, i);
        fingerprint[hash] += tfidf;
      }
    });

    // Normalize
    const magnitude = Math.sqrt(fingerprint.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < fingerprint.length; i++) {
        fingerprint[i] /= magnitude;
      }
    }

    return fingerprint;
  }

  /**
   * Calculate cosine similarity between two fingerprints
   * @param {Float32Array} fp1 - First fingerprint
   * @param {Float32Array} fp2 - Second fingerprint
   * @returns {number} - Similarity score (0-1)
   */
  calculateSimilarity(fp1, fp2) {
    if (!fp1 || !fp2 || fp1.length !== fp2.length) {
      return 0;
    }

    let dotProduct = 0;
    for (let i = 0; i < fp1.length; i++) {
      dotProduct += fp1[i] * fp2[i];
    }

    return Math.max(0, Math.min(1, dotProduct));
  }

  /**
   * Extract named entities from text
   * @param {string} text - Input text
   * @returns {Array<string>} - List of entities
   */
  extractEntities(text) {
    const entities = [];
    
    // Capitalized words (potential proper nouns)
    const capitalizedRegex = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
    const matches = text.match(capitalizedRegex) || [];
    
    // Filter out common words at sentence start
    const commonStarters = new Set(['The', 'This', 'That', 'These', 'Those', 'A', 'An', 'My', 'Your', 'His', 'Her', 'Its', 'Our', 'Their']);
    
    matches.forEach(match => {
      if (!commonStarters.has(match) && match.length > 2) {
        entities.push(match);
      }
    });

    // Technical terms (camelCase, PascalCase, snake_case)
    const technicalRegex = /\b(?:[a-z]+[A-Z][a-zA-Z]*|[A-Z][a-z]+(?:[A-Z][a-z]+)+|[a-z]+_[a-z_]+)\b/g;
    const technical = text.match(technicalRegex) || [];
    entities.push(...technical);

    // Remove duplicates and return
    return [...new Set(entities)].slice(0, 20);
  }

  /**
   * Extract topics from text
   * @param {string} text - Input text
   * @returns {Array<string>} - List of topics
   */
  extractTopics(text) {
    const words = this.tokenize(text);
    const stopWords = this.getStopWords();
    
    // Count word frequencies
    const freq = new Map();
    words.forEach(word => {
      if (!stopWords.has(word) && word.length > 3) {
        freq.set(word, (freq.get(word) || 0) + 1);
      }
    });

    // Get top keywords as topics
    const topics = Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    return topics;
  }

  /**
   * Analyze sentiment of text
   * @param {string} text - Input text
   * @returns {Object} - Sentiment analysis result
   */
  analyzeSentiment(text) {
    const words = this.tokenize(text);
    
    const positive = new Set([
      'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love',
      'best', 'perfect', 'awesome', 'brilliant', 'outstanding', 'superb', 'yes',
      'happy', 'joy', 'success', 'win', 'improve', 'better', 'helpful', 'thanks'
    ]);

    const negative = new Set([
      'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'poor', 'fail',
      'wrong', 'error', 'problem', 'issue', 'bug', 'broken', 'difficult', 'hard',
      'sad', 'angry', 'frustrated', 'annoying', 'confusing', 'complicated', 'no'
    ]);

    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positive.has(word)) positiveCount++;
      if (negative.has(word)) negativeCount++;
    });

    const total = positiveCount + negativeCount;
    let label = 'neutral';
    let score = 0.5;

    if (total > 0) {
      score = (positiveCount - negativeCount) / total;
      score = (score + 1) / 2; // Normalize to 0-1

      if (score > 0.6) label = 'positive';
      else if (score < 0.4) label = 'negative';
    }

    return {
      label,
      score,
      positive: positiveCount,
      negative: negativeCount
    };
  }

  /**
   * Get search suggestions based on query
   * @param {string} query - Search query
   * @param {Object} options - Options
   * @returns {Array<string>} - List of suggestions
   */
  getSuggestions(query, options = {}) {
    const { limit = 10 } = options;
    const queryWords = this.tokenize(query.toLowerCase());
    
    // Get words that start with query words
    const suggestions = new Set();
    
    this.vocabulary.forEach((count, word) => {
      queryWords.forEach(qWord => {
        if (word.startsWith(qWord) && word !== qWord) {
          suggestions.add(word);
        }
      });
    });

    return Array.from(suggestions).slice(0, limit);
  }

  /**
   * Add memory to knowledge graph
   * @param {Object} memory - Memory object
   */
  async addToKnowledgeGraph(memory) {
    // Update vocabulary and IDF
    const words = this.tokenize(memory.content);
    words.forEach(word => {
      this.vocabulary.set(word, (this.vocabulary.get(word) || 0) + 1);
    });

    // Update IDF values
    const uniqueWords = new Set(words);
    this.documentCount++;
    
    uniqueWords.forEach(word => {
      const docFreq = this.idf.get(word) || 0;
      this.idf.set(word, docFreq + 1);
    });
  }

  // ==================== HELPER METHODS ====================

  /**
   * Tokenize text into words
   * @param {string} text - Input text
   * @returns {Array<string>} - Array of tokens
   */
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0);
  }

  /**
   * Get IDF (Inverse Document Frequency) for a word
   * @param {string} word - Word
   * @returns {number} - IDF value
   */
  getIDF(word) {
    const docFreq = this.idf.get(word) || 1;
    return Math.log((this.documentCount + 1) / (docFreq + 1)) + 1;
  }

  /**
   * Hash word to dimension index
   * @param {string} word - Word to hash
   * @param {number} seed - Hash seed
   * @returns {number} - Dimension index
   */
  hashToDimension(word, seed = 0) {
    let hash = seed;
    for (let i = 0; i < word.length; i++) {
      hash = ((hash << 5) - hash) + word.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 256;
  }

  /**
   * Get stop words set
   * @returns {Set<string>} - Set of stop words
   */
  getStopWords() {
    return new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
      'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'should', 'could', 'can', 'may', 'might', 'must', 'i', 'you',
      'he', 'she', 'it', 'we', 'they', 'them', 'their', 'this', 'that',
      'these', 'those', 'what', 'which', 'who', 'when', 'where', 'why', 'how'
    ]);
  }
}
