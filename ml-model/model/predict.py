from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np

app = Flask(__name__)
CORS(app)

model = joblib.load('fraud_model.pkl')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    features = [[
        data['amount'],
        data['hour'],
        data['transaction_type'],
        data['is_international'],
        data['velocity_count'],
        data['distance_km']
    ]]
    
    prediction = model.predict(features)[0]
    probability = model.predict_proba(features)[0][1]  # Fraud probability
    fraud_score = round(probability * 100, 2)
    
    return jsonify({
        'is_fraud': bool(prediction),
        'fraud_score': fraud_score,
        'risk_level': 'HIGH' if fraud_score > 70 else 'MEDIUM' if fraud_score > 40 else 'LOW'
    })

if __name__ == '__main__':
    app.run(port=5001)