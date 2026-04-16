import React, { createContext, useContext, useState, useCallback } from 'react';

interface CacheState {
  teams: any[] | null;
  athletes: any[] | null;
  committee: any[] | null;
  tournaments: any[] | null;
  matches: any[] | null;
  lastUpdated: Record<string, number>;
}

interface CacheContextType {
  cache: CacheState;
  setCacheData: (key: keyof Omit<CacheState, 'lastUpdated'>, data: any[]) => void;
  getCacheData: (key: keyof Omit<CacheState, 'lastUpdated'>) => any[] | null;
  invalidateCache: (key?: keyof Omit<CacheState, 'lastUpdated'>) => void;
  isCacheFresh: (key: keyof Omit<CacheState, 'lastUpdated'>, maxAge?: number) => boolean;
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

const DEFAULT_MAX_AGE = 30 * 60 * 1000; // 30 minutes

export const CacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cache, setCache] = useState<CacheState>({
    teams: null,
    athletes: null,
    committee: null,
    tournaments: null,
    matches: null,
    lastUpdated: {},
  });

  const setCacheData = useCallback((key: keyof Omit<CacheState, 'lastUpdated'>, data: any[]) => {
    setCache(prev => ({
      ...prev,
      [key]: data,
      lastUpdated: {
        ...prev.lastUpdated,
        [key]: Date.now(),
      },
    }));
  }, []);

  const getCacheData = useCallback((key: keyof Omit<CacheState, 'lastUpdated'>) => {
    return cache[key];
  }, [cache]);

  const invalidateCache = useCallback((key?: keyof Omit<CacheState, 'lastUpdated'>) => {
    if (key) {
      setCache(prev => ({
        ...prev,
        [key]: null,
        lastUpdated: {
          ...prev.lastUpdated,
          [key]: 0,
        },
      }));
    } else {
      setCache({
        teams: null,
        athletes: null,
        committee: null,
        tournaments: null,
        matches: null,
        lastUpdated: {},
      });
    }
  }, []);

  const isCacheFresh = useCallback((key: keyof Omit<CacheState, 'lastUpdated'>, maxAge = DEFAULT_MAX_AGE) => {
    const lastUpdate = cache.lastUpdated[key] || 0;
    return cache[key] !== null && (Date.now() - lastUpdate < maxAge);
  }, [cache]);

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
