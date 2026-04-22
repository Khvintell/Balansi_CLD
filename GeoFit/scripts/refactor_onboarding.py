import sys
import re

filepath = r'c:\Users\Beka\Desktop\GeoFitApp\GeoFit\app\onboarding.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add Imports
if 'useThemeStore' not in text:
    text = text.replace(
        "import { useRouter, useLocalSearchParams } from 'expo-router';",
        "import { useRouter, useLocalSearchParams } from 'expo-router';\nimport { useThemeStore } from '../store/useThemeStore';\nimport { getColors } from '../config/theme';"
    )

# 2. Convert C to getColors logic
text = re.sub(r'const C = \{.*?\};', '', text, flags=re.DOTALL)

# 3. Convert helper components to take props
text = text.replace('const MacroChip = ({ label, value, color, bg, delay }: any) => {', 'const MacroChip = ({ label, value, color, bg, delay, mr }: any) => {')

# 4. Convert Styles to generator functions
text = text.replace('const mr = StyleSheet.create({', 'const getMrStyles = (C: any) => StyleSheet.create({')
text = text.replace('const S = StyleSheet.create({', 'const getSStyles = (C: any, SH: number) => StyleSheet.create({')

# 5. Injection point in OnboardingScreen
comp_start = "export default function OnboardingScreen() {"
injection = """export default function OnboardingScreen() {
  const { themeId } = useThemeStore();
  const C = React.useMemo(() => getColors(themeId), [themeId]);
  const mr = React.useMemo(() => getMrStyles(C), [C]);
  const S = React.useMemo(() => getSStyles(C, SH), [C]);
"""
text = text.replace(comp_start, injection)

# 6. Fix internal helper calls
text = text.replace('<MacroChip ', '<MacroChip mr={mr} ')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)
