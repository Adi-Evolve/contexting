// Popup script with dark mode, export formats, preview, and merge functionality
// Enhanced with error handling and storage management

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize
    await loadTheme();
    await loadStats();
    await loadConversations(); // Load conversations for display
    setupEventListeners();
});

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
}

/**
 * Load and apply saved theme
 */
async function loadTheme() {
    try {
        const result = await chrome.storage.sync.get('theme');
        const theme = result.theme || 'light';
        applyTheme(theme);
    } catch (error) {
        console.error('Failed to load theme:', error);
        applyTheme('light');
    }
}

/**
 * Apply theme to UI
 */
function applyTheme(theme) {
    const body = document.body;
    const toggle = document.getElementById('themeToggle');

    if (theme === 'dark') {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
        toggle.textContent = '☀️';
        toggle.title = 'Switch to light mode';
    } else {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        toggle.textContent = '🌙';
        toggle.title = 'Switch to dark mode';
    }
}

/**
 * Toggle theme
 */
async function toggleTheme() {
    try {
        const body = document.body;
        const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
        
        applyTheme(newTheme);
        await chrome.storage.sync.set({ theme: newTheme });
    } catch (error) {
        console.error('Failed to save theme:', error);
    }
}

/**
 * Load statistics from storage
 */
async function loadStats() {
    try {
        // Get stats from background script
        const response = await chrome.runtime.sendMessage({ action: 'getStats' });

        if (response && response.success) {
            const stats = response.stats;

            // Update UI
            document.getElementById('conversationCount').textContent = stats.activeCount || 0;
            document.getElementById('messageCount').textContent = stats.totalMessages || 0;
            document.getElementById('storageSize').textContent = formatBytes(stats.estimatedSize || 0);
            
            // Update storage bar
            const percent = stats.percentUsed || 0;
            document.getElementById('storagePercent').textContent = `${percent}%`;
            
            const progressFill = document.getElementById('storageProgressFill');
            progressFill.style.width = `${percent}%`;
            
            // Color code based on usage
            progressFill.classList.remove('warning', 'danger');
            if (percent >= 90) {
                progressFill.classList.add('danger');
            } else if (percent >= 70) {
                progressFill.classList.add('warning');
            }

            // Update status
            let status = 'Ready';
            if (stats.activeCount >= stats.limit) {
                status = 'Storage Full';
            } else if (percent >= 80) {
                status = 'Running Low';
            }
            document.getElementById('status').textContent = status;

            // Show warning if near limit
            if (percent >= 90) {
                showNotification('Storage almost full! Please export and clear old conversations.');
            }
        }
    } catch (error) {
        console.error('Failed to load stats:', error);
        document.getElementById('status').textContent = 'Error';
    }
}

/**
 * Load and display conversations
 */
async function loadConversations() {
    try {
        const response = await chrome.runtime.sendMessage({ 
            action: 'getConversations',
            filter: 'all'
        });

        if (response && response.conversations) {
            displayConversations(response.conversations);
        }
    } catch (error) {
        console.error('Failed to load conversations:', error);
        document.getElementById('conversationList').innerHTML = '<div class="error">Failed to load conversations</div>';
    }
}

/**
 * Display conversations in popup
 */
function displayConversations(conversations) {
    const container = document.getElementById('conversationList');
    
    if (conversations.length === 0) {
        container.innerHTML = '<div class="empty-state">No conversations yet</div>';
        return;
    }
    
    // Sort by timestamp (newest first) and take top 5
    const sorted = conversations
        .sort((a, b) => (b.timestamp || b.startTime || 0) - (a.timestamp || a.startTime || 0))
        .slice(0, 5);
    
    container.innerHTML = sorted.map(conv => {
        const title = conv.title || conv.messages[0]?.content?.substring(0, 40) || 'Untitled';
        const messageCount = conv.messages?.length || conv.messageCount || 0;
        const timeAgo = getTimeAgo(conv.startTime || conv.timestamp);
        
        return `
            <div class="conversation-item" data-id="${conv.id}">
                <div class="conv-title">${escapeHtml(title)}</div>
                <div class="conv-meta">
                    <span class="conv-messages">${messageCount} msgs</span>
                    <span class="conv-time">${timeAgo}</span>
                </div>
            </div>
        `;
    }).join('');
    
    // Add click listeners
    container.querySelectorAll('.conversation-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = item.dataset.id;
            viewConversationInSidebar(id);
        });
    });
}

