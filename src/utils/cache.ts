// Simple cache utility for API responses
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

interface CacheEntry {
  data: any;
  timestamp: number;
}

export function getCachedData(key: string): any | null {
  try {
    const cached = localStorage.getItem(`cache_${key}`);
    if (!cached) return null;

    const entry: CacheEntry = JSON.parse(cached);
    if (Date.now() - entry.timestamp > CACHE_DURATION) {
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
    const entry: CacheEntry = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
  } catch (error) {
    console.error('Error setting cache:', error);
  }
}

export function clearCache(key?: string): void {
  if (key) {
    localStorage.removeItem(`cache_${key}`);
  } else {
    // Clear all cache entries
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('cache_')) {
        localStorage.removeItem(k);
      }
    });
  }
}