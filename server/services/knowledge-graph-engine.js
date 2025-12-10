/**
 * Knowledge Graph Engine - Advanced graph-based memory relationships
 * Tracks temporal, semantic, and causal connections between memories
 */

export class KnowledgeGraphEngine {
  constructor() {
    this.nodes = new Map(); // nodeId -> node data
    this.edges = new Map(); // edgeId -> edge data
    this.nodeIndex = new Map(); // memoryId -> nodeId
    this.temporalIndex = []; // chronologically sorted nodes
    this.causalChains = []; // detected causal relationships
  }

  /**
   * Add memory as node to graph
   * @param {Object} memory - Memory object
   */
  addNode(memory) {
    const nodeId = `node_${memory.id}`;
    
    const node = {
      id: nodeId,
      memoryId: memory.id,
      type: 'memory',
      label: memory.content.substring(0, 50),
      timestamp: memory.timestamp,
      entities: memory.metadata?.entities || [],
      topics: memory.metadata?.topics || [],
      fingerprint: memory.fingerprint,
      properties: {
        role: memory.role,
        wordCount: memory.metadata?.wordCount || 0,
        sentiment: memory.metadata?.sentiment?.label || 'neutral'
      }
    };

    this.nodes.set(nodeId, node);
    this.nodeIndex.set(memory.id, nodeId);
    
    // Update temporal index
    this.temporalIndex.push(nodeId);
    this.temporalIndex.sort((a, b) => {
      const nodeA = this.nodes.get(a);
      const nodeB = this.nodes.get(b);
      return new Date(nodeA.timestamp) - new Date(nodeB.timestamp);
    });

    // Create edges to related nodes
    this.createEdges(nodeId);

    return nodeId;
  }

  /**
   * Create edges between nodes
   * @param {string} nodeId - Source node ID
   */
  createEdges(nodeId) {
    const sourceNode = this.nodes.get(nodeId);
    if (!sourceNode) return;

    // Temporal edges (preceded-by, followed-by)
    const sourceIndex = this.temporalIndex.indexOf(nodeId);
    if (sourceIndex > 0) {
      const prevNodeId = this.temporalIndex[sourceIndex - 1];
      this.addEdge(prevNodeId, nodeId, 'temporal-next', { timeDelta: this.getTimeDelta(prevNodeId, nodeId) });
    }

    // Semantic edges (similar-to)
    this.nodes.forEach((targetNode, targetNodeId) => {
      if (targetNodeId === nodeId) return;

      const similarity = this.calculateSimilarity(sourceNode.fingerprint, targetNode.fingerprint);
      if (similarity > 0.5) {
        this.addEdge(nodeId, targetNodeId, 'semantic-similar', { score: similarity });
      }
    });

    // Entity edges (shares-entity)
    this.nodes.forEach((targetNode, targetNodeId) => {
      if (targetNodeId === nodeId) return;

      const sharedEntities = sourceNode.entities.filter(e => targetNode.entities.includes(e));
      if (sharedEntities.length > 0) {
        this.addEdge(nodeId, targetNodeId, 'entity-related', { entities: sharedEntities });
      }
    });

    // Topic edges (shares-topic)
    this.nodes.forEach((targetNode, targetNodeId) => {
      if (targetNodeId === nodeId) return;

      const sharedTopics = sourceNode.topics.filter(t => targetNode.topics.includes(t));
      if (sharedTopics.length > 0) {
        this.addEdge(nodeId, targetNodeId, 'topic-related', { topics: sharedTopics });
      }
    });

    // Causal edges (detected patterns)
    this.detectCausality(nodeId);
  }

  /**
   * Add edge between two nodes
   * @param {string} sourceId - Source node ID
   * @param {string} targetId - Target node ID
   * @param {string} type - Edge type
   * @param {Object} properties - Edge properties
   */
  addEdge(sourceId, targetId, type, properties = {}) {
    const edgeId = `edge_${sourceId}_${targetId}_${type}`;
    
    if (this.edges.has(edgeId)) return; // Avoid duplicates

    const edge = {
      id: edgeId,
      source: sourceId,
      target: targetId,
      type,
      properties,
      weight: this.calculateEdgeWeight(type, properties),
      createdAt: new Date().toISOString()
    };

    this.edges.set(edgeId, edge);
  }

