# Remember - VS Code AI Memory Pro

Advanced persistent memory system for VS Code AI assistants with smart capture, context assembly, and conversation resume.

## 🚀 Version 4.0 - Major Upgrade

**Remember v4.0** brings Chrome extension-level features to VS Code with intelligent capture and context assembly.

### What's New in 4.0

- **5-Layer Hybrid Capture**: Multi-layered detection system
- **Context Assembler V2**: Intelligent context compression (1,600 token budget)
- **Resume in Copilot**: Continue conversations with full context
- **Smart Clipboard**: Auto-detect 5 AI platforms
- **Editor Context Tracking**: Infer AI usage from code changes

---

## ✨ Key Features

### 🎯 **Smart Capture System**

**5 capture layers** ensure nothing is missed:

1. **Editor Context Capture** ✅ (100% feasible)
   - Tracks file edits, selections, active files
   - Infers AI assistant usage with confidence scoring
   - Monitors code changes and suggestions

2. **Smart Clipboard Monitor** ✅ (100% feasible)
   - Auto-detects conversations from 5 platforms:
     - GitHub Copilot
     - Google Gemini
     - ChatGPT
     - Claude
     - Generic AI assistants
   - Pattern matching with confidence scoring
   - Automatic code block extraction

3. **Webview Injection** 🔬 (experimental, 30% feasible)
   - Direct capture from Copilot webview (when possible)

4. **Command Wrapping** 🔬 (experimental, 20% feasible)
   - Transparent capture via command interception

5. **User-Assisted Capture** ✅ (100% feasible, always available)
   - Manual capture with keyboard shortcuts
   - Fallback when automatic detection fails

### 🧠 **Context Assembler V2**

Intelligent 4-layer context assembly with token budget:

- **Role & Persona** (200 tokens): Who you are and your preferences
- **Canonical State** (600 tokens): Current project context
- **Recent Context** (500 tokens): Last 5 messages
- **Relevant History** (300 tokens): Similar past conversations

**Total Budget**: 1,600 tokens (optimal for Copilot)

### 🔄 **Resume in Copilot**

Continue any conversation with one click:

1. Select conversation in sidebar
2. Run `Remember: Resume in Copilot` (Ctrl+Alt+R)
3. Context automatically injected into Copilot
4. Continue where you left off!

### 📊 **Conversation Management**
### 📊 **Conversation Management**

- Sidebar view of all captured conversations
- Search and filter conversations
- Export to markdown files
- Import context files from other chats

### 🔄 **Context Transfer**

- Export context from one workspace
- Import into new chat/workspace
- Preserves full conversation memory
- LLM-friendly format for maximum comprehension

---

## 🎮 Usage

### Quick Start

**Option 1: Automatic Capture** ⚡ (Recommended)

1. Enable smart clipboard (default):
   ```json
   "remember.smartClipboard": true
   ```
2. Copy AI conversations to clipboard
3. Remember auto-detects and captures
4. View in sidebar

**Option 2: Manual Capture** 🎯

1. Press `Ctrl+Alt+C` (or `Cmd+Alt+C` on Mac)
2. Paste conversation content
3. Click "Capture"

**Option 3: Editor Context** 🔍

Remember automatically tracks:
- File edits and changes
- Code selections
- Active files
- Infers when you're using AI assistants

### Resume Conversations

1. **Select** conversation in sidebar
2. **Press** `Ctrl+Alt+R` (or `Cmd+Alt+R` on Mac)
3. **Continue** in Copilot with full context!

The context assembler automatically creates optimal resume context:
- Preserves conversation flow
- Includes relevant history
- Fits within token budget
- Optimized for Copilot understanding

### View Context

**Show Editor Context**: `Remember: Show Editor Context`
- See tracked editor activity
- View AI inference confidence
- Check captured snapshots

**Preview Context Assembly**: `Remember: Preview Context Assembly`
- See how context will be assembled
- Check token usage
- Verify included messages

---

## ⚙️ Configuration

### Smart Capture Settings

```json
{
  // Enable smart clipboard monitoring
  "remember.smartClipboard": true,
  
  // Check clipboard every 2 seconds
  "remember.clipboardCheckInterval": 2,
  
  // Track editor context for AI detection
  "remember.editorContextTracking": true
}
```

### Context Assembly

