import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getCachedData, setCachedData, clearCache, ListCacheKey } from '../utils/cache';
import { useAuth } from './AuthContext';

interface CacheState {
  teams: any[] | null;
  athletes: any[] | null;
  committee: any[] | null;
  tournaments: any[] | null;
  matches: any[] | null;
}

interface CacheContextType {
  cache: CacheState;
  revision: number;
  setCacheData: (key: ListCacheKey, data: any[]) => void;
  getCacheData: (key: ListCacheKey) => any[] | null;
  invalidateCache: (key?: ListCacheKey) => void;
}

const EMPTY_CACHE: CacheState = {
  teams: null,
  athletes: null,
  committee: null,
  tournaments: null,
  matches: null,
};

const CacheContext = createContext<CacheContextType | undefined>(undefined);

export const CacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cache, setCache] = useState<CacheState>(EMPTY_CACHE);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      setCache(EMPTY_CACHE);
      return;
    }

    const keys: ListCacheKey[] = ['teams', 'athletes', 'committee', 'tournaments', 'matches'];
    const loaded: Partial<CacheState> = {};
    keys.forEach((key) => {
      const data = getCachedData(key, user.id);
      if (data) loaded[key] = data;
    });
    setCache({ ...EMPTY_CACHE, ...loaded });
  }, [user?.id]);

  const setCacheData = useCallback((key: ListCacheKey, data: any[]) => {
    setCache((prev) => ({ ...prev, [key]: data }));
    if (user?.id) setCachedData(key, data, user.id);
  }, [user?.id]);

  const getCacheData = useCallback((key: ListCacheKey) => cache[key], [cache]);

  const invalidateCache = useCallback((key?: ListCacheKey) => {
    if (key) {
      setCache((prev) => ({ ...prev, [key]: null }));
      clearCache(key, user?.id);
    } else {
      setCache(EMPTY_CACHE);
      clearCache(undefined, user?.id);
    }
    setRevision((value) => value + 1);
  }, [user?.id]);

  const value = useMemo(
    () => ({ cache, revision, setCacheData, getCacheData, invalidateCache }),
    [cache, revision, setCacheData, getCacheData, invalidateCache],
  );

  return <CacheContext.Provider value={value}>{children}</CacheContext.Provider>;
};

export const useCache = () => {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCache must be used within CacheProvider');
  }
  return context;
};
