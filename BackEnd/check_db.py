import sqlite3

def check_db():
    conn = sqlite3.connect('recipes.db')
    cursor = conn.cursor()
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    
    for t in tables:
        table_name = t[0]
        print(f"--- Table: {table_name} ---")
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = cursor.fetchall()
        for idx, col_name, col_type, _, _, _ in columns:
            print(f"Col: {col_name} ({col_type})")
            
    conn.close()

if __name__ == "__main__":
    check_db()
