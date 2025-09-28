import React, { useState, useEffect } from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './BarChart.css';

const BarChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeeklyTrends = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/analytics/weekly-trends');
        if (response.ok) {
          const chartData = await response.json();
          setData(chartData);
        } else {
          throw new Error('Failed to fetch weekly trends data');
        }
      } catch (err) {
        console.error('Error fetching weekly trends:', err);
        setError(err.message);
        // Fallback to sample data if API fails
        setData([
          { week: 'Week 1', used: 0, wasted: 0, donated: 0, total: 0 },
          { week: 'Week 2', used: 0, wasted: 0, donated: 0, total: 0 },
          { week: 'Week 3', used: 0, wasted: 0, donated: 0, total: 0 },
          { week: 'Week 4', used: 0, wasted: 0, donated: 0, total: 0 },
          { week: 'Week 5', used: 0, wasted: 0, donated: 0, total: 0 },
          { week: 'Week 6', used: 0, wasted: 0, donated: 0, total: 0 },
          { week: 'Week 7', used: 0, wasted: 0, donated: 0, total: 0 },
          { week: 'Week 8', used: 0, wasted: 0, donated: 0, total: 0 },
          { week: 'Week 9', used: 0, wasted: 0, donated: 0, total: 0 },
          { week: 'Week 10', used: 0, wasted: 0, donated: 0, total: 0 }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyTrends();
  }, []);

  if (loading) {
    return (
      <div className="bar-chart-container">
        <h3 className="chart-title">Long Term Trends</h3>
        <div className="chart-wrapper">
          <div className="loading-message">Loading weekly trends data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bar-chart-container">
        <h3 className="chart-title">Long Term Trends</h3>
        <div className="chart-wrapper">
          <div className="error-message">Error loading data: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bar-chart-container">
      <h3 className="chart-title">Long Term Trends (Last 10 Weeks)</h3>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={300}>
          <RechartsBarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
              label={{ value: 'Food Units', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                color: 'white'
              }}
              formatter={(value, name) => {
                const labelMap = {
                  'used': 'Food Used',
                  'wasted': 'Food Wasted', 
                  'donated': 'Food Donated',
                  'total': 'Total'
                };
                return [value, labelMap[name] || name];
              }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="rect"
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '14px'
              }}
            />
            <Bar 
              dataKey="used" 
              stackId="a"
              fill="#10B981" 
              name="Food Used"
              radius={[0, 0, 0, 0]}
            />
            <Bar 
              dataKey="wasted" 
              stackId="a"
              fill="#EF4444" 
              name="Food Wasted"
              radius={[0, 0, 0, 0]}
            />
            <Bar 
              dataKey="donated" 
              stackId="a"
              fill="#3B82F6" 
              name="Food Donated"
              radius={[4, 4, 0, 0]}
            />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BarChart;
