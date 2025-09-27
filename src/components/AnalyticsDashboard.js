import React from 'react';
import Header from './Header';
import PieChart from './charts/PieChart';
import BarChart from './charts/BarChart';
import LineChart from './charts/LineChart';
import RawData from './RawData';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = ({ currentPage, onPageChange }) => {
  return (
    <div className="analytics-dashboard">
      <Header currentPage={currentPage} onPageChange={onPageChange} />
      
      <main className="main-content">
        <div className="container">
          <div className="page-header">
            <h1 className="page-title">Dashboard</h1>
          </div>

          <div className="charts-section">
            <div className="charts-grid">
              <div className="chart-item">
                <PieChart />
              </div>
              <div className="chart-item">
                <BarChart />
              </div>
              <div className="chart-item">
                <LineChart />
              </div>
            </div>
          </div>

          <RawData />
        </div>
      </main>
    </div>
  );
};

export default AnalyticsDashboard;
