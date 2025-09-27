import React, { useState } from 'react';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import DemandCalculator from './components/DemandCalculator';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <AnalyticsDashboard currentPage={currentPage} onPageChange={setCurrentPage} />;
      case 'demand':
        return <DemandCalculator currentPage={currentPage} onPageChange={setCurrentPage} />;
      default:
        return <AnalyticsDashboard currentPage={currentPage} onPageChange={setCurrentPage} />;
    }
  };

  return (
    <div className="App">
      {renderPage()}
    </div>
  );
}

export default App;
