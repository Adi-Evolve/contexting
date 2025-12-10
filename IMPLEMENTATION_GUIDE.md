# Implementation Guide & Roadmap

## Quick Start Guide

This guide will help you build the Semantic Memory Graph (SMG) system from scratch.

---

## Phase 1: Foundation (Weeks 1-2)

### Step 1.1: Project Setup

```bash
# Initialize project
npm create vite@latest smg-chat -- --template svelte-ts
cd smg-chat
npm install

# Install core dependencies
npm install dexie                    # IndexedDB wrapper
npm install fflate                   # Compression
npm install compromise               # NLP processing
npm install cytoscape                # Graph visualization
npm install diff-match-patch         # Delta compression

# Install dev dependencies
npm install -D @types/cytoscape
npm install -D vitest                # Testing
npm install -D playwright            # E2E tests
```

### Step 1.2: Project Structure

```
smg-chat/
├── src/
│   ├── lib/
│   │   ├── core/
│   │   │   ├── MemoryManager.ts       # Main orchestrator
│   │   │   ├── GraphEngine.ts         # Graph operations
│   │   │   ├── NLPProcessor.ts        # Text analysis
│   │   │   ├── CompressionEngine.ts   # Compression logic
│   │   │   └── StorageLayer.ts        # IndexedDB + OPFS
│   │   ├── types/
│   │   │   ├── memory.types.ts
│   │   │   ├── graph.types.ts
│   │   │   └── smg.types.ts
│   │   ├── utils/
│   │   │   ├── tokenizer.ts
│   │   │   ├── hash.ts
│   │   │   └── validators.ts
│   │   └── stores/
│   │       ├── conversation.store.ts  # Svelte stores
│   │       └── memory.store.ts
│   ├── components/
│   │   ├── Chat/
│   │   │   ├── ChatInterface.svelte
│   │   │   ├── MessageList.svelte
│   │   │   ├── MessageInput.svelte
│   │   │   └── MessageBubble.svelte
│   │   ├── Memory/
│   │   │   ├── MemoryPanel.svelte
│   │   │   ├── GraphView.svelte
│   │   │   └── StatsDisplay.svelte
│   │   └── UI/
│   │       ├── Button.svelte
│   │       └── Modal.svelte
│   ├── routes/
│   │   ├── +page.svelte              # Main chat page
│   │   └── +layout.svelte
│   └── app.css
├── tests/
│   ├── unit/
│   └── e2e/
├── public/
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

### Step 1.3: Core Types Definition

Create `src/lib/types/memory.types.ts`:

```typescript
export interface Message {
  id: string;
  conversationId: string;
  turn: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  importance?: number;
  artifacts?: string[]; // artifact IDs
}

export interface Conversation {
  id: string;
  projectName: string;
  description?: string;
  created: Date;
  modified: Date;
  totalExchanges: number;
  tags?: string[];
}

export interface WorkingMemory {
  conversationId: string;
  summary: string;
  currentGoals: string[];
  activeArtifacts: string[];
  recentContext: Message[];
}

export interface AIContext {
  systemPrompt: string;
  messages: Message[];
  artifacts: Artifact[];
  totalTokens: number;
}

export interface MemoryStats {
  totalExchanges: number;
  totalNodes: number;
  totalEdges: number;
  totalArtifacts: number;
  storageSize: number;
  compressionRatio: number;
  created: Date;
  modified: Date;
}
```

Create `src/lib/types/graph.types.ts`:

```typescript
export type NodeType = 'concept' | 'decision' | 'artifact' | 'problem' | 'solution';

export interface Node {
  id: string;
  conversationId: string;
  type: NodeType;
  label: string;
  description: string;
  confidence: number; // 0-1
  importance: number; // 0-1
  firstMentioned: number; // turn number
  lastMentioned: number; // turn number
  reactivationCount: number;
  metadata?: Record<string, any>;
}

export interface Edge {
  id: string;
  conversationId: string;
  from: string; // node ID
  to: string; // node ID
  relation: string;
  strength: number; // 0-1
}

export interface SemanticGraph {
  nodes: Node[];
  edges: Edge[];
}

export interface NodeQuery {
  type?: NodeType[];
  label?: string;
  importance?: { min?: number; max?: number };
  createdAfter?: Date;
  createdBefore?: Date;
}
```

Create `src/lib/types/smg.types.ts`:

```typescript
export interface SMGFile {
  '@context': string;
  '@type': 'SemanticMemoryGraph';
  version: string;
  metadata: SMGMetadata;
  workingMemory: WorkingMemorySnapshot;
  semanticGraph: SemanticGraphSnapshot;
  artifactVault: ArtifactVaultSnapshot;
  deepArchive: DeepArchiveSnapshot;
}

