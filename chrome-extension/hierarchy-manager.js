// Hierarchical Context Manager
// Organizes conversation into tree structure for optimal LLM context retrieval

class HierarchyManager {
    constructor(config = {}) {
        this.config = {
            maxDepth: config.maxDepth || 5,
            topicShiftThreshold: config.topicShiftThreshold || 0.4,
            similarityThreshold: config.similarityThreshold || 0.7,
            maxBranchSpan: config.maxBranchSpan || 20, // messages
            pruneThreshold: config.pruneThreshold || 0.3
        };
        
        this.tree = {
            root: null,
            nodes: new Map(),
            branches: new Map(),
            currentPath: [],
            metadata: {
                totalNodes: 0,
                maxDepth: 0,
                activeBranches: 0
            }
        };
        
        this.initializeRoot();
    }
    
    /**
     * Initialize the root node
     */
    initializeRoot() {
        this.tree.root = {
            id: 'root',
            type: 'root',
            content: 'Conversation Root',
            depth: 0,
            children: [],
            metadata: {
                created: Date.now(),
                messageCount: 0
            }
        };
        
        this.tree.nodes.set('root', this.tree.root);
        this.tree.currentPath = ['root'];
    }
    
    /**
     * Add a new message to the hierarchy
     * @param {Object} message - {role, content, timestamp, entities, intent}
     * @returns {Object} Created node
     */
    addMessage(message) {
        // Detect if this should create a new branch or continue current
        const shouldBranch = this.detectTopicShift(message);
        
        const parentId = shouldBranch 
            ? this.findBestBranchPoint(message)
            : this.tree.currentPath[this.tree.currentPath.length - 1];
        
        const node = this.createNode(message, parentId);
        
        // Update current path
        if (shouldBranch) {
            // Start new branch
            this.tree.currentPath = this.getPathToNode(parentId);
            this.tree.currentPath.push(node.id);
        } else {
            // Continue current branch
            this.tree.currentPath.push(node.id);
        }
        
        // Limit path length
        if (this.tree.currentPath.length > this.config.maxBranchSpan) {
            this.tree.currentPath = this.tree.currentPath.slice(-this.config.maxBranchSpan);
        }
        
        return node;
    }
    
    /**
     * Create a new node
     */
    createNode(message, parentId) {
        const parent = this.tree.nodes.get(parentId);
        
        const node = {
            id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'message',
            role: message.role,
            content: message.content,
            parentId: parentId,
            children: [],
            depth: parent.depth + 1,
            metadata: {
                timestamp: message.timestamp || Date.now(),
                entities: message.entities || [],
                intent: message.intent || 'unknown',
                importance: this.calculateImportance(message),
                topicKeywords: this.extractTopicKeywords(message.content),
                semanticHash: this.generateSemanticHash(message.content)
            }
        };
        
        // Add to parent's children
        parent.children.push(node.id);
        
        // Store in nodes map
        this.tree.nodes.set(node.id, node);
        
        // Update metadata
        this.tree.metadata.totalNodes++;
        this.tree.metadata.maxDepth = Math.max(this.tree.metadata.maxDepth, node.depth);
        
        return node;
    }
    
    /**
     * Detect if message represents a topic shift
     */
    detectTopicShift(message) {
        if (this.tree.currentPath.length <= 1) return false;
        
        // Get recent nodes in current branch
        const recentNodes = this.tree.currentPath
            .slice(-5)
            .map(id => this.tree.nodes.get(id))
            .filter(n => n && n.type === 'message');
        
        if (recentNodes.length === 0) return false;
        
        // Calculate topic similarity with recent messages
        const similarities = recentNodes.map(node => 
            this.calculateTopicSimilarity(message, node)
        );
        
        const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;
        
        // Topic shift if similarity is below threshold
        return avgSimilarity < this.config.topicShiftThreshold;
    }
    
    /**
     * Calculate topic similarity between two messages
     */
    calculateTopicSimilarity(msg1, msg2) {
        const keywords1 = new Set(this.extractTopicKeywords(msg1.content));
        const keywords2 = new Set(
            msg2.metadata?.topicKeywords || this.extractTopicKeywords(msg2.content)
        );
        
        // Jaccard similarity
        const intersection = new Set([...keywords1].filter(x => keywords2.has(x)));
        const union = new Set([...keywords1, ...keywords2]);
        
        return union.size > 0 ? intersection.size / union.size : 0;
    }
    
