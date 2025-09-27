from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import xgboost as xgb
import joblib
import openai
import os
import sqlite3
import json
from datetime import datetime
from dotenv import load_dotenv

app = Flask(__name__)
CORS(app)   

# Load environment variables
load_dotenv()

# Initialize OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')
model = joblib.load("xgb_model (5).pkl")

# Database initialization
def init_db():
    conn = sqlite3.connect('demand_history.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS demand_calculations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dish_name TEXT,
            dish_price REAL,
            major_ingredients TEXT,
            category TEXT,
            cuisine TEXT,
            emailed_in_promotions BOOLEAN,
            featured_on_homepage BOOLEAN,
            discount_applied BOOLEAN,
            discount_percentage REAL,
            city_name TEXT,
            center_type TEXT,
            predicted_orders INTEGER,
            final_price REAL,
            discount_amount REAL,
            ingredient_analysis TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()  


@app.route("/api/ml", methods = ["POST", "GET"])
def predict():
    data = request.get_json()  # get the formData from React

    try:
        dish_price = float(data.get("dishPrice", 0))
        discount_applied = bool(data.get("discountApplied", False))
        discount = False
        print(discount_applied)
        discount_amount = 0
        center_type = data.get("centerType", "")
        center_type_A = 1 if center_type == "TYPE_A" else 0
        center_type_B = 1 if center_type == "TYPE_B" else 0
        center_type_C = 1 if center_type == "TYPE_C" else 0
        if discount_applied:
            discount_percentage = float(data.get("discountPercentage", 0))
            discount_amount = dish_price * (discount_percentage / 100)
            final_price = float(dish_price - discount_amount)
        else:
            print("HI")
            discount_amount = 0
            discount_percentage = 0
            final_price = dish_price    
        if discount_amount != 0:
            discount = True
        

        df = pd.DataFrame([{
            "checkout_price": final_price,
            "base_price": float(data.get("dishPrice", 0)),
            "emailer_for_promotion": int(data.get("emailedInPromotions", True) == True),
            "homepage_featured": int(data.get("featuredOnHomepage", True) == True),
            "category": data.get("category", ""),
            "cuisine": data.get("cuisine", ""),
            "discount amount": discount_amount,
            "discount percent": discount_percentage,
            "discount y/n": discount,
            "center_type_TYPE_A": center_type_A,
            "center_type_TYPE_B": center_type_B,
            "center_type_TYPE_C": center_type_C,
        }])
        df["cuisine"] = df["cuisine"].astype("category")
        df["category"] = df["category"].astype("category")


    except Exception as e:
        print("Prediction error:", e)
        return jsonify({"error": str(e)}), 500
    pred = model.predict(df)
    scale_factor = 1 / (dish_price / 10 + 1)  
    predicted_orders = round(float(pred[0]) * scale_factor)    
    # Save to database
    conn = sqlite3.connect('demand_history.db')
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO demand_calculations 
        (dish_name, dish_price, major_ingredients, category, cuisine, 
         emailed_in_promotions, featured_on_homepage, discount_applied, 
         discount_percentage, city_name, center_type, predicted_orders, 
         final_price, discount_amount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data.get("dishName", ""),
        dish_price,
        data.get("majorIngredients", ""),
        data.get("category", ""),
        data.get("cuisine", ""),
        data.get("emailedInPromotions", False),
        data.get("featuredOnHomepage", False),
        data.get("discountApplied", False),
        data.get("discountPercentage", 0),
        data.get("cityName", ""),
        data.get("centerType", ""),
        predicted_orders,
        final_price,
        discount_amount
    ))
    calculation_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({
        "predictedOrders": predicted_orders,
        "finalPrice": round(final_price, 2),
        "discountAmount": round(discount_amount, 2),
        "calculationId": calculation_id
    })


