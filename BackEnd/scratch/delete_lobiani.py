import sqlite3

def delete_lobiani():
    conn = sqlite3.connect('recipes.db')
    cur = conn.cursor()
    
    # Find all variants
    cur.execute("SELECT id, name FROM recipes WHERE name LIKE '%ლობიანი%'")
    matches = cur.fetchall()
    
    if not matches:
        print("No recipes found with 'ლობიანი' in the name.")
    else:
        for rid, name in matches:
            print(f"Deleting recipe: {name} (ID: {rid})")
            cur.execute("DELETE FROM recipes WHERE id = ?", (rid,))
            # Ingredients will be deleted by Cascade if configured correctly in SQL, 
            # but let's be safe.
            cur.execute("DELETE FROM ingredients WHERE recipe_id = ?", (rid,))
            
        conn.commit()
        print("Done.")
        
    conn.close()

if __name__ == "__main__":
    delete_lobiani()
