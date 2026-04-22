import sys
import re

filepath = r'c:\Users\Beka\Desktop\GeoFitApp\GeoFit\app\(tabs)\profile.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Capture the content of PW and msStyle blocks
pw_match = re.search(r'const getPwStyles = \(C: any\) => StyleSheet\.create\(\{(.*?)\}\);', text, re.DOTALL)
ms_match = re.search(r'const getMsStyles = \(C: any, BOTTOM: number\) => StyleSheet\.create\(\{(.*?)\}\);', text, re.DOTALL)

pw_inner = pw_match.group(1) if pw_match else ""
ms_inner = ms_match.group(1) if ms_match else ""

# 2. Add them to the main getStyles generator
text = text.replace('const getStyles = (C: any) => StyleSheet.create({', f'const getStyles = (C: any, BOTTOM: number) => StyleSheet.create({{{pw_inner}\n{ms_inner}\n')

# 3. Clean up the old generators and component setup
text = re.sub(r'const getPwStyles = .*?\} \);', '', text, flags=re.DOTALL)
text = re.sub(r'const getMsStyles = .*?\} \);', '', text, flags=re.DOTALL)

text = text.replace('  const styles = React.useMemo(() => getStyles(C), [C]);\n  const ms = React.useMemo(() => getMsStyles(C, BOTTOM), [C]);\n  const pw = React.useMemo(() => getPwStyles(C), [C]);', 
                    '  const styles = React.useMemo(() => getStyles(C, BOTTOM), [C]);')

# 4. Global replacement of ms. and pw. back to styles. to match the original JSX
text = text.replace('ms.', 'styles.')
text = text.replace('pw.', 'styles.')
text = text.replace('PW.', 'styles.') # ensure total cleanup

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)