/**
 * View conversation in sidebar
 */
async function viewConversationInSidebar(conversationId) {
    try {
        await chrome.runtime.sendMessage({ 
            action: 'openSidebar',
            conversationId: conversationId 
        });
        // Close popup after opening sidebar
        window.close();
    } catch (error) {
        console.error('Failed to open sidebar:', error);
    }
}

/**
 * Get time ago string
 */
function getTimeAgo(timestamp) {
    if (!timestamp) return 'Unknown';
    
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(timestamp).toLocaleDateString();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Open sidebar
 */
async function openSidebar() {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'openSidebar' });
        
        if (response && !response.success) {
            showNotification('Failed to open sidebar. Please refresh the page.');
        }
    } catch (error) {
        console.error('Failed to open sidebar:', error);
        showNotification('Error opening sidebar');
    }
}

/**
 * Export conversations
 */
async function exportConversations() {
    try {
        const format = document.getElementById('exportFormat').value;
        
        const response = await chrome.runtime.sendMessage({
            action: 'exportConversations',
            format: format
        });

        if (response && response.success) {
            // Trigger download
            downloadFile(response.data, response.filename, response.mimeType);
            showNotification('✅ Conversations exported successfully!');
        } else {
            showNotification('❌ Export failed. Please try again.');
        }
    } catch (error) {
        console.error('Export failed:', error);
        showNotification('Error during export');
    }
}

/**
 * Show export preview
 */
async function showPreview() {
    try {
        const format = document.getElementById('exportFormat').value;
        
        // Show modal
        const modal = document.getElementById('previewModal');
        modal.classList.add('active');

        // Load preview
        const response = await chrome.runtime.sendMessage({
            action: 'exportConversations',
            format: format
        });

        if (response && response.success) {
            const previewContent = document.getElementById('previewContent');
            
            // Truncate if too long
            let previewText = response.data;
            if (previewText.length > 5000) {
                previewText = previewText.substring(0, 5000) + '\n\n... (truncated for preview)';
            }
            
            previewContent.textContent = previewText;
        } else {
            document.getElementById('previewContent').textContent = 'Failed to generate preview';
        }
    } catch (error) {
        console.error('Preview failed:', error);
        document.getElementById('previewContent').textContent = 'Error loading preview';
    }
}

/**
 * Close preview modal
 */
function closePreview() {
    document.getElementById('previewModal').classList.remove('active');
}

/**
 * Export from preview modal
 */
async function exportFromPreview() {
    closePreview();
    await exportConversations();
}

/**
 * Open merge mode in sidebar
 */
async function openMergeMode() {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'openMergeMode' });
        
        if (response && response.success) {
            window.close(); // Close popup
        } else {
            showNotification('Failed to open merge mode');
        }
    } catch (error) {
        console.error('Failed to open merge mode:', error);
        showNotification('Error opening merge mode');
    }
}

/**
 * Download archived conversations
 */
async function downloadArchive() {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'downloadArchive' });

        if (response && response.success) {
            if (response.count === 0) {
                showNotification('No archived conversations to download');
            } else {
                downloadFile(response.data, response.filename, response.mimeType);
                showNotification(`✅ Downloaded ${response.count} archived conversations`);
            }
        } else {
            showNotification('❌ Failed to download archive');
        }
    } catch (error) {
        console.error('Archive download failed:', error);
        showNotification('Error downloading archive');
    }
}

/**
 * Open settings
 */
async function openSettings() {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'openSettings' });
        
        if (response && response.success) {
            window.close(); // Close popup
        }
    } catch (error) {
        console.error('Failed to open settings:', error);
    }
}

/**
 * Download file helper
 */
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Show notification (simple alert for popup)
 */
function showNotification(message) {
    // Could use a toast notification library here
    // For now, just update status temporarily
    const statusEl = document.getElementById('status');
    const originalStatus = statusEl.textContent;
    
    statusEl.textContent = message;
    setTimeout(() => {
        loadStats(); // Reload to restore original status
    }, 3000);
}
