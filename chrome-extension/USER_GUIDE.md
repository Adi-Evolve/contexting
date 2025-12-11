# 📖 VOID - Resume Chat Feature User Guide

## What is Resume Chat?

Resume Chat allows you to intelligently continue conversations from where you left off across different AI chat sessions. Instead of pasting entire conversation histories, it uses a smart 4-layer context compression system to provide only the most relevant information.

## Key Features

### 🧠 Smart Context Assembly
- **Layer 0**: Your role, persona, and profile preferences
- **Layer 1**: Canonical decisions, facts, and learnings
- **Layer 2**: Recent conversation context (last few messages)
- **Layer 3**: Relevant historical context

### 🎯 Intelligent Features
- **Token Budget Management**: Automatically fits within 1,600 token limit
- **Contradiction Detection**: Warns you about conflicting information
- **Multi-Model Support**: Export for ChatGPT, Claude, Gemini, or LLaMA
- **Editable Context**: Modify before inserting into chat

---

## How to Use

### Step 1: Have a Conversation

Use any supported AI chat platform normally:
- ChatGPT (chat.openai.com or chatgpt.com)
- Claude (claude.ai)
- Google Gemini (gemini.google.com)
- And more...

The extension automatically captures and saves your conversations.

### Step 2: Open the Sidebar

Click the floating **⚡ VOID** button that appears on supported chat pages.

The sidebar shows:
- All your saved conversations
- Search functionality
- Conversation metadata (platform, date, message count)

### Step 3: Resume a Conversation

1. Find the conversation you want to resume
2. Click the **🔄 Resume** button on the conversation card
3. The Resume Chat modal opens

### Step 4: Review the Context

The modal shows:

**Context Preview**
```
=== ROLE & CONTEXT ===
[Your established role/persona]

=== KEY DECISIONS & FACTS ===
[Important decisions and established facts]

=== RECENT CONTEXT ===
[Last few messages for continuity]

=== RELEVANT HISTORY ===
[Related past discussions]
```

**Token Breakdown**
- Layer 0: X tokens
- Layer 1: X tokens
- Layer 2: X tokens
- Layer 3: X tokens
- **Total: X/1600 tokens**

**Warnings** (if any)
- 🟡 Truncation notice (context was compressed)
- 🔴 Contradiction warnings (conflicting information detected)

### Step 5: Choose Your Model

Select the target AI model from the dropdown:
- **ChatGPT** - OpenAI's format
- **Claude** - Anthropic's format
- **Gemini** - Google's format
- **LLaMA** - Meta's format

The context automatically reformats for optimal compatibility.

### Step 6: Insert or Copy

Two options:

**Option A: Copy to Clipboard**
1. Click **📋 Copy to Clipboard**
2. Paste into your AI chat manually
3. Add your follow-up question

**Option B: Insert into Chat** (Recommended)
1. Click **✨ Insert into Chat**
2. Context is automatically inserted
3. Chat input is focused and ready
4. Type your follow-up question

---

## Advanced Features

### Token Budget Enforcement

If your conversation exceeds 1,600 tokens, the system automatically compresses it using this priority:

1. **Remove Layer 3** (relevant history) - least critical
2. **Trim Layer 1** - Keep top 3 decisions
3. **Further trim Layer 1** - Keep top 2 failures
4. **Simplify Layer 0** - Remove detailed patterns
5. **Remove Layer 0** - Emergency measure
6. **Truncate Layer 2** - Last resort, keep only 3 most recent messages

You'll see a yellow warning banner showing:
```
⚠️ Context was truncated from 2,400 to 1,600 tokens to fit budget
```

### Contradiction Detection

The system automatically detects when the AI has given conflicting advice. You'll see a red warning:

```
⚠️ Contradictions Detected (2)

• Decision changed: Use MongoDB → Use PostgreSQL instead
  Messages #2 and #4 (confidence: 85%)

• Decision changed: Enable feature X → Disable feature X
  Messages #6 and #8 (confidence: 92%)
```

**What to do:**
- Review the contradictions
- Decide which advice to follow
- Edit the context to remove outdated information
- Or ask the AI to clarify

### Editing Context

1. Click anywhere in the context textarea
2. Edit the text as needed
3. Remove outdated information
4. Add clarifications
5. Click Copy or Insert with your modified version

**Use cases:**
- Remove resolved issues
- Update outdated decisions
- Add recent developments not in conversation
- Clarify ambiguous points

---

