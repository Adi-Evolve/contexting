// Semantic Fingerprinting V2
// Advanced perceptual hashing for semantic duplicate detection

class SemanticFingerprintV2 {
    constructor(config = {}) {
        this.config = {
            hashSize: config.hashSize || 64, // bits
            bloomFilterSize: config.bloomFilterSize || 10000,
            bloomFilterHashes: config.bloomFilterHashes || 3,
            duplicateThreshold: config.duplicateThreshold || 0.95,
            similarityThreshold: config.similarityThreshold || 0.85
        };
        
        this.bloomFilter = this.createBloomFilter();
        this.fingerprintCache = new Map();
    }
    
    /**
     * Generate semantic fingerprint for text
     * @param {string} text - Input text
     * @returns {string} 64-bit hex fingerprint
     */
    generateFingerprint(text) {
        // Check cache first
        if (this.fingerprintCache.has(text)) {
            return this.fingerprintCache.get(text);
        }
        
        // Extract semantic triplets (subject-verb-object)
        const triplets = this.extractTriplets(text);
        
        // Generate feature vector
        const features = this.extractFeatures(text, triplets);
        
        // Create perceptual hash
        const hash = this.createPerceptualHash(features);
        
        // Convert to hex
        const fingerprint = this.hashToHex(hash);
        
        // Cache result
        this.fingerprintCache.set(text, fingerprint);
        
        // Add to bloom filter
        this.addToBloom(fingerprint);
        
        return fingerprint;
    }
    
    /**
     * Extract semantic triplets (subject-verb-object)
     */
    extractTriplets(text) {
        const triplets = [];
        
        // Simple pattern-based extraction
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        for (const sentence of sentences) {
            const words = sentence.toLowerCase()
                .replace(/[^\w\s]/g, '')
                .split(/\s+/)
                .filter(w => w.length > 0);
            
            // Find verbs (simple heuristic: words ending in common verb patterns)
            const verbPatterns = /ing$|ed$|en$|s$|ize$|ify$/;
            const verbs = words.filter(w => verbPatterns.test(w));
            
            if (verbs.length === 0) continue;
            
            // Extract context around verb
            for (const verb of verbs) {
                const verbIndex = words.indexOf(verb);
                const subject = words[verbIndex - 1] || '';
                const object = words[verbIndex + 1] || '';
                
                if (subject && object) {
                    triplets.push({
                        subject: subject,
                        verb: verb,
                        object: object
                    });
                }
            }
        }
        
        return triplets;
    }
    
