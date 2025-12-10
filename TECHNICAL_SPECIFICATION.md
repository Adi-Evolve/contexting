# Semantic Memory Graph (SMG) - Technical Specification

## Version 1.0 - December 2025

---

## 1. System Architecture

### 1.1 Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Chat Interface (UI)                    │
│  • Message input/output                                     │
│  • Memory status indicator                                  │
│  • Graph visualization                                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                  Memory Manager (Core)                      │
│  • Conversation tracker                                     │
│  • Semantic analyzer                                        │
│  • Context builder                                          │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┬─────────────┬────────────────┐
        ▼                     ▼             ▼                ▼
┌───────────────┐    ┌────────────┐  ┌──────────┐  ┌──────────────┐
│  Graph Engine │    │  NLP       │  │ Storage  │  │  Compression │
│               │    │  Processor │  │ Layer    │  │  Engine      │
│ • Node mgmt   │    │            │  │          │  │              │
│ • Queries     │    │ • Extract  │  │• IndexDB │  │ • Brotli     │
│ • Traversal   │    │ • Classify │  │• OPFS    │  │ • Delta      │
└───────────────┘    └────────────┘  └──────────┘  └──────────────┘
```

---

## 2. Data Flow Architecture

### 2.1 Message Processing Pipeline

```
User Message
    ↓
[1] Store Raw Message → IndexedDB
    ↓
[2] NLP Analysis
    ├─→ Entity Extraction (libraries, APIs, files)
    ├─→ Intent Classification (question, command, info)
    ├─→ Decision Detection (choosing, deciding, fixing)
    └─→ Artifact Detection (code blocks, files)
    ↓
[3] Graph Update
    ├─→ Create/Update Nodes
    ├─→ Establish Relationships
    └─→ Calculate Importance Scores
    ↓
[4] Working Memory Update
    ├─→ Add to recent context (if important)
    └─→ Refresh current goals
    ↓
[5] Context Injection
    └─→ Build AI prompt with relevant history
    ↓
AI Response
    ↓
[6] Response Analysis
    └─→ Extract artifacts from AI response
    ↓
[7] Update Graph (same as step 3)
```

### 2.2 Memory Save Pipeline

```
User clicks "Save Memory"
    ↓
[1] Snapshot Current State
    ├─→ Working memory
    ├─→ Semantic graph
    └─→ Raw conversation
    ↓
[2] Deduplication Pass
    └─→ Find identical artifacts → Store once
    ↓
[3] Versioning Analysis
    └─→ For modified artifacts → Create delta
    ↓
[4] Archive Compression
    └─→ Old conversation blocks → Brotli compress
    ↓
[5] Graph Optimization
    ├─→ Prune weak relationships
    └─→ Merge duplicate nodes
    ↓
[6] Serialize to JSON-LD
    ↓
[7] Optional: Brotli compress entire file
    ↓
[8] Download .smg file
```

### 2.3 Memory Load Pipeline

```
User uploads .smg file
    ↓
[1] Parse JSON-LD
    ↓
[2] Validate Schema
    └─→ Check version compatibility
    ↓
[3] Load Working Memory → System Prompt
    ↓
[4] Index Semantic Graph → In-memory structure
    ↓
[5] Register Artifacts → Local cache
    ↓
[6] Initialize Deep Archive (lazy)
    ↓
[7] Display "Memory Loaded" + summary
    └─→ Show: Project name, total exchanges, last modified
    ↓
User continues conversation
    ↓
[8] On Query → Semantic search graph → Inject relevant context
```

---

## 3. Core Algorithms

### 3.1 Concept Extraction Algorithm

```javascript
function extractConcepts(text) {
  // Tokenize and clean
  const tokens = tokenize(text);
  const cleaned = removeStopwords(tokens);
  
  // Extract named entities
  const entities = ner.extract(text); // libraries, APIs, frameworks
  
  // Extract technical terms (noun phrases)
  const techTerms = pos.extractNounPhrases(text)
    .filter(phrase => isTechnical(phrase));
  
  // Combine and score
  const concepts = [...entities, ...techTerms]
    .map(concept => ({
      label: concept,
      confidence: calculateConfidence(concept, text),
      type: classifyConceptType(concept)
    }))
    .filter(c => c.confidence > 0.5);
  
  return concepts;
}

