import os
import re

def fix_animations(directory):
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.expo' in dirs:
            dirs.remove('.expo')
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                if 'useNativeDriver: true' in content:
                    # Check if Platform is imported
                    if 'Platform' not in content:
                        # Add Platform to imports
                        content = content.replace("from 'react-native';", ", Platform } from 'react-native';")
                        content = content.replace("from \"react-native\";", ", Platform } from \"react-native\";")
                    
                    new_content = content.replace('useNativeDriver: true', "useNativeDriver: Platform.OS !== 'web'")
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Fixed: {path}")

fix_animations('c:/Users/Beka/Desktop/GeoFitApp/GeoFit')
