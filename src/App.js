import React, { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to HackGT Project! 🚀</h1>
        <p>
          This is a basic React application created for the HackGT project.
        </p>
        
        <div className="counter-section">
          <h2>Interactive Counter</h2>
          <div className="counter-display">
            <span className="count">{count}</span>
          </div>
          <div className="button-group">
            <button 
              className="btn btn-primary" 
              onClick={() => setCount(count + 1)}
            >
              Increment
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => setCount(count - 1)}
            >
              Decrement
            </button>
            <button 
              className="btn btn-reset" 
              onClick={() => setCount(0)}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="features">
          <h3>Features</h3>
          <ul>
            <li>✅ React 18 with hooks</li>
            <li>✅ Modern CSS styling</li>
            <li>✅ Webpack configuration</li>
            <li>✅ Hot reload development</li>
            <li>✅ Responsive design</li>
          </ul>
        </div>

        <footer className="App-footer">
          <p>Built with ❤️ for HackGT</p>
          <p>Repository: <a href="https://github.com/anishneema/HackGTproject" target="_blank" rel="noopener noreferrer">github.com/anishneema/HackGTproject</a></p>
        </footer>
      </header>
    </div>
  );
}

export default App;
