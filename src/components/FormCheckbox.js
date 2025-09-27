import React from 'react';
import './FormCheckbox.css';

const FormCheckbox = ({ 
  label, 
  checked, 
  onChange, 
  className = ''
}) => {
  return (
    <div className={`form-checkbox-container ${className}`}>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="checkbox-input"
        />
        <span className="checkbox-custom"></span>
        <span className="checkbox-text">{label}</span>
      </label>
    </div>
  );
};

export default FormCheckbox;
