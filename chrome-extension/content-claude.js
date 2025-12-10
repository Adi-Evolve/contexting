// MemoryForge Content Script for Claude.ai
// Captures conversations from Claude interface

console.log('🧠 MemoryForge: Claude content script loaded');

// Wait for Claude to load
function waitForClaude() {
    return new Promise((resolve) => {
        if (document.querySelector('[data-testid="chat-input"]')) {
            resolve();
        } else {
            const observer = new MutationObserver(() => {
                if (document.querySelector('[data-testid="chat-input"]')) {
                    observer.disconnect();
                    resolve();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }
    });
}

// Initialize
async function init() {
    await waitForClaude();
    console.log('✅ Claude interface detected');
    
    injectMemorySidebar();
    observeMessages();
    addFloatingButton();
}

// Inject sidebar (same as ChatGPT version)
function injectMemorySidebar() {
    if (document.getElementById('memoryforge-sidebar')) return;

    const sidebar = document.createElement('div');
    sidebar.id = 'memoryforge-sidebar';
    sidebar.className = 'mf-sidebar';
    sidebar.innerHTML = `
        <div class="mf-header">
            <h3>🧠 MemoryForge</h3>
            <button id="mf-close" class="mf-close-btn">×</button>
        </div>
        <div class="mf-search-container">
            <input type="text" id="mf-search-input" placeholder="Search your memories..." />
        </div>
        <div class="mf-filters">
            <button class="mf-filter active" data-filter="all">All</button>
            <button class="mf-filter" data-filter="user">User</button>
            <button class="mf-filter" data-filter="assistant">Claude</button>
            <button class="mf-filter" data-filter="recent">Recent</button>
        </div>
        <div id="mf-results" class="mf-results"></div>
        <div class="mf-stats">
            <span id="mf-count">0 memories</span>
            <span id="mf-status">Local</span>
        </div>
    `;

    document.body.appendChild(sidebar);

    // Event listeners
    document.getElementById('mf-close').addEventListener('click', () => {
        sidebar.classList.remove('open');
    });

    document.getElementById('mf-search-input').addEventListener('input', (e) => {
        handleSearch(e.target.value);
    });

    document.querySelectorAll('.mf-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.mf-filter').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            handleSearch(document.getElementById('mf-search-input').value, e.target.dataset.filter);
        });
    });

    console.log('✅ Sidebar injected');
}

// Observe new messages in Claude
function observeMessages() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1 && isClaudeMessage(node)) {
                    handleNewMessage(node);
                }
            });
        });
    });

    // Observe the main chat container
    const chatContainer = document.querySelector('main') || document.body;
    observer.observe(chatContainer, {
        childList: true,
        subtree: true
    });

    console.log('✅ Message observer active');
}

// Check if node is a Claude message
function isClaudeMessage(node) {
    // Claude messages typically have specific structure
    // This selector may need adjustment based on Claude's current DOM
    return node.querySelector('div[data-testid*="message"]') || 
           node.classList?.contains('font-claude-message') ||
           (node.textContent && node.textContent.length > 20 && 
            node.querySelector('p, div'));
}

// Handle new message
function handleNewMessage(node) {
    try {
        // Try to determine role (user vs Claude)
        const isUserMessage = node.closest('[data-is-user-message="true"]') !== null ||
                            node.querySelector('[data-is-user-message="true"]') !== null;
        
        const role = isUserMessage ? 'user' : 'assistant';
        
        // Extract content
        const contentElement = node.querySelector('p, div[class*="message"]') || node;
        const content = contentElement.textContent.trim();

        if (!content || content.length < 5) return;

        // Store message
        chrome.runtime.sendMessage({
            action: 'storeMessage',
            message: {
                role: role,
                content: content,
                context: {
                    source: 'claude',
                    url: window.location.href,
                    timestamp: new Date().toISOString()
                }
            }
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.warn('🔄 Extension context lost. Please refresh the page.');
                return;
            }
            if (response?.success) {
                console.log('✅ Memory stored:', content.substring(0, 50) + '...');
                updateStats();
            }
        });
    } catch (error) {
        console.error('Error handling message:', error);
    }
}

