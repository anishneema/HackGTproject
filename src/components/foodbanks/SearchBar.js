import React, { useState } from 'react';
import './SearchBar.css';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value); // Real-time search
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="search-bar-container">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-wrapper">
          <div className="search-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Search donation hubs by name, location, or services..."
            className="search-input"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="clear-button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
        <button type="submit" className="search-button">
          Search
        </button>
      </form>
      
      <div className="quick-filters">
        <span className="quick-filters-label">Quick filters:</span>
        <button 
          className="quick-filter-tag"
          onClick={() => onSearch('Atlanta')}
        >
          Atlanta
        </button>
        <button 
          className="quick-filter-tag"
          onClick={() => onSearch('fresh produce')}
        >
          Fresh Produce
        </button>
        <button 
          className="quick-filter-tag"
          onClick={() => onSearch('prepared foods')}
        >
          Prepared Foods
        </button>
        <button 
          className="quick-filter-tag"
          onClick={() => onSearch('seniors')}
        >
          Seniors
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
