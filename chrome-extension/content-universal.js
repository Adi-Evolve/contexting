// MemoryForge - Universal Content Script
// Works with ALL AI chat platforms: ChatGPT, Claude, Gemini, Grok, DeepSeek, Perplexity, etc.

console.log('🧠 MemoryForge: Universal content script loading...');

// Platform detection and configuration
const PLATFORMS = {
    chatgpt: {
        domains: ['chat.openai.com', 'chatgpt.com'],
        name: 'ChatGPT',
        selectors: {
            messages: '[data-message-author-role]',
            messageRole: 'data-message-author-role',
            messageContent: '.markdown, [class*="whitespace-pre-wrap"]',
            input: '#prompt-textarea, textarea[placeholder*="Message"], textarea',
            title: 'nav a.active, nav button[aria-current="page"], h1'
        }
    },
    claude: {
        domains: ['claude.ai'],
        name: 'Claude',
        selectors: {
            messages: '[data-is-streaming], .font-user-message, .font-claude-message',
            messageContent: '.whitespace-pre-wrap, [class*="prose"]',
            input: '[data-testid="chat-input"], div[contenteditable="true"]',
            title: 'h1, [class*="title"]'
        }
    },
    gemini: {
        domains: ['gemini.google.com'],
        name: 'Gemini',
        selectors: {
            messages: 'message-content, .model-response, .user-query',
            messageContent: '.message-content, .markdown-content',
            input: 'rich-textarea, textarea, div[contenteditable="true"]',
            title: 'h1, [class*="conversation-title"]'
        }
    },
    grok: {
        domains: ['x.com/i/grok'],
        name: 'Grok',
        selectors: {
            messages: '[data-testid*="message"], .message-container',
            messageContent: '[class*="message-text"]',
            input: '[data-testid="messageInput"], textarea',
            title: 'h1, [aria-label*="conversation"]'
        }
    },
    deepseek: {
        domains: ['chat.deepseek.com'],
        name: 'DeepSeek',
        selectors: {
            messages: '.message-item, [class*="message-wrapper"]',
            messageContent: '.message-content, .markdown',
            input: 'textarea, div[contenteditable="true"]',
            title: '.chat-title, h1'
        }
    },
    perplexity: {
        domains: ['perplexity.ai'],
        name: 'Perplexity',
        selectors: {
            messages: '[class*="prose"], .message',
            messageContent: '.prose, [class*="markdown"]',
            input: 'textarea, div[contenteditable="true"]',
            title: 'h1, [class*="thread-title"]'
        }
    },
    poe: {
        domains: ['poe.com'],
        name: 'Poe',
        selectors: {
            messages: '[class*="Message"], [class*="ChatMessage"]',
            messageContent: '[class*="Message_botMessageBubble"], [class*="Message_humanMessageBubble"]',
            input: 'textarea',
            title: '[class*="ChatHeader"]'
        }
    },
    huggingchat: {
        domains: ['huggingface.co/chat'],
        name: 'HuggingChat',
        selectors: {
            messages: '[class*="message"]',
            messageContent: '.prose',
            input: 'textarea',
            title: 'h1'
        }
    },
    // Fallback for unknown platforms
    generic: {
        domains: [],
        name: 'AI Chat',
        selectors: {
            messages: '[role="article"], .message, [class*="message"]',
            messageContent: '.markdown, .prose, [class*="content"]',
            input: 'textarea, div[contenteditable="true"]',
            title: 'h1, title'
        }
    }
};

// Detect current platform
function detectPlatform() {
    const hostname = window.location.hostname;
    
    for (const [key, platform] of Object.entries(PLATFORMS)) {
        if (platform.domains.some(domain => hostname.includes(domain))) {
            console.log(`✅ Detected platform: ${platform.name}`);
            return { key, ...platform };
        }
    }
    
    console.log('⚠️ Unknown platform, using generic selectors');
    return { key: 'generic', ...PLATFORMS.generic };
}

const currentPlatform = detectPlatform();

// Initialize conversation tracker
let conversationTracker = null;
let isInitialized = false;

// Start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

async function init() {
    if (isInitialized) return;
    
    // Wait for ConversationTracker to load
    if (typeof ConversationTracker === 'undefined') {
        setTimeout(init, 100);
        return;
    }
    
    conversationTracker = new ConversationTracker();
    
    // Wait for AI chat interface
    await waitForInterface();
    
    // Start conversation BEFORE capturing messages
    await conversationTracker.startNewConversation();
    console.log('✅ Conversation initialized, ready to capture messages');
    
    // Inject UI
    injectSidebar();
    addFloatingButton();
    
    // Start observing
    observeMessages();
    
    // Listen for conversation saves to refresh sidebar
    window.addEventListener('conversationSaved', () => {
        console.log('🔄 Conversation saved, refreshing sidebar...');
        loadConversations();
    });
    
    // Save on page unload
    window.addEventListener('beforeunload', () => {
        conversationTracker.forceSave();
    });
    
    isInitialized = true;
    console.log(`✅ MemoryForge: Ready on ${currentPlatform.name}`);
}

function waitForInterface() {
    return new Promise((resolve) => {
        const check = setInterval(() => {
            const input = document.querySelector(currentPlatform.selectors.input);
            if (input) {
                clearInterval(check);
                resolve();
            }
        }, 500);
    });
}

