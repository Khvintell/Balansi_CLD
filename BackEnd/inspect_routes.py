import requests
import json

try:
    response = requests.get("http://127.0.0.1:8000/openapi.json")
    if response.status_code == 200:
        data = response.json()
        paths = data.get("paths", {}).keys()
        print("Registered Paths:")
        for path in paths:
            print(f"  {path}")
    else:
        print(f"Failed to fetch openapi.json: {response.status_code}")
except Exception as e:
    print(f"Error: {e}")
