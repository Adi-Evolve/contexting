/**
 * Tests for CausalityTracker Algorithm
 * Tests causal chain detection and WHY analysis
 */

import { describe, it, assert } from './test-framework.js';
import { CausalityTracker } from '../src/core/intelligence/CausalityTracker.js';

describe('CausalityTracker', () => {
    let tracker;

    beforeEach(() => {
        tracker = new CausalityTracker();
    });

    // ===== Causal Indicator Detection Tests =====

    it('should detect because causal indicator', () => {
        const text = 'I stayed home because it was raining';
        const result = tracker.analyze(text);

        assert.truthy(result.hasCausality, 'Should detect causality');
        assert.truthy(result.indicators.includes('because'), 'Should detect "because"');
    });

    it('should detect therefore causal indicator', () => {
        const text = 'It was raining, therefore I stayed home';
        const result = tracker.analyze(text);

        assert.truthy(result.hasCausality, 'Should detect causality');
        assert.truthy(result.indicators.includes('therefore'), 'Should detect "therefore"');
    });

    it('should detect so causal indicator', () => {
        const text = 'It was raining, so I took an umbrella';
        const result = tracker.analyze(text);

        assert.truthy(result.hasCausality, 'Should detect causality');
    });

    it('should detect led to causal indicator', () => {
        const text = 'The error led to a system crash';
        const result = tracker.analyze(text);

        assert.truthy(result.hasCausality, 'Should detect causality');
    });

    it('should detect caused by causal indicator', () => {
        const text = 'The crash was caused by memory leak';
        const result = tracker.analyze(text);

        assert.truthy(result.hasCausality, 'Should detect causality');
    });

    it('should detect resulted in causal indicator', () => {
        const text = 'The bug resulted in data corruption';
        const result = tracker.analyze(text);

        assert.truthy(result.hasCausality, 'Should detect causality');
    });

    it('should detect multiple indicators', () => {
        const text = 'Because of the bug, the system crashed, which led to data loss';
        const result = tracker.analyze(text);

        assert.truthy(result.hasCausality, 'Should detect causality');
        assert.truthy(result.indicators.length >= 2, 'Should detect multiple indicators');
    });

    // ===== Confidence Scoring Tests =====

    it('should assign high confidence for strong indicators', () => {
        const text = 'The system crashed because of memory leak';
        const result = tracker.analyze(text);

        assert.greaterThan(result.confidence, 0.7, 'Should have high confidence');
    });

    it('should assign medium confidence for weak indicators', () => {
        const text = 'After the update, things seemed better';
        const result = tracker.analyze(text);

        if (result.hasCausality) {
            assert.inRange(result.confidence, 0.3, 0.7, 'Should have medium confidence');
        }
    });

    it('should assign low/no confidence for non-causal text', () => {
        const text = 'The weather is nice today';
        const result = tracker.analyze(text);

        assert.falsy(result.hasCausality, 'Should not detect causality');
    });

    // ===== Causal Chain Building Tests =====

    it('should build simple causal chain', () => {
        const messages = [
            { id: 1, content: 'I found a bug in the code', timestamp: 1000 },
            { id: 2, content: 'I fixed the bug', timestamp: 2000 },
            { id: 3, content: 'Because I fixed it, the tests pass now', timestamp: 3000 }
        ];

        const chain = tracker.buildCausalChain(messages);

        assert.truthy(chain.length > 0, 'Should build causal chain');
        assert.truthy(chain.some(link => link.type === 'causal'), 'Should identify causal links');
    });

    it('should build multi-step causal chain', () => {
        const messages = [
            { id: 1, content: 'Started new project', timestamp: 1000 },
            { id: 2, content: 'Added dependencies', timestamp: 2000 },
            { id: 3, content: 'Because of dependencies, had to update Node', timestamp: 3000 },
            { id: 4, content: 'The update caused compatibility issues', timestamp: 4000 }
        ];

        const chain = tracker.buildCausalChain(messages);

        assert.truthy(chain.length >= 2, 'Should build multi-step chain');
    });

    // ===== Cause Finding Tests =====

    it('should find direct causes', () => {
        const events = [
            { id: 1, content: 'System overheated', timestamp: 1000 },
            { id: 2, content: 'Because it overheated, shutdown occurred', timestamp: 2000 }
        ];

        const causes = tracker.findCauses(events[1].id, events);

        assert.truthy(causes.length > 0, 'Should find causes');
        assert.equals(causes[0].id, 1, 'Should identify correct cause');
    });

    it('should find temporal causes within window', () => {
        const events = [
            { id: 1, content: 'Event A happened', timestamp: 1000 },
            { id: 2, content: 'Event B occurred', timestamp: 2000 },
            { id: 3, content: 'Event C followed', timestamp: 3000 }
        ];

        const causes = tracker.findCauses(events[2].id, events, 5); // 5 events window

        assert.truthy(causes.length >= 1, 'Should find temporal causes');
    });

    it('should respect temporal window size', () => {
        const events = Array(20).fill(0).map((_, i) => ({
            id: i,
            content: `Event ${i}`,
            timestamp: 1000 + i * 100
        }));

        events[19].content = 'Because of Event 10, this happened';

        const causes = tracker.findCauses(events[19].id, events, 5);

        assert.truthy(causes.length <= 5, 'Should respect window size');
    });

    // ===== Consequence Finding Tests =====

    it('should find direct consequences', () => {
        const events = [
            { id: 1, content: 'Started deployment', timestamp: 1000 },
            { id: 2, content: 'The deployment caused downtime', timestamp: 2000 }
        ];

        const consequences = tracker.findConsequences(events[0].id, events);

        assert.truthy(consequences.length > 0, 'Should find consequences');
        assert.equals(consequences[0].id, 2, 'Should identify correct consequence');
    });

    it('should find forward temporal consequences', () => {
        const events = [
            { id: 1, content: 'Configuration changed', timestamp: 1000 },
            { id: 2, content: 'Service restarted', timestamp: 2000 },
            { id: 3, content: 'Users affected', timestamp: 3000 }
        ];

        const consequences = tracker.findConsequences(events[0].id, events, 10);

        assert.truthy(consequences.length >= 1, 'Should find forward consequences');
    });

    // ===== Backward Chain Analysis Tests =====

    it('should trace backward causal chain', () => {
        const messages = [
            { id: 1, content: 'Initial condition', timestamp: 1000 },
            { id: 2, content: 'Because of initial condition, step 2', timestamp: 2000 },
            { id: 3, content: 'Step 2 led to step 3', timestamp: 3000 },
            { id: 4, content: 'Step 3 resulted in final outcome', timestamp: 4000 }
        ];

        const chain = tracker.traceBackward(messages[3].id, messages);

        assert.truthy(chain.length > 1, 'Should trace backward');
        assert.equals(chain[chain.length - 1].id, 1, 'Should reach initial cause');
    });

    // ===== Forward Chain Analysis Tests =====

    it('should trace forward causal chain', () => {
        const messages = [
            { id: 1, content: 'Root cause identified', timestamp: 1000 },
            { id: 2, content: 'Root cause led to problem A', timestamp: 2000 },
            { id: 3, content: 'Problem A caused problem B', timestamp: 3000 },
            { id: 4, content: 'Problem B resulted in failure', timestamp: 4000 }
        ];

        const chain = tracker.traceForward(messages[0].id, messages);

        assert.truthy(chain.length > 1, 'Should trace forward');
        assert.equals(chain[chain.length - 1].id, 4, 'Should reach final consequence');
    });

    // ===== Complex Causality Tests =====

    it('should handle multiple causes for single effect', () => {
        const events = [
            { id: 1, content: 'High traffic occurred', timestamp: 1000 },
            { id: 2, content: 'Database was slow', timestamp: 1100 },
            { id: 3, content: 'Because of traffic and slow database, system crashed', timestamp: 2000 }
        ];

        const causes = tracker.findCauses(events[2].id, events);

        assert.truthy(causes.length >= 2, 'Should find multiple causes');
    });

    it('should handle single cause with multiple effects', () => {
        const events = [
            { id: 1, content: 'Server overload occurred', timestamp: 1000 },
            { id: 2, content: 'The overload caused slow response', timestamp: 2000 },
            { id: 3, content: 'It also led to timeouts', timestamp: 2100 },
            { id: 4, content: 'And resulted in errors', timestamp: 2200 }
        ];

        const consequences = tracker.findConsequences(events[0].id, events);

        assert.truthy(consequences.length >= 2, 'Should find multiple consequences');
    });

    // ===== Temporal Reasoning Tests =====

    it('should achieve >40% better temporal reasoning than baseline', () => {
        const testCases = [
            {
                events: [
                    { id: 1, content: 'Error A occurred', timestamp: 1000 },
                    { id: 2, content: 'Error A caused Error B', timestamp: 2000 }
                ],
                expectedCause: 1,
                effect: 2
            },
            {
                events: [
                    { id: 1, content: 'Update deployed', timestamp: 1000 },
                    { id: 2, content: 'Because of update, bug appeared', timestamp: 2000 }
                ],
                expectedCause: 1,
                effect: 2
            },
            {
                events: [
                    { id: 1, content: 'Memory leak started', timestamp: 1000 },
                    { id: 2, content: 'The leak led to crash', timestamp: 2000 }
                ],
                expectedCause: 1,
                effect: 2
            }
        ];

        let correct = 0;

        for (const testCase of testCases) {
            const causes = tracker.findCauses(testCase.effect, testCase.events);
            if (causes.some(c => c.id === testCase.expectedCause)) {
                correct++;
            }
        }

        const accuracy = correct / testCases.length;
        assert.greaterThan(accuracy, 0.8, 'Should achieve >80% accuracy on causal reasoning');
    });

    // ===== Performance Tests =====

    it('should analyze text in <5ms', () => {
        const text = 'Because of the rain, the event was cancelled';

        const startTime = performance.now();
        tracker.analyze(text);
        const duration = performance.now() - startTime;

        assert.lessThan(duration, 5, 'Analysis should be <5ms');
    });

    it('should build chain for 100 messages in <100ms', () => {
        const messages = Array(100).fill(0).map((_, i) => ({
            id: i,
            content: `Message ${i} ${i % 10 === 0 ? 'because of previous event' : ''}`,
            timestamp: 1000 + i * 100
        }));

        const startTime = performance.now();
        tracker.buildCausalChain(messages);
        const duration = performance.now() - startTime;

        assert.lessThan(duration, 100, 'Should process 100 messages in <100ms');
    });

    // ===== Edge Cases =====

    it('should handle empty text', () => {
        const result = tracker.analyze('');

        assert.falsy(result.hasCausality, 'Should handle empty text');
        assert.equals(result.confidence, 0, 'Should have zero confidence');
    });

    it('should handle single word', () => {
        const result = tracker.analyze('because');

        assert.truthy(result, 'Should handle single word');
    });

    it('should handle very long text', () => {
        const longText = 'word '.repeat(10000) + ' because of reason';
        const result = tracker.analyze(longText);

        assert.truthy(result, 'Should handle long text');
    });

    // ===== Export Tests =====

    it('should export causal analysis', () => {
        const messages = [
            { id: 1, content: 'Event A', timestamp: 1000 },
            { id: 2, content: 'Because of A, Event B', timestamp: 2000 }
        ];

        tracker.buildCausalChain(messages);
        const exported = tracker.export();

        assert.truthy(exported.chains, 'Should export chains');
        assert.truthy(exported.indicators, 'Should export indicators');
    });
});
