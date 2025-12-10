/**
 * MemoryManager - Core Orchestration Layer
 * Coordinates storage, NLP, and compression
 */

class MemoryManager {
  constructor() {
    this.db = new SimpleDB();
    this.nlp = new SimpleNLP();
    this.compressor = new LZWCompressor();
    
    this.messages = [];
    this.concepts = new Map();
    this.sessionId = null;
    this.initialized = false;
  }

  /**
   * Initialize the memory system
   */
  async init() {
    try {
      await this.db.init();
      await this.loadFromDB();
      
      this.sessionId = Date.now();
      this.initialized = true;
      
      console.log('MemoryManager initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize MemoryManager:', error);
      return false;
    }
  }

  /**
   * Add a new message and analyze it
   */
  async addMessage(role, content) {
    if (!this.initialized) {
      throw new Error('MemoryManager not initialized');
    }

    const message = {
      role,
      content,
      timestamp: Date.now()
    };

    // Analyze message with NLP
    const analysis = this.nlp.analyze(content);

    // Store message in DB
    try {
      const messageId = await this.db.add('messages', message);
      message.id = messageId;
      this.messages.push(message);

      // Store extracted concepts
      await this.storeConcepts(analysis, messageId);

      return {
        messageId,
        analysis
      };
    } catch (error) {
      console.error('Failed to add message:', error);
      throw error;
    }
  }

  /**
   * Store extracted concepts in DB
   */
  async storeConcepts(analysis, messageId) {
    const conceptsToStore = [
      ...analysis.concepts,
      ...analysis.decisions,
      ...analysis.code.map(c => ({ type: 'code', content: c.language || 'unknown' }))
    ];

    for (const concept of conceptsToStore) {
      try {
        const conceptData = {
          type: concept.type,
          content: concept.content || concept.choice || concept.language,
          messageIndex: messageId,
          timestamp: Date.now()
        };

        const conceptId = await this.db.add('concepts', conceptData);
        
        // Update in-memory concept map
        const key = `${concept.type}:${conceptData.content}`;
        if (!this.concepts.has(key)) {
          this.concepts.set(key, []);
        }
        this.concepts.get(key).push({ id: conceptId, messageId });
      } catch (error) {
        console.error('Failed to store concept:', error);
      }
    }
  }

  /**
   * Load existing data from IndexedDB
   */
  async loadFromDB() {
    try {
      this.messages = await this.db.getAll('messages');
      const concepts = await this.db.getAll('concepts');

      // Build concept map
      this.concepts.clear();
      concepts.forEach(concept => {
        const key = `${concept.type}:${concept.content}`;
        if (!this.concepts.has(key)) {
          this.concepts.set(key, []);
        }
        this.concepts.get(key).push({ 
          id: concept.id, 
          messageId: concept.messageIndex 
        });
      });

      console.log(`Loaded ${this.messages.length} messages and ${concepts.length} concepts`);
    } catch (error) {
      console.error('Failed to load from DB:', error);
    }
  }

  /**
   * Export to .aime file format
   */
  async exportToFile() {
    if (!this.initialized) {
      throw new Error('MemoryManager not initialized');
    }

    // Build conversation text
    const conversationText = this.messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n\n');

    // Compress conversation
    const compressionResult = this.compressor.compressWithMetadata(conversationText);

    // Build concept index
    const conceptIndex = {};
    this.concepts.forEach((refs, key) => {
      const [type, content] = key.split(':', 2);
      if (!conceptIndex[type]) {
        conceptIndex[type] = [];
      }
      conceptIndex[type].push({
        content,
        frequency: refs.length,
        messages: refs.map(r => r.messageId)
      });
    });

    // Build .aime file structure
    const aimeFile = {
      version: '1.0.0',
      format: 'aime',
      created: new Date().toISOString(),
      llm: 'universal',
      
      index: {
        messageCount: this.messages.length,
        conceptCount: this.concepts.size,
        timeRange: {
          start: this.messages[0]?.timestamp || Date.now(),
          end: this.messages[this.messages.length - 1]?.timestamp || Date.now()
        },
        concepts: conceptIndex
      },

      data: {
        compressed: compressionResult.compressed,
        originalSize: compressionResult.metadata.originalSize,
        compressedSize: compressionResult.metadata.compressedSize,
        compressionRatio: compressionResult.metadata.ratio
      },

      metadata: {
        exportDate: Date.now(),
        sessionId: this.sessionId,
        userAgent: navigator.userAgent
      }
    };

    return aimeFile;
  }

