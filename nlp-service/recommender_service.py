# nlp-service/recommender_service.py
# (This script CALCULATES and SAVES recommendations to the DB)

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

# --- Database Connection ---
DB_NAME = "carneeds"
DB_USER = "postgres"
DB_PASSWORD = "YumeBoy" # Use environment variable!
DB_HOST = "localhost"
DB_PORT = "5432"

def get_db_connection():
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST, port=DB_PORT
        )
        return conn
    except psycopg2.Error as e:
        print(f"Error connecting to database: {e}")
        return None

# --- Recommendation Logic ---
vehicles_df = pd.DataFrame()
tfidf_matrix = None
tfidf_vectorizer = None

def load_and_prepare_data(conn):
    """Loads vehicle data and prepares TF-IDF matrix."""
    global vehicles_df, tfidf_matrix, tfidf_vectorizer
    try:
        query = """
            SELECT id, title, description, make, model, year, fuel_type, transmission, location, condition, price
            FROM vehicles
            WHERE description IS NOT NULL AND make IS NOT NULL AND model IS NOT NULL
            ORDER BY id
        """
        vehicles_df = pd.read_sql(query, conn)
        if vehicles_df.empty: return False

        vehicles_df['content'] = vehicles_df.apply(lambda row: ' '.join([
            str(row['title'] or ''), str(row['description'] or ''), str(row['make'] or ''),
            str(row['model'] or ''), str(row['fuel_type'] or ''), str(row['transmission'] or ''),
            str(row['location'] or ''), str(row['condition'] or '')
        ]), axis=1)

        tfidf_vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = tfidf_vectorizer.fit_transform(vehicles_df['content'])
        print(f"Data loaded and TF-IDF matrix created. Shape: {tfidf_matrix.shape}")
        return True
    except Exception as e:
        print(f"Error loading/preparing data: {e}")
        return False

def get_content_based_recommendations(target_vehicle_ids, num_recommendations=10):
    """Generates content-based recommendations (returns list of [vehicle_id, score])."""
    results = []
    if vehicles_df.empty or tfidf_matrix is None or not target_vehicle_ids: return results

    target_indices = vehicles_df[vehicles_df['id'].isin(target_vehicle_ids)].index
    if len(target_indices) == 0: return results

    target_vector = tfidf_matrix[target_indices].mean(axis=0)
    cosine_similarities = cosine_similarity(target_vector, tfidf_matrix).flatten()
    similar_indices = cosine_similarities.argsort()[::-1]

    for idx in similar_indices:
        if idx in vehicles_df.index:
            vehicle_id = vehicles_df.loc[idx, 'id']
            score = cosine_similarities[idx]
            if vehicle_id not in target_vehicle_ids and score > 0.1: # Add a threshold
                 # Clamp score between 0 and 1, format
                 formatted_score = max(0.0, min(1.0, score))
                 results.append([int(vehicle_id), round(formatted_score, 4)]) # Return ID and score
            if len(results) >= num_recommendations:
                break
    return results

def get_popularity_recommendations(conn, num_recommendations=20):
    """Generates popularity recommendations (returns list of [vehicle_id, score=0.1])."""
    # Simple popularity - score is low (0.1) as a fallback indicator
    try:
        query = """
            SELECT vehicle_id, COUNT(id) as view_count
            FROM user_vehicle_views
            WHERE viewed_at > NOW() - INTERVAL '30 days'
            GROUP BY vehicle_id
            ORDER BY view_count DESC
            LIMIT %s
        """
        cursor = conn.cursor()
        cursor.execute(query, (num_recommendations,))
        results = cursor.fetchall()
        cursor.close()
        # Assign a low, fixed score for popularity
        popular_recs = [[row[0], 0.1000] for row in results]
        return popular_recs
    except Exception as e:
        print(f"Error getting popularity recs: {e}")
        return []

