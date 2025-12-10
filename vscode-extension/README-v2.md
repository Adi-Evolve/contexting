# Remember VS Code Extension v2.0

🧠 **Persistent AI Memory for VS Code Copilot Conversations**

Automatically capture, organize, and export your VS Code Copilot Chat conversations with smart threading, multiple export formats, and powerful search capabilities.

---

## ✨ Features

### 🎯 Core Features
- **Automatic Conversation Capture**: Monitors clipboard and VS Code Copilot Chat
- **Smart Storage Management**: Keeps 50 most recent conversations, archives older ones
- **Multiple Export Formats**: JSON, Markdown, Plain Text, HTML
- **Conversation Threading**: Automatically detects topic shifts and threads
- **Code Language Detection**: Identifies 20+ programming languages used
- **Tool Usage Tracking**: Tracks 100+ development tools mentioned

### 🆕 Version 2.0 Features
- **Error Handling**: Robust error recovery and validation
- **Storage Limits**: 50-conversation limit with automatic archiving
- **Export Formats**: 4 export formats (JSON, Markdown, Text, HTML)
- **Date/Time Tracking**: Full timestamp support for all conversations
- **Merge Conversations**: Combine related conversations
- **Keyboard Shortcuts**: `Ctrl+Shift+C` (capture), `Ctrl+Shift+E` (view)
- **Search**: Full-text search across all conversations
- **Statistics**: View storage usage and conversation stats

---

## 📦 Installation

### From VSIX (Recommended)
1. Download `remember-vscode-2.0.0.vsix`
2. Open VS Code
3. Press `Ctrl+Shift+P` → "Extensions: Install from VSIX"
4. Select the downloaded file

### From Source
```bash
cd vscode-extension
npm install
code .
# Press F5 to launch extension development host
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+Shift+C` (Win/Linux)<br>`Cmd+Shift+C` (Mac) | **Capture Conversation** | Save current conversation |
| `Ctrl+Shift+E` (Win/Linux)<br>`Cmd+Shift+E` (Mac) | **View Conversations** | Open conversation list |

---

## 🎮 Commands

Access via Command Palette (`Ctrl+Shift+P`):

### Main Commands
- `Remember: Capture Current Conversation` - Save active conversation
- `Remember: View All Conversations` - Browse saved conversations
- `Remember: Export Conversations` - Export with format selector
- `Remember: Search Conversations` - Full-text search

### Export Commands
- `Remember: Export as JSON` - Structured data format
- `Remember: Export as Markdown` - Human-readable format
- `Remember: Export as Plain Text` - Simple text format
- `Remember: Export as HTML` - Web page format

### Management Commands
- `Remember: Merge Conversations` - Combine multiple conversations
- `Remember: Show Statistics` - View storage usage
- `Remember: Download Archive` - Export archived conversations
- `Remember: Clear All Conversations` - Delete all data

---

## 📊 Export Formats

### 1. JSON (Best for: Backup, Data Portability)
```json
{
  "exported": "2024-12-10T10:30:00.000Z",
  "version": "2.0",
  "source": "Remember - AI Memory (VS Code)",
  "count": 45,
  "conversations": [...]
}
```

### 2. Markdown (Best for: Documentation, Sharing)
```markdown
# Remember - VS Code Conversation Export

**Exported:** 2024-12-10T10:30:00.000Z
**Total Conversations:** 45

---

## 1. Python Data Analysis

- **Date:** 12/10/2024, 10:00 AM
- **Platform:** VS Code
- **Messages:** 12

[Conversation content...]
```

### 3. Plain Text (Best for: Simple Text Editors)
```
REMEMBER - VS CODE CONVERSATION EXPORT
Exported: 2024-12-10T10:30:00.000Z
Total Conversations: 45

[1] Python Data Analysis
Date: 12/10/2024, 10:00 AM
Platform: VS Code
Messages: 12

USER: How do I analyze CSV data?
ASSISTANT: Here's how...
```

### 4. HTML (Best for: Web Viewing, Printing)
Beautiful styled web page with color-coded messages, ready to open in browser.

---

## 🔧 Configuration

Open Settings (`Ctrl+,`) and search for "Remember":

```json
{
  // Auto-capture Copilot conversations
  "remember.autoCapture": true,
  
  // Minutes between auto-saves
  "remember.captureInterval": 5,
  
  // Max active conversations (50 recommended)
  "remember.maxConversations": 50,
  
  // Theme: "light", "dark", or "auto"
  "remember.theme": "auto",
  
  // Default export format
  "remember.exportFormat": "markdown",
  
  // Enable keyboard shortcuts
  "remember.enableKeyboardShortcuts": true
}
```

---

## 📚 Usage Examples

### Capture a Conversation
1. Have a conversation with Copilot Chat
2. Press `Ctrl+Shift+C` or run command "Remember: Capture Current Conversation"
3. Conversation saved with timestamp and metadata

