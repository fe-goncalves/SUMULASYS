// Advanced cache utility with configurable TTL
const DEFAULT_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const AGGRESSIVE_CACHE_DURATION = 60 * 60 * 1000; // 1 hour for list views
const MAX_CACHE_SIZE = 10 * 1024 * 1024; // 10MB

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

const CACHE_TTL_CONFIG: Record<string, number> = {
  'teams': AGGRESSIVE_CACHE_DURATION,
  'athletes': AGGRESSIVE_CACHE_DURATION,
  'committee': AGGRESSIVE_CACHE_DURATION,
  'tournaments': AGGRESSIVE_CACHE_DURATION,
  'matches': AGGRESSIVE_CACHE_DURATION,
};

export function getCachedData(key: string): any | null {
  try {
    const cached = localStorage.getItem(`cache_${key}`);
    if (!cached) return null;

    const entry: CacheEntry = JSON.parse(cached);
    if (Date.now() - entry.timestamp > entry.ttl) {
      localStorage.removeItem(`cache_${key}`);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
}

export function setCachedData(key: string, data: any): void {
  try {
    const cacheBase = key.split('_')[0];
    const ttl = CACHE_TTL_CONFIG[cacheBase] || DEFAULT_CACHE_DURATION;
    
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl
    };
    
    const cacheStr = JSON.stringify(entry);
    
    // Check if we're about to exceed cache limit
    if (cacheStr.length > MAX_CACHE_SIZE * 0.1) {
      console.warn(`Cache entry for ${key} is large: ${cacheStr.length / 1024}KB`);
    }
    
    localStorage.setItem(`cache_${key}`, cacheStr);
  } catch (error) {
    console.error('Error setting cache:', error);
    // If storage quota exceeded, clear old cache entries
    if (error instanceof Error && error.message.includes('QuotaExceededError')) {
      clearOldestCacheEntries();
      try {
        const ttl = CACHE_TTL_CONFIG[key] || DEFAULT_CACHE_DURATION;
        const entry: CacheEntry = { data, timestamp: Date.now(), ttl };
        localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
      } catch (retryError) {
        console.error('Cache retry failed:', retryError);
      }
    }
  }
}

function clearOldestCacheEntries(): void {
  try {
    const entries = Object.keys(localStorage)
      .filter(k => k.startsWith('cache_'))
      .map(k => {
        try {
          const entry = JSON.parse(localStorage.getItem(k) || '{}') as CacheEntry;
          return { key: k, timestamp: entry.timestamp };
        } catch {
          return { key: k, timestamp: 0 };
        }
      })
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, Math.ceil(Object.keys(localStorage).length * 0.1));

    entries.forEach(({ key }) => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing old cache:', error);
  }
}

export function clearCache(key?: string): void {
  if (key) {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith(`cache_${key}`)) {
        localStorage.removeItem(k);
      }
    });
  } else {
    // Clear all cache entries
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('cache_')) {
        localStorage.removeItem(k);
      }
    });
  }
}