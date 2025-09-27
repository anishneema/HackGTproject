import React from 'react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './LineChart.css';

const LineChart = () => {
  const data = [
    { week: 'Week 1', moneyWasted: 150 },
    { week: 'Week 2', moneyWasted: 180 },
    { week: 'Week 3', moneyWasted: 220 },
    { week: 'Week 4', moneyWasted: 190 },
    { week: 'Week 5', moneyWasted: 250 },
    { week: 'Week 6', moneyWasted: 280 },
    { week: 'Week 7', moneyWasted: 320 },
    { week: 'Week 8', moneyWasted: 300 },
    { week: 'Week 9', moneyWasted: 350 },
    { week: 'Week 10', moneyWasted: 380 }
  ];

  return (
    <div className="line-chart-container">
      <h3 className="chart-title">Financial Optimization</h3>
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
