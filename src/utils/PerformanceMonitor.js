/**
 * Performance Monitoring and Optimization Utilities
 * Tracks latency, memory usage, and bottlenecks
 */

export class PerformanceMonitor {
    constructor() {
        this.metrics = {
            operations: new Map(),
            memory: [],
            latency: [],
            bottlenecks: []
        };
        this.thresholds = {
            hotTier: 50,      // ms
            warmTier: 100,    // ms
            coldTier: 500,    // ms
            search: 100,      // ms
            fingerprint: 1,   // ms
            compression: 5000 // ms
        };
    }

    /**
     * Track operation performance
     */
    async measure(name, operation) {
        const startTime = performance.now();
        const startMemory = this.getMemoryUsage();

        try {
            const result = await operation();
            const duration = performance.now() - startTime;
            const memoryUsed = this.getMemoryUsage() - startMemory;

            this.recordMetric(name, duration, memoryUsed, true);

            // Check thresholds
            if (this.thresholds[name] && duration > this.thresholds[name]) {
                this.recordBottleneck(name, duration, this.thresholds[name]);
            }

            return result;
        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordMetric(name, duration, 0, false, error);
            throw error;
        }
    }

    /**
     * Get current memory usage
     */
    getMemoryUsage() {
        if (performance.memory) {
            return performance.memory.usedJSHeapSize / 1024 / 1024; // MB
        }
        return 0;
    }

    /**
     * Record metric
     */
    recordMetric(name, duration, memoryUsed, success, error = null) {
        if (!this.metrics.operations.has(name)) {
            this.metrics.operations.set(name, {
                count: 0,
                totalDuration: 0,
                totalMemory: 0,
                min: Infinity,
                max: 0,
                failures: 0,
                errors: []
            });
        }

        const metric = this.metrics.operations.get(name);
        metric.count++;
        metric.totalDuration += duration;
        metric.totalMemory += memoryUsed;
        metric.min = Math.min(metric.min, duration);
        metric.max = Math.max(metric.max, duration);

        if (!success) {
            metric.failures++;
            metric.errors.push({ error: error.message, timestamp: Date.now() });
        }

        this.metrics.latency.push({ name, duration, timestamp: Date.now() });
        if (this.metrics.latency.length > 1000) {
            this.metrics.latency.shift();
        }
    }

    /**
     * Record bottleneck
     */
    recordBottleneck(name, actualDuration, threshold) {
        this.metrics.bottlenecks.push({
            operation: name,
            duration: actualDuration,
            threshold,
            exceeded: actualDuration - threshold,
            timestamp: Date.now()
        });

        console.warn(`⚠️ Performance bottleneck detected: ${name} took ${actualDuration.toFixed(2)}ms (threshold: ${threshold}ms)`);
    }

    /**
     * Get performance report
     */
    getReport() {
        const report = {
            operations: {},
            summary: {
                totalOperations: 0,
                averageLatency: 0,
                bottleneckCount: this.metrics.bottlenecks.length,
                memoryTrend: this.calculateMemoryTrend()
            }
        };

        // Process operations
        for (const [name, metric] of this.metrics.operations) {
            report.operations[name] = {
                count: metric.count,
                avgDuration: metric.totalDuration / metric.count,
                avgMemory: metric.totalMemory / metric.count,
                minDuration: metric.min,
                maxDuration: metric.max,
                successRate: ((metric.count - metric.failures) / metric.count * 100).toFixed(2),
                throughput: metric.count / (this.getTotalTime() / 1000) // ops/sec
            };

            report.summary.totalOperations += metric.count;
            report.summary.averageLatency += metric.totalDuration / metric.count;
        }

        report.summary.averageLatency /= this.metrics.operations.size || 1;

        return report;
    }

    /**
     * Get bottlenecks
     */
    getBottlenecks() {
        return this.metrics.bottlenecks
            .sort((a, b) => b.exceeded - a.exceeded)
            .slice(0, 10);
    }

    /**
     * Calculate memory trend
     */
    calculateMemoryTrend() {
        if (this.metrics.memory.length < 2) return 'stable';

        const recent = this.metrics.memory.slice(-10);
        const average = recent.reduce((a, b) => a + b, 0) / recent.length;
        const first = recent[0];
        const last = recent[recent.length - 1];

        const change = ((last - first) / first) * 100;

        if (change > 10) return 'increasing';
        if (change < -10) return 'decreasing';
        return 'stable';
    }

    /**
     * Get total monitoring time
     */
    getTotalTime() {
        if (this.metrics.latency.length === 0) return 1;
        const first = this.metrics.latency[0].timestamp;
        const last = this.metrics.latency[this.metrics.latency.length - 1].timestamp;
        return last - first;
    }

