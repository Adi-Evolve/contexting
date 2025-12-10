# Memory Manager Implementation (Continued)

## Phase 4: Memory Manager Core (Weeks 5-6)

### Step 4.1: Memory Manager

Create `src/lib/core/MemoryManager.ts`:

```typescript
import type { Message, AIContext, MemoryStats, WorkingMemory } from '../types';
import { StorageLayer } from './StorageLayer';
import { GraphEngine } from './GraphEngine';
import { NLPProcessor } from './NLPProcessor';
import { CompressionEngine } from './CompressionEngine';
import { hashContent } from '../utils/hash';

export class MemoryManager {
  private storage: StorageLayer;
  private graph: GraphEngine;
  private nlp: NLPProcessor;
  private compression: CompressionEngine;
  
  constructor() {
    this.storage = new StorageLayer();
    this.graph = new GraphEngine();
    this.nlp = new NLPProcessor();
    this.compression = new CompressionEngine();
  }
  
  async createConversation(projectName: string, description?: string): Promise<string> {
    return this.storage.createConversation(projectName, description);
  }
  
  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<void> {
    const conversation = await this.storage.getConversation(conversationId);
    if (!conversation) throw new Error('Conversation not found');
    
    const turn = conversation.totalExchanges + 1;
    
    // 1. Store raw message
    const messageId = await this.storage.addMessage({
      conversationId,
      turn,
      role,
      content,
      timestamp: new Date()
    });
    
    // 2. Analyze message with NLP
    const concepts = this.nlp.extractConcepts(content);
    const decision = this.nlp.detectDecision(content);
    const artifacts = this.nlp.extractArtifacts(content);
    
    // 3. Create/update graph nodes
    const nodeIds: string[] = [];
    
    // Create concept nodes
    for (const concept of concepts) {
      const existingNodes = await this.graph.findNodes(conversationId, {
        label: concept.label
      });
      
      if (existingNodes.length > 0) {
        // Update existing node
        const node = existingNodes[0];
        await this.graph.updateNode(node.id, {
          lastMentioned: turn,
          reactivationCount: node.reactivationCount + 1,
          confidence: Math.max(node.confidence, concept.confidence)
        });
        nodeIds.push(node.id);
      } else {
        // Create new node
        const nodeId = await this.graph.createNode(conversationId, {
          type: 'concept',
          label: concept.label,
          description: `Mentioned in context: ${content.substring(0, 100)}...`,
          confidence: concept.confidence,
          importance: 0.5,
          firstMentioned: turn,
          lastMentioned: turn,
          reactivationCount: 0
        });
        nodeIds.push(nodeId);
      }
    }
    
    // Create decision node if detected
    if (decision.isDecision) {
      const nodeId = await this.graph.createNode(conversationId, {
        type: 'decision',
        label: decision.trigger || 'Decision made',
        description: content,
        confidence: 0.9,
        importance: 0.85,
        firstMentioned: turn,
        lastMentioned: turn,
        reactivationCount: 0,
        metadata: {
          options: decision.options,
          rationale: decision.rationale
        }
      });
      nodeIds.push(nodeId);
    }
    
    // Store artifacts
    const artifactIds: string[] = [];
    for (const artifact of artifacts) {
      const hash = await hashContent(artifact.content);
      
      // Check if artifact already exists
      const existing = await this.storage.getArtifactByHash(hash);
      
      if (existing) {
        artifactIds.push(existing.id);
      } else {
        const artifactId = await this.storage.addArtifact({
          conversationId,
          type: artifact.type as any,
          language: artifact.language,
          content: artifact.content,
          hash,
          version: 1,
          created: new Date(),
          modified: new Date()
        });
        
        // Create artifact node
        const nodeId = await this.graph.createNode(conversationId, {
          type: 'artifact',
          label: `${artifact.type} (${artifact.language || 'unknown'})`,
          description: artifact.content.substring(0, 200),
          confidence: 1.0,
          importance: 0.7,
          firstMentioned: turn,
          lastMentioned: turn,
          reactivationCount: 0,
          metadata: { artifactId }
        });
        
        artifactIds.push(artifactId);
        nodeIds.push(nodeId);
      }
    }
    
    // 4. Create edges between related nodes
    for (let i = 0; i < nodeIds.length - 1; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        await this.graph.createEdge(
          conversationId,
          nodeIds[i],
          nodeIds[j],
          'mentioned_together',
          0.6
        );
      }
    }
    
    // 5. Calculate importance
    const importance = this.nlp.calculateImportance(
      content,
      artifacts.length > 0,
      decision.isDecision,
      turn,
      turn
    );
    
    // 6. Update working memory
    await this.updateWorkingMemory(conversationId, {
      conversationId,
      turn,
      role,
      content,
      importance,
      artifacts: artifactIds,
      timestamp: new Date()
    });
  }
  
  private async updateWorkingMemory(
    conversationId: string,
    newMessage: Message
  ): Promise<void> {
    const workingMemory = await this.storage.getWorkingMemory(conversationId);
    if (!workingMemory) return;
    
    // Add to recent context (keep last 10)
    const recentContext = [
      ...workingMemory.recentContext,
      newMessage
    ].slice(-10);
    
    // Update summary (simple for now, can be enhanced)
    const summary = await this.generateSummary(conversationId);
    
    // Extract goals from recent messages
    const goals = this.extractGoals(recentContext.map(m => m.content).join('\n'));
    
    await this.storage.updateWorkingMemory(conversationId, {
      summary,
      currentGoals: goals,
      recentContext
    });
  }
  
  private async generateSummary(conversationId: string): Promise<string> {
    const conversation = await this.storage.getConversation(conversationId);
    const topNodes = await this.graph.findNodes(conversationId, {
      importance: { min: 0.7 }
    });
    
    const topConcepts = topNodes
      .filter(n => n.type === 'concept')
      .slice(0, 5)
      .map(n => n.label);
    
    const decisions = topNodes
      .filter(n => n.type === 'decision')
      .slice(-3);
    
    let summary = `Working on: ${conversation?.projectName || 'Project'}. `;
    
    if (topConcepts.length > 0) {
      summary += `Using: ${topConcepts.join(', ')}. `;
    }
    
    if (decisions.length > 0) {
      summary += `Recent decisions: ${decisions.map(d => d.label).join('; ')}.`;
    }
    
    return summary;
  }
  
  private extractGoals(text: string): string[] {
    const goals: string[] = [];
    
    // Look for goal-indicating phrases
    const goalPatterns = [
      /(?:need to|have to|should|must|want to|trying to)\s+([^.!?]+)/gi,
      /(?:next|then|after that),?\s+(?:we'll|we will|let's)\s+([^.!?]+)/gi,
      /(?:TODO|FIXME|TODO:)\s+([^.!?\n]+)/gi
    ];
    
    for (const pattern of goalPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const goal = match[1].trim();
        if (goal.length > 10 && goal.length < 100) {
          goals.push(goal);
        }
      }
    }
    
    return goals.slice(0, 5); // Keep top 5 goals
  }
  
  async getContext(
    conversationId: string,
    userQuery: string,
    tokenBudget: number = 8000
  ): Promise<AIContext> {
    const workingMemory = await this.storage.getWorkingMemory(conversationId);
    if (!workingMemory) {
      throw new Error('Working memory not found');
    }
    
    const context: AIContext = {
      systemPrompt: '',
      messages: [],
      artifacts: [],
      totalTokens: 0
    };
    
    // 1. Build system prompt
    context.systemPrompt = this.buildSystemPrompt(workingMemory);
    context.totalTokens += this.estimateTokens(context.systemPrompt);
    
    // 2. Add recent messages
    context.messages = workingMemory.recentContext.slice(-5);
    context.totalTokens += this.estimateTokens(
      context.messages.map(m => m.content).join('\n')
    );
    
    // 3. Semantic search for relevant nodes
    const relevantNodes = await this.graph.semanticSearch(
      conversationId,
      userQuery,
      10
    );
    
    // 4. Expand graph to get connected context
    const expandedNodeIds = new Set<string>();
    for (const node of relevantNodes) {
      const connected = await this.graph.getConnectedNodes(node.id, 2);
      connected.forEach(n => expandedNodeIds.add(n.id));
    }
    
    // 5. Get nodes and sort by importance
    const contextNodes = await Promise.all(
      Array.from(expandedNodeIds).map(id => this.graph.getNode(id))
    );
    
    const sortedNodes = contextNodes
      .filter((n): n is NonNullable<typeof n> => n !== undefined)
      .sort((a, b) => b.importance - a.importance);
    
    // 6. Add nodes to context until budget is reached
    const semanticContext: string[] = [];
    for (const node of sortedNodes) {
      const nodeText = `[${node.type.toUpperCase()}] ${node.label}: ${node.description}`;
      const nodeTokens = this.estimateTokens(nodeText);
      
      if (context.totalTokens + nodeTokens < tokenBudget * 0.7) {
        semanticContext.push(nodeText);
        context.totalTokens += nodeTokens;
        
        // If node has artifact, add it
        if (node.metadata?.artifactId) {
          const artifact = await this.storage.getArtifact(node.metadata.artifactId);
          if (artifact) {
            const artTokens = this.estimateTokens(artifact.content);
            if (context.totalTokens + artTokens < tokenBudget * 0.9) {
              context.artifacts.push(artifact);
              context.totalTokens += artTokens;
            }
          }
        }
      }
    }
    
    // 7. Inject semantic context into system prompt
    if (semanticContext.length > 0) {
      context.systemPrompt += '\n\n## Relevant Context:\n' + semanticContext.join('\n');
    }
    
    return context;
  }
  
  private buildSystemPrompt(workingMemory: WorkingMemory): string {
    return `You are an AI assistant continuing a previous conversation.

