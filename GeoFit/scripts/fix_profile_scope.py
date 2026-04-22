import sys
import re

filepath = r'c:\Users\Beka\Desktop\GeoFitApp\GeoFit\app\(tabs)\profile.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

# I want to move `export default function ProfileScreen() { ... 3 consts` to ABOVE `const Shimmer =`
# Find where the component starts right now
comp_start = """export default function ProfileScreen() {
  const { themeId, setTheme } = useThemeStore();
  const C = React.useMemo(() => getColors(themeId), [themeId]);
  const S = React.useMemo(() => getStyles(C), [C]);
  const pw = React.useMemo(() => getPwStyles(C), [C]);"""

if comp_start in text:
    text = text.replace(comp_start, '')
    
    # Insert it right before `const Shimmer =`
    insert_point = 'const Shimmer ='
    text = text.replace(insert_point, comp_start + '\n  ' + insert_point)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)