@app.route("/api/analyze-ingredients", methods=["POST"])
def analyze_ingredients():
    """Analyze ingredients needed for predicted orders using OpenAI"""
    try:
        data = request.get_json()
        predicted_orders = data.get("predictedOrders", 0)
        dish_name = data.get("dishName", "")
        major_ingredients = data.get("majorIngredients", "")
        
        if not openai.api_key:
            return jsonify({"error": "OpenAI API key not configured"}), 500
        
        # Create a smart prompt based on available information
        if dish_name and dish_name.strip():
            # If we have a proper dish name, analyze based on the dish
            prompt = f"""
            As a restaurant inventory management expert, analyze the following dish and calculate the TOTAL ingredients needed for {predicted_orders} orders.
            
            Dish: {dish_name}
            Additional ingredients mentioned: {major_ingredients}
            Predicted orders: {predicted_orders}
            
            IMPORTANT: Calculate the TOTAL amount needed for ALL {predicted_orders} orders combined, not per individual order.
            
            Please provide:
            1. Complete list of ingredients needed for this dish
            2. TOTAL quantities for each ingredient needed for {predicted_orders} orders (in standard units like cups, pounds, etc.)
            3. Any special considerations or substitutions
            4. Storage requirements for each ingredient
            
            Example: If one order needs 0.5 lbs chicken, then {predicted_orders} orders need {predicted_orders * 0.5} lbs chicken total.
            Another example: If one order needs 1 cup rice, then {predicted_orders} orders need {predicted_orders} cups rice total.
            
            Format your response as a JSON object with the following structure:
            {{
                "ingredients": [
                    {{
                        "name": "ingredient name",
                        "quantity": "TOTAL amount needed for all orders",
                        "unit": "measurement unit",
                        "storage": "storage requirements",
                        "notes": "any special notes"
                    }}
                ]
            }}
            """
        else:
            # If no dish name, analyze based on provided ingredients and measurements
            prompt = f"""
            As a restaurant inventory management expert, analyze the following ingredients and calculate the TOTAL quantities needed for {predicted_orders} orders.
            
            Ingredients provided: {major_ingredients}
            Predicted orders: {predicted_orders}
            
            IMPORTANT: Calculate the TOTAL amount needed for ALL {predicted_orders} orders combined, not per individual order.
            
            Please:
            1. Parse the provided ingredients and any measurements mentioned
            2. Calculate the TOTAL quantities needed for {predicted_orders} orders (multiply by {predicted_orders})
            3. Add any missing essential ingredients that would typically be needed
            4. Provide storage requirements and preparation notes
            
            Example: If you have "2 lbs chicken" and need {predicted_orders} orders, calculate how much chicken is needed total for all orders.
            
            Format your response as a JSON object with the following structure:
            {{
                "ingredients": [
                    {{
                        "name": "ingredient name",
                        "quantity": "TOTAL amount needed for all orders",
                        "unit": "measurement unit",
                        "storage": "storage requirements",
                        "notes": "any special notes"
                    }}
                ]
            }}
            """
        
        client = openai.OpenAI(api_key=openai.api_key)
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a professional restaurant inventory management expert with deep knowledge of food preparation, ingredient quantities, and cost estimation."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000,
            temperature=0.3
        )
        
        # Parse the response
        analysis_text = response.choices[0].message.content
        
        # Try to extract JSON from the response
        import json
        import re
        
        # Look for JSON in the response
        json_match = re.search(r'\{.*\}', analysis_text, re.DOTALL)
        if json_match:
            try:
                analysis_data = json.loads(json_match.group())
                
                # Save ingredient analysis to database
                calculation_id = data.get("calculationId")
                if calculation_id:
                    conn = sqlite3.connect('demand_history.db')
                    cursor = conn.cursor()
                    cursor.execute('''
                        UPDATE demand_calculations 
                        SET ingredient_analysis = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    ''', (json.dumps(analysis_data), calculation_id))
                    conn.commit()
                    conn.close()
                
                return jsonify(analysis_data)
            except json.JSONDecodeError:
                # If JSON parsing fails, return the raw text
                return jsonify({
                    "raw_analysis": analysis_text,
                    "ingredients": [],
                    "error": "Could not parse structured response"
                })
        else:
            return jsonify({
                "raw_analysis": analysis_text,
                "ingredients": [],
                "error": "No structured data found in response"
            })
            
    except Exception as e:
        print(f"Error in analyze_ingredients: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/chat", methods=["POST"])
