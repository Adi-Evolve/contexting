// Differential Patch Engine
// Git-style delta compression for memory snapshots

class DeltaEngine {
    constructor(config = {}) {
        this.config = {
            maxPatchChainLength: config.maxPatchChainLength || 10,
            fullSnapshotInterval: config.fullSnapshotInterval || 100, // messages
            compressionThreshold: config.compressionThreshold || 0.3, // 30% size reduction
            enableVersioning: config.enableVersioning !== false
        };
        
        this.versionHistory = [];
        this.baseVersion = null;
        this.currentVersion = 0;
    }
    
    /**
     * Calculate difference between two memory states
     * @param {Object} oldState - Previous memory graph
     * @param {Object} newState - Current memory graph
     * @returns {Object} Diff object
     */
    calculateDiff(oldState, newState) {
        const diff = {
            added: [],
            modified: [],
            deleted: [],
            metadata: {
                timestamp: Date.now(),
                oldVersion: oldState.version || 0,
                newVersion: (oldState.version || 0) + 1
            }
        };
        
        // Convert states to comparable formats
        const oldNodes = this.flattenNodes(oldState);
        const newNodes = this.flattenNodes(newState);
        
        // Find added nodes
        for (const [id, node] of newNodes.entries()) {
            if (!oldNodes.has(id)) {
                diff.added.push(node);
            }
        }
        
        // Find modified nodes
        for (const [id, newNode] of newNodes.entries()) {
            if (oldNodes.has(id)) {
                const oldNode = oldNodes.get(id);
                const changes = this.detectChanges(oldNode, newNode);
                
                if (changes.length > 0) {
                    diff.modified.push({
                        id: id,
                        changes: changes
                    });
                }
            }
        }
        
        // Find deleted nodes
        for (const [id] of oldNodes.entries()) {
            if (!newNodes.has(id)) {
                diff.deleted.push(id);
            }
        }
        
        return diff;
    }
    
    /**
     * Flatten nodes from memory graph
     */
    flattenNodes(state) {
        const nodes = new Map();
        
        if (state.tree && state.tree.nodes) {
            if (state.tree.nodes instanceof Map) {
                return state.tree.nodes;
            } else if (Array.isArray(state.tree.nodes)) {
                return new Map(state.tree.nodes);
            }
        }
        
        return nodes;
    }
    
    /**
     * Detect changes between two nodes
     */
    detectChanges(oldNode, newNode) {
        const changes = [];
        
        // Compare all properties
        for (const key in newNode) {
            if (key === 'metadata' || key === 'children') {
                // Special handling for nested objects
                const oldValue = JSON.stringify(oldNode[key]);
                const newValue = JSON.stringify(newNode[key]);
                
                if (oldValue !== newValue) {
                    changes.push({
                        field: key,
                        oldValue: oldNode[key],
                        newValue: newNode[key],
                        type: 'object'
                    });
                }
            } else {
                if (oldNode[key] !== newNode[key]) {
                    changes.push({
                        field: key,
                        oldValue: oldNode[key],
                        newValue: newNode[key],
                        type: typeof newNode[key]
                    });
                }
            }
        }
        
        return changes;
    }
    
    /**
     * Generate patch object from diff
     * @param {Object} diff - Calculated diff
     * @returns {Object} Patch object
     */
    generatePatch(diff) {
        const patch = {
            version: diff.metadata.newVersion,
            baseVersion: diff.metadata.oldVersion,
            timestamp: diff.metadata.timestamp,
            operations: [],
            stats: {
                added: diff.added.length,
                modified: diff.modified.length,
                deleted: diff.deleted.length
            }
        };
        
        // Add operations
        diff.added.forEach(node => {
            patch.operations.push({
                op: 'add',
                path: `/nodes/${node.id}`,
                value: node
            });
        });
        
        diff.modified.forEach(mod => {
            mod.changes.forEach(change => {
                patch.operations.push({
                    op: 'replace',
                    path: `/nodes/${mod.id}/${change.field}`,
                    value: change.newValue
                });
            });
        });
        
        diff.deleted.forEach(id => {
            patch.operations.push({
                op: 'remove',
                path: `/nodes/${id}`
            });
        });
        
        return patch;
    }
    
