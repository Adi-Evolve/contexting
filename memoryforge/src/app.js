/**
 * MemoryForge - Main Application Script
 * Connects UI to core MemoryForge engine
 */

import MemoryForge from './core/MemoryForge.js';

// Global state
let memoryForge = null;
let currentView = 'hero';

// DOM Elements
const elements = {
  initBtn: null,
  chatInput: null,
  sendBtn: null,
  chatMessages: null,
  messageCount: null,
  queryTime: null,
  statsGrid: null,
  exportBtn: null,
  importBtn: null,
  importFile: null,
  clearBtn: null,
  themeToggle: null,
  loadingOverlay: null,
  toastContainer: null
};

/**
 * Initialize application
 */
document.addEventListener('DOMContentLoaded', () => {
  // Get DOM elements
  elements.initBtn = document.getElementById('initBtn');
  elements.chatInput = document.getElementById('chatInput');
  elements.sendBtn = document.getElementById('sendBtn');
  elements.chatMessages = document.getElementById('chatMessages');
  elements.messageCount = document.getElementById('messageCount');
  elements.queryTime = document.getElementById('queryTime');
  elements.exportBtn = document.getElementById('exportBtn');
  elements.importBtn = document.getElementById('importBtn');
  elements.importFile = document.getElementById('importFile');
  elements.clearBtn = document.getElementById('clearBtn');
  elements.themeToggle = document.querySelector('.theme-toggle');
  elements.loadingOverlay = document.getElementById('loadingOverlay');
  elements.toastContainer = document.getElementById('toastContainer');
  
  // Event listeners
  elements.initBtn.addEventListener('click', initializeMemoryForge);
  elements.sendBtn.addEventListener('click', sendMessage);
  elements.chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
  elements.exportBtn.addEventListener('click', exportMemory);
  elements.importBtn.addEventListener('click', () => elements.importFile.click());
  elements.importFile.addEventListener('change', importMemory);
  elements.clearBtn.addEventListener('click', clearAllData);
  elements.themeToggle.addEventListener('click', toggleTheme);
  
  // Navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });
  
  // Check for saved theme
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  console.log('✅ App initialized');
});

/**
 * Initialize MemoryForge
 */
async function initializeMemoryForge() {
  try {
    showLoading(true);
    elements.initBtn.disabled = true;
    
    // Create MemoryForge instance
    memoryForge = new MemoryForge({
      dbName: 'MemoryForgeDB',
      autoCompress: true,
      compressionInterval: 60000
    });
    
    // Initialize
    await memoryForge.init();
    
    // Enable chat
    elements.chatInput.disabled = false;
    elements.sendBtn.disabled = false;
    elements.chatInput.focus();
    
    // Switch to chat view
    switchView('chat');
    
    // Setup event listeners
    memoryForge.on('messageAdded', (data) => {
      updateMessageCount();
      showToast('Message added successfully', 'success');
    });
    
    memoryForge.on('error', (error) => {
      showToast('Error: ' + error.message, 'error');
    });
    
    showToast('MemoryForge initialized successfully! 🚀', 'success');
    
  } catch (error) {
    console.error('Initialization failed:', error);
    showToast('Failed to initialize: ' + error.message, 'error');
    elements.initBtn.disabled = false;
  } finally {
    showLoading(false);
  }
}

/**
 * Send message
 */
