import sys
import re

filepath = r'c:\Users\Beka\Desktop\GeoFitApp\GeoFit\app\(tabs)\scanner.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add Imports
if 'useThemeStore' not in text:
    text = text.replace(
        "import { useRouter, useFocusEffect } from 'expo-router';",
        "import { useRouter, useFocusEffect } from 'expo-router';\nimport { useThemeStore } from '../../store/useThemeStore';\nimport { getColors } from '../../config/theme';"
    )

# 2. Convert DS to getColors logic
text = re.sub(r'const DS = \{.*?\};', '', text, flags=re.DOTALL)

# 3. Convert Styles to generator functions
text = text.replace('const pw = StyleSheet.create({', 'const getPwStyles = (DS: any) => StyleSheet.create({')
text = text.replace('const styles = StyleSheet.create({', 'const getStyles = (DS: any) => StyleSheet.create({')

# 4. Injection point in ScannerScreen
comp_start = "export default function ScannerScreen() {"
injection = """export default function ScannerScreen() {
  const { themeId } = useThemeStore();
  const DS = React.useMemo(() => getColors(themeId), [themeId]);
  const styles = React.useMemo(() => getStyles(DS), [DS]);
  const pw = React.useMemo(() => getPwStyles(DS), [DS]);
"""
text = text.replace(comp_start, injection)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)
