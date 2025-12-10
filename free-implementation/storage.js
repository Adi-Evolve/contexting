/**
 * SimpleDB - Custom IndexedDB Wrapper
 * Zero dependencies, Promise-based storage
 */

class SimpleDB {
  constructor(dbName = 'AIMemoryDB', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  /**
   * Initialize database and create object stores
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Messages store
        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          messageStore.createIndex('timestamp', 'timestamp', { unique: false });
          messageStore.createIndex('role', 'role', { unique: false });
        }

        // Concepts store
        if (!db.objectStoreNames.contains('concepts')) {
          const conceptStore = db.createObjectStore('concepts', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          conceptStore.createIndex('type', 'type', { unique: false });
          conceptStore.createIndex('content', 'content', { unique: false });
        }

        // Sessions store (for metadata)
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
        }
      };
    });
  }

  /**
   * Add data to a store
   */
  async add(storeName, data) {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all data from a store
   */
  async getAll(storeName) {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get data by key
   */
  async get(storeName, key) {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update data in a store
   */
  async update(storeName, data) {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete data from a store
   */
  async delete(storeName, key) {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all data from a store
   */
  async clear(storeName) {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Count records in a store
   */
  async count(storeName) {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Query by index
   */
  async getByIndex(storeName, indexName, value) {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete database
   */
  async deleteDatabase() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.dbName);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.SimpleDB = SimpleDB;
}
