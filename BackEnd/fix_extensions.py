import json
import os
import sys

# Set encoding for output to avoid UnicodeEncodeError in terminal
try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    # Older python versions
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())

assets_dir = 'assets'
if not os.path.exists(assets_dir):
    print(f"Error: {assets_dir} not found")
    sys.exit(1)

files = os.listdir(assets_dir)

data_path = os.path.join('data', 'recipes.json')
with open(data_path, 'r', encoding='utf-8') as f:
    recipes = json.load(f)

# The 20 recipes we're interested in
mapping = {
    'ხაჭოს ჰაეროვანი კრემი კენკრით': 'ხაჭოს კრემი',
    'ომლეტი \'ფერადი დილა\'': 'ომლეტი ფერადი დილა',
    'იოგურტი ნიგვზით და ვაშლით': 'იოგურტი ნიგვზით',
    'ჩახოხბილი ქათმით და რეჰანით': 'ჩახოხბილი ქათმით და რეჰანით',
    'აჭაფსანდალი გრილზე (დიეტური)': 'აჭაფსანდალი გრილზე (დიეტური)',
    'ლობიო ქოთანში ნიგვზით': 'ლობიო ქოთანში ნიგვზით',
    'ისპანახის ფხალი ნიგვზით': 'ისპანახის ფხალი ნიგვზით',
    'ფიტნეს-ღომი სულგუნით': 'ფიტნეს-ღომი სულგუნით',
    'ჩაქაფული საქონლის მჭლე ხორცით': 'ჩაქაფული საქონლის მჭლე ხორცით',
    'ქართული სალათი ნიგვზის დრესინგით': 'ქართული სალათი ნიგვზის დრესინგით',
    'კუბდარი ლავაშში (სწრაფი ვერსია)': 'კუბდარი ლავაშში (სწრაფი ვერსია)',
    'ჭარხლის ფხალი ნიგვზით': 'ჭარხლის ფხალი ნიგვზით',
    'შემწვარი ბადრიჯანი ნიგვზით (ფიტნეს ვერსია)': 'შემწვარი ბადრიჯანი ნიგვზით (ფიტნეს ვერსია)',
    'მჭადი (სიმინდის ფქვილის ნამცხვარი)': 'მჭადი (სიმინდის ფქვილის ნამცხვარი)',
    'ლობიანი მთელმარცვლოვან ლავაშში': 'ლობიანი მთელმარცვლოვან ლავაშში',
    'ბანანის სმუზი-ბოული შვრიის ფლოკებით': 'ბანანის სმუზი-ბოული შვრიის ფლოკებით',
    'ავოკადო-ტოსტი მოხარშული კვერცხით': 'ავოკადო-ტოსტი მოხარშული კვერცხით',
    'ოვსიანკა ვაშლით, ნიგვზითა და დარიჩინით': 'ოვსიანკა ვაშლით, ნიგვზითა და დარიჩინით',
    'კვერცხის სქრამბლი სპანახითა და სულგუნით': 'კვერცხის სქრამბლი სპანახითა და სულგუნით',
    'ხაჭო ბანანით, ნიგვზითა და თაფლით': 'ხაჭო ბანანით, ნიგვზითა და თაფლით'
}

updated_count = 0
for r in recipes:
    if r['name'] in mapping:
        base_name = mapping[r['name']]
        # Find actual file with any extension
        actual_file = next((f for f in files if f.startswith(base_name)), None)
        if actual_file:
            r['image_url'] = 'assets/' + actual_file
            updated_count += 1
            # Avoid printing Georgian chars to console to prevent UnicodeEncodeError
            print(f"Fixed image for recipe: {updated_count}")
        else:
            print(f"WARNING: File not found for: {r['name'].encode('ascii', 'ignore').decode()}")

with open(data_path, 'w', encoding='utf-8') as f:
    json.dump(recipes, f, indent=4, ensure_ascii=False)

print(f"\nSuccessfully updated {updated_count} recipes in recipes.json")
