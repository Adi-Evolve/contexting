// Smart Clipboard Monitor - Layer 2 Enhanced
// Intelligent pattern detection for multiple AI platforms

const vscode = require('vscode');

class SmartClipboardMonitor {
    constructor(onConversationDetected) {
        this.onConversationDetected = onConversationDetected;
        this.history = [];
        this.lastHash = '';
        this.patterns = this.loadPatterns();
        this.isMonitoring = false;
        this.monitorInterval = null;
    }
    
    loadPatterns() {
        return {
            // GitHub Copilot Chat patterns
            copilot: {
                name: 'GitHub Copilot',
                userMarkers: [
                    /^You:\s*/gm,
                    /^User:\s*/gm,
                    /^👤\s*/gm
                ],
                assistantMarkers: [
                    /^Copilot:\s*/gm,
                    /^GitHub Copilot:\s*/gm,
                    /^🤖\s*/gm,
                    /^Assistant:\s*/gm
                ],
                codeBlock: /```(\w+)?\n([\s\S]*?)```/g,
                confidence: 0.95
            },
            
            // Gemini patterns
            gemini: {
                name: 'Gemini',
                userMarkers: [
                    /^You:\s*/gm,
                    /^User:\s*/gm
                ],
                assistantMarkers: [
                    /^Gemini:\s*/gm,
                    /^Model:\s*/gm
                ],
                codeBlock: /```(\w+)?\n([\s\S]*?)```/g,
                confidence: 0.90
            },
            
            // ChatGPT patterns
            chatgpt: {
                name: 'ChatGPT',
                userMarkers: [
                    /^You said:\s*/gm,
                    /^You:\s*/gm,
                    /^User:\s*/gm
                ],
                assistantMarkers: [
                    /^ChatGPT said:\s*/gm,
                    /^ChatGPT:\s*/gm,
                    /^Assistant:\s*/gm
                ],
                codeBlock: /```(\w+)?\n([\s\S]*?)```/g,
                confidence: 0.90
            },
            
            // Claude patterns
            claude: {
                name: 'Claude',
                userMarkers: [
                    /^Human:\s*/gm,
                    /^You:\s*/gm,
                    /^User:\s*/gm
                ],
                assistantMarkers: [
                    /^Assistant:\s*/gm,
                    /^Claude:\s*/gm
                ],
                codeBlock: /```(\w+)?\n([\s\S]*?)```/g,
                confidence: 0.90
            },
            
            // Generic chat format
            generic: {
                name: 'Generic Chat',
                userMarkers: [
                    /^(User|Human|Q|You):\s*/gm
                ],
                assistantMarkers: [
                    /^(Assistant|AI|A|Bot):\s*/gm
                ],
                codeBlock: /```(\w+)?\n([\s\S]*?)```/g,
                confidence: 0.60
            }
        };
    }
    
    startMonitoring(intervalMs = 2000) {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        console.log('🔍 Smart clipboard monitoring started');
        
        this.monitorInterval = setInterval(async () => {
            await this.checkClipboard();
        }, intervalMs);
    }
    
