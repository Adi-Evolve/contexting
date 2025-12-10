// Popup script with dark mode, export formats, preview, and merge functionality
// Enhanced with error handling and storage management

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize
    await loadTheme();
    await loadStats();
    setupEventListeners();
});

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Main actions
    document.getElementById('openSidebar').addEventListener('click', openSidebar);
    document.getElementById('exportBtn').addEventListener('click', exportConversations);
    document.getElementById('previewBtn').addEventListener('click', showPreview);
    document.getElementById('mergeBtn').addEventListener('click', openMergeMode);
    document.getElementById('archiveBtn').addEventListener('click', downloadArchive);
    document.getElementById('settingsBtn').addEventListener('click', openSettings);

    // Preview modal
    document.getElementById('previewClose').addEventListener('click', closePreview);
    document.getElementById('previewCancel').addEventListener('click', closePreview);
    document.getElementById('previewExport').addEventListener('click', exportFromPreview);

    // Close modal on outside click
    document.getElementById('previewModal').addEventListener('click', (e) => {
        if (e.target.id === 'previewModal') {
            closePreview();
        }
    });
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
            const statusEl = document.getElementById('status');
            const statusCard = statusEl.closest('.stat-card');
            
            // Reset status styles
            statusCard.classList.remove('alert');
            statusEl.style.color = ''; // Reset to default CSS color

            if (stats.activeCount >= stats.limit) {
                status = 'Storage Full';
                statusCard.classList.add('alert');
                statusEl.style.color = 'var(--primary-red)';
            } else if (percent >= 80) {
                status = 'Running Low';
                statusCard.classList.add('alert');
                statusEl.style.color = 'var(--primary-red)';
            } else {
                statusEl.style.color = 'var(--primary-blue)';
            }
            statusEl.textContent = status;

            // Show warning if near limit
            if (percent >= 90) {
                showNotification('Storage almost full! Please export and clear old conversations.', 'error');
            }
        }
    } catch (error) {
        console.error('Failed to load stats:', error);
        document.getElementById('status').textContent = 'Error';
    }
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
 * Show toast notification
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Icon based on type
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';
    
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    
    container.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

/**
 * Show notification (wrapper for toast)
 */
function showNotification(message, type = null) {
    if (!type) {
        // Determine type based on message content if not provided
        type = 'info';
        if (message.includes('success') || message.includes('✅')) type = 'success';
        if (message.includes('fail') || message.includes('Error') || message.includes('❌')) type = 'error';
    }
    
    showToast(message, type);
}
