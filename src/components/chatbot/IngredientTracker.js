import React, { useState } from 'react';
import './IngredientTracker.css';

const IngredientTracker = () => {
  const [ingredients, setIngredients] = useState([
    { id: 1, name: 'Chicken Breast', quantity: 25, unit: 'lbs', expiry: '2024-01-15', status: 'good' },
    { id: 2, name: 'Lettuce', quantity: 12, unit: 'heads', expiry: '2024-01-12', status: 'expiring' },
    { id: 3, name: 'Tomatoes', quantity: 18, unit: 'lbs', expiry: '2024-01-10', status: 'expired' },
    { id: 4, name: 'Rice', quantity: 50, unit: 'lbs', expiry: '2024-02-01', status: 'good' },
    { id: 5, name: 'Onions', quantity: 15, unit: 'lbs', expiry: '2024-01-20', status: 'good' },
    { id: 6, name: 'Cheese', quantity: 8, unit: 'lbs', expiry: '2024-01-11', status: 'expiring' },
    { id: 7, name: 'Bread', quantity: 6, unit: 'loaves', expiry: '2024-01-09', status: 'expired' }
  ]);

  const [newIngredient, setNewIngredient] = useState({
    name: '',
    quantity: '',
    unit: 'lbs',
    expiry: ''
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'good': return '#10B981';
      case 'expiring': return '#F59E0B';
      case 'expired': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'good': return 'Good';
      case 'expiring': return 'Expiring Soon';
      case 'expired': return 'Expired';
      default: return 'Unknown';
    }
  };

  const addIngredient = () => {
    if (newIngredient.name && newIngredient.quantity && newIngredient.expiry) {
      const ingredient = {
        id: Date.now(),
        name: newIngredient.name,
        quantity: parseInt(newIngredient.quantity),
        unit: newIngredient.unit,
        expiry: newIngredient.expiry,
        status: 'good'
      };
      
      setIngredients(prev => [...prev, ingredient]);
      setNewIngredient({ name: '', quantity: '', unit: 'lbs', expiry: '' });
    }
  };

  const removeIngredient = (id) => {
    setIngredients(prev => prev.filter(ingredient => ingredient.id !== id));
  };

  return (
    <div className="ingredient-tracker">
      <div className="tracker-header">
        <h3 className="tracker-title">📦 Ingredient Tracker</h3>
        <div className="tracker-stats">
          <div className="stat">
            <span className="stat-number">{ingredients.length}</span>
            <span className="stat-label">Total Items</span>
          </div>
          <div className="stat">
            <span className="stat-number">{ingredients.filter(i => i.status === 'expiring').length}</span>
            <span className="stat-label">Expiring Soon</span>
          </div>
        </div>
      </div>

      <div className="add-ingredient">
        <h4>Add New Ingredient</h4>
        <div className="add-form">
          <input
            type="text"
            placeholder="Ingredient name"
            value={newIngredient.name}
            onChange={(e) => setNewIngredient(prev => ({ ...prev, name: e.target.value }))}
            className="form-input"
          />
          <div className="input-row">
            <input
              type="number"
              placeholder="Quantity"
              value={newIngredient.quantity}
              onChange={(e) => setNewIngredient(prev => ({ ...prev, quantity: e.target.value }))}
              className="form-input quantity"
            />
            <select
              value={newIngredient.unit}
              onChange={(e) => setNewIngredient(prev => ({ ...prev, unit: e.target.value }))}
              className="form-select"
            >
              <option value="lbs">lbs</option>
              <option value="kg">kg</option>
              <option value="pieces">pieces</option>
              <option value="heads">heads</option>
              <option value="loaves">loaves</option>
              <option value="gallons">gallons</option>
              <option value="liters">liters</option>
            </select>
          </div>
          <input
            type="date"
            value={newIngredient.expiry}
            onChange={(e) => setNewIngredient(prev => ({ ...prev, expiry: e.target.value }))}
            className="form-input"
          />
          <button onClick={addIngredient} className="add-button">
            Add Ingredient
          </button>
        </div>
      </div>

      <div className="ingredients-list">
        <h4>Current Inventory</h4>
        <div className="ingredients-grid">
          {ingredients.map(ingredient => (
            <div key={ingredient.id} className="ingredient-card">
              <div className="ingredient-header">
                <h5 className="ingredient-name">{ingredient.name}</h5>
                <button 
                  onClick={() => removeIngredient(ingredient.id)}
                  className="remove-button"
                >
                  ×
                </button>
              </div>
              <div className="ingredient-details">
                <span className="quantity">
                  {ingredient.quantity} {ingredient.unit}
                </span>
                <span className="expiry">
                  Expires: {new Date(ingredient.expiry).toLocaleDateString()}
                </span>
              </div>
              <div 
                className="status-badge"
                style={{ backgroundColor: getStatusColor(ingredient.status) }}
              >
                {getStatusText(ingredient.status)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IngredientTracker;
