import React from 'react';
import './Header.css';

const Header = ({ currentPage, onPageChange }) => {
  const handleNavClick = (page, e) => {
    e.preventDefault();
    onPageChange(page);
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <div className="logo-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 2L20 8H28L24 14L28 20H20L16 26L12 20H4L8 14L4 8H12L16 2Z" fill="#1E40AF"/>
              <circle cx="16" cy="16" r="3" fill="#F59E0B"/>
            </svg>
          </div>
          <span className="logo-text">ChefAI</span>
        </div>
        
        <nav className="navigation">
          <a 
            href="/" 
            className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={(e) => handleNavClick('dashboard', e)}
          >
            Home
          </a>
          <a 
            href="/dashboard" 
            className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={(e) => handleNavClick('dashboard', e)}
          >
            Dashboard
          </a>
          <a 
            href="/demand" 
            className={`nav-link ${currentPage === 'demand' ? 'active' : ''}`}
            onClick={(e) => handleNavClick('demand', e)}
          >
            Demand
          </a>
          <a 
            href="/food-banks" 
            className={`nav-link ${currentPage === 'food-banks' ? 'active' : ''}`}
            onClick={(e) => handleNavClick('food-banks', e)}
          >
            Food Banks
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
