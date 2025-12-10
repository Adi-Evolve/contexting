// Centralized error handling and recovery system
// Handles Chrome API errors, storage quota issues, and user notifications

class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.MAX_ERRORS = 100;
        this.notificationsEnabled = true;
    }

    /**
     * Handle Chrome runtime errors
     */
    handleChromeError(operation, error = null) {
        const chromeError = error || chrome.runtime.lastError;
        
        if (!chromeError) {
            return { success: true };
        }

        const errorInfo = {
            operation,
            message: chromeError.message || chromeError.toString(),
            timestamp: Date.now(),
            stack: chromeError.stack || new Error().stack
        };

        this.logError(errorInfo);

        // Handle specific error types
        if (chromeError.message && chromeError.message.includes('QUOTA_BYTES')) {
            return this.handleQuotaError(operation);
        }

        if (chromeError.message && chromeError.message.includes('Extension context invalidated')) {
            return this.handleContextInvalidated(operation);
        }

        // Generic error notification
        this.showNotification('Error', `Operation failed: ${operation}`);

        return {
            success: false,
            error: errorInfo.message,
            recovery: 'Please try again'
        };
    }

    /**
     * Handle storage quota exceeded
     */
    handleQuotaError(operation) {
        console.error('⚠️ Storage quota exceeded');
        
        this.showNotification(
            'Storage Full',
            'Remember storage is full. Please export and clear old conversations.',
            'high'
        );

        return {
            success: false,
            error: 'Storage quota exceeded',
            recovery: 'Export old conversations and clear storage'
        };
    }

    /**
     * Handle extension context invalidated (reload needed)
     */
    handleContextInvalidated(operation) {
        console.error('⚠️ Extension context invalidated');
        
        this.showNotification(
            'Reload Required',
            'Remember extension needs to reload. Please refresh the page.',
            'high'
        );

        return {
            success: false,
            error: 'Extension context invalidated',
            recovery: 'Reload the extension or refresh the page'
        };
    }

    /**
     * Validate message content
     */
    validateMessage(message) {
        const errors = [];

        // Check if message exists
        if (!message) {
            errors.push('Message is null or undefined');
        }

        // Check if content is present
        if (!message.content || message.content.trim() === '') {
            errors.push('Message content is empty');
        }

        // Check if content is too large (5MB limit for safety)
        const contentSize = new Blob([message.content]).size;
        if (contentSize > 5 * 1024 * 1024) {
            errors.push(`Message too large: ${(contentSize / 1024 / 1024).toFixed(2)}MB (max 5MB)`);
        }

        // Check if role is valid
        if (!message.role || !['user', 'assistant', 'system'].includes(message.role)) {
            errors.push('Invalid message role');
        }

        if (errors.length > 0) {
            this.logError({
                operation: 'validateMessage',
                message: errors.join(', '),
                timestamp: Date.now()
            });

            return {
                valid: false,
                errors
            };
        }

        return {
            valid: true,
            errors: []
        };
    }

    /**
     * Validate conversation object
     */
    validateConversation(conversation) {
        const errors = [];

        if (!conversation) {
            errors.push('Conversation is null or undefined');
        }

        if (!conversation.id) {
            errors.push('Conversation missing ID');
        }

        if (!conversation.messages || !Array.isArray(conversation.messages)) {
            errors.push('Conversation missing messages array');
        }

        if (conversation.messages && conversation.messages.length === 0) {
            errors.push('Conversation has no messages');
        }

        if (!conversation.platform) {
            errors.push('Conversation missing platform');
        }

        if (errors.length > 0) {
            this.logError({
                operation: 'validateConversation',
                message: errors.join(', '),
                timestamp: Date.now(),
                conversationId: conversation?.id
            });

            return {
                valid: false,
                errors
            };
        }

        return {
            valid: true,
            errors: []
        };
    }

    /**
     * Safe chrome.runtime.sendMessage with retry
     */
    async safeSendMessage(message, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await new Promise((resolve, reject) => {
                    chrome.runtime.sendMessage(message, (response) => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve(response);
                        }
                    });
                });

                return { success: true, response };
            } catch (error) {
                console.warn(`Message send attempt ${attempt} failed:`, error);

                if (attempt === maxRetries) {
                    return this.handleChromeError('sendMessage', error);
                }

                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
            }
        }
    }

    /**
     * Safe chrome.storage.local operations with fallback
     */
    async safeStorageGet(key) {
        try {
            return new Promise((resolve, reject) => {
                chrome.storage.local.get(key, (result) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(result[key]);
                    }
                });
            });
        } catch (error) {
            console.error('Storage get failed:', error);
            
            // Fallback to localStorage
            try {
                const localData = localStorage.getItem(`remember_${key}`);
                return localData ? JSON.parse(localData) : null;
            } catch (fallbackError) {
                console.error('Fallback storage also failed:', fallbackError);
                return null;
            }
        }
    }

    /**
     * Safe chrome.storage.local.set with fallback
     */
    async safeStorageSet(key, value) {
        try {
            return new Promise((resolve, reject) => {
                chrome.storage.local.set({ [key]: value }, () => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve({ success: true });
                    }
                });
            });
        } catch (error) {
            console.error('Storage set failed:', error);
            
            // Fallback to localStorage
            try {
                localStorage.setItem(`remember_${key}`, JSON.stringify(value));
                return { success: true, usedFallback: true };
            } catch (fallbackError) {
                return this.handleChromeError('storageSet', fallbackError);
            }
        }
    }

    /**
     * Show notification to user
     */
    showNotification(title, message, priority = 'low') {
        if (!this.notificationsEnabled) {
            return;
        }

        console.log(`📢 ${title}: ${message}`);

        // Try Chrome notifications
        try {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: chrome.runtime.getURL('icon128.png'),
                title: `Remember - ${title}`,
                message,
                priority: priority === 'high' ? 2 : 0
            });
        } catch (error) {
            console.error('Failed to show notification:', error);
        }
    }

    /**
     * Log error for debugging
     */
    logError(errorInfo) {
        this.errorLog.push(errorInfo);

        // Keep only last N errors
        if (this.errorLog.length > this.MAX_ERRORS) {
            this.errorLog.shift();
        }

        console.error('❌ Error logged:', errorInfo);
    }

    /**
     * Get error log
     */
    getErrorLog() {
        return [...this.errorLog];
    }

    /**
     * Clear error log
     */
    clearErrorLog() {
        this.errorLog = [];
    }

    /**
     * Enable/disable notifications
     */
    setNotificationsEnabled(enabled) {
        this.notificationsEnabled = enabled;
    }

    /**
     * Get error statistics
     */
    getErrorStats() {
        const stats = {
            total: this.errorLog.length,
            byOperation: {},
            recent: this.errorLog.slice(-10)
        };

        this.errorLog.forEach(error => {
            const op = error.operation || 'unknown';
            stats.byOperation[op] = (stats.byOperation[op] || 0) + 1;
        });

        return stats;
    }

    /**
     * Try operation with automatic retry and error handling
     */
    async tryWithRetry(operation, fn, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await fn();
                return { success: true, result };
            } catch (error) {
                console.warn(`Operation "${operation}" attempt ${attempt} failed:`, error);

                if (attempt === maxRetries) {
                    return this.handleChromeError(operation, error);
                }

                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
            }
        }
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}