    /**
     * Extract topic keywords from text
     */
    extractTopicKeywords(text) {
        const stopwords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'been', 'be',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'can', 'this', 'that', 'i', 'you', 'it', 'we', 'they'
        ]);
        
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 3 && !stopwords.has(w));
        
        // Return top keywords (frequency-based)
        const freq = {};
        words.forEach(w => freq[w] = (freq[w] || 0) + 1);
        
        return Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word]) => word);
    }
    
    /**
     * Find best branch point for new topic
     */
    findBestBranchPoint(message) {
        // Strategy: Branch from the most similar ancestor
        const path = this.tree.currentPath.slice(0, -2); // Exclude very recent
        
        if (path.length <= 1) return 'root';
        
        const scores = path.map(nodeId => {
            const node = this.tree.nodes.get(nodeId);
            if (!node || node.type !== 'message') return { nodeId, score: 0 };
            
            const similarity = this.calculateTopicSimilarity(message, node);
            const recencyBonus = 1 / (this.tree.currentPath.indexOf(nodeId) + 1);
            
            return {
                nodeId,
                score: similarity * 0.7 + recencyBonus * 0.3
            };
        });
        
        scores.sort((a, b) => b.score - a.score);
        
        return scores[0].score > 0.3 ? scores[0].nodeId : 'root';
    }
    
    /**
     * Get path from root to specific node
     */
    getPathToNode(nodeId) {
        const path = [];
        let current = nodeId;
        
        while (current) {
            path.unshift(current);
            const node = this.tree.nodes.get(current);
            current = node?.parentId;
        }
        
        return path;
    }
    
    /**
     * Calculate importance score for a message
     */
    calculateImportance(message) {
        let score = 0.5; // Base score
        
        // Question bonus
        if (message.content.includes('?')) score += 0.1;
        
        // Decision keywords
        const decisionKeywords = ['decided', 'choose', 'selected', 'using', 'instead'];
        if (decisionKeywords.some(kw => message.content.toLowerCase().includes(kw))) {
            score += 0.2;
        }
        
        // Code block bonus
        if (message.content.includes('```')) score += 0.15;
        
        // Length bonus (but not too long)
        const length = message.content.length;
        if (length > 100 && length < 1000) score += 0.05;
        
        return Math.min(1.0, score);
    }
    
    /**
     * Generate semantic hash for message
     */
    generateSemanticHash(text) {
        // Simple hash - will be replaced by SemanticFingerprintV2
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }
    
    /**
     * Get hierarchical context for LLM
     * @param {number} maxNodes - Maximum nodes to include
     * @param {number} maxTokens - Approximate token limit
     * @returns {Array} Ordered array of nodes
     */
    getHierarchicalContext(maxNodes = 20, maxTokens = 2000) {
        const context = [];
        let tokenCount = 0;
        
        // Strategy: Include path from root to current, plus important side branches
        
        // 1. Get current path
        const currentPath = this.tree.currentPath.map(id => this.tree.nodes.get(id));
        
        // 2. Collect important nodes from current path
        const pathNodes = currentPath
            .filter(n => n && n.type === 'message')
            .sort((a, b) => b.metadata.importance - a.metadata.importance)
            .slice(0, Math.floor(maxNodes * 0.6));
        
        // 3. Collect important nodes from other branches
        const otherNodes = Array.from(this.tree.nodes.values())
            .filter(n => 
                n.type === 'message' && 
                !pathNodes.includes(n) &&
                n.metadata.importance > 0.7
            )
            .sort((a, b) => b.metadata.importance - a.metadata.importance)
            .slice(0, Math.floor(maxNodes * 0.4));
        
        // 4. Combine and sort by timestamp
        const allNodes = [...pathNodes, ...otherNodes]
            .sort((a, b) => a.metadata.timestamp - b.metadata.timestamp);
        
        // 5. Build context respecting token limit
        for (const node of allNodes) {
            const estimatedTokens = Math.ceil(node.content.length / 4);
            
            if (tokenCount + estimatedTokens > maxTokens) break;
            
            context.push({
                role: node.role,
                content: node.content,
                depth: node.depth,
                importance: node.metadata.importance,
                timestamp: node.metadata.timestamp
            });
            
            tokenCount += estimatedTokens;
        }
        
        return context;
    }
    
    /**
     * Prune dead branches (low importance, old)
     */
    pruneDeadBranches() {
        const now = Date.now();
        const pruneAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        
        const toPrune = [];
        
        for (const [id, node] of this.tree.nodes.entries()) {
            if (node.type !== 'message') continue;
            
            const age = now - node.metadata.timestamp;
            const isOld = age > pruneAge;
            const isUnimportant = node.metadata.importance < this.config.pruneThreshold;
            const hasNoChildren = node.children.length === 0;
            
            if (isOld && isUnimportant && hasNoChildren) {
                toPrune.push(id);
            }
        }
        
        // Remove pruned nodes
        for (const id of toPrune) {
            const node = this.tree.nodes.get(id);
            
            // Remove from parent's children
            const parent = this.tree.nodes.get(node.parentId);
            if (parent) {
                parent.children = parent.children.filter(cid => cid !== id);
            }
            
            // Delete node
            this.tree.nodes.delete(id);
            this.tree.metadata.totalNodes--;
        }
        
        return toPrune.length;
    }
    
    /**
     * Serialize tree to JSON
     */
    serialize() {
        return {
            version: '1.0',
            tree: {
                rootId: this.tree.root.id,
                nodes: Array.from(this.tree.nodes.entries()),
                currentPath: this.tree.currentPath,
                metadata: this.tree.metadata
            },
            config: this.config,
            timestamp: Date.now()
        };
    }
    
    /**
     * Deserialize tree from JSON
     */
    static deserialize(data) {
        const manager = new HierarchyManager(data.config);
        
        manager.tree.root = data.tree.nodes.find(([id]) => id === 'root')[1];
        manager.tree.nodes = new Map(data.tree.nodes);
        manager.tree.currentPath = data.tree.currentPath;
        manager.tree.metadata = data.tree.metadata;
        
        return manager;
    }
    
    /**
     * Get statistics
     */
    getStats() {
        return {
            totalNodes: this.tree.metadata.totalNodes,
            maxDepth: this.tree.metadata.maxDepth,
            currentBranch: this.tree.currentPath.length,
            averageImportance: this.calculateAverageImportance(),
            memorySize: JSON.stringify(this.serialize()).length
        };
    }
    
    calculateAverageImportance() {
        const messages = Array.from(this.tree.nodes.values())
            .filter(n => n.type === 'message');
        
        if (messages.length === 0) return 0;
        
        const sum = messages.reduce((acc, n) => acc + n.metadata.importance, 0);
        return sum / messages.length;
    }
}

// Export for use in extension
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HierarchyManager;
}
