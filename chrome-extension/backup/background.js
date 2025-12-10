// MemoryForge Background Service Worker
// Handles storage and semantic search

console.log('🧠 MemoryForge Background: Starting...');

// Simple in-memory storage (will use IndexedDB in production)
let memories = [];
let stats = {
    count: 0,
    size: 0
};

// Initialize
chrome.runtime.onInstalled.addListener(async () => {
    console.log('🧠 MemoryForge: Extension installed');
    
    // Load existing memories from storage
    const data = await chrome.storage.local.get(['memories', 'stats']);
    if (data.memories) {
        memories = data.memories;
        stats = data.stats || { count: memories.length, size: 0 };
    }
    
    console.log(`📚 Loaded ${memories.length} memories`);
});

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    handleMessage(request).then(sendResponse).catch(err => {
        console.error('Error:', err);
        sendResponse({ error: err.message });
    });
    return true; // Keep channel open for async response
});

async function handleMessage(request) {
    switch (request.action) {
        case 'storeMessage':
            return await storeMessage(request.message);
        
        case 'searchMemories':
            return await searchMemories(request.query, request.limit);
        
        case 'getRecentMemories':
            return await getRecentMemories(request.limit);
        
        case 'getStats':
            return stats;
        
        case 'exportMemories':
            return await exportMemories();
        
        default:
            throw new Error('Unknown action: ' + request.action);
    }
}

// Store new message
async function storeMessage(message) {
    try {
        // Add unique ID
        message.id = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        // Generate simple semantic fingerprint (basic version)
        message.fingerprint = generateFingerprint(message.content);
        
        // Add to memory
        memories.push(message);
        
        // Update stats
        stats.count = memories.length;
        stats.size = JSON.stringify(memories).length;
        
        // Save to storage (keep last 1000 messages for free tier)
        if (memories.length > 1000) {
            memories = memories.slice(-1000);
        }
        
        await chrome.storage.local.set({ memories, stats });
        
        console.log(`✅ Stored message ${message.id}`);
        return { success: true, id: message.id };
    } catch (error) {
        console.error('Error storing message:', error);
        return { success: false, error: error.message };
    }
}

// Search memories semantically
async function searchMemories(query, limit = 20) {
    try {
        if (!query || query.trim().length === 0) {
            return { results: [] };
        }
        
        const queryFingerprint = generateFingerprint(query);
        
        // Calculate similarity scores
        const results = memories.map(memory => ({
            ...memory,
            similarity: cosineSimilarity(queryFingerprint, memory.fingerprint)
        }))
        .filter(m => m.similarity > 0.3) // Threshold
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
        
        console.log(`🔍 Found ${results.length} results for: "${query}"`);
        return { results };
    } catch (error) {
        console.error('Error searching:', error);
        return { results: [], error: error.message };
    }
}

// Get recent memories
async function getRecentMemories(limit = 20) {
    const recent = memories
        .slice(-limit)
        .reverse(); // Most recent first
    
    return { results: recent };
}

// Export all memories
async function exportMemories() {
    const exportData = {
        version: '1.0',
        exported: new Date().toISOString(),
        count: memories.length,
        memories: memories
    };
    
    return {
        success: true,
        data: JSON.stringify(exportData, null, 2)
    };
}

// Generate semantic fingerprint (simplified TF-IDF)
function generateFingerprint(text) {
    const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2);
    
    // Count word frequencies
    const freq = {};
    words.forEach(word => {
        freq[word] = (freq[word] || 0) + 1;
    });
    
    // Get top 20 words
    const topWords = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([word]) => word);
    
    // Create simple vector (presence of top words)
    const vector = new Array(50).fill(0);
    topWords.forEach((word, i) => {
        const hash = simpleHash(word) % 50;
        vector[hash] += freq[word];
    });
    
    // Normalize
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    return vector.map(v => magnitude > 0 ? v / magnitude : 0);
}

// Simple hash function
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

// Cosine similarity
function cosineSimilarity(vec1, vec2) {
    if (vec1.length !== vec2.length) return 0;
    
    let dotProduct = 0;
    for (let i = 0; i < vec1.length; i++) {
        dotProduct += vec1[i] * vec2[i];
    }
    
    return Math.max(0, Math.min(1, dotProduct));
}

console.log('✅ MemoryForge Background: Ready');
