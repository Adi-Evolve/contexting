# AI Integration Examples

Examples showing how to integrate MemoryForge with popular AI systems.

## 📋 Overview

MemoryForge can enhance any AI conversation by providing:
- **Persistent Memory** - Remember past conversations
- **Semantic Search** - Find relevant context
- **Causal Tracking** - Understand why things happened
- **Compression** - Efficient storage of long histories

## 🤖 ChatGPT Integration

### Basic Integration

```javascript
import { MemoryForge } from './src/core/MemoryForge.js';

class ChatGPTMemory {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.memory = new MemoryForge();
        this.contextWindow = 10; // Last 10 messages
    }

    async init() {
        await this.memory.init();
    }

    async chat(userMessage) {
        // Store user message
        await this.memory.addMessage(userMessage, 'user');

        // Get relevant context
        const context = await this.getRelevantContext(userMessage);

        // Build prompt with memory
        const messages = [
            {
                role: 'system',
                content: this.buildSystemPrompt(context)
            },
            {
                role: 'user',
                content: userMessage
            }
        ];

        // Call ChatGPT API
        const response = await this.callChatGPT(messages);

        // Store assistant response
        await this.memory.addMessage(response, 'assistant');

        return response;
    }

    async getRelevantContext(query) {
        // Search for relevant past conversations
        const relevant = await this.memory.search(query, 5);

        // Get recent messages
        const recent = await this.memory.getRecent(this.contextWindow);

        // Combine and deduplicate
        const combined = [...relevant, ...recent];
        const unique = this.deduplicateMessages(combined);

        return unique.slice(0, this.contextWindow);
    }

    buildSystemPrompt(context) {
        if (context.length === 0) {
            return 'You are a helpful assistant.';
        }

        const contextText = context.map(msg => 
            `[${msg.timestamp}] ${msg.role}: ${msg.content}`
        ).join('\n');

        return `You are a helpful assistant with memory of past conversations.

Relevant conversation history:
${contextText}

Use this context to provide informed, consistent responses. Reference past conversations when relevant.`;
    }

    async callChatGPT(messages) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages,
                temperature: 0.7
            })
        });

        const data = await response.json();
        return data.choices[0].message.content;
    }

    deduplicateMessages(messages) {
        const seen = new Set();
        return messages.filter(msg => {
            if (seen.has(msg.id)) return false;
            seen.add(msg.id);
            return true;
        });
    }

    async exportMemory() {
        return await this.memory.export('aime');
    }

    async importMemory(aimeData) {
        await this.memory.import(aimeData);
    }
}

// Usage
const chat = new ChatGPTMemory('your-api-key');
await chat.init();

const response = await chat.chat('What did we discuss about machine learning?');
console.log(response);
```

### Advanced: Causal Context

```javascript
class ChatGPTAdvanced extends ChatGPTMemory {
    async chat(userMessage) {
        await this.memory.addMessage(userMessage, 'user');

        // Find causal context
        const recentMessages = await this.memory.getRecent(5);
        const lastMessageId = recentMessages[recentMessages.length - 1]?.id;
        
        let causalContext = [];
        if (lastMessageId) {
            causalContext = await this.memory.getCausalChain(lastMessageId);
        }

        // Build enhanced prompt
        const messages = [
            {
                role: 'system',
                content: this.buildCausalPrompt(causalContext, recentMessages)
            },
            {
                role: 'user',
                content: userMessage
            }
        ];

        const response = await this.callChatGPT(messages);
        await this.memory.addMessage(response, 'assistant');

        return response;
    }

    buildCausalPrompt(causalChain, recentMessages) {
        let prompt = 'You are a helpful assistant with deep understanding of conversation context.\n\n';

        if (causalChain.length > 0) {
            prompt += 'Causal chain of events:\n';
            causalChain.forEach((msg, i) => {
                prompt += `${i + 1}. ${msg.content}\n`;
            });
            prompt += '\n';
        }

        if (recentMessages.length > 0) {
            prompt += 'Recent conversation:\n';
            recentMessages.forEach(msg => {
                prompt += `${msg.role}: ${msg.content}\n`;
            });
        }

        return prompt;
    }
}
```

## 🤗 Claude Integration

### Basic Integration