export interface SMGMetadata {
  id: string;
  created: string; // ISO8601
  modified: string;
  projectName: string;
  projectDescription?: string;
  totalExchanges: number;
  compressionRatio: number;
  tags?: string[];
}

export interface WorkingMemorySnapshot {
  summary: string;
  currentGoals: string[];
  recentContext: Array<{
    turn: number;
    timestamp: string;
    role: string;
    content: string;
    importance: number;
  }>;
}

export interface SemanticGraphSnapshot {
  nodes: Array<{
    id: string;
    type: string;
    label: string;
    description: string;
    confidence: number;
    importance: number;
    firstMentioned: number;
    lastMentioned: number;
    relatedNodes: string[];
  }>;
  edges: Array<{
    from: string;
    to: string;
    relation: string;
    strength: number;
  }>;
}

export interface ArtifactVaultSnapshot {
  artifacts: Record<string, ArtifactData>;
}

export interface ArtifactData {
  type: 'code' | 'document' | 'canvas' | 'data';
  language?: string;
  filename?: string;
  hash: string;
  versions: Array<{
    v: number;
    timestamp: string;
    delta: string | null;
    content?: string;
  }>;
}

export interface DeepArchiveSnapshot {
  compressionMethod: 'brotli' | 'gzip' | 'none';
  blocks: Array<{
    id: number;
    turnRange: string;
    summary: string;
    keyPoints: string[];
    compressedData: string; // base64
  }>;
  vectorIndex?: {
    enabled: boolean;
    model: string | null;
    embeddings: any[];
  };
}

export interface Artifact {
  id: string;
  conversationId: string;
  type: 'code' | 'document' | 'canvas' | 'data';
  language?: string;
  filename?: string;
  content: string;
  hash: string;
  version: number;
  created: Date;
  modified: Date;
}
```

---

## Phase 2: Storage Layer (Week 2)

### Step 2.1: IndexedDB Setup

Create `src/lib/core/StorageLayer.ts`:

```typescript
import Dexie, { Table } from 'dexie';
import type { Conversation, Message, Node, Edge, Artifact, WorkingMemory } from '../types';

export class SMGDatabase extends Dexie {
  conversations!: Table<Conversation, string>;
  messages!: Table<Message, string>;
  nodes!: Table<Node, string>;
  edges!: Table<Edge, string>;
  artifacts!: Table<Artifact, string>;
  workingMemory!: Table<WorkingMemory, string>;

  constructor() {
    super('SMGDatabase');
    
    this.version(1).stores({
      conversations: 'id, created, modified, projectName',
      messages: 'id, conversationId, turn, timestamp, role',
      nodes: 'id, conversationId, type, importance, firstMentioned, lastMentioned',
      edges: 'id, conversationId, from, to',
      artifacts: 'id, conversationId, hash, type, version',
      workingMemory: 'conversationId'
    });
  }
}

export const db = new SMGDatabase();

// Storage utilities
export class StorageLayer {
  private db: SMGDatabase;
  
  constructor() {
    this.db = db;
  }
  
