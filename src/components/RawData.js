import React, { useState } from 'react';
import './RawData.css';

const RawData = () => {
  const [selectedWeek, setSelectedWeek] = useState('Week 1');

  const rawData = {
    'Week 1': {
      totalOrders: 120,
      foodUsed: 78,
      foodWasted: 30,
      foodDonated: 12,
      moneyWasted: 150,
      ingredients: ['Chicken: 45 lbs', 'Rice: 30 lbs', 'Vegetables: 25 lbs', 'Spices: 5 lbs']
    },
    'Week 2': {
      totalOrders: 150,
      foodUsed: 98,
      foodWasted: 37,
      foodDonated: 15,
      moneyWasted: 180,
      ingredients: ['Beef: 50 lbs', 'Pasta: 35 lbs', 'Vegetables: 30 lbs', 'Cheese: 8 lbs']
    },
    'Week 3': {
      totalOrders: 180,
      foodUsed: 117,
      foodWasted: 45,
      foodDonated: 18,
      moneyWasted: 220,
      ingredients: ['Fish: 55 lbs', 'Rice: 40 lbs', 'Vegetables: 35 lbs', 'Sauce: 10 lbs']
    },
    'Week 4': {
      totalOrders: 160,
      foodUsed: 104,
      foodWasted: 40,
      foodDonated: 16,
      moneyWasted: 190,
      ingredients: ['Pork: 48 lbs', 'Bread: 32 lbs', 'Vegetables: 28 lbs', 'Oil: 6 lbs']
    },
    'Week 5': {
      totalOrders: 200,
      foodUsed: 130,
      foodWasted: 50,
      foodDonated: 20,
      moneyWasted: 250,
      ingredients: ['Chicken: 60 lbs', 'Rice: 45 lbs', 'Vegetables: 40 lbs', 'Spices: 8 lbs']
    }
  };

  const currentData = rawData[selectedWeek];

  return (
    <div className="raw-data-container">
      <div className="raw-data-header">
        <h3 className="raw-data-title">Raw Data #'s</h3>
        <select 
          value={selectedWeek} 
          onChange={(e) => setSelectedWeek(e.target.value)}
          className="week-selector"
        >
          {Object.keys(rawData).map(week => (
            <option key={week} value={week}>{week}</option>
          ))}
        </select>
      </div>
      
      <div className="data-grid">
        <div className="data-card">
          <h4>Total Orders</h4>
          <p className="data-value">{currentData.totalOrders}</p>
        </div>
        
        <div className="data-card">
          <h4>Food Used (%)</h4>
          <p className="data-value">{currentData.foodUsed}%</p>
        </div>
        
        <div className="data-card">
          <h4>Food Wasted (%)</h4>
          <p className="data-value waste">{currentData.foodWasted}%</p>
        </div>
        
        <div className="data-card">
          <h4>Food Donated (%)</h4>
          <p className="data-value donated">{currentData.foodDonated}%</p>
        </div>
        
        <div className="data-card">
          <h4>Money Wasted</h4>
          <p className="data-value money">${currentData.moneyWasted}</p>
        </div>
        
        <div className="data-card ingredients">
          <h4>Ingredients Breakdown</h4>
          <ul className="ingredients-list">
            {currentData.ingredients.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RawData;
