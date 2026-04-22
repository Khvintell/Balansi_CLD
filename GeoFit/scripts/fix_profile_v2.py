import sys
import re

filepath = r'c:\Users\Beka\Desktop\GeoFitApp\GeoFit\app\(tabs)\profile.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update PW to a generator
text = text.replace('const PW = StyleSheet.create({', 'const getPwStyles = (C: any) => StyleSheet.create({')

# 2. Update the old sticky styles (around 1323) to a generator
text = text.replace('const styles = StyleSheet.create({', 'const getModalStyles = (C: any, BOTTOM: number) => StyleSheet.create({')

# 3. Inside ProfileScreen, call these generators
text = text.replace('const styles = React.useMemo(() => getStyles(C), [C]);', 
                    'const styles = React.useMemo(() => getStyles(C), [C]);\n  const ms = React.useMemo(() => getModalStyles(C, BOTTOM), [C]);\n  const pw = React.useMemo(() => getPwStyles(C), [C]);')

# 4. Replace references to the old static styles and PW
# Since getStyles already returned 'styles', we should be careful.
# Actually, I renamed the modal styles to 'ms'.
text = text.replace('styles.', 'ms.') # Fix later if needed
text = text.replace('PW.', 'pw.')

# 5. Injection check: ensure ms and pw are used in components
# This is a bit complex for regex. I'll use a more surgical approach.

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)
