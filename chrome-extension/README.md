# 🧠 VOID - Universal AI Memory Extension

**Persistent memory for ALL AI chats: ChatGPT, Claude, Gemini, and more. Never lose context again.**

## ⚡ NEW: Resume Chat Feature

**Intelligently resume conversations across chat sessions with smart 4-layer context compression.**

### Key Features
- 🎯 **4-Layer Context System** - Role, Decisions, Recent Messages, Relevant History
- 🔍 **Contradiction Detection** - Warns about conflicting information
- 📊 **Token Budget Management** - Automatically fits within 1,600 tokens
- 🔄 **Multi-Model Support** - Export for ChatGPT, Claude, Gemini, or LLaMA
- ✏️ **Editable Context** - Review and modify before inserting
- ⚡ **Fast** - Assembly in < 500ms

[📖 Read the User Guide](USER_GUIDE.md) | [🧪 Testing Guide](TESTING_GUIDE.md) | [💻 Dev Reference](DEV_REFERENCE.md)

---

## 🚀 Quick Start

### Installation

1. **Download:**
   ```bash
   git clone https://github.com/Adi-Evolve/contexting.git
   cd contexting/chrome-extension
   ```

2. **Load in Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `chrome-extension/` folder

3. **Start Using:**
   - Visit ChatGPT, Claude, or Gemini
   - Extension automatically captures conversations
   - Click ⚡ button to open sidebar
   - Click 🔄 Resume to continue any conversation

### First Time Setup

No configuration needed! Just:
1. Have a conversation on any supported platform
2. Click the ⚡ VOID button (bottom right)
3. Your conversation is automatically saved
4. Click 🔄 Resume anytime to continue

---

## ✨ Core Features

### 🔄 Resume Chat (NEW)
- **Smart Context Assembly** - 4-layer intelligent compression
- **Contradiction Warnings** - Detects conflicting advice
- **Token Budget** - Automatically fits 1,600 token limit
- **Multi-Model Export** - Works with all major AI platforms
- **Visual Preview** - See context before inserting

### 📚 Conversation Management
- Automatic capture of all conversations
- Search and filter saved chats
- Platform-specific organization
- One-click resume from anywhere

### 🧠 Advanced Memory
- Semantic search across conversations
- Hierarchical conversation structure
- Delta compression for efficiency
- Duplicate detection

### 🎨 Beautiful UI
- Beautiful comic-themed sidebar
- Dark mode support
- Responsive design
- Modal context preview

### 🔒 Privacy First
- All data stored locally in your browser
- No external servers
- No tracking or analytics
- You own your data

---

## 🎯 Usage Examples

### Example 1: Resume a Coding Project
```
1. Yesterday: Discussed Python web scraper
2. Today: Click Resume → Context loaded
3. Ask: "Can we add error handling now?"
4. AI has full project context!
```

### Example 2: Research Continuation
```
1. Last week: Researched ML algorithms
2. This week: Click Resume → Context loaded  
3. Ask: "Which algorithm should I use for time series?"
4. AI remembers your research criteria!
```

### Example 3: Cross-Platform Resume
```
1. Start in ChatGPT: "Help me design a database"
2. Save conversation
3. Open Claude: Click Resume → Select "Claude" format
4. Continue: "Now help optimize the queries"
```

---

## 📖 Documentation

- **[User Guide](USER_GUIDE.md)** - Complete end-user documentation
- **[Testing Guide](TESTING_GUIDE.md)** - How to test all features
- **[Dev Reference](DEV_REFERENCE.md)** - Technical architecture & API
- **[Quickstart](QUICKSTART.md)** - Get started in 2 minutes

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         Content Scripts                  │
│  ├── Conversation Capture                │
│  ├── Resume Chat UI                      │
│  └── Context Preview Modal               │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│      Background Service Worker           │
│  ├── Storage Management                  │
│  ├── Context Assembly API                │
│  └── 7 Advanced Modules:                 │
│      • Hierarchy Manager                 │
│      • Delta Engine                      │
│      • Semantic Fingerprint              │
│      • Causal Reasoner                   │
│      • MultiModal Handler                │
│      • LLM Query Engine                  │
│      • Context Assembler V2              │
└─────────────────────────────────────────┘
```

---

## 🔧 Technical Details

### Tech Stack
- Chrome Extension Manifest V3
- Vanilla JavaScript (no frameworks)
- Chrome Storage API
- Service Worker architecture

### Storage
- Local storage via `chrome.storage.local`
- Unlimited storage permission
- Delta compression for efficiency
- Semantic fingerprints for search

### Performance
- Context assembly: < 500ms
- Token estimation: < 50ms
- Supports 100+ saved conversations
- Efficient memory usage

### Supported Platforms
- ✅ ChatGPT (chat.openai.com, chatgpt.com)
- ✅ Claude (claude.ai)
- ✅ Google Gemini (gemini.google.com)
- ✅ Grok (x.com/i/grok)
- ✅ DeepSeek (chat.deepseek.com)
- ✅ Perplexity (perplexity.ai)
- ✅ Poe (poe.com)
- ✅ HuggingChat (huggingface.co/chat)

---

## 🚧 Roadmap

### Current Version (1.0.0)
- [x] Resume Chat with 4-layer context
- [x] Contradiction detection
- [x] Token budget enforcement
- [x] Multi-model export
- [x] Context preview modal
- [x] Comprehensive documentation

### Next Up (1.1.0)
- [ ] Conversation tagging
- [ ] Advanced search filters
- [ ] Conversation merging
- [ ] Export to file (JSON/Markdown)
- [ ] Custom token limits in UI
- [ ] Auto-detection of AI platform

### Future (2.0.0)
- [ ] Cloud sync (optional)
- [ ] Mobile support
- [ ] Voice memo integration
- [ ] Collaborative conversations
- [ ] API access

---

## 🐛 Known Issues

## 🐛 Known Issues

- Extension requires reload after Chrome updates
- Some dynamic chat interfaces may need page refresh
- Very large conversations (500+ messages) may be slow

**Found a bug?** [Open an issue](https://github.com/Adi-Evolve/contexting/issues)

---

## 🤝 Contributing

Contributions welcome! Areas that need help:
- Unit tests for context assembler
- Additional AI platform support
- Performance optimizations
- UI/UX improvements

See [DEV_REFERENCE.md](DEV_REFERENCE.md) for technical details.

---

## 📜 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

Built with:
- Chrome Extensions API
- Inspired by the need for persistent AI context
- Community feedback and testing

---

## 📞 Support

- **Documentation**: Check USER_GUIDE.md
- **Issues**: GitHub Issues
- **Email**: support@void-extension.com (coming soon)

---

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Status**: ✅ Production Ready

---

Made with ❤️ for the AI community
- No mobile support yet

## 🛠️ Development

Want to improve the extension? Here's how:

```bash
# Make changes to the files
# Then reload the extension in chrome://extensions/
```

## 📝 License

MIT License - Feel free to modify and use!

## 💬 Support

Found a bug? Have a feature request?
- Open an issue on GitHub
- Email: support@remember.ai

---

**Made with ❤️ by the Remember team**
