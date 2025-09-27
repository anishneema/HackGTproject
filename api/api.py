from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import xgboost as xgb
import joblib

app = Flask(__name__)
CORS(app)

model = joblib.load("xgb_model (5).pkl")  


@app.route("/api/ml", methods = ["POST", "GET"])
def predict():
    data = request.get_json()  # get the formData from React

    try:
        dish_price = float(data.get("dishPrice", 0))
        discount_applied = bool(data.get("discountApplied", False))
        discount = False
        print(discount_applied)
        discount_amount = 0
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
            "base_price": float(data.get("dishPrice", 0)),
            "checkout_price": final_price,
            "category": data.get("category", ""),
            "cuisine": data.get("cuisine", ""),
            "emailer_for_promotion": int(data.get("emailedInPromotions", True) == True),
            "homepage_featured": int(data.get("featuredOnHomepage", True) == True),
            "discount amount": discount_amount,
            "discount percent": discount_percentage,
            "center_type": data.get("centerType", ""),
            "discount y/n": discount
        }])
        df["cuisine"] = df["cuisine"].astype("category")
        df["category"] = df["category"].astype("category")
        df["center_type"] = df["center_type"].astype("category")
        df = df[['checkout_price', 'base_price', 'emailer_for_promotion', 'homepage_featured',
         'center_type', 'category', 'cuisine', 'discount amount', 'discount percent', 'discount y/n']]


    except Exception as e:
        print("Prediction error:", e)
        return jsonify({"error": str(e)}), 500
    print(df['center_type'])
    pred = model.predict(df)
    predicted_orders = round(float(pred[0]))
    return jsonify({
        "predictedOrders": predicted_orders,
        "finalPrice": round(final_price, 2),
        "discountAmount": round(discount_amount, 2)
    })


if __name__ == "__main__":
    app.run(debug = True)
