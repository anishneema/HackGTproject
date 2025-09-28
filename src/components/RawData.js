import React, { useState, useEffect } from 'react';
import './RawData.css';

const RawData = () => {
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [weekData, setWeekData] = useState(null);
  const [mostWasted, setMostWasted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const weekOptions = [
    { value: 1, label: 'Current Week' },
    { value: 2, label: 'Week -1' },
    { value: 3, label: 'Week -2' },
    { value: 4, label: 'Week -3' },
    { value: 5, label: 'Week -4' }
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch week data
      const weekResponse = await fetch(`http://127.0.0.1:5000/api/analytics/raw-data/${selectedWeek}`);
      if (weekResponse.ok) {
        const weekDataResult = await weekResponse.json();
        setWeekData(weekDataResult);
      } else {
        throw new Error('Failed to fetch week data');
      }

      // Fetch most wasted food (always for current week)
      const wastedResponse = await fetch('http://127.0.0.1:5000/api/analytics/most-wasted');
      if (wastedResponse.ok) {
        const wastedData = await wastedResponse.json();
        setMostWasted(wastedData);
      } else {
        throw new Error('Failed to fetch most wasted data');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
      // Set fallback data
      setWeekData({
        food_used_pct: 0,
        food_wasted_pct: 0,
        food_donated_pct: 0,
        money_wasted: 0
      });
      setMostWasted([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedWeek]);

  // Auto-refresh every 30 seconds to catch new transactions
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [selectedWeek]);

  // Listen for storage events (when other tabs/components update data)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'inventory_updated') {
        fetchData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events
    const handleInventoryUpdate = () => {
      fetchData();
    };

    window.addEventListener('inventoryUpdated', handleInventoryUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('inventoryUpdated', handleInventoryUpdate);
    };
  }, [selectedWeek]);

  if (loading) {
    return (
      <div className="raw-data-container">
        <div className="raw-data-header">
          <h3 className="raw-data-title">Raw Data #'s</h3>
        </div>
        <div className="loading-message">Loading data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="raw-data-container">
        <div className="raw-data-header">
          <h3 className="raw-data-title">Raw Data #'s</h3>
        </div>
        <div className="error-message">Error loading data: {error}</div>
      </div>
    );
  }

  return (
    <div className="raw-data-container">
      <div className="raw-data-header">
        <h3 className="raw-data-title">Raw Data #'s</h3>
        <select 
          value={selectedWeek} 
          onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
          className="week-selector"
        >
          {weekOptions.map(week => (
            <option key={week.value} value={week.value}>{week.label}</option>
          ))}
        </select>
      </div>
      
      <div className="data-grid">
        <div className="data-card">
          <h4>Food Used (%)</h4>
          <p className="data-value">{weekData?.food_used_pct || 0}%</p>
        </div>
        
        <div className="data-card">
          <h4>Food Wasted (%)</h4>
          <p className="data-value waste">{weekData?.food_wasted_pct || 0}%</p>
        </div>
        
        <div className="data-card">
          <h4>Food Donated (%)</h4>
          <p className="data-value donated">{weekData?.food_donated_pct || 0}%</p>
        </div>
        
        <div className="data-card">
          <h4>Money Wasted</h4>
          <p className="data-value money">${weekData?.money_wasted || 0}</p>
        </div>
        
        <div className="data-card ingredients">
          <h4>Most Wasted (This Week)</h4>
          {mostWasted.length > 0 ? (
            <ul className="ingredients-list">
              {mostWasted.slice(0, 5).map((item, index) => (
                <li key={index}>
                  {item.name}: {item.quantity} {item.unit}
                  {item.total_cost > 0 && (
                    <span className="cost-info"> (${item.total_cost})</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-data">No waste data available for this week</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RawData;
