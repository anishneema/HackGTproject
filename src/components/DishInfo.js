import React from 'react';
import FormInput from './FormInput';
import FormSelect from './FormSelect';
import FormCheckbox from './FormCheckbox';
import './DishInfo.css';

const DishInfo = ({ formData, handleInputChange, handleCheckboxChange }) => {
  const categoryOptions = [
    { value: 'appetizer', label: 'Appetizer' },
    { value: 'main-course', label: 'Main Course' },
    { value: 'dessert', label: 'Dessert' },
    { value: 'beverage', label: 'Beverage' },
    { value: 'salad', label: 'Salad' },
    { value: 'soup', label: 'Soup' }
  ];

  const cuisineOptions = [
    { value: 'italian', label: 'Italian' },
    { value: 'mexican', label: 'Mexican' },
    { value: 'chinese', label: 'Chinese' },
    { value: 'indian', label: 'Indian' },
    { value: 'american', label: 'American' },
    { value: 'french', label: 'French' },
    { value: 'japanese', label: 'Japanese' },
    { value: 'thai', label: 'Thai' },
    { value: 'mediterranean', label: 'Mediterranean' }
  ];

  return (
    <div className="dish-info">
      <h2 className="section-title">Dish Info</h2>
      
      <div className="form-row">
        <FormInput
          label="Dish Price ($)"
          type="number"
          value={formData.dishPrice}
          onChange={(e) => handleInputChange('dishPrice', e.target.value)}
          placeholder="0.00"
          required
        />
        <FormInput
          label="Dish Name"
          value={formData.dishName}
          onChange={(e) => handleInputChange('dishName', e.target.value)}
          placeholder="Enter dish name"
          required
        />
        <FormInput
          label="Ingredients & Measurements (Optional)"
          value={formData.majorIngredients}
          onChange={(e) => handleInputChange('majorIngredients', e.target.value)}
          placeholder="e.g., 2 lbs chicken breast, 1 cup rice, 3 tomatoes, 1/2 cup cheese"
        />
        <div className="ingredient-help-text">
          <small>
            💡 <strong>Tip:</strong> Include measurements for better analysis! 
            If you don't have a specific dish name, just list ingredients with quantities 
            (e.g., "2 lbs chicken, 1 cup rice, 3 tomatoes"). The AI will calculate 
            the total amounts needed for your predicted orders.
          </small>
        </div>
      </div>

      <div className="form-row">
        <FormSelect
          label="Category"
          value={formData.category}
          onChange={(e) => handleInputChange('category', e.target.value)}
          options={categoryOptions}
          placeholder="Select category"
          required
        />
        <FormSelect
          label="Cuisine"
          value={formData.cuisine}
          onChange={(e) => handleInputChange('cuisine', e.target.value)}
          options={cuisineOptions}
          placeholder="Select cuisine"
          required
        />
        
      </div>

      <div className="checkbox-group">
        <FormCheckbox
          label="Was this dish emailed in promotions?"
          checked={formData.emailedInPromotions}
          onChange={(e) => handleCheckboxChange('emailedInPromotions', e.target.checked)}
        />
        <FormCheckbox
          label="Was this dish featured on the homepage of the restaurant website?"
          checked={formData.featuredOnHomepage}
          onChange={(e) => handleCheckboxChange('featuredOnHomepage', e.target.checked)}
        />
        <FormCheckbox
          label="Was there a discount applied to this dish?"
          checked={formData.discountApplied}
          onChange={(e) => handleCheckboxChange('discountApplied', e.target.checked)}
        />
      </div>

      {formData.discountApplied && (
        <div className="form-row">
          <FormInput
            label="Discount Percentage"
            type="number"
            value={formData.discountPercentage}
            onChange={(e) => handleInputChange('discountPercentage', e.target.value)}
            placeholder="0"
            className="discount-input"
          />
        </div>
      )}

    </div>
  );
};

export default DishInfo;
