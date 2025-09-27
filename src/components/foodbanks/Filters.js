import React from 'react';
import './Filters.css';

const Filters = ({ filters, onFilterChange }) => {
  const distanceOptions = [
    { value: '5', label: 'Within 5 miles' },
    { value: '10', label: 'Within 10 miles' },
    { value: '25', label: 'Within 25 miles' },
    { value: '50', label: 'Within 50 miles' }
  ];

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'community', label: 'Community Food Banks' },
    { value: 'regional', label: 'Regional Organizations' },
    { value: 'local', label: 'Local Centers' },
    { value: 'specialized', label: 'Specialized Services' }
  ];

  const acceptsOptions = [
    { value: 'all', label: 'All Food Types' },
    { value: 'fresh-produce', label: 'Fresh Produce' },
    { value: 'prepared-foods', label: 'Prepared Foods' },
    { value: 'non-perishables', label: 'Non-Perishables' },
    { value: 'dairy', label: 'Dairy Products' }
  ];

  const ratingOptions = [
    { value: 'all', label: 'All Ratings' },
    { value: '4.5', label: '4.5+ Stars' },
    { value: '4.0', label: '4.0+ Stars' },
    { value: '3.5', label: '3.5+ Stars' }
  ];

  const handleFilterChange = (filterName, value) => {
    onFilterChange(filterName, value);
  };

  return (
    <div className="filters-container">
      <div className="filters-header">
        <h3 className="filters-title">Filters</h3>
        <button 
          className="clear-filters-button"
          onClick={() => {
            onFilterChange('distance', '10');
            onFilterChange('type', 'all');
            onFilterChange('accepts', 'all');
            onFilterChange('rating', 'all');
          }}
        >
          Clear All
        </button>
      </div>

      <div className="filters-grid">
        <div className="filter-group">
          <label className="filter-label">Distance</label>
          <select
            value={filters.distance}
            onChange={(e) => handleFilterChange('distance', e.target.value)}
            className="filter-select"
          >
            {distanceOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Organization Type</label>
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="filter-select"
          >
            {typeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Accepts</label>
          <select
            value={filters.accepts}
            onChange={(e) => handleFilterChange('accepts', e.target.value)}
            className="filter-select"
          >
            {acceptsOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Minimum Rating</label>
          <select
            value={filters.rating}
            onChange={(e) => handleFilterChange('rating', e.target.value)}
            className="filter-select"
          >
            {ratingOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="incentive-highlights">
        <h4 className="incentive-title">💡 Donation Incentives</h4>
        <div className="incentive-list">
          <div className="incentive-item">
            <span className="incentive-icon">📋</span>
            <span>Tax deduction receipts</span>
          </div>
          <div className="incentive-item">
            <span className="incentive-icon">🏆</span>
            <span>Community recognition</span>
          </div>
          <div className="incentive-item">
            <span className="incentive-icon">📊</span>
            <span>Impact reporting</span>
          </div>
          <div className="incentive-item">
            <span className="incentive-icon">🤝</span>
            <span>Partnership opportunities</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Filters;