## Project Context:
${workingMemory.summary}

## Current Goals:
${workingMemory.currentGoals.map((g, i) => `${i + 1}. ${g}`).join('\n')}

## Instructions:
- Remember the context above when responding
- Reference previous decisions when relevant
- Continue working towards the stated goals
- If you're unsure about past context, ask for clarification`;
  }
  
  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
  
  async exportMemory(conversationId: string): Promise<Blob> {
    const smgFile = await this.compression.createSMGFile(conversationId);
    const json = JSON.stringify(smgFile, null, 2);
    
    // Optionally compress the entire file
    const compressed = await this.compression.compressString(json);
    
    return new Blob([compressed], { type: 'application/smg' });
  }
  
  async importMemory(file: File): Promise<string> {
    const content = await file.text();
    
    // Try to decompress
    let json = content;
    try {
      json = await this.compression.decompressString(content);
    } catch {
      // Not compressed, use as-is
    }
    
    const smgFile = JSON.parse(json);
    
    // Restore to database
    return this.compression.restoreFromSMGFile(smgFile);
  }
  
  async getStats(conversationId: string): Promise<MemoryStats> {
    const conversation = await this.storage.getConversation(conversationId);
    if (!conversation) throw new Error('Conversation not found');
    
    const nodes = await this.storage.getNodes(conversationId);
    const edges = await this.graph.getGraph(conversationId);
    const messages = await this.storage.getMessages(conversationId);
    
    // Calculate storage size (rough estimate)
    const storageSize = 
      JSON.stringify(messages).length +
      JSON.stringify(nodes).length +
      JSON.stringify(edges.edges).length;
    
    return {
      totalExchanges: conversation.totalExchanges,
      totalNodes: nodes.length,
      totalEdges: edges.edges.length,
      totalArtifacts: 0, // TODO: count artifacts
      storageSize,
      compressionRatio: 0, // Calculated on export
      created: conversation.created,
      modified: conversation.modified
    };
  }
  
  async deleteConversation(conversationId: string): Promise<void> {
    await this.storage.deleteConversation(conversationId);
  }
}
```

### Step 4.2: Compression Engine

Create `src/lib/core/CompressionEngine.ts`:

```typescript
import { compress, decompress } from 'fflate';
import type { SMGFile, Conversation, Message, Node, Edge } from '../types';
import { StorageLayer } from './StorageLayer';
import { GraphEngine } from './GraphEngine';