  // Conversation operations
  async createConversation(projectName: string, description?: string): Promise<string> {
    const id = crypto.randomUUID();
    const conversation: Conversation = {
      id,
      projectName,
      description,
      created: new Date(),
      modified: new Date(),
      totalExchanges: 0,
      tags: []
    };
    
    await this.db.conversations.add(conversation);
    
    // Initialize working memory
    await this.db.workingMemory.add({
      conversationId: id,
      summary: '',
      currentGoals: [],
      activeArtifacts: [],
      recentContext: []
    });
    
    return id;
  }
  
  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.db.conversations.get(id);
  }
  
  async getAllConversations(): Promise<Conversation[]> {
    return this.db.conversations.toArray();
  }
  
  async deleteConversation(id: string): Promise<void> {
    await this.db.transaction('rw', [
      this.db.conversations,
      this.db.messages,
      this.db.nodes,
      this.db.edges,
      this.db.artifacts,
      this.db.workingMemory
    ], async () => {
      await this.db.conversations.delete(id);
      await this.db.messages.where('conversationId').equals(id).delete();
      await this.db.nodes.where('conversationId').equals(id).delete();
      await this.db.edges.where('conversationId').equals(id).delete();
      await this.db.artifacts.where('conversationId').equals(id).delete();
      await this.db.workingMemory.delete(id);
    });
  }
  
  // Message operations
  async addMessage(message: Omit<Message, 'id'>): Promise<string> {
    const id = crypto.randomUUID();
    await this.db.messages.add({ id, ...message });
    
    // Update conversation
    await this.db.conversations.update(message.conversationId, {
      modified: new Date(),
      totalExchanges: (await this.db.messages.where('conversationId').equals(message.conversationId).count())
    });
    
    return id;
  }
  
  async getMessages(conversationId: string, limit?: number): Promise<Message[]> {
    const query = this.db.messages
      .where('conversationId')
      .equals(conversationId)
      .sortBy('turn');
    
    const messages = await query;
    return limit ? messages.slice(-limit) : messages;
  }
  
  // Node operations
  async addNode(node: Omit<Node, 'id'>): Promise<string> {
    const id = crypto.randomUUID();
    await this.db.nodes.add({ id, ...node });
    return id;
  }
  
  async getNode(id: string): Promise<Node | undefined> {
    return this.db.nodes.get(id);
  }
  
  async updateNode(id: string, updates: Partial<Node>): Promise<void> {
    await this.db.nodes.update(id, updates);
  }
  
  async getNodes(conversationId: string): Promise<Node[]> {
    return this.db.nodes.where('conversationId').equals(conversationId).toArray();
  }
  
  // Edge operations
  async addEdge(edge: Omit<Edge, 'id'>): Promise<string> {
    const id = crypto.randomUUID();
    await this.db.edges.add({ id, ...edge });
    return id;
  }
  
  async getEdges(nodeId: string, direction: 'in' | 'out' | 'both' = 'both'): Promise<Edge[]> {
    if (direction === 'out') {
      return this.db.edges.where('from').equals(nodeId).toArray();
    } else if (direction === 'in') {
      return this.db.edges.where('to').equals(nodeId).toArray();
    } else {
      const outEdges = await this.db.edges.where('from').equals(nodeId).toArray();
      const inEdges = await this.db.edges.where('to').equals(nodeId).toArray();
      return [...outEdges, ...inEdges];
    }
  }
  
  // Artifact operations
  async addArtifact(artifact: Omit<Artifact, 'id'>): Promise<string> {
    const id = crypto.randomUUID();
    await this.db.artifacts.add({ id, ...artifact });
    return id;
  }
  
  async getArtifact(id: string): Promise<Artifact | undefined> {
    return this.db.artifacts.get(id);
  }
  
  async getArtifactByHash(hash: string): Promise<Artifact | undefined> {
    return this.db.artifacts.where('hash').equals(hash).first();
  }
  
  // Working memory operations
  async getWorkingMemory(conversationId: string): Promise<WorkingMemory | undefined> {
    return this.db.workingMemory.get(conversationId);
  }
  
  async updateWorkingMemory(conversationId: string, updates: Partial<WorkingMemory>): Promise<void> {
    await this.db.workingMemory.update(conversationId, updates);
  }
}
```

### Step 2.2: OPFS Helper (for large files)

Create `src/lib/core/OPFSHelper.ts`:

```typescript
export class OPFSHelper {
  private static async getRoot(): Promise<FileSystemDirectoryHandle> {
    return navigator.storage.getDirectory();
  }
  
  static async storeFile(
    conversationId: string,
    fileName: string,
    content: string
  ): Promise<void> {
    const root = await this.getRoot();
    const conversationDir = await root.getDirectoryHandle(conversationId, { create: true });
    const fileHandle = await conversationDir.getFileHandle(fileName, { create: true });
    
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }
  
  static async readFile(
    conversationId: string,
    fileName: string
  ): Promise<string> {
    const root = await this.getRoot();
    const conversationDir = await root.getDirectoryHandle(conversationId);
    const fileHandle = await conversationDir.getFileHandle(fileName);
    
    const file = await fileHandle.getFile();
    return file.text();
  }
  
  static async deleteFile(
    conversationId: string,
    fileName: string
  ): Promise<void> {
    const root = await this.getRoot();
    const conversationDir = await root.getDirectoryHandle(conversationId);
    await conversationDir.removeEntry(fileName);
  }
  
  static async deleteDirectory(conversationId: string): Promise<void> {
    const root = await this.getRoot();
    await root.removeEntry(conversationId, { recursive: true });
  }
}
```

---

## Phase 3: NLP & Graph Processing (Weeks 3-4)

### Step 3.1: NLP Processor

Create `src/lib/core/NLPProcessor.ts`:

```typescript
import nlp from 'compromise';

export interface ConceptExtraction {
  label: string;
  confidence: number;
  type: 'library' | 'framework' | 'api' | 'technology' | 'term';
}

export interface DecisionDetection {
  isDecision: boolean;
  trigger?: string;
  options?: string[];
  rationale?: string;
}

