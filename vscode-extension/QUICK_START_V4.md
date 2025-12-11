# Quick Start Guide - Remember v4.0

Get started with Remember VS Code Extension v4.0 in 5 minutes.

---

## 🚀 Installation

### Option 1: Development Mode (Testing)

1. **Open Extension in VS Code**:
   ```bash
  cd vscode-extension
npm install
# Press F5 to test
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run in Development**:
   - Press `F5` in VS Code
   - New "Extension Development Host" window opens
   - Extension is now active in that window

### Option 2: Package & Install

1. **Build .vsix Package**:
   ```bash
   npm install -g vsce
   vsce package
   ```

2. **Install .vsix**:
   - Open VS Code
   - Go to Extensions view (Ctrl+Shift+X)
   - Click "..." menu → "Install from VSIX"
   - Select `remember-vscode-4.0.0.vsix`

---

## 🎯 Quick Test Scenarios

### Test 1: Smart Clipboard Auto-Capture (2 minutes)

**Goal**: Verify automatic conversation detection

1. **Enable smart clipboard** (should be default):
   - Open Settings (Ctrl+,)
   - Search "remember clipboard"
   - Ensure `remember.smartClipboard` is checked

2. **Copy an AI conversation**:
   - Go to ChatGPT/Copilot/Gemini
   - Copy a conversation (User + AI messages)
   - Paste to clipboard

3. **Wait 2-3 seconds**:
   - Remember monitors clipboard every 2 seconds
   - Should auto-detect conversation

4. **Verify capture**:
   - Open Remember sidebar (Activity Bar icon)
   - Check if conversation appears
   - Should see title, timestamp, platform detected

**Expected Result**: ✅ Conversation appears in sidebar automatically

---

### Test 2: Quick Capture (1 minute)

**Goal**: Manual capture with keyboard shortcut

1. **Copy conversation** (any AI chat)

2. **Press quick capture**:
   - Windows/Linux: `Ctrl+Alt+C`
   - Mac: `Cmd+Alt+C`

3. **Review and save**:
   - Quick capture dialog appears
   - Preview conversation
   - Click "Capture" or press Enter

4. **Verify in sidebar**:
   - Conversation added immediately
   - Check metadata (platform, title, time)

**Expected Result**: ✅ Instant conversation capture

---

### Test 3: Editor Context Tracking (3 minutes)

**Goal**: Verify AI usage inference from code changes

1. **Open a code file** (any language)

2. **Make some edits**:
   - Add comments
   - Write new function
   - Modify existing code

3. **Use Copilot** (if available):
   - Trigger Copilot suggestions
   - Accept suggestions
   - Interact with Copilot Chat

4. **View editor context**:
   - Command Palette → "Remember: Show Editor Context"
   - Check AI inference confidence
   - Review tracked files and edits

5. **Check status bar**:
   - Status bar button shows "Remember (n)"
   - "n" = number of captured conversations
   - Click button for quick menu

**Expected Result**: ✅ Editor activity tracked, AI usage inferred

---

### Test 4: Resume in Copilot (3 minutes)

**Goal**: Continue previous conversation with context

1. **Capture a conversation** (use Test 1 or 2)

2. **Select conversation in sidebar**:
   - Click on any conversation
   - Should show in tree view

3. **Preview context assembly**:
   - Command Palette → "Remember: Preview Context Assembly"
   - Review assembled context:
     - Role & Persona layer
     - Canonical State layer
     - Recent Context layer
     - Relevant History layer
   - Check token count (should be ≤ 1,600)

4. **Resume in Copilot**:
   - With conversation selected:
   - Press `Ctrl+Alt+R` (or `Cmd+Alt+R`)
   - OR: Command Palette → "Remember: Resume in Copilot"

5. **Verify in Copilot Chat**:
   - Context should be prepared (copied to clipboard)
   - Open Copilot Chat (Ctrl+Shift+I)
   - Paste and continue conversation

**Expected Result**: ✅ Optimally assembled context ready for resume

---

### Test 5: Multi-Platform Detection (5 minutes)

**Goal**: Verify detection across different AI platforms

1. **Test GitHub Copilot**:
   - Copy Copilot Chat conversation
   - Verify auto-detection
   - Check platform = "Copilot"
   - Confidence should be ~95%

2. **Test ChatGPT**:
   - Copy ChatGPT conversation
   - Verify auto-detection
   - Check platform = "ChatGPT"
   - Confidence should be ~90%

3. **Test Google Gemini**:
   - Copy Gemini conversation
   - Verify auto-detection
   - Check platform = "Gemini"
   - Confidence should be ~90%

4. **Test Claude**:
   - Copy Claude conversation
   - Verify auto-detection
   - Check platform = "Claude"
   - Confidence should be ~90%

5. **Test Generic AI**:
   - Copy any AI chat (even unknown platform)
   - Should fallback to "Generic" detection
   - Confidence should be ~70%

**Expected Result**: ✅ All platforms detected with appropriate confidence

---

## 🔧 Configuration Testing

### Clipboard Interval Adjustment

**Test responsiveness**:

1. **Set to 1 second** (faster):
   ```json
   "remember.clipboardCheckInterval": 1
   ```
   - Copy conversation
   - Should detect in ~1 second
   - Slightly higher CPU usage

2. **Set to 5 seconds** (slower):
   ```json
   "remember.clipboardCheckInterval": 5
   ```
   - Copy conversation
   - Takes ~5 seconds to detect
   - Lower CPU usage

3. **Set to 10 seconds** (maximum):
   ```json
   "remember.clipboardCheckInterval": 10
   ```
   - Copy conversation
   - Takes up to 10 seconds
   - Minimal CPU impact

**Recommended**: 2 seconds (default) for best balance

---

### Context Assembly Tuning

**Test different budgets**:

1. **Default (1,600 tokens)**:
   ```json
   "remember.contextAssembly": {
     "tokenLimit": 1600,
     "includeRecentMessages": 5,
     "includeRelevantHistory": 3
   }
   ```
   - Preview context for long conversation
   - Should fit within 1,600 tokens
   - Optimal for Copilot

2. **High Budget (2,000 tokens)**:
   ```json
   "remember.contextAssembly": {
     "tokenLimit": 2000,
     "includeRecentMessages": 7,
     "includeRelevantHistory": 5
   }
   ```
   - More context included
   - May hit Copilot limits
   - Better for complex resumes

3. **Low Budget (1,200 tokens)**:
   ```json
   "remember.contextAssembly": {
     "tokenLimit": 1200,
     "includeRecentMessages": 3,
     "includeRelevantHistory": 2
   }
   ```
   - Less context
   - Faster assembly
   - Always fits in Copilot

**Recommended**: 1,600 tokens (default) for optimal balance

---

## ⌨️ Keyboard Shortcuts Reference

| Action | Windows/Linux | Mac | Command |
|--------|--------------|-----|---------|
| Quick Capture | `Ctrl+Alt+C` | `Cmd+Alt+C` | `remember.quickCapture` |
| Resume in Copilot | `Ctrl+Alt+R` | `Cmd+Alt+R` | `remember.resumeInCopilot` |
| Capture Conversation | `Ctrl+Shift+C` | `Cmd+Shift+C` | `remember.captureConversation` |
| View Conversations | `Ctrl+Shift+E` | `Cmd+Shift+E` | `remember.viewConversations` |

---

## 🐛 Common Issues & Solutions

### Issue: "Smart clipboard not detecting"

**Solutions**:
- Check: `remember.smartClipboard` is `true`
- Wait full interval time (default 2 seconds)
- Copy FULL conversation (not fragments)
- Try manual capture (Ctrl+Alt+C) as backup

---

### Issue: "Editor context not tracking"

**Solutions**:
- Check: `remember.editorContextTracking` is `true`
- Make actual file edits (not just viewing)
- Use Copilot explicitly (triggers inference)
- View context: Command → "Show Editor Context"

---

### Issue: "Resume context too large"

**Solutions**:
- Reduce `tokenLimit` in settings (try 1,200)
- Decrease `includeRecentMessages` (try 3)
- Decrease `includeRelevantHistory` (try 2)
- Preview before resuming to check size

---

### Issue: "Keyboard shortcuts not working"

**Solutions**:
- Check: `remember.enableKeyboardShortcuts` is `true`
- Restart VS Code after install
- Check for conflicting keybindings
- Use Command Palette as alternative

---

### Issue: "Status bar button not showing"

**Solutions**:
- Restart VS Code
- Check extension is activated (should say "Remember" in status bar)
- Check for JavaScript errors in Developer Tools (Help → Toggle Developer Tools)

---

## 📊 Success Indicators

### Everything Working If:

- ✅ Conversations auto-captured from clipboard
- ✅ Quick capture works (Ctrl+Alt+C)
- ✅ Editor context tracked (files, edits, selections)
- ✅ Resume creates optimal context (≤1,600 tokens)
- ✅ Status bar button shows conversation count
- ✅ All keyboard shortcuts respond
- ✅ No errors in Developer Tools console
- ✅ Multi-platform detection works (Copilot, ChatGPT, Gemini, Claude)

### Performance Benchmarks:

- Memory: ~12 MB (acceptable)
- CPU (idle): ~0.1% (minimal)
- CPU (active): ~3% (reasonable)
- Clipboard checks: Every 2 seconds (non-blocking)
- Context assembly: < 500ms (fast)

---

## 🎓 Learning Path

### Beginner (Day 1):
1. Complete Test 1 (Smart Clipboard)
2. Complete Test 2 (Quick Capture)
3. Browse sidebar conversations

### Intermediate (Day 2-3):
1. Complete Test 3 (Editor Context)
2. Complete Test 4 (Resume in Copilot)
3. Customize settings

### Advanced (Week 1):
1. Complete Test 5 (Multi-Platform)
2. Test all edge cases
3. Optimize configuration for workflow
4. Integrate with daily AI usage

---

## 🚀 Next Steps After Testing

1. **Report Issues**: [GitHub Issues](https://github.com/yourusername/remember-vscode/issues)
2. **Share Feedback**: What works? What doesn't?
3. **Suggest Features**: What would make it better?
4. **Contribute**: See [CONTRIBUTING.md](./CONTRIBUTING.md)

---

## 📞 Support

- **Quick Questions**: Check README.md
- **Bug Reports**: GitHub Issues
- **Feature Requests**: GitHub Discussions
- **Documentation**: Full docs in README.md

---

**Happy Testing! 🎉**

Remember v4.0 is a major upgrade - your feedback will help make it even better!
