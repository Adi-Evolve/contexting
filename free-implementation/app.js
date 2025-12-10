/**
 * Main Application Logic
 * Handles UI interactions and AI integration
 */

let memoryManager;

/**
 * Initialize application
 */
async function init() {
  console.log('Initializing AI Memory Chat...');

  // Create memory manager
  memoryManager = new MemoryManager();
  const success = await memoryManager.init();

  if (!success) {
    alert('Failed to initialize memory system. Please refresh the page.');
    return;
  }

  // Load existing messages
  const messages = memoryManager.messages;
  const chatContainer = document.getElementById('chat-container');
  
  if (messages.length > 0) {
    // Clear welcome message
    chatContainer.innerHTML = '';
    
    // Display existing messages
    messages.forEach(msg => {
      addMessageToUI(msg.role, msg.content, false);
    });
  }

  // Update stats
  updateStats();

  // Attach event listeners
  attachEventListeners();

  console.log('Application initialized successfully');
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
  // Send button
  document.getElementById('send-btn').addEventListener('click', sendMessage);

  // Enter key to send (Shift+Enter for new line)
  document.getElementById('user-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Export button
  document.getElementById('export-btn').addEventListener('click', exportMemory);

  // Import button
  document.getElementById('import-btn').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });

  // File input change
  document.getElementById('import-file').addEventListener('change', handleImportFile);

  // Clear button
  document.getElementById('clear-btn').addEventListener('click', clearChat);
}

/**
 * Send message
 */
async function sendMessage() {
  const input = document.getElementById('user-input');
  const userMessage = input.value.trim();

  if (!userMessage) return;

  // Clear input
  input.value = '';

  // Display user message
  addMessageToUI('user', userMessage);

  // Store in memory
  await memoryManager.addMessage('user', userMessage);

  // Disable send button
  const sendBtn = document.getElementById('send-btn');
  sendBtn.disabled = true;
  sendBtn.innerHTML = '<div class="loading"></div>';

  // Build context for AI
  const context = memoryManager.buildContextForAI(userMessage);

  // Call AI (placeholder - user needs to integrate their LLM)
  const aiResponse = await callAI(context, userMessage);

  // Display AI response
  addMessageToUI('assistant', aiResponse);

  // Store AI response
  await memoryManager.addMessage('assistant', aiResponse);

  // Update stats
  updateStats();

  // Re-enable send button
  sendBtn.disabled = false;
  sendBtn.textContent = 'Send';
}

/**
 * Add message to UI
 */
function addMessageToUI(role, content, removeWelcome = true) {
  const chatContainer = document.getElementById('chat-container');

  // Remove welcome message on first user message
  if (removeWelcome) {
    const welcomeMsg = chatContainer.querySelector('.welcome-message');
    if (welcomeMsg) {
      welcomeMsg.remove();
    }
  }

  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;

  // Format content with code highlighting
  const formattedContent = formatMessageContent(content);
  messageDiv.innerHTML = formattedContent;

  chatContainer.appendChild(messageDiv);

  // Scroll to bottom
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

/**
 * Format message content (handle code blocks)
 */
function formatMessageContent(content) {
  // Replace code blocks
  content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    const language = lang || 'plaintext';
    return `<pre><code class="language-${language}">${escapeHtml(code.trim())}</code></pre>`;
  });

  // Replace inline code
  content = content.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Replace line breaks
  content = content.replace(/\n/g, '<br>');

  return content;
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Call AI (PLACEHOLDER - User must integrate their LLM)
 */
async function callAI(context, userMessage) {
  // Simulate AI response delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // PLACEHOLDER RESPONSE
  // Users should replace this with actual AI API calls:
  // - OpenAI API (ChatGPT)
  // - Anthropic API (Claude)
  // - Google AI (Gemini)
  // - Ollama (local)
  // - LM Studio (local)
  // - Any other LLM

  return `This is a placeholder response. To integrate a real AI:

1. **OpenAI (ChatGPT)**:
\`\`\`javascript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: context },
      { role: 'user', content: userMessage }
    ]
  })
});
\`\`\`

2. **Anthropic (Claude)**:
\`\`\`javascript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json'
  },
  body: JSON.stringify({
    model: 'claude-3-sonnet-20240229',
    messages: [
      { role: 'user', content: context + '\\n\\n' + userMessage }
    ]
  })
});
\`\`\`

3. **Ollama (Local)**:
\`\`\`javascript
const response = await fetch('http://localhost:11434/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    model: 'llama2',
    messages: [
      { role: 'system', content: context },
      { role: 'user', content: userMessage }
    ]
  })
});
\`\`\`

Your message was: "${userMessage}"

Context provided: ${context.length} characters`;
}

/**
 * Export memory to .aime file
 */
async function exportMemory() {
  try {
    const aimeFile = await memoryManager.exportToFile();

    // Create blob and download
    const blob = new Blob([JSON.stringify(aimeFile, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-memory-${Date.now()}.aime`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Show compression stats
    const stats = aimeFile.data;
    alert(`Memory exported successfully!

Original Size: ${formatBytes(stats.originalSize)}
Compressed Size: ${formatBytes(stats.compressedSize)}
Compression Ratio: ${stats.compressionRatio.toFixed(2)}%

File saved as: ai-memory-${Date.now()}.aime`);

  } catch (error) {
    console.error('Export failed:', error);
    alert('Failed to export memory. Please try again.');
  }
}

/**
 * Handle import file
 */
async function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const aimeFile = JSON.parse(text);

    const result = await memoryManager.importFromFile(aimeFile);

    if (result.success) {
      // Clear chat container
      const chatContainer = document.getElementById('chat-container');
      chatContainer.innerHTML = '';

      // Display imported messages
      memoryManager.messages.forEach(msg => {
        addMessageToUI(msg.role, msg.content, false);
      });

      // Update stats
      updateStats();

      alert(`Memory imported successfully!

Messages: ${result.messageCount}
Original Size: ${formatBytes(result.originalSize)}
Compression Ratio: ${result.compressionRatio.toFixed(2)}%`);
    }

  } catch (error) {
    console.error('Import failed:', error);
    alert('Failed to import memory file. Please ensure it is a valid .aime file.');
  }

  // Reset file input
  event.target.value = '';
}

/**
 * Clear chat
 */
async function clearChat() {
  if (!confirm('Are you sure you want to clear all messages? This cannot be undone.')) {
    return;
  }

  const success = await memoryManager.clearAll();

  if (success) {
    // Clear UI
    const chatContainer = document.getElementById('chat-container');
    chatContainer.innerHTML = `
      <div class="welcome-message">
        <h2>Welcome to AI Memory Chat! 🧠</h2>
        <p>This is a completely free, open-source AI memory system with zero external dependencies.</p>
        <ul>
          <li>✅ 100% Free & Open Source</li>
          <li>✅ No external dependencies or libraries</li>
          <li>✅ Works with any LLM (ChatGPT, Claude, Gemini, local models)</li>
          <li>✅ Extreme compression (50MB → 50KB)</li>
          <li>✅ Export/import your memories as .aime files</li>
        </ul>
        <p>Start chatting to build your AI memory!</p>
      </div>
    `;

    updateStats();
  }
}

/**
 * Update stats display
 */
function updateStats() {
  const stats = memoryManager.getStats();
  const statsDiv = document.getElementById('stats');
  
  statsDiv.textContent = `Messages: ${stats.messages} | Concepts: ${stats.concepts} | Size: ${stats.estimatedSize}`;
}

/**
 * Format bytes
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
