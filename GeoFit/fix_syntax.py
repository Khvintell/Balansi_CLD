import os
import re

def fix_imports(directory):
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Fix the double closing brace in react-native import
                # Original: } , Platform } from 'react-native'
                # Fixed: , Platform } from 'react-native'
                if '} , Platform }' in content:
                    new_content = content.replace('} , Platform }', ', Platform }')
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Fixed syntax in: {path}")

fix_imports('c:/Users/Beka/Desktop/GeoFitApp/GeoFit')
