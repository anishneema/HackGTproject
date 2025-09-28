import React, { useState, useEffect } from 'react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './LineChart.css';

const LineChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/analytics/financial-optimization');
        if (response.ok) {
          const chartData = await response.json();
          setData(chartData);
        } else {
          throw new Error('Failed to fetch financial optimization data');
        }
      } catch (err) {
        console.error('Error fetching financial data:', err);
        setError(err.message);
        // Fallback to sample data if API fails
        setData([
          { week: 'Week 1', moneyWasted: 0 },
          { week: 'Week 2', moneyWasted: 0 },
          { week: 'Week 3', moneyWasted: 0 },
          { week: 'Week 4', moneyWasted: 0 },
          { week: 'Week 5', moneyWasted: 0 },
          { week: 'Week 6', moneyWasted: 0 },
          { week: 'Week 7', moneyWasted: 0 },
          { week: 'Week 8', moneyWasted: 0 },
          { week: 'Week 9', moneyWasted: 0 },
          { week: 'Week 10', moneyWasted: 0 }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, []);

  if (loading) {
    return (
      <div className="line-chart-container">
        <h3 className="chart-title">Financial Optimization</h3>
        <div className="chart-wrapper">
          <div className="loading-message">Loading financial data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="line-chart-container">
        <h3 className="chart-title">Financial Optimization</h3>
        <div className="chart-wrapper">
          <div className="error-message">Error loading data: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="line-chart-container">
      <h3 className="chart-title">Financial Optimization (Last 10 Weeks)</h3>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={300}>
          <RechartsLineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="week" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              label={{ value: '$', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                color: 'white'
              }}
              formatter={(value, name) => [`$${value}`, 'Money Wasted']}
            />
            <Line 
              type="monotone" 
              dataKey="moneyWasted" 
              stroke="#EF4444" 
              strokeWidth={3}
              dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#EF4444', strokeWidth: 2 }}
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LineChart;
