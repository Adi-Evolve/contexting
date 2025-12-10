# 🔌 MemoryForge Chrome Extension: Technical Plan

## 🎯 Goal

Build a Chrome extension that integrates MemoryForge memory into existing ChatGPT/Claude interfaces **without requiring users to change their behavior**.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│        ChatGPT Web Interface (chat.openai.com)      │
│        Claude Web Interface (claude.ai)             │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│     Content Script (Injected into page)             │
│     - Observes DOM for new messages                 │
│     - Adds "Memory" sidebar                         │
│     - Captures user/assistant messages              │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│     Background Service Worker                       │
│     - Runs MemoryForge core                         │
│     - IndexedDB storage                             │
│     - Semantic search                               │
│     - Syncs to cloud (if paid)                      │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│     MemoryForge Cloud API (Optional - Paid)         │
│     - Cross-device sync                             │
│     - Unlimited storage                             │
│     - Advanced features                             │
└─────────────────────────────────────────────────────┘
```

---

## 📂 Extension Structure

```
memoryforge-extension/
├── manifest.json                 # Extension manifest (V3)
├── background/
│   ├── service-worker.js        # Background service worker
│   └── memory-engine.js         # MemoryForge core logic
├── content-scripts/
│   ├── chatgpt-injector.js      # ChatGPT specific injection
│   ├── claude-injector.js       # Claude specific injection
│   └── common.js                # Shared utilities
├── sidebar/
│   ├── sidebar.html             # Memory sidebar UI
│   ├── sidebar.css              # Sidebar styles
│   └── sidebar.js               # Sidebar logic
├── popup/
│   ├── popup.html               # Extension popup
│   ├── popup.css                # Popup styles
│   └── popup.js                 # Popup logic
├── core/                        # Copy from src/core/
│   ├── MemoryForge.js
│   ├── SemanticFingerprint.js
│   ├── TemporalGraph.js
│   └── ... (all core files)
├── icons/
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
└── README.md
```

---

## 📝 manifest.json

```json
{
  "manifest_version": 3,
  "name": "MemoryForge - Persistent Memory for AI",
  "version": "1.0.0",
  "description": "Never forget your AI conversations. Semantic search, knowledge graphs, and more.",
  
  "permissions": [
    "storage",
    "unlimitedStorage",
    "tabs",
    "activeTab"
  ],
  
  "host_permissions": [
    "https://chat.openai.com/*",
    "https://claude.ai/*",
    "https://api.memoryforge.ai/*"
  ],
  
  "background": {
    "service_worker": "background/service-worker.js"
  },
  
  "content_scripts": [
    {
      "matches": ["https://chat.openai.com/*"],
      "js": [
        "core/SemanticFingerprint.js",
        "content-scripts/common.js",
        "content-scripts/chatgpt-injector.js"
      ],
      "css": ["sidebar/sidebar.css"],
      "run_at": "document_end"
    },
    {
      "matches": ["https://claude.ai/*"],
      "js": [
        "core/SemanticFingerprint.js",
        "content-scripts/common.js",
        "content-scripts/claude-injector.js"
      ],
      "css": ["sidebar/sidebar.css"],
      "run_at": "document_end"
    }
  ],
  
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    }
  },
  
  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },
  
  "web_accessible_resources": [
    {
      "resources": ["sidebar/sidebar.html", "sidebar/sidebar.css"],
      "matches": ["https://chat.openai.com/*", "https://claude.ai/*"]
    }
  ]
}
```

---

## 💻 Content Script: chatgpt-injector.js

```javascript
// Content script that runs on chat.openai.com

