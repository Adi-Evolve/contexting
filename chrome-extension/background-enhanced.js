// MemoryForge Background Service Worker - Enhanced with Server Connection
// Handles storage, semantic search, knowledge graph, compression, and analytics

console.log('🧠 MemoryForge Background: Starting (Server-Enhanced Mode)...');

// Configuration
const SERVER_URL = 'http://localhost:3000'; // Change to your deployed server URL
const ENABLE_SERVER = true; // Set to false for local-only mode
const FREE_TIER_LIMIT = 1000;

// In-memory storage (fallback when server unavailable)
let memories = [];
let stats = {
    count: 0,
    size: 0,
    compressed: 0,
    serverConnected: false
};

// Server connection status
let serverAvailable = false;

// Initialize
chrome.runtime.onInstalled.addListener(async () => {
    console.log('🧠 MemoryForge: Extension installed');
    
    // Load existing memories from local storage
    const data = await chrome.storage.local.get(['memories', 'stats']);
    if (data.memories) {
        memories = data.memories;
        stats = data.stats || { count: memories.length, size: 0, compressed: 0 };
    }
    
    // Check server connection
    if (ENABLE_SERVER) {
        serverAvailable = await checkServerConnection();
        stats.serverConnected = serverAvailable;
    }
    
    console.log(`📚 Loaded ${memories.length} memories`);
    console.log(`🌐 Server: ${serverAvailable ? 'Connected ✅' : 'Offline (Local Mode) ⚠️'}`);
});

// Check server connection
async function checkServerConnection() {
    try {
        const response = await fetch(`${SERVER_URL}/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Server connected:', SERVER_URL, data);
            return true;
        }
    } catch (error) {
        console.log('❌ Server unavailable, using local storage only');
    }
    
    return false;
}

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
            return await getStats();
        
        case 'exportMemories':
            return await exportMemories();
        
        case 'getKnowledgeGraph':
            return await getKnowledgeGraph(request.options);
        
        case 'getCompressionStats':
            return await getCompressionStats();
        
        case 'getAnalytics':
            return await getAnalytics(request.timeRange);
        
        case 'compressMemories':
            return await compressMemories(request.memoryIds);
        
        default:
            return { error: 'Unknown action' };
    }
}

// ==================== STORE MESSAGE ====================

async function storeMessage(message) {
    try {
        const { role, content, context } = message;

        // Try server first if available
        if (ENABLE_SERVER && serverAvailable) {
            try {
                const response = await fetch(`${SERVER_URL}/api/memories`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        role,
                        content,
                        context: context || {},
                        timestamp: new Date().toISOString()
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ Memory stored on server:', result.memory.id);
                    
                    // Also store locally for offline access
                    await storeLocalMemory(message);
                    
                    return {
                        success: true,
                        memoryId: result.memory.id,
                        mode: 'server',
                        metadata: result.memory.metadata
                    };
                }
            } catch (serverError) {
                console.warn('Server storage failed, using local:', serverError.message);
                serverAvailable = false;
                stats.serverConnected = false;
            }
        }

        // Fallback to local storage
        return await storeLocalMemory(message);
    } catch (error) {
        console.error('Store message error:', error);
        return { success: false, error: error.message };
    }
}

async function storeLocalMemory(message) {
    const { role, content, context } = message;

    // Generate semantic fingerprint
    const fingerprint = generateFingerprint(content);

    // Create memory object
    const memory = {
        id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role,
        content,
        context: context || {},
        fingerprint,
        timestamp: new Date().toISOString(),
        wordCount: content.split(/\s+/).length
    };

    // Add to storage
    memories.push(memory);

    // Enforce free tier limit
    if (memories.length > FREE_TIER_LIMIT) {
        memories = memories.slice(-FREE_TIER_LIMIT);
    }

    // Update stats
    stats.count = memories.length;
    stats.size = new Blob([JSON.stringify(memories)]).size;

    // Persist
    await chrome.storage.local.set({ memories, stats });

    return {
        success: true,
        memoryId: memory.id,
        mode: 'local'
    };
}

// ==================== SEARCH MEMORIES ====================

async function searchMemories(query, limit = 20) {
    try {
        // Try server search first
        if (ENABLE_SERVER && serverAvailable) {
            try {
                const response = await fetch(`${SERVER_URL}/api/search`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        query,
                        limit: limit || 20,
                        minScore: 0.3
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ Server search:', result.results.length, 'results');
                    return {
                        results: result.results,
                        mode: 'server',
                        stats: result.stats
                    };
                }
            } catch (serverError) {
                console.warn('Server search failed, using local');
            }
        }

        // Fallback to local search
        return await searchLocalMemories(query, limit);
    } catch (error) {
        console.error('Search error:', error);
        return { results: [], error: error.message };
    }
}

async function searchLocalMemories(query, limit = 20) {
    const queryFingerprint = generateFingerprint(query);

    const results = memories
        .map(memory => ({
            ...memory,
            score: cosineSimilarity(queryFingerprint, memory.fingerprint)
        }))
        .filter(r => r.score > 0.3)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    return {
        results,
        mode: 'local'
    };
}

// ==================== KNOWLEDGE GRAPH ====================

async function getKnowledgeGraph(options = {}) {
    if (!ENABLE_SERVER || !serverAvailable) {
        return {
            error: 'Knowledge graph requires server connection',
            available: false
        };
    }

    try {
        const params = new URLSearchParams({
            nodeLimit: options.nodeLimit || 100,
            includeEdges: options.includeEdges !== false,
            minScore: options.minScore || 0.3
        });

        const response = await fetch(`${SERVER_URL}/api/knowledge-graph?${params}`);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Knowledge graph loaded:', result.graph.stats);
            return result.graph;
        }
    } catch (error) {
        console.error('Knowledge graph error:', error);
        return { error: error.message, available: false };
    }
}

// ==================== COMPRESSION STATS ====================

async function getCompressionStats() {
    if (!ENABLE_SERVER || !serverAvailable) {
        // Return local compression info
        const compressed = memories.filter(m => m.compressed);
        return {
            totalMemories: memories.length,
            compressedMemories: compressed.length,
            compressionRatio: compressed.length > 0 ? 0.7 : 1, // Estimated
            spaceSaved: 0,
            mode: 'local-estimate'
        };
    }

    try {
        const response = await fetch(`${SERVER_URL}/api/compression/stats`);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Compression stats loaded');
            return result.stats;
        }
    } catch (error) {
        console.error('Compression stats error:', error);
        return { error: error.message };
    }
}

async function compressMemories(memoryIds) {
    if (!ENABLE_SERVER || !serverAvailable) {
        return {
            error: 'Compression requires server connection',
            available: false
        };
    }

    try {
        const response = await fetch(`${SERVER_URL}/api/compression/compress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                memoryIds,
                level: 'auto',
                method: 'differential'
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Compressed', result.results.filter(r => r.success).length, 'memories');
            return result;
        }
    } catch (error) {
        console.error('Compression error:', error);
        return { error: error.message };
    }
}

