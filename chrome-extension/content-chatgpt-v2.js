// MemoryForge - ChatGPT Content Script (Conversation Mode)
// Captures FULL conversations with complete context

console.log('🧠 MemoryForge: Loading conversation mode...');

// Initialize conversation tracker
let conversationTracker = null;
let isInitialized = false;

// Start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

async function init() {
    if (isInitialized) return;
    
    // Wait for ConversationTracker to load
    if (typeof ConversationTracker === 'undefined') {
        setTimeout(init, 100);
        return;
    }
    
    conversationTracker = new ConversationTracker();
    
    // Wait for ChatGPT
    await waitForChatGPT();
    
    // Inject UI
    injectSidebar();
    addFloatingButton();
    
    // Start observing
    observeMessages();
    
    // Save on page unload
    window.addEventListener('beforeunload', () => {
        conversationTracker.forceSave();
    });
    
    isInitialized = true;
    console.log('✅ MemoryForge: Ready (Conversation Mode)');
}

function waitForChatGPT() {
    return new Promise((resolve) => {
        const check = setInterval(() => {
            if (document.querySelector('main')) {
                clearInterval(check);
                resolve();
            }
        }, 500);
    });
}

// Observe messages and group into conversations
function observeMessages() {
    const targetNode = document.querySelector('main');
    if (!targetNode) return;
    
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    // Find all message elements
                    const messages = node.querySelectorAll('[data-message-author-role]');
                    messages.forEach(processMessage);
                    
                    if (node.hasAttribute && node.hasAttribute('data-message-author-role')) {
                        processMessage(node);
                    }
                }
            });
        });
    });
    
    observer.observe(targetNode, { childList: true, subtree: true });
    
    // Also process existing messages
    document.querySelectorAll('[data-message-author-role]').forEach(processMessage);
    
    console.log('👀 Observing messages...');
}

// Monitor for page navigation (when user clicks different chat in sidebar)
let lastUrl = window.location.href;
setInterval(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
        console.log('🔄 Chat switched - clearing processed messages cache');
        processedMessages.clear(); // Clear cache so new chat messages are captured
        lastUrl = currentUrl;
        
        // Reload conversations list in sidebar
        if (document.getElementById('memoryforge-sidebar')?.classList.contains('mf-open')) {
            loadConversations();
        }
    }
}, 1000);

// Process individual message and add to conversation
const processedMessages = new Map(); // Store URL + messageId to track per-chat

function processMessage(messageElement) {
    // Avoid processing same message twice in same chat
    const messageId = messageElement.getAttribute('data-message-id');
    const currentUrl = window.location.href;
    const uniqueKey = `${currentUrl}:::${messageId}`;
    
    if (messageId && processedMessages.has(uniqueKey)) return;
    if (messageId) processedMessages.set(uniqueKey, true);
    
    const role = messageElement.getAttribute('data-message-author-role');
    if (!role) return;
    
    // Extract full content
    const contentElement = messageElement.querySelector('.markdown') || 
                          messageElement.querySelector('[class*="whitespace-pre-wrap"]') ||
                          messageElement;
    
    const content = contentElement.textContent.trim();
    if (!content || content.length < 5) return;
    
    // Add to conversation tracker
    conversationTracker.addMessage(role, content);
    
    console.log(`📝 Captured ${role} message (${content.length} chars)`);
    
    // Clean up old processed messages (keep only last 100)
    if (processedMessages.size > 100) {
        const firstKey = processedMessages.keys().next().value;
        processedMessages.delete(firstKey);
    }
}

