import sys
import re

filepath = r'c:\Users\Beka\Desktop\GeoFitApp\GeoFit\app\(tabs)\fridge.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add Imports
if 'useThemeStore' not in text:
    text = text.replace(
        "import { useRouter, useFocusEffect } from 'expo-router';",
        "import { useRouter, useFocusEffect } from 'expo-router';\nimport { useThemeStore } from '../../store/useThemeStore';\nimport { getColors } from '../../config/theme';"
    )

# 2. Convert C to getColors logic
text = re.sub(r'const C = \{.*?\};', '', text, flags=re.DOTALL)

# 3. Convert Styles to generator functions
text = text.replace('const sp = StyleSheet.create({', 'const getSpStyles = (C: any) => StyleSheet.create({')
text = text.replace('const pw = StyleSheet.create({', 'const getPwStyles = (C: any) => StyleSheet.create({')
text = text.replace('const cam = StyleSheet.create({', 'const getCamStyles = (C: any) => StyleSheet.create({')
text = text.replace('const S = StyleSheet.create({', 'const getSStyles = (C: any) => StyleSheet.create({')
text = text.replace('const rc = StyleSheet.create({', 'const getRcStyles = (C: any) => StyleSheet.create({')

# 4. Update helper components outside FridgeScreen
text = text.replace('const MatchBar = ({ percent }: { percent:number }) => {', 'const MatchBar = ({ percent, C }: { percent:number, C: any }) => {')
text = text.replace('const StatPill = ({ icon:Icon, value, color, bg }: any) => (', 'const StatPill = ({ icon:Icon, value, color, bg }: any) => (')
text = text.replace('const SelectedPill = ({ name, onRemove }: any) => (', 'const SelectedPill = ({ name, onRemove, sp, C }: any) => (')

# 5. Fix internal SelectedPill components (this is tricky, might need prop passing)
text = text.replace('<SelectedPill key={i} name={ing} onRemove={()=>toggleIngredient(ing)}/>', '<SelectedPill key={i} name={ing} sp={sp} C={C} onRemove={()=>toggleIngredient(ing)}/>')
text = text.replace('<MatchBar percent={recipe.matchPercent}/>', '<MatchBar percent={recipe.matchPercent} C={C} />')
text = text.replace('StatPill icon={Clock}', 'StatPill icon={Clock}') # no change needed for StatPill as it takes raw colors

# 6. Injection point in FridgeScreen
comp_start = "export default function FridgeScreen() {"
injection = """export default function FridgeScreen() {
  const { themeId } = useThemeStore();
  const C = React.useMemo(() => getColors(themeId), [themeId]);
  const S = React.useMemo(() => getSStyles(C), [C]);
  const sp = React.useMemo(() => getSpStyles(C), [C]);
  const pw = React.useMemo(() => getPwStyles(C), [C]);
  const cam = React.useMemo(() => getCamStyles(C), [C]);
  const rc = React.useMemo(() => getRcStyles(C), [C]);
"""
text = text.replace(comp_start, injection)

# 7. INGREDIENTS_DATA uses C. We should move it inside if needed, or better, pass the C to it.
# Actually INGREDIENTS_DATA is used in ScrollView. Let's move it inside useMemo.
text = text.replace('const INGREDIENTS_DATA = [', 'const INGREDIENTS_DATA = (C: any) => [')
text = text.replace('{INGREDIENTS_DATA.map((section, idx)=>(', '{INGREDIENTS_DATA(C).map((section, idx)=>(')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)