// Get page title from current platform
function getPageTitle() {
    const selectors = currentPlatform.selectors.title.split(', ');
    
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
            const title = element.textContent.trim();
            if (title && title !== 'New chat' && !title.includes(currentPlatform.name)) {
                console.log(`📌 Found page title: "${title}"`);
                return title;
            }
        }
    }
    
    // Try document title as last resort
    const pageTitle = document.title;
    if (pageTitle && !pageTitle.includes(currentPlatform.name)) {
        console.log(`📌 Using document title: "${pageTitle}"`);
        return pageTitle;
    }
    
    console.log('⚠️ No page title found');
    return null;
}

// Universal message observation
function observeMessages() {
    const targetNode = document.querySelector('main') || document.body;
    
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    // Find all message elements using platform-specific selectors
                    const selectors = currentPlatform.selectors.messages.split(', ');
                    selectors.forEach(selector => {
                        const messages = node.querySelectorAll(selector);
                        messages.forEach(processMessage);
                        
                        if (node.matches && node.matches(selector)) {
                            processMessage(node);
                        }
                    });
                }
            });
        });
    });
    
    observer.observe(targetNode, { childList: true, subtree: true });
    
    // Capture ALL existing messages on page load
    console.log('📚 Capturing existing conversation history...');
    const selectors = currentPlatform.selectors.messages.split(', ');
    let allMessages = [];
    
    selectors.forEach(selector => {
        const messages = document.querySelectorAll(selector);
        allMessages = [...allMessages, ...Array.from(messages)];
    });
    
    console.log(`Found ${allMessages.length} existing messages`);
    
    if (allMessages.length === 0) {
        console.warn('⚠️ No messages found! Chat may still be loading.');
    } else {
        allMessages.forEach((msg, index) => {
            console.log(`Processing message ${index + 1}/${allMessages.length}`);
            processMessage(msg);
        });
        console.log(`✅ Finished processing ${allMessages.length} existing messages`);
    }
    
    // Try to get title multiple times
    let titleAttempts = 0;
    const trySetTitle = () => {
        titleAttempts++;
        const pageTitle = getPageTitle();
        if (pageTitle && conversationTracker.currentConversation) {
            conversationTracker.currentConversation.title = pageTitle;
            console.log(`✅ Set conversation title (attempt ${titleAttempts}): "${pageTitle}"`);
            conversationTracker.saveConversation();
        } else if (titleAttempts < 5) {
            console.log(`⏳ Title not ready yet, retrying... (attempt ${titleAttempts}/5)`);
            setTimeout(trySetTitle, 1000);
        } else {
            console.warn('⚠️ Could not get page title after 5 attempts');
        }
    };
    setTimeout(trySetTitle, 500);
    
    console.log('👀 Observing messages...');
}

// Monitor for page navigation
let lastUrl = window.location.href;
setInterval(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
        console.log('🔄 Chat switched - clearing processed messages cache');
        processedMessages.clear();
        lastUrl = currentUrl;
        
        // Reload conversations list in sidebar
        if (document.getElementById('memoryforge-sidebar')?.classList.contains('mf-open')) {
            loadConversations();
        }
    }
}, 1000);

// Process individual message
const processedMessages = new Map();
const MAX_PROCESSED_MESSAGES = 200;
let messageProcessCount = 0;

function processMessage(messageElement) {
    // Detect role (user or assistant)
    let role = 'assistant'; // default
    
    // ChatGPT style
    if (messageElement.hasAttribute('data-message-author-role')) {
        role = messageElement.getAttribute('data-message-author-role');
    }
    // Claude style
    else if (messageElement.className.includes('user')) {
        role = 'user';
    }
    // Generic detection
    else {
        const text = messageElement.textContent.toLowerCase();
        if (text.includes('you:') || messageElement.querySelector('[class*="user"]')) {
            role = 'user';
        }
    }
    
    // Extract content using platform-specific selectors
    const contentSelectors = currentPlatform.selectors.messageContent.split(', ');
    let contentElement = null;
    
    for (const selector of contentSelectors) {
        contentElement = messageElement.querySelector(selector);
        if (contentElement) break;
    }
    
    if (!contentElement) {
        contentElement = messageElement;
    }
    
    const content = contentElement.textContent.trim();
    if (!content || content.length < 5) {
        console.log(`⏭️ Skipping ${role} - content too short (${content.length} chars)`);
        return;
    }
    
    // Check if already processed
    const contentHash = content.substring(0, 50);
    const currentUrl = window.location.href;
    const uniqueKey = `${currentUrl}:::${contentHash}`;
    
    if (processedMessages.has(uniqueKey)) {
        console.log(`⏭️ Already processed ${role} message`);
        return;
    }
    processedMessages.set(uniqueKey, true);
    
    // Add to conversation tracker
    conversationTracker.addMessage(role, content);
    messageProcessCount++;
    
    console.log(`✅ Captured ${role} message #${messageProcessCount} (${content.length} chars): "${content.substring(0, 50)}..."`);
    
    // Clean up old processed messages
    if (processedMessages.size > MAX_PROCESSED_MESSAGES) {
        const firstKey = processedMessages.keys().next().value;
        processedMessages.delete(firstKey);
    }
}

// Universal text insertion
function insertTextIntoChat(text) {
    const selectors = currentPlatform.selectors.input.split(', ');
    let input = null;
    
    for (const selector of selectors) {
        input = document.querySelector(selector);
        if (input) break;
    }
    
    if (!input) {
        console.warn('Chat input not found');
        return false;
    }
    
    if (input.tagName === 'TEXTAREA') {
        input.value = text;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
        input.textContent = text;
        input.innerHTML = text;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    input.focus();
    return true;
}

// Load the rest of the UI components from content-chatgpt-v2.js
// (All the sidebar, modal, and UI functions remain the same)
