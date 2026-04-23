from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import google.generativeai as genai
import json
import re
from core.config import settings

router = APIRouter(tags=["biometrics"])

# Configure Gemini
genai.configure(api_key=settings.GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

class BiometricData(BaseModel):
    sleep_duration_minutes: int
    active_energy_burned: float
    step_count: int
    workouts: List[str]

class UserProfileData(BaseModel):
    base_tdee: int
    base_macros: dict # {"protein": int, "carbs": int, "fats": int}

class BiometricsSyncRequest(BaseModel):
    biometrics: BiometricData
    profile: UserProfileData

def extract_json(ai_text: str):
    try:
        match = re.search(r'\{.*\}', ai_text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
    except:
        return None
    return None

@router.post("/api/bio-engine-sync")
async def bio_engine_sync(request: BiometricsSyncRequest):
    bio = request.biometrics
    profile = request.profile
    
    # ─── Physiology Filters ───────────────────────────────────────────────────
    target_calories = profile.base_tdee
    macros = profile.base_macros.copy()
    
    # Defensive programming: ensure keys exist to prevent 500 KeyError crash
    macros.setdefault("protein", 120)
    macros.setdefault("carbs", 200)
    macros.setdefault("fats", 60)
    
    # Rule 1: Sleep Deprivation (< 5 hours)
    is_sleep_deprived = bio.sleep_duration_minutes < 300
    if is_sleep_deprived:
        # Reduce heavy fats, increase complex carbs for sustained energy.
        macros["carbs"] = int(macros["carbs"] * 1.15)
        macros["fats"] = int(macros["fats"] * 0.85)
    
    # Rule 2: Intense Workout Detected (High calorie burn or >30m workouts)
    heavy_activity = bio.active_energy_burned > 400 or len(bio.workouts) > 0
    if heavy_activity:
        # Add 70% of burned calories to TDEE
        target_calories += int(bio.active_energy_burned * 0.7)
        # Spike post-workout protein (increase by ~20%)
        macros["protein"] = int(macros["protein"] * 1.20)
    
    # ─── Alert Logic (Exception-Based UX) ─────────────────────────────────────
    # Set to true ONLY IF macros were changed by >10% or if critical biometric deviations
    # (e.g., severe sleep deprivation < 300m or massive calorie burn > 600kcal) are detected.
    protein_change = abs(macros["protein"] - profile.base_macros.get("protein", macros["protein"])) / (profile.base_macros.get("protein", 1) or 1)
    carbs_change = abs(macros["carbs"] - profile.base_macros.get("carbs", macros["carbs"])) / (profile.base_macros.get("carbs", 1) or 1)
    
    is_critical_deviation = is_sleep_deprived or bio.active_energy_burned > 600
    is_macro_change_high = protein_change > 0.1 or carbs_change > 0.1
    
    requires_alert = is_critical_deviation or is_macro_change_high
    
    # ─── Gemini Integration ───────────────────────────────────────────────────
    system_prompt = f"""
    You are the Balansi AI Bio-Engine. Analyze this biometric data: {bio.model_dump_json()}
    Compare it to the user's base TDEE: {profile.base_tdee}.
    
    Current automatic adjustments made by the engine:
    - Target Calories: {target_calories}
    - Macros: {macros}
    - Requires Alert: {requires_alert}
    
    Return a strictly formatted JSON. 
    The "message" field MUST be written entirely in natural, empathetic human-like GEORGIAN language. 
    Explain how their specific biometrics (e.g., lack of sleep or intense workout) specifically altered their macros today.
    DO NOT output any English text in the message field.
    
    JSON format:
    {{
      "requires_alert": {str(requires_alert).lower()},
      "target_calories": {target_calories},
      "adjusted_macros": {{ "protein": {macros["protein"]}, "carbs": {macros["carbs"]}, "fats": {macros["fats"]} }},
      "message": "ტექსტი ქართულად..."
    }}
    """
    
    print(f"[BioEngine] Triggering AI sync for {bio.step_count} steps...")
    
    try:
        response = model.generate_content(
            system_prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json"
            )
        )
        # Use json.loads directly since we specified response_mime_type
        ai_result = json.loads(response.text)
        
        final_calories = ai_result.get("target_calories", target_calories)
        final_macros = ai_result.get("adjusted_macros", macros)
        final_message = ai_result.get("message", "თქვენი დღიური ნორმა განახლებულია ბიომეტრიული მონაცემების საფუძველზე.")
        final_alert = ai_result.get("requires_alert", requires_alert)
        
    except Exception as e:
        import traceback
        error_msg = traceback.format_exc()
        print(f"!!! BioEngine Critical Error: {str(e)}")
        print(error_msg)
        
        # Fallback logic
        final_macros = macros
        final_message = "თქვენი დღიური ნორმა დაკორექტირებულია."
        final_alert = requires_alert

    return {
        "success": True,
        "requires_alert": final_alert,
        "target_calories": final_calories,
        "adjusted_macros": final_macros,
        "message": final_message
    }

