# 🧪 Resume Chat Feature - Testing Guide

## ✅ Testing Phase Started - December 11, 2025

**Status**: Ready for manual testing  
**Documents Created**:
- ✅ `TEST_EXECUTION_PLAN.md` - Detailed 19-test suite
- ✅ `diagnostic-test.js` - Automated diagnostic script

---

## Quick Start (5 minutes)

### Step 1: Load Extension
1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select `chrome-extension/` folder
5. Verify no errors in console (click "Errors" button)

### Step 2: Test on ChatGPT
1. Open [ChatGPT](https://chatgpt.com/)
2. Have a short conversation (3-5 messages)
3. Look for the floating ⚡ button on the page
4. Click it to open the sidebar
5. Your conversation should appear in the list
6. Click the 🔄 **Resume** button on the conversation card

### Step 3: Verify Modal
The Resume Chat modal should open showing:
- ✅ Context preview with 4 layers
- ✅ Token count breakdown (Layer 0, 1, 2, 3)
- ✅ Model selector (ChatGPT/Claude/Gemini/LLaMA)
- ✅ "Copy to Clipboard" button
- ✅ "Insert into Chat" button
- ✅ Editable textarea with context

### Step 4: Test Features

**Test 1: Copy Context**
- Click "Copy to Clipboard"
- Paste into notepad - should see formatted context

**Test 2: Model Formats**
- Change model dropdown to "Claude"
- Context should update to Claude's format
- Try Gemini and LLaMA too

**Test 3: Edit Context**
- Click in the textarea
- Edit the text
- Copy or insert the modified version

---

## 🔍 Run Automated Diagnostic (If Issues)

If Resume Chat isn't working:

1. Open ChatGPT
2. Press **F12** (Developer Tools)
3. Go to **Console** tab
4. Open `diagnostic-test.js` from the extension folder
5. Copy entire content and paste in console
6. Press Enter
7. Share the output results

**The diagnostic tests**:
- ✅ Extension context available
- ✅ Content scripts loaded
- ✅ Sidebar button present
- ✅ Background communication working
- ✅ ContextAssemblerV2 initialized
- ✅ Test context assembly

---

## 📋 Full Test Suite

For comprehensive testing, see **`TEST_EXECUTION_PLAN.md`** (19 tests):

1. **Extension Loading** (1 test) - Verify all modules loaded
2. **Basic Resume** (3 tests) - Small conversation, model switching, editing
3. **Token Budget** (2 tests) - Large conversations, truncation
4. **Contradictions** (2 tests) - Explicit and subtle contradictions
5. **Performance** (3 tests) - Assembly time, token accuracy, modal render
6. **Edge Cases** (5 tests) - Empty, single message, code-heavy, special chars, cross-platform
7. **UI/UX** (3 tests) - Dark mode, modal close, responsive design

---

## Test 4: Large Conversation (Truncation)
- Edit the text
- Copy or insert the modified version

**Test 4: Large Conversation (Token Budget)**
- Have a longer conversation (20+ messages)
- Click Resume
- Look for yellow warning: "⚠️ Context was truncated from X to Y tokens"

**Test 5: Contradictions**
- Have a conversation where AI changes advice
  - "Should I use MongoDB?" → "Yes"
  - "What about PostgreSQL?" → "Actually, use PostgreSQL instead"
- Click Resume
- Look for red warning banner with contradiction details

## Background Console Testing

1. Go to `chrome://extensions/`
2. Find "void" extension
3. Click "service worker" link
4. Check console for:
   - ✅ All 7 modules loaded
   - ✅ ContextAssemblerV2 initialized
   - ✅ No errors

## Expected Console Output

```
🧠 VOID Background V3-Step6: Starting (Background Modules)...
✅ hierarchy-manager loaded
✅ delta-engine loaded
✅ semantic-fingerprint-v2 loaded
✅ causal-reasoner loaded
✅ multimodal-handler loaded
✅ llm-query-engine loaded
✅ context-assembler-v2 loaded
✅ HierarchyManager initialized
✅ DeltaEngine initialized
✅ SemanticFingerprintV2 initialized
✅ CausalReasoner initialized
✅ MultiModalHandler initialized
✅ LLMQueryEngine initialized
✅ ContextAssemblerV2 initialized
📚 Loaded 0 conversations
✅ VOID V3-Step6: ALL 6 MODULES LOADED - Ready for production!
```

## Troubleshooting

### Extension won't load
- Check manifest.json for syntax errors
- Check all JS files are present
- Reload extension after code changes

### ⚡ button doesn't appear
- Check content script loaded (F12 → Console)
- Try refreshing the ChatGPT page
- Check if URL matches manifest patterns

### Resume button doesn't work
- Check background console for errors
- Verify ContextAssemblerV2 initialized
- Check conversation has messages

### Modal is blank
- Check content-chatgpt-v2.js for errors
- Verify context assembly succeeded
- Check browser console (F12)

### Context is empty
- Verify conversation has messages
- Check extractConversationData() in context-assembler-v2.js
- Check if conversation ID is valid

## Manual Testing Checklist

- [ ] Extension loads without errors
- [ ] Background console shows all modules loaded
- [ ] ⚡ button appears on ChatGPT
- [ ] Sidebar opens when clicked
- [ ] Conversation is captured and saved
- [ ] Resume button appears on conversation card
- [ ] Modal opens when Resume clicked
- [ ] Context preview shows all 4 layers
- [ ] Token counts are displayed
- [ ] Model selector works (4 models)
- [ ] Copy to clipboard works
- [ ] Insert into chat works
- [ ] Context is editable
- [ ] Large conversation triggers truncation notice
- [ ] Contradictory conversation shows warning
- [ ] Dark mode toggle works
- [ ] Modal closes properly (X button, overlay click)

## Performance Benchmarks

- Context assembly: < 500ms
- Modal open: < 100ms  
- Token estimation: < 50ms
- Model format conversion: < 20ms

## Success Criteria

✅ All features working on ChatGPT  
✅ No console errors  
✅ Fast performance (< 500ms assembly)  
✅ Token budget enforced (≤ 1600 tokens)  
✅ Contradictions detected and displayed  
✅ All 4 model formats working  

---

**Total Testing Time: ~10 minutes**

For automated testing, see `test-resume-chat.html` (requires CSP workaround).
