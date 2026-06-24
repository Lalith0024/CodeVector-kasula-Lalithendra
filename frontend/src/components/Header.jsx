import { useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import './Header.css';

export default function Header({ total, onOpenHelp }) {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {total > 0 && (
          <div className="header-total">
            {total.toLocaleString()} products
          </div>
        )}
        <button onClick={onOpenHelp} className="header-help-btn" title="View Architecture Story">
          <HelpCircle size={20} />
        </button>
      </div>
    </header>
  );
}
