# 🧪 Testing Execution Plan - Resume Chat Feature

## Test Session Setup

**Date**: December 11, 2025  
**Feature**: Resume Chat (Context Assembler V2)  
**Tester**: User  
**Environment**: Chrome Extension (Local)

---

## Pre-Test Checklist

- [ ] Extension loaded in `chrome://extensions/`
- [ ] Developer mode enabled
- [ ] No errors in background service worker console
- [ ] All 7 modules loaded successfully
- [ ] ContextAssemblerV2 initialized

---

## Test Suite 1: Extension Loading ✅

### Test 1.1: Background Console Verification
**Steps**:
1. Go to `chrome://extensions/`
2. Find "void" extension
3. Click "service worker" link
4. Check console output

**Expected Output**:
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
📚 Loaded X conversations
✅ VOID V3-Step6: ALL 7 MODULES LOADED - Ready for production!
```

**Pass Criteria**: All ✅ marks, no ❌ errors

**Result**: [ ] PASS [ ] FAIL  
**Notes**: _______________________________________________

---

## Test Suite 2: Basic Resume Chat 🔄

### Test 2.1: Small Conversation (< 10 messages)
**Objective**: Test basic context assembly

**Steps**:
1. Open ChatGPT (chatgpt.com)
2. Have a short conversation (5-8 messages):
   ```
   You: "Help me build a todo app"
   AI: [responds with tech stack]
   You: "Use React and Node.js"
   AI: [responds with architecture]
   You: "Add authentication"
   AI: [responds with auth strategies]
   ```
3. Click ⚡ button to open sidebar
4. Find the conversation
5. Click 🔄 Resume button

**Expected**:
- Modal opens with context preview
- 4 layers visible:
  - Layer 0: Role/persona (building todo app)
  - Layer 1: Decisions (React, Node.js, auth)
  - Layer 2: Last 2-3 messages
  - Layer 3: Relevant history (if any)
- Token count displayed (likely 200-400 tokens)
- No truncation warning (small conversation)
- No contradiction warnings

**Pass Criteria**:
- [ ] Modal opens
- [ ] All 4 layers present
- [ ] Token count reasonable (< 600)
- [ ] Context is coherent
- [ ] Copy button works
- [ ] Insert button works

**Result**: [ ] PASS [ ] FAIL  
**Notes**: _______________________________________________

---

### Test 2.2: Model Format Switching
**Objective**: Test all 4 model exports

**Steps** (continue from Test 2.1):
1. Modal still open from previous test
2. Change model dropdown to "Claude"
3. Observe context reformatting
4. Switch to "Gemini"
5. Switch to "LLaMA"
6. Switch back to "ChatGPT"

**Expected**:
- **ChatGPT format**:
  ```
  I'm resuming our previous conversation about [topic].
  
  Here's the relevant context:
  [4-layer context]
  
  Now, [your question]
  ```

- **Claude format**:
  ```
  Let me provide context from our previous conversation:
  
  <context>
  [4-layer context]
  </context>
  
  Based on this, [your question]
  ```

- **Gemini format**:
  ```
  Context from our previous discussion:
  
  [4-layer context]
  
  ---
  
  Continuing from above: [your question]
  ```

- **LLaMA format**:
  ```
  ### Previous Context
  [4-layer context]
  
  ### Current Query
  [your question]
  ```

**Pass Criteria**:
- [ ] All 4 models switch correctly
- [ ] Format matches expected structure
- [ ] Context content preserved across switches
- [ ] No errors in console

**Result**: [ ] PASS [ ] FAIL  
**Notes**: _______________________________________________

---

### Test 2.3: Context Editing
**Objective**: Test manual editing

**Steps**:
1. Modal open from previous test
2. Click in textarea
3. Edit some text (remove/add content)
4. Click "Copy to Clipboard"
5. Paste in notepad - verify edited version
6. Click "Insert into Chat"
7. Verify edited version inserted

**Pass Criteria**:
- [ ] Textarea is editable
- [ ] Edits are preserved
- [ ] Copy includes edits
- [ ] Insert includes edits
- [ ] No UI glitches

**Result**: [ ] PASS [ ] FAIL  
**Notes**: _______________________________________________

---

## Test Suite 3: Large Conversation (Token Budget) 📊

### Test 3.1: 50+ Message Conversation
**Objective**: Test token budget enforcement

**Steps**:
1. On ChatGPT, have a longer conversation (20+ messages)
2. Topics: Discuss multiple aspects of a project
   - Architecture decisions
   - Technology choices
   - Implementation details
   - Debugging issues
   - Optimizations
3. Click ⚡ → Find conversation → Click Resume

**Expected**:
- Modal opens
- Context assembled successfully
- **Yellow warning banner appears**:
  ```
  ⚠️ Context was truncated from X to 1,600 tokens to fit budget
  ```
- Token breakdown shows:
  - Layer 0: ~150-200 tokens
  - Layer 1: ~500-600 tokens
  - Layer 2: ~400-500 tokens
  - Layer 3: 0 tokens (removed first) OR ~200-300 tokens
  - **Total: ≤ 1,600 tokens**
- Context is still coherent despite truncation
- Most important decisions preserved

**Pass Criteria**:
- [ ] Truncation warning appears
- [ ] Total tokens ≤ 1,600
- [ ] Layer 2 (recent messages) preserved
- [ ] Layer 1 (decisions) preserved
- [ ] Context makes sense
- [ ] No errors in console

**Result**: [ ] PASS [ ] FAIL  
**Original Tokens**: _______  
**Final Tokens**: _______  
**Notes**: _______________________________________________

---

### Test 3.2: Very Large Conversation (100+ messages)
**Objective**: Test aggressive truncation

**Steps**:
1. Have a very long conversation (30+ messages)
2. Click Resume

**Expected**:
- Even more aggressive truncation
- Possible Layer 0 simplification or removal
- Layer 3 definitely removed
- Layer 1 trimmed to top 3 decisions
- Layer 2 preserved (recent messages)
- Still fits 1,600 token budget

**Pass Criteria**:
- [ ] Still assembles successfully
- [ ] Total tokens ≤ 1,600
- [ ] Recent context preserved
- [ ] Most critical decisions kept
- [ ] Warning displayed

**Result**: [ ] PASS [ ] FAIL  
**Original Tokens**: _______  
**Final Tokens**: _______  
**Truncation Steps Applied**: _______  
**Notes**: _______________________________________________

---

## Test Suite 4: Contradiction Detection ⚠️

### Test 4.1: Explicit Contradictions
**Objective**: Test contradiction detection

**Steps**:
1. Start new conversation on ChatGPT
2. Ask: "Should I use MongoDB for my project?"
3. AI responds: "Yes, MongoDB is good for..."
4. Ask: "What about PostgreSQL instead?"
5. AI responds: "Actually, PostgreSQL would be better because..."
6. Ask: "Should I enable feature X?"
7. AI responds: "Yes, enable it"
8. Ask: "Feature X is causing issues, what should I do?"
9. AI responds: "Disable feature X, it's not stable"
10. Click Resume

**Expected**:
- **Red warning banner** appears
- Shows detected contradictions:
  ```
  ⚠️ Contradictions Detected (2)
  
  • Decision changed: Use MongoDB → Use PostgreSQL instead
    Messages #2 and #4 (confidence: 85%)
  
  • Decision changed: Enable feature X → Disable feature X
    Messages #6 and #8 (confidence: 90%)
  ```
- Context still includes both sides
- User can manually edit to resolve

**Pass Criteria**:
- [ ] Contradiction warning appears
- [ ] Both contradictions detected
- [ ] Confidence scores displayed
- [ ] Message numbers shown
- [ ] Context includes both versions
- [ ] Warning is red/prominent

**Result**: [ ] PASS [ ] FAIL  
**Contradictions Detected**: _______  
**False Positives**: _______  
**Missed Contradictions**: _______  
**Notes**: _______________________________________________

---

### Test 4.2: Subtle Contradictions
**Objective**: Test edge cases

**Steps**:
1. New conversation with subtle changes:
   - "Use approach A" → "Consider approach B" (not explicit reversal)
   - "X is important" → "Y is more critical" (priority shift)
   - "Deploy to AWS" → "Actually, use Azure" (explicit correction)

**Expected**:
- Explicit corrections detected
- Subtle shifts may not trigger (acceptable)
- At least 1 contradiction detected

**Pass Criteria**:
- [ ] At least explicit correction detected
- [ ] No false positives for normal evolution
- [ ] User can still see all decisions

**Result**: [ ] PASS [ ] FAIL  
**Notes**: _______________________________________________

---

## Test Suite 5: Performance Benchmarks ⚡

### Test 5.1: Assembly Time
**Objective**: Measure context assembly speed

**Steps**:
1. Open background console
2. Note timestamp before clicking Resume
3. Click Resume on a medium conversation (20 messages)
4. Check console for timing logs:
   ```
   🔄 Assembling context for conversation: conv_xxx
   ✅ Context assembled in XX.XXms
   ```
5. Repeat 3 times, average the results

**Expected**:
- Assembly time < 500ms
- Typical: 200-300ms

**Pass Criteria**:
- [ ] Average < 500ms
- [ ] No significant variance (±100ms)
- [ ] No errors

**Results**:
- Run 1: _______ ms
- Run 2: _______ ms
- Run 3: _______ ms
- Average: _______ ms
- **Status**: [ ] PASS [ ] FAIL

**Notes**: _______________________________________________

---

### Test 5.2: Token Estimation Accuracy
**Objective**: Verify token counting

**Steps**:
1. Assemble context for a conversation
2. Note estimated tokens from modal
3. Copy context to clipboard
4. Use external token counter (e.g., OpenAI tokenizer)
5. Compare estimates

**Expected**:
- Estimation within ±10% of actual

**Pass Criteria**:
- [ ] Estimation reasonable
- [ ] Not wildly off (no 2x errors)

**Results**:
- Estimated: _______ tokens
- Actual: _______ tokens
- Difference: _______ %
- **Status**: [ ] PASS [ ] FAIL

**Notes**: _______________________________________________

---

### Test 5.3: Modal Render Time
**Objective**: UI responsiveness

**Steps**:
1. Click Resume
2. Measure time until modal fully visible
3. Use browser DevTools Performance tab

**Expected**:
- Modal render < 100ms
- Feels instant to user

**Pass Criteria**:
- [ ] < 100ms
- [ ] No janky animations
- [ ] Smooth experience

**Result**: _______ ms [ ] PASS [ ] FAIL  
**Notes**: _______________________________________________

---

## Test Suite 6: Edge Cases 🔍

### Test 6.1: Empty Conversation
**Steps**:
1. Create conversation with 0 messages
2. Try to Resume

**Expected**:
- Graceful error or empty context
- No crash

**Pass Criteria**:
- [ ] No crash
- [ ] Reasonable error message

**Result**: [ ] PASS [ ] FAIL  
**Notes**: _______________________________________________

---

### Test 6.2: Single Message
**Steps**:
1. Conversation with only 1 user message
2. Resume

**Expected**:
- Context shows that one message
- No errors

**Pass Criteria**:
- [ ] Works correctly
- [ ] No crashes

**Result**: [ ] PASS [ ] FAIL  
**Notes**: _______________________________________________

---

### Test 6.3: Code-Heavy Conversation
**Steps**:
1. Conversation with lots of code blocks
2. Resume

**Expected**:
- Code preserved in context
- Token budget still enforced
- Code not broken/truncated mid-block

**Pass Criteria**:
- [ ] Code blocks intact
- [ ] No syntax break in middle
- [ ] Still fits budget

**Result**: [ ] PASS [ ] FAIL  
**Notes**: _______________________________________________

---

### Test 6.4: Special Characters
**Steps**:
1. Conversation with emojis, unicode, markdown
2. Resume

**Expected**:
- All characters preserved
- No encoding issues

**Pass Criteria**:
- [ ] No character corruption
- [ ] Emojis display correctly

**Result**: [ ] PASS [ ] FAIL  
**Notes**: _______________________________________________

---

### Test 6.5: Cross-Platform Resume
**Steps**:
1. Save conversation on ChatGPT
2. Open Claude
3. Click Resume → Select ChatGPT conversation
4. Change model to "Claude"
5. Insert into Claude chat

**Expected**:
- Works across platforms
- Format adapts to Claude

**Pass Criteria**:
- [ ] Can resume ChatGPT convo in Claude
- [ ] Format correct
- [ ] Claude understands context

**Result**: [ ] PASS [ ] FAIL  
**Notes**: _______________________________________________

---

## Test Suite 7: UI/UX Testing 🎨

### Test 7.1: Dark Mode
**Steps**:
1. Toggle dark mode on ChatGPT
2. Open Resume modal
3. Check styling

**Expected**:
- Modal adapts to dark mode
- Text readable
- Colors appropriate

**Pass Criteria**:
- [ ] Dark mode styling works
- [ ] No white flash
- [ ] Readable contrast

**Result**: [ ] PASS [ ] FAIL  
**Notes**: _______________________________________________

---

### Test 7.2: Modal Close Methods
**Steps**:
1. Open modal
2. Close via X button → Works?
3. Open again
4. Close via clicking overlay → Works?
5. Open again
6. Close via ESC key → Works?

**Pass Criteria**:
- [ ] X button closes
- [ ] Overlay click closes
- [ ] ESC key closes
- [ ] No memory leaks (can reopen)

**Result**: [ ] PASS [ ] FAIL  
**Notes**: _______________________________________________

---

### Test 7.3: Responsive Design
**Steps**:
1. Open modal
2. Resize browser window (narrow, wide)
3. Check layout

**Expected**:
- Modal adapts to width
- No overflow issues
- Buttons remain accessible

**Pass Criteria**:
- [ ] Works at different widths
- [ ] No broken layout
- [ ] Scrolls if needed

**Result**: [ ] PASS [ ] FAIL  
**Notes**: _______________________________________________

---

## Test Summary

### Results Overview

| Test Suite | Tests | Passed | Failed | Notes |
|------------|-------|--------|--------|-------|
| 1. Extension Loading | 1 | ___ | ___ | |
| 2. Basic Resume | 3 | ___ | ___ | |
| 3. Token Budget | 2 | ___ | ___ | |
| 4. Contradictions | 2 | ___ | ___ | |
| 5. Performance | 3 | ___ | ___ | |
| 6. Edge Cases | 5 | ___ | ___ | |
| 7. UI/UX | 3 | ___ | ___ | |
| **TOTAL** | **19** | **___** | **___** | |

### Pass Rate
- **Target**: ≥ 90% (17/19 tests)
- **Actual**: ____%

### Critical Issues Found
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Minor Issues Found
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Performance Metrics
- Average assembly time: _______ ms (Target: < 500ms)
- Token estimation accuracy: _______ % (Target: ±10%)
- Modal render time: _______ ms (Target: < 100ms)

---

## Next Steps

### If All Tests Pass ✅
- [ ] Mark feature as production-ready
- [ ] Update README with testing results
- [ ] Plan deployment/release
- [ ] Consider enhancements (adaptive budgets, clustering)

### If Tests Fail ❌
- [ ] Document all failures in detail
- [ ] Prioritize fixes (critical first)
- [ ] Implement fixes
- [ ] Re-run failed tests
- [ ] Full regression test once fixed

### Enhancement Opportunities
- [ ] Adaptive token budgets
- [ ] Semantic clustering for Layer 3
- [ ] Contradiction auto-resolution
- [ ] Performance optimizations
- [ ] Additional model formats

---

**Test Session Complete**: [ ] YES [ ] NO  
**Overall Status**: [ ] PASS [ ] FAIL [ ] PARTIAL  
**Ready for Production**: [ ] YES [ ] NO [ ] WITH FIXES  

**Tester Signature**: _______________  
**Date Completed**: _______________
