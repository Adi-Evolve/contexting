// VS Code Extension Error Handler
// Handles VS Code API errors and file system operations

const vscode = require('vscode');

class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.MAX_ERRORS = 100;
    }

    /**
     * Handle VS Code API errors
     */
    handleVSCodeError(operation, error = null) {
        const errorInfo = {
            operation,
            message: error?.message || error?.toString() || 'Unknown error',
            timestamp: Date.now(),
            stack: error?.stack || new Error().stack
        };

        this.logError(errorInfo);

        // Show error to user
        vscode.window.showErrorMessage(
            `Remember: ${operation} failed - ${errorInfo.message}`
        );

        return {
            success: false,
            error: errorInfo.message,
            recovery: 'Please try again'
        };
    }

    /**
     * Handle file system errors
     */
    handleFileSystemError(operation, error) {
        console.error(`⚠️ File system error in ${operation}:`, error);
        
        let userMessage = `File operation failed: ${operation}`;
        let recovery = 'Please check file permissions and try again';

        if (error.code === 'ENOENT') {
            userMessage = 'File or directory not found';
            recovery = 'The file may have been deleted or moved';
        } else if (error.code === 'EACCES' || error.code === 'EPERM') {
            userMessage = 'Permission denied';
            recovery = 'Check file permissions';
        } else if (error.code === 'ENOSPC') {
            userMessage = 'Disk space full';
            recovery = 'Free up some disk space';
        }

        vscode.window.showErrorMessage(`Remember: ${userMessage}`);

        return {
            success: false,
            error: error.message,
            recovery
        };
    }

    /**
     * Validate message content
     */
    validateMessage(message) {
        const errors = [];

        if (!message) {
            errors.push('Message is null or undefined');
        }

        if (!message.content || message.content.trim() === '') {
            errors.push('Message content is empty');
        }

        const contentSize = Buffer.byteLength(message.content || '', 'utf8');
        if (contentSize > 5 * 1024 * 1024) {
            errors.push(`Message too large: ${(contentSize / 1024 / 1024).toFixed(2)}MB (max 5MB)`);
        }

        if (!message.role || !['user', 'assistant', 'system'].includes(message.role)) {
            errors.push('Invalid message role');
        }

        if (errors.length > 0) {
            this.logError({
                operation: 'validateMessage',
                message: errors.join(', '),
                timestamp: Date.now()
            });

            return { valid: false, errors };
        }

        return { valid: true, errors: [] };
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

        if (errors.length > 0) {
            this.logError({
                operation: 'validateConversation',
                message: errors.join(', '),
                timestamp: Date.now(),
                conversationId: conversation?.id
            });

            return { valid: false, errors };
        }

        return { valid: true, errors: [] };
    }

    /**
     * Try operation with automatic retry
     */
    async tryWithRetry(operation, fn, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await fn();
                return { success: true, result };
            } catch (error) {
                console.warn(`Operation "${operation}" attempt ${attempt} failed:`, error);

                if (attempt === maxRetries) {
                    return this.handleVSCodeError(operation, error);
                }

                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
            }
        }
    }

    /**
     * Show notification
     */
    showNotification(title, message, type = 'info') {
        console.log(`📢 ${title}: ${message}`);

        switch (type) {
            case 'error':
                vscode.window.showErrorMessage(`${title}: ${message}`);
                break;
            case 'warning':
                vscode.window.showWarningMessage(`${title}: ${message}`);
                break;
            default:
                vscode.window.showInformationMessage(`${title}: ${message}`);
        }
    }

    /**
     * Log error for debugging
     */
    logError(errorInfo) {
        this.errorLog.push(errorInfo);

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
}

module.exports = ErrorHandler;
