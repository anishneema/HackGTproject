import React, { useState } from 'react';
import Header from './Header';
import DishInfo from './DishInfo';
import RestaurantInfo from './RestaurantInfo';
import './DemandCalculator.css';

const DemandCalculator = ({ currentPage, onPageChange }) => {
  const [formData, setFormData] = useState({
    // Dish Info
    dishPrice: '',
    dishName: '',
    majorIngredients: '',
    category: '',
    cuisine: '',
    emailedInPromotions: true,
    featuredOnHomepage: true,
    discountApplied: true,
    discountPercentage: '',
    
    // Restaurant Info
    cityName: '',
    centerType: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckboxChange = (field, checked) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked
    }));
  };

  const handleCalculateDemand = () => {
    // TODO: Implement demand calculation logic
    console.log('Calculating demand with data:', formData);
    alert('Demand calculation feature coming soon!');
  };

  const handleChatWithAI = () => {
    // TODO: Implement AI chat functionality
    console.log('Opening AI chat');
    alert('AI chat feature coming soon!');
  };

  return (
    <div className="demand-calculator">
      <Header currentPage={currentPage} onPageChange={onPageChange} />
      
      <main className="main-content">
        <div className="container">
          <div className="page-header">
            <h1 className="page-title">Demand Calculator</h1>
            <p className="page-description">
              Calculates total orders for your restaurant for the next 10 weeks. 
              This information can be used to generate a breakdown of what ingredients 
              to buy, and when, to minimize food waste.
            </p>
          </div>

          <div className="form-container">
            <DishInfo 
              formData={formData}
              handleInputChange={handleInputChange}
              handleCheckboxChange={handleCheckboxChange}
            />
            
            <RestaurantInfo 
              formData={formData}
              handleInputChange={handleInputChange}
            />

            <div className="action-buttons">
              <button 
                className="btn btn-primary"
                onClick={handleCalculateDemand}
              >
                Calculate Demand
              </button>
              <button 
                className="btn btn-secondary"
                onClick={handleChatWithAI}
              >
                Chat with AI
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DemandCalculator;
