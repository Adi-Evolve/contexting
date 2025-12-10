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
            
            // ALWAYS use optimalContext (7-point format)
            if (conv.summary.optimalContext) {
                const text = conv.summary.optimalContext;
                console.log('✅ Using 7-point optimalContext format:', text.substring(0, 100) + '...');
                navigator.clipboard.writeText(text).then(() => {
                    showToast('✅ Copied 7-point context!');
                }).catch(() => {
                    showToast('❌ Copy failed');
                });
            } else {
                // If optimalContext is missing, there's a problem
                console.error('❌ optimalContext is NULL! Falling back to contextPrompt (old format)');
                const text = conv.summary.contextPrompt || 'Error: No context available';
                navigator.clipboard.writeText(text).then(() => {
                    showToast('⚠️ Copied (old format - check console)');
                }).catch(() => {
                    showToast('❌ Copy failed');
                });
            }
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

// Show conversation in detailed modal - REBUILT FROM SCRATCH
function showConversationModal(conversation) {
    // Remove any existing modal
    const existing = document.getElementById('mf-detail-modal-overlay');
    if (existing) existing.remove();
    
    // Check if sidebar is in dark mode
    const sidebar = document.getElementById('memoryforge-sidebar');
    const isDarkMode = sidebar && sidebar.classList.contains('mf-dark-mode');
    
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.id = 'mf-detail-modal-overlay';
    overlay.className = `mf-detail-modal-overlay${isDarkMode ? ' mf-dark-mode' : ''}`;
    
    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'mf-detail-modal';
    
    // Build modal HTML
    modal.innerHTML = `
        <div class="mf-detail-header">
            <div class="mf-detail-title-section">
                <h2 class="mf-detail-title">${escapeHtml(conversation.title || 'Conversation Details')}</h2>
                <div class="mf-detail-meta">
                    <span class="mf-detail-meta-item">📅 ${formatTime(conversation.startTime)}</span>
                    <span class="mf-detail-meta-item">💬 ${conversation.messageCount} messages</span>
                    <span class="mf-detail-meta-item">🪙 ${conversation.tokens} tokens</span>
                </div>
            </div>
            <button class="mf-detail-close" id="mf-close-detail">×</button>
        </div>
        
        <div class="mf-detail-messages">
            ${conversation.messages.map(msg => `
                <div class="mf-detail-message mf-detail-message-${msg.role}">
                    <div class="mf-detail-message-header">
                        <span class="mf-detail-message-role">${msg.role === 'user' ? '👤 You' : '🤖 Assistant'}</span>
                    </div>
                    <div class="mf-detail-message-content">${escapeHtml(msg.content)}</div>
                </div>
            `).join('')}
        </div>
        
        <div class="mf-detail-actions">
            <button class="mf-detail-btn mf-detail-btn-primary" id="mf-detail-copy-optimal">
                <span class="mf-detail-btn-icon">🎯</span>
                <span class="mf-detail-btn-text">Copy Context</span>
            </button>
            <button class="mf-detail-btn" id="mf-detail-copy-xml">
                <span class="mf-detail-btn-icon">📋</span>
                <span class="mf-detail-btn-text">Copy XML</span>
            </button>
            <button class="mf-detail-btn" id="mf-detail-download-md">
                <span class="mf-detail-btn-icon">📄</span>
                <span class="mf-detail-btn-text">Download MD</span>
            </button>
            <button class="mf-detail-btn" id="mf-detail-download-json">
                <span class="mf-detail-btn-icon">💾</span>
                <span class="mf-detail-btn-text">Download JSON</span>
            </button>
        </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Event listeners
    const closeModal = () => overlay.remove();
    
    // Close button
    document.getElementById('mf-close-detail').addEventListener('click', closeModal);
    
    // Click outside to close
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
    
    // Escape key to close
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
    
    // Copy optimal context
    document.getElementById('mf-detail-copy-optimal').addEventListener('click', () => {
        if (conversation.summary.optimalContext) {
            navigator.clipboard.writeText(conversation.summary.optimalContext).then(() => {
                showToast('✅ Copied 7-point context to clipboard!');
            });
        } else {
            console.error('❌ optimalContext is NULL! Using fallback.');
            const fallbackText = conversation.summary.contextPrompt || 'Error: No context available';
            navigator.clipboard.writeText(fallbackText).then(() => {
                showToast('⚠️ Copied (old format - regenerate conversation)');
            });
        }
    });
    
    // Copy XML
    document.getElementById('mf-detail-copy-xml').addEventListener('click', () => {
        navigator.clipboard.writeText(conversation.summary.xml).then(() => {
            showToast('✅ Copied XML format to clipboard!');
        });
    });
    
    // Download MD
    document.getElementById('mf-detail-download-md').addEventListener('click', () => {
        const mdContent = conversation.summary.optimalContext || conversation.summary.contextPrompt || 'Error: No context available';
        if (!conversation.summary.optimalContext) {
            console.error('❌ optimalContext is NULL! Downloaded fallback format.');
        }
        const blob = new Blob([mdContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `void_context_${conversation.id}.md`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('✅ Downloaded context as Markdown!');
    });
    
    // Download JSON
    document.getElementById('mf-detail-download-json').addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(conversation, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `void_conversation_${conversation.id}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('✅ Downloaded conversation as JSON!');
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
