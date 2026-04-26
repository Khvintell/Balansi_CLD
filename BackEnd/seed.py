import json
import os
from sqlalchemy.orm import Session
from db.database import SessionLocal, engine, Base
from db.models import Product, Recipe, Ingredient

def load_json(filename):
    """Loads a JSON file from the data directory."""
    path = os.path.join(os.path.dirname(__file__), "data", filename)
    if not os.path.exists(path):
        print(f"Warning: {path} not found.")
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def seed_database():
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        # ── Seed Products ───────────────────────────────────────────────────
        all_products = load_json("products.json")
        print(f"--- Seeding {len(all_products)} products ---")
        
        prod_map = {}
        for p in all_products:
            # Check if product exists
            db_prod = db.query(Product).filter(Product.name == p["n"]).first()
            if not db_prod:
                db_prod = Product(
                    name=p["n"],
                    calories_per_100g=p["cal"],
                    protein_per_100g=p["p"],
                    carbs_per_100g=p["c"],
                    fats_per_100g=p["f"]
                )
                db.add(db_prod)
            else:
                db_prod.calories_per_100g = p["cal"]
                db_prod.protein_per_100g = p["p"]
                db_prod.carbs_per_100g = p["c"]
                db_prod.fats_per_100g = p["f"]
            
            prod_map[p["n"]] = p
        
        db.commit()

        # ── Seed Recipes ───────────────────────────────────────────────────
        all_recipes = load_json("recipes.json")
        print(f"--- Seeding {len(all_recipes)} recipes ---")
        
        for r in all_recipes:
            total_cal = total_p = total_c = total_f = 0
            
            # Calculate macros based on ingredients
            for ing_name, amount in r["ingredients"]:
                if ing_name in prod_map:
                    p = prod_map[ing_name]
                    factor = amount / 100.0
                    total_cal += p["cal"] * factor
                    total_p   += p["p"]   * factor
                    total_c   += p["c"]   * factor
                    total_f   += p["f"]   * factor

            instructions_json = json.dumps(r["instructions"], ensure_ascii=False)

            # Check if recipe exists
            db_recipe = db.query(Recipe).filter(Recipe.name == r["name"]).first()
            
            if db_recipe:
                db_recipe.category = r["category"]
                db_recipe.prep_time = r["prep_time"]
                db_recipe.servings = r["servings"]
                db_recipe.total_calories = round(total_cal)
                db_recipe.protein = round(total_p)
                db_recipe.carbs = round(total_c)
                db_recipe.fats = round(total_f)
                db_recipe.image_url = r["image_url"]
                db_recipe.instructions = instructions_json
                
                # Clear existing ingredients
                db.query(Ingredient).filter(Ingredient.recipe_id == db_recipe.id).delete()
            else:
                db_recipe = Recipe(
                    name=r["name"],
                    category=r["category"],
                    prep_time=r["prep_time"],
                    servings=r["servings"],
                    total_calories=round(total_cal),
                    protein=round(total_p),
                    carbs=round(total_c),
                    fats=round(total_f),
                    image_url=r["image_url"],
                    instructions=instructions_json
                )
                db.add(db_recipe)
                db.flush() # Get ID

            # Insert ingredients
            for ing_name, amount in r["ingredients"]:
                new_ing = Ingredient(
                    recipe_id=db_recipe.id,
                    product_name=ing_name,
                    amount_grams=amount
                )
                db.add(new_ing)

        db.commit()
        print("Done! Database updated successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()