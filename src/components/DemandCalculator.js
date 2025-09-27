import React, { useState } from 'react';
import Header from './Header';
import DishInfo from './DishInfo';
import RestaurantInfo from './RestaurantInfo';
import FormInput from './FormInput';
import './DemandCalculator.css';

<<<<<<< HEAD
const DemandCalculator = ({ currentPage, onPageChange }) => {
=======


const DemandCalculator = () => {
  const [predictedOrders, setPredictedOrders] = useState(null);
>>>>>>> f621c16 (model is added)
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

  const handleCalculateDemand = async () => {
    
    try {
      const response = await fetch("http://127.0.0.1:5000/api/ml", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to calculate demand");
      }
      const result = await response.json();
      console.log("Predicted orders:", result.predictedOrders);
      alert(`Predicted orders: ${result.predictedOrders}`);
      setPredictedOrders(result.predictedOrders);
    }
    catch (error) {
      console.error("Error:", error);
      alert("Something went wrong while calculating demand.");
    }
 
  } 
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
            <h1 className="page-title">Order Optimization</h1>
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
            {predictedOrders !== null && (
              <div className="prediction-result">
                <h3>Predicted Orders: {predictedOrders}</h3>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DemandCalculator;