export class NLPProcessor {
  extractConcepts(text: string): ConceptExtraction[] {
    const doc = nlp(text);
    const concepts: ConceptExtraction[] = [];
    
    // Extract technical terms (proper nouns, capitalized words)
    const properNouns = doc.match('#ProperNoun+').out('array');
    for (const noun of properNouns) {
      // Filter technical-sounding terms
      if (this.isTechnicalTerm(noun)) {
        concepts.push({
          label: noun,
          confidence: 0.8,
          type: this.classifyTerm(noun)
        });
      }
    }
    
    // Extract quoted terms (often important concepts)
    const quoted = text.match(/"([^"]+)"|'([^']+)'/g);
    if (quoted) {
      for (const match of quoted) {
        const term = match.replace(/["']/g, '');
        concepts.push({
          label: term,
          confidence: 0.9,
          type: 'term'
        });
      }
    }
    
    // Extract npm packages, APIs (patterns like "express", "React.useState")
    const codePatterns = text.match(/\b[a-z]+\.[A-Z][a-zA-Z]+\b|\bnpm install [a-z-]+\b/g);
    if (codePatterns) {
      for (const pattern of codePatterns) {
        concepts.push({
          label: pattern,
          confidence: 0.95,
          type: 'api'
        });
      }
    }
    
    return concepts;
  }
  
  detectDecision(text: string): DecisionDetection {
    const decisionPatterns = [
      /(?:let'?s|let us|we'?ll|we will|going to)\s+(?:use|go with|choose|implement|try)/i,
      /(?:decided to|choosing|going with)/i,
      /(?:better to|prefer|rather than)/i,
      /(?:instead of)/i
    ];
    
    for (const pattern of decisionPatterns) {
      const match = text.match(pattern);
      if (match) {
        return {
          isDecision: true,
          trigger: match[0],
          options: this.extractOptions(text),
          rationale: this.extractRationale(text)
        };
      }
    }
    
    return { isDecision: false };
  }
  
  extractArtifacts(text: string): Array<{ type: string; content: string; language?: string }> {
    const artifacts: Array<{ type: string; content: string; language?: string }> = [];
    
    // Extract code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    while ((match = codeBlockRegex.exec(text)) !== null) {
      artifacts.push({
        type: 'code',
        language: match[1] || 'plaintext',
        content: match[2].trim()
      });
    }
    
    // Extract inline code
    const inlineCodeRegex = /`([^`]+)`/g;
    const inlineCodes: string[] = [];
    while ((match = inlineCodeRegex.exec(text)) !== null) {
      if (match[1].length > 20) { // Only substantial code snippets
        inlineCodes.push(match[1]);
      }
    }
    
    if (inlineCodes.length > 0) {
      artifacts.push({
        type: 'code',
        language: 'inline',
        content: inlineCodes.join('\n')
      });
    }
    
    return artifacts;
  }
  
  private isTechnicalTerm(term: string): boolean {
    // Check if term looks technical
    const technicalPatterns = [
      /^[A-Z][a-z]*[A-Z]/,  // CamelCase
      /API|SDK|HTTP|JSON|XML|SQL/i,  // Common acronyms
      /React|Vue|Angular|Node|Express|Django/i  // Common frameworks
    ];
    
    return technicalPatterns.some(pattern => pattern.test(term));
  }
  
  private classifyTerm(term: string): ConceptExtraction['type'] {
    if (/React|Vue|Angular|Svelte/i.test(term)) return 'framework';
    if (/API|HTTP|REST|GraphQL/i.test(term)) return 'api';
    if (/npm|pip|yarn/i.test(term)) return 'library';
    return 'technology';
  }
  
  private extractOptions(text: string): string[] {
    const vsPattern = /(\w+(?:\s+\w+)*)\s+(?:vs|versus|or|instead of)\s+(\w+(?:\s+\w+)*)/i;
    const match = text.match(vsPattern);
    
    if (match) {
      return [match[1].trim(), match[2].trim()];
    }
    
    return [];
  }
  
  private extractRationale(text: string): string | undefined {
    const rationalePattern = /(?:because|since|due to|as)\s+(.+?)(?:\.|$)/i;
    const match = text.match(rationalePattern);
    
    return match ? match[1].trim() : undefined;
  }
  
  calculateImportance(
    message: string,
    hasArtifacts: boolean,
    isDecision: boolean,
    turn: number,
    totalTurns: number
  ): number {
    // Recency factor
    const age = totalTurns - turn;
    const recencyFactor = 1 / (1 + Math.log(age + 1));
    
    // Decision factor
    const decisionFactor = isDecision ? 1 : 0;
    
    // Artifact factor
    const artifactFactor = hasArtifacts ? 1 : 0;
    
    // Length factor (longer = potentially more important)
    const lengthFactor = Math.min(message.length / 500, 1);
    
    // Weighted combination
    const importance = 
      (0.25 * recencyFactor) +
      (0.35 * decisionFactor) +
      (0.25 * artifactFactor) +
      (0.15 * lengthFactor);
    
    return Math.min(importance, 1);
  }
}
```

