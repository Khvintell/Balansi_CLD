from pydantic import BaseModel, field_validator
from typing import List, Optional

class IngredientSchema(BaseModel):
    id: int
    recipe_id: int
    product_name: str
    amount_grams: float

    class Config:
        from_attributes = True

class RecipeSchema(BaseModel):
    id: int
    name: str
    category: Optional[str] = None
    prep_time: Optional[int] = None
    servings: Optional[int] = 1
    total_calories: Optional[int] = None
    protein: Optional[int] = None
    carbs: Optional[int] = None
    fats: Optional[int] = None
    image_url: Optional[str] = None
    instructions: Optional[str] = None
    ingredients: List[IngredientSchema] = []

    @field_validator("image_url", mode="after")
    @classmethod
    def format_image_url(cls, v: Optional[str]) -> Optional[str]:
        if v and not v.startswith(("http://", "https://", "assets/")):
            return f"assets/{v}"
        return v

    class Config:
        from_attributes = True
