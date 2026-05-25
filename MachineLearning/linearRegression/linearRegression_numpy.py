import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score

# Sample data: house size (sq ft) -> price ($)
X = np.array([[800], [1000], [1200], [1400], [1600], [1800], [2000]])
y = np.array([150000, 180000, 210000, 240000, 270000, 300000, 330000])

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Fit model: y = slope * x + intercept
model = LinearRegression()
model.fit(X_train, y_train)

# Predict
y_pred = model.predict(X_test)

# Evaluate
print("Slope:", model.coef_[0])
print("Intercept:", model.intercept_)
print("MSE:", mean_squared_error(y_test, y_pred))
print("R²:", r2_score(y_test, y_pred))

# Predict a new value
new_size = np.array([[1500]])
print("Predicted price:", model.predict(new_size)[0])