  /**
   * Get graph data with filters
   * @param {Object} options - Filter options
   * @returns {Object} - Graph data
   */
  getGraph(options = {}) {
    const { nodeLimit = 100, includeEdges = true, minScore = 0.3 } = options;

    // Get nodes (limited)
    const nodeList = Array.from(this.nodes.values()).slice(0, nodeLimit);

    // Get edges
    let edgeList = [];
    if (includeEdges) {
      const nodeIds = new Set(nodeList.map(n => n.id));
      edgeList = Array.from(this.edges.values()).filter(e => 
        nodeIds.has(e.source) && 
        nodeIds.has(e.target) &&
        e.weight >= minScore
      );
    }

    // Calculate node types and edge types
    const nodeTypes = {};
    const edgeTypes = {};

    nodeList.forEach(node => {
      nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1;
    });

    edgeList.forEach(edge => {
      edgeTypes[edge.type] = (edgeTypes[edge.type] || 0) + 1;
    });

    return {
      nodes: nodeList,
      edges: edgeList,
      nodeTypes,
      edgeTypes
    };
  }

  /**
   * Get related nodes for a specific node
   * @param {string} nodeId - Node ID
   * @param {Object} options - Options
   * @returns {Array} - Related nodes
   */
  getRelatedNodes(nodeId, options = {}) {
    const { depth = 1, limit = 20 } = options;

    const visited = new Set();
    const related = [];

    const traverse = (currentId, currentDepth) => {
      if (currentDepth > depth || visited.has(currentId)) return;
      visited.add(currentId);

      // Get outgoing edges
      this.edges.forEach(edge => {
        if (edge.source === currentId && !visited.has(edge.target)) {
          const targetNode = this.nodes.get(edge.target);
          if (targetNode) {
            related.push({
              node: targetNode,
              edge: edge,
              depth: currentDepth
            });
            traverse(edge.target, currentDepth + 1);
          }
        }
      });
    };

    traverse(nodeId, 1);

    return related
      .sort((a, b) => b.edge.weight - a.edge.weight)
      .slice(0, limit);
  }

  /**
   * Get temporal connections
   * @param {Object} options - Filter options
   * @returns {Object} - Temporal data
   */
  getTemporalConnections(options = {}) {
    const { startDate, endDate, minScore = 0.3 } = options;

    let nodes = Array.from(this.nodes.values());

    // Filter by date range
    if (startDate) {
      nodes = nodes.filter(n => new Date(n.timestamp) >= startDate);
    }
    if (endDate) {
      nodes = nodes.filter(n => new Date(n.timestamp) <= endDate);
    }

    // Get temporal edges
    const connections = [];
    const timeline = [];

    nodes.forEach((node, i) => {
      timeline.push({
        timestamp: node.timestamp,
        nodeId: node.id,
        label: node.label
      });

      if (i < nodes.length - 1) {
        const nextNode = nodes[i + 1];
        const timeDelta = new Date(nextNode.timestamp) - new Date(node.timestamp);
        
        if (timeDelta < 24 * 60 * 60 * 1000) { // Within 24 hours
          connections.push({
            from: node.id,
            to: nextNode.id,
            timeDelta,
            type: 'sequential'
          });
        }
      }
    });

    // Detect patterns
    const patterns = this.detectTemporalPatterns(nodes);

    return {
      connections,
      timeline,
      patterns
    };
  }

  /**
   * Get causal relationships
   * @param {Object} options - Options
   * @returns {Object} - Causal data
   */
  getCausalRelationships(options = {}) {
    const { nodeId, minConfidence = 0.5 } = options;

    const causes = [];
    const effects = [];
    const chains = [];

    this.edges.forEach(edge => {
      if (edge.type.includes('causal') && edge.weight >= minConfidence) {
        if (!nodeId || edge.source === nodeId) {
          effects.push({
            from: edge.source,
            to: edge.target,
            confidence: edge.weight,
            type: edge.type
          });
        }

        if (!nodeId || edge.target === nodeId) {
          causes.push({
            from: edge.source,
            to: edge.target,
            confidence: edge.weight,
            type: edge.type
          });
        }
      }
    });

    // Build causal chains
    this.causalChains.forEach(chain => {
      if (!nodeId || chain.nodes.includes(nodeId)) {
        chains.push(chain);
      }
    });

    return {
      causes,
      effects,
      chains
    };
  }

