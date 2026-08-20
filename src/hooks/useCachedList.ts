import { useCallback, useEffect, useState } from 'react';
import { ListCacheKey } from '../utils/cache';
import { useAuth } from '../contexts/AuthContext';
import { useCache } from '../contexts/CacheContext';

export function useCachedList<T = any>(
  key: ListCacheKey,
  fetcher: (userId: string) => Promise<T[]>,
) {
  const { user } = useAuth();
  const { getCacheData, setCacheData, invalidateCache, revision } = useCache();
  const cached = getCacheData(key) as T[] | null;
  const [data, setData] = useState<T[]>(cached || []);
  const [loading, setLoading] = useState(!cached);

  const load = useCallback(async (silent = false) => {
    if (!user?.id) return;
    if (!silent && !getCacheData(key)) setLoading(true);
    try {
      const fresh = await fetcher(user.id);
      setCacheData(key, fresh);
      setData(fresh);
    } finally {
      setLoading(false);
    }
  }, [user?.id, key, fetcher, getCacheData, setCacheData]);

  useEffect(() => {
    const existing = getCacheData(key) as T[] | null;
    if (existing) {
      setData(existing);
      setLoading(false);
      load(true);
    } else {
      load(false);
    }
  }, [user?.id, key, revision]);

  const reload = useCallback(async () => {
    invalidateCache(key);
    await load(false);
  }, [invalidateCache, key, load]);

  return { data, setData, loading, reload };
}