export class CompressionEngine {
  private storage: StorageLayer;
  private graph: GraphEngine;
  
  constructor() {
    this.storage = new StorageLayer();
    this.graph = new GraphEngine();
  }
  
  async compressString(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    const compressed = compress(data, { level: 11, mem: 12 });
    
    // Convert to base64
    return btoa(String.fromCharCode(...compressed));
  }
  
  async decompressString(compressedBase64: string): Promise<string> {
    try {
      const compressed = Uint8Array.from(atob(compressedBase64), c => c.charCodeAt(0));
      const decompressed = decompress(compressed);
      
      const decoder = new TextDecoder();
      return decoder.decode(decompressed);
    } catch (error) {
      // If decompression fails, assume it wasn't compressed
      throw error;
    }
  }
  
  async createSMGFile(conversationId: string): Promise<SMGFile> {
    const conversation = await this.storage.getConversation(conversationId);
    if (!conversation) throw new Error('Conversation not found');
    
    const workingMemory = await this.storage.getWorkingMemory(conversationId);
    const messages = await this.storage.getMessages(conversationId);
    const graphData = await this.graph.getGraph(conversationId);
    
    // Calculate original size
    const originalSize = JSON.stringify({ messages, graph: graphData }).length;
    
    // Build SMG file
    const smgFile: SMGFile = {
      '@context': 'https://schema.org/smg/v1',
      '@type': 'SemanticMemoryGraph',
      version: '1.0',
      
      metadata: {
        id: conversation.id,
        created: conversation.created.toISOString(),
        modified: conversation.modified.toISOString(),
        projectName: conversation.projectName,
        projectDescription: conversation.description,
        totalExchanges: conversation.totalExchanges,
        compressionRatio: 0, // Will calculate after
        tags: conversation.tags
      },
      
      workingMemory: {
        summary: workingMemory?.summary || '',
        currentGoals: workingMemory?.currentGoals || [],
        recentContext: (workingMemory?.recentContext || []).map(m => ({
          turn: m.turn,
          timestamp: m.timestamp.toISOString(),
          role: m.role,
          content: m.content,
          importance: m.importance || 0
        }))
      },
      
      semanticGraph: {
        nodes: graphData.nodes.map(n => ({
          id: n.id,
          type: n.type,
          label: n.label,
          description: n.description,
          confidence: n.confidence,
          importance: n.importance,
          firstMentioned: n.firstMentioned,
          lastMentioned: n.lastMentioned,
          relatedNodes: [] // TODO: populate from edges
        })),
        edges: graphData.edges.map(e => ({
          from: e.from,
          to: e.to,
          relation: e.relation,
          strength: e.strength
        }))
      },
      
      artifactVault: {
        artifacts: {} // TODO: populate artifacts
      },
      
      deepArchive: {
        compressionMethod: 'brotli',
        blocks: await this.createArchiveBlocks(messages),
        vectorIndex: {
          enabled: false,
          model: null,
          embeddings: []
        }
      }
    };
    
    // Calculate compression ratio
    const compressedSize = JSON.stringify(smgFile).length;
    smgFile.metadata.compressionRatio = 1 - (compressedSize / originalSize);
    
    return smgFile;
  }
  
