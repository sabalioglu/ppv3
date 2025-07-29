// lib/meal-plan/api-clients/cache-decorator.ts
import { cacheManager, CacheOptions } from './cache-manager';

export function withCache<T>(
  namespace: string,
  fn: (params: any) => Promise<T>,
  options?: Partial<CacheOptions>
): (params: any) => Promise<T> {
  return async (params: any): Promise<T> => {
    const cacheKey = cacheManager.generateKey(namespace, params);
    
    const cachedResult = await cacheManager.get<T>(cacheKey);
    if (cachedResult !== null) {
      return cachedResult;
    }
    
    const result = await fn(params);
    cacheManager.set(cacheKey, result, options);
    
    return result;
  };
}