// ==================== ANALYTICS ====================

async function getAnalytics(timeRange = '30d') {
    if (!ENABLE_SERVER || !serverAvailable) {
        // Return basic local analytics
        return {
            overview: {
                totalMemories: memories.length,
                totalWords: memories.reduce((sum, m) => sum + (m.wordCount || 0), 0)
            },
            mode: 'local-basic'
        };
    }

    try {
        const response = await fetch(`${SERVER_URL}/api/analytics?timeRange=${timeRange}`);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Analytics loaded');
            return result.analytics;
        }
    } catch (error) {
        console.error('Analytics error:', error);
        return { error: error.message };
    }
}

// ==================== OTHER FUNCTIONS ====================

async function getRecentMemories(limit = 10) {
    return memories.slice(-limit).reverse();
}

async function getStats() {
    // Refresh server status
    if (ENABLE_SERVER && !serverAvailable) {
        serverAvailable = await checkServerConnection();
        stats.serverConnected = serverAvailable;
    }

    return {
        ...stats,
        serverUrl: ENABLE_SERVER ? SERVER_URL : 'disabled',
        mode: ENABLE_SERVER ? (serverAvailable ? 'server' : 'local-fallback') : 'local-only'
    };
}

async function exportMemories() {
    return {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        count: memories.length,
        memories: memories
    };
}

// ==================== SEMANTIC FINGERPRINTING ====================

function generateFingerprint(text) {
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    
    // Calculate term frequency
    const termFreq = new Map();
    words.forEach(word => {
        termFreq.set(word, (termFreq.get(word) || 0) + 1);
    });

    // Get top 20 words
    const topWords = Array.from(termFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([word]) => word);

    // Create 50-dimensional vector
    const vector = new Float32Array(50);
    topWords.forEach((word, index) => {
        const hash = simpleHash(word) % 50;
        vector[hash] += termFreq.get(word) / words.length;
    });

    // Normalize
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
        for (let i = 0; i < vector.length; i++) {
            vector[i] /= magnitude;
        }
    }

    return Array.from(vector);
}

function cosineSimilarity(vec1, vec2) {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) return 0;
    
    let dotProduct = 0;
    for (let i = 0; i < vec1.length; i++) {
        dotProduct += vec1[i] * vec2[i];
    }
    
    return Math.max(0, Math.min(1, dotProduct));
}

function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash;
    }
    return Math.abs(hash);
}

console.log('✅ MemoryForge Background: Ready');
