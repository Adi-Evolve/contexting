/**
 * IndexedDB - Enhanced Browser Storage Wrapper
 * 
 * Features:
 * - Schema versioning with migrations
 * - Batch operations (add/update/delete multiple)
 * - Transaction management
 * - Index support for fast queries
 * - Error handling and retry logic
 * - Performance metrics
 * 
 * Stores:
 * - messages: Main message storage
 * - sessions: Compressed session data
 * - metadata: System metadata
 * - snapshots: Base snapshots for differential compression
 * 
 * @class IndexedDB
 */

class IndexedDB {
  constructor(dbName = 'MemoryForgeDB', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
    
    // Store configurations
    this.stores = {
      messages: {
        keyPath: 'id',
        indexes: [
          { name: 'timestamp', keyPath: 'timestamp', unique: false },
          { name: 'hash', keyPath: 'fingerprint.hash', unique: false }
        ]
      },
      sessions: {
        keyPath: 'id',
        indexes: [
          { name: 'timestamp', keyPath: 'timestamp', unique: false }
        ]
      },
      metadata: {
        keyPath: 'key',
        indexes: []
      },
      snapshots: {
        keyPath: 'id',
        indexes: [
          { name: 'timestamp', keyPath: 'timestamp', unique: false }
        ]
      }
    };
    
    // Metrics
    this.metrics = {
      reads: 0,
      writes: 0,
      deletes: 0,
      avgReadTime: 0,
      avgWriteTime: 0,
      errors: 0
    };
  }
  
  /**
   * Initialize database
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => {
        this.metrics.errors++;
        reject(new Error('Failed to open IndexedDB'));
      };
      
      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        this.migrate(db, event.oldVersion, event.newVersion);
      };
    });
  }
  
  /**
   * Handle schema migrations
   */
  migrate(db, oldVersion, newVersion) {
    console.log(`Migrating IndexedDB from v${oldVersion} to v${newVersion}`);
    
    // Create stores if they don't exist
    for (const [storeName, config] of Object.entries(this.stores)) {
      if (!db.objectStoreNames.contains(storeName)) {
        const store = db.createObjectStore(storeName, { keyPath: config.keyPath });
        
        // Create indexes
        for (const index of config.indexes) {
          store.createIndex(index.name, index.keyPath, { unique: index.unique });
        }
        
        console.log(`Created store: ${storeName}`);
      }
    }
  }
  