## Model-Specific Formats

### ChatGPT Format
```
I'm resuming our previous conversation about [topic].

Here's the relevant context:
[4-layer context]

Now, [your new question]
```

### Claude Format
```
Let me provide context from our previous conversation:

<context>
[4-layer context]
</context>

Based on this, [your new question]
```

### Gemini Format
```
Context from our previous discussion:

[4-layer context]

---

Continuing from above: [your new question]
```

### LLaMA Format
```
### Previous Context
[4-layer context]

### Current Query
[your new question]
```

---

## Tips & Best Practices

### ✅ Do's

1. **Review before inserting** - Check that context is relevant
2. **Edit if needed** - Remove outdated or resolved items
3. **Choose the right model** - Match your target AI platform
4. **Address contradictions** - Resolve conflicting information
5. **Use descriptive queries** - Help the AI understand your intent

### ❌ Don'ts

1. **Don't paste everything** - Let the system compress intelligently
2. **Don't ignore warnings** - Check truncation and contradiction alerts
3. **Don't assume perfection** - Review and edit when needed
4. **Don't mix contexts** - Keep different projects separate

### 🎯 Pro Tips

**For Long Conversations (50+ messages)**
- Expect truncation - this is normal and helpful
- Review Layer 1 (decisions) carefully
- Consider splitting into multiple conversations

**For Technical Projects**
- Pay attention to canonical facts
- Check for version/dependency contradictions
- Edit to keep only current decisions

**For Research/Learning**
- Layer 3 (relevant history) is your friend
- Keep important discoveries in Layer 1
- Remove exploratory dead-ends

**For Creative Work**
- Layer 0 (role) maintains your creative direction
- Edit to preserve tone and style notes
- Remove abandoned ideas from context

---

## Troubleshooting

### Resume Button Doesn't Appear
- Refresh the page
- Check extension is enabled (`chrome://extensions/`)
- Verify you're on a supported platform

### Context is Empty
- Ensure conversation has messages
- Check that conversation was saved properly
- Try closing and reopening the sidebar

### "Context Too Large" Warning
- This is normal for long conversations
- System automatically truncates
- Review the compressed version
- Edit if needed

### Contradictions Not Detected
- Detection works on clear reversals
- Subtle changes may not trigger alerts
- Manually review if uncertain

### Insert Button Doesn't Work
- Try Copy to Clipboard instead
- Check browser console for errors
- Refresh the page and try again

---

## Privacy & Storage

### What Gets Saved?
- Conversation messages (text only)
- Metadata (platform, timestamp, title)
- Computed context layers

### What Doesn't Get Saved?
- Sensitive data is NOT filtered automatically
- Be mindful of personal information
- Review before sharing

### Where Is It Stored?
- Locally in your browser (Chrome storage)
- NOT sent to any external servers
- NOT shared with anyone
- Stays on your device

### How to Delete?
1. Open sidebar
2. Find conversation
3. Click delete button (🗑️)
4. Confirm deletion

---

## Keyboard Shortcuts

- **Esc** - Close modal
- **Ctrl+C** / **Cmd+C** - Copy context (when focused)
- **Ctrl+Enter** / **Cmd+Enter** - Insert into chat

---

## FAQ

**Q: Does this work across different AI platforms?**
A: Yes! Save a conversation from ChatGPT and resume it in Claude with the appropriate format.

**Q: What's the maximum conversation length?**
A: No hard limit, but longer conversations get compressed to fit 1,600 tokens.

**Q: Can I export conversations?**
A: Yes, use the export function in the sidebar (coming in future update).

**Q: Does this send my data anywhere?**
A: No! Everything stays local in your browser.

**Q: Can I customize token limits?**
A: Not in the UI currently (requires editing extension code).

**Q: What if I want the full conversation, not compressed?**
A: You can manually copy from the sidebar conversation view.

---

## Performance Notes

- Context assembly: < 500ms
- Token estimation: < 50ms
- Modal rendering: < 100ms
- Supports 100+ saved conversations

---

## Getting Help

**Found a bug?** Report it on GitHub
**Have a feature request?** Open an issue
**Need support?** Check the documentation

---

## What's Next?

Upcoming features:
- [ ] Conversation tagging
- [ ] Advanced search
- [ ] Conversation merging
- [ ] Export to file
- [ ] Custom token limits
- [ ] AI platform detection

---

**Version**: 1.0.0  
**Last Updated**: December 2025  
**License**: MIT
