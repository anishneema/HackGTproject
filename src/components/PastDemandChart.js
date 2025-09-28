import React, { useState, useEffect } from 'react';
import './PastDemandChart.css';

const PastDemandChart = () => {
  const [demandHistory, setDemandHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState({});
  const [deleting, setDeleting] = useState({});

  useEffect(() => {
    fetchDemandHistory();
  }, []);

  const fetchDemandHistory = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/demand-history');
      if (response.ok) {
        const data = await response.json();
        setDemandHistory(data);
      }
    } catch (error) {
      console.error('Error fetching demand history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async (calculationId) => {
    setRecalculating(prev => ({ ...prev, [calculationId]: true }));
    
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/recalculate/${calculationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        // Update the specific item in the history
        setDemandHistory(prev => 
          prev.map(item => 
            item.id === calculationId 
              ? { 
                  ...item, 
                  predicted_orders: result.predictedOrders,
                  final_price: result.finalPrice,
                  discount_amount: result.discountAmount,
                  updated_at: new Date().toISOString()
                }
              : item
          )
        );
        // Demand recalculated successfully
      } else {
        console.error('Failed to recalculate demand');
      }
    } catch (error) {
      console.error('Error recalculating demand:', error);
    } finally {
      setRecalculating(prev => ({ ...prev, [calculationId]: false }));
    }
  };

  const handleDelete = async (calculationId) => {
    setDeleting(prev => ({ ...prev, [calculationId]: true }));
    
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/demand-history/${calculationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Remove the item from the history
        setDemandHistory(prev => 
          prev.filter(item => item.id !== calculationId)
        );
        // Demand calculation deleted successfully
      } else {
        const errorData = await response.json();
        console.error(`Failed to delete calculation: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting calculation:', error);
    } finally {
      setDeleting(prev => ({ ...prev, [calculationId]: false }));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatBoolean = (value) => {
    return value ? 'Yes' : 'No';
  };

  if (loading) {
    return (
      <div className="past-demand-chart">
        <div className="loading">
          <p>Loading demand history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="past-demand-chart">
      <div className="chart-header">
        <h2>Past Demand Calculations</h2>
        <p>View and manage all your previous demand predictions</p>
      </div>

      {demandHistory.length === 0 ? (
        <div className="no-data">
          <p>No demand calculations found. Start by calculating demand for a dish!</p>
        </div>
      ) : (
        <div className="demand-table-container">
          <table className="demand-table">
            <thead>
              <tr>
                <th>Dish Name</th>
                <th>Category</th>
                <th>Cuisine</th>
                <th>Price</th>
                <th>Predicted Orders</th>
                <th>Ingredients</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {demandHistory.map((item) => (
                <tr key={item.id}>
                  <td className="dish-name">
                    <strong>{item.dish_name || 'Unnamed Dish'}</strong>
                    {item.major_ingredients && (
                      <div className="ingredients-preview">
                        {item.major_ingredients}
                      </div>
                    )}
                  </td>
                  <td className="category">
                    <span className="category-badge">{item.category}</span>
                  </td>
                  <td className="cuisine">
                    <span className="cuisine-badge">{item.cuisine}</span>
                  </td>
                  <td className="price">
                    <div className="price-info">
                      <div className="final-price">${item.final_price?.toFixed(2)}</div>
                      {item.discount_applied && (
                        <div className="discount-info">
                          <span className="original-price">${item.dish_price?.toFixed(2)}</span>
                          <span className="discount-percent">-{item.discount_percentage}%</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="predicted-orders">
                    <div className="orders-info">
                      <span className="orders-number">{item.predicted_orders}</span>
                      <span className="orders-period">(next 10 weeks)</span>
                    </div>
                  </td>
                  <td className="ingredients-analysis">
                    {item.ingredient_analysis && item.ingredient_analysis.ingredients ? (
                      <div className="ingredients-list">
                        {item.ingredient_analysis.ingredients.slice(0, 3).map((ingredient, index) => (
                          <div key={index} className="ingredient-item">
                            <span className="ingredient-name">{ingredient.name}</span>
                            <span className="ingredient-quantity">
                              {ingredient.quantity} {ingredient.unit}
                            </span>
                          </div>
                        ))}
                        {item.ingredient_analysis.ingredients.length > 3 && (
                          <div className="more-ingredients">
                            +{item.ingredient_analysis.ingredients.length - 3} more
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="no-analysis">No analysis available</span>
                    )}
                  </td>
                  <td className="created-date">
                    <div className="date-info">
                      <div className="created">{formatDate(item.created_at)}</div>
                      {item.updated_at !== item.created_at && (
                        <div className="updated">Updated: {formatDate(item.updated_at)}</div>
                      )}
                    </div>
                  </td>
                  <td className="actions">
                    <div className="action-buttons">
                      <button
                        className="recalculate-btn"
                        onClick={() => handleRecalculate(item.id)}
                        disabled={recalculating[item.id]}
                      >
                        {recalculating[item.id] ? 'Recalculating...' : 'Recalculate'}
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(item.id)}
                        disabled={deleting[item.id]}
                        title="Delete calculation"
                      >
                        {deleting[item.id] ? 'Deleting...' : '🗑️'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PastDemandChart;