### Export Multiple Formats
1. Run "Remember: Export Conversations"
2. Select format (JSON, Markdown, Text, or HTML)
3. Choose save location
4. File saved with all conversation data

### Merge Related Conversations
1. Run "Remember: Merge Conversations"
2. Select 2+ conversations to combine
3. Confirm merge
4. Messages combined chronologically into single conversation

### Search Conversations
1. Run "Remember: Search Conversations"
2. Enter search keywords
3. Browse matching conversations
4. Select one to view details

---

## 🗄️ Storage Management

### How It Works
- **Active Storage**: 50 most recent conversations
- **Archive**: Older conversations automatically archived (up to 200)
- **Total Capacity**: 250 conversations (50 active + 200 archived)

### What Happens When Limit Reached
1. 51st conversation triggers auto-archive
2. Oldest conversation moved to archive
3. You can download archive anytime
4. No data loss - everything preserved

### Storage Statistics
Run "Remember: Show Statistics" to see:
- Active conversations: 45/50
- Archived conversations: 23
- Total messages: 1,234
- Storage used: 2.5 MB
- Visual progress bar

---

## 🔗 Conversation Threading

Automatically detects topic shifts within conversations:

```markdown
## 🧵 Conversation Threads

*Detected 3 distinct topics within this conversation:*

**Thread 1: Python Setup**
- Messages: 1-8 (8 messages)
- Confidence: 85%

**Thread 2: Data Analysis**
- Messages: 9-16 (8 messages)
- Confidence: 92%

**Thread 3: Error Debugging**
- Messages: 17-24 (8 messages)
- Confidence: 78%
```

---

## 💻 Code Language Detection

Identifies languages used in conversations:

```markdown
**Languages:** Python (5x), JavaScript (3x), SQL (2x)
```

Supports 20+ languages:
- Python, JavaScript, TypeScript, Java, C#, C++, Go, Rust
- HTML, CSS, SQL, Shell, PowerShell, Bash
- Ruby, PHP, Swift, Kotlin, Dart, R, MATLAB, JSON, YAML, XML

---

## 🛠️ Tool Usage Tracking

Tracks development tools mentioned:

```markdown
## 🛠️ Tools & Technologies

**Development Tools (4):**
- npm (3 mentions)
- Git (2 mentions)
- Docker (1 mention)
- VS Code (5 mentions)

**VS Code Extensions (2):**
- Python (2 mentions)
- ESLint (1 mention)
```

---

## ⚠️ Error Handling

### Robust Error Recovery
- **Validation**: All conversations validated before storage
- **Retry Logic**: Automatic retry with exponential backoff
- **User Notifications**: Clear error messages
- **Error Logging**: Debug information for troubleshooting

### Common Issues

**Issue: "No active conversation to capture"**
- Solution: Have a conversation with Copilot first

**Issue: "Storage quota exceeded"**
- Solution: Export and clear old conversations

**Issue: "Failed to export"**
- Solution: Check file permissions, try different location

---

## 🚀 Performance

### Storage Efficiency
- 50 active conversations: ~5-10 MB
- 200 archived conversations: ~20-40 MB
- Total usage: Well within VS Code limits

### Export Performance
- 50 conversations → JSON: ~50ms
- 50 conversations → Markdown: ~100ms
- 50 conversations → HTML: ~150ms

---

## 🔐 Privacy & Security

- **Local Storage Only**: All data stored locally in VS Code workspace
- **No Cloud Sync**: No data sent to external servers
- **User Control**: Complete control over data export and deletion
- **No Telemetry**: No usage tracking or analytics

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

Repository: [https://github.com/Adi-Evolve/contexting](https://github.com/Adi-Evolve/contexting)

---

## 📝 Changelog

### v2.0.0 (December 10, 2024)
- ✅ Error handling and validation
- ✅ Storage management (50-conversation limit)
- ✅ Multiple export formats (JSON, Markdown, Text, HTML)
- ✅ Date/time tracking
- ✅ Merge conversations
- ✅ Keyboard shortcuts (Ctrl+Shift+C, Ctrl+Shift+E)
- ✅ Full-text search
- ✅ Statistics dashboard

### v1.0.0 (Initial Release)
- Basic conversation capture
- Conversation threading
- Code language detection
- Tool usage tracking
- Single export format

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/Adi-Evolve/contexting/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Adi-Evolve/contexting/discussions)
- **Email**: support@remember.ai (placeholder)

---

## 🎯 Roadmap

### Future Features
- [ ] Cloud sync (optional)
- [ ] Conversation tags and categories
- [ ] AI-powered summaries
- [ ] Conversation sharing links
- [ ] Import conversations from JSON
- [ ] Custom export templates
- [ ] Scheduled auto-exports
- [ ] Conversation analytics

---

**Made with ❤️ for VS Code developers**

🧠 **Remember**: Never lose context again