async function sendMessage() {
  const text = elements.chatInput.value.trim();
  if (!text || !memoryForge) return;
  
  const startTime = performance.now();
  
  try {
    // Disable input
    elements.chatInput.disabled = true;
    elements.sendBtn.disabled = true;
    
    // Add user message to UI
    addMessageToUI({
      text,
      sender: 'user',
      timestamp: Date.now()
    });
    
    // Clear input
    elements.chatInput.value = '';
    
    // Add to MemoryForge
    const result = await memoryForge.addMessage(text, {
      source: 'user'
    });
    
    // Show analysis
    const duration = performance.now() - startTime;
    elements.queryTime.textContent = `${duration.toFixed(2)}ms`;
    
    // Add system response showing analysis
    const analysis = `
📊 **Analysis:**
- **Sentiment:** ${result.nlpAnalysis.sentiment.label} (${(result.nlpAnalysis.sentiment.confidence * 100).toFixed(0)}%)
- **Intent:** ${result.nlpAnalysis.intent.intent}
- **Entities:** ${Object.keys(result.nlpAnalysis.entities).length} found
- **Keywords:** ${result.nlpAnalysis.keywords.slice(0, 3).map(k => k.keyword).join(', ')}

🔗 **Memory Graph:** Node created with ${result.causalAnalysis.causes.length} causes, ${result.causalAnalysis.consequences.length} consequences
    `;
    
    addMessageToUI({
      text: analysis,
      sender: 'system',
      timestamp: Date.now()
    });
    
    // Update count
    updateMessageCount();
    
  } catch (error) {
    console.error('Failed to send message:', error);
    showToast('Failed to send message', 'error');
  } finally {
    // Re-enable input
    elements.chatInput.disabled = false;
    elements.sendBtn.disabled = false;
    elements.chatInput.focus();
  }
}

/**
 * Add message to UI
 */
function addMessageToUI(message) {
  const messageEl = document.createElement('div');
  messageEl.className = `message message-${message.sender}`;
  
  const time = new Date(message.timestamp).toLocaleTimeString();
  
  messageEl.innerHTML = `
    <div class="message-content">
      <div class="message-text">${message.text}</div>
      <div class="message-time">${time}</div>
    </div>
  `;
  
  elements.chatMessages.appendChild(messageEl);
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

/**
 * Update message count
 */
async function updateMessageCount() {
  if (!memoryForge) return;
  
  const stats = memoryForge.getStats();
  elements.messageCount.textContent = `${stats.memory.totalMessages} messages`;
}

/**
 * Switch view
 */
function switchView(viewName) {
  currentView = viewName;
  
  // Hide all views
  document.querySelectorAll('.view').forEach(view => {
    view.style.display = 'none';
  });
  
  document.getElementById('hero').style.display = 'none';
  
  // Show selected view
  const viewId = viewName + 'View';
  const viewEl = document.getElementById(viewId);
  if (viewEl) {
    viewEl.style.display = 'block';
  }
  
  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });
  
  // Load view data
  if (viewName === 'stats') {
    updateStats();
  } else if (viewName === 'graph') {
    updateGraph();
  }
}

/**
 * Update stats view
 */
async function updateStats() {
  if (!memoryForge) return;
  
  const stats = memoryForge.getStats();
  
  // Memory stats
  document.getElementById('memoryStats').innerHTML = `
    <div class="stat-item">
      <span>Total Messages:</span>
      <strong>${stats.memory.totalMessages}</strong>
    </div>
    <div class="stat-item">
      <span>Total Queries:</span>
      <strong>${stats.memory.totalQueries}</strong>
    </div>
    <div class="stat-item">
      <span>Avg Query Time:</span>
      <strong>${stats.memory.averageQueryTime}</strong>
    </div>
    <div class="stat-item">
      <span>Uptime:</span>
      <strong>${stats.memory.uptime}</strong>
    </div>
  `;
  
  // Storage stats
  document.getElementById('storageStats').innerHTML = `
    <div class="stat-item">
      <span>Hot Cache:</span>
      <strong>${stats.storage.hotCacheSize} msgs</strong>
    </div>
    <div class="stat-item">
      <span>Warm Storage:</span>
      <strong>${stats.storage.warmStorageSize} msgs</strong>
    </div>
    <div class="stat-item">
      <span>Cold Archive:</span>
      <strong>${stats.storage.coldArchiveSize} sessions</strong>
    </div>
    <div class="stat-item">
      <span>Hit Rate:</span>
      <strong>${stats.storage.hotCacheHitRate}%</strong>
    </div>
  `;
  
  // Graph stats
  document.getElementById('graphStats').innerHTML = `
    <div class="stat-item">
      <span>Total Nodes:</span>
      <strong>${stats.graph.totalNodes}</strong>
    </div>
    <div class="stat-item">
      <span>Total Edges:</span>
      <strong>${stats.graph.totalEdges}</strong>
    </div>
    <div class="stat-item">
      <span>Avg Connections:</span>
      <strong>${stats.graph.averageConnections}</strong>
    </div>
    <div class="stat-item">
      <span>Relationship Types:</span>
      <strong>${stats.graph.relationshipTypes}</strong>
    </div>
  `;
  
  // Compression stats
  document.getElementById('compressionStats').innerHTML = `
    <div class="stat-item">
      <span>Original Size:</span>
      <strong>${formatBytes(stats.compressor.originalSize)}</strong>
    </div>
    <div class="stat-item">
      <span>Compressed Size:</span>
      <strong>${formatBytes(stats.compressor.compressedSize)}</strong>
    </div>
    <div class="stat-item">
      <span>Compression Ratio:</span>
      <strong>${stats.compressor.totalRatio}</strong>
    </div>
    <div class="stat-item">
      <span>Compress Time:</span>
      <strong>${stats.compressor.lastCompressTime}</strong>
    </div>
  `;
}

