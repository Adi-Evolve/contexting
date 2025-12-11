// LLM Query Engine
// Natural language interface for context retrieval with GraphQL-style queries

class LLMQueryEngine {
    constructor(hierarchyManager, causalReasoner, semanticFingerprint, multiModalHandler, config = {}) {
        this.hierarchyManager = hierarchyManager;
        this.causalReasoner = causalReasoner;
        this.semanticFingerprint = semanticFingerprint;
        this.multiModalHandler = multiModalHandler;
        
        this.config = {
            maxResults: config.maxResults || 10,
            defaultTokenLimit: config.defaultTokenLimit || 4000,
            minRelevance: config.minRelevance || 0.3,
            useSemanticSearch: config.useSemanticSearch !== false,
            useCausalReasoning: config.useCausalReasoning !== false
        };
        
        this.queryPatterns = this.initializeQueryPatterns();
        this.queryHistory = [];
    }
    
    /**
     * Initialize query patterns
     */
    initializeQueryPatterns() {
        return {
            // Temporal queries
            temporal: {
                patterns: [
                    /\b(recent|latest|last|today|yesterday|this week)\b/i,
                    /\b(before|after|between|during)\b/i,
                    /\b(when did|what time)\b/i
                ],
                handler: 'handleTemporalQuery'
            },
            
            // Causal queries
            causal: {
                patterns: [
                    /\b(why|reason|because|cause|led to)\b/i,
                    /\b(explain|justify|rationale)\b/i,
                    /\b(what happened|what led)\b/i
                ],
                handler: 'handleCausalQuery'
            },
            
            // Contextual queries
            contextual: {
                patterns: [
                    /\b(context|background|history|previous)\b/i,
                    /\b(related to|about|regarding)\b/i,
                    /\b(tell me about)\b/i
                ],
                handler: 'handleContextualQuery'
            },
            
            // Image queries
            image: {
                patterns: [
                    /\b(image|picture|screenshot|diagram|chart)\b/i,
                    /\b(show me|find|visual)\b/i
                ],
                handler: 'handleImageQuery'
            },
            
            // Code queries
            code: {
                patterns: [
                    /\b(code|function|class|method|implementation)\b/i,
                    /\b(how to|example|snippet)\b/i
                ],
                handler: 'handleCodeQuery'
            },
            
            // Summary queries
            summary: {
                patterns: [
                    /\b(summary|summarize|overview|key points)\b/i,
                    /\b(what are|list|enumerate)\b/i
                ],
                handler: 'handleSummaryQuery'
            }
        };
    }
    
    /**
     * Execute natural language query
     * @param {string} query - Natural language query
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Query results
     */
    async query(query, options = {}) {
        const startTime = Date.now();
        
        // Parse query
        const parsed = this.parseQuery(query);
        
        // Determine query type
        const queryType = this.classifyQuery(query);
        
        // Execute appropriate handler
        const handler = this[this.queryPatterns[queryType].handler];
        const results = await handler.call(this, parsed, options);
        
        // Post-process results
        const processed = this.postProcessResults(results, options);
        
        // Track query
        this.queryHistory.push({
            query: query,
            type: queryType,
            timestamp: Date.now(),
            executionTime: Date.now() - startTime,
            resultCount: processed.results.length
        });
        
        return processed;
    }
    
    /**
     * Parse query into structured format
     */
    parseQuery(query) {
        return {
            raw: query,
            tokens: this.tokenize(query),
            entities: this.extractEntities(query),
            timeframe: this.extractTimeframe(query),
            keywords: this.extractKeywords(query)
        };
    }
    
    /**
     * Tokenize query
     */
    tokenize(query) {
        return query
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(t => t.length > 0);
    }
    