// Add floating toggle button
function addFloatingButton() {
    if (document.getElementById('mf-float-btn')) return;

    const button = document.createElement('button');
    button.id = 'mf-float-btn';
    button.className = 'mf-float-btn';
    button.innerHTML = '🧠';
    button.title = 'Toggle MemoryForge';
    
    button.addEventListener('click', () => {
        const sidebar = document.getElementById('memoryforge-sidebar');
        sidebar.classList.toggle('open');
    });

    document.body.appendChild(button);
    console.log('✅ Floating button added');
}

// Handle search
function handleSearch(query, filter = 'all') {
    if (!query) {
        if (filter === 'recent') {
            chrome.runtime.sendMessage({
                action: 'getRecentMemories',
                limit: 20
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.warn('🔄 Extension context invalidated. Please refresh the page.');
                    showToast('⚠️ Please refresh the page to search', 3000);
                    return;
                }
                displayResults(response);
            });
        } else {
            document.getElementById('mf-results').innerHTML = '<p class="mf-empty">Type to search...</p>';
        }
        return;
    }

    chrome.runtime.sendMessage({
        action: 'searchMemories',
        query: query,
        limit: 20,
        filters: { role: filter !== 'all' ? filter : null }
    }, (response) => {
        if (chrome.runtime.lastError) {
            console.warn('🔄 Extension context invalidated. Please refresh the page.');
            showToast('⚠️ Please refresh the page to search', 3000);
            return;
        }
        displayResults(response);
    });
}

// Display search results
function displayResults(response) {
    const resultsContainer = document.getElementById('mf-results');
    
    if (!response || response.error) {
        resultsContainer.innerHTML = '<p class="mf-error">Search failed</p>';
        return;
    }

    const results = response.results || response;
    
    if (results.length === 0) {
        resultsContainer.innerHTML = '<p class="mf-empty">No results found</p>';
        return;
    }

    resultsContainer.innerHTML = results.map(result => `
        <div class="mf-result-item">
            <div class="mf-result-header">
                <span class="mf-result-role">${result.role || 'user'}</span>
                <span class="mf-result-score">${(result.score * 100).toFixed(0)}%</span>
            </div>
            <div class="mf-result-content">${escapeHtml(result.content.substring(0, 200))}${result.content.length > 200 ? '...' : ''}</div>
            <div class="mf-result-actions">
                <button onclick="window.copyToClipboard('${escapeHtml(result.content).replace(/'/g, "\\'")}')">Copy</button>
                <button onclick="window.insertIntoChat('${escapeHtml(result.content).replace(/'/g, "\\'")}')">Insert</button>
            </div>
        </div>
    `).join('');
}

// Copy to clipboard
window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!');
    });
};

// Insert into Claude chat
window.insertIntoChat = function(text) {
    const input = document.querySelector('[data-testid="chat-input"]') || 
                  document.querySelector('textarea[placeholder*="Talk"]') ||
                  document.querySelector('div[contenteditable="true"]');
    
    if (input) {
        if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
            input.value = text;
            input.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
            input.textContent = text;
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
        input.focus();
        showToast('Inserted into chat!');
    } else {
        showToast('Could not find chat input');
    }
};

// Update stats display
function updateStats() {
    chrome.runtime.sendMessage({ action: 'getStats' }, (stats) => {
        if (chrome.runtime.lastError) {
            console.warn('🔄 Extension context invalidated. Please refresh the page.');
            const countEl = document.getElementById('mf-count');
            const statusEl = document.getElementById('mf-status');
            if (countEl) countEl.textContent = '⚠️ Refresh page';
            if (statusEl) statusEl.textContent = 'Context lost';
            return;
        }
        if (stats) {
            document.getElementById('mf-count').textContent = `${stats.count} memories`;
            document.getElementById('mf-status').textContent = stats.mode || 'Local';
        }
    });
}

// Show toast notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'mf-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Listen for toggle messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleSidebar') {
        const sidebar = document.getElementById('memoryforge-sidebar');
        sidebar?.classList.toggle('open');
        sendResponse({ success: true });
    }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
