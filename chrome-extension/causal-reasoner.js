// Causal Reasoning Engine
// Tracks "why" behind decisions and maintains causality chains

class CausalReasoner {
    constructor(config = {}) {
        this.config = {
            maxChainDepth: config.maxChainDepth || 10,
            inferenceThreshold: config.inferenceThreshold || 0.7,
            decayRate: config.decayRate || 0.1, // Per day
            minConfidence: config.minConfidence || 0.5
        };
        
        this.causalGraph = {
            nodes: new Map(), // id -> {type, content, timestamp}
            edges: new Map()  // fromId -> [{toId, type, confidence}]
        };
        
        this.patterns = this.initializePatterns();
    }
    
    /**
     * Initialize causal patterns
     */
    initializePatterns() {
        return {
            // Question -> Answer patterns
            question: {
                triggers: [/\?$/, /^(what|how|why|when|where|who|which)/i],
                type: 'question',
                nextTypes: ['answer', 'clarification']
            },
            
            // Problem -> Solution patterns
            problem: {
                triggers: [
                    /\b(error|bug|issue|problem|fail|doesn't work|not working)\b/i,
                    /\b(how do i|how to|help with)\b/i
                ],
                type: 'problem',
                nextTypes: ['solution', 'diagnosis']
            },
            
            // Request -> Implementation patterns
            request: {
                triggers: [
                    /\b(can you|could you|please|would you)\b/i,
                    /\b(create|make|build|implement|add|update|fix)\b/i
                ],
                type: 'request',
                nextTypes: ['implementation', 'plan']
            },
            
            // Decision -> Rationale patterns
            decision: {
                triggers: [
                    /\b(i chose|decided to|went with|opted for)\b/i,
                    /\b(because|since|due to|reason)\b/i
                ],
                type: 'decision',
                nextTypes: ['rationale', 'outcome']
            },
            
            // Hypothesis -> Evidence patterns
            hypothesis: {
                triggers: [
                    /\b(i think|maybe|possibly|likely|probably)\b/i,
                    /\b(if|assume|suppose)\b/i
                ],
                type: 'hypothesis',
                nextTypes: ['evidence', 'test']
            }
        };
    }
    
    /**
     * Add message to causal graph
     * @param {Object} message - Message object
     * @param {string} previousMessageId - ID of previous message
     * @returns {Object} {nodeId, causality}
     */
    addMessage(message, previousMessageId = null) {
        const nodeId = message.id || this.generateId();
        
        // Classify message type
        const messageType = this.classifyMessage(message.content);
        
        // Add node
        this.causalGraph.nodes.set(nodeId, {
            id: nodeId,
            type: messageType,
            content: message.content,
            role: message.role,
            timestamp: message.timestamp || Date.now(),
            metadata: message.metadata || {}
        });
        
        // Infer causal links
        const causality = this.inferCausality(nodeId, messageType, previousMessageId);
        
        return {
            nodeId: nodeId,
            causality: causality
        };
    }
    
    /**
     * Classify message type
     */
    classifyMessage(content) {
        const scores = {};
        
        for (const [patternName, pattern] of Object.entries(this.patterns)) {
            scores[pattern.type] = 0;
            
            for (const trigger of pattern.triggers) {
                if (trigger.test(content)) {
                    scores[pattern.type]++;
                }
            }
        }
        
        // Find max score
        const maxType = Object.entries(scores)
            .reduce((max, [type, score]) => 
                score > max.score ? {type, score} : max,
                {type: 'general', score: 0}
            );
        
        return maxType.score > 0 ? maxType.type : 'general';
    }
    
    /**
     * Infer causal relationships
     */
    inferCausality(nodeId, nodeType, previousMessageId) {
        const causality = {
            causes: [],     // What caused this message
            effects: [],    // What this message caused
            confidence: 0
        };
        
        // If no previous message, this is a root cause
        if (!previousMessageId || !this.causalGraph.nodes.has(previousMessageId)) {
            return causality;
        }
        
        const previousNode = this.causalGraph.nodes.get(previousMessageId);
        const previousType = previousNode.type;
        
        // Check if types match expected causal patterns
        const pattern = this.patterns[previousType];
        if (pattern && pattern.nextTypes.includes(nodeType)) {
            const confidence = this.calculateCausalConfidence(previousNode, this.causalGraph.nodes.get(nodeId));
            
            if (confidence >= this.config.inferenceThreshold) {
                // Add edge
                this.addEdge(previousMessageId, nodeId, this.inferEdgeType(previousType, nodeType), confidence);
                
                causality.causes.push({
                    nodeId: previousMessageId,
                    type: previousType,
                    confidence: confidence
                });
            }
        }
        
        // Also check for implicit causality (temporal proximity, semantic similarity)
        const implicitCauses = this.findImplicitCauses(nodeId);
        causality.causes.push(...implicitCauses);
        
        causality.confidence = causality.causes.length > 0
            ? Math.max(...causality.causes.map(c => c.confidence))
            : 0;
        
        return causality;
    }
    
    /**
     * Calculate causal confidence
     */
    calculateCausalConfidence(causeNode, effectNode) {
        let confidence = 0.5; // Base confidence
        
        // Temporal proximity (closer = higher confidence)
        const timeDiff = (effectNode.timestamp - causeNode.timestamp) / (1000 * 60); // minutes
        if (timeDiff < 5) {
            confidence += 0.3;
        } else if (timeDiff < 30) {
            confidence += 0.2;
        } else if (timeDiff < 60) {
            confidence += 0.1;
        }
        
        // Role alternation (user->ai or ai->user = higher confidence)
        if (causeNode.role !== effectNode.role) {
            confidence += 0.2;
        }
        
        // Lexical overlap (shared keywords)
        const overlap = this.calculateLexicalOverlap(causeNode.content, effectNode.content);
        confidence += overlap * 0.2;
        
        return Math.min(confidence, 1.0);
    }
    
    /**
     * Calculate lexical overlap
     */
    calculateLexicalOverlap(text1, text2) {
        const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
        const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 3));
        