def save_recommendations(conn, user_id, recommendations_with_scores):
    """Saves generated recommendations to the database, replacing old ones."""
    cursor = conn.cursor()
    try:
        # 1. Delete old recommendations for this user
        cursor.execute("DELETE FROM recommendations WHERE user_id = %s", (user_id,))

        # 2. Insert new recommendations
        insert_query = """
            INSERT INTO recommendations (user_id, vehicle_id, score, created_at)
            VALUES (%s, %s, %s, NOW())
        """
        # Prepare data as list of tuples
        data_to_insert = [
            (user_id, rec[0], rec[1]) for rec in recommendations_with_scores
        ]

        if data_to_insert:
            psycopg2.extras.execute_batch(cursor, insert_query, data_to_insert)
            conn.commit()
            print(f"Saved {len(data_to_insert)} recommendations for user {user_id}")
        else:
             print(f"No recommendations to save for user {user_id}")

    except Exception as e:
        conn.rollback() # Rollback changes on error
        print(f"Error saving recommendations for user {user_id}: {e}")
    finally:
        cursor.close()


def generate_recommendations_for_user(conn, user_id, num_recs=10):
    """Generates and saves recommendations for a single user."""
    cursor = conn.cursor()
    try:
        # Get user's recent views
        query_views = """
            SELECT vehicle_id FROM user_vehicle_views
            WHERE user_id = %s ORDER BY viewed_at DESC LIMIT 5
        """
        cursor.execute(query_views, (user_id,))
        recent_viewed_ids = [row[0] for row in cursor.fetchall()]

        final_recs_with_scores = []

        # Get Content-Based
        if recent_viewed_ids:
            content_recs = get_content_based_recommendations(recent_viewed_ids, num_recommendations=num_recs)
            final_recs_with_scores.extend(content_recs)

        # Get Popularity (as fallback or supplement)
        if len(final_recs_with_scores) < num_recs:
            needed = num_recs # Fetch more popular ones to ensure variety
            popular_recs = get_popularity_recommendations(conn, num_recommendations=needed)
            
            # Add popular recs not already present, ensuring scores are distinct
            existing_ids = {rec[0] for rec in final_recs_with_scores}
            for pid, pscore in popular_recs:
                if pid not in existing_ids:
                     final_recs_with_scores.append([pid, pscore])
                if len(final_recs_with_scores) >= num_recs * 1.5: # Fetch a bit more just in case
                     break # Stop if we have enough potential candidates

        # Collaborative Filtering Placeholder...
        # cf_recs = get_cf_recommendations(conn, user_id, num_recs) ...
        # Merge cf_recs with final_recs_with_scores, potentially adjusting scores...

        # Sort by score (descending), take top N, ensure uniqueness
        final_recs_with_scores.sort(key=lambda x: x[1], reverse=True)
        
        unique_recs_dict = {}
        for rec in final_recs_with_scores:
             if rec[0] not in unique_recs_dict: # Keep the one with the highest score if duplicate ID
                 unique_recs_dict[rec[0]] = rec[1]

        # Convert back to list and take top N
        unique_recs_list = [[vid, score] for vid, score in unique_recs_dict.items()]
        recommendations_to_save = unique_recs_list[:num_recs]

        # Save to DB
        save_recommendations(conn, user_id, recommendations_to_save)

    except Exception as e:
        print(f"Error generating recommendations for user {user_id}: {e}")
    finally:
        cursor.close()


def main():
    """Main function to generate recommendations for all active users."""
    conn = get_db_connection()
    if not conn:
        print("Exiting: Database connection failed.")
        return

    if not load_and_prepare_data(conn):
        print("Exiting: Failed to load vehicle data.")
        conn.close()
        return

    cursor = conn.cursor()
    try:
        # Get users who have interacted recently (e.g., viewed items in last 30 days)
        # Or simply get all users if the user base is small
        cursor.execute("""
            SELECT DISTINCT user_id FROM user_vehicle_views 
            WHERE viewed_at > NOW() - INTERVAL '30 days'
            ORDER BY user_id
        """)
        # Alternatively: SELECT id FROM users ORDER BY id
        
        active_users = [row[0] for row in cursor.fetchall()]
        print(f"Found {len(active_users)} active users to generate recommendations for.")

        for user_id in active_users:
            print(f"--- Generating for user {user_id} ---")
            generate_recommendations_for_user(conn, user_id, num_recs=10) # Generate 10 recs per user

    except Exception as e:
        print(f"An error occurred during the main process: {e}")
    finally:
        cursor.close()
        conn.close()
        print("Recommendation generation process finished.")


if __name__ == '__main__':
    # Make sure psycopg2.extras is imported if needed for execute_batch
    import psycopg2.extras 
    main()