  /**
   * Get graph statistics
   * @returns {Object} - Statistics
   */
  getStatistics() {
    const nodeCount = this.nodes.size;
    const edgeCount = this.edges.size;

    // Calculate density
    const maxEdges = nodeCount * (nodeCount - 1);
    const density = maxEdges > 0 ? edgeCount / maxEdges : 0;

    // Calculate clustering coefficient
    const clustering = this.calculateClustering();

    // Find central nodes
    const centralNodes = this.findCentralNodes(10);

    // Detect communities
    const communities = this.detectCommunities();

    // Temporal metrics
    const temporalMetrics = {
      timespan: this.getTimespan(),
      averageTimeDelta: this.getAverageTimeDelta(),
      temporalClustering: this.getTemporalClustering()
    };

    return {
      nodes: nodeCount,
      edges: edgeCount,
      density,
      clustering,
      centralNodes,
      communities,
      temporalMetrics
    };
  }

  /**
   * Export graph
   * @param {string} format - Export format (json, graphml, cytoscape)
   * @returns {string} - Exported data
   */
  exportGraph(format = 'json') {
    const data = {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values())
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    // Add other formats as needed
    return JSON.stringify(data);
  }

  // ==================== HELPER METHODS ====================

  calculateSimilarity(fp1, fp2) {
    if (!fp1 || !fp2) return 0;
    let dot = 0;
    for (let i = 0; i < Math.min(fp1.length, fp2.length); i++) {
      dot += fp1[i] * fp2[i];
    }
    return Math.max(0, Math.min(1, dot));
  }

  getTimeDelta(nodeId1, nodeId2) {
    const node1 = this.nodes.get(nodeId1);
    const node2 = this.nodes.get(nodeId2);
    if (!node1 || !node2) return 0;
    return Math.abs(new Date(node2.timestamp) - new Date(node1.timestamp));
  }

  calculateEdgeWeight(type, properties) {
    switch (type) {
      case 'semantic-similar':
        return properties.score || 0.5;
      case 'temporal-next':
        return 0.7;
      case 'entity-related':
        return Math.min(1, (properties.entities?.length || 0) * 0.2);
      case 'topic-related':
        return Math.min(1, (properties.topics?.length || 0) * 0.15);
      case 'causal':
        return properties.confidence || 0.6;
      default:
        return 0.5;
    }
  }

  detectCausality(nodeId) {
    // Simple causal detection based on keywords
    const node = this.nodes.get(nodeId);
    if (!node) return;

    const causalKeywords = ['because', 'therefore', 'thus', 'hence', 'so', 'result', 'cause', 'effect', 'lead to', 'due to'];
    const content = node.label.toLowerCase();

    const hasCausalLanguage = causalKeywords.some(kw => content.includes(kw));

    if (hasCausalLanguage) {
      // Look for nearby temporal nodes
      const index = this.temporalIndex.indexOf(nodeId);
      if (index > 0) {
        const prevNodeId = this.temporalIndex[index - 1];
        this.addEdge(prevNodeId, nodeId, 'causal-potential', { confidence: 0.6 });
      }
    }
  }

  detectTemporalPatterns(nodes) {
    // Detect recurring time intervals
    const patterns = [];
    
    if (nodes.length < 3) return patterns;

    const intervals = [];
    for (let i = 1; i < nodes.length; i++) {
      const delta = new Date(nodes[i].timestamp) - new Date(nodes[i - 1].timestamp);
      intervals.push(delta);
    }

    // Find repeated intervals
    const intervalCounts = {};
    intervals.forEach(interval => {
      const rounded = Math.round(interval / (60 * 60 * 1000)); // Round to hours
      intervalCounts[rounded] = (intervalCounts[rounded] || 0) + 1;
    });

    Object.entries(intervalCounts).forEach(([interval, count]) => {
      if (count >= 3) {
        patterns.push({
          type: 'recurring-interval',
          interval: parseInt(interval),
          count
        });
      }
    });

    return patterns;
  }

