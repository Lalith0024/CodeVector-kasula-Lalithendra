import ProductCard from './ProductCard';
import './ProductGrid.css';

export default function ProductGrid({ products, loading, error, onRetry, onClearFilter }) {
  if (error) {
    return (
      <div className="grid-message error">
        <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" strokeWidth="2" fill="none">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p>Something went wrong loading products.</p>
        <button onClick={onRetry} className="action-btn error-btn">Try Again</button>
      </div>
    );
  }

  // Initial load skeleton
  if (loading && products.length === 0) {
    return (
      <div className="product-grid">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="skeleton-card" />
        ))}
      </div>
    );
  }

  // Empty state
  if (!loading && products.length === 0) {
    return (
      <div className="grid-message empty">
        <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1.5" fill="none">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <p>No products found in this category.</p>
        {onClearFilter && (
          <button onClick={onClearFilter} className="action-btn">
            Clear Filter
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`product-grid-container fade-transition ${loading ? 'fade-out' : ''}`}>
      <div className="product-grid">
        {products.map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {loading && products.length > 0 && (
        <div className="loading-row">
          <div className="loading-spinner" />
          <span>Loading more...</span>
        </div>
      )}
    </div>
  );
}