// Inject sidebar
function injectSidebar() {
    if (document.getElementById('memoryforge-sidebar')) return;
    
    const sidebar = document.createElement('div');
    sidebar.id = 'memoryforge-sidebar';
    sidebar.className = 'mf-sidebar';
    sidebar.innerHTML = `
        <div class="mf-header">
            <div style="display: flex; align-items: center;">
                <button id="mf-theme-toggle" class="mf-theme-toggle" title="Toggle Dark Mode">🌙</button>
                <h3>⚡ VOID</h3>
            </div>
            <button id="mf-close" class="mf-close-btn">×</button>
        </div>
        
        <div class="mf-search-container">
            <input type="text" id="mf-search" placeholder="Search conversations..." />
            <button id="mf-refresh">🔄</button>
        </div>
        
        <div class="mf-filters">
            <button class="mf-filter active" data-filter="all">All</button>
            <button class="mf-filter" data-filter="today">Today</button>
            <button class="mf-filter" data-filter="week">Week</button>
            <button class="mf-filter" data-filter="month">Month</button>
        </div>
        
        <div id="mf-conversations" class="mf-conversations"></div>
        
        <div class="mf-stats">
            <span id="mf-count">0 conversations</span>
            <span id="mf-size">0 KB</span>
        </div>
        
        <div class="mf-actions">
            <button id="mf-import">📤 Import Context</button>
            <button id="mf-export">📥 Export All</button>
            <button id="mf-save-current">💾 Save Current</button>
        </div>
        
        <input type="file" id="mf-import-file" accept=".md,.txt,.json" style="display: none;" />
    `;
    
    document.body.appendChild(sidebar);
    
    // Event listeners
    document.getElementById('mf-close').addEventListener('click', () => {
        sidebar.classList.remove('mf-open');
    });

    // Theme toggle
    const themeToggle = document.getElementById('mf-theme-toggle');
    
    // Load saved theme
    chrome.storage.local.get('theme', (result) => {
        if (result.theme === 'dark') {
            sidebar.classList.add('mf-dark-mode');
            themeToggle.textContent = '☀️';
        }
    });

    themeToggle.addEventListener('click', () => {
        sidebar.classList.toggle('mf-dark-mode');
        const isDark = sidebar.classList.contains('mf-dark-mode');
        themeToggle.textContent = isDark ? '☀️' : '🌙';
        chrome.storage.local.set({ theme: isDark ? 'dark' : 'light' });
    });
    
    document.getElementById('mf-search').addEventListener('input', (e) => {
        handleSearch(e.target.value);
    });
    
    document.getElementById('mf-refresh').addEventListener('click', () => {
        loadConversations();
    });
    
    document.querySelectorAll('.mf-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.mf-filter').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            filterConversations(e.target.dataset.filter);
        });
    });
    
    document.getElementById('mf-import').addEventListener('click', () => {
        document.getElementById('mf-import-file').click();
    });
    
    document.getElementById('mf-import-file').addEventListener('change', handleImportFile);
    document.getElementById('mf-export').addEventListener('click', exportAllConversations);
    document.getElementById('mf-save-current').addEventListener('click', saveCurrentConversation);
    
    // Load conversations
    loadConversations();
}

// Add floating button
function addFloatingButton() {
    if (document.getElementById('mf-float-btn')) return;
    
    const button = document.createElement('button');
    button.id = 'mf-float-btn';
    button.className = 'mf-float-btn';
    button.innerHTML = '⚡';
    button.title = 'MemoryForge Conversations';
    
    button.addEventListener('click', () => {
        const sidebar = document.getElementById('memoryforge-sidebar');
        sidebar.classList.toggle('mf-open');
        if (sidebar.classList.contains('mf-open')) {
            loadConversations();
        }
    });
    
    document.body.appendChild(button);
}

// Load conversations from storage
function loadConversations(filter = 'all') {
    chrome.runtime.sendMessage({
        action: 'getConversations',
        filter: filter
    }, (response) => {
        if (chrome.runtime.lastError) {
            console.warn('Context lost');
            return;
        }
        if (response && response.conversations) {
            displayConversations(response.conversations);
            updateStats(response.stats);
        }
    });
}

// Display conversations in sidebar
function displayConversations(conversations) {
    const container = document.getElementById('mf-conversations');
    
    if (conversations.length === 0) {
        container.innerHTML = '<div class="mf-empty">No conversations yet. Start chatting!</div>';
        return;
    }
    
    container.innerHTML = conversations.map(conv => `
        <div class="mf-conversation-card" data-id="${conv.id}">
            <div class="mf-conv-header">
                <span class="mf-conv-title">${escapeHtml(conv.title || 'Untitled')}</span>
                <span class="mf-conv-count">${conv.messageCount} msgs</span>
            </div>
            <div class="mf-conv-time">${formatTime(conv.startTime)}</div>
            <div class="mf-conv-preview">${escapeHtml(conv.messages[0]?.content.substring(0, 80) || '')}...</div>
            <div class="mf-conv-actions">
                <button class="mf-btn-small mf-copy-btn" data-id="${conv.id}">📋 Copy</button>
                <button class="mf-btn-small mf-view-btn" data-id="${conv.id}">👁️ View</button>
            </div>
        </div>
    `).join('');
    
    // Add event listeners to buttons
    container.querySelectorAll('.mf-copy-btn').forEach(btn => {
        btn.addEventListener('click', () => copyConversation(btn.dataset.id));
    });
    
    container.querySelectorAll('.mf-view-btn').forEach(btn => {
        btn.addEventListener('click', () => viewConversation(btn.dataset.id));
    });
}