    /**
     * Apply patch to base state
     * @param {Object} baseState - Base memory graph
     * @param {Object} patch - Patch to apply
     * @returns {Object} New state
     */
    applyPatch(baseState, patch) {
        // Deep clone base state
        const newState = JSON.parse(JSON.stringify(baseState));
        
        // Apply each operation
        for (const operation of patch.operations) {
            try {
                this.applyOperation(newState, operation);
            } catch (error) {
                console.error('Failed to apply operation:', operation, error);
            }
        }
        
        newState.version = patch.version;
        newState.timestamp = patch.timestamp;
        
        return newState;
    }
    
    /**
     * Apply single patch operation
     */
    applyOperation(state, operation) {
        const pathParts = operation.path.split('/').filter(p => p);
        
        switch (operation.op) {
            case 'add': {
                // Navigate to parent and add
                const parent = this.navigatePath(state, pathParts.slice(0, -1));
                const key = pathParts[pathParts.length - 1];
                
                if (parent instanceof Map) {
                    parent.set(key, operation.value);
                } else if (Array.isArray(parent)) {
                    parent.push(operation.value);
                } else {
                    parent[key] = operation.value;
                }
                break;
            }
            
            case 'replace': {
                // Navigate to target and replace
                const parent = this.navigatePath(state, pathParts.slice(0, -1));
                const key = pathParts[pathParts.length - 1];
                
                if (parent instanceof Map) {
                    parent.set(key, operation.value);
                } else {
                    parent[key] = operation.value;
                }
                break;
            }
            
            case 'remove': {
                // Navigate to parent and remove
                const parent = this.navigatePath(state, pathParts.slice(0, -1));
                const key = pathParts[pathParts.length - 1];
                
                if (parent instanceof Map) {
                    parent.delete(key);
                } else if (Array.isArray(parent)) {
                    const index = parseInt(key);
                    parent.splice(index, 1);
                } else {
                    delete parent[key];
                }
                break;
            }
        }
    }
    
    /**
     * Navigate to path in state object
     */
    navigatePath(state, pathParts) {
        let current = state;
        
        for (const part of pathParts) {
            if (current instanceof Map) {
                current = current.get(part);
            } else if (Array.isArray(current)) {
                current = current[parseInt(part)];
            } else {
                current = current[part];
            }
            
            if (current === undefined) {
                throw new Error(`Path not found: ${pathParts.join('/')}`);
            }
        }
        
        return current;
    }
    
    /**
     * Decide if we should save full snapshot or delta patch
     * @param {Object} oldState
     * @param {Object} newState
     * @returns {Object} {type: 'full' | 'delta', data: ...}
     */
    decideSaveStrategy(oldState, newState) {
        // Always save full snapshot if no base
        if (!oldState) {
            return {
                type: 'full',
                data: newState,
                size: JSON.stringify(newState).length
            };
        }
        
        // Calculate diff
        const diff = this.calculateDiff(oldState, newState);
        const patch = this.generatePatch(diff);
        
        // Calculate sizes
        const fullSize = JSON.stringify(newState).length;
        const patchSize = JSON.stringify(patch).length;
        
        // Decide based on compression ratio
        const compressionRatio = patchSize / fullSize;
        
        if (compressionRatio < this.config.compressionThreshold) {
            return {
                type: 'delta',
                data: patch,
                size: patchSize,
                compressionRatio: compressionRatio
            };
        } else {
            return {
                type: 'full',
                data: newState,
                size: fullSize
            };
        }
    }
    
    /**
     * Reconstruct state from base + patches
     * @param {Object} baseVersion - Full snapshot
     * @param {Array} patches - Array of patches to apply
     * @returns {Object} Reconstructed state
     */
    reconstructState(baseVersion, patches) {
        let currentState = baseVersion;
        
        for (const patch of patches) {
            currentState = this.applyPatch(currentState, patch);
        }
        
        return currentState;
    }
    
