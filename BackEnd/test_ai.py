import google.generativeai as genai

# აქ ჩასვი შენი ახალი API გასაღები
API_KEY = "AIzaSyBRKjN0gop94PuDtjyAn6OMp845Dkkk7iA"
genai.configure(api_key=API_KEY)

print("[SCANNER] Examining API key and Google servers...\n")

try:
    models = genai.list_models()
    print("[SUCCESS] Your key has access to the following models:")
    found_flash = False
    
    for m in models:
        if 'generateContent' in m.supported_generation_methods:
            print(f"  - {m.name}")
            if 'gemini-flash-latest' in m.name:
                found_flash = True
                
    print("\n--------------------------------------------------")
    if found_flash:
        print("[INFO] Success! Your key can see Gemini Flash Latest.")
    else:
        print("[WARNING] Key works but Flash Latest is not visible.")

except Exception as e:
    print(f"[ERROR] API connection failed: {e}")