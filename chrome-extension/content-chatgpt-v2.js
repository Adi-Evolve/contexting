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
    
    // Start conversation BEFORE capturing messages
    await conversationTracker.startNewConversation();
    console.log('✅ Conversation initialized, ready to capture messages');
    
    // Inject UI
    injectSidebar();
    addFloatingButton();
    
    // Start observing
    observeMessages();
    
    // Listen for conversation saves to refresh sidebar
    window.addEventListener('conversationSaved', () => {
        console.log('🔄 Conversation saved, refreshing sidebar...');
        loadConversations();
    });
    
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

// Get page title from ChatGPT UI
function getPageTitle() {
    // Try multiple selectors for ChatGPT's title
    const selectors = [
        'nav a.active',
        'nav button[aria-current="page"]',
        'h1',
        'title'
    ];
    
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
            const title = element.textContent.trim();
            if (title && title !== 'New chat' && title !== 'ChatGPT' && !title.includes('ChatGPT')) {
                console.log(`📌 Found page title: "${title}"`);
                return title;
            }
        }
    }
    
    // Try document title as last resort
    const pageTitle = document.title;
    if (pageTitle && !pageTitle.includes('ChatGPT') && pageTitle !== 'ChatGPT') {
        console.log(`📌 Using document title: "${pageTitle}"`);
        return pageTitle;
    }
    
    console.log('⚠️ No page title found');
    return null;
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
    
    // Capture ALL existing messages on page load (complete conversation history)
    console.log('📚 Capturing existing conversation history...');
    const existingMessages = document.querySelectorAll('[data-message-author-role]');
    console.log(`Found ${existingMessages.length} existing messages`);
    
    if (existingMessages.length === 0) {
        console.warn('⚠️ No messages found! ChatGPT may still be loading.');
    } else {
        existingMessages.forEach((msg, index) => {
            console.log(`Processing message ${index + 1}/${existingMessages.length}`);
            processMessage(msg);
        });
        console.log(`✅ Finished processing ${existingMessages.length} existing messages`);
    }
    
    // Try to get title multiple times (ChatGPT loads title async)
    let titleAttempts = 0;
    const trySetTitle = () => {
        titleAttempts++;
        const pageTitle = getPageTitle();
        if (pageTitle && conversationTracker.currentConversation) {
            conversationTracker.currentConversation.title = pageTitle;
            console.log(`✅ Set conversation title (attempt ${titleAttempts}): "${pageTitle}"`);
            // Save immediately after setting title
            conversationTracker.saveConversation();
        } else if (titleAttempts < 5) {
            console.log(`⏳ Title not ready yet, retrying... (attempt ${titleAttempts}/5)`);
            setTimeout(trySetTitle, 1000);
        } else {
            console.warn('⚠️ Could not get page title after 5 attempts');
        }
    };
    setTimeout(trySetTitle, 500);
    
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
const MAX_PROCESSED_MESSAGES = 200; // Limit to prevent memory bloat
let messageProcessCount = 0; // Track total messages processed

// Conversation linking state
let linkingMode = false;
let selectedConversations = new Set();

