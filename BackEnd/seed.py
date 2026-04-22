import sqlite3
import json
import os

def load_json(filename):
    """Loads a JSON file from the data directory."""
    path = os.path.join(os.path.dirname(__file__), "data", filename)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def seed_database():
    conn = sqlite3.connect("recipes.db")
    cur = conn.cursor()

    # ── Schema ──────────────────────────────────────────────────────────
    cur.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE,
            calories_per_100g REAL,
            protein_per_100g  REAL,
            carbs_per_100g    REAL,
            fats_per_100g     REAL
        )
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS recipes (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            name           TEXT UNIQUE,
            category       TEXT,
            prep_time      INTEGER,
            servings       INTEGER DEFAULT 1,
            total_calories INTEGER,
            protein        INTEGER,
            carbs          INTEGER,
            fats           INTEGER,
            image_url      TEXT,
            instructions   TEXT
        )
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS ingredients (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            recipe_id    INTEGER,
            product_name TEXT,
            amount_grams REAL,
            FOREIGN KEY(recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
        )
    ''')

    # --- Clean State ---
    cur.execute("DELETE FROM ingredients")
    cur.execute("DELETE FROM recipes")
    cur.execute("DELETE FROM sqlite_sequence WHERE name IN ('recipes', 'ingredients')")
    # Note: We keep products as they are OR REPLACE usually handles it, 
    # but let's be thorough if the user wants absolute clean.
    # cur.execute("DELETE FROM products") 

    # ── Seed Products ───────────────────────────────────────────────────
    all_products = load_json("products.json")
    print(f"--- Seeding {len(all_products)} products ---")
    prod_dict = {}
    for p in all_products:
        cur.execute('''
            INSERT OR REPLACE INTO products
                (name, calories_per_100g, protein_per_100g, carbs_per_100g, fats_per_100g)
            VALUES (?, ?, ?, ?, ?)
        ''', (p["n"], p["cal"], p["p"], p["c"], p["f"]))
        prod_dict[p["n"]] = p
    conn.commit()

    # ── Seed Recipes & Calculate Macros ──────────────────────────────────
    all_recipes = load_json("recipes.json")
    print(f"--- Seeding {len(all_recipes)} recipes & calculating macros ---")
    
    for r in all_recipes:
        total_cal = total_p = total_c = total_f = 0
        
        # Calculate macros based on ingredients
        for ing_name, amount in r["ingredients"]:
            if ing_name in prod_dict:
                p = prod_dict[ing_name]
                factor = amount / 100.0
                total_cal += p["cal"] * factor
                total_p   += p["p"]   * factor
                total_c   += p["c"]   * factor
                total_f   += p["f"]   * factor

        instructions_json = json.dumps(r["instructions"], ensure_ascii=False)

        cur.execute("SELECT id FROM recipes WHERE name=?", (r["name"],))
        existing = cur.fetchone()

        if existing:
            recipe_id = existing[0]
            cur.execute('''
                UPDATE recipes
                SET category=?, prep_time=?, servings=?, total_calories=?,
                    protein=?, carbs=?, fats=?, image_url=?, instructions=?
                WHERE id=?
            ''', (
                r["category"], r["prep_time"], r["servings"],
                round(total_cal), round(total_p), round(total_c), round(total_f),
                r["image_url"], instructions_json, recipe_id,
            ))
            cur.execute("DELETE FROM ingredients WHERE recipe_id=?", (recipe_id,))
        else:
            cur.execute('''
                INSERT INTO recipes
                    (name, category, prep_time, servings, total_calories,
                     protein, carbs, fats, image_url, instructions)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                r["name"], r["category"], r["prep_time"], r["servings"],
                round(total_cal), round(total_p), round(total_c), round(total_f),
                r["image_url"], instructions_json,
            ))
            recipe_id = cur.lastrowid

        # Insert ingredients
        for ing_name, amount in r["ingredients"]:
            cur.execute(
                "INSERT INTO ingredients (recipe_id, product_name, amount_grams) VALUES (?, ?, ?)",
                (recipe_id, ing_name, amount),
            )

    conn.commit()
    print("Done! Database updated successfully.")
    conn.close()

if __name__ == "__main__":
    seed_database()