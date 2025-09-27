# OpenAI API Integration Setup

This document explains how to set up the OpenAI API integration for the inventory bot and demand calculator.

## Prerequisites

1. An OpenAI API key (get one from https://platform.openai.com/api-keys)
2. Python 3.8+ installed
3. Node.js and npm installed

## Setup Instructions

### 1. Backend Setup (Flask API)

1. Navigate to the `api` directory:
   ```bash
   cd api
   ```

2. Create a virtual environment (if not already created):
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Create a `.env` file in the `api` directory:
   ```bash
   # Create .env file
   echo "OPENAI_API_KEY=your_actual_api_key_here" > .env
   ```
   
   Replace `your_actual_api_key_here` with your actual OpenAI API key.

6. Start the Flask server:
   ```bash
   python api.py
   ```

### 2. Frontend Setup (React App)

1. Navigate to the project root directory:
   ```bash
   cd ..
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```

## Features

### Demand Calculator with Ingredient Analysis

- **Automatic Ingredient Analysis**: When you calculate demand for a dish, the system automatically analyzes the ingredients needed using OpenAI
- **Detailed Ingredient Breakdown**: Shows quantities, units, storage requirements, and preparation notes
- **Cost Estimation**: Provides estimated total cost for ingredients
- **Smart Recommendations**: AI-powered suggestions for ingredient management

### Inventory Bot with AI Chat

- **Intelligent Responses**: Uses OpenAI GPT-3.5-turbo for context-aware responses
- **Fallback System**: Falls back to local responses if API is unavailable
- **Context-Aware**: Can understand and respond to complex inventory management queries

## API Endpoints

### `/api/ml` (POST)
- **Purpose**: Predict order demand using XGBoost model
- **Input**: Dish information (price, category, cuisine, etc.)
- **Output**: Predicted number of orders

### `/api/analyze-ingredients` (POST)
- **Purpose**: Analyze ingredients needed for predicted orders
- **Input**: 
  - `predictedOrders`: Number of predicted orders
  - `dishName`: Name of the dish
  - `majorIngredients`: Major ingredients mentioned
- **Output**: Detailed ingredient analysis with quantities, storage info, and cost estimates

### `/api/chat` (POST)
- **Purpose**: Handle chat messages with AI for inventory management
- **Input**: 
  - `message`: User's message
  - `context`: Optional context information
- **Output**: AI-generated response

## Usage Examples

### Using the Demand Calculator

1. Fill in the dish information form
2. Click "Calculate Demand"
3. The system will:
   - Predict the number of orders using ML model
   - Automatically analyze ingredients needed using OpenAI
   - Display detailed ingredient breakdown with quantities and costs

### Using the Inventory Bot

1. Navigate to the "Inventory Assistant" page
2. Type your questions about inventory management
3. The AI will provide intelligent, context-aware responses
4. Use quick action buttons for common tasks

## Troubleshooting

### Common Issues

1. **"OpenAI API key not configured" error**:
   - Make sure you've created the `.env` file in the `api` directory
   - Verify your API key is correct
   - Restart the Flask server after adding the API key

2. **"Failed to analyze ingredients" error**:
   - Check your OpenAI API key and billing status
   - Ensure you have sufficient API credits
   - Check the Flask server logs for detailed error messages

3. **CORS errors**:
   - Make sure the Flask server is running on `http://127.0.0.1:5000`
   - Check that CORS is properly configured in the Flask app

### API Key Security

- Never commit your `.env` file to version control
- Keep your API key secure and don't share it
- Consider using environment variables in production

## Cost Considerations

- OpenAI API calls are charged per token
- The ingredient analysis endpoint uses more tokens than the chat endpoint
- Monitor your usage on the OpenAI dashboard
- Consider implementing caching for frequently requested analyses

## Development Notes

- The system gracefully falls back to local responses if OpenAI API is unavailable
- All API calls include proper error handling
- The frontend provides user feedback during API calls
- The system is designed to be resilient and user-friendly

