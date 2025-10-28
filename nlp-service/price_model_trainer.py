# nlp-service/price_model_trainer.py

import pandas as pd
import psycopg2 # Database connector
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor # Or GradientBoostingRegressor, etc.
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_squared_error, r2_score
import joblib # For saving the model and preprocessors
import numpy as np

# --- Database Connection ---
# !! Make sure these match your actual database credentials !!
DB_NAME = "carneeds"
DB_USER = "postgres"
DB_PASS = "YumeBoy" # Update if changed
DB_HOST = "localhost"
DB_PORT = "5432"

def fetch_data():
    """Fetches approved vehicle data from the database."""
    conn = None
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME, user=DB_USER, password=DB_PASS, host=DB_HOST, port=DB_PORT
        )
        print("Database connection successful.")
        
        # Select relevant features AND the target (price)
        # Only fetch 'approved' listings that are NOT for rent
        query = """
            SELECT 
                make, 
                model, 
                year, 
                mileage, 
                fuel_type, 
                transmission, 
                condition, 
                price 
            FROM vehicles 
            WHERE status = 'approved' AND is_rentable = FALSE AND price > 0 AND mileage >= 0 AND year > 1950; 
        """ 
        df = pd.read_sql_query(query, conn)
        print(f"Fetched {len(df)} approved vehicle listings for training.")
        return df
    except Exception as e:
        print(f"Database Error: {e}")
        return pd.DataFrame() # Return empty dataframe on error
    finally:
        if conn:
            conn.close()

def train_model(df):
    """Trains a price prediction model and saves it."""
    if df.empty or len(df) < 50: # Need sufficient data
        print("Not enough data to train the model.")
        return

    # --- Feature Engineering & Preprocessing ---
    
    # 1. Handle Missing Values (Example: fill with 'Unknown' or mode/median)
    # For simplicity, fill categorical with 'Unknown', numerical with median
    categorical_cols = ['make', 'model', 'fuel_type', 'transmission', 'condition']
    numerical_cols = ['year', 'mileage']

    for col in categorical_cols:
        df[col] = df[col].fillna('Unknown')
    for col in numerical_cols:
        df[col] = df[col].fillna(df[col].median())
        
    # Ensure numerical types are correct
    df['year'] = df['year'].astype(int)
    df['mileage'] = df['mileage'].astype(int)
    df['price'] = df['price'].astype(float) # Target variable

    # 2. Define Features (X) and Target (y)
    X = df.drop('price', axis=1)
    y = df['price']

    # 3. Define Preprocessing Steps
    # OneHotEncode categorical features, handle unknown values by ignoring them during transform
    # Passthrough numerical features (no scaling applied here for simplicity, but could add StandardScaler)
    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_cols) 
        ],
        remainder='passthrough' # Keep numerical columns (year, mileage)
    )

    # 4. Create the Full Pipeline
    # Using RandomForestRegressor as an example
    model_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1, max_depth=20, min_samples_split=5))
    ])

    # --- Model Training ---
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Starting model training...")
    model_pipeline.fit(X_train, y_train)
    print("Model training complete.")

    # --- Evaluation (Optional) ---
    y_pred = model_pipeline.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    print(f"Evaluation - RMSE: {rmse:.2f}, R2 Score: {r2:.2f}")

# --- Saving the Model and Preprocessors ---

    # Extract the fitted preprocessor step from the pipeline
    fitted_preprocessor = model_pipeline.named_steps['preprocessor']
    # Also save the column order used during training
    training_columns = X.columns.tolist() 

    try:
        joblib.dump(model_pipeline, 'price_model.pkl')
        # Save the fitted preprocessor itself and the column order
        joblib.dump({'preprocessor': fitted_preprocessor, 'columns': training_columns}, 'price_model_preprocessor.pkl') 
        print("Model pipeline and preprocessor saved successfully ('price_model.pkl', 'price_model_preprocessor.pkl').")
    except Exception as e:
        print(f"Error saving model/preprocessor: {e}")


# --- Main Execution ---
if __name__ == "__main__":
    vehicle_data = fetch_data()
    train_model(vehicle_data)