# 🧠 MemoryForge Chrome Extension

**Persistent memory for ChatGPT and Claude. Never forget your conversations.**

## 🚀 Installation

### Option 1: Install from Chrome Web Store (Coming Soon)
1. Visit [Chrome Web Store](#)
2. Click "Add to Chrome"
3. Done!

### Option 2: Install Locally (For Testing)

1. **Download the extension:**
   - Download this `chrome-extension` folder

2. **Open Chrome Extensions:**
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (top right)

3. **Load the extension:**
   - Click "Load unpacked"
   - Select the `chrome-extension` folder
   - The 🧠 icon will appear in your toolbar

4. **Try it out:**
   - Go to https://chat.openai.com
   - Start chatting
   - Click the 🧠 button (bottom right)
   - Your memories are automatically captured!

## ✨ Features

### Automatic Capture
- Captures all ChatGPT conversations automatically
- No manual copy/paste needed
- Works in the background

### Semantic Search
- Search by meaning, not just keywords
- Find relevant past conversations instantly
- Smart similarity scoring

### Memory Sidebar
- Beautiful sidebar that slides in
- Filter by role (You/ChatGPT)
- Quick copy or insert into chat

### Privacy First
- All data stored locally in your browser
- No cloud sync (coming in paid version)
- No tracking or analytics

## 🎯 How to Use

1. **Just chat normally** - MemoryForge captures everything automatically

2. **Search memories** - Click the 🧠 button and search

3. **Insert context** - Click "Insert" to add past memories to your current chat

4. **Export data** - Click Export in the popup to download all memories

## 🔧 Technical Details

- Uses Chrome Extension Manifest V3
- Stores data in chrome.storage.local
- Semantic fingerprinting for search
- Free tier: 1,000 messages

## 📊 Storage Limits

- **Free**: 1,000 messages (local only)
- **Pro** (coming soon): Unlimited + cloud sync

## 🐛 Known Issues

- Only works on chat.openai.com and claude.ai
- Requires page refresh after installation
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
- Email: support@memoryforge.ai

---

**Made with ❤️ by the MemoryForge team**