    /**
     * Extract features from text
     */
    extractFeatures(text, triplets) {
        const features = {
            // Lexical features
            wordCount: text.split(/\s+/).length,
            charCount: text.length,
            avgWordLength: text.split(/\s+/).reduce((sum, w) => sum + w.length, 0) / text.split(/\s+/).length,
            
            // Syntactic features
            questionMarks: (text.match(/\?/g) || []).length,
            exclamations: (text.match(/!/g) || []).length,
            codeBlocks: (text.match(/```/g) || []).length / 2,
            
            // Semantic features
            tripletCount: triplets.length,
            uniqueVerbs: new Set(triplets.map(t => t.verb)).size,
            uniqueNouns: new Set([...triplets.map(t => t.subject), ...triplets.map(t => t.object)]).size,
            
            // Entity features
            numbers: (text.match(/\d+/g) || []).length,
            urls: (text.match(/https?:\/\/\S+/g) || []).length,
            emails: (text.match(/[\w.-]+@[\w.-]+/g) || []).length,
            
            // Keyword features
            technicalTerms: this.countTechnicalTerms(text),
            programmingKeywords: this.countProgrammingKeywords(text)
        };
        
        // Normalize features to 0-1 range
        const normalized = {
            wordCount: Math.min(features.wordCount / 100, 1),
            charCount: Math.min(features.charCount / 1000, 1),
            avgWordLength: Math.min(features.avgWordLength / 10, 1),
            questionMarks: Math.min(features.questionMarks / 5, 1),
            exclamations: Math.min(features.exclamations / 5, 1),
            codeBlocks: Math.min(features.codeBlocks / 3, 1),
            tripletCount: Math.min(features.tripletCount / 10, 1),
            uniqueVerbs: Math.min(features.uniqueVerbs / 10, 1),
            uniqueNouns: Math.min(features.uniqueNouns / 20, 1),
            numbers: Math.min(features.numbers / 10, 1),
            urls: Math.min(features.urls / 3, 1),
            emails: Math.min(features.emails / 3, 1),
            technicalTerms: Math.min(features.technicalTerms / 10, 1),
            programmingKeywords: Math.min(features.programmingKeywords / 5, 1)
        };
        
        return normalized;
    }
    
    /**
     * Count technical terms
     */
    countTechnicalTerms(text) {
        const terms = [
            'api', 'database', 'server', 'client', 'framework', 'library',
            'algorithm', 'function', 'class', 'method', 'variable', 'interface',
            'component', 'module', 'package', 'dependency', 'configuration',
            'authentication', 'authorization', 'encryption', 'security'
        ];
        
        const lowerText = text.toLowerCase();
        return terms.filter(term => lowerText.includes(term)).length;
    }
    
    /**
     * Count programming keywords
     */
    countProgrammingKeywords(text) {
        const keywords = [
            'if', 'else', 'for', 'while', 'function', 'class', 'return',
            'const', 'let', 'var', 'async', 'await', 'try', 'catch',
            'import', 'export', 'default', 'new', 'this', 'super'
        ];
        
        const lowerText = text.toLowerCase();
        return keywords.filter(kw => new RegExp(`\\b${kw}\\b`).test(lowerText)).length;
    }
    
    /**
     * Create perceptual hash from features
     */
    createPerceptualHash(features) {
        const hash = new Array(this.config.hashSize).fill(0);
        
        // Convert features to bit array
        const featureValues = Object.values(features);
        const threshold = featureValues.reduce((a, b) => a + b, 0) / featureValues.length;
        
        // Hash each feature
        featureValues.forEach((value, index) => {
            const bitIndex = (index * 5) % this.config.hashSize; // Spread across hash
            
            if (value > threshold) {
                hash[bitIndex] = 1;
            }
            
            // Add entropy
            if (value > 0.5) {
                const secondBit = (bitIndex + 1) % this.config.hashSize;
                hash[secondBit] = 1;
            }
        });
        
        return hash;
    }
    
    /**
     * Convert bit array to hex string
     */
    hashToHex(hash) {
        let hex = '';
        
        for (let i = 0; i < hash.length; i += 4) {
            const nibble = hash.slice(i, i + 4);
            const value = parseInt(nibble.join(''), 2);
            hex += value.toString(16);
        }
        
        return hex;
    }
    
    /**
     * Convert hex string to bit array
     */
    hexToHash(hex) {
        const hash = [];
        
        for (const char of hex) {
            const value = parseInt(char, 16);
            const bits = value.toString(2).padStart(4, '0');
            hash.push(...bits.split('').map(Number));
        }
        
        return hash;
    }
    
    /**
     * Check if fingerprint is duplicate
     * @param {string} fingerprint - Hex fingerprint
     * @param {number} threshold - Similarity threshold (0-1)
     * @returns {Object} {isDuplicate, confidence, matches}
     */
    checkDuplicate(fingerprint, threshold = null) {
        threshold = threshold || this.config.duplicateThreshold;
        
        // Quick check with bloom filter
        if (!this.bloomContains(fingerprint)) {
            return {
                isDuplicate: false,
                confidence: 0,
                matches: []
            };
        }
        
        // Detailed check against cache
        const matches = [];
        
        for (const [text, cachedFingerprint] of this.fingerprintCache.entries()) {
            if (cachedFingerprint === fingerprint) {
                matches.push({
                    text: text,
                    fingerprint: cachedFingerprint,
                    similarity: 1.0
                });
            } else {
                const similarity = this.calculateSimilarity(fingerprint, cachedFingerprint);
                
                if (similarity >= threshold) {
                    matches.push({
                        text: text,
                        fingerprint: cachedFingerprint,
                        similarity: similarity
                    });
                }
            }
        }
        
        const isDuplicate = matches.length > 0;
        const confidence = matches.length > 0 
            ? Math.max(...matches.map(m => m.similarity))
            : 0;
        
        return {
            isDuplicate: isDuplicate,
            confidence: confidence,
            matches: matches.sort((a, b) => b.similarity - a.similarity)
        };
    }
    
    /**
     * Calculate similarity between two fingerprints
     * @param {string} fp1 - First fingerprint (hex)
     * @param {string} fp2 - Second fingerprint (hex)
     * @returns {number} Similarity score (0-1)
     */
    calculateSimilarity(fp1, fp2) {
        const hash1 = this.hexToHash(fp1);
        const hash2 = this.hexToHash(fp2);
        
        // Hamming distance
        let matches = 0;
        for (let i = 0; i < hash1.length; i++) {
            if (hash1[i] === hash2[i]) {
                matches++;
            }
        }
        
        return matches / hash1.length;
    }
    
    /**
     * Create bloom filter
     */
    createBloomFilter() {
        return {
            bits: new Array(this.config.bloomFilterSize).fill(0),
            hashCount: this.config.bloomFilterHashes
        };
    }
    
    /**
     * Add fingerprint to bloom filter
     */
    addToBloom(fingerprint) {
        for (let i = 0; i < this.bloomFilter.hashCount; i++) {
            const hash = this.hashString(fingerprint + i);
            const index = hash % this.config.bloomFilterSize;
            this.bloomFilter.bits[index] = 1;
        }
    }
    
    /**
     * Check if fingerprint might be in bloom filter
     */
    bloomContains(fingerprint) {
        for (let i = 0; i < this.bloomFilter.hashCount; i++) {
            const hash = this.hashString(fingerprint + i);
            const index = hash % this.config.bloomFilterSize;
            
            if (this.bloomFilter.bits[index] === 0) {
                return false; // Definitely not in set
            }
        }
        
        return true; // Might be in set
    }
    
    /**
     * Simple string hash function
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
    
    /**
     * Generate visual fingerprint for images
     * @param {ImageData} imageData - Image data
     * @returns {string} Visual fingerprint
     */
    generateVisualFingerprint(imageData) {
        // Simplified perceptual image hash (pHash)
        const size = 8; // 8x8 grid
        const pixels = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        
        // Resize to 8x8
        const grid = [];
        const cellWidth = Math.floor(width / size);
        const cellHeight = Math.floor(height / size);
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                let sum = 0;
                let count = 0;
                
                for (let cy = y * cellHeight; cy < (y + 1) * cellHeight; cy++) {
                    for (let cx = x * cellWidth; cx < (x + 1) * cellWidth; cx++) {
                        const index = (cy * width + cx) * 4;
                        const gray = (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3;
                        sum += gray;
                        count++;
                    }
                }
                
                grid.push(sum / count);
            }
        }
        
        // Calculate average
        const avg = grid.reduce((a, b) => a + b, 0) / grid.length;
        
        // Create hash
        const hash = grid.map(v => v > avg ? 1 : 0).join('');
        
        // Convert to hex
        let hex = '';
        for (let i = 0; i < hash.length; i += 4) {
            const nibble = hash.substr(i, 4);
            hex += parseInt(nibble, 2).toString(16);
        }
        
        return 'img_' + hex;
    }
    
    /**
     * Get statistics
     */
    getStats() {
        const bloomDensity = this.bloomFilter.bits.filter(b => b === 1).length / this.bloomFilter.bits.length;
        
        return {
            cachedFingerprints: this.fingerprintCache.size,
            bloomFilterSize: this.config.bloomFilterSize,
            bloomFilterDensity: bloomDensity,
            hashSize: this.config.hashSize
        };
    }
    
    /**
     * Clear cache
     */
    clearCache() {
        this.fingerprintCache.clear();
        this.bloomFilter = this.createBloomFilter();
    }
    
    /**
     * Serialize
     */
    serialize() {
        return {
            version: '2.0',
            config: this.config,
            bloomFilter: this.bloomFilter,
            cache: Array.from(this.fingerprintCache.entries()),
            timestamp: Date.now()
        };
    }
    
    /**
     * Deserialize
     */
    static deserialize(data) {
        const engine = new SemanticFingerprintV2(data.config);
        
        engine.bloomFilter = data.bloomFilter;
        engine.fingerprintCache = new Map(data.cache);
        
        return engine;
    }
}

// Export for use in extension
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SemanticFingerprintV2;
}
