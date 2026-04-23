import json
import os
import re

GEO_TO_LAT = {
    'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v', 'ზ': 'z', 'თ': 't', 'ი': 'i', 'კ': 'k',
    'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o', 'პ': 'p', 'ჟ': 'zh', 'რ': 'r', 'ს': 's', 'ტ': 't', 'უ': 'u',
    'ფ': 'p', 'ქ': 'k', 'ღ': 'gh', 'ყ': 'q', 'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts', 'ძ': 'dz', 'წ': 'ts',
    'ჭ': 'ch', 'ხ': 'kh', 'ჯ': 'j', 'ჰ': 'h'
}

def transliterate(s):
    res = ""
    for char in s.lower():
        res += GEO_TO_LAT.get(char, char)
    # Remove non-ascii and keep spaces/dashes
    res = re.sub(r'[^a-zA-Z0-9\.\-\_\s\(\)]', '', res)
    # Replace multiple spaces with one
    res = ' '.join(res.split())
    # Replace spaces with underscores for safer filenames
    res = res.replace(' ', '_')
    return res

def normalize_string(s):
    # Transliterate and clean
    name, ext = os.path.splitext(s)
    new_name = transliterate(name)
    return f"{new_name}{ext}"

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
                # print(f"Renamed: {filename} -> {new_filename}")
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
