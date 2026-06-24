import { useState, useEffect } from 'react';
import './Header.css';

export default function Header({ total }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-wordmark">Catalog</div>
      {total > 0 && (
        <div className="header-total">
          {total.toLocaleString()} products
        </div>
      )}
    </header>
  );
}
