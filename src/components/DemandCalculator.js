import React, { useState } from 'react';
import Header from './Header';
import DishInfo from './DishInfo';
import RestaurantInfo from './RestaurantInfo';
import FormInput from './FormInput';
import PastDemandChart from './PastDemandChart';
import './DemandCalculator.css';



const DemandCalculator = ({ currentPage, onPageChange }) => {
  const [predictedOrders, setPredictedOrders] = useState(null);
  const [ingredientAnalysis, setIngredientAnalysis] = useState(null);
  const [isAnalyzingIngredients, setIsAnalyzingIngredients] = useState(false);
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
      setPredictedOrders(result.predictedOrders);
      
      // Store calculation ID for ingredient analysis
      setFormData(prev => ({ ...prev, calculationId: result.calculationId }));
      
      // Automatically analyze ingredients if we have predicted orders and either a dish name or ingredients
      if (result.predictedOrders > 0 && (formData.dishName || formData.majorIngredients)) {
        await analyzeIngredients(result.predictedOrders);
      }
    }
    catch (error) {
      console.error("Error:", error);
      alert("Something went wrong while calculating demand.");
    }
  }

  const analyzeIngredients = async (predictedOrders) => {
    setIsAnalyzingIngredients(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/api/analyze-ingredients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          predictedOrders: predictedOrders,
          dishName: formData.dishName,
          majorIngredients: formData.majorIngredients,
          calculationId: formData.calculationId
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze ingredients");
      }
      
      const result = await response.json();
      console.log("Ingredient analysis:", result);
      setIngredientAnalysis(result);
    }
    catch (error) {
      console.error("Error analyzing ingredients:", error);
      alert("Failed to analyze ingredients. Please check your OpenAI API configuration.");
    }
    finally {
      setIsAnalyzingIngredients(false);
    }
  } 

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
            </div>
            {predictedOrders !== null && (
              <div className="prediction-result">
                <h3>Predicted Orders: {predictedOrders} (next 10 weeks)</h3>
                {isAnalyzingIngredients && (
                  <div className="analyzing-ingredients">
                    <p>🤖 Analyzing ingredients needed...</p>
                  </div>
                )}
                {ingredientAnalysis && !isAnalyzingIngredients && (
                  <div className="ingredient-analysis">
                    <h4>📋 Ingredient Analysis</h4>
                    {ingredientAnalysis.ingredients && ingredientAnalysis.ingredients.length > 0 ? (
                      <div className="ingredients-list">
                        <h5>Ingredients Needed:</h5>
                        <ul>
                          {ingredientAnalysis.ingredients.map((ingredient, index) => (
                            <li key={index}>
                              <strong>{ingredient.name}</strong>: {ingredient.quantity} {ingredient.unit}
                              {ingredient.storage && <span className="storage-info"> ({ingredient.storage})</span>}
                              {ingredient.notes && <span className="ingredient-notes"> - {ingredient.notes}</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="raw-analysis">
                        <p>{ingredientAnalysis.raw_analysis || "Analysis completed but no structured data available."}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      
      <PastDemandChart />
    </div>
  );
};

export default DemandCalculator;
