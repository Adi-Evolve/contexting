/**
 * Tests for SemanticFingerprint Algorithm
 * Target: 99.9% accuracy for concept matching
 */

import { describe, it, assert } from './test-framework.js';
import { SemanticFingerprint } from '../src/core/intelligence/SemanticFingerprint.js';

describe('SemanticFingerprint', () => {
    const fingerprint = new SemanticFingerprint();

    // ===== Fingerprint Generation Tests =====
    
    it('should generate consistent fingerprints for same text', () => {
        const text = 'Machine learning is a subset of artificial intelligence';
        const fp1 = fingerprint.generate(text);
        const fp2 = fingerprint.generate(text);
        
        assert.deepEquals(fp1, fp2, 'Same text should produce identical fingerprints');
    });

    it('should generate different fingerprints for different texts', () => {
        const text1 = 'Machine learning is powerful';
        const text2 = 'Quantum computing is fascinating';
        
        const fp1 = fingerprint.generate(text1);
        const fp2 = fingerprint.generate(text2);
        
        assert.notEquals(
            JSON.stringify(fp1), 
            JSON.stringify(fp2), 
            'Different texts should produce different fingerprints'
        );
    });

    it('should generate fingerprint with correct structure', () => {
        const text = 'Natural language processing';
        const fp = fingerprint.generate(text);
        
        assert.truthy(fp.hash, 'Fingerprint should have hash');
        assert.truthy(fp.terms, 'Fingerprint should have terms');
        assert.truthy(fp.buckets, 'Fingerprint should have buckets');
        assert.truthy(Array.isArray(fp.buckets), 'Buckets should be an array');
        assert.truthy(fp.buckets.length > 0, 'Should have non-empty buckets');
    });

    it('should handle empty text gracefully', () => {
        const fp = fingerprint.generate('');
        
        assert.truthy(fp, 'Should return fingerprint for empty text');
        assert.truthy(fp.buckets, 'Should have buckets property');
    });

    it('should handle very long text', () => {
        const longText = 'word '.repeat(10000);
        const fp = fingerprint.generate(longText);
        
        assert.truthy(fp, 'Should handle long text');
        assert.truthy(fp.buckets.length <= 1000, 'Buckets should be bounded');
    });

    // ===== Similarity Calculation Tests =====

    it('should return 100% similarity for identical texts', () => {
        const text = 'Deep learning neural networks';
        const fp1 = fingerprint.generate(text);
        const fp2 = fingerprint.generate(text);
        
        const similarity = fingerprint.similarity(fp1, fp2);
        
        assert.equals(similarity, 1.0, 'Identical texts should have 1.0 similarity');
    });

    it('should return 0% similarity for completely different texts', () => {
        const text1 = 'aaa bbb ccc ddd eee fff';
        const text2 = 'xxx yyy zzz www qqq ppp';
        
        const fp1 = fingerprint.generate(text1);
        const fp2 = fingerprint.generate(text2);
        
        const similarity = fingerprint.similarity(fp1, fp2);
        
        assert.lessThan(similarity, 0.1, 'Completely different texts should have very low similarity');
    });

    it('should detect high similarity for paraphrased content', () => {
        const text1 = 'Machine learning is a method of data analysis that automates analytical model building';
        const text2 = 'Data analysis automation through analytical model construction is what machine learning does';
        
        const fp1 = fingerprint.generate(text1);
        const fp2 = fingerprint.generate(text2);
        
        const similarity = fingerprint.similarity(fp1, fp2);
        
        assert.greaterThan(similarity, 0.5, 'Paraphrased content should have >50% similarity');
    });

    it('should detect medium similarity for related topics', () => {
        const text1 = 'Python is a programming language for data science';
        const text2 = 'JavaScript is a programming language for web development';
        
        const fp1 = fingerprint.generate(text1);
        const fp2 = fingerprint.generate(text2);
        
        const similarity = fingerprint.similarity(fp1, fp2);
        
        assert.inRange(similarity, 0.2, 0.6, 'Related topics should have moderate similarity');
    });

    // ===== Accuracy Benchmark Tests =====

    it('should achieve >95% accuracy on synonym matching', () => {
        const pairs = [
            ['happy joyful glad cheerful', 'joyful glad happy cheerful'],
            ['big large huge enormous', 'large huge big enormous'],
            ['fast quick rapid swift', 'quick rapid fast swift'],
            ['smart intelligent clever bright', 'intelligent clever smart bright']
        ];

        let accurateMatches = 0;
        
        for (const [text1, text2] of pairs) {
            const fp1 = fingerprint.generate(text1);
            const fp2 = fingerprint.generate(text2);
            const similarity = fingerprint.similarity(fp1, fp2);
            
            if (similarity > 0.95) accurateMatches++;
        }

        const accuracy = accurateMatches / pairs.length;
        assert.greaterThan(accuracy, 0.95, 'Should achieve >95% accuracy on synonyms');
    });

    it('should achieve >90% accuracy on semantic similarity', () => {
        const testCases = [
            {
                text1: 'I love programming in Python',
                text2: 'Python programming is my passion',
                expectedSimilar: true
            },
            {
                text1: 'The weather is sunny today',
                text2: 'It is raining heavily now',
                expectedSimilar: false
            },
            {
                text1: 'Artificial intelligence is transforming industries',
                text2: 'AI is revolutionizing business sectors',
                expectedSimilar: true
            },
            {
                text1: 'I enjoy reading books',
                text2: 'Books are my favorite hobby',
                expectedSimilar: true
            },
            {
                text1: 'The cat sat on the mat',
                text2: 'Quantum physics is complex',
                expectedSimilar: false
            }
        ];

        let correct = 0;
        
        for (const testCase of testCases) {
            const fp1 = fingerprint.generate(testCase.text1);
            const fp2 = fingerprint.generate(testCase.text2);
            const similarity = fingerprint.similarity(fp1, fp2);
            
            const predicted = similarity > 0.5;
            
            if (predicted === testCase.expectedSimilar) {
                correct++;
            }
        }

        const accuracy = correct / testCases.length;
        assert.greaterThan(accuracy, 0.90, 'Should achieve >90% accuracy on semantic similarity');
    });

    // ===== Performance Tests =====

    it('should generate fingerprint in <1ms', () => {
        const text = 'Machine learning algorithms process data efficiently';
        
        const startTime = performance.now();
        fingerprint.generate(text);
        const duration = performance.now() - startTime;
        
        assert.lessThan(duration, 1, 'Fingerprint generation should be <1ms');
    });

    it('should calculate similarity in <1ms', () => {
        const fp1 = fingerprint.generate('First test text');
        const fp2 = fingerprint.generate('Second test text');
        
        const startTime = performance.now();
        fingerprint.similarity(fp1, fp2);
        const duration = performance.now() - startTime;
        
        assert.lessThan(duration, 1, 'Similarity calculation should be <1ms');
    });

    it('should handle batch operations efficiently', () => {
        const texts = Array(100).fill(0).map((_, i) => `Test message number ${i}`);
        
        const startTime = performance.now();
        const fingerprints = texts.map(t => fingerprint.generate(t));
        const duration = performance.now() - startTime;
        
        assert.lessThan(duration, 100, '100 fingerprints should be generated in <100ms');
        assert.lengthOf(fingerprints, 100, 'Should generate all fingerprints');
    });

    // ===== Edge Cases =====

    it('should handle special characters', () => {
        const text = 'Test!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
        const fp = fingerprint.generate(text);
        
        assert.truthy(fp, 'Should handle special characters');
        assert.truthy(fp.buckets, 'Should have buckets');
    });

    it('should handle unicode and emojis', () => {
        const text = 'Hello 世界 🌍 🚀 Testing unicode';
        const fp = fingerprint.generate(text);
        
        assert.truthy(fp, 'Should handle unicode and emojis');
    });

    it('should handle numeric content', () => {
        const text = '123 456 789 numbers only';
        const fp = fingerprint.generate(text);
        
        assert.truthy(fp, 'Should handle numeric content');
    });

    it('should be case-insensitive', () => {
        const text1 = 'Machine Learning';
        const text2 = 'machine learning';
        
        const fp1 = fingerprint.generate(text1);
        const fp2 = fingerprint.generate(text2);
        
        const similarity = fingerprint.similarity(fp1, fp2);
        
        assert.greaterThan(similarity, 0.95, 'Should be case-insensitive');
    });

    // ===== Storage Efficiency Tests =====

    it('should produce compact fingerprints (<100 bytes)', () => {
        const text = 'This is a test message for storage efficiency';
        const fp = fingerprint.generate(text);
        
        const serialized = JSON.stringify(fp);
        const bytes = new Blob([serialized]).size;
        
        assert.lessThan(bytes, 100, 'Fingerprint should be <100 bytes');
    });

    it('should be much smaller than embedding vectors', () => {
        const text = 'Test message for size comparison';
        const fp = fingerprint.generate(text);
        
        const fpSize = new Blob([JSON.stringify(fp)]).size;
        const embeddingSize = 1536 * 4; // 1536 floats * 4 bytes
        
        assert.lessThan(fpSize, embeddingSize / 10, 'Fingerprint should be <10% of embedding size');
    });

    // ===== Integration Tests =====

    it('should work with search functionality', () => {
        const messages = [
            'I love coding in JavaScript',
            'Python is great for data science',
            'Machine learning with TensorFlow',
            'Web development with React',
            'Database design with PostgreSQL'
        ];

        const fingerprints = messages.map(m => fingerprint.generate(m));
        const query = fingerprint.generate('I enjoy programming in JavaScript');

        const results = fingerprints.map((fp, i) => ({
            message: messages[i],
            similarity: fingerprint.similarity(query, fp)
        })).sort((a, b) => b.similarity - a.similarity);

        assert.equals(results[0].message, messages[0], 'Should find most similar message');
        assert.greaterThan(results[0].similarity, 0.5, 'Top result should have high similarity');
    });
});
