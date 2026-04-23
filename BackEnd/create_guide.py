import json
import os

missing_names = [
    'ხაჭოს ჰაეროვანი კრემი კენკრით', 
    'ომლეტი \'ფერადი დილა\'', 
    'იოგურტი ნიგვზით და ვაშლით',
    'ჩახოხბილი ქათმით და რეჰანით', 
    'აჭაფსანდალი გრილზე (დიეტური)', 
    'ლობიო ქოთანში ნიგვზით',
    'ისპანახის ფხალი ნიგვზით', 
    'ფიტნეს-ღომი სულგუნით', 
    'ჩაქაფული საქონლის მჭლე ხორცით',
    'ქართული სალათი ნიგვზის დრესინგით', 
    'კუბდარი ლავაშში (სწრაფი ვერსია)', 
    'ჭარხლის ფხალი ნიგვზით',
    'შემწვარი ბადრიჯანი ნიგვზით (ფიტნეს ვერსია)', 
    'მჭადი (სიმინდის ფქვილის ნამცხვარი)',
    'კვერცხის სქრამბლი სპანახითა და სულგუნით', 
    'ხაჭო ბანანით, ნიგვზითა და თაფლით'
]

data_path = os.path.join('data', 'recipes.json')
output_path = 'recipes_guide.txt'

if os.path.exists(data_path):
    with open(data_path, 'r', encoding='utf-8') as f:
        recipes = json.load(f)

    with open(output_path, 'w', encoding='utf-8') as out:
        out.write('=== GeoFit RECEPT GUIDE FOR PHOTOS ===\n\n')
        for i, name in enumerate(missing_names, 1):
            r = next((x for x in recipes if x['name'] == name), None)
            if r:
                out.write(f'{i}. {r["name"]}\n')
                out.write(f'Category: {r["category"]}\n')
                out.write(f'Prep Time: {r["prep_time"]} min\n')
                out.write('Ingredients:\n')
                for ing in r['ingredients']:
                    out.write(f'  - {ing[0]}: {ing[1]}g\n')
                out.write('Instructions:\n')
                for step in r['instructions']:
                    out.write(f'  {step}\n')
                out.write("-" * 40 + "\n\n")
    print(f"Guide created at {output_path}")
else:
    print(f"Error: {data_path} not found.")
