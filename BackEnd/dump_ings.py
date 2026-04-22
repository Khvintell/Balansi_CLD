import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

r = json.load(open('data/recipes.json', encoding='utf-8'))
ings = set()
for x in r:
    for i in x.get('ingredients', []):
        if isinstance(i, dict):
            name = i.get('product_name') or i.get('name')
            if name:
                ings.add(name)
        elif isinstance(i, str):
            ings.add(i)
        elif isinstance(i, list):
            # possibly an array of arrays? let's take first elem if string
            if i and isinstance(i[0], str):
                ings.add(i[0])

with open('ings.txt', 'w', encoding='utf-8') as f:
    f.write("\n".join(sorted(list(ings))))