function calculateConfidence(concept, text) {
  const frequency = countOccurrences(concept, text);
  const contextQuality = hasStrongContext(concept, text); // near keywords like "using", "implemented"
  const capitalization = isProperlyCapitalized(concept);
  
  return (frequency * 0.4) + (contextQuality * 0.4) + (capitalization * 0.2);
}
```

### 3.2 Decision Detection Algorithm

```javascript
function detectDecision(message) {
  const decisionPatterns = [
    /(?:let's|let us) (?:use|go with|choose|implement)/i,
    /(?:we'll|we will) (?:use|go with|choose|implement)/i,
    /(?:decided to|going with|choosing)/i,
    /(?:better to|prefer|rather than)/i,
    /(?:instead of|rather than) .+ (?:we'll|we will|let's)/i
  ];
  
  for (const pattern of decisionPatterns) {
    const match = message.match(pattern);
    if (match) {
      return {
        isDecision: true,
        trigger: match[0],
        options: extractOptions(message),
        rationale: extractRationale(message)
      };
    }
  }
  
  return { isDecision: false };
}

function extractOptions(message) {
  // Look for "A vs B", "A or B", "either A or B"
  const vsPattern = /(\w+(?:\s+\w+)*)\s+(?:vs|versus|or|instead of)\s+(\w+(?:\s+\w+)*)/i;
  const match = message.match(vsPattern);
  
  if (match) {
    return [match[1].trim(), match[2].trim()];
  }
  
  return [];
}

function extractRationale(message) {
  // Look for "because", "since", "due to"
  const rationalePattern = /(?:because|since|due to|as)\s+(.+?)(?:\.|$)/i;
  const match = message.match(rationalePattern);
  
  return match ? match[1].trim() : null;
}
```

### 3.3 Importance Scoring Algorithm

```javascript
function calculateImportance(node, graph, turn, totalTurns) {
  // 1. Recency factor (0-1)
  const age = totalTurns - turn;
  const recencyFactor = 1 / (1 + Math.log(age + 1));
  
  // 2. Decision density (0-1)
  const decisionKeywords = ['decided', 'chose', 'implemented', 'fixed', 'solved'];
  const decisionCount = countKeywords(node.content, decisionKeywords);
  const decisionDensity = Math.min(decisionCount / 3, 1);
  
  // 3. Artifact presence (0-1)
  const artifactPresence = node.hasArtifact ? 1 : 0;
  
  // 4. Relationship centrality (0-1)
  const nodeConnections = graph.getEdges(node.id).length;
  const maxConnections = Math.max(...graph.nodes.map(n => graph.getEdges(n.id).length));
  const centralityScore = maxConnections > 0 ? nodeConnections / maxConnections : 0;
  
  // 5. User feedback (0-1) - if user referenced this node again
  const reactivationBonus = node.reactivationCount * 0.2;
  
  // Weighted combination
  const importance = 
    (0.25 * recencyFactor) +
    (0.30 * decisionDensity) +
    (0.20 * artifactPresence) +
    (0.15 * centralityScore) +
    (0.10 * Math.min(reactivationBonus, 1));
  
  return Math.min(importance, 1);
}
```

### 3.4 Smart Context Injection Algorithm

```javascript
async function buildContextForAI(userQuery, memoryGraph, tokenBudget = 8000) {
  const context = {
    systemPrompt: [],
    workingMemory: [],
    semanticContext: [],
    artifacts: []
  };
  
  let usedTokens = 0;
  
  // 1. Always include system prompt (fixed)
  context.systemPrompt = buildSystemPrompt(memoryGraph.metadata);
  usedTokens += estimateTokens(context.systemPrompt);
  
  // 2. Always include working memory
  context.workingMemory = memoryGraph.workingMemory.recentContext;
  usedTokens += estimateTokens(context.workingMemory);
  
  // 3. Semantic search for relevant nodes
  const relevantNodes = await semanticSearch(
    userQuery, 
    memoryGraph.semanticGraph,
    topK: 10
  );
  
  // 4. Expand graph (get connected nodes)
  const expandedNodes = expandGraphContext(relevantNodes, memoryGraph, maxDepth: 2);
  
  // 5. Sort by importance and add until budget exhausted
  const sortedNodes = expandedNodes.sort((a, b) => b.importance - a.importance);
  
  for (const node of sortedNodes) {
    const nodeText = formatNodeForPrompt(node);
    const nodeTokens = estimateTokens(nodeText);
    
    if (usedTokens + nodeTokens < tokenBudget * 0.7) { // Reserve 30% for artifacts
      context.semanticContext.push(nodeText);
      usedTokens += nodeTokens;
    } else {
      break;
    }
  }
  
  // 6. Add referenced artifacts
  const artifactRefs = extractArtifactReferences(sortedNodes);
  for (const artRef of artifactRefs) {
    const artifact = memoryGraph.artifactVault.artifacts[artRef];
    const artTokens = estimateTokens(artifact.content);
    
    if (usedTokens + artTokens < tokenBudget * 0.95) { // Use up to 95% budget
      context.artifacts.push(artifact);
      usedTokens += artTokens;
    }
  }
  
  return assemblePrompt(context);
}

function semanticSearch(query, graph, topK) {
  // Simple TF-IDF based search (can be enhanced with embeddings)
  const queryTerms = tokenize(query.toLowerCase());
  
  const scores = graph.nodes.map(node => {
    const nodeText = `${node.label} ${node.description}`.toLowerCase();
    const nodeTerms = tokenize(nodeText);
    
    // Calculate term overlap
    const overlap = queryTerms.filter(term => nodeTerms.includes(term)).length;
    const score = (overlap / queryTerms.length) * node.importance;
    
    return { node, score };
  });
  
  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(s => s.node);
}
```

### 3.5 Artifact Deduplication Algorithm

```javascript
function deduplicateArtifacts(conversation) {
  const artifactMap = new Map(); // hash -> artifact
  const referenceMap = new Map(); // turnId -> artifactId
  
  for (const turn of conversation) {
    const artifacts = extractArtifacts(turn.content);
    
    for (const artifact of artifacts) {
      const hash = hashContent(artifact.content);
      
      if (artifactMap.has(hash)) {
        // Duplicate found - create reference
        const artifactId = artifactMap.get(hash).id;
        referenceMap.set(`${turn.id}_${artifact.index}`, artifactId);
      } else {
        // New artifact - store it
        const artifactId = generateId();
        artifactMap.set(hash, { id: artifactId, ...artifact });
      }
    }
  }
  
  return {
    uniqueArtifacts: Array.from(artifactMap.values()),
    references: referenceMap
  };
}

function hashContent(content) {
  // Simple SHA-256 hash
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(content))
    .then(buffer => bufferToHex(buffer));
}
```

### 3.6 Delta Compression Algorithm

```javascript
function createDelta(oldContent, newContent) {
  // Use Myers diff algorithm (similar to git)
  const diff = Diff.createPatch('', oldContent, newContent);
  
  // Convert to compact format
  const delta = {
    changes: [],
    totalLines: newContent.split('\n').length
  };
  
  // Parse unified diff
  const lines = diff.split('\n');
  let currentHunk = null;
  
  for (const line of lines) {
    if (line.startsWith('@@')) {
      // New hunk
      const match = line.match(/@@ -(\d+),(\d+) \+(\d+),(\d+) @@/);
      currentHunk = {
        oldStart: parseInt(match[1]),
        oldLines: parseInt(match[2]),
        newStart: parseInt(match[3]),
        newLines: parseInt(match[4]),
        additions: [],
        deletions: []
      };
      delta.changes.push(currentHunk);
    } else if (line.startsWith('+') && currentHunk) {
      currentHunk.additions.push(line.substring(1));
    } else if (line.startsWith('-') && currentHunk) {
      currentHunk.deletions.push(line.substring(1));
    }
  }
  
  return delta;
}

function applyDelta(baseContent, delta) {
  const lines = baseContent.split('\n');
  
  // Apply changes in reverse order (to maintain line numbers)
  for (const change of delta.changes.reverse()) {
    // Remove deletions
    lines.splice(change.oldStart - 1, change.deletions.length);
    
    // Add additions
    lines.splice(change.newStart - 1, 0, ...change.additions);
  }
  
  return lines.join('\n');
}
```

---

## 4. Storage Layer

### 4.1 IndexedDB Schema

```javascript
const dbSchema = {
  name: 'SMG_Database',
  version: 1,
  stores: {
    // Raw conversation history
    conversations: {
      keyPath: 'id',
      indexes: [
        { name: 'projectId', keyPath: 'projectId' },
        { name: 'timestamp', keyPath: 'timestamp' }
      ]
    },
    
    // Individual messages
    messages: {
      keyPath: 'id',
      indexes: [
        { name: 'conversationId', keyPath: 'conversationId' },
        { name: 'turn', keyPath: 'turn' },
        { name: 'timestamp', keyPath: 'timestamp' }
      ]
    },
    
    // Semantic graph nodes
    nodes: {
      keyPath: 'id',
      indexes: [
        { name: 'conversationId', keyPath: 'conversationId' },
        { name: 'type', keyPath: 'type' },
        { name: 'importance', keyPath: 'importance' }
      ]
    },
    
    // Semantic graph edges
    edges: {
      keyPath: 'id',
      indexes: [
        { name: 'from', keyPath: 'from' },
        { name: 'to', keyPath: 'to' },
        { name: 'conversationId', keyPath: 'conversationId' }
      ]
    },
    
    // Artifacts
    artifacts: {
      keyPath: 'id',
      indexes: [
        { name: 'hash', keyPath: 'hash', unique: true },
        { name: 'conversationId', keyPath: 'conversationId' },
        { name: 'type', keyPath: 'type' }
      ]
    },
    
    // Working memory state
    workingMemory: {
      keyPath: 'conversationId'
    }
  }
};
```

### 4.2 OPFS (Origin Private File System) for Large Artifacts

```javascript
// For artifacts >1MB, store in OPFS instead of IndexedDB
async function storeLargeArtifact(artifact, conversationId) {
  const opfsRoot = await navigator.storage.getDirectory();
  const conversationDir = await opfsRoot.getDirectoryHandle(conversationId, { create: true });
  
  const fileName = `${artifact.id}.${artifact.type}`;
  const fileHandle = await conversationDir.getFileHandle(fileName, { create: true });
  
  const writable = await fileHandle.createWritable();
  await writable.write(artifact.content);
  await writable.close();
  
  return {
    id: artifact.id,
    type: artifact.type,
    storedIn: 'opfs',
    path: `${conversationId}/${fileName}`,
    size: artifact.content.length
  };
}

async function retrieveLargeArtifact(conversationId, artifactId, type) {
  const opfsRoot = await navigator.storage.getDirectory();
  const conversationDir = await opfsRoot.getDirectoryHandle(conversationId);
  
  const fileName = `${artifactId}.${type}`;
  const fileHandle = await conversationDir.getFileHandle(fileName);
  
  const file = await fileHandle.getFile();
  const content = await file.text();
  
  return content;
}
```

---

## 5. Compression Specifications

### 5.1 Brotli Compression

```javascript
import { compress, decompress } from 'fflate';

async function compressData(data) {
  const jsonString = JSON.stringify(data);
  const encoder = new TextEncoder();
  const uint8Array = encoder.encode(jsonString);
  
  // Brotli compression (level 11 = maximum compression)
  const compressed = compress(uint8Array, { 
    level: 11,
    mem: 12 // Memory level for better compression
  });
  
  // Convert to base64 for JSON storage
  return btoa(String.fromCharCode(...compressed));
}

async function decompressData(compressedBase64) {
  // Convert from base64
  const compressed = Uint8Array.from(atob(compressedBase64), c => c.charCodeAt(0));
  
  // Decompress
  const decompressed = decompress(compressed);
  
  // Convert back to JSON
  const decoder = new TextDecoder();
  const jsonString = decoder.decode(decompressed);
  
  return JSON.parse(jsonString);
}
```

### 5.2 Compression Ratio Targets

| Data Type | Target Ratio | Notes |
|-----------|--------------|-------|
| Plain text conversation | 90-95% | High redundancy, excellent compression |
| Code artifacts (first version) | 80-85% | Whitespace, comments compress well |
| Code artifacts (deltas) | 95-98% | Only changes stored |
| Semantic graph (JSON) | 70-80% | Structured data, moderate compression |
| Working memory | 60-70% | Small size, less benefit |

### 5.3 Adaptive Compression Strategy

```javascript
function chooseCompressionStrategy(dataSize, dataType) {
  if (dataSize < 1024) {
    // Don't compress tiny data (overhead not worth it)
    return 'none';
  } else if (dataSize < 10240) {
    // Fast compression for small data
    return { method: 'brotli', level: 4 };
  } else if (dataType === 'code' || dataType === 'text') {
    // Maximum compression for text-based data
    return { method: 'brotli', level: 11 };
  } else {
    // Balanced compression for mixed data
    return { method: 'brotli', level: 7 };
  }
}
```

---

## 6. API Specifications

### 6.1 Memory Manager API

```typescript
interface MemoryManager {
  // Initialize a new conversation
  createConversation(projectName: string, description?: string): Promise<string>; // returns conversationId
  
  // Add a message to the conversation
  addMessage(conversationId: string, role: 'user' | 'assistant', content: string): Promise<void>;
  
  // Get context for AI prompt
  getContext(conversationId: string, userQuery: string, tokenBudget?: number): Promise<AIContext>;
  
  // Save memory to file
  exportMemory(conversationId: string): Promise<Blob>; // returns .smg file
  
  // Load memory from file
  importMemory(file: File): Promise<string>; // returns conversationId
  
  // Query the semantic graph
  queryGraph(conversationId: string, query: string): Promise<Node[]>;
  
  // Get memory statistics
  getStats(conversationId: string): Promise<MemoryStats>;
  
  // Delete a conversation
  deleteConversation(conversationId: string): Promise<void>;
}

interface AIContext {
  systemPrompt: string;
  messages: Message[];
  artifacts: Artifact[];
  totalTokens: number;
}

interface MemoryStats {
  totalExchanges: number;
  totalNodes: number;
  totalEdges: number;
  totalArtifacts: number;
  storageSize: number; // bytes
  compressionRatio: number;
  created: Date;
  modified: Date;
}
```

### 6.2 Graph API

```typescript
interface GraphEngine {
  // Node operations
  createNode(data: NodeData): Promise<string>; // returns nodeId
  getNode(nodeId: string): Promise<Node>;
  updateNode(nodeId: string, data: Partial<NodeData>): Promise<void>;
  deleteNode(nodeId: string): Promise<void>;
  
  // Edge operations
  createEdge(from: string, to: string, relation: string, strength?: number): Promise<string>;
  getEdges(nodeId: string, direction?: 'in' | 'out' | 'both'): Promise<Edge[]>;
  deleteEdge(edgeId: string): Promise<void>;
  
  // Query operations
  findNodes(criteria: NodeQuery): Promise<Node[]>;
  traverse(startNode: string, maxDepth: number, filter?: (node: Node) => boolean): Promise<Node[]>;
  shortestPath(from: string, to: string): Promise<Node[]>;
  
  // Analysis operations
  calculateImportance(nodeId: string): Promise<number>;
  getCentralNodes(topK: number): Promise<Node[]>;
  getRelatedNodes(nodeId: string, relationTypes?: string[]): Promise<Node[]>;
}

interface NodeData {
  type: 'concept' | 'decision' | 'artifact' | 'problem' | 'solution';
  label: string;
  description: string;
  confidence?: number;
  importance?: number;
  metadata?: Record<string, any>;
}

interface NodeQuery {
  type?: string[];
  label?: string;
  importance?: { min?: number; max?: number };
  createdAfter?: Date;
  createdBefore?: Date;
}
```

---

## 7. Performance Requirements

### 7.1 Latency Targets

| Operation | Target | Acceptable | Notes |
|-----------|--------|------------|-------|
| Add message | <50ms | <100ms | Real-time feel |
| Build AI context | <200ms | <500ms | Includes graph search |
| Export memory | <1s | <3s | For 500 messages |
| Import memory | <500ms | <1s | Parse + index |
| Semantic search | <100ms | <200ms | Search graph |
| Graph visualization | <300ms | <500ms | Render nodes/edges |

### 7.2 Storage Efficiency

| Scenario | Raw Size | Compressed Size | Ratio |
|----------|----------|-----------------|-------|
| 100 messages (text only) | 50KB | 5KB | 90% |
| 100 messages + 20 code snippets | 500KB | 50KB | 90% |
| 1000 messages + heavy code | 5MB | 400KB | 92% |
| Full project (5000 messages) | 50MB | 2-3MB | 94-96% |

### 7.3 Memory Usage Limits

- **IndexedDB**: Up to 60% of available storage
- **OPFS**: Up to 30% of available storage
- **RAM (in-memory graph)**: Max 50MB per conversation
- **Context injection**: Max 8000 tokens per AI call

---

## 8. Security Considerations

### 8.1 Data Protection

```javascript
// Optional encryption for exported files
async function encryptMemoryFile(smgData, password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(smgData));
  
  // Derive key from password
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    data
  );
  
  return {
    encrypted: true,
    algorithm: 'AES-256-GCM',
    keyDerivation: 'PBKDF2',
    iterations: 100000,
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    data: bufferToBase64(encrypted)
  };
}
```

### 8.2 Privacy Features

- **Local-first**: All data stays in browser (IndexedDB + OPFS)
- **No telemetry**: Zero data sent to external servers
- **Export control**: User decides when to export/share
- **Encryption optional**: User can encrypt `.smg` files with password
- **Audit trail**: All graph modifications logged

---

## 9. Testing Strategy

### 9.1 Unit Tests

- Node creation/update/deletion
- Edge management
- Importance calculation
- Compression/decompression
- Delta creation/application
- Context builder logic

### 9.2 Integration Tests

- Full conversation flow
- Export/import cycle
- Graph query performance
- Storage layer operations
- Memory leak detection

### 9.3 Performance Tests

- Large conversation handling (5000+ messages)
- Compression ratio verification
- Query response time
- Memory usage profiling
- Concurrent operation handling

### 9.4 User Acceptance Tests

- "AI remembers old context" - accuracy test
- "Load time is fast" - <1s for import
- "File size is small" - <1MB for typical project
- "Works across sessions" - close tab, reopen, continue

---

## 10. Browser Compatibility

### Minimum Requirements

- **Chrome/Edge**: Version 100+ (OPFS support)
- **Firefox**: Version 111+ (OPFS support)
- **Safari**: Version 15.2+ (IndexedDB + partial OPFS)

### Polyfills Required

- `TextEncoder/TextDecoder` for older browsers
- `crypto.subtle` fallback for Safari <11
- OPFS graceful degradation (use IndexedDB for large files)

---

## 11. Deployment Considerations

### 11.1 Hosting Options

1. **Static Site Hosting**: Vercel, Netlify, GitHub Pages
2. **Self-hosted**: Docker container with nginx
3. **Electron App**: Desktop application (optional)

### 11.2 Build Pipeline

```bash
# Development
npm run dev          # Start dev server with HMR

# Production
npm run build        # Build optimized bundle
npm run preview      # Preview production build

# Testing
npm run test         # Run unit tests
npm run test:e2e     # Run integration tests
npm run test:perf    # Run performance benchmarks
```

### 11.3 Bundle Size Targets

| Asset | Size | Notes |
|-------|------|-------|
| Main JS bundle | <150KB | Gzipped |
| CSS | <20KB | Gzipped |
| NLP worker | <50KB | Lazy loaded |
| Total initial load | <220KB | First paint |

---

**End of Technical Specification**

*This document defines the complete technical architecture for implementing the SMG system.*