```javascript
import Anthropic from '@anthropic-ai/sdk';

class ClaudeMemory {
    constructor(apiKey) {
        this.client = new Anthropic({ apiKey });
        this.memory = new MemoryForge();
    }

    async init() {
        await this.memory.init();
    }

    async chat(userMessage) {
        // Store user message
        await this.memory.addMessage(userMessage, 'user');

        // Get context
        const context = await this.buildContext(userMessage);

        // Call Claude
        const message = await this.client.messages.create({
            model: 'claude-sonnet-4.5',
            max_tokens: 1024,
            system: context,
            messages: [
                {
                    role: 'user',
                    content: userMessage
                }
            ]
        });

        const response = message.content[0].text;

        // Store response
        await this.memory.addMessage(response, 'assistant');

        return response;
    }

    async buildContext(query) {
        const relevant = await this.memory.search(query, 5);
        const recent = await this.memory.getRecent(10);

        const allContext = [...relevant, ...recent]
            .filter((msg, i, arr) => arr.findIndex(m => m.id === msg.id) === i)
            .slice(0, 10);

        if (allContext.length === 0) {
            return 'You are Claude, a helpful AI assistant.';
        }

        return `You are Claude, a helpful AI assistant with memory of past conversations.

Context from previous conversations:
${allContext.map(msg => `${msg.role}: ${msg.content}`).join('\n\n')}

Use this context to provide informed, consistent responses.`;
    }
}

// Usage
const claude = new ClaudeMemory('your-api-key');
await claude.init();

const response = await claude.chat('Tell me about our previous discussions');
console.log(response);
```

## 🦙 Ollama Integration (Local)

### Basic Local Integration

