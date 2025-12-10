# Conversation Threading Workflow

## Overview
Detect and organize sub-conversations (threads) within a single AI chat session to provide better context extraction and memory organization.

## Architecture

### Input
```javascript
{
  id: "conv_123",
  title: "General Chat",
  messages: [
    {role: "user", content: "How do I write a Python function?", timestamp: "..."},
    {role: "assistant", content: "Here's how...", timestamp: "..."},
    // ... more messages
  ]
}
```

### Output
```javascript
{
  id: "conv_123",
  title: "General Chat",
  threads: [
    {
      id: "thread_1",
      title: "Python function basics",
      startIndex: 0,
      endIndex: 5,
      messages: [...],
      topic: "Python programming",
      confidence: 0.85
    },
    {
      id: "thread_2",
      title: "JavaScript async/await",
      startIndex: 6,
      endIndex: 12,
      messages: [...],
      topic: "JavaScript programming",
      confidence: 0.92
    }
  ]
}
```

## Detection Algorithm - Hybrid Approach

### Step 1: Preprocessing
- Extract keywords from each message
- Identify entities (languages, frameworks, tools)
- Calculate message timestamps/gaps
- Detect explicit markers ("let's talk about", "moving on to")

### Step 2: Similarity Scoring (4 Signals)

#### Signal 1: Semantic Similarity (40% weight)
```javascript
similarity = jaccardSimilarity(keywords_A, keywords_B)
// Uses word overlap between consecutive message pairs
```

#### Signal 2: Structural Markers (25% weight)
```javascript
markers = {
  thread_start: ["let's", "now", "next", "how about", "what about", "moving to"],
  thread_end: ["done", "got it", "thanks", "perfect"],
  question_shift: ["?"] // New question = potential new thread
}
```

#### Signal 3: Time Gaps (20% weight)
```javascript
if (timegap > 5 minutes) threadBreakLikelihood += 0.2
if (timegap > 15 minutes) threadBreakLikelihood += 0.5
```

#### Signal 4: Entity Tracking (15% weight)
```javascript
// Track programming languages, tools, frameworks
entities_current = ["Python", "Flask"]
entities_next = ["JavaScript", "React"]
entity_shift = similarity(entities_current, entities_next)
```

### Step 3: Thread Boundary Detection
```javascript
combinedScore = 
  (0.40 * semanticScore) +
  (0.25 * structuralScore) +
  (0.20 * timeGapScore) +
  (0.15 * entityScore)

if (combinedScore < THRESHOLD) {
  // New thread detected
  createThread()
}
```

### Step 4: Thread Title Generation
```javascript
// Extract thread title from:
1. First user question in thread
2. Most frequent keywords (top 3)
3. Detected entities
4. Fallback: "Thread X"
```

## Implementation Flow

```
┌─────────────────────┐
│ Raw Conversation    │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│ Extract Keywords    │
│ & Entities          │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│ Calculate Scores    │
│ (4 signals)         │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│ Detect Boundaries   │
│ (threshold-based)   │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│ Generate Titles     │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│ Thread Array        │
└─────────────────────┘
```

## Configuration Parameters

```javascript
const CONFIG = {
  // Core thresholds
  threadBoundaryThreshold: 0.35,  // Lower = more threads
  minThreadLength: 2,              // Minimum messages per thread
  maxThreadGap: 15,                // Minutes before forced break
  
  // Weights
  semanticWeight: 0.40,
  structuralWeight: 0.25,
  timeWeight: 0.20,
  entityWeight: 0.15,
  
  // Keywords for detection
  topicShiftMarkers: ["let's", "now", "next", "how about", "what about"],
  completionMarkers: ["done", "thanks", "got it", "perfect"],
  
  // Entity categories
  programmingLanguages: ["python", "javascript", "java", "c++", "rust"],
  frameworks: ["react", "vue", "angular", "flask", "django"],
  tools: ["git", "docker", "vscode", "npm"]
}
```

## Integration Points

### 1. Context Extraction (Both Extensions)
```javascript
// In EnhancedContextExtractor.generateDetailedContext()
const threads = this.detectThreads(messages);

// Add threads section to output
markdown += `\n## 🧵 Conversation Threads\n\n`;
threads.forEach((thread, i) => {
  markdown += `**Thread ${i+1}: ${thread.title}** (${thread.messages.length} exchanges)\n`;
  markdown += `Topic: ${thread.topic} | Confidence: ${(thread.confidence*100).toFixed(0)}%\n\n`;
});
```

### 2. Conversation Manager
```javascript
// Store threads with conversation
conversation.threads = threader.analyzeConversation(messages);
```

### 3. Export Format
```javascript
// Separate context file per thread (optional)
threads.forEach(thread => {
  const context = extractor.extractContext({
    title: thread.title,
    messages: thread.messages
  });
  saveFile(`context_${thread.id}.md`, context);
});
```

## Performance Considerations

- **Time Complexity:** O(n²) for similarity calculations, but n is typically < 100 messages
- **Memory:** ~1KB per message, 10MB for 10,000 messages
- **Execution Time:** < 50ms for typical 20-message conversation
- **No External Dependencies:** Pure JavaScript, runs in browser/Node.js

## Testing Strategy

### Test Case 1: Single Topic
```javascript
messages = [
  {role: "user", content: "How to use React hooks?"},
  {role: "assistant", content: "Here's how..."},
  // 10 more React messages
]
// Expected: 1 thread
```

### Test Case 2: Hard Topic Shift
```javascript
messages = [
  {role: "user", content: "Python loops"},
  {role: "assistant", content: "For loops..."},
  {role: "user", content: "Now let's talk about JavaScript promises"},
  {role: "assistant", content: "Promises are..."},
]
// Expected: 2 threads
```

### Test Case 3: Return to Previous Topic
```javascript
messages = [
  // Python discussion (thread 1)
  // JavaScript discussion (thread 2)
  {role: "user", content: "Back to Python, how do I..."}
  // Should merge with thread 1 or create thread 3?
]
// Expected: Configurable behavior
```

## Tuning Guidelines

1. **Too Many Threads:** Increase `threadBoundaryThreshold` (0.35 → 0.45)
2. **Too Few Threads:** Decrease threshold (0.35 → 0.25)
3. **Missing Shifts:** Increase `structuralWeight` (0.25 → 0.35)
4. **False Positives:** Increase `semanticWeight` (0.40 → 0.50)

## Success Metrics

- **Precision:** % of detected threads that are actually separate topics (target: >80%)
- **Recall:** % of actual topic shifts detected (target: >75%)
- **User Satisfaction:** Manual validation on sample conversations

## Next Steps

1. Implement `ConversationThreader` class
2. Add `detectThreads()` method to `EnhancedContextExtractor`
3. Update context output format
4. Add thread visualization in UI
5. Test with real conversations
6. Fine-tune threshold parameters
