// Multi-Modal Memory Handler
// Processes images, diagrams, code screenshots with OCR and visual fingerprinting

class MultiModalHandler {
    constructor(config = {}) {
        this.config = {
            maxImageSize: config.maxImageSize || 5 * 1024 * 1024, // 5MB
            thumbnailSize: config.thumbnailSize || 256,
            ocrEnabled: config.ocrEnabled !== false,
            visualFingerprintEnabled: config.visualFingerprintEnabled !== false,
            compressionQuality: config.compressionQuality || 0.8
        };
        
        this.imageCache = new Map();
        this.visualFingerprints = new Map();
        
        // Initialize Tesseract if OCR enabled
        if (this.config.ocrEnabled && typeof Tesseract !== 'undefined') {
            this.ocrWorker = null; // Will be initialized on first use
        }
    }
    
    /**
     * Process image from URL or data URI
     * @param {string} imageUrl - Image URL or data URI
     * @param {Object} metadata - Additional metadata
     * @returns {Promise<Object>} Processed image data
     */
    async processImage(imageUrl, metadata = {}) {
        try {
            // Check cache
            if (this.imageCache.has(imageUrl)) {
                return this.imageCache.get(imageUrl);
            }
            
            // Load image
            const image = await this.loadImage(imageUrl);
            
            // Generate thumbnail
            const thumbnail = await this.generateThumbnail(image);
            
            // Extract visual fingerprint
            const fingerprint = this.config.visualFingerprintEnabled
                ? await this.extractVisualFingerprint(image)
                : null;
            
            // Perform OCR if enabled
            const ocrText = this.config.ocrEnabled
                ? await this.performOCR(image)
                : null;
            
            // Detect content type
            const contentType = this.detectImageContentType(image, ocrText);
            
            // Extract colors
            const colors = await this.extractDominantColors(image);
            
            // Create processed data
            const processed = {
                id: this.generateId(),
                url: imageUrl,
                thumbnail: thumbnail,
                fingerprint: fingerprint,
                ocr: ocrText,
                contentType: contentType,
                colors: colors,
                dimensions: {
                    width: image.width,
                    height: image.height
                },
                metadata: metadata,
                timestamp: Date.now()
            };
            
            // Cache result
            this.imageCache.set(imageUrl, processed);
            
            if (fingerprint) {
                this.visualFingerprints.set(fingerprint, imageUrl);
            }
            
            return processed;
            
        } catch (error) {
            console.error('Error processing image:', error);
            return {
                id: this.generateId(),
                url: imageUrl,
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
    
    /**
     * Load image from URL
     */
    loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load image'));
            
            // Handle data URIs and regular URLs
            if (url.startsWith('data:')) {
                img.src = url;
            } else {
                img.crossOrigin = 'anonymous';
                img.src = url;
            }
        });
    }
    
    /**
     * Generate thumbnail
     */
    async generateThumbnail(image) {
        // Service worker context - skip canvas operations
        if (typeof document === 'undefined') {
            console.log('⚠️ Canvas not available in service worker - skipping thumbnail generation');
            return null;
        }
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate dimensions
        const maxSize = this.config.thumbnailSize;
        let width = image.width;
        let height = image.height;
        
        if (width > height) {
            if (width > maxSize) {
                height *= maxSize / width;
                width = maxSize;
            }
        } else {
            if (height > maxSize) {
                width *= maxSize / height;
                height = maxSize;
            }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw scaled image
        ctx.drawImage(image, 0, 0, width, height);
        
        // Convert to data URI
        return canvas.toDataURL('image/jpeg', this.config.compressionQuality);
    }
    
    /**
     * Extract visual fingerprint (perceptual hash)
     */
    async extractVisualFingerprint(image) {
        // Service worker context - skip canvas operations
        if (typeof document === 'undefined') {
            console.log('⚠️ Canvas not available in service worker - skipping fingerprint extraction');
            return null;
        }
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Resize to 8x8 for pHash
        const size = 8;
        canvas.width = size;
        canvas.height = size;
        
        ctx.drawImage(image, 0, 0, size, size);
        
        // Get pixel data
        const imageData = ctx.getImageData(0, 0, size, size);
        const pixels = imageData.data;
        
        // Convert to grayscale
        const gray = [];
        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            gray.push(0.299 * r + 0.587 * g + 0.114 * b);
        }
        
        // Calculate average
        const avg = gray.reduce((a, b) => a + b, 0) / gray.length;
        
        // Create hash
        let hash = '';
        for (const value of gray) {
            hash += value > avg ? '1' : '0';
        }
        
        // Convert to hex
        let hex = '';
        for (let i = 0; i < hash.length; i += 4) {
            const nibble = hash.substr(i, 4);
            hex += parseInt(nibble, 2).toString(16);
        }
        
        return 'img_' + hex;
    }
    
