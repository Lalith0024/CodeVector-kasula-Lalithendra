import { useState, useCallback, useEffect, useRef } from 'react';
import { fetchProducts } from '../api/products';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  const [cursorHistory, setCursorHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const isInitialMount = useRef(true);

  // We cache pages by cursor to avoid refetching and effectively keep previous pages in state
  const [pageCache, setPageCache] = useState({});

  const loadPage = useCallback(async (cursor, category = selectedCategory) => {
    setLoading(true);
    setError(null);
    try {
      const cacheKey = `${category || 'all'}_${cursor || 'root'}`;
      
      if (pageCache[cacheKey]) {
        const cached = pageCache[cacheKey];
        setProducts(cached.data);
        setNextCursor(cached.nextCursor);
        setTotal(cached.total);
        setLoading(false);
        return;
      }

      const data = await fetchProducts({ category, cursor });
      
      setProducts(data.data);
      setNextCursor(data.next_cursor);
      setTotal(data.total);
      
      setPageCache(prev => ({
        ...prev,
        [cacheKey]: {
          data: data.data,
          nextCursor: data.next_cursor,
          total: data.total
        }
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, pageCache]);

  const loadNext = useCallback(() => {
    if (!nextCursor) return;
    setCursorHistory(prev => [...prev, nextCursor]);
    setCurrentPage(prev => prev + 1);
    loadPage(nextCursor, selectedCategory);
  }, [nextCursor, selectedCategory, loadPage]);

  const loadPrevious = useCallback(() => {
    if (cursorHistory.length === 0) return;
    
    const newHistory = [...cursorHistory];
    newHistory.pop(); // remove current page cursor
    
    const previousCursor = newHistory.length > 0 ? newHistory[newHistory.length - 1] : null;
    
    setCursorHistory(newHistory);
    setCurrentPage(prev => Math.max(1, prev - 1));
    loadPage(previousCursor, selectedCategory);
  }, [cursorHistory, selectedCategory, loadPage]);

  const setCategory = useCallback((cat) => {
    setSelectedCategory(cat);
    setCursorHistory([]);
    setCurrentPage(1);
    loadPage(null, cat);
  }, [loadPage]);

  const reset = useCallback(() => {
    setCategory(null);
  }, [setCategory]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      loadPage(null, null);
    }
  }, [loadPage]);

  return {
    products,
    nextCursor,
    loading,
    error,
    total,
    selectedCategory,
    cursorHistory,
    currentPage,
    loadNext,
    loadPrevious,
    setCategory,
    reset
  };
}
