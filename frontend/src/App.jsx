import { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import CategoryFilter from './components/CategoryFilter';
import SearchBar from './components/SearchBar';
import ProductGrid from './components/ProductGrid';
import Pagination from './components/Pagination';
import { useProducts } from './hooks/useProducts';
import { fetchCategories } from './api/products';
import './App.css';

export default function App() {
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
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
  } = useProducts();

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(err => console.error('Failed to load categories:', err));
  }, []);

  const handleCategorySelect = (cat) => {
    setSearchQuery('');
    setCategory(cat);
  };

  // Client-side filter for current page's data
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(query));
  }, [products, searchQuery]);

  return (
    <div className="app-container">
      <Header total={total} />
      
      <div className="toolbar">
        <div className="toolbar-left">
          <CategoryFilter 
            categories={categories}
            selected={selectedCategory}
            onSelect={handleCategorySelect}
          />
        </div>
        <div className="toolbar-right">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
      </div>

      <main className="main-content">
        <ProductGrid 
          products={filteredProducts} 
          loading={loading} 
          error={error} 
          onRetry={reset}
        />
        
        {!error && products.length > 0 && (
          <Pagination 
            currentPage={currentPage}
            hasNext={!!nextCursor}
            hasPrevious={cursorHistory.length > 0}
            onNext={loadNext}
            onPrevious={loadPrevious}
            disabled={loading}
          />
        )}
      </main>
    </div>
  );
}
