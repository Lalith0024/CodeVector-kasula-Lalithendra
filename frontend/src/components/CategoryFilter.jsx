import './CategoryFilter.css';

export default function CategoryFilter({ categories = [], selected, onSelect }) {
  return (
    <div className="category-filter">
      <button 
        className={`category-pill ${!selected ? 'active' : ''}`}
        onClick={() => onSelect(null)}
      >
        All
      </button>
      {categories.map(cat => (
        <button
          key={cat}
          className={`category-pill ${selected === cat ? 'active' : ''}`}
          onClick={() => onSelect(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