### Step 3.2: Graph Engine

Create `src/lib/core/GraphEngine.ts`:

```typescript
import type { Node, Edge, NodeQuery, SemanticGraph } from '../types';
import { StorageLayer } from './StorageLayer';

export class GraphEngine {
  private storage: StorageLayer;
  
  constructor() {
    this.storage = new StorageLayer();
  }
  
  async createNode(conversationId: string, data: Omit<Node, 'id' | 'conversationId'>): Promise<string> {
    return this.storage.addNode({
      ...data,
      conversationId,
      reactivationCount: 0
    });
  }
  
  async updateNode(nodeId: string, updates: Partial<Node>): Promise<void> {
    await this.storage.updateNode(nodeId, updates);
  }
  
  async getNode(nodeId: string): Promise<Node | undefined> {
    return this.storage.getNode(nodeId);
  }
  
  async createEdge(
    conversationId: string,
    from: string,
    to: string,
    relation: string,
    strength: number = 0.5
  ): Promise<string> {
    return this.storage.addEdge({
      conversationId,
      from,
      to,
      relation,
      strength
    });
  }
  
  async getConnectedNodes(nodeId: string, maxDepth: number = 2): Promise<Node[]> {
    const visited = new Set<string>();
    const result: Node[] = [];
    
    await this.traverseGraph(nodeId, maxDepth, visited, result);
    
    return result;
  }
  
  private async traverseGraph(
    nodeId: string,
    depth: number,
    visited: Set<string>,
    result: Node[]
  ): Promise<void> {
    if (depth === 0 || visited.has(nodeId)) return;
    
    visited.add(nodeId);
    const node = await this.storage.getNode(nodeId);
    
    if (node) {
      result.push(node);
      
      const edges = await this.storage.getEdges(nodeId, 'out');
      for (const edge of edges) {
        await this.traverseGraph(edge.to, depth - 1, visited, result);
      }
    }
  }
  
  async findNodes(conversationId: string, query: NodeQuery): Promise<Node[]> {
    const allNodes = await this.storage.getNodes(conversationId);
    
    return allNodes.filter(node => {
      if (query.type && !query.type.includes(node.type)) return false;
      
      if (query.label && !node.label.toLowerCase().includes(query.label.toLowerCase())) return false;
      
      if (query.importance) {
        if (query.importance.min && node.importance < query.importance.min) return false;
        if (query.importance.max && node.importance > query.importance.max) return false;
      }
      
      return true;
    });
  }
  
  async semanticSearch(conversationId: string, searchQuery: string, topK: number = 10): Promise<Node[]> {
    const allNodes = await this.storage.getNodes(conversationId);
    const queryTerms = searchQuery.toLowerCase().split(/\s+/);
    
    const scored = allNodes.map(node => {
      const nodeText = `${node.label} ${node.description}`.toLowerCase();
      const nodeTerms = nodeText.split(/\s+/);
      
      // Calculate term overlap
      const overlap = queryTerms.filter(term => 
        nodeTerms.some(nodeTerm => nodeTerm.includes(term) || term.includes(nodeTerm))
      ).length;
      
      const score = (overlap / queryTerms.length) * node.importance;
      
      return { node, score };
    });
    
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(s => s.node);
  }
  
  async getGraph(conversationId: string): Promise<SemanticGraph> {
    const nodes = await this.storage.getNodes(conversationId);
    const edges: Edge[] = [];
    
    for (const node of nodes) {
      const nodeEdges = await this.storage.getEdges(node.id, 'out');
      edges.push(...nodeEdges);
    }
    
    return { nodes, edges };
  }
  
  async pruneWeakRelationships(conversationId: string, threshold: number = 0.3): Promise<number> {
    const graph = await this.getGraph(conversationId);
    let pruned = 0;
    
    for (const edge of graph.edges) {
      if (edge.strength < threshold) {
        // Delete weak edge (you'd need to add deleteEdge to StorageLayer)
        pruned++;
      }
    }
    
    return pruned;
  }
}
```

---

## Phase 4: Memory Manager (Weeks 5-6)

I'll create the core Memory Manager implementation in the next file...

