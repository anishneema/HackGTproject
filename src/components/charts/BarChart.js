import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './BarChart.css';

const BarChart = () => {
  const data = [
    { week: 'Week 1', used: 78, wasted: 30, donated: 12, total: 120 },
    { week: 'Week 2', used: 98, wasted: 37, donated: 15, total: 150 },
    { week: 'Week 3', used: 117, wasted: 45, donated: 18, total: 180 },
    { week: 'Week 4', used: 104, wasted: 40, donated: 16, total: 160 },
    { week: 'Week 5', used: 130, wasted: 50, donated: 20, total: 200 },
    { week: 'Week 6', used: 124, wasted: 48, donated: 18, total: 190 },
    { week: 'Week 7', used: 143, wasted: 55, donated: 22, total: 220 },
    { week: 'Week 8', used: 137, wasted: 53, donated: 20, total: 210 },
    { week: 'Week 9', used: 156, wasted: 60, donated: 24, total: 240 },
    { week: 'Week 10', used: 150, wasted: 58, donated: 22, total: 230 }
  ];

  return (
    <div className="bar-chart-container">
      <h3 className="chart-title">Long Term Trends</h3>
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