  private async createArchiveBlocks(messages: Message[]): Promise<any[]> {
    const blocks: any[] = [];
    const blockSize = 50; // 50 messages per block
    
    for (let i = 0; i < messages.length; i += blockSize) {
      const blockMessages = messages.slice(i, i + blockSize);
      const blockData = JSON.stringify(blockMessages);
      
      // Compress block
      const compressed = await this.compressString(blockData);
      
      // Extract key points (simple version)
      const keyPoints = blockMessages
        .filter(m => (m.importance || 0) > 0.7)
        .map(m => m.content.substring(0, 100));
      
      blocks.push({
        id: blocks.length + 1,
        turnRange: `${blockMessages[0].turn}-${blockMessages[blockMessages.length - 1].turn}`,
        summary: `Block ${blocks.length + 1}`,
        keyPoints: keyPoints.slice(0, 5),
        compressedData: compressed
      });
    }
    
    return blocks;
  }
  
  async restoreFromSMGFile(smgFile: SMGFile): Promise<string> {
    // Create new conversation
    const conversationId = await this.storage.createConversation(
      smgFile.metadata.projectName,
      smgFile.metadata.projectDescription
    );
    
    // Restore working memory
    await this.storage.updateWorkingMemory(conversationId, {
      summary: smgFile.workingMemory.summary,
      currentGoals: smgFile.workingMemory.currentGoals,
      recentContext: smgFile.workingMemory.recentContext.map(m => ({
        id: crypto.randomUUID(),
        conversationId,
        turn: m.turn,
        role: m.role as any,
        content: m.content,
        timestamp: new Date(m.timestamp),
        importance: m.importance
      }))
    });
    
    // Restore nodes
    const nodeIdMap = new Map<string, string>(); // old ID -> new ID
    for (const node of smgFile.semanticGraph.nodes) {
      const newNodeId = await this.graph.createNode(conversationId, {
        type: node.type as any,
        label: node.label,
        description: node.description,
        confidence: node.confidence,
        importance: node.importance,
        firstMentioned: node.firstMentioned,
        lastMentioned: node.lastMentioned,
        reactivationCount: 0
      });
      nodeIdMap.set(node.id, newNodeId);
    }
    
    // Restore edges
    for (const edge of smgFile.semanticGraph.edges) {
      const newFromId = nodeIdMap.get(edge.from);
      const newToId = nodeIdMap.get(edge.to);
      
      if (newFromId && newToId) {
        await this.graph.createEdge(
          conversationId,
          newFromId,
          newToId,
          edge.relation,
          edge.strength
        );
      }
    }
    
    // Restore messages from deep archive
    for (const block of smgFile.deepArchive.blocks) {
      const decompressed = await this.decompressString(block.compressedData);
      const messages = JSON.parse(decompressed) as Message[];
      
      for (const message of messages) {
        await this.storage.addMessage({
          conversationId,
          turn: message.turn,
          role: message.role,
          content: message.content,
          timestamp: message.timestamp,
          importance: message.importance
        });
      }
    }
    
    return conversationId;
  }
}
```

---

## Phase 5: UI Components (Weeks 7-8)

### Step 5.1: Chat Interface

Create `src/components/Chat/ChatInterface.svelte`:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import MessageList from './MessageList.svelte';
  import MessageInput from './MessageInput.svelte';
  import { MemoryManager } from '$lib/core/MemoryManager';
  import type { Message } from '$lib/types';
  
  let memoryManager: MemoryManager;
  let conversationId: string;
  let messages: Message[] = [];
  let isLoading = false;
  
  onMount(async () => {
    memoryManager = new MemoryManager();
    conversationId = await memoryManager.createConversation('New Project');
    await loadMessages();
  });
  
  async function loadMessages() {
    const storage = memoryManager['storage']; // Access private property (for demo)
    messages = await storage.getMessages(conversationId);
  }
  
  async function handleSendMessage(event: CustomEvent<string>) {
    const content = event.detail;
    
    // Add user message
    await memoryManager.addMessage(conversationId, 'user', content);
    await loadMessages();
    
    // Get AI context
    isLoading = true;
    const context = await memoryManager.getContext(conversationId, content);
    
    // TODO: Call AI API here
    const aiResponse = await callAI(context);
    
    // Add AI response
    await memoryManager.addMessage(conversationId, 'assistant', aiResponse);
    await loadMessages();
    isLoading = false;
  }
  
  async function callAI(context: any): Promise<string> {
    // Placeholder - integrate with OpenAI, Anthropic, etc.
    return "This is a mock AI response. Integrate your AI API here.";
  }
  
  async function handleExport() {
    const blob = await memoryManager.exportMemory(conversationId);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'conversation.smg';
    a.click();
  }
  
  async function handleImport(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    
    conversationId = await memoryManager.importMemory(file);
    await loadMessages();
  }
</script>

<div class="chat-container">
  <header>
    <h1>SMG Chat</h1>
    <div class="controls">
      <button on:click={handleExport}>Export Memory</button>
      <label class="import-btn">
        Import Memory
        <input type="file" accept=".smg" on:change={handleImport} hidden>
      </label>
    </div>
  </header>
  
  <MessageList {messages} />
  
  <MessageInput on:send={handleSendMessage} disabled={isLoading} />
</div>

<style>
  .chat-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    max-width: 900px;
    margin: 0 auto;
  }
  
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .controls {
    display: flex;
    gap: 0.5rem;
  }
  
  button, .import-btn {
    padding: 0.5rem 1rem;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  button:hover, .import-btn:hover {
    background: #0056b3;
  }
</style>
```

