import { useState, useEffect } from 'react';
import './SearchBar.css';

export default function SearchBar({ value, onChange }) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onChange(localValue);
    }, 150);
    return () => clearTimeout(handler);
  }, [localValue, onChange]);

  // Filters only the current page's data
  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Filter current page..."
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="search-input"
      />
      {localValue && (
        <button 
          className="search-clear"
          onClick={() => setLocalValue('')}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  );
}