    stopMonitoring() {
        if (!this.isMonitoring) return;
        
        this.isMonitoring = false;
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }
        console.log('🔍 Smart clipboard monitoring stopped');
    }
    
    async checkClipboard() {
        try {
            const clipboardText = await vscode.env.clipboard.readText();
            
            if (!clipboardText || clipboardText.length < 50) {
                return; // Too short to be a conversation
            }
            
            // Check if we've already processed this
            const hash = this.simpleHash(clipboardText);
            if (hash === this.lastHash) {
                return;
            }
            
            this.lastHash = hash;
            
            // Try to detect and parse
            const result = await this.detectAndParse(clipboardText);
            
            if (result && result.confidence > 0.7) {
                console.log(`✅ Detected ${result.platform} conversation (confidence: ${result.confidence})`);
                
                // Notify callback
                if (this.onConversationDetected) {
                    this.onConversationDetected(result);
                }
                
                // Add to history
                this.history.push({
                    ...result,
                    detectedAt: Date.now()
                });
                
                // Keep only last 10
                if (this.history.length > 10) {
                    this.history.shift();
                }
            }
        } catch (error) {
            // Silently fail - clipboard access can be denied
            console.error('Clipboard check failed:', error.message);
        }
    }
    
    async detectAndParse(clipboardText) {
        // Try each pattern in order of confidence
        const patterns = Object.entries(this.patterns)
            .sort((a, b) => b[1].confidence - a[1].confidence);
        
        for (const [platformKey, pattern] of patterns) {
            const result = this.tryPattern(clipboardText, pattern, platformKey);
            if (result && result.confidence > 0.7) {
                return result;
            }
        }
        
        return null;
    }
    
    tryPattern(text, pattern, platformKey) {
        // Try all user markers
        let userMatches = 0;
        for (const marker of pattern.userMarkers) {
            const matches = text.match(marker);
            if (matches) {
                userMatches += matches.length;
            }
        }
        
        // Try all assistant markers
        let assistantMatches = 0;
        for (const marker of pattern.assistantMarkers) {
            const matches = text.match(marker);
            if (matches) {
                assistantMatches += matches.length;
            }
        }
        
        // Need at least 1 of each
        if (userMatches === 0 || assistantMatches === 0) {
            return null;
        }
        
        // Parse into messages
        const messages = this.parseMessages(text, pattern);
        
        if (messages.length < 2) {
            return null;
        }
        
        // Adjust confidence based on match quality
        let confidence = pattern.confidence;
        const totalMatches = userMatches + assistantMatches;
        const messageRatio = messages.length / totalMatches;
        
        if (messageRatio < 0.5) {
            confidence *= 0.8; // Penalize if many markers but few messages
        }
        
        return {
            platform: pattern.name,
            platformKey: platformKey,
            confidence: confidence,
            messages: messages,
            metadata: {
                capturedAt: Date.now(),
                source: 'clipboard',
                messageCount: messages.length,
                userMessageCount: messages.filter(m => m.role === 'user').length,
                assistantMessageCount: messages.filter(m => m.role === 'assistant').length,
                hasCodeBlocks: messages.some(m => m.codeBlocks && m.codeBlocks.length > 0)
            }
        };
    }
    
    parseMessages(text, pattern) {
        const messages = [];
        const lines = text.split('\n');
        
        let currentRole = null;
        let currentContent = [];
        
        for (const line of lines) {
            let matchedUser = false;
            let matchedAssistant = false;
            
            // Check user markers
            for (const marker of pattern.userMarkers) {
                if (marker.test(line)) {
                    matchedUser = true;
                    break;
                }
            }
            
            // Check assistant markers
            for (const marker of pattern.assistantMarkers) {
                if (marker.test(line)) {
                    matchedAssistant = true;
                    break;
                }
            }
            
            if (matchedUser) {
                // Save previous message
                if (currentRole && currentContent.length > 0) {
                    messages.push(this.createMessage(currentRole, currentContent, pattern));
                }
                
                currentRole = 'user';
                // Remove marker from line
                let cleanLine = line;
                for (const marker of pattern.userMarkers) {
                    cleanLine = cleanLine.replace(marker, '');
                }
                currentContent = [cleanLine.trim()];
            } else if (matchedAssistant) {
                // Save previous message
                if (currentRole && currentContent.length > 0) {
                    messages.push(this.createMessage(currentRole, currentContent, pattern));
                }
                
                currentRole = 'assistant';
                // Remove marker from line
                let cleanLine = line;
                for (const marker of pattern.assistantMarkers) {
                    cleanLine = cleanLine.replace(marker, '');
                }
                currentContent = [cleanLine.trim()];
            } else if (currentRole) {
                // Continue current message
                currentContent.push(line);
            }
        }
        
        // Add last message
        if (currentRole && currentContent.length > 0) {
            messages.push(this.createMessage(currentRole, currentContent, pattern));
        }
        
        return messages;
    }
    
    createMessage(role, contentLines, pattern) {
        const content = contentLines.join('\n').trim();
        const codeBlocks = this.extractCodeBlocks(content, pattern);
        
        return {
            role: role,
            content: content,
            codeBlocks: codeBlocks,
            timestamp: Date.now(),
            wordCount: content.split(/\s+/).length,
            hasCode: codeBlocks.length > 0
        };
    }
    
    extractCodeBlocks(content, pattern) {
        const blocks = [];
        const regex = pattern.codeBlock;
        let match;
        
        // Reset regex
        regex.lastIndex = 0;
        
        while ((match = regex.exec(content)) !== null) {
            blocks.push({
                language: match[1] || 'text',
                code: match[2].trim(),
                lineCount: match[2].split('\n').length
            });
        }
        
        return blocks;
    }
    
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < Math.min(str.length, 1000); i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }
    
    getHistory() {
        return this.history;
    }
    
    clearHistory() {
        this.history = [];
        this.lastHash = '';
    }
}

module.exports = SmartClipboardMonitor;
