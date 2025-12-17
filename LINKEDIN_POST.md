Title: Introducing VOID — Universal AI Memory for Chat & Code

Post:

I’m excited to share VOID, a universal AI memory system I’ve been building to solve a problem every AI user hits: losing context.

VOID captures conversations from ChatGPT, Claude, Gemini and VS Code, preserves the important facts and decisions, and lets you reliably resume any thread later — even across platforms.

Why I built VOID
- AI assistants forget: long threads and multi-session workflows lose crucial context.
- Repeating context wastes time and invites mistakes.

What VOID does
- Automatic capture: saves conversations locally, organized by platform and topic.
- Smart context assembly: a four-layer system (role, decisions, recent messages, relevant history) compresses and assembles context to fit token budgets while preserving meaning.
- Contradiction detection: warns when new messages conflict with prior decisions.
- Portable exports: resume chats in ChatGPT, Claude, Gemini, or VS Code; export as .aime/.smg for portability.
- Privacy-first: all data stored locally by default — no servers, no tracking.

Why it helps
- Faster work: jump back into a project without re-explaining everything.
- Better continuity: AI can keep following long-term goals and previous decisions.
- Safer collaboration: keep a clear, editable record of decisions and reasoning.

Why VOID stands out
- Semantic Memory Graph: preserves relationships and decisions, not just text vectors.
- Multi-layer compression: maintains important context while keeping token size small.
- Cross-platform resume: supports browser chat services and VS Code integrations.

Try it
- Repo: https://github.com/Adi-Evolve/contexting
- Chrome extension: open the `chrome-extension/` folder and load it unpacked
- VS Code: see the `vscode-extension/` folder

If you’re interested in testing, contributing, or integrating VOID into your tools, I’d love to hear from you — drop a comment or open an issue.

#ai #chatgpt #claude #vscode #opensource #productivity #memory
