/**
 * Lightweight Test Framework for MemoryForge
 * Zero dependencies, browser-native testing
 */

export class TestFramework {
    static instance = null;

    constructor() {
        this.suites = [];
        this.currentSuite = null;
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            duration: 0,
            coverage: 0
        };
    }

    static getInstance() {
        if (!TestFramework.instance) {
            TestFramework.instance = new TestFramework();
        }
        return TestFramework.instance;
    }

    describe(name, fn) {
        this.currentSuite = {
            name,
            tests: [],
            passed: 0,
            failed: 0,
            skipped: 0,
            total: 0
        };
        
        fn();
        
        this.suites.push(this.currentSuite);
        this.currentSuite = null;
    }

    it(name, fn) {
        if (!this.currentSuite) {
            throw new Error('it() must be called inside describe()');
        }

        this.currentSuite.tests.push({
            name,
            fn,
            status: 'pending',
            error: null,
            duration: 0
        });
        this.currentSuite.total++;
        this.results.total++;
    }

    async runAll() {
        console.log('🧪 Running all tests...\n');
        const startTime = performance.now();

        for (const suite of this.suites) {
            console.log(`\n📦 ${suite.name}`);
            
            for (const test of suite.tests) {
                await this.runTest(suite, test);
            }
        }

        this.results.duration = Math.round(performance.now() - startTime);
        this.calculateCoverage();
        this.printSummary();
    }

    async runTest(suite, test) {
        const startTime = performance.now();
        
        try {
            await test.fn();
            test.status = 'pass';
            test.duration = Math.round(performance.now() - startTime);
            suite.passed++;
            this.results.passed++;
            console.log(`  ✅ ${test.name} (${test.duration}ms)`);
        } catch (error) {
            test.status = 'fail';
            test.duration = Math.round(performance.now() - startTime);
            test.error = error.message + '\n' + error.stack;
            suite.failed++;
            this.results.failed++;
            console.error(`  ❌ ${test.name} (${test.duration}ms)`);
            console.error(`     ${error.message}`);
        }
    }

    async runFailed() {
        console.log('🔄 Re-running failed tests...\n');
        const startTime = performance.now();

        for (const suite of this.suites) {
            const failedTests = suite.tests.filter(t => t.status === 'fail');
            
            if (failedTests.length > 0) {
                console.log(`\n📦 ${suite.name}`);
                
                for (const test of failedTests) {
                    // Reset counts
                    if (test.status === 'fail') {
                        suite.failed--;
                        this.results.failed--;
                    }
                    
                    await this.runTest(suite, test);
                }
            }
        }

        this.results.duration = Math.round(performance.now() - startTime);
        this.printSummary();
    }

    calculateCoverage() {
        // Simple coverage metric: percentage of tests passing
        this.results.coverage = this.results.total > 0 
            ? Math.round((this.results.passed / this.results.total) * 100)
            : 0;
    }

    printSummary() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(50));
        console.log(`Total:    ${this.results.total}`);
        console.log(`✅ Passed:  ${this.results.passed}`);
        console.log(`❌ Failed:  ${this.results.failed}`);
        console.log(`⏭ Skipped: ${this.results.skipped}`);
        console.log(`📈 Coverage: ${this.results.coverage}%`);
        console.log(`⏱ Duration: ${this.results.duration}ms`);
        console.log('='.repeat(50));
    }

    getResults() {
        return this.results;
    }

    getSuites() {
        return this.suites;
    }

    clearResults() {
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            duration: 0,
            coverage: 0
        };
        
        for (const suite of this.suites) {
            suite.passed = 0;
            suite.failed = 0;
            suite.skipped = 0;
            
            for (const test of suite.tests) {
                test.status = 'pending';
                test.error = null;
                test.duration = 0;
            }
        }
    }
}

// Assertion helpers
export const assert = {
    equals(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
        }
    },

    notEquals(actual, expected, message = '') {
        if (actual === expected) {
            throw new Error(`${message}\nExpected NOT to equal: ${expected}`);
        }
    },

    deepEquals(actual, expected, message = '') {
        const actualStr = JSON.stringify(actual);
        const expectedStr = JSON.stringify(expected);
        
        if (actualStr !== expectedStr) {
            throw new Error(`${message}\nExpected: ${expectedStr}\nActual: ${actualStr}`);
        }
    },

    truthy(value, message = '') {
        if (!value) {
            throw new Error(`${message}\nExpected truthy value, got: ${value}`);
        }
    },

    falsy(value, message = '') {
        if (value) {
            throw new Error(`${message}\nExpected falsy value, got: ${value}`);
        }
    },

    throws(fn, expectedError, message = '') {
        let thrown = false;
        try {
            fn();
        } catch (error) {
            thrown = true;
            if (expectedError && !error.message.includes(expectedError)) {
                throw new Error(`${message}\nExpected error containing: ${expectedError}\nGot: ${error.message}`);
            }
        }
        
        if (!thrown) {
            throw new Error(`${message}\nExpected function to throw an error`);
        }
    },

    async throwsAsync(fn, expectedError, message = '') {
        let thrown = false;
        try {
            await fn();
        } catch (error) {
            thrown = true;
            if (expectedError && !error.message.includes(expectedError)) {
                throw new Error(`${message}\nExpected error containing: ${expectedError}\nGot: ${error.message}`);
            }
        }
        
        if (!thrown) {
            throw new Error(`${message}\nExpected async function to throw an error`);
        }
    },

    inRange(value, min, max, message = '') {
        if (value < min || value > max) {
            throw new Error(`${message}\nExpected value between ${min} and ${max}, got: ${value}`);
        }
    },

    greaterThan(actual, expected, message = '') {
        if (actual <= expected) {
            throw new Error(`${message}\nExpected ${actual} > ${expected}`);
        }
    },

    lessThan(actual, expected, message = '') {
        if (actual >= expected) {
            throw new Error(`${message}\nExpected ${actual} < ${expected}`);
        }
    },

    contains(array, value, message = '') {
        if (!array.includes(value)) {
            throw new Error(`${message}\nExpected array to contain: ${value}`);
        }
    },

    lengthOf(array, length, message = '') {
        if (array.length !== length) {
            throw new Error(`${message}\nExpected length ${length}, got: ${array.length}`);
        }
    },

    instanceOf(obj, constructor, message = '') {
        if (!(obj instanceof constructor)) {
            throw new Error(`${message}\nExpected instance of ${constructor.name}`);
        }
    }
};

// Export global test functions
export const { describe, it } = (() => {
    const framework = TestFramework.getInstance();
    return {
        describe: framework.describe.bind(framework),
        it: framework.it.bind(framework)
    };
})();
