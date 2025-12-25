/**
 * IndexedDB Helper - Simple wrapper for IndexedDB operations
 *
 * Provides a clean API for storing and retrieving string data in IndexedDB.
 * Uses a key-value store pattern where both keys and values are strings.
 */
export class IndexedDBHelper
{
  private db: IDBDatabase | null = null;
  private dbName: string;
  private storeName: string;

  constructor(dbName: string, storeName: string)
  {
    this.dbName = dbName;
    this.storeName = storeName;
  }

  /**
   * Initializes the IndexedDB connection
   */
  async init(): Promise<void>
  {
    return new Promise((resolve, reject) =>
    {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () =>
      {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) =>
      {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName))
        {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Ensures the database is initialized
   */
  private async ensureDB(): Promise<IDBDatabase>
  {
    if (!this.db)
    {
      await this.init();
    }
    if (!this.db)
    {
      throw new Error('Failed to initialize IndexedDB');
    }
    return this.db;
  }

  /**
   * Writes a key-value pair to the database
   */
  async write(key: string, value: string): Promise<void>
  {
    const db = await this.ensureDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) =>
    {
      const request = store.put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Reads a value by key from the database
   * Returns null if the key doesn't exist
   */
  async read(key: string): Promise<string | null>
  {
    const db = await this.ensureDB();
    const transaction = db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) =>
    {
      const request = store.get(key);
      request.onsuccess = () =>
      {
        if (request.result)
        {
          resolve(request.result.value);
        }
        else
        {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Deletes a key-value pair from the database
   */
  async delete(key: string): Promise<void>
  {
    const db = await this.ensureDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) =>
    {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Checks if a key exists in the database
   */
  async exists(key: string): Promise<boolean>
  {
    const value = await this.read(key);
    return value !== null;
  }

  /**
   * Gets all keys in the database
   */
  async getAllKeys(): Promise<string[]>
  {
    const db = await this.ensureDB();
    const transaction = db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) =>
    {
      const request = store.getAllKeys();
      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Closes the database connection
   */
  close(): void
  {
    if (this.db)
    {
      this.db.close();
      this.db = null;
    }
  }
}
