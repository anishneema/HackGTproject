#!/usr/bin/env python3
"""
Demo Data Generator for Italian Restaurant Inventory Management System
Generates realistic sample data for demonstration purposes
"""

import sqlite3
import random
from datetime import datetime, timedelta
import json

def init_database():
    """Initialize the database with tables"""
    conn = sqlite3.connect('demand_history.db')
    cursor = conn.cursor()
    
    # Create tables if they don't exist
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(255) NOT NULL,
            category VARCHAR(100),
            current_quantity DECIMAL(10,2) DEFAULT 0,
            unit VARCHAR(50),
            min_quantity DECIMAL(10,2) DEFAULT 0,
            max_quantity DECIMAL(10,2) DEFAULT 0,
            cost_per_unit DECIMAL(10,2),
            total_cost DECIMAL(10,2) DEFAULT 0,
            expiration_date DATE,
            storage_location VARCHAR(255),
            supplier VARCHAR(255),
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS inventory_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            inventory_id INTEGER,
            transaction_type TEXT NOT NULL,
            quantity REAL NOT NULL,
            cost REAL DEFAULT 0,
            notes TEXT,
            date TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (inventory_id) REFERENCES inventory (id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS demand_calculations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dish_name VARCHAR(255),
            dish_price DECIMAL(10,2),
            major_ingredients TEXT,
            category VARCHAR(100),
            cuisine VARCHAR(100),
            emailed_in_promotions BOOLEAN,
            featured_on_homepage BOOLEAN,
            discount_applied BOOLEAN,
            discount_percentage DECIMAL(5,2),
            city_name VARCHAR(255),
            center_type VARCHAR(100),
            predicted_orders INTEGER,
            final_price DECIMAL(10,2),
            total_price DECIMAL(10,2),
            discount_amount DECIMAL(10,2),
            ingredient_analysis TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

def generate_italian_restaurant_inventory():
    """Generate realistic Italian restaurant inventory items"""
    inventory_items = [
        # Proteins
        {"name": "Chicken Breast", "category": "Protein", "unit": "lbs", "cost_per_unit": 4.50, "storage_location": "Refrigerator", "supplier": "Local Poultry Co."},
        {"name": "Ground Beef", "category": "Protein", "unit": "lbs", "cost_per_unit": 5.25, "storage_location": "Refrigerator", "supplier": "Premium Meats"},
        {"name": "Italian Sausage", "category": "Protein", "unit": "lbs", "cost_per_unit": 6.75, "storage_location": "Refrigerator", "supplier": "Mama's Italian Market"},
        {"name": "Pancetta", "category": "Protein", "unit": "lbs", "cost_per_unit": 12.50, "storage_location": "Refrigerator", "supplier": "Artisan Deli"},
        {"name": "Parmesan Cheese", "category": "Dairy", "unit": "lbs", "cost_per_unit": 18.00, "storage_location": "Refrigerator", "supplier": "Italian Import Co."},
        {"name": "Mozzarella", "category": "Dairy", "unit": "lbs", "cost_per_unit": 8.50, "storage_location": "Refrigerator", "supplier": "Fresh Dairy Co."},
        {"name": "Ricotta Cheese", "category": "Dairy", "unit": "lbs", "cost_per_unit": 6.25, "storage_location": "Refrigerator", "supplier": "Fresh Dairy Co."},
        
        # Vegetables
        {"name": "Roma Tomatoes", "category": "Vegetables", "unit": "lbs", "cost_per_unit": 2.25, "storage_location": "Refrigerator", "supplier": "Garden Fresh Produce"},
        {"name": "Fresh Basil", "category": "Vegetables", "unit": "bunches", "cost_per_unit": 3.50, "storage_location": "Refrigerator", "supplier": "Herb Garden Co."},
        {"name": "Garlic", "category": "Vegetables", "unit": "lbs", "cost_per_unit": 4.00, "storage_location": "Dry Storage", "supplier": "Garden Fresh Produce"},
        {"name": "Onions", "category": "Vegetables", "unit": "lbs", "cost_per_unit": 1.75, "storage_location": "Dry Storage", "supplier": "Garden Fresh Produce"},
        {"name": "Bell Peppers", "category": "Vegetables", "unit": "lbs", "cost_per_unit": 3.25, "storage_location": "Refrigerator", "supplier": "Garden Fresh Produce"},
        {"name": "Mushrooms", "category": "Vegetables", "unit": "lbs", "cost_per_unit": 5.50, "storage_location": "Refrigerator", "supplier": "Mushroom Farm"},
        {"name": "Spinach", "category": "Vegetables", "unit": "lbs", "cost_per_unit": 4.75, "storage_location": "Refrigerator", "supplier": "Leafy Greens Co."},
        {"name": "Eggplant", "category": "Vegetables", "unit": "lbs", "cost_per_unit": 2.85, "storage_location": "Refrigerator", "supplier": "Garden Fresh Produce"},
        
        # Grains & Pasta
        {"name": "Spaghetti", "category": "Grains", "unit": "boxes", "cost_per_unit": 2.50, "storage_location": "Dry Storage", "supplier": "Italian Import Co."},
        {"name": "Penne Pasta", "category": "Grains", "unit": "boxes", "cost_per_unit": 2.50, "storage_location": "Dry Storage", "supplier": "Italian Import Co."},
        {"name": "Risotto Rice", "category": "Grains", "unit": "lbs", "cost_per_unit": 3.75, "storage_location": "Dry Storage", "supplier": "Italian Import Co."},
        {"name": "Pizza Dough", "category": "Grains", "unit": "pieces", "cost_per_unit": 1.25, "storage_location": "Refrigerator", "supplier": "Local Bakery"},
        
        # Spices & Seasonings
        {"name": "Olive Oil", "category": "Spices", "unit": "bottles", "cost_per_unit": 8.50, "storage_location": "Dry Storage", "supplier": "Mediterranean Imports"},
        {"name": "Balsamic Vinegar", "category": "Spices", "unit": "bottles", "cost_per_unit": 12.00, "storage_location": "Dry Storage", "supplier": "Mediterranean Imports"},
        {"name": "Oregano", "category": "Spices", "unit": "oz", "cost_per_unit": 2.25, "storage_location": "Dry Storage", "supplier": "Spice World"},
        {"name": "Thyme", "category": "Spices", "unit": "oz", "cost_per_unit": 2.50, "storage_location": "Dry Storage", "supplier": "Spice World"},
        {"name": "Red Pepper Flakes", "category": "Spices", "unit": "oz", "cost_per_unit": 1.75, "storage_location": "Dry Storage", "supplier": "Spice World"},
        {"name": "Sea Salt", "category": "Spices", "unit": "lbs", "cost_per_unit": 3.50, "storage_location": "Dry Storage", "supplier": "Spice World"},
        
        # Beverages
        {"name": "Red Wine", "category": "Beverages", "unit": "bottles", "cost_per_unit": 15.00, "storage_location": "Room Temperature", "supplier": "Wine Distributors"},
        {"name": "White Wine", "category": "Beverages", "unit": "bottles", "cost_per_unit": 12.50, "storage_location": "Refrigerator", "supplier": "Wine Distributors"},
        {"name": "San Pellegrino", "category": "Beverages", "unit": "bottles", "cost_per_unit": 1.25, "storage_location": "Cooler", "supplier": "Beverage Co."},
    ]
    
    return inventory_items

def generate_realistic_quantities_and_dates():
    """Generate realistic current quantities, min/max levels, and expiration dates"""
    conn = sqlite3.connect('demand_history.db')
    cursor = conn.cursor()
    
    # Get all inventory items
    cursor.execute('SELECT id, name, category, unit, cost_per_unit FROM inventory')
    items = cursor.fetchall()
    
    for item in items:
        item_id, name, category, unit, cost_per_unit = item
        
        # Generate realistic quantities based on item type
        if category == "Protein":
            current_qty = random.uniform(15, 45)
            min_qty = random.uniform(5, 15)
            max_qty = random.uniform(50, 100)
        elif category == "Dairy":
            current_qty = random.uniform(8, 25)
            min_qty = random.uniform(3, 8)
            max_qty = random.uniform(30, 60)
        elif category == "Vegetables":
            current_qty = random.uniform(10, 30)
            min_qty = random.uniform(5, 10)
            max_qty = random.uniform(40, 80)
        elif category == "Grains":
            current_qty = random.uniform(20, 50)
            min_qty = random.uniform(10, 20)
            max_qty = random.uniform(60, 120)
        elif category == "Spices":
            current_qty = random.uniform(5, 15)
            min_qty = random.uniform(2, 5)
            max_qty = random.uniform(20, 40)
        else:  # Beverages
            current_qty = random.uniform(12, 35)
            min_qty = random.uniform(5, 12)
            max_qty = random.uniform(40, 80)
        
        # Round quantities appropriately
        if unit in ["lbs", "kg"]:
            current_qty = round(current_qty, 1)
            min_qty = round(min_qty, 1)
            max_qty = round(max_qty, 1)
        else:
            current_qty = round(current_qty)
            min_qty = round(min_qty)
            max_qty = round(max_qty)
        
        # Calculate total cost
        total_cost = current_qty * cost_per_unit
        
        # Generate expiration date (some items expire soon, others don't)
        if category in ["Protein", "Dairy", "Vegetables"]:
            # Perishable items - some expiring soon
            if random.random() < 0.3:  # 30% chance of expiring soon
                days_until_expiry = random.randint(1, 5)
            else:
                days_until_expiry = random.randint(6, 14)
            expiration_date = (datetime.now() + timedelta(days=days_until_expiry)).strftime('%Y-%m-%d')
        else:
            # Non-perishable items - longer shelf life
            days_until_expiry = random.randint(30, 365)
            expiration_date = (datetime.now() + timedelta(days=days_until_expiry)).strftime('%Y-%m-%d')
        
        # Update the item
        cursor.execute('''
            UPDATE inventory 
            SET current_quantity = ?, min_quantity = ?, max_quantity = ?, 
                total_cost = ?, expiration_date = ?
            WHERE id = ?
        ''', (current_qty, min_qty, max_qty, total_cost, expiration_date, item_id))
    
    conn.commit()
    conn.close()

def generate_transaction_history():
    """Generate realistic transaction history for the past 30 days"""
    conn = sqlite3.connect('demand_history.db')
    cursor = conn.cursor()
    
    # Get all inventory items
    cursor.execute('SELECT id, name, category, unit FROM inventory')
    items = cursor.fetchall()
    
    # Generate transactions for the past 30 days
    for days_ago in range(30):
        transaction_date = (datetime.now() - timedelta(days=days_ago)).strftime('%Y-%m-%d')
        
        # Generate 3-8 transactions per day
        num_transactions = random.randint(3, 8)
        
        for _ in range(num_transactions):
            item = random.choice(items)
            item_id, name, category, unit = item
            
            # Transaction types with realistic probabilities
            transaction_type = random.choices(
                ['usage', 'waste', 'donation', 'purchase'],
                weights=[60, 15, 5, 20]  # 60% usage, 15% waste, 5% donation, 20% purchase
            )[0]
            
            # Generate realistic quantities based on transaction type
            if transaction_type == 'usage':
                if unit in ["lbs", "kg"]:
                    quantity = round(random.uniform(0.5, 5.0), 1)
                else:
                    quantity = random.randint(1, 10)
                cost = 0
                notes = f"Used in {random.choice(['pasta dish', 'pizza', 'salad', 'main course', 'appetizer'])}"
                
            elif transaction_type == 'waste':
                if unit in ["lbs", "kg"]:
                    quantity = round(random.uniform(0.2, 2.0), 1)
                else:
                    quantity = random.randint(1, 5)
                cost = 0
                waste_reasons = ['expired', 'damaged', 'spoiled', 'overcooked', 'leftover']
                notes = f"Wasted - {random.choice(waste_reasons)}"
                
            elif transaction_type == 'donation':
                if unit in ["lbs", "kg"]:
                    quantity = round(random.uniform(1.0, 8.0), 1)
                else:
                    quantity = random.randint(2, 15)
                cost = 0
                notes = f"Donated to {random.choice(['Local Food Bank', 'Community Kitchen', 'Homeless Shelter'])}"
                
            else:  # purchase
                if unit in ["lbs", "kg"]:
                    quantity = round(random.uniform(10, 50), 1)
                else:
                    quantity = random.randint(10, 100)
                cost = quantity * random.uniform(0.8, 1.2) * 4.50  # Approximate cost
                notes = f"Restocked from {random.choice(['Local Poultry Co.', 'Premium Meats', 'Garden Fresh Produce', 'Italian Import Co.'])}"
            
            # Insert transaction
            cursor.execute('''
                INSERT INTO inventory_transactions 
                (inventory_id, transaction_type, quantity, cost, notes, date)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (item_id, transaction_type, quantity, cost, notes, transaction_date))
    
    conn.commit()
    conn.close()

def generate_demand_calculations():
    """Generate sample demand calculations for Italian dishes"""
    dishes = [
        {
            "dish_name": "Spaghetti Carbonara",
            "dish_price": 18.50,
            "major_ingredients": "Spaghetti pasta, Pancetta, Eggs, Parmesan cheese, Black pepper",
            "category": "Pasta",
            "cuisine": "Italian",
            "predicted_orders": 45
        },
        {
            "dish_name": "Margherita Pizza",
            "dish_price": 16.00,
            "major_ingredients": "Pizza dough, Tomato sauce, Mozzarella, Fresh basil, Olive oil",
            "category": "Pizza",
            "cuisine": "Italian",
            "predicted_orders": 62
        },
        {
            "dish_name": "Chicken Parmigiana",
            "dish_price": 22.00,
            "major_ingredients": "Chicken breast, Marinara sauce, Mozzarella, Parmesan, Breadcrumbs",
            "category": "Main Course",
            "cuisine": "Italian",
            "predicted_orders": 38
        },
        {
            "dish_name": "Risotto ai Funghi",
            "dish_price": 20.00,
            "major_ingredients": "Risotto rice, Mushrooms, Onions, White wine, Parmesan cheese",
            "category": "Rice",
            "cuisine": "Italian",
            "predicted_orders": 28
        },
        {
            "dish_name": "Bruschetta",
            "dish_price": 12.00,
            "major_ingredients": "Bread, Roma tomatoes, Fresh basil, Garlic, Olive oil",
            "category": "Appetizer",
            "cuisine": "Italian",
            "predicted_orders": 35
        },
        {
            "dish_name": "Eggplant Parmesan",
            "dish_price": 19.50,
            "major_ingredients": "Eggplant, Marinara sauce, Mozzarella, Parmesan, Breadcrumbs",
            "category": "Vegetarian",
            "cuisine": "Italian",
            "predicted_orders": 25
        }
    ]
    
    conn = sqlite3.connect('demand_history.db')
    cursor = conn.cursor()
    
    for dish in dishes:
        # Generate some variation in the data
        discount_applied = random.choice([True, False])
        discount_percentage = random.uniform(10, 25) if discount_applied else 0
        discount_amount = dish["dish_price"] * (discount_percentage / 100) if discount_applied else 0
        final_price = dish["dish_price"] - discount_amount
        total_price = final_price * dish["predicted_orders"]
        
        # Generate ingredient analysis based on dish
        if dish["dish_name"] == "Spaghetti Carbonara":
            ingredients = [
                {"name": "Spaghetti", "quantity": dish["predicted_orders"] * 0.3, "unit": "lbs", "storage": "Dry storage", "notes": "High quality Italian pasta"},
                {"name": "Pancetta", "quantity": dish["predicted_orders"] * 0.2, "unit": "lbs", "storage": "Refrigerated", "notes": "Cured Italian bacon"},
                {"name": "Eggs", "quantity": dish["predicted_orders"] * 0.5, "unit": "dozen", "storage": "Refrigerated", "notes": "Fresh farm eggs"},
                {"name": "Parmesan", "quantity": dish["predicted_orders"] * 0.1, "unit": "lbs", "storage": "Refrigerated", "notes": "Aged Italian cheese"}
            ]
            raw_analysis = f"Based on {dish['predicted_orders']} orders, you'll need approximately {dish['predicted_orders'] * 0.3:.1f} lbs of pasta, {dish['predicted_orders'] * 0.2:.1f} lbs of pancetta, {dish['predicted_orders'] * 0.5:.0f} eggs, and {dish['predicted_orders'] * 0.1:.1f} lbs of parmesan cheese."
        elif dish["dish_name"] == "Margherita Pizza":
            ingredients = [
                {"name": "Pizza Dough", "quantity": dish["predicted_orders"], "unit": "pieces", "storage": "Refrigerated", "notes": "Fresh pizza dough"},
                {"name": "Tomato Sauce", "quantity": dish["predicted_orders"] * 0.1, "unit": "lbs", "storage": "Refrigerated", "notes": "San Marzano tomatoes"},
                {"name": "Mozzarella", "quantity": dish["predicted_orders"] * 0.15, "unit": "lbs", "storage": "Refrigerated", "notes": "Fresh mozzarella"},
                {"name": "Fresh Basil", "quantity": dish["predicted_orders"] * 0.05, "unit": "bunches", "storage": "Refrigerated", "notes": "Fresh basil leaves"}
            ]
            raw_analysis = f"Based on {dish['predicted_orders']} orders, you'll need approximately {dish['predicted_orders']} pizza dough pieces, {dish['predicted_orders'] * 0.1:.1f} lbs of tomato sauce, {dish['predicted_orders'] * 0.15:.1f} lbs of mozzarella, and {dish['predicted_orders'] * 0.05:.1f} bunches of fresh basil."
        elif dish["dish_name"] == "Chicken Parmigiana":
            ingredients = [
                {"name": "Chicken Breast", "quantity": dish["predicted_orders"] * 0.4, "unit": "lbs", "storage": "Refrigerated", "notes": "Boneless chicken breast"},
                {"name": "Marinara Sauce", "quantity": dish["predicted_orders"] * 0.2, "unit": "lbs", "storage": "Refrigerated", "notes": "Homemade marinara"},
                {"name": "Mozzarella", "quantity": dish["predicted_orders"] * 0.12, "unit": "lbs", "storage": "Refrigerated", "notes": "Shredded mozzarella"},
                {"name": "Breadcrumbs", "quantity": dish["predicted_orders"] * 0.08, "unit": "lbs", "storage": "Dry storage", "notes": "Italian breadcrumbs"}
            ]
            raw_analysis = f"Based on {dish['predicted_orders']} orders, you'll need approximately {dish['predicted_orders'] * 0.4:.1f} lbs of chicken breast, {dish['predicted_orders'] * 0.2:.1f} lbs of marinara sauce, {dish['predicted_orders'] * 0.12:.1f} lbs of mozzarella, and {dish['predicted_orders'] * 0.08:.1f} lbs of breadcrumbs."
        elif dish["dish_name"] == "Risotto ai Funghi":
            ingredients = [
                {"name": "Risotto Rice", "quantity": dish["predicted_orders"] * 0.25, "unit": "lbs", "storage": "Dry storage", "notes": "Arborio rice"},
                {"name": "Mushrooms", "quantity": dish["predicted_orders"] * 0.3, "unit": "lbs", "storage": "Refrigerated", "notes": "Mixed wild mushrooms"},
                {"name": "White Wine", "quantity": dish["predicted_orders"] * 0.1, "unit": "bottles", "storage": "Refrigerated", "notes": "Dry white wine"},
                {"name": "Parmesan", "quantity": dish["predicted_orders"] * 0.08, "unit": "lbs", "storage": "Refrigerated", "notes": "Grated parmesan"}
            ]
            raw_analysis = f"Based on {dish['predicted_orders']} orders, you'll need approximately {dish['predicted_orders'] * 0.25:.1f} lbs of risotto rice, {dish['predicted_orders'] * 0.3:.1f} lbs of mushrooms, {dish['predicted_orders'] * 0.1:.1f} bottles of white wine, and {dish['predicted_orders'] * 0.08:.1f} lbs of parmesan."
        elif dish["dish_name"] == "Bruschetta":
            ingredients = [
                {"name": "Bread", "quantity": dish["predicted_orders"] * 0.2, "unit": "loaves", "storage": "Room temperature", "notes": "Italian bread"},
                {"name": "Roma Tomatoes", "quantity": dish["predicted_orders"] * 0.15, "unit": "lbs", "storage": "Refrigerated", "notes": "Fresh roma tomatoes"},
                {"name": "Fresh Basil", "quantity": dish["predicted_orders"] * 0.03, "unit": "bunches", "storage": "Refrigerated", "notes": "Fresh basil"},
                {"name": "Garlic", "quantity": dish["predicted_orders"] * 0.05, "unit": "lbs", "storage": "Dry storage", "notes": "Fresh garlic cloves"}
            ]
            raw_analysis = f"Based on {dish['predicted_orders']} orders, you'll need approximately {dish['predicted_orders'] * 0.2:.1f} loaves of bread, {dish['predicted_orders'] * 0.15:.1f} lbs of roma tomatoes, {dish['predicted_orders'] * 0.03:.1f} bunches of fresh basil, and {dish['predicted_orders'] * 0.05:.1f} lbs of garlic."
        else:  # Eggplant Parmesan
            ingredients = [
                {"name": "Eggplant", "quantity": dish["predicted_orders"] * 0.5, "unit": "lbs", "storage": "Refrigerated", "notes": "Fresh eggplant"},
                {"name": "Marinara Sauce", "quantity": dish["predicted_orders"] * 0.18, "unit": "lbs", "storage": "Refrigerated", "notes": "Homemade marinara"},
                {"name": "Mozzarella", "quantity": dish["predicted_orders"] * 0.1, "unit": "lbs", "storage": "Refrigerated", "notes": "Shredded mozzarella"},
                {"name": "Breadcrumbs", "quantity": dish["predicted_orders"] * 0.06, "unit": "lbs", "storage": "Dry storage", "notes": "Italian breadcrumbs"}
            ]
            raw_analysis = f"Based on {dish['predicted_orders']} orders, you'll need approximately {dish['predicted_orders'] * 0.5:.1f} lbs of eggplant, {dish['predicted_orders'] * 0.18:.1f} lbs of marinara sauce, {dish['predicted_orders'] * 0.1:.1f} lbs of mozzarella, and {dish['predicted_orders'] * 0.06:.1f} lbs of breadcrumbs."
        
        ingredient_analysis = {
            "ingredients": ingredients,
            "raw_analysis": raw_analysis
        }
        
        cursor.execute('''
            INSERT INTO demand_calculations 
            (dish_name, dish_price, major_ingredients, category, cuisine, 
             emailed_in_promotions, featured_on_homepage, discount_applied, 
             discount_percentage, city_name, center_type, predicted_orders, 
             final_price, total_price, discount_amount, ingredient_analysis)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            dish["dish_name"],
            dish["dish_price"],
            dish["major_ingredients"],
            dish["category"],
            dish["cuisine"],
            random.choice([True, False]),
            random.choice([True, False]),
            discount_applied,
            discount_percentage,
            "New York",
            random.choice(["TYPE_A", "TYPE_B", "TYPE_C"]),
            dish["predicted_orders"],
            final_price,
            total_price,
            discount_amount,
            json.dumps(ingredient_analysis)
        ))
    
    conn.commit()
    conn.close()

