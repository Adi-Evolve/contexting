// MemoryForge - ChatGPT Content Script
// This runs on chat.openai.com and automatically captures conversations

console.log('🧠 MemoryForge: Initializing...');

// Configuration
const CONFIG = {
    observerDelay: 500,
    maxRetries: 10,
    sidebarWidth: '350px'
};

// State
let isInitialized = false;
let messageObserver = null;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

async function init() {
    if (isInitialized) return;
    
    console.log('🧠 MemoryForge: Starting initialization...');
    
    // Wait for ChatGPT to load
    await waitForChatGPT();
    
    // Inject sidebar
    injectSidebar();
    
    // Start observing messages
    observeMessages();
    
    // Add floating button
    addFloatingButton();
    
    isInitialized = true;
    console.log('✅ MemoryForge: Ready!');
}

// Wait for ChatGPT main container to load
function waitForChatGPT() {
    return new Promise((resolve) => {
        let attempts = 0;
        const checkInterval = setInterval(() => {
            const mainContainer = document.querySelector('main') || 
                                 document.querySelector('[role="main"]');
            
            if (mainContainer || attempts >= CONFIG.maxRetries) {
                clearInterval(checkInterval);
                resolve();
            }
            attempts++;
        }, CONFIG.observerDelay);
    });
}

// Inject memory sidebar
function injectSidebar() {
    // Create sidebar container
    const sidebar = document.createElement('div');
    sidebar.id = 'memoryforge-sidebar';
    sidebar.innerHTML = `
        <div class="mf-header">
            <div style="display: flex; align-items: center;">
                <button id="mf-theme-toggle" class="mf-theme-toggle" title="Toggle Dark Mode">🌙</button>
                <h3>🧠 MemoryForge</h3>
            </div>
            <button class="mf-close" id="mf-close-btn">×</button>
        </div>
        
        <div class="mf-search">
            <input type="text" 
                   id="mf-search-input" 
                   placeholder="Search your memories..." 
                   autocomplete="off">
        </div>
        
        <div class="mf-stats">
            <span id="mf-count">0 memories</span>
            <span id="mf-size">0 KB</span>
        </div>
        
        <div class="mf-filters">
            <button class="mf-filter active" data-filter="all">All</button>
            <button class="mf-filter" data-filter="user">You</button>
            <button class="mf-filter" data-filter="assistant">ChatGPT</button>
        </div>
        
        <div class="mf-results" id="mf-results">
            <div class="mf-empty">
                <p>💡 Your memories will appear here</p>
                <p class="mf-hint">Start chatting to capture memories automatically</p>
            </div>
        </div>
        
        <div class="mf-footer">
            <button id="mf-export-btn" class="mf-btn-secondary">📥 Export</button>
            <button id="mf-settings-btn" class="mf-btn-secondary">⚙️</button>
        </div>
    `;
    
    document.body.appendChild(sidebar);
    
    // Event listeners
    document.getElementById('mf-close-btn').addEventListener('click', () => {
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
    
    document.getElementById('mf-search-input').addEventListener('input', (e) => {
        handleSearch(e.target.value);
    });
    
    document.querySelectorAll('.mf-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.mf-filter').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            applyFilter(e.target.dataset.filter);
        });
    });
    
    document.getElementById('mf-export-btn').addEventListener('click', exportMemories);
    
    // Load initial stats
    updateStats();
}

// Add floating toggle button
function addFloatingButton() {
    const button = document.createElement('button');
    button.id = 'mf-float-btn';
    button.innerHTML = '⚡';
    button.title = 'Open MemoryForge';
    
    button.addEventListener('click', () => {
        const sidebar = document.getElementById('memoryforge-sidebar');
        sidebar.classList.toggle('mf-open');
        
        if (sidebar.classList.contains('mf-open')) {
            updateStats();
            loadRecentMemories();
        }
    });
    
    document.body.appendChild(button);
}

// Observe for new messages
function observeMessages() {
    const targetNode = document.querySelector('main');
    if (!targetNode) {
        console.warn('🧠 MemoryForge: Could not find main container');
        return;
    }
    
    messageObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    // Check if it's a message container
                    const messageElements = node.querySelectorAll('[data-message-author-role]');
                    messageElements.forEach(handleNewMessage);
                    
                    // Also check the node itself
                    if (node.hasAttribute && node.hasAttribute('data-message-author-role')) {
                        handleNewMessage(node);
                    }
                }
            });
        });
    });
    
    messageObserver.observe(targetNode, {
        childList: true,
        subtree: true
    });
    
    console.log('🧠 MemoryForge: Observing messages...');
}