  /**
   * Import from .aime file
   */
  async importFromFile(aimeFile) {
    if (!this.initialized) {
      throw new Error('MemoryManager not initialized');
    }

    try {
      // Validate format
      if (aimeFile.format !== 'aime') {
        throw new Error('Invalid file format');
      }

      // Decompress conversation
      const conversationText = this.compressor.decompressFromBase64(aimeFile.data.compressed);

      // Parse messages
      const messageLines = conversationText.split('\n\n');
      const newMessages = [];

      for (const line of messageLines) {
        const match = line.match(/^(user|assistant): ([\s\S]+)$/);
        if (match) {
          const [, role, content] = match;
          newMessages.push({ role, content, timestamp: Date.now() });
        }
      }

      // Clear existing data
      await this.db.clear('messages');
      await this.db.clear('concepts');
      this.messages = [];
      this.concepts.clear();

      // Re-add all messages
      for (const msg of newMessages) {
        await this.addMessage(msg.role, msg.content);
      }

      console.log(`Imported ${newMessages.length} messages from .aime file`);

      return {
        success: true,
        messageCount: newMessages.length,
        originalSize: aimeFile.data.originalSize,
        compressionRatio: aimeFile.data.compressionRatio
      };
    } catch (error) {
      console.error('Failed to import .aime file:', error);
      throw error;
    }
  }

  /**
   * Build context string for AI with relevant concepts
   */
  buildContextForAI(userQuery, maxTokens = 2000) {
    // Estimate: 1 token ≈ 4 characters
    const maxChars = maxTokens * 4;

    // Get recent messages (last 10)
    const recentMessages = this.messages.slice(-10);
    let context = '## Recent Conversation:\n\n';
    
    recentMessages.forEach(msg => {
      context += `**${msg.role}**: ${msg.content}\n\n`;
    });

    // Extract concepts from user query
    const queryAnalysis = this.nlp.analyze(userQuery);
    const relevantConcepts = new Set();

    // Find related concepts
    queryAnalysis.concepts.forEach(concept => {
      const key = `${concept.type}:${concept.content}`;
      if (this.concepts.has(key)) {
        relevantConcepts.add(concept.content);
      }
    });

    // Add relevant concept summary
    if (relevantConcepts.size > 0) {
      context += '\n## Relevant Context:\n\n';
      relevantConcepts.forEach(concept => {
        context += `- ${concept}\n`;
      });
    }

    // Trim to max length
    if (context.length > maxChars) {
      context = context.substring(0, maxChars) + '\n\n[Context truncated...]';
    }

    return context;
  }

  /**
   * Clear all data
   */
  async clearAll() {
    if (!this.initialized) {
      throw new Error('MemoryManager not initialized');
    }

    try {
      await this.db.clear('messages');
      await this.db.clear('concepts');
      this.messages = [];
      this.concepts.clear();
      
      console.log('All data cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear data:', error);
      return false;
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    const totalChars = this.messages.reduce((sum, m) => sum + m.content.length, 0);
    
    return {
      messages: this.messages.length,
      concepts: this.concepts.size,
      totalCharacters: totalChars,
      estimatedSize: this.compressor.formatBytes(totalChars),
      lastActivity: this.messages[this.messages.length - 1]?.timestamp || null
    };
  }

  /**
   * Search messages by keyword
   */
  searchMessages(keyword) {
    const lowerKeyword = keyword.toLowerCase();
    return this.messages.filter(msg => 
      msg.content.toLowerCase().includes(lowerKeyword)
    );
  }

  /**
   * Get messages by concept
   */
  getMessagesByConcept(conceptType, conceptContent) {
    const key = `${conceptType}:${conceptContent}`;
    if (!this.concepts.has(key)) {
      return [];
    }

    const messageIds = this.concepts.get(key).map(ref => ref.messageId);
    return this.messages.filter(msg => messageIds.includes(msg.id));
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.MemoryManager = MemoryManager;
}
