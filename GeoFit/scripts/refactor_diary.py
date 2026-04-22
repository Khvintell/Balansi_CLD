import sys
import re

filepath = r'c:\Users\Beka\Desktop\GeoFitApp\GeoFit\app\diary.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add Imports
if 'useThemeStore' not in text:
    text = text.replace(
        "import { useRouter, useFocusEffect } from 'expo-router';",
        "import { useRouter, useFocusEffect } from 'expo-router';\nimport { useThemeStore } from '../store/useThemeStore';\nimport { getColors } from '../config/theme';"
    )

# 2. Convert C to getColors logic
text = re.sub(r'const C = \{.*?\};', '', text, flags=re.DOTALL)

# 3. Convert Styles to generator functions
text = text.replace('const sh = StyleSheet.create({', 'const getShStyles = (C: any) => StyleSheet.create({')
text = text.replace('const D = StyleSheet.create({', 'const getDStyles = (C: any) => StyleSheet.create({')

# 4. Update SectionHdr to take sh
text = text.replace('const SectionHdr = ({ title, sub }: { title:string; sub?:string }) => (', 'const SectionHdr = ({ title, sub, sh }: { title:string; sub?:string; sh: any }) => (')

# 5. Injection point in DiaryScreen
comp_start = "export default function DiaryScreen() {"
injection = """export default function DiaryScreen() {
  const { themeId } = useThemeStore();
  const C = React.useMemo(() => getColors(themeId), [themeId]);
  const sh = React.useMemo(() => getShStyles(C), [C]);
  const D = React.useMemo(() => getDStyles(C), [C]);
"""
text = text.replace(comp_start, injection)

# 6. Fix internal SectionHdr usage
text = text.replace('<SectionHdr title=', '<SectionHdr sh={sh} title=')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)
