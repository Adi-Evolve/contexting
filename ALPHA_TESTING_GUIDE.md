# MemoryForge Alpha Testing Guide 🧪

Welcome to MemoryForge Alpha Testing! Thank you for being an early tester.

## What You're Testing

MemoryForge is an **AI Memory System** that captures, organizes, and semantically searches your ChatGPT conversations. It includes:

✅ Chrome Extension (automatic capture)  
✅ Full-stack server (knowledge graph, compression, analytics)  
✅ Semantic search with TF-IDF fingerprinting  
✅ Knowledge graph visualization  
✅ Memory compression algorithms  
✅ Advanced analytics and insights  

## Quick Setup (5 Minutes)

### Option 1: Server + Extension (Full Features)

#### Step 1: Start the Server

```bash
cd server
npm install
npm start
```

Server runs on `http://localhost:3000`

#### Step 2: Load Chrome Extension

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select: `chrome-extension` folder
5. Extension loaded! ✅

#### Step 3: Test on ChatGPT

1. Go to `https://chat.openai.com`
2. Look for 🧠 button (bottom right)
3. Click it → Sidebar appears
4. Chat with ChatGPT → Messages captured automatically
5. Search your memories → Results appear with scores

### Option 2: Extension Only (Basic Features)

If you don't want to run the server:

1. Open `chrome-extension/manifest.json`
2. Replace `background.js` with the original (not background-enhanced.js)
3. Load extension in Chrome (steps above)
4. Works locally with 1,000 message limit

## Testing Checklist

### Basic Functionality (30 minutes)

- [ ] **Extension Installation**
  - [ ] Extension loads without errors
  - [ ] Icon appears in toolbar
  - [ ] Popup opens with stats

- [ ] **Message Capture**
  - [ ] Open ChatGPT
  - [ ] Send a message
  - [ ] Check popup → Count increases
  - [ ] Check console (F12) → No errors

- [ ] **Sidebar UI**
  - [ ] Click 🧠 button → Sidebar slides in
  - [ ] Search box visible
  - [ ] Filter buttons visible (All, User, Assistant, Recent)
  - [ ] No visual glitches

- [ ] **Search Functionality**
  - [ ] Type "JavaScript" in search
  - [ ] Results appear instantly
  - [ ] Scores displayed (0.30-1.00)
  - [ ] Relevant results ranked higher
  - [ ] Click "Copy" → Text copied
  - [ ] Click "Insert" → Text appears in ChatGPT input

- [ ] **Export**
  - [ ] Click extension icon → popup
  - [ ] Click "Export Memories"
  - [ ] JSON file downloads
  - [ ] File contains all memories

### Advanced Features (Server Required) (1 hour)

- [ ] **Server Connection**
  - [ ] Open browser console on ChatGPT
  - [ ] Check for "✅ Server connected" message
  - [ ] No "❌ Server unavailable" warnings

- [ ] **Knowledge Graph**
  - [ ] Open: `http://localhost:3000/api/knowledge-graph`
  - [ ] Returns JSON with nodes and edges
  - [ ] Node count > 0 after capturing messages
  - [ ] Edges have types: semantic-similar, temporal-next, entity-related

- [ ] **Compression**
  - [ ] Open: `http://localhost:3000/api/compression/stats`
  - [ ] Returns compression statistics
  - [ ] Test compression via API:
    ```bash
    curl -X POST http://localhost:3000/api/compression/compress \
      -H "Content-Type: application/json" \
      -d '{"memoryIds": ["mem_xxx"], "level": "auto"}'
    ```
  - [ ] Check compression ratio returned

- [ ] **Analytics**
  - [ ] Open: `http://localhost:3000/api/analytics`
  - [ ] Returns dashboard data
  - [ ] Overview section present
  - [ ] Timeline data present
  - [ ] Top topics listed
  - [ ] Sentiment distribution shown

- [ ] **Semantic Search (Server)**
  - [ ] Use server search API:
    ```bash
    curl -X POST http://localhost:3000/api/search \
      -H "Content-Type: application/json" \
      -d '{"query": "JavaScript functions", "limit": 10}'
    ```
  - [ ] Results returned
  - [ ] Scores between 0.3 and 1.0
  - [ ] Relevant results first

### Performance Testing (30 minutes)

- [ ] **100 Messages**
  - [ ] Chat with ChatGPT until 100+ messages captured
  - [ ] Search still fast (<500ms)
  - [ ] No memory leaks in console
  - [ ] Extension responsive

- [ ] **500 Messages**
  - [ ] Continue to 500+ messages
  - [ ] Check popup → stats update correctly
  - [ ] Search speed: <1 second
  - [ ] No browser slowdowns

- [ ] **1000 Messages (Free Tier Limit)**
  - [ ] Reach 1,000 messages
  - [ ] Check if older messages pruned
  - [ ] Count stays at 1,000
  - [ ] Warning shown? (optional feature)

### Edge Cases (1 hour)

- [ ] **Network Issues**
  - [ ] Stop server (Ctrl+C)
  - [ ] Check if extension falls back to local storage
  - [ ] Capture still works
  - [ ] Search still works (local)
  - [ ] Restart server → reconnects automatically

- [ ] **Long Messages**
  - [ ] Send 500+ word message to ChatGPT
  - [ ] Check if captured completely
  - [ ] Search includes long message
  - [ ] No truncation issues

