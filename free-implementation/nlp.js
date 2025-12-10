/**
 * SimpleNLP - Custom Regex-based NLP Processor
 * Zero dependencies, pattern matching only
 */

class SimpleNLP {
  constructor() {
    // Framework patterns
    this.frameworks = [
      'React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Nuxt', 'Express',
      'Django', 'Flask', 'FastAPI', 'Spring', 'Laravel', 'Rails',
      'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn',
      'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP',
      'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch',
      'GraphQL', 'REST', 'gRPC', 'WebSocket',
      'TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'C#'
    ];

    // Decision patterns
    this.decisionPatterns = [
      /let'?s use ([^.,]+)/i,
      /decided to use ([^.,]+)/i,
      /going with ([^.,]+)/i,
      /chose ([^.,]+)/i,
      /selected ([^.,]+)/i,
      /([^.,]+) instead of ([^.,]+)/i,
      /switched to ([^.,]+)/i,
      /will use ([^.,]+)/i,
      /using ([^.,]+) for/i
    ];

    // Code block patterns
    this.codeBlockPattern = /```[\s\S]*?```/g;
    this.inlineCodePattern = /`[^`]+`/g;
  }

  /**
   * Extract concepts from text
   */
  extractConcepts(text) {
    const concepts = new Set();

    // Extract capitalized technical terms (2+ chars)
    const capitalizedPattern = /\b[A-Z][a-zA-Z0-9]+(?:[A-Z][a-z0-9]*)*\b/g;
    const matches = text.match(capitalizedPattern) || [];
    
    matches.forEach(match => {
      if (match.length >= 2 && !this.isCommonWord(match)) {
        concepts.add(match);
      }
    });

    // Extract framework mentions
    this.frameworks.forEach(framework => {
      const pattern = new RegExp(`\\b${framework}\\b`, 'gi');
      if (pattern.test(text)) {
        concepts.add(framework);
      }
    });

    // Extract quoted terms
    const quotedPattern = /"([^"]+)"|'([^']+)'/g;
    let quoteMatch;
    while ((quoteMatch = quotedPattern.exec(text)) !== null) {
      const term = quoteMatch[1] || quoteMatch[2];
      if (term.length >= 3) {
        concepts.add(term);
      }
    }

    // Extract technical terms with specific patterns
    const technicalPatterns = [
      /\b[a-z]+(?:DB|SQL|API|SDK|CLI|UI|UX|IDE|OS)\b/gi,
      /\b(?:async|await|promise|callback|function|class|interface)\b/gi,
      /\b(?:GET|POST|PUT|DELETE|PATCH)\b/g
    ];

    technicalPatterns.forEach(pattern => {
      const techMatches = text.match(pattern) || [];
      techMatches.forEach(match => concepts.add(match));
    });

    return Array.from(concepts).map(concept => ({
      type: 'concept',
      content: concept,
      context: this.extractContext(text, concept)
    }));
  }

  /**
   * Detect decisions in text
   */
  detectDecisions(text) {
    const decisions = [];

    this.decisionPatterns.forEach(pattern => {
      const matches = text.matchAll(new RegExp(pattern, 'gi'));
      for (const match of matches) {
        decisions.push({
          type: 'decision',
          content: match[0],
          choice: match[1] || match[0],
          alternative: match[2] || null,
          context: this.extractContext(text, match[0])
        });
      }
    });

    return decisions;
  }

  /**
   * Extract code blocks
   */
  extractCode(text) {
    const codeBlocks = [];

    // Extract code blocks with language
    const blockMatches = text.matchAll(/```(\w+)?\n([\s\S]*?)```/g);
    for (const match of blockMatches) {
      codeBlocks.push({
        type: 'code',
        language: match[1] || 'unknown',
        content: match[2].trim(),
        size: match[2].length
      });
    }

    // Extract inline code
    const inlineMatches = text.matchAll(/`([^`]+)`/g);
    const inlineCode = [];
    for (const match of inlineMatches) {
      if (match[1].length < 100) { // Only short inline code
        inlineCode.push(match[1]);
      }
    }

    if (inlineCode.length > 0) {
      codeBlocks.push({
        type: 'inline-code',
        content: inlineCode,
        count: inlineCode.length
      });
    }

    return codeBlocks;
  }

  /**
   * Extract context around a term (50 chars before/after)
   */
  extractContext(text, term) {
    const index = text.toLowerCase().indexOf(term.toLowerCase());
    if (index === -1) return '';

    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + term.length + 50);
    
    let context = text.substring(start, end);
    if (start > 0) context = '...' + context;
    if (end < text.length) context = context + '...';
    
    return context;
  }

  /**
   * Check if word is common (to filter out noise)
   */
  isCommonWord(word) {
    const commonWords = [
      'The', 'This', 'That', 'These', 'Those', 'Here', 'There',
      'When', 'Where', 'What', 'Which', 'Who', 'How', 'Why',
      'Can', 'Could', 'Would', 'Should', 'May', 'Might',
      'Yes', 'No', 'Not', 'But', 'And', 'Or', 'If', 'Then',
      'Some', 'Any', 'All', 'Each', 'Every', 'Many', 'Much',
      'More', 'Most', 'Less', 'Few', 'Several', 'Other'
    ];
    return commonWords.includes(word);
  }

  /**
   * Analyze full message and return all extracted data
   */
  analyze(text) {
    return {
      concepts: this.extractConcepts(text),
      decisions: this.detectDecisions(text),
      code: this.extractCode(text),
      wordCount: text.split(/\s+/).length,
      hasCode: this.codeBlockPattern.test(text) || this.inlineCodePattern.test(text)
    };
  }

  /**
   * Generate semantic summary (key points)
   */
  generateSummary(text, maxLength = 200) {
    // Remove code blocks for summary
    let cleanText = text.replace(this.codeBlockPattern, '[CODE]');
    cleanText = cleanText.replace(this.inlineCodePattern, '[CODE]');

    // Extract first meaningful sentences
    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    let summary = '';
    for (const sentence of sentences) {
      if (summary.length + sentence.length > maxLength) break;
      summary += sentence.trim() + '. ';
    }

    return summary.trim() || text.substring(0, maxLength) + '...';
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.SimpleNLP = SimpleNLP;
}
