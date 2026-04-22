from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from db.database import get_db
from db.models import Recipe
from schemas.recipes import RecipeSchema

router = APIRouter(prefix="/recipes", tags=["recipes"])

@router.get("/", response_model=List[RecipeSchema])
def get_all_recipes(db: Session = Depends(get_db)):
    try:
        recipes = db.query(Recipe).all()
        return recipes
    except Exception as e:
        print(f"Database Error: {e}")
        return []

@router.get("/{recipe_id}", response_model=RecipeSchema)
def get_single_recipe(recipe_id: int, db: Session = Depends(get_db)):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
            
    return recipe