        const intersection = new Set([...words1].filter(w => words2.has(w)));
        const union = new Set([...words1, ...words2]);
        
        return union.size > 0 ? intersection.size / union.size : 0;
    }
    
    /**
     * Infer edge type from node types
     */
    inferEdgeType(fromType, toType) {
        const typeMap = {
            'question-answer': 'answers',
            'question-clarification': 'clarifies',
            'problem-solution': 'solves',
            'problem-diagnosis': 'diagnoses',
            'request-implementation': 'implements',
            'request-plan': 'plans',
            'decision-rationale': 'justifies',
            'decision-outcome': 'results_in',
            'hypothesis-evidence': 'supports',
            'hypothesis-test': 'tests'
        };
        
        const key = `${fromType}-${toType}`;
        return typeMap[key] || 'relates_to';
    }
    
    /**
     * Find implicit causes (not matching patterns but still related)
     */
    findImplicitCauses(nodeId) {
        const node = this.causalGraph.nodes.get(nodeId);
        const implicitCauses = [];
        
        // Look at recent nodes (last 10)
        const recentNodes = Array.from(this.causalGraph.nodes.values())
            .filter(n => n.id !== nodeId)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10);
        
        for (const recentNode of recentNodes) {
            // Skip if already has explicit edge
            if (this.hasEdge(recentNode.id, nodeId)) {
                continue;
            }
            
            // Calculate semantic similarity
            const overlap = this.calculateLexicalOverlap(recentNode.content, node.content);
            
            if (overlap >= 0.3) { // Significant overlap
                const timeDiff = (node.timestamp - recentNode.timestamp) / (1000 * 60);
                const confidence = overlap * Math.exp(-timeDiff / 60); // Decay over time
                
                if (confidence >= this.config.minConfidence) {
                    this.addEdge(recentNode.id, nodeId, 'relates_to', confidence);
                    
                    implicitCauses.push({
                        nodeId: recentNode.id,
                        type: recentNode.type,
                        confidence: confidence
                    });
                }
            }
        }
        
        return implicitCauses;
    }
    
    /**
     * Add edge to graph
     */
    addEdge(fromId, toId, type, confidence) {
        if (!this.causalGraph.edges.has(fromId)) {
            this.causalGraph.edges.set(fromId, []);
        }
        
        this.causalGraph.edges.get(fromId).push({
            toId: toId,
            type: type,
            confidence: confidence,
            timestamp: Date.now()
        });
    }
    
    /**
     * Check if edge exists
     */
    hasEdge(fromId, toId) {
        const edges = this.causalGraph.edges.get(fromId);
        return edges ? edges.some(e => e.toId === toId) : false;
    }
    
    /**
     * Get causal chain for a node
     * @param {string} nodeId - Node ID
     * @param {number} maxDepth - Maximum chain depth
     * @returns {Array} Chain of nodes
     */
    getCausalChain(nodeId, maxDepth = null) {
        maxDepth = maxDepth || this.config.maxChainDepth;
        
        const chain = [];
        const visited = new Set();
        
        const traverse = (currentId, depth) => {
            if (depth >= maxDepth || visited.has(currentId)) {
                return;
            }
            
            visited.add(currentId);
            const node = this.causalGraph.nodes.get(currentId);
            
            if (!node) return;
            
            // Get incoming edges (causes)
            const causes = [];
            for (const [fromId, edges] of this.causalGraph.edges.entries()) {
                for (const edge of edges) {
                    if (edge.toId === currentId) {
                        causes.push({
                            fromId: fromId,
                            ...edge
                        });
                    }
                }
            }
            
            // Sort by confidence
            causes.sort((a, b) => b.confidence - a.confidence);
            
            // Traverse causes
            for (const cause of causes) {
                traverse(cause.fromId, depth + 1);
            }
            
            // Add current node
            chain.push({
                ...node,
                depth: depth,
                causes: causes.map(c => ({
                    nodeId: c.fromId,
                    type: c.type,
                    confidence: c.confidence
                }))
            });
        };
        
        traverse(nodeId, 0);
        
        return chain;
    }
    
    /**
     * Get "why" explanation for a node
     * @param {string} nodeId - Node ID
     * @returns {string} Natural language explanation
     */
    explainWhy(nodeId) {
        const chain = this.getCausalChain(nodeId);
        
        if (chain.length === 0) {
            return "No causal history found.";
        }
        
        // Build explanation
        const explanations = [];
        
        for (let i = chain.length - 1; i >= 0; i--) {
            const node = chain[i];
            
            if (node.causes.length > 0) {
                const cause = node.causes[0]; // Highest confidence
                const causeNode = this.causalGraph.nodes.get(cause.nodeId);
                
                if (causeNode) {
                    const preview = this.previewContent(causeNode.content);
                    explanations.push(
                        `${this.typeToVerb(cause.type)} "${preview}" (confidence: ${Math.round(cause.confidence * 100)}%)`
                    );
                }
            }
        }
        
        return explanations.join('\n→ ');
    }
    
    /**
     * Convert edge type to verb
     */
    typeToVerb(edgeType) {
        const verbMap = {
            'answers': 'Answers',
            'clarifies': 'Clarifies',
            'solves': 'Solves',
            'diagnoses': 'Diagnoses',
            'implements': 'Implements',
            'plans': 'Plans',
            'justifies': 'Justifies',
            'results_in': 'Results in',
            'supports': 'Supports',
            'tests': 'Tests',
            'relates_to': 'Related to'
        };
        
        return verbMap[edgeType] || 'Related to';
    }
    
    /**
     * Preview content (first 50 chars)
     */
    previewContent(content) {
        return content.length > 50 
            ? content.substring(0, 50) + '...'
            : content;
    }
    
    /**
     * Apply temporal decay to confidences
     */
    applyDecay() {
        const now = Date.now();
        const dayInMs = 24 * 60 * 60 * 1000;
        
        for (const edges of this.causalGraph.edges.values()) {
            for (const edge of edges) {
                const daysOld = (now - edge.timestamp) / dayInMs;
                edge.confidence *= Math.exp(-this.config.decayRate * daysOld);
            }
        }
        
        // Remove low-confidence edges
        for (const [fromId, edges] of this.causalGraph.edges.entries()) {
            const filtered = edges.filter(e => e.confidence >= this.config.minConfidence);
            
            if (filtered.length === 0) {
                this.causalGraph.edges.delete(fromId);
            } else {
                this.causalGraph.edges.set(fromId, filtered);
            }
        }
    }
    
    /**
     * Get related nodes (same causal chain)
     */
    getRelatedNodes(nodeId) {
        const chain = this.getCausalChain(nodeId);
        return chain.map(n => n.id).filter(id => id !== nodeId);
    }
    
    /**
     * Generate ID
     */
    generateId() {
        return 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Get statistics
     */
    getStats() {
        let totalEdges = 0;
        let avgConfidence = 0;
        
        for (const edges of this.causalGraph.edges.values()) {
            totalEdges += edges.length;
            avgConfidence += edges.reduce((sum, e) => sum + e.confidence, 0);
        }
        
        avgConfidence = totalEdges > 0 ? avgConfidence / totalEdges : 0;
        
        // Count node types
        const typeCounts = {};
        for (const node of this.causalGraph.nodes.values()) {
            typeCounts[node.type] = (typeCounts[node.type] || 0) + 1;
        }
        
        return {
            nodeCount: this.causalGraph.nodes.size,
            edgeCount: totalEdges,
            avgConfidence: avgConfidence,
            typeCounts: typeCounts
        };
    }
    
    /**
     * Serialize
     */
    serialize() {
        return {
            version: '1.0',
            config: this.config,
            nodes: Array.from(this.causalGraph.nodes.entries()),
            edges: Array.from(this.causalGraph.edges.entries()),
            timestamp: Date.now()
        };
    }
    
    /**
     * Deserialize
     */
    static deserialize(data) {
        const reasoner = new CausalReasoner(data.config);
        
        reasoner.causalGraph.nodes = new Map(data.nodes);
        reasoner.causalGraph.edges = new Map(data.edges);
        
        return reasoner;
    }
}

// Export for use in extension
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CausalReasoner;
}
