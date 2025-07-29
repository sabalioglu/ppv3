//lib/meal-plan/api-clients/cache-manager.ts
export interface CacheOptions {
  ttl: number; // Milliseconds
}

export interface CacheEntry<T> {
  data: T;
  expiry: number;
}

export class CacheManager {
  private cache: Map<string, CacheEntry<any>>;
  defaultTTL: number;

  constructor(defaultTTL = 3600000) { // Default TTL: 1 hour
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  generateKey(namespace: string, params: Record<string, any>): string {
    // Sort keys for consistent key generation regardless of object property order
    const sortedParams = Object.keys(params).sort().reduce(
      (result, key) => {
        result[key] = params[key];
        return result;
      }, 
      {} as Record<string, any>
    );
    
    return `${namespace}:${JSON.stringify(sortedParams)}`;
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (entry.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, options?: Partial<CacheOptions>): void {
    const ttl = options?.ttl ?? this.defaultTTL;
    const expiry = Date.now() + ttl;
    
    this.cache.set(key, { data, expiry });
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    if (entry.expiry < Date.now()) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidateByNamespace(namespace: string): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (key.startsWith(`${namespace}:`)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  clear(): void {
    this.cache.clear();
  }
}

// Create a singleton instance
export const cacheManager = new CacheManager();