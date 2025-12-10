// Code Language Detector
// Detects programming languages in conversation messages

class CodeLanguageDetector {
    constructor() {
        // Language patterns with keywords and syntax
        this.languages = {
            python: {
                extensions: ['.py', '.pyw', '.pyi'],
                keywords: ['def ', 'import ', 'from ', 'class ', 'self.', '__init__', 'elif ', 'True', 'False', 'None'],
                syntax: [/def\s+\w+\s*\(/, /import\s+\w+/, /:\s*$/, /print\(/, /range\(/],
                confidence: 0
            },
            javascript: {
                extensions: ['.js', '.jsx', '.mjs'],
                keywords: ['const ', 'let ', 'var ', 'function ', '=>', 'console.log', 'async ', 'await ', 'require(', 'module.exports'],
                syntax: [/const\s+\w+\s*=/, /=>\s*{/, /function\s+\w+/, /console\.log/, /\$\{.*\}/],
                confidence: 0
            },
            typescript: {
                extensions: ['.ts', '.tsx'],
                keywords: ['interface ', 'type ', 'enum ', 'namespace ', 'implements ', 'extends ', ': string', ': number', ': boolean'],
                syntax: [/interface\s+\w+/, /:\s*(string|number|boolean)/, /type\s+\w+\s*=/, /<\w+>/],
                confidence: 0
            },
            java: {
                extensions: ['.java'],
                keywords: ['public class', 'private ', 'protected ', 'void ', 'static ', 'import java.', 'System.out', 'new '],
                syntax: [/public\s+class\s+\w+/, /System\.out\.print/, /new\s+\w+\(/, /import\s+java\./],
                confidence: 0
            },
            'c++': {
                extensions: ['.cpp', '.hpp', '.cc', '.h'],
                keywords: ['#include', 'std::', 'cout', 'cin', 'namespace ', 'template', 'class ', 'public:', 'private:'],
                syntax: [/#include\s*</, /std::/, /cout\s*<</, /template\s*</],
                confidence: 0
            },
            c: {
                extensions: ['.c', '.h'],
                keywords: ['#include', 'printf', 'scanf', 'malloc', 'free', 'struct ', 'typedef ', 'void '],
                syntax: [/#include\s*</, /printf\(/, /malloc\(/, /struct\s+\w+/],
                confidence: 0
            },
            'c#': {
                extensions: ['.cs'],
                keywords: ['using System', 'namespace ', 'class ', 'public ', 'private ', 'void ', 'string ', 'Console.'],
                syntax: [/using\s+System/, /namespace\s+\w+/, /Console\.Write/],
                confidence: 0
            },
            ruby: {
                extensions: ['.rb'],
                keywords: ['def ', 'end', 'class ', 'module ', 'require ', 'puts ', 'attr_', '@'],
                syntax: [/def\s+\w+/, /end\s*$/, /puts\s+/, /attr_\w+\s+:/],
                confidence: 0
            },
            php: {
                extensions: ['.php'],
                keywords: ['<?php', '$', 'function ', 'class ', 'public ', 'private ', 'echo ', 'require ', 'namespace '],
                syntax: [/<\?php/, /\$\w+/, /echo\s+/, /function\s+\w+/],
                confidence: 0
            },
            go: {
                extensions: ['.go'],
                keywords: ['package ', 'import ', 'func ', 'type ', 'struct ', 'interface ', 'go ', 'defer ', ':='],
                syntax: [/package\s+\w+/, /func\s+\w+/, /:\=/, /go\s+\w+/],
                confidence: 0
            },
            rust: {
                extensions: ['.rs'],
                keywords: ['fn ', 'let ', 'mut ', 'impl ', 'trait ', 'pub ', 'use ', 'mod ', '->'],
                syntax: [/fn\s+\w+/, /let\s+mut/, /impl\s+\w+/, /->/],
                confidence: 0
            },
            swift: {
                extensions: ['.swift'],
                keywords: ['func ', 'var ', 'let ', 'class ', 'struct ', 'enum ', 'protocol ', 'extension ', 'import '],
                syntax: [/func\s+\w+/, /var\s+\w+:/, /let\s+\w+:/, /\w+:\s*\w+/],
                confidence: 0
            },
            kotlin: {
                extensions: ['.kt', '.kts'],
                keywords: ['fun ', 'val ', 'var ', 'class ', 'object ', 'interface ', 'data class', 'companion '],
                syntax: [/fun\s+\w+/, /val\s+\w+/, /data\s+class/],
                confidence: 0
            },
            sql: {
                extensions: ['.sql'],
                keywords: ['SELECT ', 'FROM ', 'WHERE ', 'INSERT ', 'UPDATE ', 'DELETE ', 'CREATE TABLE', 'JOIN '],
                syntax: [/SELECT\s+.*\s+FROM/i, /INSERT\s+INTO/i, /CREATE\s+TABLE/i],
                confidence: 0
            },
            html: {
                extensions: ['.html', '.htm'],
                keywords: ['<html', '<div', '<p>', '<a ', '<img ', '<head', '<body', '<!DOCTYPE'],
                syntax: [/<[a-z]+/, /<\/[a-z]+>/, /<!DOCTYPE/i],
                confidence: 0
            },
            css: {
                extensions: ['.css', '.scss', '.sass'],
                keywords: ['{', '}', 'color:', 'background:', 'display:', 'margin:', 'padding:', '@media'],
                syntax: [/\w+\s*{/, /:\s*[\w#]+;/, /@\w+/],
                confidence: 0
            },
            json: {
                extensions: ['.json'],
                keywords: [],
                syntax: [/^\s*{/, /"\w+":\s*/, /^\s*\[/],
                confidence: 0
            },
            yaml: {
                extensions: ['.yaml', '.yml'],
                keywords: [],
                syntax: [/^\s*\w+:/, /^\s*-\s/, /---/],
                confidence: 0
            },
            bash: {
                extensions: ['.sh', '.bash'],
                keywords: ['#!/bin/bash', 'echo ', 'if ', 'then', 'fi', 'for ', 'while ', 'do', 'done'],
                syntax: [/^#!\/bin\/bash/, /echo\s+/, /if\s*\[/, /\$\w+/],
                confidence: 0
            }
        };
    }
    
    /**
     * Detect languages in a single message
     * @param {string} content - Message content
     * @returns {Array} Array of detected languages with confidence scores
     */
    detectInMessage(content) {
        const results = [];
        
        // Check code blocks first
        const codeBlocks = this.extractCodeBlocks(content);
        
        if (codeBlocks.length > 0) {
            codeBlocks.forEach(block => {
                const detected = this.detectInCodeBlock(block);
                if (detected) results.push(detected);
            });
        }
        
        // Also check inline code and mentions
        const inlineLangs = this.detectInlineReferences(content);
        results.push(...inlineLangs);
        
        // Deduplicate and sort by confidence
        const uniqueResults = this.deduplicateResults(results);
        return uniqueResults.sort((a, b) => b.confidence - a.confidence);
    }
    
    /**
     * Extract code blocks from markdown
     */
    extractCodeBlocks(content) {
        const blocks = [];
        const regex = /```(\w*)\n([\s\S]*?)```/g;
        let match;
        
        while ((match = regex.exec(content)) !== null) {
            blocks.push({
                language: match[1] || null,
                code: match[2]
            });
        }
        
        return blocks;
    }
    
    /**
     * Detect language in a code block
     */
    detectInCodeBlock(block) {
        // If language is specified in markdown, use it
        if (block.language && this.languages[block.language.toLowerCase()]) {
            return {
                language: block.language.toLowerCase(),
                confidence: 1.0,
                source: 'markdown'
            };
        }
        
        // Otherwise, analyze the code
        const code = block.code;
        const scores = {};
        
        Object.entries(this.languages).forEach(([lang, def]) => {
            let score = 0;
            
            // Check keywords
            def.keywords.forEach(keyword => {
                if (code.includes(keyword)) {
                    score += 1;
                }
            });
            
            // Check syntax patterns
            def.syntax.forEach(pattern => {
                if (pattern.test(code)) {
                    score += 2; // Syntax is stronger signal than keywords
                }
            });
            
            if (score > 0) {
                scores[lang] = score;
            }
        });
        
        // Get highest score
        const entries = Object.entries(scores);
        if (entries.length === 0) return null;
        
        entries.sort((a, b) => b[1] - a[1]);
        const [topLang, topScore] = entries[0];
        
        // Calculate confidence (normalize score)
        const maxPossible = this.languages[topLang].keywords.length + (this.languages[topLang].syntax.length * 2);
        const confidence = Math.min(1.0, topScore / (maxPossible * 0.3)); // 30% match = high confidence
        
        if (confidence > 0.3) {
            return {
                language: topLang,
                confidence: confidence,
                source: 'analysis'
            };
        }
        
        return null;
    }
    
    /**
     * Detect language mentions in plain text
     */
    detectInlineReferences(content) {
        const results = [];
        const contentLower = content.toLowerCase();
        
        // Common ways to mention languages
        const patterns = [
            /\b(python|javascript|java|c\+\+|rust|go|typescript|ruby|php|swift|kotlin)\b/gi,
            /\b(js|ts|py|cpp|rs)\b/gi,
            /in\s+(python|javascript|java|c\+\+|rust|go|typescript|ruby|php)/gi,
            /using\s+(python|javascript|java|c\+\+|rust|go|typescript|ruby|php)/gi
        ];
        
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const lang = this.normalizeLangName(match[1]);
                if (this.languages[lang]) {
                    results.push({
                        language: lang,
                        confidence: 0.6,
                        source: 'mention'
                    });
                }
            }
        });
        
        // Check for file extensions
        Object.entries(this.languages).forEach(([lang, def]) => {
            def.extensions.forEach(ext => {
                if (content.includes(ext)) {
                    results.push({
                        language: lang,
                        confidence: 0.7,
                        source: 'extension'
                    });
                }
            });
        });
        
        return results;
    }
    
    /**
     * Normalize language name abbreviations
     */
    normalizeLangName(name) {
        const map = {
            'js': 'javascript',
            'ts': 'typescript',
            'py': 'python',
            'cpp': 'c++',
            'rs': 'rust'
        };
        
        return map[name.toLowerCase()] || name.toLowerCase();
    }
    
    /**
     * Remove duplicate language detections
     */
    deduplicateResults(results) {
        const unique = new Map();
        
        results.forEach(result => {
            const existing = unique.get(result.language);
            if (!existing || result.confidence > existing.confidence) {
                unique.set(result.language, result);
            }
        });
        
        return Array.from(unique.values());
    }
    
    /**
     * Analyze entire conversation for language usage
     * @param {Array} messages - Array of message objects
     * @returns {Object} Summary of language usage
     */
    analyzeConversation(messages) {
        const languageCounts = {};
        const languageDetails = [];
        
        messages.forEach((msg, index) => {
            const detected = this.detectInMessage(msg.content);
            
            detected.forEach(result => {
                // Count occurrences
                if (!languageCounts[result.language]) {
                    languageCounts[result.language] = {
                        count: 0,
                        totalConfidence: 0,
                        sources: new Set()
                    };
                }
                
                languageCounts[result.language].count++;
                languageCounts[result.language].totalConfidence += result.confidence;
                languageCounts[result.language].sources.add(result.source);
                
                // Store details
                languageDetails.push({
                    messageIndex: index,
                    language: result.language,
                    confidence: result.confidence,
                    source: result.source
                });
            });
        });
        
        // Calculate summary
        const summary = Object.entries(languageCounts).map(([lang, data]) => ({
            language: lang,
            occurrences: data.count,
            avgConfidence: data.totalConfidence / data.count,
            sources: Array.from(data.sources)
        }));
        
        summary.sort((a, b) => b.occurrences - a.occurrences);
        
        return {
            languages: summary,
            details: languageDetails,
            primaryLanguage: summary.length > 0 ? summary[0].language : null
        };
    }
}

// Export for use in Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CodeLanguageDetector;
}
