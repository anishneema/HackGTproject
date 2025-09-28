import React, { useState, useEffect } from 'react';
import './FoodBankCard.css';

const FoodBankCard = ({ foodBank }) => {
  const [showAllNeeds, setShowAllNeeds] = useState(false);

  // Hardcoded needs for each food bank
  const getHardcodedNeeds = (bankId) => {
    const needsData = {
      1: [ // Atlanta Community Food Bank
        { food_category: 'Protein', food_type: 'Chicken Breast', quantity_needed: 100, unit: 'lbs', priority_level: 3, notes: 'High demand for protein items' },
        { food_category: 'Vegetables', food_type: 'Fresh Vegetables', quantity_needed: 200, unit: 'lbs', priority_level: 2, notes: 'Need fresh produce for families' },
        { food_category: 'Dairy', food_type: 'Milk', quantity_needed: 50, unit: 'gallons', priority_level: 4, notes: 'Critical need for dairy products' },
        { food_category: 'Grains', food_type: 'Bread', quantity_needed: 30, unit: 'loaves', priority_level: 2, notes: 'Daily bread distribution' },
        { food_category: 'Protein', food_type: 'Ground Turkey', quantity_needed: 60, unit: 'lbs', priority_level: 3, notes: 'Alternative protein source' }
      ],
      2: [ // Second Harvest Food Bank
        { food_category: 'Protein', food_type: 'Ground Beef', quantity_needed: 75, unit: 'lbs', priority_level: 2, notes: 'Regular protein need' },
        { food_category: 'Grains', food_type: 'Rice', quantity_needed: 150, unit: 'lbs', priority_level: 1, notes: 'Staple food item' },
        { food_category: 'Vegetables', food_type: 'Canned Vegetables', quantity_needed: 100, unit: 'cans', priority_level: 2, notes: 'Non-perishable vegetables' },
        { food_category: 'Dairy', food_type: 'Yogurt', quantity_needed: 40, unit: 'containers', priority_level: 3, notes: 'Healthy dairy option' }
      ],
      3: [ // Metro Atlanta Food Bank
        { food_category: 'Vegetables', food_type: 'Leafy Greens', quantity_needed: 80, unit: 'lbs', priority_level: 3, notes: 'Fresh vegetables for nutrition programs' },
        { food_category: 'Dairy', food_type: 'Cheese', quantity_needed: 30, unit: 'lbs', priority_level: 2, notes: 'Dairy products for meal programs' },
        { food_category: 'Protein', food_type: 'Eggs', quantity_needed: 20, unit: 'dozen', priority_level: 4, notes: 'Critical need for protein' },
        { food_category: 'Fruits', food_type: 'Fresh Fruits', quantity_needed: 120, unit: 'lbs', priority_level: 2, notes: 'Fresh fruit for families' }
      ],
      4: [ // Community Kitchen Atlanta
        { food_category: 'Protein', food_type: 'Fish', quantity_needed: 40, unit: 'lbs', priority_level: 2, notes: 'Healthy protein option' },
        { food_category: 'Vegetables', food_type: 'Root Vegetables', quantity_needed: 60, unit: 'lbs', priority_level: 1, notes: 'Long-lasting vegetables' },
        { food_category: 'Grains', food_type: 'Pasta', quantity_needed: 50, unit: 'lbs', priority_level: 2, notes: 'Staple grain product' },
        { food_category: 'Dairy', food_type: 'Butter', quantity_needed: 15, unit: 'lbs', priority_level: 1, notes: 'Cooking ingredient' }
      ]
    };
    return needsData[bankId] || [];
  };

  const needs = getHardcodedNeeds(foodBank.id);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 4: return '#dc2626'; // Critical
      case 3: return '#ea580c'; // High
      case 2: return '#d97706'; // Medium
      case 1: return '#16a34a'; // Low
      default: return '#6b7280';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 4: return 'Critical';
      case 3: return 'High';
      case 2: return 'Medium';
      case 1: return 'Low';
      default: return 'Unknown';
    }
  };
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

        <div className="needs-section">
          <h4 className="needs-title">Current Needs:</h4>
          {needs.length > 0 ? (
            <div className="needs-list">
              {(showAllNeeds ? needs : needs.slice(0, 3)).map((need, index) => (
                <div key={index} className="need-item">
                  <div className="need-header">
                    <span className="need-category">{need.food_category}</span>
                    <span 
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(need.priority_level) }}
                    >
                      {getPriorityText(need.priority_level)}
                    </span>
                  </div>
                  <div className="need-details">
                    {need.food_type && <span className="need-type">{need.food_type}</span>}
                    {need.quantity_needed && (
                      <span className="need-quantity">
                        {need.quantity_needed} {need.unit}
                      </span>
                    )}
                  </div>
                  {need.notes && <div className="need-notes">{need.notes}</div>}
                </div>
              ))}
              {needs.length > 3 && (
                <button 
                  className="more-needs-btn"
                  onClick={() => setShowAllNeeds(!showAllNeeds)}
                >
                  {showAllNeeds ? 'Show Less' : `+${needs.length - 3} more needs`}
                </button>
              )}
            </div>
          ) : (
            <div className="no-needs">No current needs listed</div>
          )}
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