    /**
     * Optimize patch chain (merge patches, create new base)
     * @param {Array} patches - Patch chain
     * @returns {Object} Optimized result
     */
    optimizePatchChain(patches) {
        if (patches.length <= this.config.maxPatchChainLength) {
            return {
                optimized: false,
                patches: patches
            };
        }
        
        // Merge old patches into new base snapshot
        const baseVersion = this.baseVersion;
        const newBase = this.reconstructState(baseVersion, patches);
        
        return {
            optimized: true,
            newBase: newBase,
            patches: [] // Reset patch chain
        };
    }
    
    /**
     * Save state with versioning
     * @param {Object} state - Current state
     * @returns {Object} Save result
     */
    saveWithVersioning(state) {
        const saveStrategy = this.decideSaveStrategy(this.baseVersion, state);
        
        // Store in version history
        this.versionHistory.push({
            version: this.currentVersion++,
            type: saveStrategy.type,
            timestamp: Date.now(),
            data: saveStrategy.data,
            size: saveStrategy.size
        });
        
        // Update base version if full snapshot
        if (saveStrategy.type === 'full') {
            this.baseVersion = state;
        }
        
        // Optimize if needed
        if (this.versionHistory.length > this.config.maxPatchChainLength) {
            const patches = this.versionHistory
                .filter(v => v.type === 'delta')
                .map(v => v.data);
            
            const optimized = this.optimizePatchChain(patches);
            
            if (optimized.optimized) {
                this.baseVersion = optimized.newBase;
                this.versionHistory = [{
                    version: this.currentVersion++,
                    type: 'full',
                    timestamp: Date.now(),
                    data: optimized.newBase,
                    size: JSON.stringify(optimized.newBase).length
                }];
            }
        }
        
        return saveStrategy;
    }
    
    /**
     * Load specific version
     * @param {number} version - Version number
     * @returns {Object} State at that version
     */
    loadVersion(version) {
        const targetVersion = this.versionHistory.find(v => v.version === version);
        
        if (!targetVersion) {
            throw new Error(`Version ${version} not found`);
        }
        
        if (targetVersion.type === 'full') {
            return targetVersion.data;
        }
        
        // Reconstruct from patches
        const baseIndex = this.versionHistory.findIndex(v => v.type === 'full');
        const base = this.versionHistory[baseIndex].data;
        
        const patches = this.versionHistory
            .slice(baseIndex + 1, this.versionHistory.indexOf(targetVersion) + 1)
            .filter(v => v.type === 'delta')
            .map(v => v.data);
        
        return this.reconstructState(base, patches);
    }
    
    /**
     * Get version history stats
     */
    getStats() {
        const totalSize = this.versionHistory.reduce((sum, v) => sum + v.size, 0);
        const fullSnapshots = this.versionHistory.filter(v => v.type === 'full').length;
        const deltaPatches = this.versionHistory.filter(v => v.type === 'delta').length;
        
        return {
            totalVersions: this.versionHistory.length,
            fullSnapshots: fullSnapshots,
            deltaPatches: deltaPatches,
            totalSize: totalSize,
            averageSize: totalSize / this.versionHistory.length,
            compressionRatio: deltaPatches > 0 
                ? this.versionHistory
                    .filter(v => v.type === 'delta')
                    .reduce((sum, v) => sum + (v.data.stats?.added || 0), 0) / deltaPatches
                : 0
        };
    }
    
    /**
     * Serialize engine state
     */
    serialize() {
        return {
            version: '1.0',
            config: this.config,
            baseVersion: this.baseVersion,
            currentVersion: this.currentVersion,
            versionHistory: this.versionHistory,
            timestamp: Date.now()
        };
    }
    
    /**
     * Deserialize engine state
     */
    static deserialize(data) {
        const engine = new DeltaEngine(data.config);
        
        engine.baseVersion = data.baseVersion;
        engine.currentVersion = data.currentVersion;
        engine.versionHistory = data.versionHistory;
        
        return engine;
    }
}

// Export for use in extension
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeltaEngine;
}