def chat_with_ai():
    """Handle chat messages with OpenAI for inventory management"""
    try:
        data = request.get_json()
        message = data.get("message", "")
        context = data.get("context", {})
        
        if not openai.api_key:
            return jsonify({"error": "OpenAI API key not configured"}), 500
        
        # Build context-aware prompt
        system_prompt = """You are an expert restaurant inventory management assistant. You help restaurant owners and managers with:
        - Inventory tracking and management
        - Ingredient analysis and cost optimization
        - Waste reduction strategies
        - Recipe suggestions based on available ingredients
        - Food safety and storage recommendations
        - Cost analysis and budgeting
        
        Always provide practical, actionable advice. Be concise but thorough in your responses."""
        
        # Add context if available
        context_info = ""
        if context.get("predictedOrders"):
            context_info += f"\nCurrent predicted orders: {context['predictedOrders']}"
        if context.get("dishName"):
            context_info += f"\nCurrent dish: {context['dishName']}"
        if context.get("ingredients"):
            context_info += f"\nAvailable ingredients: {context['ingredients']}"
        
        user_message = f"{message}{context_info}"
        
        client = openai.OpenAI(api_key=openai.api_key)
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        return jsonify({
            "response": response.choices[0].message.content
        })
        
    except Exception as e:
        print(f"Error in chat_with_ai: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/demand-history", methods=["GET"])
def get_demand_history():
    """Get all past demand calculations"""
    try:
        conn = sqlite3.connect('demand_history.db')
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM demand_calculations 
            ORDER BY created_at DESC
        ''')
        columns = [description[0] for description in cursor.description]
        rows = cursor.fetchall()
        conn.close()
        
        # Convert to list of dictionaries
        history = []
        for row in rows:
            item = dict(zip(columns, row))
            # Parse ingredient analysis if it exists
            if item['ingredient_analysis']:
                try:
                    item['ingredient_analysis'] = json.loads(item['ingredient_analysis'])
                except:
                    item['ingredient_analysis'] = None
            history.append(item)
        
        return jsonify(history)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/recalculate/<int:calculation_id>", methods=["POST"])
def recalculate_demand(calculation_id):
    """Recalculate demand for a specific dish"""
    try:
        # Get the original data
        conn = sqlite3.connect('demand_history.db')
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM demand_calculations WHERE id = ?', (calculation_id,))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return jsonify({"error": "Calculation not found"}), 404
        
        # Convert row to dictionary
        columns = [description[0] for description in cursor.description]
        original_data = dict(zip(columns, row))
        
        # Prepare data for prediction
        dish_price = original_data['dish_price']
        discount_applied = original_data['discount_applied']
        discount_amount = 0
        discount_percentage = 0
        
        if discount_applied:
            discount_percentage = original_data['discount_percentage'] or 0
            discount_amount = dish_price * (discount_percentage / 100)
            final_price = dish_price - discount_amount
        else:
            final_price = dish_price
        
        # Create DataFrame for prediction
        df = pd.DataFrame([{
            "base_price": dish_price,
            "checkout_price": final_price,
            "category": original_data['category'],
            "cuisine": original_data['cuisine'],
            "emailer_for_promotion": int(original_data['emailed_in_promotions']),
            "homepage_featured": int(original_data['featured_on_homepage']),
            "discount amount": discount_amount,
            "discount percent": discount_percentage,
            "center_type": original_data['center_type'],
            "discount y/n": discount_applied
        }])
        
        df["cuisine"] = df["cuisine"].astype("category")
        df["category"] = df["category"].astype("category")
        df["center_type"] = df["center_type"].astype("category")
        df = df[['checkout_price', 'base_price', 'emailer_for_promotion', 'homepage_featured',
                 'center_type', 'category', 'cuisine', 'discount amount', 'discount percent', 'discount y/n']]
        
        # Make prediction
        pred = model.predict(df)
        predicted_orders = round(float(pred[0]))
        
        # Update database
        conn = sqlite3.connect('demand_history.db')
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE demand_calculations 
            SET predicted_orders = ?, final_price = ?, discount_amount = ?, 
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (predicted_orders, final_price, discount_amount, calculation_id))
        conn.commit()
        conn.close()
        
        return jsonify({
            "predictedOrders": predicted_orders,
            "finalPrice": round(final_price, 2),
            "discountAmount": round(discount_amount, 2),
            "calculationId": calculation_id
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug = True)
