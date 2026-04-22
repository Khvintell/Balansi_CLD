from fastapi import APIRouter, File, UploadFile, Form, Depends, HTTPException
from sqlalchemy.orm import Session
import google.generativeai as genai
import io
import json
import re
from PIL import Image
from db.database import get_db
from db.models import Product
from core.config import settings

router = APIRouter(tags=["ai"])

genai.configure(api_key=settings.GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash')


def extract_json(ai_text: str):
    """ასუფთავებს AI-ს პასუხს და აბრუნებს JSON-ს"""
    try:
        match = re.search(r'\{.*\}', ai_text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
    except Exception as e:
        print(f"JSON Parsing Error: {e}")
    return None

@router.post("/verify-weight")
async def verify_weight(expected_weight: float = Form(...), file: UploadFile = File(...)):
    try:
        image_data = await file.read()
        img = Image.open(io.BytesIO(image_data))

        prompt = """
        Analyze this image. return ONLY JSON.
        Check if it's a REAL physical weight scale. 
        Read the number on the display.
        { "status": "REAL" or "FAKE" or "ERROR", "weight": float }
        """

        response = await model.generate_content_async([prompt, img])
        result = extract_json(response.text)

        if not result:
            return {"success": False, "message": "პასუხის დამუშავება ვერ მოხერხდა."}

        status = result.get("status")
        detected_weight = result.get("weight")

        if status == "FAKE":
            return {"success": True, "is_truth": False, "message": "გადაუღე ნამდვილ სასწორს ისე, რომ ფეხებიც ჩანდეს! 🤥"}
        
        if status == "ERROR" or detected_weight is None:
            return {"success": False, "message": "ციფრები ვერ გავარჩიე. 🧐 სცადე თავიდან!"}

        if abs(expected_weight - detected_weight) <= 0.5:
            return {"success": True, "is_truth": True, "detected_weight": detected_weight, "message": "✅ წონა დადასტურებულია!"}
        else:
            return {"success": True, "is_truth": False, "detected_weight": detected_weight, "message": f"სასწორზე {detected_weight} კგ-ს ვხედავ! 🤥"}

    except Exception as e:
        return {"success": False, "message": f"შეცდომა: {str(e)}"}

@router.post("/scan-fridge")
async def scan_fridge(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        products = db.query(Product.name).all()
        allowed_ingredients = [prod[0] for prod in products]

        image_data = await file.read()
        img = Image.open(io.BytesIO(image_data))

        prompt = f"""
        Return ONLY JSON. Map visible food to this list: {allowed_ingredients}.
        {{ "status": "success", "ingredients": ["item1", "item2"] }}
        """

        response = await model.generate_content_async([prompt, img])
        result = extract_json(response.text)

        if not result or "ingredients" not in result:
            return {"success": False, "message": "AI-მ ვერ იცნო პროდუქტები."}

        final_ingredients = [ing for ing in result["ingredients"] if ing in allowed_ingredients]
        return {"success": True, "ingredients": final_ingredients}

    except Exception as e:
        return {"success": False, "message": f"სერვერის ხარვეზი: {str(e)}"}

@router.post("/api/scan-food")
async def scan_food_macro(file: UploadFile = File(...)):
    try:
        image_data = await file.read()
        img = Image.open(io.BytesIO(image_data))

        prompt = """
        Identify food and estimate macros for the portion. Return ONLY JSON.
        {
            "name": "Georgian Name",
            "description": "Appetizing description in Georgian",
            "calories": int, "protein": int, "carbs": int, "fat": int
        }
        If no food, return {"error": "no_food"}
        """

        response = await model.generate_content_async([prompt, img])
        result = extract_json(response.text)

        if not result:
            return {"success": False, "message": "JSON ამოჭრა ვერ მოხერხდა."}
        
        if "error" in result:
            return {"success": False, "message": "საჭმელი ვერ ვიპოვე. 🧐"}

        return {"success": True, "data": result}
    except Exception as e:
        return {"success": False, "message": f"ხარვეზი: {str(e)}"}
        
@router.post("/api/ai/scan-meal")
async def scan_meal(image: UploadFile = File(...)):
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="ეს არ არის ფოტო.")

    SYSTEM_PROMPT = """
    შენ ხარ მკაცრი, მაგრამ სამართლიანი მიშლენის ვარსკვლავის მქონე შეფ-მზარეული და ნუტრიციოლოგი. 
    დახედე ამ კერძის ფოტოს. 
    დააბრუნე პასუხი **მხოლოდ და მხოლოდ** ვალიდური JSON ფორმატით:
    {
      "dish_name": "კერძის დასახელება ქართულად",
      "score": 8,
      "wow_detail": "ძალიან კონკრეტული დეტალი ვიზუალზე (მაგ: 'ხორცს იდეალური ოქროსფერი ქერქი აქვს')",
      "calories": 450,
      "protein": 30,
      "feedback": "მოკლე, გამამხნევებელი და პროფესიონალური კომენტარი"
    }
    """
    try:
        image_bytes = await image.read()
        pil_image = Image.open(io.BytesIO(image_bytes))
        
        response = await model.generate_content_async([SYSTEM_PROMPT, pil_image])
        clean_json_text = response.text.replace('```json', '').replace('```', '').strip()
        return json.loads(clean_json_text)
    except Exception as e:
        print(f"AI Error: {str(e)}")
        raise HTTPException(status_code=500, detail="AI სკანირების ერორი.")
