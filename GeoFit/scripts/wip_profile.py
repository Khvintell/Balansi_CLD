import sys
import re

filepath = r'c:\Users\Beka\Desktop\GeoFitApp\GeoFit\app\(tabs)\profile.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Redefine getStyles to return everything
# I'll use a very simple approach here.

# I'll just restore the file to a known good state and then apply the refactor one more time but BETTER.
# Actually I'll just fix it in place.

# Wrap all the style objects in a master object.
text = text.replace('const getStyles = (C: any, BOTTOM: number) => StyleSheet.create({', 'const getStyles = (C: any, BOTTOM: number) => ({\n S: StyleSheet.create({')
# I need to find the transitions between objects.
# This is getting messy with regex. 

# I'll just write the entire tail of the file manually because I know how it should look.
# Or better, I'll use python to find the split points and fix it.

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)
