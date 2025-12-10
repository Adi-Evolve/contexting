/**
 * AdvancedNLP - Client-Side Natural Language Processing
 * 
 * Zero-cost NLP utilities (no APIs):
 * - Entity extraction (names, places, dates, etc.)
 * - Sentiment analysis
 * - Intent detection
 * - Language detection
 * - Text summarization
 * - Keyword extraction
 * 
 * All processing happens locally in the browser
 * 
 * @class AdvancedNLP
 */

class AdvancedNLP {
  constructor() {
    // Entity patterns
    this.patterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      url: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g,
      phone: /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
      date: /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/gi,
      time: /\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?\b/g,
      money: /\$\d+(?:,\d{3})*(?:\.\d{2})?|\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:USD|EUR|GBP|JPY|dollars?|euros?|pounds?)/gi,
      hashtag: /#[a-zA-Z0-9_]+/g,
      mention: /@[a-zA-Z0-9_]+/g
    };
    
    // Sentiment lexicons (simplified)
    this.sentimentWords = {
      positive: [
        'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love',
        'happy', 'joy', 'perfect', 'best', 'awesome', 'brilliant', 'beautiful',
        'success', 'win', 'won', 'achieve', 'accomplished', 'excited', 'glad'
      ],
      negative: [
        'bad', 'terrible', 'horrible', 'awful', 'worst', 'hate', 'sad', 'angry',
        'poor', 'fail', 'failed', 'disaster', 'problem', 'issue', 'wrong', 'error',
        'difficult', 'hard', 'struggle', 'disappointed', 'frustrated'
      ],
      intensifiers: ['very', 'extremely', 'really', 'so', 'quite', 'totally'],
      negators: ['not', 'no', 'never', 'neither', 'nobody', 'nothing', 'nowhere']
    };
    
    // Intent patterns
    this.intents = {
      question: /^(what|when|where|who|why|how|is|are|can|could|would|will|do|does)\b/i,
      command: /^(create|make|build|add|remove|delete|update|change|set|get|show|list|find)\b/i,
      greeting: /^(hi|hello|hey|greetings|good morning|good afternoon|good evening)\b/i,
      farewell: /^(bye|goodbye|see you|farewell|take care)\b/i,
      gratitude: /^(thanks|thank you|appreciate|grateful)\b/i,
      apology: /^(sorry|apologize|apologies|my bad|excuse me)\b/i
    };
    
    // Language detection (basic)
    this.languagePatterns = {
      en: /\b(the|is|are|was|were|have|has|had|will|would|can|could)\b/i,
      es: /\b(el|la|los|las|es|son|está|están|tiene|tienen)\b/i,
      fr: /\b(le|la|les|est|sont|avoir|être|avec|pour)\b/i,
      de: /\b(der|die|das|ist|sind|haben|sein|mit|für)\b/i,
      it: /\b(il|la|i|le|è|sono|avere|essere|con|per)\b/i
    };
  }
  
  /**
   * Extract entities from text
   * 
   * @param {string} text - Text to analyze
   * @returns {Object} Extracted entities
   */
  extractEntities(text) {
    const entities = {};
    
    for (const [type, pattern] of Object.entries(this.patterns)) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        entities[type] = [...new Set(matches)]; // Remove duplicates
      }
    }
    
    // Extract people (capitalized words)
    const people = this.extractPeople(text);
    if (people.length > 0) entities.people = people;
    
    return entities;
  }
  
  /**
   * Extract person names (capitalized consecutive words)
   */
  extractPeople(text) {
    const words = text.split(/\s+/);
    const people = [];
    let currentName = [];
    
    for (const word of words) {
      const clean = word.replace(/[^\w]/g, '');
      if (clean && clean[0] === clean[0].toUpperCase() && clean.length > 1) {
        currentName.push(clean);
      } else {
        if (currentName.length >= 2) {
          people.push(currentName.join(' '));
        }
        currentName = [];
      }
    }
    
    if (currentName.length >= 2) {
      people.push(currentName.join(' '));
    }
    
    return people;
  }
  
  /**
   * Analyze sentiment (-1 to +1)
   * 
   * @param {string} text - Text to analyze
   * @returns {Object} Sentiment analysis
   */
  analyzeSentiment(text) {
    const words = text.toLowerCase().split(/\s+/);
    let score = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    let intensifier = 1;
    let negate = false;
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      // Check for intensifiers
      if (this.sentimentWords.intensifiers.includes(word)) {
        intensifier = 1.5;
        continue;
      }
      
      // Check for negators
      if (this.sentimentWords.negators.includes(word)) {
        negate = true;
        continue;
      }
      
      // Check sentiment
      if (this.sentimentWords.positive.includes(word)) {
        const value = intensifier * (negate ? -1 : 1);
        score += value;
        positiveCount++;
      } else if (this.sentimentWords.negative.includes(word)) {
        const value = intensifier * (negate ? 1 : -1);
        score -= value;
        negativeCount++;
      }
      
      // Reset modifiers
      intensifier = 1;
      negate = false;
    }
    
    // Normalize score
    const totalSentimentWords = positiveCount + negativeCount;
    const normalizedScore = totalSentimentWords > 0
      ? score / totalSentimentWords
      : 0;
    
    return {
      score: Math.max(-1, Math.min(1, normalizedScore)),
      label: normalizedScore > 0.3 ? 'positive' :
             normalizedScore < -0.3 ? 'negative' : 'neutral',
      confidence: Math.abs(normalizedScore),
      positiveCount,
      negativeCount
    };
  }
  
  /**
   * Detect intent
   * 
   * @param {string} text - Text to analyze
   * @returns {Object} Detected intent
   */
  detectIntent(text) {
    const trimmed = text.trim();
    
    for (const [intent, pattern] of Object.entries(this.intents)) {
      if (pattern.test(trimmed)) {
        return {
          intent,
          confidence: 0.8,
          pattern: pattern.toString()
        };
      }
    }
    
    // Default: statement
    return {
      intent: 'statement',
      confidence: 0.5,
      pattern: null
    };
  }
  
  /**
   * Detect language
   * 
   * @param {string} text - Text to analyze
   * @returns {Object} Detected language
   */
  detectLanguage(text) {
    const scores = {};
    
    for (const [lang, pattern] of Object.entries(this.languagePatterns)) {
      const matches = text.match(pattern);
      scores[lang] = matches ? matches.length : 0;
    }
    
    // Find highest score
    const detected = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])[0];
    
    return {
      language: detected ? detected[0] : 'unknown',
      confidence: detected && detected[1] > 0 ? Math.min(1, detected[1] / 10) : 0,
      scores
    };
  }
  
  /**
   * Summarize text (extractive - pick key sentences)
   * 
   * @param {string} text - Text to summarize
   * @param {number} maxSentences - Max sentences in summary
   * @returns {string} Summary
   */
  summarize(text, maxSentences = 3) {
    // Split into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    if (sentences.length <= maxSentences) {
      return text;
    }
    
    // Score sentences
    const scored = sentences.map((sentence, index) => {
      let score = 0;
      
      // Position (first and last sentences important)
      if (index === 0) score += 2;
      if (index === sentences.length - 1) score += 1;
      
      // Length (prefer medium-length)
      const wordCount = sentence.split(/\s+/).length;
      if (wordCount >= 10 && wordCount <= 25) score += 1;
      
      // Keywords (numbers, entities)
      if (/\d+/.test(sentence)) score += 0.5;
      if (/[A-Z][a-z]+/.test(sentence)) score += 0.5;
      
      return { sentence, score };
    });
    
    // Pick top N sentences, maintain order
    const topSentences = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSentences)
      .sort((a, b) => sentences.indexOf(a.sentence) - sentences.indexOf(b.sentence))
      .map(s => s.sentence.trim());
    
    return topSentences.join(' ');
  }
  
  /**
   * Extract keywords
   * 
   * @param {string} text - Text to analyze
   * @param {number} maxKeywords - Max keywords to extract
   * @returns {Array} Keywords with scores
   */
  extractKeywords(text, maxKeywords = 5) {
    // Tokenize
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 3);
    
    // Stop words
    const stopWords = new Set([
      'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'should', 'could', 'may', 'might', 'must', 'can', 'this',
      'that', 'these', 'those', 'and', 'but', 'or', 'for', 'with'
    ]);
    
    // Count frequencies
    const freq = new Map();
    for (const word of words) {
      if (!stopWords.has(word)) {
        freq.set(word, (freq.get(word) || 0) + 1);
      }
    }
    
    // Sort by frequency
    const keywords = Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxKeywords)
      .map(([word, count]) => ({
        keyword: word,
        count,
        score: count / words.length
      }));
    
    return keywords;
  }
  
  /**
   * Tokenize text
   */
  tokenize(text) {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0);
  }
  
  /**
   * Calculate text similarity (Jaccard)
   */
  similarity(text1, text2) {
    const tokens1 = new Set(this.tokenize(text1));
    const tokens2 = new Set(this.tokenize(text2));
    
    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);
    
    return intersection.size / union.size;
  }
  
  /**
   * Analyze text completely
   */
  analyze(text) {
    return {
      entities: this.extractEntities(text),
      sentiment: this.analyzeSentiment(text),
      intent: this.detectIntent(text),
      language: this.detectLanguage(text),
      keywords: this.extractKeywords(text),
      summary: this.summarize(text),
      wordCount: text.split(/\s+/).length,
      charCount: text.length
    };
  }
}

// Export
if (typeof window !== 'undefined') {
  window.AdvancedNLP = AdvancedNLP;
}

export default AdvancedNLP;
