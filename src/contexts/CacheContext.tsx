import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getCachedData, setCachedData, clearCache } from '../utils/cache';

interface CacheState {
  teams: any[] | null;
  athletes: any[] | null;
  committee: any[] | null;
  tournaments: any[] | null;
  matches: any[] | null;
}

interface CacheContextType {
  cache: CacheState;
  setCacheData: (key: keyof CacheState, data: any[]) => void;
  getCacheData: (key: keyof CacheState) => any[] | null;
  invalidateCache: (key?: keyof CacheState) => void;
  isCacheFresh: (key: keyof CacheState) => boolean;
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

export const CacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cache, setCache] = useState<CacheState>({
    teams: null,
    athletes: null,
    committee: null,
    tournaments: null,
    matches: null,
  });

  // Load cache from localStorage on mount
  useEffect(() => {
    const keys: (keyof CacheState)[] = ['teams', 'athletes', 'committee', 'tournaments', 'matches'];
    const loadedCache: Partial<CacheState> = {};

    keys.forEach(key => {
      const data = getCachedData(key);
      if (data) {
        loadedCache[key] = data;
      }
    });

    setCache(prev => ({
      ...prev,
      ...loadedCache,
    }));
  }, []);

  const setCacheData = useCallback((key: keyof CacheState, data: any[]) => {
    setCache(prev => ({
      ...prev,
      [key]: data,
    }));
    setCachedData(key, data);
  }, []);

  const getCacheData = useCallback((key: keyof CacheState) => {
    return cache[key];
  }, [cache]);

  const invalidateCache = useCallback((key?: keyof CacheState) => {
    if (key) {
      setCache(prev => ({
        ...prev,
        [key]: null,
      }));
      clearCache(key);
    } else {
      setCache({
        teams: null,
        athletes: null,
        committee: null,
        tournaments: null,
        matches: null,
      });
      clearCache();
    }
  }, []);

  const isCacheFresh = useCallback((key: keyof CacheState) => {
    return getCachedData(key) !== null;
  }, []);

  return (
    <CacheContext.Provider value={{ cache, setCacheData, getCacheData, invalidateCache, isCacheFresh }}>
      {children}
    </CacheContext.Provider>
  );
};

export const useCache = () => {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCache must be used within CacheProvider');
  }
  return context;
};
