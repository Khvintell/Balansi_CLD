import json
import os

target_file = 'data/recipes.json'

with open(target_file, 'r', encoding='utf-8') as f:
    recipes = json.load(f)

# Track changes
deleted_count = 0
updated_count = 0

new_recipes = []
for r in recipes:
    name = r.get('name', '')
    
    # Check for satsivi to remove
    if 'საცივი' in name:
        deleted_count += 1
        continue
        
    # Check for categories to update
    targets = ['ისპანახის ფხალი', 'ჭარხლის ფხალი', 'შემწვარი ბადრიჯანი', 'შემწვარი ბარდიჯანი', 'მჭადი', 'ლობიანი']
    
    # We check if any target string is in the name
    if any(tag in name for tag in targets):
        if r.get('category') == 'წახემსება':
            r['category'] = 'სადილი'
            updated_count += 1

    new_recipes.append(r)

# Write back
with open(target_file, 'w', encoding='utf-8') as f:
    json.dump(new_recipes, f, ensure_ascii=False, indent=2)

print(f"Update complete. Deleted {deleted_count} recipes. Updated category for {updated_count} recipes.")