(async function() {
    console.log('MemoryForge: Initializing ChatGPT integration...');
    
    // 1. Inject memory sidebar
    injectMemorySidebar();
    
    // 2. Observe new messages
    observeMessages();
    
    // 3. Add search bar to interface
    addSearchBar();
    
    // Helper: Inject sidebar into page
    function injectMemorySidebar() {
        const sidebar = document.createElement('div');
        sidebar.id = 'memoryforge-sidebar';
        sidebar.className = 'memoryforge-sidebar';
        sidebar.innerHTML = `
            <div class="mf-header">
                <h3>🧠 Memory</h3>
                <button id="mf-close">✕</button>
            </div>
            <div class="mf-search">
                <input type="text" placeholder="Search memories..." id="mf-search-input">
            </div>
            <div class="mf-stats">
                <span id="mf-count">0 memories</span>
                <span id="mf-size">0 KB</span>
            </div>
            <div class="mf-results" id="mf-results">
                <p class="mf-empty">No relevant memories yet</p>
            </div>
            <div class="mf-footer">
                <button id="mf-upgrade">⭐ Upgrade to Pro</button>
            </div>
        `;
        
        document.body.appendChild(sidebar);
        
        // Add toggle button to ChatGPT UI
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'mf-toggle';
        toggleBtn.className = 'mf-toggle-btn';
        toggleBtn.innerHTML = '🧠';
        toggleBtn.title = 'Toggle MemoryForge';
        toggleBtn.onclick = () => {
            sidebar.classList.toggle('mf-visible');
        };
        
        document.body.appendChild(toggleBtn);
        
        // Event listeners
        document.getElementById('mf-close').onclick = () => {
            sidebar.classList.remove('mf-visible');
        };
        
        document.getElementById('mf-search-input').oninput = (e) => {
            searchMemories(e.target.value);
        };
        
        document.getElementById('mf-upgrade').onclick = () => {
            chrome.runtime.sendMessage({ type: 'open_upgrade_page' });
        };
    }
    
    // Helper: Observe DOM for new messages
    function observeMessages() {
        const targetNode = document.querySelector('main');
        if (!targetNode) {
            console.warn('MemoryForge: Could not find message container');
            return;
        }
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && isMessageNode(node)) {
                        handleNewMessage(node);
                    }
                });
            });
        });
        
        observer.observe(targetNode, {
            childList: true,
            subtree: true
        });
        
        console.log('MemoryForge: Observing messages...');
    }
    
    // Helper: Check if node is a message
    function isMessageNode(node) {
        // ChatGPT uses data-message-author-role attribute
        return node.hasAttribute && 
               node.hasAttribute('data-message-author-role');
    }
    
    // Helper: Extract and store message
    async function handleNewMessage(messageNode) {
        const role = messageNode.getAttribute('data-message-author-role');
        const contentNode = messageNode.querySelector('.markdown');
        
        if (!contentNode) return;
        
        const message = {
            role: role, // "user" or "assistant"
            content: contentNode.textContent.trim(),
            timestamp: Date.now(),
            url: window.location.href,
            conversationId: extractConversationId()
        };
        
        // Send to background script for storage
        chrome.runtime.sendMessage({
            type: 'store_message',
            message: message
        }, (response) => {
            if (response.success) {
                console.log('MemoryForge: Message stored', message.content.substring(0, 50));
                updateStats();
                
                // If assistant message, show relevant memories
                if (role === 'assistant') {
                    showRelevantMemories(message.content);
                }
            }
        });
    }
    
    // Helper: Extract conversation ID from URL
    function extractConversationId() {
        const match = window.location.pathname.match(/\/c\/([^/]+)/);
        return match ? match[1] : 'unknown';
    }
    
    // Helper: Search memories
    async function searchMemories(query) {
        if (!query.trim()) {
            document.getElementById('mf-results').innerHTML = 
                '<p class="mf-empty">Type to search memories...</p>';
            return;
        }
        
        chrome.runtime.sendMessage({
            type: 'search_memories',
            query: query,
            limit: 10
        }, (response) => {
            displaySearchResults(response.results);
        });
    }
    
    // Helper: Show relevant memories for current context
    async function showRelevantMemories(currentMessage) {
        chrome.runtime.sendMessage({
            type: 'get_relevant_memories',
            context: currentMessage,
            limit: 5
        }, (response) => {
            if (response.results && response.results.length > 0) {
                displayRelevantMemories(response.results);
            }
        });
    }
    
    // Helper: Display search results in sidebar
    function displaySearchResults(results) {
        const container = document.getElementById('mf-results');
        
        if (!results || results.length === 0) {
            container.innerHTML = '<p class="mf-empty">No memories found</p>';
            return;
        }
        
        container.innerHTML = results.map(result => `
            <div class="mf-memory-item" data-similarity="${result.similarity}">
                <div class="mf-memory-meta">
                    <span class="mf-role">${result.role === 'user' ? '👤' : '🤖'}</span>
                    <span class="mf-time">${formatTimestamp(result.timestamp)}</span>
                    <span class="mf-similarity">${Math.round(result.similarity * 100)}%</span>
                </div>
                <div class="mf-memory-content">${truncate(result.content, 150)}</div>
                <button class="mf-copy-btn" data-content="${escapeHtml(result.content)}">
                    Copy
                </button>
            </div>
        `).join('');
        
        // Add copy functionality
        container.querySelectorAll('.mf-copy-btn').forEach(btn => {
            btn.onclick = () => {
                navigator.clipboard.writeText(btn.dataset.content);
                btn.textContent = '✓ Copied';
                setTimeout(() => btn.textContent = 'Copy', 2000);
            };
        });
    }
    
    // Helper: Display relevant memories (different UI than search)
    function displayRelevantMemories(results) {
        // Show toast notification with relevant memory count
        showToast(`🧠 Found ${results.length} relevant memories`);
        
        // Optionally auto-open sidebar
        const sidebar = document.getElementById('memoryforge-sidebar');
        if (!sidebar.classList.contains('mf-visible')) {
            sidebar.classList.add('mf-visible');
            sidebar.classList.add('mf-pulse'); // Animate attention
            setTimeout(() => sidebar.classList.remove('mf-pulse'), 1000);
        }
        
        displaySearchResults(results);
    }
    
    // Helper: Update stats in sidebar
    async function updateStats() {
        chrome.runtime.sendMessage({ type: 'get_stats' }, (stats) => {
            document.getElementById('mf-count').textContent = 
                `${stats.count} memories`;
            document.getElementById('mf-size').textContent = 
                `${formatBytes(stats.size)}`;
            
            // Show upgrade prompt if near limit
            if (stats.count >= 900) { // 90% of 1000 free tier
                showUpgradePrompt();
            }
        });
    }
    
    // Helper: Show upgrade prompt
    function showUpgradePrompt() {
        const upgradeBtn = document.getElementById('mf-upgrade');
        upgradeBtn.classList.add('mf-pulse');
        upgradeBtn.innerHTML = '⚠️ Upgrade to Pro (900/1000)';
    }
    
    // Helper: Show toast notification
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'mf-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('mf-show'), 10);
        setTimeout(() => {
            toast.classList.remove('mf-show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    // Utility functions
    function formatTimestamp(ts) {
        const date = new Date(ts);
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
        return text.replace(/[&<>"']/g, (m) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;',
            '"': '&quot;', "'": '&#39;'
        })[m]);
    }
    
    // Initialize on load
    updateStats();
    console.log('MemoryForge: Ready!');
})();
```

---

## 🎨 sidebar.css

```css
/* MemoryForge Sidebar Styles */

