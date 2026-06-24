import './CategoryFilter.css';

export default function CategoryFilter({ categories = [], selected, onSelect }) {
  return (
    <div className="category-filter" role="group" aria-label="Filter by category">
      <button 
        className={`category-pill ${!selected ? 'active' : ''}`}
        onClick={() => onSelect(null)}
        aria-pressed={!selected}
      >
        All
      </button>
      {categories.map(cat => (
        <button
          key={cat}
          className={`category-pill ${selected === cat ? 'active' : ''}`}
          onClick={() => onSelect(cat)}
          aria-pressed={selected === cat}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