```json
{
  "remember.contextAssembly": {
    "tokenLimit": 1600,           // Max tokens for context
    "includeRecentMessages": 5,    // Recent messages to include
    "includeRelevantHistory": 3    // Relevant history items
  }
}
```

### Other Settings

```json
{
  // Enable keyboard shortcuts
  "remember.enableKeyboardShortcuts": true,
  
  // Auto-export settings
  "remember.autoExport": {
    "enabled": false,
    "interval": 300000,
    "path": "./memory-exports"
  },
  
  // Default export format
  "remember.defaultExportFormat": "markdown"
}
```

---

## ⌨️ Keyboard Shortcuts

| Command | Windows/Linux | Mac |
|---------|--------------|-----|
| **Capture Conversation** | `Ctrl+Shift+C` | `Cmd+Shift+C` |
| **View Conversations** | `Ctrl+Shift+E` | `Cmd+Shift+E` |
| **Quick Capture** | `Ctrl+Alt+C` | `Cmd+Alt+C` |
| **Resume in Copilot** | `Ctrl+Alt+R` | `Cmd+Alt+R` |

---

## 📋 Commands

Access via Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

- `Remember: Quick Capture` - Instant conversation capture
- `Remember: Resume in Copilot` - Continue selected conversation
- `Remember: Show Editor Context` - View tracked context
- `Remember: Preview Context Assembly` - Preview resume context
- `Remember: Capture Conversation` - Manual capture dialog
- `Remember: View Conversations` - Open sidebar
- `Remember: Export as Optimal Context` - Export with 7-point format
- `Remember: Export Conversation` - Export to file
- `Remember: Import Conversation` - Import from file
- `Remember: Clear All Conversations` - Reset storage

---

## 🏗️ Architecture

### Capture Layers

```
┌─────────────────────────────────────┐
│   Layer 1: Editor Context Capture   │ ✅ 100%
├─────────────────────────────────────┤
│   Layer 2: Smart Clipboard Monitor  │ ✅ 100%
├─────────────────────────────────────┤
│   Layer 3: Webview Injection        │ 🔬 30% (experimental)
├─────────────────────────────────────┤
│   Layer 4: Command Wrapping         │ 🔬 20% (experimental)
├─────────────────────────────────────┤
│   Layer 5: User-Assisted Capture    │ ✅ 100%
└─────────────────────────────────────┘
```

### Context Assembly Pipeline

```
Input Conversation
      ↓
Extract Role & Persona (200 tokens)
      ↓
Extract Canonical State (600 tokens)
      ↓
Select Recent Messages (500 tokens)
      ↓
Search Relevant History (300 tokens)
      ↓
Compress to Fit Budget
      ↓
Output: Optimal Resume Context (≤1600 tokens)
```

---

## 🔍 Smart Detection

### Supported Platforms

| Platform | Detection Method | Confidence |
|----------|-----------------|-----------|
| **GitHub Copilot** | Pattern matching | 95% |
| **Google Gemini** | Pattern matching | 90% |
| **ChatGPT** | Pattern matching | 90% |
| **Claude** | Pattern matching | 90% |
| **Generic AI** | Fallback detection | 70% |

### Detection Features

- **Code Block Extraction**: Preserves formatting and language
- **Message Threading**: Maintains conversation structure
- **Metadata Extraction**: Captures platform, timestamp, context
- **Confidence Scoring**: Quality assurance for captures

---

## 💡 Tips & Best Practices

### Maximize Capture Accuracy

1. **Enable smart clipboard** for automatic detection
2. **Copy full conversations** (not fragments)
3. **Use quick capture** (Ctrl+Alt+C) for instant saves

### Optimize Context Assembly

1. **Adjust token limit** based on your needs:
   - 1,600 tokens: Optimal for Copilot (default)
   - 2,000 tokens: More context, may hit limits
   - 1,200 tokens: Faster, less context

2. **Configure message counts**:
   - More recent messages = better continuity
   - More history = better pattern recognition

### Resume Conversations

1. **Review context preview** before resuming
2. **Edit assembled context** if needed
3. **Use descriptive titles** for easy finding

---

## 🐛 Troubleshooting

### Smart Clipboard Not Working

**Problem**: Conversations not auto-detected

**Solutions**:
1. Check setting: `"remember.smartClipboard": true`
2. Verify clipboard interval: `"remember.clipboardCheckInterval": 2`
3. Copy full conversation (including AI responses)
4. Try manual capture (Ctrl+Alt+C) as fallback

