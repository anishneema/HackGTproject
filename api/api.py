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
    
    # Demand calculations table
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
            total_price REAL,
            discount_amount REAL,
            ingredient_analysis TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Inventory table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT,
            unit TEXT,
            current_quantity REAL DEFAULT 0,
            min_quantity REAL DEFAULT 0,
            max_quantity REAL DEFAULT 0,
            cost_per_unit REAL DEFAULT 0,
            total_cost REAL DEFAULT 0,
            supplier TEXT,
            expiration_date TEXT,
            storage_location TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Inventory transactions table (purchases, usage, waste)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS inventory_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            inventory_id INTEGER,
            transaction_type TEXT NOT NULL, -- 'purchase', 'usage', 'waste', 'donation'
            quantity REAL NOT NULL,
            cost REAL DEFAULT 0,
            notes TEXT,
            date TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (inventory_id) REFERENCES inventory (id)
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

# Add migration to add total_price column if it doesn't exist
def migrate_database():
    try:
        conn = sqlite3.connect('demand_history.db')
        cursor = conn.cursor()
        
        # Check if total_price column exists
        cursor.execute("PRAGMA table_info(demand_calculations)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'total_price' not in columns:
            print("Adding total_price column to demand_calculations table...")
            cursor.execute('ALTER TABLE demand_calculations ADD COLUMN total_price REAL DEFAULT 0')
            conn.commit()
            print("Migration completed successfully")
        
        # Update existing records that don't have total_price calculated
        cursor.execute('''
            UPDATE demand_calculations 
            SET total_price = final_price * predicted_orders 
            WHERE total_price = 0 OR total_price IS NULL
        ''')
        conn.commit()
        
        updated_rows = cursor.rowcount
        if updated_rows > 0:
            print(f"Updated {updated_rows} existing records with total_price")
        
        conn.close()
    except Exception as e:
        print(f"Migration error: {e}")

# Run migration
migrate_database()  


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
    # Calculate total price for all orders
    total_price = final_price * predicted_orders
    
    cursor.execute('''
        INSERT INTO demand_calculations 
        (dish_name, dish_price, major_ingredients, category, cuisine, 
         emailed_in_promotions, featured_on_homepage, discount_applied, 
         discount_percentage, city_name, center_type, predicted_orders, 
         final_price, total_price, discount_amount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        total_price,
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
        
        # Get current inventory data for context
        conn = sqlite3.connect('demand_history.db')
        cursor = conn.cursor()
        cursor.execute('''
            SELECT name, current_quantity, min_quantity, unit, expiration_date, 
                   cost_per_unit, storage_location, category
            FROM inventory 
            WHERE current_quantity > 0
            ORDER BY expiration_date ASC
        ''')
        inventory_data = cursor.fetchall()
        
        cursor.execute('''
            SELECT it.transaction_type, it.quantity, it.date, i.name
            FROM inventory_transactions it
            JOIN inventory i ON it.inventory_id = i.id
            WHERE it.date >= date('now', '-3 days')
            ORDER BY it.date DESC
        ''')
        recent_transactions = cursor.fetchall()
        conn.close()
        
        # Build context-aware prompt
        inventory_context = "Current Inventory:\n"
        for item in inventory_data:
            inventory_context += f"- {item[0]}: {item[1]} {item[2]} (min: {item[3]}, expires: {item[4]})\n"
        
        transaction_context = "Recent Transactions (last 3 days):\n"
        for trans in recent_transactions:
            transaction_context += f"- {trans[3]}: {trans[0]} {trans[1]} on {trans[2]}\n"
        
        system_prompt = f"""You are an expert restaurant inventory management assistant with the ability to automatically perform inventory actions. You help restaurant owners and managers with:

        - Inventory tracking and management
        - Ingredient analysis and cost optimization
        - Waste reduction strategies
        - Recipe suggestions based on available ingredients
        - Food safety and storage recommendations
        - Cost analysis and budgeting
        - Automatic inventory management actions

        Current Inventory Status:
        {inventory_context}

        Recent Activity:
        {transaction_context}

        IMPORTANT: When users request inventory actions, you must respond with a JSON object that includes:
        1. A natural language response
        2. An "actions" array with specific inventory operations to perform
        3. A "missing_info" array if critical information is needed

        CRITICAL RULES:
        - NEVER make up expiration dates - only include if user provides one
        - NEVER make up cost information - only include if user provides it
        - If cost_per_unit or expiration_date is missing, ask the user for this information
        - Always ask for missing cost information before completing add_item actions
        - Only include expiration_date in data if explicitly provided by user

        Action types:
        - "add_item": Add new inventory items
        - "update_quantity": Modify existing item quantities
        - "record_transaction": Record usage, waste, or donations
        - "delete_item": Remove items from inventory

        Example response format when information is complete:
        {{
            "response": "I've added 50 pounds of chicken breast to your inventory.",
            "actions": [
                {{
                    "type": "add_item",
                    "data": {{
                        "name": "Chicken Breast",
                        "category": "Protein",
                        "unit": "lbs",
                        "current_quantity": 50,
                        "min_quantity": 10,
                        "max_quantity": 100,
                        "storage_location": "Freezer",
                        "notes": "Added via AI assistant"
                    }}
                }}
            ]
        }}

        Example response when information is missing:
        {{
            "response": "I can add 50 pounds of chicken breast to your inventory. However, I need some additional information:",
            "missing_info": [
                "cost_per_unit",
                "expiration_date"
            ],
            "pending_action": {{
                "type": "add_item",
                "data": {{
                    "name": "Chicken Breast",
                    "category": "Protein",
                    "unit": "lbs",
                    "current_quantity": 50,
                    "min_quantity": 10,
                    "max_quantity": 100,
                    "storage_location": "Freezer",
                    "notes": "Added via AI assistant"
                }}
            }},
            "questions": [
                "What is the cost per pound for this chicken breast?",
                "What is the expiration date? (optional - leave blank if none)"
            ]
        }}

        Always provide practical, actionable advice and automatically perform requested inventory operations."""
        
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
            max_tokens=800,
            temperature=0.3
        )
        
        ai_response = response.choices[0].message.content
        
        # Try to parse JSON from AI response
        try:
            # Extract JSON from response if it exists
            import re
            json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
            if json_match:
                parsed_response = json.loads(json_match.group())
                
                # Check if AI is asking for missing information
                if "missing_info" in parsed_response or "questions" in parsed_response:
                    return jsonify({
                        "response": parsed_response.get("response", ai_response),
                        "missing_info": parsed_response.get("missing_info", []),
                        "questions": parsed_response.get("questions", []),
                        "pending_action": parsed_response.get("pending_action"),
                        "has_actions": False,
                        "needs_info": True
                    })
                
                # Execute actions if they exist
                if "actions" in parsed_response:
                    executed_actions = []
                    for action in parsed_response["actions"]:
                        try:
                            result = execute_inventory_action(action)
                            executed_actions.append(result)
                        except Exception as e:
                            print(f"Error executing action: {e}")
                            executed_actions.append({"error": str(e)})
                    
                    return jsonify({
                        "response": parsed_response.get("response", ai_response),
                        "actions_executed": executed_actions,
                        "has_actions": True
                    })
        except json.JSONDecodeError:
            pass
        
        # If no JSON found, return regular response
        return jsonify({
            "response": ai_response,
            "has_actions": False
        })
        
    except Exception as e:
        print(f"Error in chat_with_ai: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/complete-action", methods=["POST"])
def complete_action_with_info():
    """Complete a pending action with user-provided information"""
    try:
        data = request.get_json()
        pending_action = data.get("pending_action")
        user_info = data.get("user_info", {})
        
        if not pending_action:
            return jsonify({"error": "No pending action provided"}), 400
        
        # Merge user-provided information into the pending action
        action_data = pending_action.get("data", {})
        
        # Add cost information if provided
        if "cost_per_unit" in user_info and user_info["cost_per_unit"]:
            try:
                cost_per_unit = float(user_info["cost_per_unit"])
                action_data["cost_per_unit"] = cost_per_unit
                # Calculate total cost if quantity is available
                if "current_quantity" in action_data:
                    action_data["total_cost"] = cost_per_unit * action_data["current_quantity"]
            except (ValueError, TypeError):
                return jsonify({"error": "Invalid cost per unit value"}), 400
        
        # Add expiration date if provided
        if "expiration_date" in user_info and user_info["expiration_date"]:
            action_data["expiration_date"] = user_info["expiration_date"]
        
        # Execute the completed action
        completed_action = {
            "type": pending_action["type"],
            "data": action_data
        }
        
        result = execute_inventory_action(completed_action)
        
        return jsonify({
            "success": True,
            "message": "Action completed successfully",
            "result": result
        })
        
    except Exception as e:
        print(f"Error completing action: {e}")
        return jsonify({"error": str(e)}), 500

def execute_inventory_action(action):
    """Execute an inventory action parsed from AI response"""
    try:
        action_type = action.get("type")
        action_data = action.get("data", {})
        
        conn = sqlite3.connect('demand_history.db')
        cursor = conn.cursor()
        
        if action_type == "add_item":
            # Add new inventory item
            cursor.execute('''
                INSERT INTO inventory 
                (name, category, unit, current_quantity, min_quantity, max_quantity, 
                 cost_per_unit, total_cost, supplier, expiration_date, storage_location, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                action_data.get('name'),
                action_data.get('category', 'General'),
                action_data.get('unit', 'units'),
                action_data.get('current_quantity', 0),
                action_data.get('min_quantity', 0),
                action_data.get('max_quantity', 100),
                action_data.get('cost_per_unit', 0),
                action_data.get('total_cost', 0),
                action_data.get('supplier', 'Unknown'),
                action_data.get('expiration_date'),
                action_data.get('storage_location', 'Storage'),
                action_data.get('notes', 'Added by AI assistant')
            ))
            
            item_id = cursor.lastrowid
            
            # Add purchase transaction if quantity > 0
            if action_data.get('current_quantity', 0) > 0:
                cursor.execute('''
                    INSERT INTO inventory_transactions 
                    (inventory_id, transaction_type, quantity, cost, notes, date)
                    VALUES (?, 'purchase', ?, ?, ?, ?)
                ''', (
                    item_id,
                    action_data.get('current_quantity', 0),
                    action_data.get('total_cost', 0),
                    'AI-suggested purchase',
                    datetime.now().strftime('%Y-%m-%d')
                ))
            
            conn.commit()
            conn.close()
            
            return {
                "success": True,
                "action": "add_item",
                "message": f"Added {action_data.get('name')} to inventory",
                "item_id": item_id
            }
            
        elif action_type == "update_quantity":
            # Update existing item quantity
            item_name = action_data.get('name')
            new_quantity = action_data.get('current_quantity', 0)
            
            cursor.execute('SELECT id, current_quantity FROM inventory WHERE name = ?', (item_name,))
            item = cursor.fetchone()
            
            if item:
                old_quantity = item[1]
                quantity_change = new_quantity - old_quantity
                
                cursor.execute('''
                    UPDATE inventory 
                    SET current_quantity = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                ''', (new_quantity, item[0]))
                
                # Record transaction for quantity change
                if quantity_change != 0:
                    transaction_type = 'purchase' if quantity_change > 0 else 'usage'
                    cursor.execute('''
                        INSERT INTO inventory_transactions 
                        (inventory_id, transaction_type, quantity, cost, notes, date)
                        VALUES (?, ?, ?, ?, ?, ?)
                    ''', (
                        item[0],
                        transaction_type,
                        abs(quantity_change),
                        0,
                        f'AI-suggested quantity update',
                        datetime.now().strftime('%Y-%m-%d')
                    ))
                
                conn.commit()
                conn.close()
                
                return {
                    "success": True,
                    "action": "update_quantity",
                    "message": f"Updated {item_name} quantity from {old_quantity} to {new_quantity}",
                    "item_id": item[0]
                }
            else:
                conn.close()
                return {
                    "success": False,
                    "action": "update_quantity",
                    "message": f"Item '{item_name}' not found in inventory"
                }
                
        elif action_type == "record_transaction":
            # Record usage, waste, or donation
            item_name = action_data.get('name')
            transaction_type = action_data.get('transaction_type', 'usage')
            quantity = action_data.get('quantity', 0)
            notes = action_data.get('notes', 'AI-suggested action')
            
            cursor.execute('SELECT id FROM inventory WHERE name = ?', (item_name,))
            item = cursor.fetchone()
            
            if item:
                # Add transaction
                cursor.execute('''
                    INSERT INTO inventory_transactions 
                    (inventory_id, transaction_type, quantity, cost, notes, date)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (item[0], transaction_type, quantity, 0, notes, datetime.now().strftime('%Y-%m-%d')))
                
                # Update inventory quantity (subtract for usage/waste/donation)
                if transaction_type in ['usage', 'waste', 'donation']:
                    cursor.execute('''
                        UPDATE inventory 
                        SET current_quantity = current_quantity - ?, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    ''', (quantity, item[0]))
                
                conn.commit()
                conn.close()
                
                return {
                    "success": True,
                    "action": "record_transaction",
                    "message": f"Recorded {transaction_type} of {quantity} {item_name}",
                    "item_id": item[0]
                }
            else:
                conn.close()
                return {
                    "success": False,
                    "action": "record_transaction",
                    "message": f"Item '{item_name}' not found in inventory"
                }
                
        elif action_type == "delete_item":
            # Remove item from inventory
            item_name = action_data.get('name')
            
            cursor.execute('SELECT id FROM inventory WHERE name = ?', (item_name,))
            item = cursor.fetchone()
            
            if item:
                cursor.execute('DELETE FROM inventory WHERE id = ?', (item[0],))
                cursor.execute('DELETE FROM inventory_transactions WHERE inventory_id = ?', (item[0],))
                
                conn.commit()
                conn.close()
                
                return {
                    "success": True,
                    "action": "delete_item",
                    "message": f"Removed {item_name} from inventory",
                    "item_id": item[0]
                }
            else:
                conn.close()
                return {
                    "success": False,
                    "action": "delete_item",
                    "message": f"Item '{item_name}' not found in inventory"
                }
        
        else:
            conn.close()
            return {
                "success": False,
                "action": action_type,
                "message": f"Unknown action type: {action_type}"
            }
            
    except Exception as e:
        print(f"Error executing inventory action: {e}")
        return {
            "success": False,
            "action": action_type,
            "message": f"Error executing action: {str(e)}"
        }

@app.route("/api/inventory/ai-action", methods=["POST"])
def ai_inventory_action():
    """Perform AI-suggested inventory actions"""
    try:
        data = request.get_json()
        action_type = data.get("action_type")  # 'add_item', 'record_transaction', 'suggest_donation'
        action_data = data.get("action_data", {})
        
        if not openai.api_key:
            return jsonify({"error": "OpenAI API key not configured"}), 500
        
        conn = sqlite3.connect('demand_history.db')
        cursor = conn.cursor()
        
        if action_type == "add_item":
            # Add new inventory item
            cursor.execute('''
                INSERT INTO inventory 
                (name, category, unit, current_quantity, min_quantity, max_quantity, 
                 cost_per_unit, total_cost, supplier, expiration_date, storage_location, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                action_data.get('name'),
                action_data.get('category'),
                action_data.get('unit'),
                action_data.get('current_quantity', 0),
                action_data.get('min_quantity', 0),
                action_data.get('max_quantity', 0),
                action_data.get('cost_per_unit', 0),
                action_data.get('total_cost', 0),
                action_data.get('supplier'),
                action_data.get('expiration_date'),
                action_data.get('storage_location'),
                action_data.get('notes', 'Added by AI assistant')
            ))
            
            item_id = cursor.lastrowid
            
            # Add purchase transaction if quantity > 0
            if action_data.get('current_quantity', 0) > 0:
                cursor.execute('''
                    INSERT INTO inventory_transactions 
                    (inventory_id, transaction_type, quantity, cost, notes, date)
                    VALUES (?, 'purchase', ?, ?, ?, ?)
                ''', (
                    item_id,
                    action_data.get('current_quantity', 0),
                    action_data.get('total_cost', 0),
                    'AI-suggested purchase',
                    datetime.now().strftime('%Y-%m-%d')
                ))
            
            conn.commit()
            conn.close()
            
            return jsonify({
                "success": True,
                "message": f"Added {action_data.get('name')} to inventory",
                "item_id": item_id
            })
            
        elif action_type == "record_transaction":
            # Record usage, waste, or donation
            inventory_id = action_data.get('inventory_id')
            transaction_type = action_data.get('transaction_type')  # 'usage', 'waste', 'donation'
            quantity = action_data.get('quantity', 0)
            notes = action_data.get('notes', 'AI-suggested action')
            
            # Add transaction
            cursor.execute('''
                INSERT INTO inventory_transactions 
                (inventory_id, transaction_type, quantity, cost, notes, date)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (inventory_id, transaction_type, quantity, 0, notes, datetime.now().strftime('%Y-%m-%d')))
            
            # Update inventory quantity
            cursor.execute('''
                UPDATE inventory 
                SET current_quantity = current_quantity - ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (quantity, inventory_id))
            
            conn.commit()
            conn.close()
            
            return jsonify({
                "success": True,
                "message": f"Recorded {transaction_type} of {quantity} units"
            })
            
        elif action_type == "suggest_donation":
            # Get items suitable for donation
            cursor.execute('''
                SELECT id, name, current_quantity, unit, expiration_date
                FROM inventory 
                WHERE current_quantity > 0 
                AND (expiration_date <= date('now', '+5 days') OR current_quantity > max_quantity)
                ORDER BY expiration_date ASC
            ''')
            donation_candidates = cursor.fetchall()
            conn.close()
            
            if not donation_candidates:
                return jsonify({
                    "success": True,
                    "message": "No items currently suitable for donation",
                    "donation_candidates": []
                })
            
            # Use AI to analyze donation opportunities
            candidates_text = "Items suitable for donation:\n"
            for item in donation_candidates:
                candidates_text += f"- {item[1]}: {item[2]} {item[3]} (expires: {item[4]})\n"
            
            prompt = f"""
            Based on the following inventory items that are expiring soon or overstocked, provide donation recommendations:
            
            {candidates_text}
            
            For each item, suggest:
            1. Recommended donation quantity
            2. Best recipient organization (food bank, shelter, etc.)
            3. Reason for donation
            4. Urgency level
            
            Format as JSON with donation recommendations.
            """
            
            client = openai.OpenAI(api_key=openai.api_key)
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert in food donation and waste reduction. Provide practical donation recommendations."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=800,
                temperature=0.3
            )
            
            donation_analysis = response.choices[0].message.content
            
            return jsonify({
                "success": True,
                "message": "Donation recommendations generated",
                "donation_candidates": [
                    {
                        "id": item[0],
                        "name": item[1],
                        "quantity": item[2],
                        "unit": item[3],
                        "expiration_date": item[4]
                    } for item in donation_candidates
                ],
                "ai_analysis": donation_analysis
            })
        
        else:
            conn.close()
            return jsonify({"error": "Invalid action type"}), 400
            
    except Exception as e:
        print(f"Error in ai_inventory_action: {e}")
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
        print(f"Recalculating demand for calculation_id: {calculation_id}")
        
        # Get the original data
        conn = sqlite3.connect('demand_history.db')
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM demand_calculations WHERE id = ?', (calculation_id,))
        row = cursor.fetchone()
        
        if not row:
            conn.close()
            print(f"Calculation not found for id: {calculation_id}")
            return jsonify({"error": "Calculation not found"}), 404
        
        # Convert row to dictionary
        columns = [description[0] for description in cursor.description]
        original_data = dict(zip(columns, row))
        print(f"Original data: {original_data}")
        conn.close()
        
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
        print(f"DataFrame for prediction: {df}")
        pred = model.predict(df)
        predicted_orders = round(float(pred[0]))
        print(f"Predicted orders: {predicted_orders}")
        
        # Calculate total price for all orders
        total_price = final_price * predicted_orders
        print(f"Total price: {total_price}")
        
        # Update database
        conn = sqlite3.connect('demand_history.db')
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE demand_calculations 
            SET predicted_orders = ?, final_price = ?, total_price = ?, discount_amount = ?, 
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (predicted_orders, final_price, total_price, discount_amount, calculation_id))
        conn.commit()
        conn.close()
        
        print(f"Successfully updated calculation {calculation_id}")
        
        return jsonify({
            "predictedOrders": predicted_orders,
            "finalPrice": round(final_price, 2),
            "discountAmount": round(discount_amount, 2),
            "calculationId": calculation_id
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/demand-history/<int:calculation_id>", methods=["DELETE"])
def delete_demand_calculation(calculation_id):
    """Delete a demand calculation"""
    try:
        conn = sqlite3.connect('demand_history.db')
        cursor = conn.cursor()
        
        # Check if calculation exists
        cursor.execute('SELECT id FROM demand_calculations WHERE id = ?', (calculation_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({"error": "Calculation not found"}), 404
        
        # Delete the calculation
        cursor.execute('DELETE FROM demand_calculations WHERE id = ?', (calculation_id,))
        conn.commit()
        conn.close()
        
        return jsonify({"message": "Demand calculation deleted successfully"})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Inventory Management API Endpoints

@app.route("/api/inventory", methods=["GET"])
def get_inventory():
    """Get all inventory items"""
    try:
        conn = sqlite3.connect('demand_history.db')
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM inventory 
            ORDER BY name ASC
        ''')
        columns = [description[0] for description in cursor.description]
        rows = cursor.fetchall()
        conn.close()
        
        inventory = []
        for row in rows:
            item = dict(zip(columns, row))
            inventory.append(item)
        
        return jsonify(inventory)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/inventory", methods=["POST"])
def add_inventory():
    """Add new inventory item"""
    try:
        data = request.get_json()
        
        conn = sqlite3.connect('demand_history.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO inventory 
            (name, category, unit, current_quantity, min_quantity, max_quantity, 
             cost_per_unit, total_cost, supplier, expiration_date, storage_location, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('name'),
            data.get('category'),
            data.get('unit'),
            data.get('current_quantity', 0),
            data.get('min_quantity', 0),
            data.get('max_quantity', 0),
            data.get('cost_per_unit', 0),
            data.get('total_cost', 0),
            data.get('supplier'),
            data.get('expiration_date'),
            data.get('storage_location'),
            data.get('notes')
        ))
        
        item_id = cursor.lastrowid
        
        # Add purchase transaction if quantity > 0
        if data.get('current_quantity', 0) > 0:
            cursor.execute('''
                INSERT INTO inventory_transactions 
                (inventory_id, transaction_type, quantity, cost, notes, date)
                VALUES (?, 'purchase', ?, ?, ?, ?)
            ''', (
                item_id,
                data.get('current_quantity', 0),
                data.get('total_cost', 0),
                'Initial purchase',
                data.get('purchase_date', datetime.now().strftime('%Y-%m-%d'))
            ))
        
        conn.commit()
        conn.close()
        
        return jsonify({"id": item_id, "message": "Inventory item added successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/inventory/<int:item_id>", methods=["PUT"])
def update_inventory(item_id):
    """Update inventory item"""
    try:
        data = request.get_json()
        
        conn = sqlite3.connect('demand_history.db')
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE inventory 
            SET name = ?, category = ?, unit = ?, current_quantity = ?, 
                min_quantity = ?, max_quantity = ?, cost_per_unit = ?, 
                total_cost = ?, supplier = ?, expiration_date = ?, 
                storage_location = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (
            data.get('name'),
            data.get('category'),
            data.get('unit'),
            data.get('current_quantity'),
            data.get('min_quantity'),
            data.get('max_quantity'),
            data.get('cost_per_unit'),
            data.get('total_cost'),
            data.get('supplier'),
            data.get('expiration_date'),
            data.get('storage_location'),
            data.get('notes'),
            item_id
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({"message": "Inventory item updated successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/inventory/<int:item_id>", methods=["DELETE"])
def delete_inventory_item(item_id):
    """Delete an inventory item"""
    try:
        conn = sqlite3.connect('demand_history.db')
        cursor = conn.cursor()
        
        # Check if item exists
        cursor.execute('SELECT id FROM inventory WHERE id = ?', (item_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({"error": "Item not found"}), 404
        
        # Delete transactions first (foreign key constraint)
        cursor.execute('DELETE FROM inventory_transactions WHERE inventory_id = ?', (item_id,))
        
        # Delete the inventory item
        cursor.execute('DELETE FROM inventory WHERE id = ?', (item_id,))
        
        conn.commit()
        conn.close()
        
        return jsonify({"message": "Item deleted successfully"})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/inventory/<int:item_id>/transaction", methods=["POST"])
def add_inventory_transaction(item_id):
    """Add inventory transaction (usage, waste, purchase)"""
    try:
        data = request.get_json()
        transaction_type = data.get('type')  # 'usage', 'waste', 'purchase', 'donation'
        quantity = data.get('quantity', 0)
        cost = data.get('cost', 0)
        notes = data.get('notes', '')
        date = data.get('date', datetime.now().strftime('%Y-%m-%d'))
        
        conn = sqlite3.connect('demand_history.db')
        cursor = conn.cursor()
        
        # Add transaction
        cursor.execute('''
            INSERT INTO inventory_transactions 
            (inventory_id, transaction_type, quantity, cost, notes, date)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (item_id, transaction_type, quantity, cost, notes, date))
        
        # Update inventory quantity
        if transaction_type in ['usage', 'waste', 'donation']:
            # Subtract from current quantity
            cursor.execute('''
                UPDATE inventory 
                SET current_quantity = current_quantity - ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (quantity, item_id))
        elif transaction_type == 'purchase':
            # Add to current quantity
            cursor.execute('''
                UPDATE inventory 
                SET current_quantity = current_quantity + ?, 
                    cost_per_unit = ?, total_cost = total_cost + ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (quantity, cost/quantity if quantity > 0 else 0, cost, item_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({"message": f"{transaction_type.title()} transaction added successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/inventory/transactions", methods=["GET"])
def get_inventory_transactions():
    """Get all inventory transactions with comprehensive data"""
    try:
        conn = sqlite3.connect('demand_history.db')
        cursor = conn.cursor()
        cursor.execute('''
            SELECT it.*, i.name as inventory_name, i.unit, i.category, i.cost_per_unit
            FROM inventory_transactions it
            JOIN inventory i ON it.inventory_id = i.id
            ORDER BY it.date DESC, it.created_at DESC
        ''')
        columns = [description[0] for description in cursor.description]
        rows = cursor.fetchall()
        
        # Get summary statistics
        cursor.execute('''
            SELECT 
                transaction_type,
                COUNT(*) as count,
                SUM(quantity) as total_quantity,
                SUM(cost) as total_cost,
                AVG(quantity) as avg_quantity
            FROM inventory_transactions
            GROUP BY transaction_type
        ''')
        summary_stats = cursor.fetchall()
        
        conn.close()
        
        transactions = []
        for row in rows:
            transaction = dict(zip(columns, row))
            # Add calculated total value
            if transaction.get('cost_per_unit'):
                transaction['total_value'] = transaction['quantity'] * transaction['cost_per_unit']
            else:
                transaction['total_value'] = 0
            transactions.append(transaction)
        
        # Convert summary stats
        summary = {}
        for stat in summary_stats:
            summary[stat[0]] = {
                'count': stat[1],
                'total_quantity': stat[2],
                'total_cost': stat[3],
                'avg_quantity': stat[4]
            }
        
        return jsonify({
            'transactions': transactions,
            'summary': summary
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/analytics/weekly-trends", methods=["GET"])
def get_weekly_trends():
    """Get weekly trends data for the last 10 weeks"""
    try:
        conn = sqlite3.connect('demand_history.db')
        cursor = conn.cursor()
        
        print("DEBUG: Starting weekly trends query")
        
        # Get data for the last 10 weeks using a simpler approach
        cursor.execute('''
            SELECT 
                CASE 
                    WHEN julianday('now') - julianday(date) <= 7 THEN 1
                    WHEN julianday('now') - julianday(date) <= 14 THEN 2
                    WHEN julianday('now') - julianday(date) <= 21 THEN 3
                    WHEN julianday('now') - julianday(date) <= 28 THEN 4
                    WHEN julianday('now') - julianday(date) <= 35 THEN 5
                    WHEN julianday('now') - julianday(date) <= 42 THEN 6
                    WHEN julianday('now') - julianday(date) <= 49 THEN 7
                    WHEN julianday('now') - julianday(date) <= 56 THEN 8
                    WHEN julianday('now') - julianday(date) <= 63 THEN 9
                    WHEN julianday('now') - julianday(date) <= 70 THEN 10
                    ELSE 0
                END as week_number,
                transaction_type,
                SUM(quantity) as total_quantity
            FROM inventory_transactions it
            LEFT JOIN inventory i ON it.inventory_id = i.id
            WHERE date >= date('now', '-70 days')
            AND julianday('now') - julianday(date) <= 70
            GROUP BY week_number, transaction_type
            HAVING week_number > 0
            ORDER BY week_number ASC
        ''')
        
        weekly_data = cursor.fetchall()
        print(f"DEBUG: Weekly trends query returned {len(weekly_data)} rows")
        print(f"DEBUG: Raw weekly data: {weekly_data}")
        conn.close()
        
        # Format data for charts - create a dictionary to aggregate by week
        week_data = {}
        for row in weekly_data:
            week_num = row[0]
            transaction_type = row[1]
            quantity = row[2]
            
            if week_num not in week_data:
                week_data[week_num] = {
                    'used': 0,
                    'wasted': 0,
                    'donated': 0,
                    'purchased': 0
                }
            
            if transaction_type == 'usage':
                week_data[week_num]['used'] += quantity
            elif transaction_type == 'waste':
                week_data[week_num]['wasted'] += quantity
            elif transaction_type == 'donation':
                week_data[week_num]['donated'] += quantity
            elif transaction_type == 'purchase':
                week_data[week_num]['purchased'] += quantity
        
        # Convert to chart format, ensuring all 10 weeks are represented
        chart_data = []
        for week_num in range(1, 11):
            week_info = week_data.get(week_num, {'used': 0, 'wasted': 0, 'donated': 0, 'purchased': 0})
            chart_data.append({
                'week': f'Week {week_num}',
                'used': round(week_info['used'], 2),
                'wasted': round(week_info['wasted'], 2),
                'donated': round(week_info['donated'], 2),
                'purchased': round(week_info['purchased'], 2),
                'total': round(week_info['used'] + week_info['wasted'] + week_info['donated'], 2)
            })
        
        print(f"DEBUG: Final weekly chart data: {chart_data}")
        return jsonify(chart_data)
    except Exception as e:
        print(f"DEBUG: Error in weekly trends: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/analytics/financial-optimization", methods=["GET"])
def get_financial_optimization():
    """Get financial optimization data (money wasted per week) for the last 10 weeks"""
    try:
        conn = sqlite3.connect('demand_history.db')
        cursor = conn.cursor()
        
        print("DEBUG: Starting financial optimization query")
        
        # First, let's check if we have any waste transactions
        cursor.execute('SELECT COUNT(*) FROM inventory_transactions WHERE transaction_type = "waste"')
        waste_count = cursor.fetchone()[0]
        print(f"DEBUG: Found {waste_count} waste transactions")
        
        # Get waste data with costs for the last 10 weeks using the same week calculation
        cursor.execute('''
            SELECT 
                CASE 
                    WHEN julianday('now') - julianday(date) <= 7 THEN 1
                    WHEN julianday('now') - julianday(date) <= 14 THEN 2
                    WHEN julianday('now') - julianday(date) <= 21 THEN 3
                    WHEN julianday('now') - julianday(date) <= 28 THEN 4
                    WHEN julianday('now') - julianday(date) <= 35 THEN 5
                    WHEN julianday('now') - julianday(date) <= 42 THEN 6
                    WHEN julianday('now') - julianday(date) <= 49 THEN 7
                    WHEN julianday('now') - julianday(date) <= 56 THEN 8
                    WHEN julianday('now') - julianday(date) <= 63 THEN 9
                    WHEN julianday('now') - julianday(date) <= 70 THEN 10
                    ELSE 0
                END as week_number,
                SUM(it.quantity * COALESCE(i.cost_per_unit, 0)) as money_wasted
            FROM inventory_transactions it
            LEFT JOIN inventory i ON it.inventory_id = i.id
            WHERE it.transaction_type = 'waste' 
            AND it.date >= date('now', '-70 days')
            AND julianday('now') - julianday(date) <= 70
            GROUP BY week_number
            HAVING week_number > 0
            ORDER BY week_number ASC
        ''')
        
        financial_data = cursor.fetchall()
        print(f"DEBUG: Query returned {len(financial_data)} rows")
        print(f"DEBUG: Raw data: {financial_data}")
        
        conn.close()
        
        # Format data for line chart - create a dictionary to aggregate by week
        week_financial_data = {}
        for row in financial_data:
            week_num = row[0]
            money_wasted = row[1]
            week_financial_data[week_num] = money_wasted
        
        # Convert to chart format, ensuring all 10 weeks are represented
        chart_data = []
        for week_num in range(1, 11):
            money_wasted = week_financial_data.get(week_num, 0)
            chart_data.append({
                'week': f'Week {week_num}',
                'moneyWasted': round(money_wasted, 2)
            })
        
        print(f"DEBUG: Final chart data: {chart_data}")
        return jsonify(chart_data)
    except Exception as e:
        print(f"DEBUG: Error in financial optimization: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/analytics/test", methods=["GET"])
def test_analytics():
    """Test endpoint to check database connectivity and basic queries"""
    try:
        conn = sqlite3.connect('demand_history.db')
        cursor = conn.cursor()
        
        # Test basic queries
        cursor.execute('SELECT COUNT(*) FROM inventory_transactions')
        total_transactions = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM inventory')
        total_inventory = cursor.fetchone()[0]
        
        cursor.execute('SELECT DISTINCT transaction_type FROM inventory_transactions')
        transaction_types = [row[0] for row in cursor.fetchall()]
        
        conn.close()
        
        return jsonify({
            "status": "success",
            "total_transactions": total_transactions,
            "total_inventory_items": total_inventory,
            "transaction_types": transaction_types
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/analytics/populate-sample-data", methods=["POST"])
def populate_sample_data():
    """Populate database with sample transaction data for testing charts"""
    try:
        conn = sqlite3.connect('demand_history.db')
        cursor = conn.cursor()
        
        # Get existing inventory items
        cursor.execute('SELECT id, name, cost_per_unit FROM inventory LIMIT 5')
        items = cursor.fetchall()
        
        if not items:
            return jsonify({"error": "No inventory items found. Please add some items first."}), 400
        
        # Generate sample transactions for the last 10 weeks
        import random
        from datetime import datetime, timedelta
        
        # Clear existing transactions (optional - comment out if you want to keep existing data)
        # cursor.execute('DELETE FROM inventory_transactions')
        
        sample_transactions = []
        base_date = datetime.now() - timedelta(weeks=10)
        
        for week in range(10):
            week_start = base_date + timedelta(weeks=week)
            
            for item_id, item_name, cost_per_unit in items:
                # Generate random quantities for each transaction type
                usage_qty = random.uniform(5, 25)
                waste_qty = random.uniform(1, 8)
                donation_qty = random.uniform(2, 10)
                
                # Add some randomness to the date within the week
                random_day = random.randint(0, 6)
                transaction_date = week_start + timedelta(days=random_day)
                
                # Usage transaction
                sample_transactions.append((
                    item_id, 'usage', usage_qty, 0, 
                    f'Used in {item_name} preparation', 
                    transaction_date.strftime('%Y-%m-%d')
                ))
                
                # Waste transaction (less frequent)
                if random.random() < 0.7:  # 70% chance of waste
                    sample_transactions.append((
                        item_id, 'waste', waste_qty, 0,
                        f'Wasted {item_name} - expired/damaged',
                        transaction_date.strftime('%Y-%m-%d')
                    ))
                
                # Donation transaction (less frequent)
                if random.random() < 0.4:  # 40% chance of donation
                    sample_transactions.append((
                        item_id, 'donation', donation_qty, 0,
                        f'Donated {item_name} to local food bank',
                        transaction_date.strftime('%Y-%m-%d')
                    ))
        
        # Insert sample transactions
        cursor.executemany('''
            INSERT INTO inventory_transactions 
            (inventory_id, transaction_type, quantity, cost, notes, date)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', sample_transactions)
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "message": f"Successfully added {len(sample_transactions)} sample transactions",
            "transactions_added": len(sample_transactions)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/inventory/ai-recommendations", methods=["POST"])
def get_ai_recommendations():
    """Get AI recommendations for inventory management"""
    try:
        data = request.get_json()
        query = data.get('query', '')
        print(f"DEBUG: Received query: {query}")  # Debug line
        
        # Get current inventory data
        conn = sqlite3.connect('demand_history.db')
        cursor = conn.cursor()
        cursor.execute('''
            SELECT name, current_quantity, min_quantity, unit, expiration_date, 
                   cost_per_unit, storage_location
            FROM inventory 
            WHERE current_quantity > 0
            ORDER BY expiration_date ASC
        ''')
        inventory_data = cursor.fetchall()
        
        cursor.execute('''
            SELECT it.transaction_type, it.quantity, it.date, i.name
            FROM inventory_transactions it
            JOIN inventory i ON it.inventory_id = i.id
            WHERE it.date >= date('now', '-7 days')
            ORDER BY it.date DESC
        ''')
        recent_transactions = cursor.fetchall()
        conn.close()
        
        if not openai.api_key:
            return jsonify({"error": "OpenAI API key not configured"}), 500
        
        # Create context for AI
        inventory_context = "Current Inventory:\n"
        for item in inventory_data:
            inventory_context += f"- {item[0]}: {item[1]} {item[2]} (min: {item[3]}, expires: {item[4]})\n"
        
        transaction_context = "Recent Transactions (last 7 days):\n"
        for trans in recent_transactions:
            transaction_context += f"- {trans[3]}: {trans[0]} {trans[1]} on {trans[2]}\n"
        
        # Hardcoded food bank needs with contact information
        food_bank_needs = [
            ('Atlanta Community Food Bank', 'Atlanta', 'GA', 'Protein', 'Chicken Breast', 100, 'lbs', 3, 'High demand for protein items', '404-892-9822', 'info@acfb.org'),
            ('Atlanta Community Food Bank', 'Atlanta', 'GA', 'Vegetables', 'Fresh Vegetables', 200, 'lbs', 2, 'Need fresh produce for families', '404-892-9822', 'info@acfb.org'),
            ('Atlanta Community Food Bank', 'Atlanta', 'GA', 'Dairy', 'Milk', 50, 'gallons', 4, 'Critical need for dairy products', '404-892-9822', 'info@acfb.org'),
            ('Atlanta Community Food Bank', 'Atlanta', 'GA', 'Grains', 'Bread', 30, 'loaves', 2, 'Daily bread distribution', '404-892-9822', 'info@acfb.org'),
            ('Atlanta Community Food Bank', 'Atlanta', 'GA', 'Protein', 'Ground Turkey', 60, 'lbs', 3, 'Alternative protein source', '404-892-9822', 'info@acfb.org'),
            ('Second Harvest Food Bank', 'Atlanta', 'GA', 'Protein', 'Ground Beef', 75, 'lbs', 2, 'Regular protein need', '404-555-0123', 'contact@secondharvest.org'),
            ('Second Harvest Food Bank', 'Atlanta', 'GA', 'Grains', 'Rice', 150, 'lbs', 1, 'Staple food item', '404-555-0123', 'contact@secondharvest.org'),
            ('Second Harvest Food Bank', 'Atlanta', 'GA', 'Vegetables', 'Canned Vegetables', 100, 'cans', 2, 'Non-perishable vegetables', '404-555-0123', 'contact@secondharvest.org'),
            ('Second Harvest Food Bank', 'Atlanta', 'GA', 'Dairy', 'Yogurt', 40, 'containers', 3, 'Healthy dairy option', '404-555-0123', 'contact@secondharvest.org'),
            ('Metro Atlanta Food Bank', 'Atlanta', 'GA', 'Vegetables', 'Leafy Greens', 80, 'lbs', 3, 'Fresh vegetables for nutrition programs', '404-555-0456', 'help@metrofoodbank.org'),
            ('Metro Atlanta Food Bank', 'Atlanta', 'GA', 'Dairy', 'Cheese', 30, 'lbs', 2, 'Dairy products for meal programs', '404-555-0456', 'help@metrofoodbank.org'),
            ('Metro Atlanta Food Bank', 'Atlanta', 'GA', 'Protein', 'Eggs', 20, 'dozen', 4, 'Critical need for protein', '404-555-0456', 'help@metrofoodbank.org'),
            ('Metro Atlanta Food Bank', 'Atlanta', 'GA', 'Fruits', 'Fresh Fruits', 120, 'lbs', 2, 'Fresh fruit for families', '404-555-0456', 'help@metrofoodbank.org'),
            ('Community Kitchen Atlanta', 'Atlanta', 'GA', 'Protein', 'Fish', 40, 'lbs', 2, 'Healthy protein option', '404-555-0789', 'info@communitykitchen.org'),
            ('Community Kitchen Atlanta', 'Atlanta', 'GA', 'Vegetables', 'Root Vegetables', 60, 'lbs', 1, 'Long-lasting vegetables', '404-555-0789', 'info@communitykitchen.org'),
            ('Community Kitchen Atlanta', 'Atlanta', 'GA', 'Grains', 'Pasta', 50, 'lbs', 2, 'Staple grain product', '404-555-0789', 'info@communitykitchen.org'),
            ('Community Kitchen Atlanta', 'Atlanta', 'GA', 'Dairy', 'Butter', 15, 'lbs', 1, 'Cooking ingredient', '404-555-0789', 'info@communitykitchen.org')
        ]
        
        food_bank_context = "Active Food Bank Needs:\n"
        for need in food_bank_needs:
            priority_text = {4: "CRITICAL", 3: "HIGH", 2: "MEDIUM", 1: "LOW"}.get(need[7], "UNKNOWN")
            food_bank_context += f"- {need[0]} ({need[1]}, {need[2]}): {need[3]} {need[4]} - {need[5]} {need[6]} (Priority: {priority_text}) | Contact: {need[9]} | Email: {need[10]}\n"
        
        prompt = f"""
        You are an expert inventory management assistant specializing in food donation matching. Analyze the following data and provide specific recommendations:
        
        {inventory_context}
        
        {transaction_context}
        
        {food_bank_context}
        
        User Query: {query}
        
        IMPORTANT INSTRUCTIONS:
        1. When the user asks about donating specific items (like "who do I donate chicken to?"), provide EXACT food bank matches from the needs list above
        2. Always mention the specific food bank name, their need details, and priority level
        3. For donation recommendations, prioritize by:
           - Exact item matches (e.g., "Chicken Breast" matches "Chicken Breast")
           - Category matches (e.g., "Chicken" matches "Protein" category)
           - Priority level (Critical=4, High=3, Medium=2, Low=1)
           - Quantity needed vs available
        
        RESPONSE FORMAT:
        - For specific donation queries: "For [ITEM], I recommend donating to [FOOD_BANK_NAME] because they need [SPECIFIC_NEED] (Priority: [LEVEL])"
        - Include contact information when possible
        - Provide reasoning for your recommendations
        - If no direct match, suggest the closest alternatives
        
        Please provide:
        1. Specific donation recommendations with exact food bank matches
        2. Inventory optimization suggestions
        3. Waste reduction strategies
        4. Cost-saving opportunities
        5. Any other relevant advice based on the query
        
        CRITICAL: You MUST respond with ONLY a valid JSON object. Do not include any text before or after the JSON.
        
        Format your response as a JSON object with the following structure:
        {{
            "recommendations": [
                {{
                    "type": "optimization|waste_reduction|donation|cost_saving",
                    "priority": "high|medium|low",
                    "title": "Recommendation title",
                    "description": "Detailed description",
                    "action": "Specific action to take"
                }}
            ],
            "donation_opportunities": [
                {{
                    "item": "item name",
                    "quantity": "amount to donate",
                    "reason": "why it should be donated",
                    "suggested_recipient": "suggested donation recipient",
                    "food_bank_match": "exact food bank name if matched",
                    "priority_level": "priority level of the need",
                    "contact_info": "food bank contact information if available",
                    "match_reasoning": "why this food bank is the best match"
                }}
            ],
            "alerts": [
                {{
                    "type": "low_stock|expiring|overstock",
                    "item": "item name",
                    "message": "alert message"
                }}
            ]
        }}
        
        Remember: Respond with ONLY the JSON object, no additional text.
        """
        
        client = openai.OpenAI(api_key=openai.api_key)
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert inventory management assistant specializing in food donation matching. You have access to real-time food bank needs data and can provide specific, actionable donation recommendations with exact food bank matches, contact information, and priority levels."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1500,
            temperature=0.2
        )
        
        analysis_text = response.choices[0].message.content
        print(f"DEBUG: Raw AI response: {analysis_text}")  # Debug line
        
        # Try to parse JSON response
        import re
        json_match = re.search(r'\{.*\}', analysis_text, re.DOTALL)
        if json_match:
            try:
                analysis_data = json.loads(json_match.group())
                return jsonify(analysis_data)
            except json.JSONDecodeError:
                return jsonify({
                    "raw_analysis": analysis_text,
                    "recommendations": [],
                    "donation_opportunities": [],
                    "alerts": []
                })
        else:
            return jsonify({
                "raw_analysis": analysis_text,
                "recommendations": [],
                "donation_opportunities": [],
                "alerts": []
            })
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Add sample food bank data
def add_sample_food_banks():
    """Add sample food bank data for testing"""
    try:
        conn = sqlite3.connect('demand_history.db')
        cursor = conn.cursor()
        
        # Check if food banks already exist
        cursor.execute('SELECT COUNT(*) FROM food_banks')
        count = cursor.fetchone()[0]
        
        if count == 0:
            # Add sample food banks
            sample_banks = [
                ('Atlanta Community Food Bank', '732 Joseph E Lowery Blvd NW', 'Atlanta', 'GA', '30318', 
                 '404-892-9822', 'info@acfb.org', 'https://acfb.org', 'Sarah Johnson', 5000, 
                 'Mon-Fri 8AM-5PM, Sat 9AM-2PM', 'Accepts fresh produce, dairy, meat, non-perishables'),
                ('Second Harvest Food Bank', '1234 Main Street', 'Atlanta', 'GA', '30309', 
                 '404-555-0123', 'contact@secondharvest.org', 'https://secondharvest.org', 'Mike Davis', 3000,
                 'Mon-Thu 7AM-6PM, Fri 7AM-4PM', 'Specializes in fresh produce and dairy'),
                ('Metro Atlanta Food Bank', '5678 Peachtree Road', 'Atlanta', 'GA', '30305',
                 '404-555-0456', 'help@metrofoodbank.org', 'https://metrofoodbank.org', 'Lisa Chen', 2500,
                 'Mon-Fri 9AM-5PM', 'Accepts all food types, has cold storage'),
                ('Community Kitchen Atlanta', '9012 Northside Drive', 'Atlanta', 'GA', '30327',
                 '404-555-0789', 'info@communitykitchen.org', 'https://communitykitchen.org', 'Robert Wilson', 1500,
                 'Mon-Sat 8AM-4PM', 'Focuses on prepared meals and fresh ingredients')
            ]
            
            cursor.executemany('''
                INSERT INTO food_banks 
                (name, address, city, state, zip_code, phone, email, website, 
                 contact_person, capacity, hours_of_operation, special_requirements)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', sample_banks)
            
            # Add sample food bank needs
            sample_needs = [
                (1, 'Protein', 'Chicken Breast', 100, 'lbs', 3, 'High demand for protein items', '2024-02-15'),
                (1, 'Vegetables', 'Fresh Vegetables', 200, 'lbs', 2, 'Need fresh produce for families', '2024-02-20'),
                (1, 'Dairy', 'Milk', 50, 'gallons', 4, 'Critical need for dairy products', '2024-02-10'),
                (1, 'Grains', 'Bread', 30, 'loaves', 2, 'Daily bread distribution', '2024-02-25'),
                (1, 'Protein', 'Ground Turkey', 60, 'lbs', 3, 'Alternative protein source', '2024-02-18'),
                (2, 'Protein', 'Ground Beef', 75, 'lbs', 2, 'Regular protein need', '2024-02-25'),
                (2, 'Grains', 'Rice', 150, 'lbs', 1, 'Staple food item', '2024-03-01'),
                (2, 'Vegetables', 'Canned Vegetables', 100, 'cans', 2, 'Non-perishable vegetables', '2024-03-10'),
                (2, 'Dairy', 'Yogurt', 40, 'containers', 3, 'Healthy dairy option', '2024-02-22'),
                (3, 'Vegetables', 'Leafy Greens', 80, 'lbs', 3, 'Fresh vegetables for nutrition programs', '2024-02-18'),
                (3, 'Dairy', 'Cheese', 30, 'lbs', 2, 'Dairy products for meal programs', '2024-02-22'),
                (3, 'Protein', 'Eggs', 20, 'dozen', 4, 'Critical need for protein', '2024-02-12'),
                (3, 'Fruits', 'Fresh Fruits', 120, 'lbs', 2, 'Fresh fruit for families', '2024-02-28'),
                (4, 'Protein', 'Fish', 40, 'lbs', 2, 'Healthy protein option', '2024-02-28'),
                (4, 'Vegetables', 'Root Vegetables', 60, 'lbs', 1, 'Long-lasting vegetables', '2024-03-05'),
                (4, 'Grains', 'Pasta', 50, 'lbs', 2, 'Staple grain product', '2024-03-08'),
                (4, 'Dairy', 'Butter', 15, 'lbs', 1, 'Cooking ingredient', '2024-03-12')
            ]
            
            cursor.executemany('''
                INSERT INTO food_bank_needs 
                (food_bank_id, food_category, food_type, quantity_needed, unit, 
                 priority_level, notes, expires_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', sample_needs)
            
            conn.commit()
            print("Sample food bank data added successfully")
        
        conn.close()
    except Exception as e:
        print(f"Error adding sample food bank data: {e}")

# Add sample data on startup
add_sample_food_banks()

if __name__ == "__main__":
    app.run(debug = True)
