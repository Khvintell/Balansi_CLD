import json
import os
import re

def normalize_string(s):
    # Replace special dashes with standard hyphen
    s = s.replace('\u2012', '-') # FIGURE DASH
    s = s.replace('\u2013', '-') # EN DASH
    s = s.replace('\u2014', '-') # EM DASH
    s = s.replace('\u2015', '-') # HORIZONTAL BAR
    # Remove extra spaces
    s = ' '.join(s.split())
    return s

def normalize_assets():
    assets_dir = 'assets'
    data_path = os.path.join('data', 'recipes.json')
    
    if not os.path.exists(assets_dir):
        print("Error: assets directory not found")
        return

    # 1. Normalize actual files on disk
    files = os.listdir(assets_dir)
    file_map = {} # old_name -> new_name
    
    for filename in files:
        if filename in ['logo.png', 'logo BG.png']:
            continue
            
        new_filename = normalize_string(filename)
        if new_filename != filename:
            old_path = os.path.join(assets_dir, filename)
            new_path = os.path.join(assets_dir, new_filename)
            
            # Handle collision
            if os.path.exists(new_path) and filename != new_filename:
                print(f"Collision: {new_filename} already exists. Skipping rename of {filename}")
                file_map[filename] = new_filename
            else:
                os.rename(old_path, new_path)
                print(f"Renamed: {filename} -> {new_filename}")
                file_map[filename] = new_filename
        else:
            file_map[filename] = filename

    # 2. Update recipes.json and remove Satsivi
    if os.path.exists(data_path):
        with open(data_path, 'r', encoding='utf-8') as f:
            recipes = json.load(f)
            
        original_count = len(recipes)
        
        # Remove Satsivi permanently
        recipes = [r for r in recipes if 'საცივი' not in r['name'] and 'საცცივი' not in r['name']]
        removed_satsivi = original_count - len(recipes)
        
        updated_images = 0
        for r in recipes:
            img_url = r['image_url']
            if img_url.startswith('assets/'):
                old_img_name = img_url.replace('assets/', '')
                
                # Check mapping
                normalized_img_name = normalize_string(old_img_name)
                
                # Further check if the file exists with a different extension
                current_files = os.listdir(assets_dir)
                base_name = os.path.splitext(normalized_img_name)[0]
                
                actual_file = next((f for f in current_files if f.startswith(base_name)), None)
                
                if actual_file:
                    new_url = f"assets/{actual_file}"
                    if r['image_url'] != new_url:
                        r['image_url'] = new_url
                        updated_images += 1
                else:
                    print(f"Warning: No file found for {r['name']} (tried {base_name})")

        with open(data_path, 'w', encoding='utf-8') as f:
            json.dump(recipes, f, indent=4, ensure_ascii=False)
            
        print(f"\nSummary:")
        print(f"- Recipes processed: {len(recipes)}")
        print(f"- Satsivi recipes removed: {removed_satsivi}")
        print(f"- Image paths updated: {updated_images}")
    else:
        print("Error: recipes.json not found")

if __name__ == "__main__":
    normalize_assets()
