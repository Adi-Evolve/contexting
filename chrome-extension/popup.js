// MemoryForge Popup Script

document.addEventListener('DOMContentLoaded', async () => {
    // Load stats
    loadStats();
    
    // Set up event listeners
    document.getElementById('openSidebar').addEventListener('click', openSidebar);
    document.getElementById('exportBtn').addEventListener('click', exportMemories);
    document.getElementById('settingsBtn').addEventListener('click', openSettings);
    
    // Refresh stats every 2 seconds
    setInterval(loadStats, 2000);
});

async function loadStats() {
    chrome.runtime.sendMessage({ action: 'getStats' }, (response) => {
        if (response) {
            document.getElementById('count').textContent = response.count || 0;
            document.getElementById('size').textContent = formatBytes(response.size || 0);
        }
    });
}

async function openSidebar() {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Check if we're on ChatGPT or Claude
    if (tab.url.includes('chat.openai.com') || 
        tab.url.includes('chatgpt.com') || 
        tab.url.includes('claude.ai')) {
        
        // Send message to content script to open sidebar
        chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' });
        window.close();
    } else {
        alert('Please open ChatGPT or Claude to use MemoryForge');
    }
}

function exportMemories() {
    chrome.runtime.sendMessage({ action: 'exportMemories' }, (response) => {
        if (response && response.data) {
            const blob = new Blob([response.data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `memoryforge-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    });
}

function openSettings() {
    chrome.tabs.create({ url: 'chrome://extensions/?id=' + chrome.runtime.id });
    window.close();
}

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}