### Resume Context Too Large

**Problem**: Context exceeds token limit

**Solutions**:
1. Reduce `tokenLimit` in settings
2. Decrease `includeRecentMessages` count
3. Decrease `includeRelevantHistory` count
4. Use context preview to verify size

### Editor Context Not Tracking

**Problem**: AI usage not detected

**Solutions**:
1. Enable: `"remember.editorContextTracking": true`
2. Make sure you're actively editing files
3. Check status bar for inference confidence
4. Try using Copilot explicitly (triggers detection)

### Missing Conversations

**Problem**: Expected conversations not showing

**Solutions**:
1. Check sidebar filter settings
2. Verify storage location
3. Try importing from file
4. Use search feature

---

## 📚 Advanced Usage

### Custom Context Templates

Create custom context formats for specific use cases:

```javascript
// In context assembly settings
{
  "remember.contextAssembly": {
    "tokenLimit": 2000,
    "customTemplate": {
      "role": 300,
      "state": 800,
      "recent": 600,
      "history": 300
    }
  }
}
```

### Batch Export

Export multiple conversations:

```javascript
// Use command palette
Remember: Export All Conversations
```

### Integration with Chrome Extension

Sync conversations between VS Code and browser:

1. Export from VS Code
2. Import into Chrome extension
3. Continue in browser AI chat
4. Export from browser
5. Import back to VS Code

---

## 🔐 Privacy & Security

- **100% Local**: All data stored locally in VS Code storage
- **No Cloud**: No external servers or API calls
- **No Telemetry**: Zero tracking or analytics
- **Your Data**: You own and control all conversations
- **Free Forever**: No paid services or subscriptions required

---

## 🛠️ Development

### Project Structure

```
vscode-extension/
├── src/
│   ├── capture/
│   │   ├── editorContextCapture.js    # Layer 1 capture
│   │   └── smartClipboard.js          # Layer 2 capture
│   ├── assembler/
│   │   └── contextAssemblerVSCode.js  # Context assembly
│   ├── storage/
│   │   └── conversationStorage.js     # Persistence
│   └── ui/
│       └── conversation-sidebar.js    # Sidebar UI
├── extension.js                        # Main entry point
├── package.json                        # Extension manifest
└── README.md                           # This file
```

### Build & Test

```bash
# Install dependencies
npm install

# Run extension in development
# Press F5 in VS Code

# Package for distribution
vsce package
```

---

## 📈 Roadmap

### v4.1 (Next)
- [ ] Enhanced webview injection
- [ ] Semantic search across conversations
- [ ] Export to MemoryForge cloud sync
- [ ] Conversation analytics

### v4.2 (Future)
- [ ] Multi-workspace sync
- [ ] Custom context templates UI
- [ ] Integration API for other extensions
- [ ] Advanced filtering and tagging

---

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## 📄 License

MIT License - See [LICENSE](./LICENSE) for details

---

## 🙏 Acknowledgments

- Built on VS Code Extension API
- Inspired by Remember Chrome Extension
- Part of the MemoryForge ecosystem

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/remember-vscode/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/remember-vscode/discussions)
- **Email**: support@memoryforge.ai

---

**Made with ❤️ for developers who want to remember everything**
3. Choose save location
4. Context file opens automatically

### Import Context to New Chat

1. Run command: `Remember: Import Context File`
2. Select `.md` context file
3. Copy content to new Copilot Chat
4. AI now has full memory of previous conversation!

## Commands

- `Remember: Capture Current Conversation` - Capture active conversation
- `Remember: Export as Optimal Context` - Export as 7-point format
- `Remember: View All Conversations` - Open sidebar
- `Remember: Import Context File` - Import context

## Settings

```json
{
  "remember.autoCapture": true,
  "remember.captureInterval": 5,
  "remember.maxConversations": 100
}
```

## Context Format

The exported context follows the optimal 7-point structure for maximum LLM comprehension:

1. **User Style** - Communication patterns
2. **Goal** - Purpose of conversation
3. **Key Facts** - Files, topics, technical details
4. **Corrections** - Mistakes and how to fix them
5. **Preferences** - Always/never rules
6. **Key Messages** - Most important prompts
7. **Open Tasks** - Unfinished work

## Requirements

- VS Code 1.85.0 or higher
- GitHub Copilot (optional, but recommended)

## Installation

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Remember"
4. Click Install

## License

MIT