    /**
     * Perform OCR on image
     */
    async performOCR(image) {
        // Service worker context - OCR not available
        if (typeof document === 'undefined') {
            console.log('⚠️ OCR not available in service worker context');
            return null;
        }
        
        // Check if Tesseract is available
        if (typeof Tesseract === 'undefined') {
            console.warn('Tesseract not available, skipping OCR');
            return null;
        }
        
        try {
            // Initialize worker if needed
            if (!this.ocrWorker) {
                this.ocrWorker = await Tesseract.createWorker();
                await this.ocrWorker.loadLanguage('eng');
                await this.ocrWorker.initialize('eng');
            }
            
            // Convert image to canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);
            
            // Perform OCR
            const result = await this.ocrWorker.recognize(canvas);
            
            return {
                text: result.data.text,
                confidence: result.data.confidence,
                words: result.data.words.map(w => ({
                    text: w.text,
                    confidence: w.confidence
                }))
            };
            
        } catch (error) {
            console.error('OCR error:', error);
            return null;
        }
    }
    
    /**
     * Detect image content type
     */
    detectImageContentType(image, ocrData) {
        const types = {
            code: 0,
            diagram: 0,
            screenshot: 0,
            text: 0,
            photo: 0
        };
        
        // Check OCR text
        if (ocrData && ocrData.text) {
            const text = ocrData.text.toLowerCase();
            
            // Code indicators
            if (/\b(function|class|const|let|var|import|export|if|for|while)\b/.test(text)) {
                types.code += 0.5;
            }
            if (/[{}();[\]]/.test(text)) {
                types.code += 0.3;
            }
            
            // Text indicators
            if (ocrData.confidence > 80) {
                types.text += 0.3;
            }
            
            // Screenshot indicators
            if (/\b(file|edit|view|window|help)\b/.test(text)) {
                types.screenshot += 0.4;
            }
        }
        
        // Analyze image characteristics
        const aspectRatio = image.width / image.height;
        
        // Wide images often screenshots
        if (aspectRatio > 1.5) {
            types.screenshot += 0.2;
        }
        
        // Square images often diagrams or photos
        if (aspectRatio > 0.9 && aspectRatio < 1.1) {
            types.diagram += 0.1;
            types.photo += 0.1;
        }
        
        // Find max type
        const maxType = Object.entries(types)
            .reduce((max, [type, score]) => 
                score > max.score ? {type, score} : max,
                {type: 'unknown', score: 0}
            );
        
        return {
            type: maxType.type,
            confidence: maxType.score,
            scores: types
        };
    }
    
    /**
     * Extract dominant colors
     */
    async extractDominantColors(image, numColors = 5) {
        // Service worker context - skip canvas operations
        if (typeof document === 'undefined') {
            console.log('⚠️ Canvas not available in service worker - skipping color extraction');
            return [];
        }
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Resize for performance
        const size = 50;
        canvas.width = size;
        canvas.height = size;
        
        ctx.drawImage(image, 0, 0, size, size);
        
        const imageData = ctx.getImageData(0, 0, size, size);
        const pixels = imageData.data;
        
        // Sample colors
        const colorCounts = new Map();
        
        for (let i = 0; i < pixels.length; i += 4) {
            const r = Math.round(pixels[i] / 32) * 32; // Quantize
            const g = Math.round(pixels[i + 1] / 32) * 32;
            const b = Math.round(pixels[i + 2] / 32) * 32;
            
            const color = `rgb(${r},${g},${b})`;
            colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
        }
        
        // Get top colors
        const sorted = Array.from(colorCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, numColors);
        
        return sorted.map(([color, count]) => ({
            color: color,
            frequency: count / (size * size)
        }));
    }
    
    /**
     * Check if image is duplicate
     * @param {string} imageUrl - Image URL
     * @returns {Promise<Object>} {isDuplicate, matches}
     */
    async checkDuplicate(imageUrl) {
        const processed = await this.processImage(imageUrl);
        
        if (!processed.fingerprint) {
            return {
                isDuplicate: false,
                matches: []
            };
        }
        
        const matches = [];
        
        for (const [fingerprint, url] of this.visualFingerprints.entries()) {
            if (url === imageUrl) continue;
            
            const similarity = this.calculateFingerprintSimilarity(
                processed.fingerprint,
                fingerprint
            );
            
            if (similarity > 0.9) {
                matches.push({
                    url: url,
                    fingerprint: fingerprint,
                    similarity: similarity
                });
            }
        }
        
        return {
            isDuplicate: matches.length > 0,
            matches: matches.sort((a, b) => b.similarity - a.similarity)
        };
    }
    
