import ProductCard from './ProductCard';
import './ProductGrid.css';

export default function ProductGrid({ products, loading, error, onRetry }) {
  if (error) {
    return (
      <div className="grid-message error">
        <p>{error}</p>
        <button onClick={onRetry} className="retry-btn">Retry</button>
      </div>
    );
  }

  if (loading && products.length === 0) {
    return (
      <div className="product-grid">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton-card" />
        ))}
      </div>
    );
  }

  if (!loading && products.length === 0) {
    return (
      <div className="grid-message empty">
        No products in this category
      </div>
    );
  }

  return (
    <div className="product-grid-container">
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
