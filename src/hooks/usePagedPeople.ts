import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const PEOPLE_PAGE_SIZE = 80;

type FetchPage<T> = (
  userId: string,
  args: { limit: number; offset: number; search: string },
) => Promise<T[]>;

export function usePagedPeople<T>(fetchPage: FetchPage<T>, pageSize = PEOPLE_PAGE_SIZE) {
  const { user } = useAuth();
  const [items, setItems] = useState<T[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const itemsRef = useRef<T[]>([]);
  const requestId = useRef(0);
  const observerTarget = useRef<HTMLDivElement>(null);
  const fetchPageRef = useRef(fetchPage);

  itemsRef.current = items;
  fetchPageRef.current = fetchPage;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const load = useCallback(async (reset: boolean) => {
    if (!user?.id) return;
    const id = ++requestId.current;
    if (reset) {
      setLoading(true);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const offset = reset ? 0 : itemsRef.current.length;
      const rows = await fetchPageRef.current(user.id, {
        limit: pageSize,
        offset,
        search: debouncedSearch,
      });
      if (id !== requestId.current) return;
      setHasMore(rows.length === pageSize);
      setItems((prev) => (reset ? rows : [...prev, ...rows]));
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [user?.id, pageSize, debouncedSearch]);

  useEffect(() => {
    setItems([]);
    itemsRef.current = [];
    load(true);
  }, [load]);

  useEffect(() => {
    const node = observerTarget.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && hasMore && !loading && !loadingMore) {
        load(false);
      }
    }, { rootMargin: '200px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, load]);

  return {
    items,
    searchTerm,
    setSearchTerm,
    loading,
    loadingMore,
    hasMore,
    observerTarget,
    reload: () => load(true),
  };
}
