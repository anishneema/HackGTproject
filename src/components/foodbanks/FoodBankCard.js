import React from 'react';
import './FoodBankCard.css';

const FoodBankCard = ({ foodBank }) => {
  const getAcceptanceIcons = (accepts) => {
    const iconMap = {
      'fresh-produce': '🥬',
      'prepared-foods': '🍽️',
      'non-perishables': '🥫',
      'dairy': '🥛'
    };
    return accepts.map(type => iconMap[type] || '📦').join(' ');
  };

  const getTypeColor = (type) => {
    const colorMap = {
      'community': '#10B981',
      'regional': '#3B82F6',
      'local': '#F59E0B',
      'specialized': '#8B5CF6'
    };
    return colorMap[type] || '#6B7280';
  };

  const getTypeLabel = (type) => {
    const labelMap = {
      'community': 'Community',
      'regional': 'Regional',
      'local': 'Local',
      'specialized': 'Specialized'
    };
    return labelMap[type] || type;
  };

  return (
    <div className="food-bank-card">
      <div className="card-header">
        <div className="food-bank-image">
          <img src={foodBank.image} alt={foodBank.name} />
        </div>
        <div className="card-info">
          <div className="name-and-rating">
            <h3 className="food-bank-name">{foodBank.name}</h3>
            <div className="rating">
              <span className="stars">⭐</span>
              <span className="rating-value">{foodBank.rating}</span>
            </div>
          </div>
          <div className="type-and-distance">
            <span 
              className="type-badge"
              style={{ backgroundColor: getTypeColor(foodBank.type) }}
            >
              {getTypeLabel(foodBank.type)}
            </span>
            <span className="distance">{foodBank.distance} miles away</span>
          </div>
        </div>
      </div>

      <div className="card-content">
        <p className="description">{foodBank.description}</p>
        
        <div className="contact-info">
          <div className="address">
            <span className="info-icon">📍</span>
            <span>{foodBank.address}</span>
          </div>
          <div className="phone">
            <span className="info-icon">📞</span>
            <a href={`tel:${foodBank.phone}`}>{foodBank.phone}</a>
          </div>
          <div className="hours">
            <span className="info-icon">🕒</span>
            <span>{foodBank.hours}</span>
          </div>
        </div>

        <div className="accepts-section">
          <h4 className="accepts-title">Accepts:</h4>
          <div className="accepts-items">
            {foodBank.accepts.map((item, index) => (
              <span key={index} className="accepts-item">
                {item.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            ))}
          </div>
          <div className="accepts-icons">
            {getAcceptanceIcons(foodBank.accepts)}
          </div>
        </div>

        <div className="incentives-section">
          <h4 className="incentives-title">Incentives:</h4>
          <ul className="incentives-list">
            {foodBank.incentives.map((incentive, index) => (
              <li key={index} className="incentive-item">
                <span className="incentive-bullet">✓</span>
                {incentive}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card-actions">
        <a 
          href={foodBank.website} 
          target="_blank" 
          rel="noopener noreferrer"
          className="action-button primary"
        >
          Visit Website
        </a>
        <a 
          href={`tel:${foodBank.phone}`}
          className="action-button secondary"
        >
          Call Now
        </a>
        <button className="action-button outline">
          Get Directions
        </button>
      </div>
    </div>
  );
};

export default FoodBankCard;
