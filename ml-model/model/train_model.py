import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

# Load data
df = pd.read_csv('../data/transactions.csv')

# Features (what ML learns from)
X = df[['amount', 'hour', 'transaction_type', 
        'is_international', 'velocity_count', 'distance_km']]
y = df['is_fraud']

# Split into training and testing
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Train the model (Random Forest = best for fraud detection)
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Check accuracy
print(classification_report(y_test, model.predict(X_test)))

# Save the model
joblib.dump(model, 'fraud_model.pkl')
print("[OK] Model saved!")