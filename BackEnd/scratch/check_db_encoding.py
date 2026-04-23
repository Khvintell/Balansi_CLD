import sqlite3
import os

db_path = 'recipes.db'
if not os.path.exists(db_path):
    print(f"Error: {db_path} not found")
    exit(1)

conn = sqlite3.connect(db_path)
c = conn.cursor()
c.execute('SELECT name, image_url FROM recipes')
rows = c.fetchall()
encoded = [r for r in rows if '%' in r[1]]
print(f"Total rows: {len(rows)}")
print(f"Encoded rows: {len(encoded)}")
for r in encoded[:10]:
    print(r)

conn.close()
