# nlp-service/recommender_service.py
# (This script CALCULATES and SAVES recommendations to the DB)

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import psycopg2
import psycopg2.extras # Import extras for execute_batch
import os
from dotenv import load_dotenv
import numpy as np # ++ IMPORT NUMPY ++

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
        if vehicles_df.empty:
            print("No vehicle data loaded. Exiting preparation.")
            return False

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
    # Add explicit checks for None on tfidf_matrix
    if vehicles_df.empty or tfidf_matrix is None or not target_vehicle_ids:
        print("Content-based: Data not ready or no target IDs.")
        return results

    target_indices = vehicles_df[vehicles_df['id'].isin(target_vehicle_ids)].index
    if len(target_indices) == 0:
        print(f"Content-based: Target IDs {target_vehicle_ids} not found in loaded data.")
        return results

    # Calculate average TF-IDF vector for the target items
    target_vector_matrix = tfidf_matrix[target_indices].mean(axis=0)

    # ++ FIX: Convert the matrix result to a NumPy array ++
    target_vector_array = target_vector_matrix.A # .A converts matrix to array

    # Calculate cosine similarity using the array
    # Ensure tfidf_matrix is not None before proceeding
    if tfidf_matrix is None:
        print("Content-based: TF-IDF matrix is None, cannot calculate similarity.")
        return []
    cosine_similarities = cosine_similarity(target_vector_array, tfidf_matrix).flatten()
    # ++ END FIX ++

    similar_indices = cosine_similarities.argsort()[::-1] # Sort descending

    count = 0
    for idx in similar_indices:
        # Check index validity (less likely to be an issue now, but safe)
        if idx < 0 or idx >= len(vehicles_df):
            continue

        vehicle_id = vehicles_df.iloc[idx]['id'] # Use iloc for integer position based lookup
        score = cosine_similarities[idx]

        # Ensure vehicle_id is int and score is float before appending
        try:
            vehicle_id_int = int(vehicle_id)
            score_float = float(score)
        except (ValueError, TypeError):
             print(f"Warning: Skipping invalid index {idx} with vehicle_id {vehicle_id} or score {score}")
             continue


        if vehicle_id_int not in target_vehicle_ids and score_float > 0.1: # Threshold
            formatted_score = max(0.0, min(1.0, score_float))
            results.append([vehicle_id_int, round(formatted_score, 4)])
            count += 1
            if count >= num_recommendations:
                break

    print(f"Content-based: Generated {len(results)} recommendations for targets {target_vehicle_ids}")
    return results


def get_popularity_recommendations(conn, num_recommendations=20):
    """Generates popularity recommendations (returns list of [vehicle_id, score=0.1])."""
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
        popular_recs = [[row[0], 0.1000] for row in results]
        print(f"Popularity: Found {len(popular_recs)} popular items.")
        return popular_recs
    except Exception as e:
        print(f"Error getting popularity recs: {e}")
        return []

def save_recommendations(conn, user_id, recommendations_with_scores):
    """Saves generated recommendations to the database, replacing old ones."""
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM recommendations WHERE user_id = %s", (user_id,))

        insert_query = """
            INSERT INTO recommendations (user_id, vehicle_id, score, created_at)
            VALUES (%s, %s, %s, NOW())
        """
        data_to_insert = [
            (user_id, rec[0], rec[1]) for rec in recommendations_with_scores if len(rec)==2 
        ]

        if data_to_insert:
            psycopg2.extras.execute_batch(cursor, insert_query, data_to_insert)
            conn.commit()
            print(f"Saved {len(data_to_insert)} recommendations for user {user_id}")
        else:
             print(f"No valid recommendations to save for user {user_id}")

    except Exception as e:
        conn.rollback()
        print(f"Error saving recommendations for user {user_id}: {e}")
    finally:
        cursor.close()


def generate_recommendations_for_user(conn, user_id, num_recs=10):
    """Generates and saves recommendations for a single user."""
    cursor = conn.cursor()
    try:
        query_views = """
            SELECT vehicle_id FROM user_vehicle_views
            WHERE user_id = %s ORDER BY viewed_at DESC LIMIT 5
        """
        cursor.execute(query_views, (user_id,))
        recent_viewed_ids = [row[0] for row in cursor.fetchall()]
        print(f"User {user_id}: Recent views = {recent_viewed_ids}")

        final_recs_with_scores = []

        if recent_viewed_ids:
            content_recs = get_content_based_recommendations(recent_viewed_ids, num_recommendations=num_recs)
            final_recs_with_scores.extend(content_recs)

        if len(final_recs_with_scores) < num_recs:
            needed = num_recs 
            popular_recs = get_popularity_recommendations(conn, num_recommendations=needed + len(final_recs_with_scores)) 
            
            existing_ids = {rec[0] for rec in final_recs_with_scores}
            added_popular = 0
            for pid, pscore in popular_recs:
                if len(final_recs_with_scores) >= num_recs: 
                     break
                if pid not in existing_ids:
                     final_recs_with_scores.append([pid, pscore])
                     existing_ids.add(pid) 
                     added_popular += 1
            print(f"User {user_id}: Added {added_popular} popular recommendations.")


        # Sort by score, ensure uniqueness, take top N
        # Need to re-sort after potentially adding popular items
        final_recs_with_scores.sort(key=lambda x: x[1], reverse=True)

        unique_recs_dict = {}
        for rec in final_recs_with_scores:
             # Check if rec has the expected structure [id, score]
             if isinstance(rec, list) and len(rec) == 2:
                 rec_id = rec[0]
                 rec_score = rec[1]
                 if rec_id not in unique_recs_dict: # Keep the first occurrence (highest score due to sort)
                     unique_recs_dict[rec_id] = rec_score
             else:
                  print(f"Warning: Skipping malformed recommendation item: {rec}")


        unique_recs_list = [[vid, score] for vid, score in unique_recs_dict.items()]
        # Sort again by score after making unique, before limiting
        unique_recs_list.sort(key=lambda x: x[1], reverse=True)
        recommendations_to_save = unique_recs_list[:num_recs]

        save_recommendations(conn, user_id, recommendations_to_save)

    except Exception as e:
        print(f"Error generating recommendations for user {user_id}: {e}")
    finally:
        if cursor: # Check if cursor was successfully created
             cursor.close()


def main():
    """Main function to generate recommendations for all active users."""
    conn = get_db_connection()
    if not conn:
        print("Exiting: Database connection failed.")
        return

    # Load data ONCE
    if not load_and_prepare_data(conn):
        print("Exiting: Failed to load vehicle data.")
        conn.close()
        return

    cursor = conn.cursor()
    active_users = []
    try:
        # Get users with recent views
        cursor.execute("""
            SELECT DISTINCT user_id FROM user_vehicle_views
            WHERE viewed_at > NOW() - INTERVAL '30 days'
            ORDER BY user_id
        """)
        active_users = [row[0] for row in cursor.fetchall()]
        print(f"Found {len(active_users)} active users with recent views.")

    except Exception as e:
        print(f"An error occurred while fetching active users: {e}")
    finally:
         if cursor:
              cursor.close() # Close cursor used for fetching users


    # Generate recommendations for each active user
    if active_users:
         for user_id in active_users:
             print(f"--- Generating for user {user_id} ---")
             # Pass the existing connection to avoid reconnecting repeatedly
             generate_recommendations_for_user(conn, user_id, num_recs=10)
    else:
        print("No active users found based on recent views.")


    # Close the main connection only after processing all users
    if conn:
        conn.close()
    print("Recommendation generation process finished.")


if __name__ == '__main__':
    main()