// Copy conversation in LLM-ready format (optimal 7-point structure)
function copyConversation(conversationId) {
    chrome.runtime.sendMessage({
        action: 'getConversation',
        id: conversationId
    }, (response) => {
        if (response && response.conversation) {
            const conv = response.conversation;
            // Use optimal 7-point context format (best for LLMs)
            const text = conv.summary.optimalContext || conv.summary.contextPrompt;
            
            navigator.clipboard.writeText(text).then(() => {
                showToast('✅ Copied optimal context (7-point format)!');
            }).catch(() => {
                showToast('❌ Copy failed');
            });
        }
    });
}

// Insert conversation context into chat
function insertConversation(conversationId) {
    chrome.runtime.sendMessage({
        action: 'getConversation',
        id: conversationId
    }, (response) => {
        if (response && response.conversation) {
            const conv = response.conversation;
            const text = conv.summary.contextPrompt;
            
            // Find ChatGPT input
            const input = document.querySelector('#prompt-textarea') ||
                         document.querySelector('textarea[placeholder*="Message"]') ||
                         document.querySelector('textarea');
            
            if (input) {
                input.value = text;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.focus();
                showToast('✅ Inserted into chat!');
            } else {
                showToast('❌ Could not find input');
            }
        }
    });
}

// View full conversation
function viewConversation(conversationId) {
    chrome.runtime.sendMessage({
        action: 'getConversation',
        id: conversationId
    }, (response) => {
        if (response && response.conversation) {
            showConversationModal(response.conversation);
        }
    });
}

// Show conversation in modal
function showConversationModal(conversation) {
    // Remove existing modal
    const existing = document.getElementById('mf-modal');
    if (existing) existing.remove();
    
    const modal = document.createElement('div');
    modal.id = 'mf-modal';
    modal.className = 'mf-modal';
    modal.innerHTML = `
        <div class="mf-modal-content">
            <div class="mf-modal-header">
                <h2>${escapeHtml(conversation.title || 'Conversation')}</h2>
                <button class="mf-modal-close">×</button>
            </div>
            <div class="mf-modal-info">
                <span>📅 ${formatTime(conversation.startTime)}</span>
                <span>💬 ${conversation.messageCount} messages</span>
                <span>🪙 ~${conversation.tokens} tokens</span>
            </div>
            <div class="mf-modal-body">
                ${conversation.messages.map(msg => `
                    <div class="mf-msg-${msg.role}">
                        <strong>${msg.role === 'user' ? '👤 You' : '🤖 Assistant'}:</strong>
                        <p>${escapeHtml(msg.content)}</p>
                    </div>
                `).join('')}
            </div>
            <div class="mf-modal-footer">
                <button class="mf-modal-btn mf-btn-primary" id="mf-copy-optimal">🎯 Copy Optimal Context</button>
                <button class="mf-modal-btn" id="mf-copy-xml">📋 Copy XML</button>
                <button class="mf-modal-btn" id="mf-download-md">📄 Download MD</button>
                <button class="mf-modal-btn" id="mf-download-json">💾 Download JSON</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close button
    modal.querySelector('.mf-modal-close').addEventListener('click', () => {
        modal.remove();
    });
    
    // Copy buttons
    document.getElementById('mf-copy-optimal').addEventListener('click', () => {
        const optimalText = conversation.summary.optimalContext || conversation.summary.contextPrompt;
        navigator.clipboard.writeText(optimalText);
        showToast('✅ Copied optimal 7-point context!');
    });
    
    document.getElementById('mf-copy-xml').addEventListener('click', () => {
        navigator.clipboard.writeText(conversation.summary.xml);
        showToast('✅ Copied XML format');
    });
    
    document.getElementById('mf-download-md').addEventListener('click', () => {
        const mdContent = conversation.summary.optimalContext || conversation.summary.contextPrompt;
        const blob = new Blob([mdContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `context_${conversation.id}.md`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('✅ Downloaded optimal context as MD');
    });
    
    document.getElementById('mf-download-json').addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(conversation, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversation_${conversation.id}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('✅ Downloaded JSON');
    });
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// Handle search
function handleSearch(query) {
    if (!query.trim()) {
        loadConversations();
        return;
    }
    
    chrome.runtime.sendMessage({
        action: 'searchConversations',
        query: query
    }, (response) => {
        if (response && response.conversations) {
            displayConversations(response.conversations);
        }
    });
}

// Filter conversations
function filterConversations(filter) {
    loadConversations(filter);
}

// Export all conversations
function exportAllConversations() {
    chrome.runtime.sendMessage({
        action: 'exportConversations'
    }, (response) => {
        if (response && response.data) {
            const blob = new Blob([response.data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `memoryforge_export_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('✅ Exported all conversations!');
        }
    });
}

