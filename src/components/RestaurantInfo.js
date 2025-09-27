import React from 'react';
import FormInput from './FormInput';
import './RestaurantInfo.css';
import FormSelect from './FormSelect';

const centerTypeOptions = [
    { value: 'TYPE_A', label: 'TYPE_A: > 500,000 → Large metro cities' },
    { value: 'TYPE_B', label: 'TYPE_B: 200,000 – 500,000 → Mid-sized cities' },
    { value: 'TYPE_C', label: 'TYPE_C: < 200,000 → Small towns / rural centers' }
];

const RestaurantInfo = ({ formData, handleInputChange }) => {
  return (
    <div className="restaurant-info">
      <h2 className="section-title">Restaurant Info</h2>
      
      <div className="form-row">
        <FormInput
          label="City Name"
          value={formData.cityName}
          onChange={(e) => handleInputChange('cityName', e.target.value)}
          placeholder="Enter city name"
          required
        />
      </div>
      {/* Center Type Dropdown */}
      <div className="form-row">
        <FormSelect
          label="Center Type"
          value={formData.centerType}
          onChange={(e) => handleInputChange('centerType', e.target.value)}
          options={centerTypeOptions}
          placeholder="Select center type"
          required
        />
      </div>
    </div>
  );
};

export default RestaurantInfo;
