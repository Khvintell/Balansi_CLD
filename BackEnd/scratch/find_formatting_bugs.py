import os
import re

def find_suspicious_formatting(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.py'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    
                    # Look for f-strings with suspicious colons
                    f_strings = re.findall(r'f["\'](.*?)\{.*?\}.*?["\']', content)
                    for fs in f_strings:
                        if ':' in fs:
                            # Check what's after the colon
                            pass
                    
                    # Look for % formatting
                    percent_matches = re.findall(r'["\'].*?%[^0-9a-zA-Z\s"\'].*?["\']', content)
                    if percent_matches:
                        print(f"Suspicious percent in {path}: {percent_matches}")

                    # Look for .format()
                    format_matches = re.findall(r'["\'].*?\{.*?\}.*?["\']\.format\(', content)
                    if format_matches:
                        pass

if __name__ == "__main__":
    find_suspicious_formatting('BackEnd')