  calculateClustering() {
    // Simplified clustering coefficient
    let totalCoeff = 0;
    let nodeCount = 0;

    this.nodes.forEach((node, nodeId) => {
      const neighbors = this.getNeighbors(nodeId);
      if (neighbors.length < 2) return;

      let triangles = 0;
      for (let i = 0; i < neighbors.length; i++) {
        for (let j = i + 1; j < neighbors.length; j++) {
          if (this.hasEdge(neighbors[i], neighbors[j])) {
            triangles++;
          }
        }
      }

      const possibleTriangles = (neighbors.length * (neighbors.length - 1)) / 2;
      if (possibleTriangles > 0) {
        totalCoeff += triangles / possibleTriangles;
        nodeCount++;
      }
    });

    return nodeCount > 0 ? totalCoeff / nodeCount : 0;
  }

  getNeighbors(nodeId) {
    const neighbors = new Set();
    this.edges.forEach(edge => {
      if (edge.source === nodeId) neighbors.add(edge.target);
      if (edge.target === nodeId) neighbors.add(edge.source);
    });
    return Array.from(neighbors);
  }

  hasEdge(nodeId1, nodeId2) {
    return Array.from(this.edges.values()).some(edge =>
      (edge.source === nodeId1 && edge.target === nodeId2) ||
      (edge.source === nodeId2 && edge.target === nodeId1)
    );
  }

  findCentralNodes(limit = 10) {
    const centrality = new Map();

    this.nodes.forEach((node, nodeId) => {
      // Degree centrality
      const degree = this.getNeighbors(nodeId).length;
      centrality.set(nodeId, degree);
    });

    return Array.from(centrality.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([nodeId, degree]) => ({
        nodeId,
        degree,
        node: this.nodes.get(nodeId)
      }));
  }

  detectCommunities() {
    // Simplified community detection (groups of highly connected nodes)
    const communities = [];
    const visited = new Set();

    this.nodes.forEach((node, nodeId) => {
      if (visited.has(nodeId)) return;

      const community = new Set([nodeId]);
      visited.add(nodeId);

      const neighbors = this.getNeighbors(nodeId);
      neighbors.forEach(nId => {
        if (!visited.has(nId)) {
          community.add(nId);
          visited.add(nId);
        }
      });

      if (community.size > 1) {
        communities.push({
          size: community.size,
          nodes: Array.from(community)
        });
      }
    });

    return communities.sort((a, b) => b.size - a.size).slice(0, 10);
  }

  getTimespan() {
    if (this.temporalIndex.length === 0) return 0;
    
    const first = this.nodes.get(this.temporalIndex[0]);
    const last = this.nodes.get(this.temporalIndex[this.temporalIndex.length - 1]);
    
    return new Date(last.timestamp) - new Date(first.timestamp);
  }

  getAverageTimeDelta() {
    if (this.temporalIndex.length < 2) return 0;

    let totalDelta = 0;
    for (let i = 1; i < this.temporalIndex.length; i++) {
      totalDelta += this.getTimeDelta(this.temporalIndex[i - 1], this.temporalIndex[i]);
    }

    return totalDelta / (this.temporalIndex.length - 1);
  }

  getTemporalClustering() {
    // Measure how clustered in time the memories are
    if (this.temporalIndex.length < 3) return 0;

    const deltas = [];
    for (let i = 1; i < this.temporalIndex.length; i++) {
      deltas.push(this.getTimeDelta(this.temporalIndex[i - 1], this.temporalIndex[i]));
    }

    const mean = deltas.reduce((sum, d) => sum + d, 0) / deltas.length;
    const variance = deltas.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / deltas.length;
    const stdDev = Math.sqrt(variance);

    return mean > 0 ? stdDev / mean : 0; // Coefficient of variation
  }
}