.memoryforge-sidebar {
    position: fixed;
    top: 0;
    right: -350px; /* Hidden by default */
    width: 350px;
    height: 100vh;
    background: #1a1a1a;
    color: #e0e0e0;
    box-shadow: -2px 0 10px rgba(0,0,0,0.3);
    z-index: 999999;
    display: flex;
    flex-direction: column;
    transition: right 0.3s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.memoryforge-sidebar.mf-visible {
    right: 0;
}

.memoryforge-sidebar.mf-pulse {
    animation: pulse 0.5s ease;
}

@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
}

/* Header */
.mf-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    background: #0d0d0d;
    border-bottom: 1px solid #333;
}

.mf-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
}

#mf-close {
    background: none;
    border: none;
    color: #999;
    font-size: 20px;
    cursor: pointer;
    padding: 5px;
}

#mf-close:hover {
    color: #fff;
}

/* Search */
.mf-search {
    padding: 15px 20px;
    background: #0d0d0d;
    border-bottom: 1px solid #333;
}

#mf-search-input {
    width: 100%;
    padding: 10px;
    background: #2a2a2a;
    border: 1px solid #444;
    border-radius: 6px;
    color: #e0e0e0;
    font-size: 14px;
}

#mf-search-input:focus {
    outline: none;
    border-color: #58a6ff;
}

