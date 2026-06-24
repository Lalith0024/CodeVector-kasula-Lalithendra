import { useState, useEffect } from 'react';
import { Mail } from 'lucide-react';
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
      <div className="header-left">
        <div className="header-wordmark">InventorySight</div>
        <nav className="header-nav">
          <button className="nav-link active">Dashboard</button>
          <button className="nav-link" onClick={onOpenHelp}>How It Works</button>
        </nav>
      </div>
      
      <div className="header-right">
        {total > 0 && (
          <div className="header-total">
            {total.toLocaleString()} products
          </div>
        )}
        <a 
          href="mailto:kasula.Lalithendra2024@nst.rishihood.edu.in" 
          className="contact-btn"
        >
          <Mail size={16} />
          Contact Candidate
        </a>
      </div>
    </header>
  );
}