def clear_existing_data():
    """Clear existing data to start fresh"""
    conn = sqlite3.connect('demand_history.db')
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM inventory_transactions')
    cursor.execute('DELETE FROM demand_calculations')
    cursor.execute('DELETE FROM inventory')
    
    conn.commit()
    conn.close()
    print("✅ Cleared existing data")

def main():
    """Main function to generate all demo data"""
    print("🍝 Generating Italian Restaurant Demo Data...")
    
    # Clear existing data
    clear_existing_data()
    
    # Initialize database
    init_database()
    print("✅ Database initialized")
    
    # Generate inventory items
    conn = sqlite3.connect('demand_history.db')
    cursor = conn.cursor()
    
    inventory_items = generate_italian_restaurant_inventory()
    
    for item in inventory_items:
        cursor.execute('''
            INSERT INTO inventory 
            (name, category, unit, cost_per_unit, storage_location, supplier)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            item["name"],
            item["category"],
            item["unit"],
            item["cost_per_unit"],
            item["storage_location"],
            item["supplier"]
        ))
    
    conn.commit()
    conn.close()
    print(f"✅ Added {len(inventory_items)} inventory items")
    
    # Generate realistic quantities and dates
    generate_realistic_quantities_and_dates()
    print("✅ Generated realistic quantities and expiration dates")
    
    # Generate transaction history
    generate_transaction_history()
    print("✅ Generated 30 days of transaction history")
    
    # Generate demand calculations
    generate_demand_calculations()
    print("✅ Generated sample demand calculations")
    
    print("\n🎉 Demo data generation complete!")
    print("\n📊 Summary:")
    print(f"   • {len(inventory_items)} inventory items")
    print("   • 30 days of transaction history")
    print("   • 6 sample demand calculations")
    print("   • Realistic quantities, costs, and expiration dates")
    print("\n🚀 Your Italian restaurant is ready for demo!")

if __name__ == "__main__":
    main()