    /**
     * Optimize suggestions
     */
    getSuggestions() {
        const suggestions = [];
        const bottlenecks = this.getBottlenecks();

        // Check for slow operations
        for (const [name, metric] of this.metrics.operations) {
            const avgDuration = metric.totalDuration / metric.count;

            if (name === 'search' && avgDuration > 100) {
                suggestions.push({
                    priority: 'high',
                    operation: name,
                    issue: `Search taking ${avgDuration.toFixed(2)}ms (target: <100ms)`,
                    suggestion: 'Optimize semantic fingerprint matching, add caching for frequent queries'
                });
            }

            if (name === 'hotTier' && avgDuration > 50) {
                suggestions.push({
                    priority: 'critical',
                    operation: name,
                    issue: `Hot tier access ${avgDuration.toFixed(2)}ms (target: <50ms)`,
                    suggestion: 'Reduce hot tier size, optimize Map lookups'
                });
            }

            if (name === 'compression' && avgDuration > 5000) {
                suggestions.push({
                    priority: 'medium',
                    operation: name,
                    issue: `Compression taking ${avgDuration.toFixed(2)}ms`,
                    suggestion: 'Move compression to Web Worker, process in background'
                });
            }
        }

        // Check memory
        if (this.calculateMemoryTrend() === 'increasing') {
            suggestions.push({
                priority: 'high',
                operation: 'memory',
                issue: 'Memory usage trending upward',
                suggestion: 'Check for memory leaks, implement more aggressive garbage collection'
            });
        }

        // Check bottlenecks
        if (bottlenecks.length > 5) {
            suggestions.push({
                priority: 'high',
                operation: 'general',
                issue: `${bottlenecks.length} bottlenecks detected`,
                suggestion: 'Review most frequent bottlenecks and optimize critical paths'
            });
        }

        return suggestions.sort((a, b) => {
            const priority = { critical: 0, high: 1, medium: 2, low: 3 };
            return priority[a.priority] - priority[b.priority];
        });
    }

    /**
     * Start continuous monitoring
     */
    startMonitoring(interval = 5000) {
        this.monitoringInterval = setInterval(() => {
            const memory = this.getMemoryUsage();
            this.metrics.memory.push(memory);

            if (this.metrics.memory.length > 100) {
                this.metrics.memory.shift();
            }

            // Check for issues
            const suggestions = this.getSuggestions();
            if (suggestions.length > 0) {
                console.log('📊 Performance suggestions:', suggestions);
            }
        }, interval);
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
    }

    /**
     * Export metrics
     */
    exportMetrics() {
        return {
            report: this.getReport(),
            bottlenecks: this.getBottlenecks(),
            suggestions: this.getSuggestions(),
            rawMetrics: {
                operations: Array.from(this.metrics.operations.entries()),
                latency: this.metrics.latency.slice(-100),
                memory: this.metrics.memory.slice(-100)
            }
        };
    }

    /**
     * Clear metrics
     */
    clear() {
        this.metrics.operations.clear();
        this.metrics.memory = [];
        this.metrics.latency = [];
        this.metrics.bottlenecks = [];
    }
}

/**
 * Optimization utilities
 */
export class PerformanceOptimizer {
    /**
     * Debounce function
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function
     */
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Memoize function results
     */
    static memoize(func, maxSize = 100) {
        const cache = new Map();

        return function(...args) {
            const key = JSON.stringify(args);

            if (cache.has(key)) {
                return cache.get(key);
            }

            const result = func.apply(this, args);
            cache.set(key, result);

            // LRU eviction
            if (cache.size > maxSize) {
                const firstKey = cache.keys().next().value;
                cache.delete(firstKey);
            }

            return result;
        };
    }

    /**
     * Batch operations
     */
    static batch(func, batchSize = 10, delay = 100) {
        let queue = [];
        let timeout;

        return function(item) {
            queue.push(item);

            clearTimeout(timeout);

            if (queue.length >= batchSize) {
                func(queue);
                queue = [];
            } else {
                timeout = setTimeout(() => {
                    if (queue.length > 0) {
                        func(queue);
                        queue = [];
                    }
                }, delay);
            }
        };
    }

    /**
     * Lazy load
     */
    static lazy(loader) {
        let cached = null;
        let loading = null;

        return async function() {
            if (cached) return cached;
            if (loading) return loading;

            loading = loader();
            cached = await loading;
            loading = null;

            return cached;
        };
    }

    /**
     * Request animation frame throttle
     */
    static rafThrottle(func) {
        let rafId = null;

        return function(...args) {
            if (rafId) return;

            rafId = requestAnimationFrame(() => {
                func.apply(this, args);
                rafId = null;
            });
        };
    }

    /**
     * Virtual scroll helper
     */
    static virtualScroll(items, containerHeight, itemHeight) {
        return {
            visibleItems: Math.ceil(containerHeight / itemHeight) + 2,
            getVisibleRange(scrollTop) {
                const start = Math.floor(scrollTop / itemHeight);
                const end = start + this.visibleItems;
                return {
                    start: Math.max(0, start - 1),
                    end: Math.min(items.length, end + 1),
                    offsetY: start * itemHeight
                };
            }
        };
    }
}

/**
 * Cache manager
 */
export class CacheManager {
    constructor(maxSize = 1000, ttl = 3600000) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttl = ttl; // 1 hour default
        this.accessOrder = [];
    }

    set(key, value) {
        const entry = {
            value,
            timestamp: Date.now(),
            accessCount: 0
        };

        if (this.cache.has(key)) {
            this.cache.set(key, entry);
        } else {
            if (this.cache.size >= this.maxSize) {
                this.evict();
            }
            this.cache.set(key, entry);
            this.accessOrder.push(key);
        }
    }

    get(key) {
        const entry = this.cache.get(key);

        if (!entry) return null;

        // Check TTL
        if (Date.now() - entry.timestamp > this.ttl) {
            this.cache.delete(key);
            this.accessOrder = this.accessOrder.filter(k => k !== key);
            return null;
        }

        entry.accessCount++;
        entry.timestamp = Date.now();

        return entry.value;
    }

    evict() {
        // Remove least recently used
        const lruKey = this.accessOrder.shift();
        if (lruKey) {
            this.cache.delete(lruKey);
        }
    }

    clear() {
        this.cache.clear();
        this.accessOrder = [];
    }

    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hitRate: this.calculateHitRate()
        };
    }

    calculateHitRate() {
        let totalAccess = 0;
        for (const entry of this.cache.values()) {
            totalAccess += entry.accessCount;
        }
        return this.cache.size > 0 ? totalAccess / this.cache.size : 0;
    }
}
