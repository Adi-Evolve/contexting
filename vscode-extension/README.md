# MemoryForge - VS Code Extension

Extract and preserve AI conversation context from VS Code Copilot chats.

## Features

✨ **100% Automatic Capture** 🚀
- **Zero manual work** - Just chat normally with GitHub Copilot or Gemini
- Automatically monitors all chat conversations in real-time
- Captures every message as you type
- Works in background - you don't have to do anything!

🎯 **Optimal Context Extraction**
- Converts conversations to 7-point LLM-optimized format
- Detects failures, preferences, and important prompts
- Extracts file references and technical context

💾 **Conversation Management**
- Sidebar view of all captured conversations
- Search and filter conversations
- Export to markdown files
- Import context files from other chats

🔄 **Context Transfer**
- Export context from one workspace
- Import into new chat/workspace
- Preserves full conversation memory
- LLM-friendly format for maximum comprehension

## Usage

### Automatic Mode (Default) ⚡

**Nothing to do!** Just use VS Code normally:

1. Open GitHub Copilot Chat (`Ctrl+Shift+I`)
2. Chat with Copilot as usual
3. MemoryForge **automatically captures** every message in the background
4. View captured conversations in MemoryForge sidebar (Activity Bar)
5. Export anytime with one click!

**Supported:**
- ✅ GitHub Copilot Chat (real-time monitoring)
- ✅ Gemini AI in VS Code (clipboard monitoring)
- ✅ Any chat copied to clipboard (auto-detect)

### Export as Optimal Context

1. Run command: `MemoryForge: Export as Optimal Context`
2. Select conversation from list
3. Choose save location
4. Context file opens automatically

### Import Context to New Chat

1. Run command: `MemoryForge: Import Context File`
2. Select `.md` context file
3. Copy content to new Copilot Chat
4. AI now has full memory of previous conversation!

## Commands

- `MemoryForge: Capture Current Conversation` - Capture active conversation
- `MemoryForge: Export as Optimal Context` - Export as 7-point format
- `MemoryForge: View All Conversations` - Open sidebar
- `MemoryForge: Import Context File` - Import context

## Settings

```json
{
  "memoryforge.autoCapture": true,
  "memoryforge.captureInterval": 5,
  "memoryforge.maxConversations": 100
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
3. Search for "MemoryForge"
4. Click Install

## License

MIT