- [ ] **Special Characters**
  - [ ] Send message with emojis: 🚀 🧠 💡
  - [ ] Send code: ```javascript console.log("test");```
  - [ ] Send math: $E = mc^2$
  - [ ] All captured correctly

- [ ] **Multiple Tabs**
  - [ ] Open 2+ ChatGPT tabs
  - [ ] Chat in both
  - [ ] Check if both capture messages
  - [ ] No duplicate messages

- [ ] **Page Refresh**
  - [ ] Refresh ChatGPT page
  - [ ] Extension reinitializes
  - [ ] Previous memories still accessible
  - [ ] No data loss

## Bug Reporting

### How to Report Bugs

1. **GitHub Issues**: https://github.com/Adi-Evolve/contexting/issues
2. **Email**: support@memoryforge.ai
3. **Include**:
   - Steps to reproduce
   - Expected vs actual behavior
   - Console errors (F12 → Console)
   - Screenshot if UI issue
   - Browser version (Chrome version)

### Example Bug Report

```
Title: Search not working after 500 messages

Steps to reproduce:
1. Capture 500+ messages
2. Search for "JavaScript"
3. No results appear

Expected: Search results with relevance scores
Actual: Empty results list

Console errors:
TypeError: Cannot read property 'fingerprint' of undefined
  at searchMemories (background.js:123)

Browser: Chrome 119.0.6045.105
OS: Windows 11
```

## Feature Requests

During alpha testing, we want to know:

1. **What features do you love?**
2. **What's confusing or frustrating?**
3. **What would you add?**
4. **Would you pay for this?** (SaaS model feedback)

Share feedback at: alpha-feedback@memoryforge.ai

## Known Issues

### Current Limitations

⚠️ **Chrome Only**: Works only in Chrome/Edge (not Firefox/Safari yet)  
⚠️ **ChatGPT Only**: Doesn't capture Claude/Bard yet (coming soon)  
⚠️ **Local Server**: Must run server locally (cloud deployment in beta)  
⚠️ **No Authentication**: Server has no user auth yet (beta feature)  
⚠️ **1K Message Limit**: Free tier limited to 1,000 messages  

### Known Bugs (Working on Fixes)

🐛 **Sometimes sidebar doesn't appear**: Refresh page to fix  
🐛 **First search slow**: Fingerprint generation happens on first search  
🐛 **Server disconnects**: No auto-reconnect yet, restart extension  

## Testing Scenarios

### Scenario 1: Developer Workflow (30 min)

1. Ask ChatGPT: "How do I implement semantic search in JavaScript?"
2. Get response, continue conversation
3. Ask: "Show me code examples"
4. After 10+ messages, search for "semantic search"
5. Check if relevant messages appear first
6. Test copy/insert functionality
7. Export memories → check JSON structure

### Scenario 2: Learning Session (45 min)

1. Ask ChatGPT to explain React hooks
2. Ask follow-up questions about useState, useEffect
3. After session, search "useState"
4. Verify all useState mentions found
5. Check knowledge graph: http://localhost:3000/api/knowledge-graph
6. Look for edges between useState and useEffect nodes
7. Test analytics: http://localhost:3000/api/analytics

### Scenario 3: Long-term Usage (2-3 days)

1. Use MemoryForge daily for 2-3 days
2. Capture 100+ messages per day
3. Search for topics from previous days
4. Check if old memories still searchable
5. Monitor browser performance
6. Check storage usage (popup → stats)
7. Test compression after day 2

## Success Criteria

### Alpha is successful if:

✅ Extension loads without errors  
✅ Messages captured automatically  
✅ Search returns relevant results  
✅ No browser crashes or slowdowns  
✅ Server APIs work correctly  
✅ Export functionality works  
✅ Knowledge graph generates  
✅ Analytics dashboard loads  

### Alpha fails if:

❌ Extension crashes frequently  
❌ Search returns random results  
❌ Messages not captured  
❌ Server errors on every request  
❌ Data loss on page refresh  
❌ Browser becomes unusable  

## Next Steps After Alpha

1. **Bug Fixes** (1 week)
   - Fix critical bugs reported
   - Performance optimizations
   - UI polish

2. **Beta Testing** (2 weeks)
   - Expand to 100 users
   - Add authentication
   - Deploy server to cloud
   - Add payment system

3. **Public Launch** (4 weeks)
   - Chrome Web Store submission
   - Marketing campaign
   - Documentation site
   - User onboarding

## Questions?

### FAQ

**Q: How do I update to latest version?**  
A: `git pull` then restart server and reload extension

**Q: Can I use without the server?**  
A: Yes! Use local-only mode (1K message limit)

**Q: Will my data be deleted?**  
A: No, stored locally in Chrome and optionally on server

**Q: What happens after alpha?**  
A: You get free Pro tier for 1 year! 🎉

**Q: Can I share with friends?**  
A: Please do! More testers = better product

## Thank You! 🙏

Your testing helps make MemoryForge amazing. Every bug report and suggestion matters.

**Alpha Tester Perks:**
- Free Pro tier for 1 year (500K messages, full features)
- Name in credits
- Early access to new features
- Direct line to developers

---

**Testing Period**: December 10, 2025 - December 24, 2025 (2 weeks)  
**Goal**: 10 alpha testers, 50+ bug reports, stable beta build  

Let's build something awesome together! 🚀