    /**
     * Extract entities (proper nouns, technical terms)
     */
    extractEntities(query) {
        const entities = [];
        
        // Extract capitalized words
        const capitalizedRegex = /\b[A-Z][a-z]+\b/g;
        const capitalized = query.match(capitalizedRegex) || [];
        entities.push(...capitalized);
        
        // Extract technical terms
        const technicalRegex = /\b(API|URL|HTTP|JSON|HTML|CSS|JS|SQL|DB)\b/g;
        const technical = query.match(technicalRegex) || [];
        entities.push(...technical);
        
        // Extract quoted strings
        const quotedRegex = /"([^"]+)"/g;
        let match;
        while ((match = quotedRegex.exec(query)) !== null) {
            entities.push(match[1]);
        }
        
        return [...new Set(entities)];
    }
    
    /**
     * Extract timeframe from query
     */
    extractTimeframe(query) {
        const now = Date.now();
        const day = 24 * 60 * 60 * 1000;
        
        if (/\b(today|recent|latest)\b/i.test(query)) {
            return { start: now - day, end: now };
        }
        
        if (/\byesterday\b/i.test(query)) {
            return { start: now - 2 * day, end: now - day };
        }
        
        if (/\bthis week\b/i.test(query)) {
            return { start: now - 7 * day, end: now };
        }
        
        if (/\blast week\b/i.test(query)) {
            return { start: now - 14 * day, end: now - 7 * day };
        }
        
        if (/\bthis month\b/i.test(query)) {
            return { start: now - 30 * day, end: now };
        }
        
        return null;
    }
    
    /**
     * Extract keywords (important words)
     */
    extractKeywords(query) {
        const stopWords = new Set([
            'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
            'could', 'should', 'can', 'may', 'might', 'must',
            'i', 'you', 'he', 'she', 'it', 'we', 'they',
            'me', 'him', 'her', 'us', 'them',
            'my', 'your', 'his', 'her', 'its', 'our', 'their',
            'this', 'that', 'these', 'those',
            'what', 'which', 'who', 'when', 'where', 'why', 'how',
            'and', 'or', 'but', 'if', 'because', 'as', 'until', 'while',
            'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
            'into', 'through', 'during', 'before', 'after', 'above', 'below',
            'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under'
        ]);
        
        return this.tokenize(query).filter(token => 
            !stopWords.has(token) && token.length > 2
        );
    }
    
    /**
     * Classify query type
     */
    classifyQuery(query) {
        const scores = {};
        
        for (const [type, config] of Object.entries(this.queryPatterns)) {
            scores[type] = 0;
            
            for (const pattern of config.patterns) {
                if (pattern.test(query)) {
                    scores[type]++;
                }
            }
        }
        
        // Find max score
        const maxType = Object.entries(scores)
            .reduce((max, [type, score]) => 
                score > max.score ? {type, score} : max,
                {type: 'contextual', score: 0}
            );
        
        return maxType.type;
    }
    
    /**
     * Handle temporal query
     */
    async handleTemporalQuery(parsed, options) {
        const timeframe = parsed.timeframe || { start: 0, end: Date.now() };
        
        // Get all nodes in timeframe
        const nodes = Array.from(this.hierarchyManager.tree.nodes.values())
            .filter(node => 
                node.timestamp >= timeframe.start && 
                node.timestamp <= timeframe.end
            );
        
        // Rank by relevance
        const ranked = this.rankByKeywords(nodes, parsed.keywords);
        
        return {
            results: ranked.slice(0, this.config.maxResults),
            metadata: {
                timeframe: timeframe,
                totalMatches: ranked.length
            }
        };
    }
    
    /**
     * Handle causal query
     */
    async handleCausalQuery(parsed, options) {
        const results = [];
        
        // Find nodes matching keywords
        const candidates = this.searchByKeywords(parsed.keywords);
        
        for (const node of candidates.slice(0, this.config.maxResults)) {
            // Get causal chain
            const chain = this.causalReasoner.getCausalChain(node.id);
            
            // Get explanation
            const explanation = this.causalReasoner.explainWhy(node.id);
            
            results.push({
                node: node,
                chain: chain,
                explanation: explanation
            });
        }
        
        return {
            results: results,
            metadata: {
                usedCausalReasoning: true
            }
        };
    }
    
    /**
     * Handle contextual query
     */
    async handleContextualQuery(parsed, options) {
        const tokenLimit = options.tokenLimit || this.config.defaultTokenLimit;
        
        // Find relevant nodes
        const candidates = this.searchByKeywords(parsed.keywords);
        
        if (candidates.length === 0) {
            return {
                results: [],
                metadata: { totalMatches: 0 }
            };
        }
        
        // Get hierarchical context for top match
        const topMatch = candidates[0];
        const context = this.hierarchyManager.getHierarchicalContext(
            topMatch.id,
            tokenLimit
        );
        
        return {
            results: context,
            metadata: {
                primaryNode: topMatch.id,
                totalMatches: candidates.length
            }
        };
    }
    
    /**
     * Handle image query
     */
    async handleImageQuery(parsed, options) {
        let results = [];
        
        // Search by OCR text
        if (parsed.keywords.length > 0) {
            const keywordString = parsed.keywords.join(' ');
            results = this.multiModalHandler.searchByText(keywordString);
        }
        
        // If no text matches, search by type
        if (results.length === 0 && /\b(code|screenshot)\b/i.test(parsed.raw)) {
            results = this.multiModalHandler.searchByType('code');
        } else if (results.length === 0 && /\b(diagram|chart)\b/i.test(parsed.raw)) {
            results = this.multiModalHandler.searchByType('diagram');
        }
        
        return {
            results: results.slice(0, this.config.maxResults),
            metadata: {
                searchType: 'image',
                totalMatches: results.length
            }
        };
    }
    
    /**
     * Handle code query
     */
    async handleCodeQuery(parsed, options) {
        // Search for code blocks
        const nodes = Array.from(this.hierarchyManager.tree.nodes.values());
        
        const codeNodes = nodes.filter(node => {
            const content = node.content.toLowerCase();
            return content.includes('```') || 
                   /\b(function|class|const|let|var)\b/.test(content);
        });
        
        // Rank by keywords
        const ranked = this.rankByKeywords(codeNodes, parsed.keywords);
        
        return {
            results: ranked.slice(0, this.config.maxResults),
            metadata: {
                searchType: 'code',
                totalMatches: ranked.length
            }
        };
    }
    
    /**
     * Handle summary query
     */
    async handleSummaryQuery(parsed, options) {
        // Get all important nodes
        const nodes = Array.from(this.hierarchyManager.tree.nodes.values())
            .filter(node => node.importance > 0.7)
            .sort((a, b) => b.importance - a.importance);
        
        // Filter by timeframe if specified
        let filtered = nodes;
        if (parsed.timeframe) {
            filtered = nodes.filter(node =>
                node.timestamp >= parsed.timeframe.start &&
                node.timestamp <= parsed.timeframe.end
            );
        }
        
        return {
            results: filtered.slice(0, this.config.maxResults),
            metadata: {
                searchType: 'summary',
                totalMatches: filtered.length,
                avgImportance: filtered.reduce((sum, n) => sum + n.importance, 0) / filtered.length
            }
        };
    }
    
    /**
     * Search nodes by keywords
     */
    searchByKeywords(keywords) {
        const nodes = Array.from(this.hierarchyManager.tree.nodes.values());
        return this.rankByKeywords(nodes, keywords);
    }
    
    /**
     * Rank nodes by keyword relevance
     */
    rankByKeywords(nodes, keywords) {
        if (keywords.length === 0) return nodes;
        
        const scored = nodes.map(node => {
            const content = node.content.toLowerCase();
            let score = 0;
            
            for (const keyword of keywords) {
                const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                const matches = (content.match(regex) || []).length;
                score += matches;
            }
            
            // Boost by importance
            score *= (1 + node.importance);
            
            return { node, score };
        });
        
        return scored
            .filter(s => s.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(s => s.node);
    }
    
    /**
     * Post-process results
     */
    postProcessResults(results, options) {
        // Deduplicate using semantic fingerprints
        if (this.config.useSemanticSearch) {
            results.results = this.deduplicateResults(results.results);
        }
        
        // Add relevance scores
        results.results = results.results.map((result, index) => ({
            ...result,
            relevance: 1 - (index / Math.max(results.results.length, 1))
        }));
        
        // Filter by minimum relevance
        results.results = results.results.filter(r => 
            r.relevance >= this.config.minRelevance
        );
        
        return results;
    }
    
    /**
     * Deduplicate results using semantic fingerprints
     */
    deduplicateResults(results) {
        const seen = new Set();
        const deduplicated = [];
        
        for (const result of results) {
            const content = result.content || result.node?.content;
            if (!content) continue;
            
            const fingerprint = this.semanticFingerprint.generateFingerprint(content);
            
            if (!seen.has(fingerprint)) {
                seen.add(fingerprint);
                deduplicated.push(result);
            }
        }
        
        return deduplicated;
    }
    
    /**
     * Format results for LLM consumption
     * @param {Object} results - Query results
     * @returns {string} Formatted context string
     */
    formatForLLM(results) {
        let output = '';
        
        output += `# Context Results (${results.results.length} items)\n\n`;
        
        for (let i = 0; i < results.results.length; i++) {
            const result = results.results[i];
            const node = result.node || result;
            
            output += `## Result ${i + 1}`;
            if (result.relevance) {
                output += ` (${Math.round(result.relevance * 100)}% relevant)`;
            }
            output += '\n\n';
            
            if (node.timestamp) {
                const date = new Date(node.timestamp);
                output += `**Time:** ${date.toLocaleString()}\n`;
            }
            
            if (node.role) {
                output += `**Role:** ${node.role}\n`;
            }
            
            if (node.importance) {
                output += `**Importance:** ${Math.round(node.importance * 100)}%\n`;
            }
            
            output += '\n';
            output += node.content || '';
            output += '\n\n---\n\n';
        }
        
        if (results.metadata) {
            output += `\n## Metadata\n\n`;
            output += JSON.stringify(results.metadata, null, 2);
        }
        
        return output;
    }
    
    /**
     * Get query statistics
     */
    getStats() {
        const recentQueries = this.queryHistory.slice(-100);
        
        const avgExecutionTime = recentQueries.length > 0
            ? recentQueries.reduce((sum, q) => sum + q.executionTime, 0) / recentQueries.length
            : 0;
        
        const typeCounts = {};
        for (const query of recentQueries) {
            typeCounts[query.type] = (typeCounts[query.type] || 0) + 1;
        }
        
        return {
            totalQueries: this.queryHistory.length,
            recentQueries: recentQueries.length,
            avgExecutionTime: avgExecutionTime,
            typeCounts: typeCounts
        };
    }
    
    /**
     * Clear query history
     */
    clearHistory() {
        this.queryHistory = [];
    }
}

// Export for use in extension
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LLMQueryEngine;
}
