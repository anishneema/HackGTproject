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
          <img src="/images/hackgtlogo.png" alt="ServeSmart Logo" className="logo-icon" />
          <span className="logo-text">ServeSmart</span>
        </div>
        
        <nav className="navigation">
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
            href="/chatbot" 
            className={`nav-link ${currentPage === 'chatbot' ? 'active' : ''}`}
            onClick={(e) => handleNavClick('chatbot', e)}
          >
            AI Assistant
          </a>
          <a 
            href="/food-banks" 
            className={`nav-link ${currentPage === 'food-banks' ? 'active' : ''}`}
            onClick={(e) => handleNavClick('food-banks', e)}
          >
            Donations
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
