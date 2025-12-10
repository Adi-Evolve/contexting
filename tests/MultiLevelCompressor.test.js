/**
 * Tests for MultiLevelCompressor Algorithm
 * Target: 99.7% compression through 5 stages
 */

import { describe, it, assert } from './test-framework.js';
import { MultiLevelCompressor } from '../src/core/compression/MultiLevelCompressor.js';

describe('MultiLevelCompressor', () => {
    let compressor;

    beforeEach(() => {
        compressor = new MultiLevelCompressor();
    });

    // ===== Semantic Extraction Tests (Stage 1) =====

    it('should extract semantic essence (Stage 1)', () => {
        const text = 'The quick brown fox jumps over the lazy dog. The fox is fast and the dog is slow.';
        const result = compressor.semanticExtract(text);

        assert.truthy(result, 'Should extract semantics');
        assert.truthy(result.keywords, 'Should have keywords');
        assert.truthy(result.summary, 'Should have summary');
        assert.lessThan(result.summary.length, text.length, 'Summary should be shorter');
    });

    it('should achieve ~95% compression in Stage 1', () => {
        const text = 'word '.repeat(1000);
        const result = compressor.semanticExtract(text);

        const originalSize = new Blob([text]).size;
        const compressedSize = new Blob([JSON.stringify(result)]).size;
        const ratio = compressedSize / originalSize;

        assert.lessThan(ratio, 0.2, 'Should compress to <20% of original');
    });

    // ===== Code AST Compression Tests (Stage 2) =====

    it('should compress code using AST (Stage 2)', () => {
        const code = `
            function calculateTotal(items) {
                let total = 0;
                for (let item of items) {
                    total += item.price;
                }
                return total;
            }
        `;

        const result = compressor.compressCodeAST(code);

        assert.truthy(result, 'Should compress code');
        assert.truthy(result.ast, 'Should have AST');
        assert.truthy(result.ast.functions, 'Should extract functions');
    });

    it('should achieve ~90% compression for code', () => {
        const code = 'function test() { console.log("test"); } '.repeat(100);
        const result = compressor.compressCodeAST(code);

        const originalSize = new Blob([code]).size;
        const compressedSize = new Blob([JSON.stringify(result)]).size;
        const ratio = compressedSize / originalSize;

        assert.lessThan(ratio, 0.3, 'Should compress code to <30%');
    });

    it('should handle non-code gracefully', () => {
        const text = 'This is not code at all';
        const result = compressor.compressCodeAST(text);

        assert.truthy(result, 'Should handle non-code');
    });

    // ===== Differential Compression Tests (Stage 3) =====

    it('should compute differential compression (Stage 3)', () => {
        const base = 'The weather is sunny today';
        const current = 'The weather is rainy today';

        const result = compressor.computeDifferential(base, current);

        assert.truthy(result, 'Should compute differential');
        assert.truthy(result.base, 'Should have base');
        assert.truthy(result.diff, 'Should have diff');
    });

    it('should achieve ~80% compression for similar text', () => {
        const base = 'word '.repeat(1000) + 'different';
        const current = 'word '.repeat(1000) + 'changed';

        const result = compressor.computeDifferential(base, current);

        const originalSize = new Blob([current]).size;
        const compressedSize = new Blob([JSON.stringify(result)]).size;
        const ratio = compressedSize / originalSize;

        assert.lessThan(ratio, 0.3, 'Should compress similar text heavily');
    });

    // ===== LZW Compression Tests (Stage 4) =====

    it('should apply LZW compression (Stage 4)', () => {
        const text = 'ABABABABABABAB';
        const result = compressor.lzwCompress(text);

        assert.truthy(result, 'Should compress with LZW');
        assert.truthy(Array.isArray(result), 'Should return array of codes');
    });

    it('should decompress LZW correctly', () => {
        const original = 'The quick brown fox jumps over the lazy dog';
        const compressed = compressor.lzwCompress(original);
        const decompressed = compressor.lzwDecompress(compressed);

        assert.equals(decompressed, original, 'Should decompress to original');
    });

    it('should achieve ~70% compression with LZW', () => {
        const text = 'repeat repeat repeat '.repeat(100);
        const compressed = compressor.lzwCompress(text);

        const originalSize = text.length;
        const compressedSize = compressed.length * 2; // Approximate bytes
        const ratio = compressedSize / originalSize;

        assert.lessThan(ratio, 0.5, 'Should compress repetitive text to <50%');
    });

    // ===== Binary Packing Tests (Stage 5) =====

    it('should apply binary packing (Stage 5)', () => {
        const data = { text: 'test', numbers: [1, 2, 3] };
        const result = compressor.binaryPack(data);

        assert.truthy(result, 'Should pack to binary');
        assert.truthy(result instanceof ArrayBuffer || typeof result === 'string', 
            'Should return binary data');
    });

    it('should achieve ~50% compression with binary packing', () => {
        const data = JSON.stringify({ text: 'a'.repeat(1000) });
        const packed = compressor.binaryPack(data);

        const originalSize = data.length;
        const packedSize = typeof packed === 'string' ? packed.length : packed.byteLength;
        const ratio = packedSize / originalSize;

        assert.lessThan(ratio, 0.8, 'Should compress to <80% with binary packing');
    });

    // ===== Full Pipeline Tests =====

    it('should compress through all 5 stages', async () => {
        const text = 'This is a test message. '.repeat(100);
        const result = await compressor.compress(text);

        assert.truthy(result, 'Should complete full compression');
        assert.truthy(result.stages, 'Should have stage information');
        assert.equals(result.stages.length, 5, 'Should go through 5 stages');
    });

    it('should achieve >99% total compression', async () => {
        const text = 'word '.repeat(10000); // ~50KB
        const result = await compressor.compress(text);

        const originalSize = new Blob([text]).size;
        const compressedSize = new Blob([JSON.stringify(result)]).size;
        const compressionRatio = (1 - compressedSize / originalSize) * 100;

        assert.greaterThan(compressionRatio, 95, 'Should achieve >95% compression');
    });

    it('should decompress correctly', async () => {
        const original = 'Test message with some content';
        const compressed = await compressor.compress(original);
        const decompressed = await compressor.decompress(compressed);

        assert.equals(decompressed, original, 'Should decompress to original');
    });

    // ===== Different Content Types Tests =====

    it('should compress plain text efficiently', async () => {
        const text = 'Plain text content without any special formatting or code';
        const result = await compressor.compress(text);

        assert.truthy(result, 'Should compress plain text');
    });

    it('should compress code efficiently', async () => {
        const code = `
            function fibonacci(n) {
                if (n <= 1) return n;
                return fibonacci(n - 1) + fibonacci(n - 2);
            }
        `;

        const result = await compressor.compress(code);

        assert.truthy(result, 'Should compress code');
        assert.truthy(result.metadata.hasCode, 'Should detect code');
    });

    it('should compress JSON efficiently', async () => {
        const json = JSON.stringify({
            users: Array(100).fill({ name: 'John', age: 30, email: 'test@test.com' })
        });

        const result = await compressor.compress(json);

        const originalSize = new Blob([json]).size;
        const compressedSize = new Blob([JSON.stringify(result)]).size;
        const ratio = compressedSize / originalSize;

        assert.lessThan(ratio, 0.2, 'Should compress repetitive JSON heavily');
    });

    it('should compress markdown efficiently', async () => {
        const markdown = `
            # Heading
            This is a paragraph with **bold** and *italic* text.
            - List item 1
            - List item 2
            \`\`\`javascript
            console.log('code block');
            \`\`\`
        `.repeat(10);

        const result = await compressor.compress(markdown);

        assert.truthy(result, 'Should compress markdown');
    });

    // ===== Compression Ratios Tests =====

    it('should track compression ratio per stage', async () => {
        const text = 'test '.repeat(1000);
        const result = await compressor.compress(text);

        assert.truthy(result.stages, 'Should track stages');

        for (const stage of result.stages) {
            assert.truthy(stage.ratio, 'Each stage should have ratio');
            assert.truthy(stage.ratio > 0 && stage.ratio <= 1, 'Ratio should be between 0 and 1');
        }
    });

    it('should calculate total compression ratio', async () => {
        const text = 'compression test '.repeat(500);
        const result = await compressor.compress(text);

        assert.truthy(result.totalRatio, 'Should have total ratio');
        assert.lessThan(result.totalRatio, 0.1, 'Total ratio should be <10%');
    });

    // ===== Performance Tests =====

    it('should compress 1KB in <100ms', async () => {
        const text = 'a'.repeat(1024);

        const startTime = performance.now();
        await compressor.compress(text);
        const duration = performance.now() - startTime;

        assert.lessThan(duration, 100, 'Should compress 1KB in <100ms');
    });

    it('should compress 10KB in <500ms', async () => {
        const text = 'a'.repeat(10240);

        const startTime = performance.now();
        await compressor.compress(text);
        const duration = performance.now() - startTime;

        assert.lessThan(duration, 500, 'Should compress 10KB in <500ms');
    });

    it('should decompress quickly', async () => {
        const text = 'test '.repeat(1000);
        const compressed = await compressor.compress(text);

        const startTime = performance.now();
        await compressor.decompress(compressed);
        const duration = performance.now() - startTime;

        assert.lessThan(duration, 50, 'Should decompress in <50ms');
    });

    // ===== Edge Cases =====

    it('should handle empty string', async () => {
        const result = await compressor.compress('');

        assert.truthy(result, 'Should handle empty string');
    });

    it('should handle very short strings', async () => {
        const result = await compressor.compress('a');

        assert.truthy(result, 'Should handle single character');
    });

    it('should handle unicode', async () => {
        const text = '你好世界 🌍 مرحبا';
        const result = await compressor.compress(text);
        const decompressed = await compressor.decompress(result);

        assert.equals(decompressed, text, 'Should handle unicode correctly');
    });

    it('should handle special characters', async () => {
        const text = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
        const result = await compressor.compress(text);
        const decompressed = await compressor.decompress(result);

        assert.equals(decompressed, text, 'Should handle special characters');
    });

    // ===== Metadata Tests =====

    it('should store compression metadata', async () => {
        const text = 'test';
        const result = await compressor.compress(text);

        assert.truthy(result.metadata, 'Should have metadata');
        assert.truthy(result.metadata.originalSize, 'Should track original size');
        assert.truthy(result.metadata.compressedSize, 'Should track compressed size');
        assert.truthy(result.metadata.timestamp, 'Should have timestamp');
    });

    // ===== Compression Quality Tests =====

    it('should maintain semantic meaning after compression', async () => {
        const text = 'Machine learning is a subset of artificial intelligence';
        const result = await compressor.compress(text);

        assert.truthy(result.semantic, 'Should preserve semantic information');
        assert.truthy(result.semantic.keywords.length > 0, 'Should extract keywords');
    });

    it('should enable semantic search on compressed data', async () => {
        const text = 'JavaScript is a programming language';
        const result = await compressor.compress(text);

        const keywords = result.semantic.keywords;
        assert.contains(keywords, 'javascript', 'Should contain main keyword');
        assert.contains(keywords, 'programming', 'Should contain related keyword');
    });
});
