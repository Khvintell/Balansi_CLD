import sqlite3
import json
import os

def sync_db():
    db_path = 'recipes.db'
    json_path = os.path.join('data', 'recipes.json')
    
    if not os.path.exists(db_path):
        print(f"Error: {db_path} not found")
        return
    if not os.path.exists(json_path):
        print(f"Error: {json_path} not found")
        return

    with open(json_path, 'r', encoding='utf-8') as f:
        recipes_data = json.load(f)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    table_name = 'recipes'
    print(f"Syncing table: {table_name}")

    updated_count = 0
    for r in recipes_data:
        name = r['name']
        image_url = r['image_url']
        
        # Update by name (since IDs might differ or handle by name mapping)
        cursor.execute(f"UPDATE {table_name} SET image_url = ? WHERE name = ?", (image_url, name))
        if cursor.rowcount > 0:
            updated_count += 1
        else:
            print(f"Warning: Could not find recipe '{name}' in DB to update image_url.")

    conn.commit()
    conn.close()
    print(f"Successfully updated {updated_count} recipes in the database.")

if __name__ == "__main__":
    sync_db()
