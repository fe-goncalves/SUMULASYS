const DEFAULT_CACHE_DURATION = 30 * 60 * 1000;
const LIST_CACHE_DURATION = 60 * 60 * 1000;
const MAX_CACHE_SIZE = 10 * 1024 * 1024;

export type ListCacheKey = 'teams' | 'athletes' | 'committee' | 'tournaments' | 'matches';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

function storageKey(key: string, userId?: string): string {
  return userId ? `cache_${key}_${userId}` : `cache_${key}`;
}

function isOversizedOrEmbedded(data: any): boolean {
  try {
    const sample = JSON.stringify(data);
    if (sample.length > MAX_CACHE_SIZE * 0.15) return true;
    return sample.includes('data:image');
  } catch {
    return true;
  }
}

export function getCachedData(key: string, userId?: string): any | null {
  try {
    const cached = localStorage.getItem(storageKey(key, userId));
    if (!cached) return null;

    const entry: CacheEntry = JSON.parse(cached);
    if (Date.now() - entry.timestamp > entry.ttl) {
      localStorage.removeItem(storageKey(key, userId));
      return null;
    }

    return entry.data;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
}

export function setCachedData(key: string, data: any, userId?: string): void {
  if (isOversizedOrEmbedded(data)) return;

  try {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: LIST_CACHE_DURATION,
    };
    localStorage.setItem(storageKey(key, userId), JSON.stringify(entry));
  } catch (error) {
    console.error('Error setting cache:', error);
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      clearOldestCacheEntries();
    }
  }
}

function clearOldestCacheEntries(): void {
  try {
    const entries = Object.keys(localStorage)
      .filter((k) => k.startsWith('cache_'))
      .map((k) => {
        try {
          const entry = JSON.parse(localStorage.getItem(k) || '{}') as CacheEntry;
          return { key: k, timestamp: entry.timestamp || 0 };
        } catch {
          return { key: k, timestamp: 0 };
        }
      })
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, 5);

    entries.forEach(({ key }) => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing old cache:', error);
  }
}

export function clearCache(key?: string, userId?: string): void {
  if (key) {
    if (userId) {
      localStorage.removeItem(storageKey(key, userId));
    }
    Object.keys(localStorage).forEach((k) => {
      if (k === `cache_${key}` || k.startsWith(`cache_${key}_`)) {
        localStorage.removeItem(k);
      }
    });
  } else {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith('cache_')) localStorage.removeItem(k);
    });
  }
}

export { DEFAULT_CACHE_DURATION };
