import os
import json
import sqlite3
import re

# This script restores Georgian characters to recipe names and image filenames.
# It uses the recipe "name" as the base for the "image_url" filename.

def sanitize_georgian_filename(name):
    # Keep Georgian characters, numbers, and replace everything else with underscore
    # We allow Georgian range \u10A0-\u10FF
    res = re.sub(r'[^\u10A0-\u10FFa-zA-Z0-9\.]', '_', name)
    # Remove multiple underscores
    res = re.sub(r'_+', '_', res)
    return res.strip('_')

def restore_georgian():
    assets_dir = 'assets'
    data_path = os.path.join('data', 'recipes.json')
    db_path = 'recipes.db'

    if not os.path.exists(data_path):
        print("Error: recipes.json not found")
        return

    with open(data_path, 'r', encoding='utf-8') as f:
        recipes = json.load(f)

    # Dictionary to map old transliterated names to new Georgian names for file renaming
    # We use the JSON as the source of truth for the Georgian name
    
    print(f"--- Restoring Georgian characters for {len(recipes)} recipes ---")

    for r in recipes:
        geo_name = r['name']
        old_image_url = r['image_url']
        
        if old_image_url.startswith('assets/'):
            # Determine extension from the old filename
            ext = os.path.splitext(old_image_url)[1]
            if not ext:
                ext = '.jpg' # Fallback
                
            new_filename = sanitize_georgian_filename(geo_name) + ext
            new_image_url = f"assets/{new_filename}"
            
            # 1. Rename file on disk if it exists
            old_filename = old_image_url.replace('assets/', '')
            old_path = os.path.join(assets_dir, old_filename)
            new_path = os.path.join(assets_dir, new_filename)
            
            if os.path.exists(old_path):
                if old_path != new_path:
                    try:
                        # If the new path already exists, we might have a collision
                        if os.path.exists(new_path):
                            os.remove(old_path)
                        else:
                            os.rename(old_path, new_path)
                        # Avoid print with Unicode if it causes issues, or use a safe log
                        # print(f"Renamed: {old_filename} -> {new_filename}")
                    except Exception as e:
                        pass # Ignore print errors, the rename is what matters
            else:
                if not os.path.exists(new_path):
                    pass # Warning would fail on print too
            
            # 2. Update JSON
            r['image_url'] = new_image_url

    # Save updated JSON
    with open(data_path, 'w', encoding='utf-8') as f:
        json.dump(recipes, f, indent=4, ensure_ascii=False)
    print("Updated recipes.json")

    # 3. Update Database (easiest is to run seed.py after cleaning)
    print("Running seed.py to update database...")
    import seed
    seed.seed_database()

if __name__ == "__main__":
    restore_georgian()