```javascript
class OllamaMemory {
    constructor(model = 'llama2') {
        this.model = model;
        this.baseURL = 'http://localhost:11434';
        this.memory = new MemoryForge();
    }

    async init() {
        await this.memory.init();
    }

    async chat(userMessage) {
        await this.memory.addMessage(userMessage, 'user');

        // Get context
        const context = await this.memory.getRecent(10);

        // Build prompt
        const prompt = this.buildPrompt(context, userMessage);

        // Call Ollama
        const response = await fetch(`${this.baseURL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.model,
                prompt,
                stream: false
            })
        });

        const data = await response.json();
        const assistantResponse = data.response;

        await this.memory.addMessage(assistantResponse, 'assistant');

        return assistantResponse;
    }

    buildPrompt(context, userMessage) {
        let prompt = '';

        if (context.length > 0) {
            prompt += 'Previous conversation:\n';
            context.forEach(msg => {
                prompt += `${msg.role}: ${msg.content}\n`;
            });
            prompt += '\n';
        }

        prompt += `user: ${userMessage}\nassistant:`;

        return prompt;
    }

    async chatStream(userMessage, onChunk) {
        await this.memory.addMessage(userMessage, 'user');

        const context = await this.memory.getRecent(10);
        const prompt = this.buildPrompt(context, userMessage);

        const response = await fetch(`${this.baseURL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.model,
                prompt,
                stream: true
            })
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.trim()) {
                    const data = JSON.parse(line);
                    if (data.response) {
                        fullResponse += data.response;
                        onChunk(data.response);
                    }
                }
            }
        }

        await this.memory.addMessage(fullResponse, 'assistant');

        return fullResponse;
    }
}

// Usage
const ollama = new OllamaMemory('llama2');
await ollama.init();

// Regular chat
const response = await ollama.chat('What is machine learning?');

// Streaming chat
await ollama.chatStream('Explain neural networks', (chunk) => {
    process.stdout.write(chunk);
});
```

## 🔄 Memory Export/Import

### Export for AI Training

```javascript
class AIMemoryExporter {
    constructor(memory) {
        this.memory = memory;
    }

    async exportForTraining() {
        const messages = await this.memory.getAllMessages();

        // Format for fine-tuning
        const trainingData = messages.map(msg => ({
            prompt: msg.role === 'user' ? msg.content : '',
            completion: msg.role === 'assistant' ? msg.content : ''
        })).filter(item => item.prompt && item.completion);

        return trainingData;
    }

    async exportAsJSONL() {
        const data = await this.exportForTraining();
        return data.map(item => JSON.stringify(item)).join('\n');
    }

    async exportWithContext() {
        const messages = await this.memory.getAllMessages();

        // Include conversation context
        const contextualized = [];

        for (let i = 0; i < messages.length; i++) {
            if (messages[i].role === 'user') {
                // Get previous messages as context
                const context = messages.slice(Math.max(0, i - 5), i);
                const nextAssistant = messages[i + 1];

                if (nextAssistant && nextAssistant.role === 'assistant') {
                    contextualized.push({
                        context: context.map(m => `${m.role}: ${m.content}`).join('\n'),
                        prompt: messages[i].content,
                        completion: nextAssistant.content
                    });
                }
            }
        }

        return contextualized;
    }
}

// Usage
const exporter = new AIMemoryExporter(memoryForge);

// Export for fine-tuning
const trainingData = await exporter.exportForTraining();
console.log(`Exported ${trainingData.length} training examples`);

// Save as JSONL
const jsonl = await exporter.exportAsJSONL();
await fs.writeFile('training.jsonl', jsonl);
```

## 🎯 Smart Context Selection

### Relevance-Based Context

```javascript
class SmartContextBuilder {
    constructor(memory) {
        this.memory = memory;
        this.maxContextTokens = 4000; // Approximate
    }

    async buildSmartContext(query) {
        // Get multiple context sources
        const semantic = await this.memory.search(query, 10);
        const recent = await this.memory.getRecent(5);
        const causal = await this.getCausalContext(query);

        // Score and rank
        const scored = this.scoreMessages(query, semantic, recent, causal);

        // Select best messages within token limit
        const selected = this.selectWithinTokenLimit(scored);

        return selected;
    }

    scoreMessages(query, semantic, recent, causal) {
        const allMessages = new Map();

        // Semantic matches (high score)
        semantic.forEach((msg, i) => {
            allMessages.set(msg.id, {
                ...msg,
                score: 1.0 - (i * 0.1),
                source: 'semantic'
            });
        });

        // Recent messages (medium score)
        recent.forEach((msg, i) => {
            const existing = allMessages.get(msg.id);
            if (existing) {
                existing.score += 0.5 - (i * 0.05);
            } else {
                allMessages.set(msg.id, {
                    ...msg,
                    score: 0.5 - (i * 0.05),
                    source: 'recent'
                });
            }
        });

        // Causal chain (high score)
        causal.forEach((msg, i) => {
            const existing = allMessages.get(msg.id);
            if (existing) {
                existing.score += 0.8;
            } else {
                allMessages.set(msg.id, {
                    ...msg,
                    score: 0.8,
                    source: 'causal'
                });
            }
        });

        return Array.from(allMessages.values())
            .sort((a, b) => b.score - a.score);
    }

    selectWithinTokenLimit(messages) {
        let tokens = 0;
        const selected = [];

        for (const msg of messages) {
            const msgTokens = this.estimateTokens(msg.content);
            
            if (tokens + msgTokens > this.maxContextTokens) {
                break;
            }

            selected.push(msg);
            tokens += msgTokens;
        }

        return selected;
    }

    estimateTokens(text) {
        // Rough estimate: ~4 chars per token
        return Math.ceil(text.length / 4);
    }

    async getCausalContext(query) {
        const recent = await this.memory.getRecent(1);
        if (recent.length === 0) return [];

        return await this.memory.getCausalChain(recent[0].id);
    }
}

// Usage
const contextBuilder = new SmartContextBuilder(memoryForge);
const context = await contextBuilder.buildSmartContext('machine learning');
```

## 📊 Memory Statistics for AI

### Track AI Performance with Memory

```javascript
class AIPerformanceTracker {
    constructor(memory) {
        this.memory = memory;
    }

    async getPerformanceMetrics() {
        const stats = this.memory.getStats();

        return {
            totalConversations: stats.messages.total,
            averageResponseTime: await this.calculateAverageResponseTime(),
            memoryUsage: stats.storage.totalSize,
            compressionRatio: stats.compression.totalRatio,
            semanticSearchAccuracy: await this.testSemanticAccuracy(),
            contextRelevance: await this.measureContextRelevance()
        };
    }

    async calculateAverageResponseTime() {
        const messages = await this.memory.getRecent(100);
        const pairs = [];

        for (let i = 0; i < messages.length - 1; i++) {
            if (messages[i].role === 'user' && messages[i + 1].role === 'assistant') {
                const timeDiff = messages[i + 1].timestamp - messages[i].timestamp;
                pairs.push(timeDiff);
            }
        }

        return pairs.length > 0
            ? pairs.reduce((a, b) => a + b, 0) / pairs.length
            : 0;
    }

    async testSemanticAccuracy() {
        // Test search accuracy with known queries
        const testCases = [
            { query: 'machine learning', expectedTerms: ['machine', 'learning', 'ai'] }
        ];

        let correct = 0;

        for (const test of testCases) {
            const results = await this.memory.search(test.query, 5);
            const hasExpected = results.some(r =>
                test.expectedTerms.some(term =>
                    r.content.toLowerCase().includes(term)
                )
            );

            if (hasExpected) correct++;
        }

        return testCases.length > 0 ? correct / testCases.length : 0;
    }

    async measureContextRelevance() {
        // Measure how often retrieved context is actually relevant
        const recent = await this.memory.getRecent(50);
        let relevantCount = 0;

        for (const msg of recent) {
            if (msg.role === 'user') {
                const context = await this.memory.search(msg.content, 3);
                // If search returns results, context is potentially relevant
                if (context.length > 0) relevantCount++;
            }
        }

        return recent.length > 0 ? relevantCount / recent.length : 0;
    }
}

// Usage
const tracker = new AIPerformanceTracker(memoryForge);
const metrics = await tracker.getPerformanceMetrics();
console.log('AI Performance Metrics:', metrics);
```

## 🚀 Complete Example: AI Assistant with Memory

```javascript
import { MemoryForge } from './src/core/MemoryForge.js';

class MemoryEnabledAssistant {
    constructor(aiProvider, apiKey) {
        this.aiProvider = aiProvider;
        this.apiKey = apiKey;
        this.memory = new MemoryForge();
    }

    async init() {
        await this.memory.init();
    }

    async chat(userMessage) {
        console.log(`User: ${userMessage}`);

        // Store message
        const userMsgId = await this.memory.addMessage(userMessage, 'user');

        // Build context
        const context = await this.buildIntelligentContext(userMessage);

        // Call AI
        const response = await this.callAI(userMessage, context);

        console.log(`Assistant: ${response}`);

        // Store response
        await this.memory.addMessage(response, 'assistant');

        // Show memory stats
        this.showMemoryStats();

        return response;
    }

    async buildIntelligentContext(query) {
        const [semantic, recent, causal] = await Promise.all([
            this.memory.search(query, 5),
            this.memory.getRecent(5),
            this.memory.getCausalChain(await this.getLastMessageId())
        ]);

        // Combine and deduplicate
        const combined = [...semantic, ...recent, ...causal];
        const unique = Array.from(new Map(combined.map(m => [m.id, m])).values());

        return unique.slice(0, 10);
    }

    async getLastMessageId() {
        const recent = await this.memory.getRecent(1);
        return recent[0]?.id;
    }

    async callAI(message, context) {
        // Implementation depends on AI provider
        // This is a simplified example
        const contextText = context.map(m =>
            `${m.role}: ${m.content}`
        ).join('\n\n');

        const prompt = `${contextText}\n\nuser: ${message}\nassistant:`;

        // Call your AI API here
        return 'AI response based on context';
    }

    showMemoryStats() {
        const stats = this.memory.getStats();
        console.log(`\n📊 Memory Stats:`);
        console.log(`  Messages: ${stats.messages.total}`);
        console.log(`  Storage: ${(stats.storage.totalSize / 1024).toFixed(2)} KB`);
        console.log(`  Compression: ${(stats.compression.totalRatio * 100).toFixed(1)}%`);
        console.log('');
    }

    async exportChat() {
        return await this.memory.export('aime');
    }

    async importChat(aimeData) {
        await this.memory.import(aimeData);
    }
}

// Usage
const assistant = new MemoryEnabledAssistant('chatgpt', 'your-api-key');
await assistant.init();

await assistant.chat('What is machine learning?');
await assistant.chat('Can you give me an example?');
await assistant.chat('What did we just discuss?'); // Uses memory!

// Export conversation
const exported = await assistant.exportChat();
console.log('Exported conversation:', exported);
```

## 📚 Resources

- [MemoryForge Documentation](../README.md)
- [AIME Format Specification](../docs/AIME_FORMAT.md)
- [API Reference](../docs/API.md)
- [ChatGPT API Docs](https://platform.openai.com/docs)
- [Claude API Docs](https://docs.anthropic.com)
- [Ollama API Docs](https://github.com/ollama/ollama/blob/main/docs/api.md)

---

**Next Steps:**
1. Choose your AI provider
2. Copy the relevant example
3. Add your API key
4. Start chatting with memory!