  /**
   * Add single item
   */
  async add(storeName, item) {
    const startTime = performance.now();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(item);
      
      request.onsuccess = () => {
        this.metrics.writes++;
        this.updateAvgTime('write', startTime);
        resolve(request.result);
      };
      
      request.onerror = () => {
        this.metrics.errors++;
        reject(new Error(`Failed to add to ${storeName}`));
      };
    });
  }
  
  /**
   * Add multiple items in batch
   */
  async addBatch(storeName, items) {
    const startTime = performance.now();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      let count = 0;
      for (const item of items) {
        const request = store.add(item);
        request.onsuccess = () => count++;
      }
      
      transaction.oncomplete = () => {
        this.metrics.writes += count;
        this.updateAvgTime('write', startTime);
        resolve(count);
      };
      
      transaction.onerror = () => {
        this.metrics.errors++;
        reject(new Error(`Batch add failed for ${storeName}`));
      };
    });
  }
  
  /**
   * Get single item by key
   */
  async get(storeName, key) {
    const startTime = performance.now();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = () => {
        this.metrics.reads++;
        this.updateAvgTime('read', startTime);
        resolve(request.result);
      };
      
      request.onerror = () => {
        this.metrics.errors++;
        reject(new Error(`Failed to get from ${storeName}`));
      };
    });
  }
  
  /**
   * Get all items from store
   */
  async getAll(storeName, limit = null) {
    const startTime = performance.now();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = limit ? store.getAll(null, limit) : store.getAll();
      
      request.onsuccess = () => {
        this.metrics.reads++;
        this.updateAvgTime('read', startTime);
        resolve(request.result);
      };
      
      request.onerror = () => {
        this.metrics.errors++;
        reject(new Error(`Failed to get all from ${storeName}`));
      };
    });
  }
  
  /**
   * Get items by index
   */
  async getByIndex(storeName, indexName, value, limit = null) {
    const startTime = performance.now();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = limit ? index.getAll(value, limit) : index.getAll(value);
      
      request.onsuccess = () => {
        this.metrics.reads++;
        this.updateAvgTime('read', startTime);
        resolve(request.result);
      };
      
      request.onerror = () => {
        this.metrics.errors++;
        reject(new Error(`Failed to get by index ${indexName}`));
      };
    });
  }
  
  /**
   * Get items in range by index
   */
  async getRangeByIndex(storeName, indexName, lowerBound, upperBound, limit = null) {
    const startTime = performance.now();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      
      const range = IDBKeyRange.bound(lowerBound, upperBound);
      const request = index.openCursor(range);
      
      const results = [];
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && (!limit || results.length < limit)) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          this.metrics.reads++;
          this.updateAvgTime('read', startTime);
          resolve(results);
        }
      };
      
      request.onerror = () => {
        this.metrics.errors++;
        reject(new Error(`Failed to get range from ${indexName}`));
      };
    });
  }
  
  /**
   * Update item (put)
   */
  async update(storeName, item) {
    const startTime = performance.now();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);
      
      request.onsuccess = () => {
        this.metrics.writes++;
        this.updateAvgTime('write', startTime);
        resolve(request.result);
      };
      
      request.onerror = () => {
        this.metrics.errors++;
        reject(new Error(`Failed to update in ${storeName}`));
      };
    });
  }
  
  /**
   * Update multiple items
   */
  async updateBatch(storeName, items) {
    const startTime = performance.now();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      let count = 0;
      for (const item of items) {
        const request = store.put(item);
        request.onsuccess = () => count++;
      }
      
      transaction.oncomplete = () => {
        this.metrics.writes += count;
        this.updateAvgTime('write', startTime);
        resolve(count);
      };
      
      transaction.onerror = () => {
        this.metrics.errors++;
        reject(new Error(`Batch update failed for ${storeName}`));
      };
    });
  }
  
  /**
   * Delete item by key
   */
  async delete(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => {
        this.metrics.deletes++;
        resolve(true);
      };
      
      request.onerror = () => {
        this.metrics.errors++;
        reject(new Error(`Failed to delete from ${storeName}`));
      };
    });
  }
  
  /**
   * Delete multiple items
   */
  async deleteBatch(storeName, keys) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      let count = 0;
      for (const key of keys) {
        const request = store.delete(key);
        request.onsuccess = () => count++;
      }
      
      transaction.oncomplete = () => {
        this.metrics.deletes += count;
        resolve(count);
      };
      
      transaction.onerror = () => {
        this.metrics.errors++;
        reject(new Error(`Batch delete failed for ${storeName}`));
      };
    });
  }
  
  /**
   * Clear entire store
   */
  async clear(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = () => {
        this.metrics.errors++;
        reject(new Error(`Failed to clear ${storeName}`));
      };
    });
  }
  
  /**
   * Count items in store
   */
  async count(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        this.metrics.errors++;
        reject(new Error(`Failed to count ${storeName}`));
      };
    });
  }
  
  /**
   * Search with filter function
   */
  async search(storeName, filterFn, limit = 100) {
    const startTime = performance.now();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.openCursor();
      
      const results = [];
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && results.length < limit) {
          if (filterFn(cursor.value)) {
            results.push(cursor.value);
          }
          cursor.continue();
        } else {
          this.metrics.reads++;
          this.updateAvgTime('read', startTime);
          resolve(results);
        }
      };
      
      request.onerror = () => {
        this.metrics.errors++;
        reject(new Error(`Search failed in ${storeName}`));
      };
    });
  }
  
  /**
   * Execute custom transaction
   */
  async transaction(storeNames, mode, callback) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeNames, mode);
      
      transaction.oncomplete = () => {
        resolve(true);
      };
      
      transaction.onerror = () => {
        this.metrics.errors++;
        reject(new Error('Transaction failed'));
      };
      
      try {
        callback(transaction);
      } catch (error) {
        this.metrics.errors++;
        reject(error);
      }
    });
  }
  
  /**
   * Export entire database
   */
  async export() {
    const exportData = {
      dbName: this.dbName,
      version: this.version,
      stores: {},
      exportedAt: Date.now()
    };
    
    for (const storeName of Object.keys(this.stores)) {
      exportData.stores[storeName] = await this.getAll(storeName);
    }
    
    return exportData;
  }
  
  /**
   * Import database from export
   */
  async import(importData) {
    let totalImported = 0;
    
    for (const [storeName, items] of Object.entries(importData.stores)) {
      if (this.stores[storeName]) {
        // Clear existing data
        await this.clear(storeName);
        
        // Import new data
        const count = await this.addBatch(storeName, items);
        totalImported += count;
      }
    }
    
    return totalImported;
  }
  
  /**
   * Update average time metrics
   */
  updateAvgTime(type, startTime) {
    const duration = performance.now() - startTime;
    const key = type === 'read' ? 'avgReadTime' : 'avgWriteTime';
    const alpha = 0.1;
    this.metrics[key] = alpha * duration + (1 - alpha) * this.metrics[key];
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      dbName: this.dbName,
      version: this.version,
      reads: this.metrics.reads,
      writes: this.metrics.writes,
      deletes: this.metrics.deletes,
      avgReadTime: this.metrics.avgReadTime.toFixed(3) + 'ms',
      avgWriteTime: this.metrics.avgWriteTime.toFixed(3) + 'ms',
      errors: this.metrics.errors
    };
  }
  
  /**
   * Get store size estimate
   */
  async getStoreSize(storeName) {
    if (!navigator.storage || !navigator.storage.estimate) {
      return { error: 'Storage API not supported' };
    }
    
    const estimate = await navigator.storage.estimate();
    const itemCount = await this.count(storeName);
    
    return {
      storeName,
      itemCount,
      totalUsage: estimate.usage,
      totalQuota: estimate.quota,
      percentUsed: ((estimate.usage / estimate.quota) * 100).toFixed(2) + '%'
    };
  }
  
  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
  
  /**
   * Delete entire database
   */
  static async deleteDatabase(dbName) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(dbName);
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = () => {
        reject(new Error('Failed to delete database'));
      };
    });
  }
}

// Export
if (typeof window !== 'undefined') {
  window.IndexedDB = IndexedDB;
}

export default IndexedDB;
