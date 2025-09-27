import React from 'react';
import './FormSelect.css';

const FormSelect = ({ 
  label, 
  value, 
  onChange, 
  options = [], 
  placeholder = 'Select an option',
  required = false,
  className = ''
}) => {
  return (
    <div className={`form-select-container ${className}`}>
      <label className="form-label">
        {label}
        {required && <span className="required">*</span>}
      </label>
      <div className="select-wrapper">
        <select
          value={value}
          onChange={onChange}
          required={required}
          className="form-select"
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="select-arrow">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6L8 10L12 6" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default FormSelect;
