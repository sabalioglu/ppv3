// lib/meal-plan/api-cache.ts

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

/**
 * A simple in-memory cache with a Time-To-Live (TTL) mechanism.
 * It can store any type of data and automatically handles stale entries.
 */
export class ApiCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly ttl: number; // Time-to-live in milliseconds
  private readonly maxSize: number; // Maximum number of entries in the cache

  /**
   * @param ttl - The time-to-live for cache entries in seconds. Defaults to 1 hour.
   * @param maxSize - The maximum size of the cache. Defaults to 100.
   */
  constructor(ttl: number = 3600, maxSize: number = 100) {
    this.ttl = ttl * 1000; // Convert seconds to milliseconds
    this.maxSize = maxSize;
  }

  /**
   * Retrieves an entry from the cache.
   * Returns null if the entry does not exist or has expired.
   * @param key - The key for the cache entry.
   * @returns The cached data or null.
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if the entry has expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Adds or updates an entry in the cache.
   * @param key - The key for the cache entry.
   * @param data - The data to be cached.
   */
  set(key: string, data: T): void {
    if (this.cache.size >= this.maxSize) {
      // Evict the oldest entry to make space (simple LRU-like strategy)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const expiry = Date.now() + this.ttl;
    const entry: CacheEntry<T> = { data, expiry };
    this.cache.set(key, entry);
  }

  /**
   * Deletes an entry from the cache.
   * @param key - The key to delete.
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clears the entire cache.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Generates a unique cache key from a complex object or parameters.
   * @param prefix - A prefix to identify the type of request.
   * @param params - An object with parameters to be included in the key.
   * @returns A unique string key.
   */
  static generateKey(prefix: string, params: Record<string, any>): string {
    // Sort keys to ensure consistency, e.g., {a:1, b:2} and {b:2, a:1} produce the same key
    const sortedKeys = Object.keys(params).sort();
    const paramString = sortedKeys.map(key => `${key}:${JSON.stringify(params[key])}`).join('&');
    return `${prefix}:${paramString}`;
  }
}