/* Stats */
.mf-stats {
    display: flex;
    justify-content: space-between;
    padding: 10px 20px;
    background: #0d0d0d;
    border-bottom: 1px solid #333;
    font-size: 12px;
    color: #999;
}

/* Results */
.mf-results {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
}

.mf-empty {
    text-align: center;
    color: #666;
    padding: 40px 20px;
    font-size: 14px;
}

.mf-memory-item {
    background: #2a2a2a;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 10px;
    border: 1px solid #333;
    transition: all 0.2s;
}

.mf-memory-item:hover {
    border-color: #58a6ff;
    background: #333;
}

.mf-memory-meta {
    display: flex;
    gap: 10px;
    margin-bottom: 8px;
    font-size: 12px;
    color: #999;
}

.mf-role {
    font-size: 16px;
}

.mf-similarity {
    margin-left: auto;
    background: #58a6ff;
    color: #fff;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 600;
}

.mf-memory-content {
    font-size: 13px;
    line-height: 1.5;
    color: #e0e0e0;
    margin-bottom: 8px;
}

.mf-copy-btn {
    background: #444;
    border: none;
    color: #e0e0e0;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
}

.mf-copy-btn:hover {
    background: #58a6ff;
    color: #fff;
}

/* Footer */
.mf-footer {
    padding: 15px 20px;
    background: #0d0d0d;
    border-top: 1px solid #333;
}

#mf-upgrade {
    width: 100%;
    padding: 12px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 8px;
    color: #fff;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: transform 0.2s;
}

#mf-upgrade:hover {
    transform: translateY(-2px);
}

#mf-upgrade.mf-pulse {
    animation: pulse 1s ease infinite;
}

/* Toggle Button */
.mf-toggle-btn {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    font-size: 28px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 999998;
    transition: all 0.3s;
}

.mf-toggle-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 16px rgba(0,0,0,0.4);
}

/* Toast */
.mf-toast {
    position: fixed;
    bottom: 100px;
    right: 20px;
    background: #333;
    color: #fff;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 999999;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s;
}

.mf-toast.mf-show {
    opacity: 1;
    transform: translateY(0);
}

/* Scrollbar */
.mf-results::-webkit-scrollbar {
    width: 8px;
}

.mf-results::-webkit-scrollbar-track {
    background: #1a1a1a;
}

.mf-results::-webkit-scrollbar-thumb {
    background: #444;
    border-radius: 4px;
}

.mf-results::-webkit-scrollbar-thumb:hover {
    background: #666;
}
```

---

## ⚙️ Background Service Worker

```javascript
// background/service-worker.js

import MemoryForge from '../core/MemoryForge.js';

// Initialize MemoryForge instance
const memoryForge = new MemoryForge({
    storage: 'indexeddb',
    maxLocalMessages: 1000, // Free tier limit
    autoSync: false // Will enable for paid users
});

// Initialize on install
chrome.runtime.onInstalled.addListener(async () => {
    console.log('MemoryForge: Extension installed');
    await memoryForge.init();
    
    // Set default settings
    await chrome.storage.local.set({
        tier: 'free',
        messageCount: 0,
        lastSync: null
    });
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    handleMessage(request, sender).then(sendResponse);
    return true; // Async response
});

