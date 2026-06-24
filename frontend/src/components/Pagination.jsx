import './Pagination.css';

export default function Pagination({
  currentPage,
  hasNext,
  hasPrevious,
  onNext,
  onPrevious,
  disabled,
  total,
  pageSize = 20
}) {
  const startRange = total > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endRange = Math.min(currentPage * pageSize, total);

  return (
    <div className="pagination" aria-label="Pagination Navigation">
      <button 
        className="pagination-btn"
        onClick={onPrevious}
        disabled={disabled || !hasPrevious}
        aria-label="Previous page"
      >
        {disabled ? <span className="btn-spinner" /> : null}
        Previous
      </button>
      
      <div className="pagination-info">
        <span className="pagination-page">Page {currentPage}</span>
        {total > 0 && (
          <span className="pagination-range">
            Showing {startRange.toLocaleString()}–{endRange.toLocaleString()} of {total.toLocaleString()} products
          </span>
        )}
      </div>

      <button 
        className="pagination-btn"
        onClick={onNext}
        disabled={disabled || !hasNext}
        aria-label="Next page"
      >
        Next page
        {disabled ? <span className="btn-spinner" /> : null}
      </button>
    </div>
  );
}
