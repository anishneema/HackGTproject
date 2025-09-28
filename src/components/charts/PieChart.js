import React, { useState, useEffect } from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import './PieChart.css';

const PieChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchThisWeekData = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/analytics/this-week');
      if (response.ok) {
        const chartData = await response.json();
        setData(chartData);
      } else {
        throw new Error('Failed to fetch this week\'s data');
      }
    } catch (err) {
      console.error('Error fetching this week\'s data:', err);
      setError(err.message);
      // Fallback to sample data if API fails
      setData([
        { name: 'Food Used', value: 0, color: '#10B981' },
        { name: 'Food Wasted', value: 0, color: '#EF4444' },
        { name: 'Food Donated', value: 0, color: '#3B82F6' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThisWeekData();
  }, []);

  // Listen for inventory updates
  useEffect(() => {
    const handleInventoryUpdate = () => {
      fetchThisWeekData();
    };

    window.addEventListener('inventoryUpdated', handleInventoryUpdate);

    return () => {
      window.removeEventListener('inventoryUpdated', handleInventoryUpdate);
    };
  }, []);

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null; // Don't show labels for small slices
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="600"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (loading) {
    return (
      <div className="pie-chart-container">
        <h3 className="chart-title">This Week's Trends</h3>
        <div className="chart-wrapper">
          <div className="loading-message">Loading this week's data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pie-chart-container">
        <h3 className="chart-title">This Week's Trends</h3>
        <div className="chart-wrapper">
          <div className="error-message">Error loading data: {error}</div>
        </div>
      </div>
    );
  }

  // Calculate total for percentage calculations
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="pie-chart-container">
      <h3 className="chart-title">This Week's Trends</h3>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={300}>
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name) => {
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return [`${value} units (${percentage}%)`, name];
              }}
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                color: 'white'
              }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="circle"
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '14px'
              }}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PieChart;