    /**
     * Calculate fingerprint similarity (Hamming distance)
     */
    calculateFingerprintSimilarity(fp1, fp2) {
        // Remove 'img_' prefix
        const hash1 = fp1.replace('img_', '');
        const hash2 = fp2.replace('img_', '');
        
        if (hash1.length !== hash2.length) {
            return 0;
        }
        
        // Convert to binary
        let matches = 0;
        let total = 0;
        
        for (let i = 0; i < hash1.length; i++) {
            const bits1 = parseInt(hash1[i], 16).toString(2).padStart(4, '0');
            const bits2 = parseInt(hash2[i], 16).toString(2).padStart(4, '0');
            
            for (let j = 0; j < 4; j++) {
                if (bits1[j] === bits2[j]) {
                    matches++;
                }
                total++;
            }
        }
        
        return matches / total;
    }
    
    /**
     * Extract images from conversation message
     * @param {Object} message - Message object
     * @returns {Promise<Array>} Array of processed images
     */
    async extractImagesFromMessage(message) {
        const images = [];
        
        // Extract from img tags
        const imgRegex = /<img[^>]+src="([^">]+)"/g;
        let match;
        
        while ((match = imgRegex.exec(message.content)) !== null) {
            const imageUrl = match[1];
            const processed = await this.processImage(imageUrl, {
                messageId: message.id,
                timestamp: message.timestamp
            });
            images.push(processed);
        }
        
        // Extract from markdown images
        const mdRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
        
        while ((match = mdRegex.exec(message.content)) !== null) {
            const imageUrl = match[2];
            const alt = match[1];
            const processed = await this.processImage(imageUrl, {
                messageId: message.id,
                altText: alt,
                timestamp: message.timestamp
            });
            images.push(processed);
        }
        
        return images;
    }
    
    /**
     * Search images by OCR text
     * @param {string} query - Search query
     * @returns {Array} Matching images
     */
    searchByText(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();
        
        for (const [url, processed] of this.imageCache.entries()) {
            if (!processed.ocr || !processed.ocr.text) continue;
            
            const text = processed.ocr.text.toLowerCase();
            if (text.includes(lowerQuery)) {
                results.push({
                    ...processed,
                    relevance: this.calculateTextRelevance(query, processed.ocr.text)
                });
            }
        }
        
        return results.sort((a, b) => b.relevance - a.relevance);
    }
    
    /**
     * Calculate text relevance
     */
    calculateTextRelevance(query, text) {
        const queryWords = query.toLowerCase().split(/\s+/);
        const textWords = text.toLowerCase().split(/\s+/);
        
        let matches = 0;
        for (const word of queryWords) {
            if (textWords.includes(word)) {
                matches++;
            }
        }
        
        return matches / queryWords.length;
    }
    
    /**
     * Search images by content type
     */
    searchByType(contentType) {
        const results = [];
        
        for (const processed of this.imageCache.values()) {
            if (processed.contentType && processed.contentType.type === contentType) {
                results.push(processed);
            }
        }
        
        return results.sort((a, b) => 
            (b.contentType?.confidence || 0) - (a.contentType?.confidence || 0)
        );
    }
    
    /**
     * Generate ID
     */
    generateId() {
        return 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Clean up OCR worker
     */
    async cleanup() {
        if (this.ocrWorker) {
            await this.ocrWorker.terminate();
            this.ocrWorker = null;
        }
    }
    
    /**
     * Get statistics
     */
    getStats() {
        let totalOCRChars = 0;
        let imagesWithOCR = 0;
        
        const typeDistribution = {};
        
        for (const processed of this.imageCache.values()) {
            if (processed.ocr && processed.ocr.text) {
                totalOCRChars += processed.ocr.text.length;
                imagesWithOCR++;
            }
            
            if (processed.contentType) {
                const type = processed.contentType.type;
                typeDistribution[type] = (typeDistribution[type] || 0) + 1;
            }
        }
        
        return {
            totalImages: this.imageCache.size,
            imagesWithOCR: imagesWithOCR,
            totalOCRChars: totalOCRChars,
            avgOCRChars: imagesWithOCR > 0 ? totalOCRChars / imagesWithOCR : 0,
            typeDistribution: typeDistribution,
            uniqueFingerprints: this.visualFingerprints.size
        };
    }
    
    /**
     * Serialize
     */
    serialize() {
        return {
            version: '1.0',
            config: this.config,
            cache: Array.from(this.imageCache.entries()),
            fingerprints: Array.from(this.visualFingerprints.entries()),
            timestamp: Date.now()
        };
    }
    
    /**
     * Deserialize
     */
    static deserialize(data) {
        const handler = new MultiModalHandler(data.config);
        
        handler.imageCache = new Map(data.cache);
        handler.visualFingerprints = new Map(data.fingerprints);
        
        return handler;
    }
}

// Export for use in extension
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultiModalHandler;
}