// Save current conversation manually
function saveCurrentConversation() {
    if (conversationTracker) {
        conversationTracker.forceSave();
        showToast('✅ Saved current conversation!');
        setTimeout(() => loadConversations(), 500);
    }
}

// Update stats
function updateStats(stats) {
    if (!stats) return;
    document.getElementById('mf-count').textContent = `${stats.count || 0} conversations`;
    document.getElementById('mf-size').textContent = formatBytes(stats.size || 0);
}

// Utility functions
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    
    return date.toLocaleDateString();
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 10) / 10 + ' ' + sizes[i];
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Import context file
function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const content = e.target.result;
        
        try {
            // Detect file type and parse
            let contextText = '';
            
            if (file.name.endsWith('.json')) {
                const data = JSON.parse(content);
                contextText = data.optimalContext || data.contextPrompt || JSON.stringify(data, null, 2);
            } else {
                // Markdown or text file
                contextText = content;
            }
            
            // Insert into chat input
            insertTextIntoChat(contextText);
            
            showToast('✅ Context imported! Ready to paste into chat.');
            
            // Optional: Show in modal for review
            showImportPreview(contextText);
            
        } catch (error) {
            showToast('❌ Failed to import file: ' + error.message);
            console.error('Import error:', error);
        }
    };
    
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
}

// Insert text into ChatGPT input
function insertTextIntoChat(text) {
    const inputSelector = 'textarea[data-id], textarea#prompt-textarea, div[contenteditable="true"]';
    const input = document.querySelector(inputSelector);
    
    if (!input) {
        console.warn('Chat input not found');
        return false;
    }
    
    if (input.tagName === 'TEXTAREA') {
        input.value = text;
        input.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
        input.textContent = text;
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // Focus on input
    input.focus();
    
    return true;
}

// Show import preview modal
function showImportPreview(text) {
    const modal = document.createElement('div');
    modal.className = 'mf-modal-overlay';
    modal.innerHTML = `
        <div class="mf-modal" style="max-width: 700px;">
            <div class="mf-modal-header">
                <h3>📤 Imported Context Preview</h3>
                <button class="mf-close-btn" onclick="this.closest('.mf-modal-overlay').remove()">×</button>
            </div>
            <div class="mf-modal-body">
                <pre style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 10px; overflow-x: auto; white-space: pre-wrap; word-break: break-word;">${escapeHtml(text)}</pre>
            </div>
            <div class="mf-modal-footer">
                <button class="mf-modal-btn mf-btn-primary" onclick="navigator.clipboard.writeText(\`${text.replace(/`/g, '\\`')}\`).then(() => { window.showToast('✅ Copied to clipboard!'); this.closest('.mf-modal-overlay').remove(); })">
                    📋 Copy to Clipboard
                </button>
                <button class="mf-modal-btn" onclick="this.closest('.mf-modal-overlay').remove()">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function showToast(message, duration = 2000) {
    const toast = document.createElement('div');
    toast.className = 'mf-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('mf-show'), 10);
    setTimeout(() => {
        toast.classList.remove('mf-show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}