// Handle new message detected
function handleNewMessage(messageElement) {
    const role = messageElement.getAttribute('data-message-author-role');
    if (!role) return;
    
    // Find content (ChatGPT uses markdown class)
    const contentElement = messageElement.querySelector('.markdown, [data-message-content]') ||
                          messageElement.querySelector('div[class*="text"]');
    
    if (!contentElement) return;
    
    const content = contentElement.textContent.trim();
    if (!content || content.length < 5) return; // Skip empty or very short
    
    const message = {
        role: role,
        content: content,
        timestamp: Date.now(),
        url: window.location.href,
        conversationId: extractConversationId()
    };
    
    // Send to background script for storage
    chrome.runtime.sendMessage({
        action: 'storeMessage',
        message: message
    }, (response) => {
        if (response && response.success) {
            console.log('✅ Stored:', content.substring(0, 50) + '...');
            updateStats();
            
            // Show notification for important captures
            if (role === 'user' && content.length > 100) {
                showToast('💾 Memory captured');
            }
        }
    });
}

// Extract conversation ID from URL
function extractConversationId() {
    const match = window.location.pathname.match(/\/c\/([a-zA-Z0-9-]+)/);
    return match ? match[1] : 'unknown';
}

// Handle search
async function handleSearch(query) {
    if (!query.trim()) {
        loadRecentMemories();
        return;
    }
    
    chrome.runtime.sendMessage({
        action: 'searchMemories',
        query: query,
        limit: 20
    }, (response) => {
        if (chrome.runtime.lastError) {
            console.warn('🔄 Extension context invalidated. Please refresh the page.');
            showToast('⚠️ Please refresh the page to search', 3000);
            return;
        }
        if (response && response.results) {
            displayResults(response.results, query);
        }
    });
}

// Apply filter
function applyFilter(filter) {
    const results = document.querySelectorAll('.mf-result-item');
    results.forEach(item => {
        if (filter === 'all') {
            item.style.display = 'block';
        } else {
            const role = item.dataset.role;
            item.style.display = role === filter ? 'block' : 'none';
        }
    });
}

// Load recent memories
function loadRecentMemories() {
    chrome.runtime.sendMessage({
        action: 'getRecentMemories',
        limit: 20
    }, (response) => {
        if (chrome.runtime.lastError) {
            console.warn('🔄 Extension context invalidated. Please refresh the page.');
            displayResults([], null);
            return;
        }
        if (response && response.results) {
            displayResults(response.results);
        }
    });
}

// Display search/filter results
function displayResults(results, searchQuery = null) {
    const container = document.getElementById('mf-results');
    
    if (!results || results.length === 0) {
        container.innerHTML = `
            <div class="mf-empty">
                <p>${searchQuery ? '🔍 No matches found' : '📭 No memories yet'}</p>
                <p class="mf-hint">Start a conversation to capture memories</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = results.map(result => `
        <div class="mf-result-item" data-role="${result.role}">
            <div class="mf-result-header">
                <span class="mf-role-badge ${result.role}">
                    ${result.role === 'user' ? '👤 You' : '🤖 ChatGPT'}
                </span>
                <span class="mf-timestamp">${formatTimestamp(result.timestamp)}</span>
                ${result.similarity ? `<span class="mf-similarity">${Math.round(result.similarity * 100)}%</span>` : ''}
            </div>
            <div class="mf-result-content">${escapeHtml(truncate(result.content, 200))}</div>
            <div class="mf-result-actions">
                <button class="mf-action-btn" onclick="copyToClipboard('${escapeHtml(result.content)}')">
                    📋 Copy
                </button>
                <button class="mf-action-btn" onclick="insertIntoChat('${escapeHtml(result.content)}')">
                    ➕ Insert
                </button>
            </div>
        </div>
    `).join('');
}

// Update stats
function updateStats() {
    chrome.runtime.sendMessage({ action: 'getStats' }, (response) => {
        if (chrome.runtime.lastError) {
            console.warn('🔄 Extension context invalidated. Please refresh the page.');
            const countEl = document.getElementById('mf-count');
            const sizeEl = document.getElementById('mf-size');
            if (countEl) countEl.textContent = '⚠️ Refresh page';
            if (sizeEl) sizeEl.textContent = 'Context lost';
            return;
        }
        if (response) {
            document.getElementById('mf-count').textContent = 
                `${response.count || 0} memories`;
            document.getElementById('mf-size').textContent = 
                formatBytes(response.size || 0);
        }
    });
}

// Export memories
function exportMemories() {
    chrome.runtime.sendMessage({ action: 'exportMemories' }, (response) => {
        if (chrome.runtime.lastError) {
            showToast('⚠️ Extension context lost. Please refresh the page.', 4000);
            return;
        }
        if (response && response.data) {
            const blob = new Blob([response.data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `memoryforge-export-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('✅ Exported successfully!');
        }
    });
}

// Show toast notification
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

// Utility functions
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

function truncate(str, maxLen) {
    return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Global functions for inline onclick handlers
window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text);
    showToast('📋 Copied to clipboard!');
};

window.insertIntoChat = function(text) {
    const textarea = document.querySelector('textarea[placeholder*="Message"], textarea#prompt-textarea');
    if (textarea) {
        textarea.value = text;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.focus();
        showToast('✅ Inserted into chat!');
    } else {
        copyToClipboard(text);
        showToast('📋 Copied (could not find input)');
    }
};