function processMessage(messageElement) {
    const role = messageElement.getAttribute('data-message-author-role');
    if (!role) {
        console.log('⏭️ Skipping element - no role attribute');
        return;
    }
    
    // Extract full content
    const contentElement = messageElement.querySelector('.markdown') || 
                          messageElement.querySelector('[class*="whitespace-pre-wrap"]') ||
                          messageElement;
    
    const content = contentElement.textContent.trim();
    if (!content || content.length < 5) {
        console.log(`⏭️ Skipping ${role} - content too short (${content.length} chars)`);
        return;
    }
    
    // Check if already processed using content hash for reliability
    const messageId = messageElement.getAttribute('data-message-id');
    const currentUrl = window.location.href;
    const contentHash = content.substring(0, 50); // Use first 50 chars as identifier
    const uniqueKey = messageId ? `${currentUrl}:::${messageId}` : `${currentUrl}:::${contentHash}`;
    
    if (processedMessages.has(uniqueKey)) {
        console.log(`⏭️ Already processed ${role} message`);
        return;
    }
    processedMessages.set(uniqueKey, true);
    
    // Add to conversation tracker
    conversationTracker.addMessage(role, content);
    messageProcessCount++;
    
    console.log(`✅ Captured ${role} message #${messageProcessCount} (${content.length} chars): "${content.substring(0, 50)}..."`);
    
    // Clean up old processed messages to prevent memory bloat
    if (processedMessages.size > MAX_PROCESSED_MESSAGES) {
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
            <button id="mf-link-mode">🔗 Link Conversations</button>
            <button id="mf-import">📤 Import Context</button>
            <button id="mf-export">📥 Export All</button>
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
    document.getElementById('mf-link-mode').addEventListener('click', () => {
        if (linkingMode && selectedConversations.size >= 2) {
            mergeSelectedConversations();
        } else {
            toggleLinkMode();
        }
    });
    
    // Force save current conversation when opening sidebar
    if (typeof conversationTracker !== 'undefined') {
        conversationTracker.saveConversation();
    }
    
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
            // Sort by timestamp descending (newest first)
            const sorted = response.conversations.sort((a, b) => 
                (b.timestamp || b.startTime || 0) - (a.timestamp || a.startTime || 0)
            );
            displayConversations(sorted);
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
        <div class="mf-conversation-card ${linkingMode ? 'mf-link-mode' : ''}" data-id="${conv.id}">
            ${linkingMode ? `<input type="checkbox" class="mf-link-checkbox" data-id="${conv.id}" ${selectedConversations.has(conv.id) ? 'checked' : ''}>` : ''}
            <div class="mf-conv-header">
                <span class="mf-conv-title">${escapeHtml(conv.title || conv.messages[0]?.content?.substring(0, 50) || 'Untitled')}</span>
                <span class="mf-conv-count">${(conv.messages?.length || conv.messageCount || 0)} msgs</span>
            </div>
            <div class="mf-conv-time">${formatTime(conv.startTime || conv.timestamp)}</div>
            <div class="mf-conv-preview">${escapeHtml(conv.messages[0]?.content?.substring(0, 80) || '')}...</div>
            <div class="mf-conv-actions">
                <button class="mf-btn-small mf-resume-btn" data-id="${conv.id}" title="Resume in new chat (Smart Context)">🔄 Resume</button>
                <button class="mf-btn-small mf-insert-btn" data-id="${conv.id}" title="Insert into chat">✨ Insert</button>
                <button class="mf-btn-small mf-copy-btn" data-id="${conv.id}" title="Copy to clipboard">📋 Copy</button>
                <button class="mf-btn-small mf-view-btn" data-id="${conv.id}" title="View details">👁️ View</button>
                <button class="mf-btn-small mf-delete-btn" data-id="${conv.id}" title="Delete conversation">🗑️ Delete</button>
            </div>
        </div>
    `).join('');
    
    // Add event listeners to buttons
    container.querySelectorAll('.mf-resume-btn').forEach(btn => {
        btn.addEventListener('click', () => resumeConversation(btn.dataset.id));
    });
    
    container.querySelectorAll('.mf-insert-btn').forEach(btn => {
        btn.addEventListener('click', () => insertConversation(btn.dataset.id));
    });
    
    container.querySelectorAll('.mf-copy-btn').forEach(btn => {
        btn.addEventListener('click', () => copyConversation(btn.dataset.id));
    });
    
    container.querySelectorAll('.mf-view-btn').forEach(btn => {
        btn.addEventListener('click', () => viewConversation(btn.dataset.id));
    });
    
    container.querySelectorAll('.mf-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteConversation(btn.dataset.id));
    });
    
    // Add checkbox listeners for linking mode
    if (linkingMode) {
        container.querySelectorAll('.mf-link-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                if (e.target.checked) {
                    selectedConversations.add(id);
                } else {
                    selectedConversations.delete(id);
                }
                updateLinkButton();
            });
        });
    }
}

// Copy conversation in LLM-ready format (using smart context assembly)
function copyConversation(conversationId) {
    showToast('⏳ Assembling smart context...');
    
    chrome.runtime.sendMessage({
        action: 'assembleContext',
        conversationId: conversationId,
        userQuery: null
    }, (response) => {
        if (chrome.runtime.lastError) {
            showToast('❌ Error: Extension context lost');
            return;
        }
        
        if (response && response.success) {
            const text = response.prompt;
            console.log('✅ Using smart context assembly:', text.substring(0, 100) + '...');
            navigator.clipboard.writeText(text).then(() => {
                const tokenInfo = response.wasTruncated 
                    ? ` (${response.tokenEstimate} tokens, truncated)`
                    : ` (${response.tokenEstimate} tokens)`;
                showToast('✅ Copied smart context!' + tokenInfo);
            }).catch(() => {
                showToast('❌ Copy failed');
            });
        } else {
            showToast('❌ Failed to assemble context: ' + (response?.error || 'Unknown error'));
        }
    });
}

// Insert conversation context into chat
function insertConversation(conversationId) {
    chrome.runtime.sendMessage({
        action: 'getConversation',
        id: conversationId
    }, (response) => {
        if (chrome.runtime.lastError) {
            showToast('❌ Error: Extension context lost');
            return;
        }
        
        const conv = response; // response IS the conversation
        
        if (conv && conv.summary) {
            // Use optimalContext (7-point format) if available
            const text = conv.summary.optimalContext || conv.summary.contextPrompt || 'Error: No context available';
            
            // Use the robust insertTextIntoChat function
            const success = insertTextIntoChat(text);
            
            if (success) {
                // Close sidebar
                document.getElementById('memoryforge-sidebar').classList.remove('mf-open');
                showToast('✨ Context inserted into chat!');
            } else {
                showToast('❌ Could not find input field');
            }
        } else {
            showToast('❌ No context available');
        }
    });
}

// View full conversation
function viewConversation(conversationId) {
    chrome.runtime.sendMessage({
        action: 'getConversation',
        id: conversationId
    }, (response) => {
        if (chrome.runtime.lastError) {
            showToast('❌ Error: Extension context lost');
            return;
        }
        
        const conv = response; // response IS the conversation
        
        if (conv) {
            showConversationModal(conv);
        } else {
            showToast('❌ Conversation not found');
        }
    });
}

// Delete conversation (no confirmation)
function deleteConversation(conversationId) {
    chrome.runtime.sendMessage({
        action: 'deleteConversation',
        id: conversationId
    }, (response) => {
        if (chrome.runtime.lastError) {
            showToast('❌ Error: Extension context lost');
            return;
        }
        
        if (response?.success) {
            showToast('🗑️ Conversation deleted');
            loadConversations(); // Refresh list
        } else {
            showToast('❌ Delete failed');
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
        action: 'exportConversations',
        format: 'json'
    }, (response) => {
        if (chrome.runtime.lastError) {
            showToast('❌ Error: Extension context lost');
            return;
        }
        
        if (response && response.success) {
            const blob = new Blob([response.data], { type: response.mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = response.filename;
            a.click();
            URL.revokeObjectURL(url);
            showToast('✅ Exported all conversations!');
        } else {
            showToast('❌ Export failed');
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

// === Conversation Linking Functions ===

function toggleLinkMode() {
    linkingMode = !linkingMode;
    const btn = document.getElementById('mf-link-mode');
    
    if (linkingMode) {
        btn.textContent = '✅ Merge Selected';
        btn.classList.add('mf-active');
        selectedConversations.clear();
    } else {
        btn.textContent = '🔗 Link Conversations';
        btn.classList.remove('mf-active');
        selectedConversations.clear();
    }
    
    loadConversations(); // Reload to show/hide checkboxes
}

function updateLinkButton() {
    const btn = document.getElementById('mf-link-mode');
    if (selectedConversations.size >= 2) {
        btn.textContent = `✅ Merge ${selectedConversations.size} Conversations`;
    } else {
        btn.textContent = '✅ Select 2+ to Merge';
    }
}

function mergeSelectedConversations() {
    if (selectedConversations.size < 2) {
        showToast('⚠️ Select at least 2 conversations to merge');
        return;
    }
    
    const ids = Array.from(selectedConversations);
    
    chrome.runtime.sendMessage({
        action: 'mergeConversations',
        conversationIds: ids
    }, (response) => {
        if (response && response.success) {
            showToast(`✅ Merged ${ids.length} conversations!`);
            linkingMode = false;
            selectedConversations.clear();
            toggleLinkMode();
            loadConversations();
        } else {
            showToast('❌ Failed to merge conversations');
        }
    });
}

// ============================================================================
// RESUME CONVERSATION - SMART CONTEXT ASSEMBLY
// ============================================================================

/**
 * Resume conversation with smart context assembly (4-layer approach)
 * @param {string} conversationId - ID of conversation to resume
 */
function resumeConversation(conversationId) {
    console.log('🔄 Resuming conversation:', conversationId);
    
    // Show loading toast
    showToast('⏳ Assembling smart context...');
    
    // Call background service to assemble context
    chrome.runtime.sendMessage({
        action: 'assembleContext',
        conversationId: conversationId,
        userQuery: null  // Can be enhanced to ask user for specific query
    }, (response) => {
        if (chrome.runtime.lastError) {
            showToast('❌ Error: Extension context lost');
            return;
        }
        
        if (response && response.success) {
            console.log('✅ Context assembled:', response);
            showContextPreviewModal(response, conversationId);
        } else {
            showToast(`❌ Failed to assemble context: ${response.error || 'Unknown error'}`);
            console.error('Context assembly error:', response);
        }
    });
}

/**
 * Show context preview modal with layer breakdown
 * @param {Object} contextData - Assembled context data
 * @param {string} conversationId - Original conversation ID
 */
function showContextPreviewModal(contextData, conversationId) {
    // Remove existing modal if present
    const existingModal = document.getElementById('mf-context-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'mf-context-modal';
    modal.className = 'mf-modal-overlay';
    
    // Calculate token breakdown
    const tokenBreakdown = contextData.tokenBreakdown || {};
    const layer0Tokens = tokenBreakdown.layer0 || 0;
    const layer1Tokens = tokenBreakdown.layer1 || 0;
    const layer2Tokens = tokenBreakdown.layer2 || 0;
    const layer3Tokens = tokenBreakdown.layer3 || 0;
    const totalTokens = contextData.tokenEstimate || 0;
    
    // Check if context was truncated
    const wasTruncated = contextData.wasTruncated || false;
    const originalTokens = contextData.originalTokenCount || totalTokens;
    
    // Check for contradictions
    const contradictions = contextData.contradictions || [];
    const hasContradictions = contradictions.length > 0;
    
    modal.innerHTML = `
        <div class="mf-modal-content mf-context-modal">
            <div class="mf-modal-header">
                <h2>🔄 Resume Chat - Smart Context</h2>
                <button class="mf-modal-close" id="mf-close-modal">×</button>
            </div>
            
            <div class="mf-modal-body">
                <!-- Token Summary -->
                <div class="mf-token-summary">
                    <div class="mf-token-stat">
                        <span class="mf-token-label">Total Tokens:</span>
                        <span class="mf-token-value ${totalTokens > 1600 ? 'mf-token-warning' : 'mf-token-good'}">${totalTokens}</span>
                    </div>
                    ${wasTruncated ? `
                    <div class="mf-truncation-notice">
                        <div class="mf-truncation-header">
                            <span class="mf-warning-icon">⚠️</span>
                            <span>Content Truncated to Fit Budget</span>
                        </div>
                        <div class="mf-truncation-details">
                            <div class="mf-truncation-stat">
                                <span>Original:</span>
                                <span>${originalTokens} tokens</span>
                            </div>
                            <div class="mf-truncation-stat">
                                <span>After Truncation:</span>
                                <span>${totalTokens} tokens</span>
                            </div>
                            <div class="mf-truncation-stat">
                                <span>Saved:</span>
                                <span>${originalTokens - totalTokens} tokens (${Math.round((1 - totalTokens/originalTokens) * 100)}%)</span>
                            </div>
                            <div class="mf-truncation-info">
                                💡 Truncation preserves most recent messages and key decisions while removing older history.
                            </div>
                        </div>
                    </div>
                    ` : ''}
                    <div class="mf-token-breakdown">
                        ${layer0Tokens > 0 ? `<span class="mf-token-chip">Layer 0: ${layer0Tokens}</span>` : ''}
                        <span class="mf-token-chip">Layer 1: ${layer1Tokens}</span>
                        <span class="mf-token-chip">Layer 2: ${layer2Tokens}</span>
                        ${layer3Tokens > 0 ? `<span class="mf-token-chip">Layer 3: ${layer3Tokens}</span>` : ''}
                    </div>
                </div>
                
                <!-- Contradictions Warning -->
                ${hasContradictions ? `
                <div class="mf-contradiction-warning">
                    <div class="mf-warning-header">
                        <span class="mf-warning-icon">⚠️</span>
                        <span class="mf-warning-text">${contradictions.length} Contradiction${contradictions.length > 1 ? 's' : ''} Detected</span>
                    </div>
                    <div class="mf-contradiction-list">
                        ${contradictions.map(c => `
                            <div class="mf-contradiction-item">
                                <strong>Decision A:</strong> ${escapeHtml(c.decision1?.text || 'Unknown')}<br>
                                <strong>Decision B:</strong> ${escapeHtml(c.decision2?.text || 'Unknown')}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <!-- Model Selector -->
                <div class="mf-model-selector">
                    <label for="mf-model-select">Export Format:</label>
                    <select id="mf-model-select" class="mf-select">
                        <option value="chatgpt" selected>ChatGPT (JSON)</option>
                        <option value="claude">Claude (XML)</option>
                        <option value="gemini">Gemini (Structured JSON)</option>
                        <option value="llama">LLaMA (Markdown)</option>
                    </select>
                    <button class="mf-btn-small" id="mf-change-format">Update Preview</button>
                </div>
                
                <!-- Context Preview -->
                <div class="mf-context-preview">
                    <div class="mf-preview-header">
                        <strong>Context Preview:</strong>
                        <span class="mf-preview-hint">(Editable)</span>
                    </div>
                    <textarea id="mf-context-text" class="mf-context-textarea" rows="15">${escapeHtml(contextData.prompt)}</textarea>
                </div>
            </div>
            
            <div class="mf-modal-footer">
                <button class="mf-btn-primary" id="mf-copy-context">
                    📋 Copy to Clipboard
                </button>
                <button class="mf-btn-primary" id="mf-insert-context">
                    ✨ Insert into Chat
                </button>
                <button class="mf-btn-secondary" id="mf-cancel-modal">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    document.getElementById('mf-copy-context').addEventListener('click', () => {
        const textarea = document.getElementById('mf-context-text');
        copyTextToClipboard(textarea.value);
        showToast('✅ Context copied to clipboard!');
    });
    
    document.getElementById('mf-insert-context').addEventListener('click', () => {
        const textarea = document.getElementById('mf-context-text');
        insertTextIntoChat(textarea.value);
        modal.remove();
        showToast('✅ Context inserted into chat!');
    });
    
    document.getElementById('mf-cancel-modal').addEventListener('click', () => {
        modal.remove();
    });
    
    document.getElementById('mf-close-modal').addEventListener('click', () => {
        modal.remove();
    });
    
    document.getElementById('mf-change-format').addEventListener('click', () => {
        const modelSelect = document.getElementById('mf-model-select');
        const selectedModel = modelSelect.value;
        
        showToast('⏳ Formatting for ' + selectedModel + '...');
        
        chrome.runtime.sendMessage({
            action: 'exportContextForModel',
            conversationId: conversationId,
            model: selectedModel,
            userQuery: null
        }, (response) => {
            if (response && response.success) {
                const textarea = document.getElementById('mf-context-text');
                
                // Handle different format types
                if (typeof response.formatted === 'string') {
                    textarea.value = response.formatted;
                } else if (typeof response.formatted === 'object') {
                    textarea.value = JSON.stringify(response.formatted, null, 2);
                }
                
                showToast('✅ Format updated!');
            } else {
                showToast('❌ Failed to format: ' + (response.error || 'Unknown error'));
            }
        });
    });
    
    // Close modal on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 */
function copyTextToClipboard(text) {
    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(err => {
            console.error('Clipboard API failed, using fallback', err);
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

/**
 * Fallback copy method
 * @param {string} text - Text to copy
 */
function fallbackCopyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}

/**
 * Insert text into chat input
 * @param {string} text - Text to insert
 */
function insertTextIntoChat(text) {
    console.log('🔍 Attempting to insert text into chat...');
    
    // Try multiple selectors for ChatGPT's evolving DOM
    const selectors = [
        '#prompt-textarea',  // Main ChatGPT textarea
        'textarea[data-id]',  // Alternative data-id textarea
        'textarea[placeholder*="Message"]',  // Generic message input
        'div[contenteditable="true"]',  // Contenteditable div
        'textarea',  // Any textarea fallback
    ];
    
    for (const selector of selectors) {
        const inputElement = document.querySelector(selector);
        if (inputElement) {
            console.log(`✅ Found input element: ${selector}`);
            
            // Handle textarea
            if (inputElement.tagName === 'TEXTAREA') {
                inputElement.value = text;
                inputElement.dispatchEvent(new Event('input', { bubbles: true }));
                inputElement.dispatchEvent(new Event('change', { bubbles: true }));
            } 
            // Handle contenteditable div
            else if (inputElement.contentEditable === 'true') {
                inputElement.textContent = text;
                inputElement.dispatchEvent(new Event('input', { bubbles: true }));
                inputElement.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            // Focus and trigger React update (for ChatGPT)
            inputElement.focus();
            
            // Dispatch additional events for React components
            const reactEvents = ['input', 'change', 'keyup', 'blur', 'focus'];
            reactEvents.forEach(eventType => {
                inputElement.dispatchEvent(new Event(eventType, { bubbles: true }));
            });
            
            console.log('✅ Text inserted successfully');
            return true;
        }
    }
    
    console.warn('❌ Could not find chat input element');
    console.log('Available textareas:', document.querySelectorAll('textarea'));
    console.log('Available contenteditable:', document.querySelectorAll('[contenteditable="true"]'));
    showToast('⚠️ Could not insert automatically - text copied to clipboard instead');
    
    // Fallback: Copy to clipboard
    copyTextToClipboard(text);
    return false;
}

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

// Add keyboard shortcut listeners
document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+R: Resume Chat (on current conversation)
    if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        if (conversationTracker && conversationTracker.conversationId) {
            resumeConversation(conversationTracker.conversationId);
            showToast('⌨️ Resumed current conversation');
        } else {
            showToast('⚠️ No active conversation to resume');
        }
    }
    
    // Ctrl+Shift+E: Toggle sidebar
    if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        const sidebar = document.querySelector('.mf-sidebar');
        if (sidebar) {
            sidebar.classList.toggle('mf-open');
            showToast(sidebar.classList.contains('mf-open') ? '📖 Sidebar opened' : '📖 Sidebar closed');
        }
    }
    
    // Ctrl+Shift+C: Copy current conversation context
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        if (conversationTracker && conversationTracker.conversationId) {
            copyConversation(conversationTracker.conversationId);
        } else {
            showToast('⚠️ No active conversation');
        }
    }
    
    // Escape: Close modal
    if (e.key === 'Escape') {
        const modal = document.querySelector('.mf-modal-overlay');
        if (modal) {
            modal.remove();
        }
    }
});

console.log('✅ VOID Content Script V2: Resume Chat feature loaded!');
console.log('⌨️ Keyboard Shortcuts: Ctrl+Shift+R (Resume), Ctrl+Shift+E (Sidebar), Ctrl+Shift+C (Copy)');

// ============================================================================
// MESSAGE LISTENER (for popup communication)
// ============================================================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openSidebar') {
        const sidebar = document.querySelector('.mf-sidebar');
        if (sidebar) {
            sidebar.classList.add('mf-open');
            
            // If a specific conversation ID is provided, scroll to it and highlight it
            if (request.conversationId) {
                setTimeout(() => {
                    const conversationCard = document.querySelector(`[data-id="${request.conversationId}"]`);
                    if (conversationCard) {
                        // Scroll to conversation
                        conversationCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        
                        // Highlight it temporarily
                        conversationCard.style.backgroundColor = 'var(--comic-secondary)';
                        setTimeout(() => {
                            conversationCard.style.backgroundColor = '';
                        }, 2000);
                    }
                }, 300);
            }
            
            sendResponse({ success: true });
        } else {
            sendResponse({ success: false, error: 'Sidebar not found' });
        }
    } else if (request.action === 'openMergeMode') {
        const sidebar = document.querySelector('.mf-sidebar');
        if (sidebar) {
            sidebar.classList.add('mf-open');
            // Trigger link mode
            const linkButton = document.getElementById('mf-link-mode');
            if (linkButton) {
                linkButton.click();
            }
            sendResponse({ success: true });
        } else {
            sendResponse({ success: false, error: 'Sidebar not found' });
        }
    }
    return true;
});
