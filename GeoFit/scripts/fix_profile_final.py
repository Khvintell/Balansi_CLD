import sys
import re

filepath = r'c:\Users\Beka\Desktop\GeoFitApp\GeoFit\app\(tabs)\profile.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

# Fix ProfileScreen variable names
text = text.replace('const S = React.useMemo(() => getStyles(C), [C]);', 'const styles = React.useMemo(() => getStyles(C), [C]);')

# Now 'styles' is available. 

# One more thing: I might have broken the return of getStyles(C).
# Let's ensure getStyles is defined correctly.
# It should be 'const getStyles = (C: any) => StyleSheet.create({...});'

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)
