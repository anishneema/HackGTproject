import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './BarChart.css';

const BarChart = () => {
  const data = [
    { week: 'Week 1', orders: 120 },
    { week: 'Week 2', orders: 150 },
    { week: 'Week 3', orders: 180 },
    { week: 'Week 4', orders: 160 },
    { week: 'Week 5', orders: 200 },
    { week: 'Week 6', orders: 190 },
    { week: 'Week 7', orders: 220 },
    { week: 'Week 8', orders: 210 },
    { week: 'Week 9', orders: 240 },
    { week: 'Week 10', orders: 230 }
  ];

  return (
    <div className="bar-chart-container">
      <h3 className="chart-title">Barchart - 10 weeks</h3>
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
              label={{ value: 'Orders', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                color: 'white'
              }}
              formatter={(value, name) => [value, 'Orders']}
            />
            <Bar 
              dataKey="orders" 
              fill="#3B82F6" 
              radius={[4, 4, 0, 0]}
            />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BarChart;