/**
 * Update graph view (placeholder)
 */
function updateGraph() {
  if (!memoryForge) return;
  
  const stats = memoryForge.getStats();
  const canvas = document.getElementById('graphCanvas');
  
  canvas.innerHTML = `
    <div class="graph-info">
      <h3>Memory Graph Overview</h3>
      <p><strong>${stats.graph.totalNodes}</strong> concepts connected by <strong>${stats.graph.totalEdges}</strong> relationships</p>
      <p>Average <strong>${stats.graph.averageConnections}</strong> connections per concept</p>
      <p class="note">Full graph visualization coming in next update!</p>
    </div>
  `;
}

/**
 * Export memory
 */
async function exportMemory() {
  if (!memoryForge) {
    showToast('Initialize MemoryForge first', 'error');
    return;
  }
  
  try {
    showLoading(true);
    
    const data = await memoryForge.export('aime');
    
    // Create blob and download
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memoryforge-export-${Date.now()}.aime`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Memory exported successfully', 'success');
    
  } catch (error) {
    console.error('Export failed:', error);
    showToast('Export failed', 'error');
  } finally {
    showLoading(false);
  }
}

/**
 * Import memory
 */
async function importMemory(event) {
  if (!memoryForge) {
    showToast('Initialize MemoryForge first', 'error');
    return;
  }
  
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    showLoading(true);
    
    const text = await file.text();
    const data = JSON.parse(text);
    
    await memoryForge.import(data);
    
    showToast(`Imported ${data.messages?.length || 0} messages`, 'success');
    updateMessageCount();
    
  } catch (error) {
    console.error('Import failed:', error);
    showToast('Import failed', 'error');
  } finally {
    showLoading(false);
    elements.importFile.value = '';
  }
}

/**
 * Clear all data
 */
async function clearAllData() {
  if (!memoryForge) return;
  
  if (!confirm('⚠️ This will permanently delete ALL memories. Are you sure?')) {
    return;
  }
  
  try {
    showLoading(true);
    
    await memoryForge.clear();
    
    // Clear chat UI
    elements.chatMessages.innerHTML = `
      <div class="welcome-message">
        <h3>All data cleared</h3>
        <p>Start fresh by typing a new message!</p>
      </div>
    `;
    
    updateMessageCount();
    showToast('All data cleared', 'success');
    
  } catch (error) {
    console.error('Clear failed:', error);
    showToast('Failed to clear data', 'error');
  } finally {
    showLoading(false);
  }
}

/**
 * Toggle theme
 */
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  
  showToast(`Switched to ${next} mode`, 'success');
}

/**
 * Show loading overlay
 */
function showLoading(show) {
  elements.loadingOverlay.style.display = show ? 'flex' : 'none';
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  elements.toastContainer.appendChild(toast);
  
  // Animate in
  setTimeout(() => toast.classList.add('show'), 100);
  
  // Remove after 3s
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Format bytes
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
