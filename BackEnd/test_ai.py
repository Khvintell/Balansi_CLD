import google.generativeai as genai

# აქ ჩასვი შენი ახალი API გასაღები
API_KEY = "AIzaSyB_D7_04y3lZMsfALTi3loESD--Z-1h9NU"
genai.configure(api_key=API_KEY)

print("🔍 ვამოწმებ შენს API გასაღებს და Google-ის სერვერებს...\n")

try:
    models = genai.list_models()
    print("✅ შენს გასაღებს აქვს წვდომა შემდეგ მოდელებზე:")
    found_flash = False
    
    for m in models:
        if 'generateContent' in m.supported_generation_methods:
            print(f"  - {m.name}")
            if 'gemini-1.5-flash' in m.name:
                found_flash = True
                
    print("\n--------------------------------------------------")
    if found_flash:
        print("🎉 გილოცავ! შენი გასაღები იდეალურია და Gemini 1.5 Flash-ს ხედავს! შეგიძლია main.py-ში ჩასვა.")
    else:
        print("⚠️ გასაღები მუშაობს, მაგრამ 1.5 Flash მოდელზე წვდომა არ აქვს (404 ერორის მიზეზი).")

except Exception as e:
    print(f"❌ ერორი API-სთან დაკავშირებისას: {e}")