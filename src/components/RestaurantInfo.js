import React from 'react';
import FormInput from './FormInput';
import './RestaurantInfo.css';

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
        <FormInput
          label="Center Type"
          value={formData.centerType}
          onChange={(e) => handleInputChange('centerType', e.target.value)}
          placeholder="e.g., downtown, mall, airport"
          required
        />
      </div>
    </div>
  );
};

export default RestaurantInfo;
