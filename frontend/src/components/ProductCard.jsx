import { formatRelative } from '../utils/time';
import './ProductCard.css';

export default function ProductCard({ product }) {
  return (
    <div className="product-card">
      <div className="product-card-header">
        <span className="product-tag">{product.category}</span>
      </div>
      <div className="product-name" title={product.name}>
        {product.name}
      </div>
      <div className="product-card-footer">
        <span className="product-price">${parseFloat(product.price).toFixed(2)}</span>
        <span className="product-time">{formatRelative(product.created_at)}</span>
      </div>
    </div>
  );
}
