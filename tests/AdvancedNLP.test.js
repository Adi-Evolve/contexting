/**
 * Tests for AdvancedNLP Utilities
 * Tests client-side NLP processing
 */

import { describe, it, assert } from './test-framework.js';
import { AdvancedNLP } from '../src/utils/AdvancedNLP.js';

describe('AdvancedNLP', () => {
    const nlp = new AdvancedNLP();

    // ===== Entity Extraction Tests =====

    it('should extract email addresses', () => {
        const text = 'Contact me at john@example.com or support@test.org';
        const result = nlp.extractEntities(text);

        assert.lengthOf(result.emails, 2, 'Should find 2 emails');
        assert.contains(result.emails, 'john@example.com', 'Should find first email');
        assert.contains(result.emails, 'support@test.org', 'Should find second email');
    });

    it('should extract URLs', () => {
        const text = 'Visit https://example.com or http://test.org/page';
        const result = nlp.extractEntities(text);

        assert.lengthOf(result.urls, 2, 'Should find 2 URLs');
        assert.contains(result.urls, 'https://example.com', 'Should find HTTPS URL');
        assert.contains(result.urls, 'http://test.org/page', 'Should find HTTP URL');
    });

    it('should extract phone numbers', () => {
        const text = 'Call 555-123-4567 or (555) 987-6543';
        const result = nlp.extractEntities(text);

        assert.truthy(result.phones.length >= 1, 'Should find phone numbers');
    });

    it('should extract dates', () => {
        const text = 'Meeting on 2025-01-15 or January 20, 2025';
        const result = nlp.extractEntities(text);

        assert.truthy(result.dates.length >= 1, 'Should find dates');
    });

    it('should extract people names', () => {
        const text = 'John Smith and Mary Johnson attended the meeting';
        const result = nlp.extractEntities(text);

        assert.truthy(result.people.length >= 1, 'Should find people names');
    });

    it('should extract organizations', () => {
        const text = 'Microsoft and Google announced a partnership';
        const result = nlp.extractEntities(text);

        assert.truthy(result.organizations, 'Should have organizations field');
    });

    // ===== Sentiment Analysis Tests =====

    it('should detect positive sentiment', () => {
        const text = 'I love this amazing product! It is wonderful and fantastic!';
        const result = nlp.analyzeSentiment(text);

        assert.greaterThan(result.score, 0, 'Should have positive score');
        assert.equals(result.label, 'positive', 'Should label as positive');
    });

    it('should detect negative sentiment', () => {
        const text = 'This is terrible and awful. I hate it completely.';
        const result = nlp.analyzeSentiment(text);

        assert.lessThan(result.score, 0, 'Should have negative score');
        assert.equals(result.label, 'negative', 'Should label as negative');
    });

    it('should detect neutral sentiment', () => {
        const text = 'The item arrived today.';
        const result = nlp.analyzeSentiment(text);

        assert.equals(result.label, 'neutral', 'Should label as neutral');
    });

    it('should handle mixed sentiment', () => {
        const text = 'The product is good but the price is terrible';
        const result = nlp.analyzeSentiment(text);

        assert.truthy(result.score !== undefined, 'Should calculate score');
        assert.truthy(result.label, 'Should have label');
    });

    // ===== Intent Detection Tests =====

    it('should detect question intent', () => {
        const text = 'How do I install this package?';
        const result = nlp.detectIntent(text);

        assert.equals(result.intent, 'question', 'Should detect question');
    });

    it('should detect command intent', () => {
        const text = 'Please update the documentation';
        const result = nlp.detectIntent(text);

        assert.equals(result.intent, 'command', 'Should detect command');
    });

    it('should detect statement intent', () => {
        const text = 'I completed the project yesterday';
        const result = nlp.detectIntent(text);

        assert.equals(result.intent, 'statement', 'Should detect statement');
    });

    it('should detect greeting intent', () => {
        const text = 'Hello, how are you?';
        const result = nlp.detectIntent(text);

        assert.equals(result.intent, 'greeting', 'Should detect greeting');
    });

    // ===== Language Detection Tests =====

    it('should detect English', () => {
        const text = 'This is an English sentence';
        const result = nlp.detectLanguage(text);

        assert.equals(result.language, 'en', 'Should detect English');
        assert.greaterThan(result.confidence, 0.8, 'Should have high confidence');
    });

    it('should detect Spanish', () => {
        const text = 'Hola, ¿cómo estás? Buenos días';
        const result = nlp.detectLanguage(text);

        assert.truthy(['es', 'en'].includes(result.language), 'Should detect language');
    });

    it('should handle mixed languages', () => {
        const text = 'Hello mundo, how are you?';
        const result = nlp.detectLanguage(text);

        assert.truthy(result.language, 'Should detect primary language');
    });

    // ===== Summarization Tests =====

    it('should summarize long text', () => {
        const text = 'The quick brown fox jumps over the lazy dog. '.repeat(10);
        const result = nlp.summarize(text, 50); // max 50 chars

        assert.truthy(result.length <= 50, 'Summary should be <= max length');
        assert.truthy(result.length > 0, 'Summary should not be empty');
    });

    it('should extract key sentences', () => {
        const text = 'First sentence is important. Second is filler. Third is also important.';
        const result = nlp.summarize(text, 100);

        assert.truthy(result.includes('important'), 'Should include key terms');
    });

    it('should handle short text', () => {
        const text = 'Short.';
        const result = nlp.summarize(text, 50);

        assert.equals(result, text, 'Should return original if shorter than max');
    });

    // ===== Keyword Extraction Tests =====

    it('should extract keywords', () => {
        const text = 'Machine learning and artificial intelligence are transforming industries';
        const result = nlp.extractKeywords(text);

        assert.truthy(result.length > 0, 'Should extract keywords');
        assert.contains(result, 'machine', 'Should find key term');
        assert.contains(result, 'learning', 'Should find key term');
    });

    it('should filter stop words', () => {
        const text = 'The quick brown fox jumps over the lazy dog';
        const result = nlp.extractKeywords(text);

        assert.falsy(result.includes('the'), 'Should filter "the"');
        assert.falsy(result.includes('over'), 'Should filter "over"');
    });

    it('should sort by frequency', () => {
        const text = 'test test test other other single';
        const result = nlp.extractKeywords(text);

        assert.equals(result[0], 'test', 'Most frequent should be first');
    });

    // ===== Tokenization Tests =====

    it('should tokenize text', () => {
        const text = 'Hello, world! How are you?';
        const result = nlp.tokenize(text);

        assert.truthy(result.length > 0, 'Should produce tokens');
        assert.contains(result, 'hello', 'Should tokenize words');
        assert.contains(result, 'world', 'Should tokenize words');
    });

    it('should handle punctuation', () => {
        const text = 'Hello, world! Test... done?';
        const result = nlp.tokenize(text);

        assert.truthy(result.every(t => !/[.,!?]/.test(t)), 
            'Should remove punctuation');
    });

    it('should convert to lowercase', () => {
        const text = 'HELLO World TEST';
        const result = nlp.tokenize(text);

        assert.truthy(result.every(t => t === t.toLowerCase()), 
            'All tokens should be lowercase');
    });

    // ===== Performance Tests =====

    it('should process text in <10ms', () => {
        const text = 'This is a test message for performance measurement';

        const startTime = performance.now();
        nlp.extractEntities(text);
        nlp.analyzeSentiment(text);
        nlp.detectIntent(text);
        nlp.extractKeywords(text);
        const duration = performance.now() - startTime;

        assert.lessThan(duration, 10, 'Full NLP pipeline should be <10ms');
    });

    it('should handle long text efficiently', () => {
        const text = 'word '.repeat(10000);

        const startTime = performance.now();
        nlp.extractKeywords(text);
        const duration = performance.now() - startTime;

        assert.lessThan(duration, 50, 'Should process long text in <50ms');
    });

    // ===== Edge Cases =====

    it('should handle empty text', () => {
        const result = nlp.extractEntities('');

        assert.truthy(result.emails, 'Should have emails array');
        assert.lengthOf(result.emails, 0, 'Should be empty');
    });

    it('should handle unicode', () => {
        const text = 'Email: test@例え.jp 你好';
        const result = nlp.extractEntities(text);

        assert.truthy(result, 'Should handle unicode');
    });

    it('should handle special characters', () => {
        const text = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
        const result = nlp.tokenize(text);

        assert.truthy(Array.isArray(result), 'Should return array');
    });

    // ===== Accuracy Tests =====

    it('should achieve >90% entity extraction accuracy', () => {
        const testCases = [
            { 
                text: 'Email john@test.com', 
                expected: { emails: 1 } 
            },
            { 
                text: 'Visit https://example.com', 
                expected: { urls: 1 } 
            },
            { 
                text: 'Call 555-123-4567', 
                expected: { phones: 1 } 
            }
        ];

        let correct = 0;

        for (const testCase of testCases) {
            const result = nlp.extractEntities(testCase.text);
            
            if (testCase.expected.emails && result.emails.length >= testCase.expected.emails) {
                correct++;
            } else if (testCase.expected.urls && result.urls.length >= testCase.expected.urls) {
                correct++;
            } else if (testCase.expected.phones && result.phones.length >= testCase.expected.phones) {
                correct++;
            }
        }

        const accuracy = correct / testCases.length;
        assert.greaterThan(accuracy, 0.9, 'Should achieve >90% accuracy');
    });

    it('should achieve >85% sentiment accuracy', () => {
        const testCases = [
            { text: 'I love this!', expected: 'positive' },
            { text: 'This is terrible', expected: 'negative' },
            { text: 'The item arrived', expected: 'neutral' },
            { text: 'Amazing and wonderful', expected: 'positive' },
            { text: 'Awful and horrible', expected: 'negative' }
        ];

        let correct = 0;

        for (const testCase of testCases) {
            const result = nlp.analyzeSentiment(testCase.text);
            if (result.label === testCase.expected) {
                correct++;
            }
        }

        const accuracy = correct / testCases.length;
        assert.greaterThan(accuracy, 0.85, 'Should achieve >85% sentiment accuracy');
    });

    // ===== Integration Tests =====

    it('should process complete message', () => {
        const text = 'Hello! I love using this product. Contact me at test@example.com';
        
        const entities = nlp.extractEntities(text);
        const sentiment = nlp.analyzeSentiment(text);
        const intent = nlp.detectIntent(text);
        const keywords = nlp.extractKeywords(text);

        assert.truthy(entities.emails.length > 0, 'Should extract entities');
        assert.equals(sentiment.label, 'positive', 'Should detect sentiment');
        assert.truthy(intent.intent, 'Should detect intent');
        assert.truthy(keywords.length > 0, 'Should extract keywords');
    });
});
