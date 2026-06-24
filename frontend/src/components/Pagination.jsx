import './Pagination.css';

export default function Pagination({
  currentPage,
  hasNext,
  hasPrevious,
  onNext,
  onPrevious,
  disabled
}) {
  return (
    <div className="pagination">
      <button 
        className="pagination-btn"
        onClick={onPrevious}
        disabled={disabled || !hasPrevious}
      >
        Previous
      </button>
      <span className="pagination-page">Page {currentPage}</span>
      <button 
        className="pagination-btn"
        onClick={onNext}
        disabled={disabled || !hasNext}
      >
        Next page
      </button>
    </div>
  );
}