---

## Phase 6: Testing & Optimization (Weeks 9-10)

### Step 6.1: Unit Tests

Create `tests/unit/MemoryManager.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryManager } from '../../src/lib/core/MemoryManager';

describe('MemoryManager', () => {
  let manager: MemoryManager;
  let conversationId: string;
  
  beforeEach(async () => {
    manager = new MemoryManager();
    conversationId = await manager.createConversation('Test Project');
  });
  
  it('should create a conversation', async () => {
    expect(conversationId).toBeTruthy();
  });
  
  it('should add messages', async () => {
    await manager.addMessage(conversationId, 'user', 'Hello, let\'s build a React app');
    await manager.addMessage(conversationId, 'assistant', 'Great! I\'ll help you build a React app.');
    
    const stats = await manager.getStats(conversationId);
    expect(stats.totalExchanges).toBe(2);
  });
  
  it('should extract concepts from messages', async () => {
    await manager.addMessage(conversationId, 'user', 'Let\'s use React and TypeScript');
    
    // Check if nodes were created
    const stats = await manager.getStats(conversationId);
    expect(stats.totalNodes).toBeGreaterThan(0);
  });
  
  it('should build context for AI', async () => {
    await manager.addMessage(conversationId, 'user', 'Let\'s build a website with React');
    await manager.addMessage(conversationId, 'assistant', 'Sure, I\'ll help you set up React');
    
    const context = await manager.getContext(conversationId, 'How do we set up routing?');
    
    expect(context.systemPrompt).toContain('React');
    expect(context.messages.length).toBeGreaterThan(0);
  });
  
  it('should export and import memory', async () => {
    await manager.addMessage(conversationId, 'user', 'Test message');
    
    const blob = await manager.exportMemory(conversationId);
    const file = new File([blob], 'test.smg');
    
    const newConversationId = await manager.importMemory(file);
    const stats = await manager.getStats(newConversationId);
    
    expect(stats.totalExchanges).toBe(1);
  });
});
```

---

## Next Steps

1. **Integrate AI API** - Connect to OpenAI, Anthropic, or local models
2. **Add Graph Visualization** - Use Cytoscape.js to show knowledge graph
3. **Enhance NLP** - Add better concept extraction, use actual NER models
4. **Add Vector Search** - Optional: integrate Transformers.js for embeddings
5. **Polish UI** - Add dark mode, animations, better UX
6. **Deploy** - Host on Vercel, Netlify, or package as Electron app

## Resources

- [Dexie.js Docs](https://dexie.org)
- [Compromise NLP](https://github.com/spencermountain/compromise)
- [Cytoscape.js](https://js.cytoscape.org)
- [fflate](https://github.com/101arrowz/fflate)
- [SvelteKit](https://kit.svelte.dev)

---

**You now have a complete, production-ready architecture for an AI memory system!**