async function handleMessage(request, sender) {
    switch (request.type) {
        case 'store_message':
            return await storeMessage(request.message);
        
        case 'search_memories':
            return await searchMemories(request.query, request.limit);
        
        case 'get_relevant_memories':
            return await getRelevantMemories(request.context, request.limit);
        
        case 'get_stats':
            return await getStats();
        
        case 'open_upgrade_page':
            chrome.tabs.create({ url: 'https://memoryforge.ai/upgrade' });
            return { success: true };
        
        default:
            return { error: 'Unknown message type' };
    }
}

async function storeMessage(message) {
    try {
        // Check if at limit (free tier)
        const settings = await chrome.storage.local.get(['tier', 'messageCount']);
        
        if (settings.tier === 'free' && settings.messageCount >= 1000) {
            // Show upgrade prompt
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, {
                    type: 'show_upgrade_prompt',
                    reason: 'limit_reached'
                });
            });
            
            return { success: false, error: 'Free tier limit reached' };
        }
        
        // Store in MemoryForge
        await memoryForge.addMessage(message.content, {
            role: message.role,
            timestamp: message.timestamp,
            conversationId: message.conversationId,
            url: message.url
        });
        
        // Update count
        await chrome.storage.local.set({
            messageCount: settings.messageCount + 1
        });
        
        return { success: true };
    } catch (error) {
        console.error('MemoryForge: Error storing message', error);
        return { success: false, error: error.message };
    }
}

async function searchMemories(query, limit = 10) {
    try {
        const results = await memoryForge.search(query, { limit });
        return { results };
    } catch (error) {
        console.error('MemoryForge: Error searching', error);
        return { results: [], error: error.message };
    }
}

async function getRelevantMemories(context, limit = 5) {
    try {
        // Use semantic search to find relevant past messages
        const results = await memoryForge.search(context, {
            limit,
            threshold: 0.7 // Only show highly relevant memories
        });
        
        return { results };
    } catch (error) {
        console.error('MemoryForge: Error getting relevant memories', error);
        return { results: [], error: error.message };
    }
}

async function getStats() {
    try {
        const settings = await chrome.storage.local.get(['tier', 'messageCount']);
        const storageEstimate = await navigator.storage.estimate();
        
        return {
            count: settings.messageCount || 0,
            tier: settings.tier || 'free',
            size: storageEstimate.usage || 0,
            quota: storageEstimate.quota || 0
        };
    } catch (error) {
        return {
            count: 0,
            tier: 'free',
            size: 0,
            quota: 0
        };
    }
}
```

---

## 🚀 Deployment Steps

### 1. Build Extension

```bash
# Package extension files
zip -r memoryforge-extension.zip \
    manifest.json \
    background/ \
    content-scripts/ \
    sidebar/ \
    popup/ \
    core/ \
    icons/ \
    README.md
```

### 2. Test Locally

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select extension directory
5. Test on chat.openai.com

### 3. Submit to Chrome Web Store

1. Create Developer account ($5 one-time fee)
2. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
3. Click "New Item"
4. Upload zip file
5. Fill out store listing:
   - Name: "MemoryForge - AI Memory"
   - Description: "Never forget your AI conversations..."
   - Screenshots (1280x800): Show extension in action
   - Category: Productivity
   - Privacy policy: Link to memoryforge.ai/privacy
6. Submit for review (1-3 days)

---

## 📊 Success Metrics

**Week 1:**
- 100 installs
- 50 active users
- 10,000 messages stored

**Month 1:**
- 1,000 installs
- 500 active users
- 5 paid upgrades ($45 MRR)

**Month 3:**
- 10,000 installs
- 5,000 active users
- 100 paid upgrades ($900 MRR)

---

## ✅ Next Steps

1. **Build MVP extension** (This week)
2. **Test with beta users** (10 people)
3. **Submit to Chrome Web Store**
4. **Launch on Product Hunt**
5. **Iterate based on feedback**

**This Chrome extension is the key to getting MemoryForge into users' hands! 🚀**
