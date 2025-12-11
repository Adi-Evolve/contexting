# 🐛 Debug Instructions - Resume Chat Error

## Current Error
```
Context assembly error: {
  success: false, 
  error: 'Failed to assemble context', 
  errorType: 'ExtractionFailed'
}
```

## ✅ Progress Made
- **FIXED**: Storage format mismatch (array vs object) ✅
- **NEW ERROR**: ExtractionFailed (means conversation was found, but extraction failed)

## 🔍 How to Debug

### Step 1: Check Background Console (CRITICAL!)

The error is happening in the **background service worker**, not in the content script.

**How to access background console:**

1. Go to `chrome://extensions/`
2. Find "VOID" extension
3. Click **"service worker"** link (blue text below extension name)
   - It might say "Inspect views: service worker"
   - Or just "service worker" in blue
4. A new DevTools window opens - this is the **background console**
5. Look for error messages in RED

**What to look for:**
- ❌ Red error messages when you click Resume button
- Module loading messages: `✅ HierarchyManager initialized`
- Context assembly logs: `🔄 Assembling context for conversation: conv_...`
- Any stack traces or error details

### Step 2: Check Content Console (What you've been doing)

1. F12 on ChatGPT page
2. Console tab
3. Look for Resume Chat button click messages
4. This shows the **request** but not the error details

### Step 3: Get Full Error Context

Once you're in the **background console**, click Resume button again and copy:
1. The full error message (not just the summary)
2. Any stack trace
3. Any console.error or console.warn messages
4. Module initialization messages at startup

## 📋 What I Need From You

Please do this:

1. **Open background console** (chrome://extensions/ → click "service worker")
2. **Clear the console** (click the 🚫 icon)
3. **Click Resume button** on ChatGPT
4. **Copy ALL console output** from background console
5. **Paste it here**

## 🔍 Expected Background Console Output

When working correctly, you should see:

```
🧠 VOID Background V3-Step6: Starting (Background Modules)...
✅ hierarchy-manager loaded
✅ delta-engine loaded
✅ semantic-fingerprint-v2 loaded
✅ causal-reasoner loaded
✅ multimodal-handler loaded
✅ llm-query-engine loaded
✅ context-assembler-v2 loaded
🧠 VOID V3-Step6: Extension installed - Background modules active
✅ HierarchyManager initialized
✅ DeltaEngine initialized
✅ SemanticFingerprintV2 initialized
✅ CausalReasoner initialized
✅ MultiModalHandler initialized
✅ LLMQueryEngine initialized
✅ ContextAssemblerV2 initialized
ℹ️ [ContextAssemblerV2] ContextAssemblerV2 initialized
ℹ️ [ContextAssemblerV2] ✅ All required modules loaded
```

Then when you click Resume:
```
🔄 Assembling context for conversation: conv_693a9cb1-fdc0-8331-8f28-28ed5444c521
ℹ️ [ContextAssemblerV2] assembleForNewChat called
⏱️ [ContextAssemblerV2] Total Assembly: [time]
⏱️ [ContextAssemblerV2] Load Conversation: [time]
⏱️ [ContextAssemblerV2] Layer 0: [time]
⏱️ [ContextAssemblerV2] Layer 1: [time]
⏱️ [ContextAssemblerV2] Layer 2: [time]
✅ Context assembled in XXms
```

If you don't see these messages, there's an initialization problem.

## 🚨 Common Issues

### Issue 1: No module loading messages
- **Cause**: Extension not reloaded after code changes
- **Fix**: Go to chrome://extensions/ → Click RELOAD

### Issue 2: Service worker link is grayed out
- **Cause**: Service worker is inactive (goes to sleep)
- **Fix**: Click RELOAD on extension, then click "service worker" immediately

### Issue 3: Background console shows errors during module loading
- **Cause**: Syntax errors or missing dependencies
- **Fix**: Share the exact error messages

### Issue 4: "Failed to assemble context" with no stack trace
- **Cause**: Error is being caught and wrapped
- **Fix**: Look for earlier errors (scroll up in background console)

## 📝 Quick Checklist

- [ ] Opened chrome://extensions/
- [ ] Found VOID extension
- [ ] Clicked "service worker" link (background console opened)
- [ ] Cleared console
- [ ] Went to ChatGPT
- [ ] Clicked Resume button
- [ ] Copied ALL background console output
- [ ] Pasted here for analysis

## 🎯 Why This Matters

The content console shows you: "Hey, I got an error response"
The background console shows you: "Here's WHY it failed (with stack trace)"

We need the background console to see the actual error!
