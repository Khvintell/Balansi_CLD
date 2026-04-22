import sys
import re

filepath = r'c:\Users\Beka\Desktop\GeoFitApp\GeoFit\app\details\[id].tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add Imports
if 'useThemeStore' not in text:
    text = text.replace(
        "import { Stack, useLocalSearchParams, useRouter } from 'expo-router';",
        "import { Stack, useLocalSearchParams, useRouter } from 'expo-router';\nimport { useThemeStore } from '../../store/useThemeStore';\nimport { getColors } from '../../config/theme';"
    )

# 2. Extract and remove old static DS = { ... }
text = re.sub(r'const DS = \{.*?\};', '', text, flags=re.DOTALL)

# 3. Convert helper components to take props
text = text.replace('const BrandAlert = ({ state, onClose }: { state: BAlertState; onClose: () => void }) => {', 'const BrandAlert = ({ state, onClose, DS, AL }: { state: BAlertState; onClose: () => void; DS: any; AL: any }) => {')
text = text.replace('const MacroCard = ({ label, value, unit, color, glow, Icon, pct }: any) => {', 'const MacroCard = ({ label, value, unit, color, glow, Icon, pct, MC, DS }: any) => {')
text = text.replace('const StepCard = ({ step, text, delay }: { step: number; text: string; delay: number }) => {', 'const StepCard = ({ step, text, delay, ST, DS }: { step: number; text: string; delay: number; ST: any; DS: any }) => {')
text = text.replace('const IngRow = ({ name, amount, idx, isLast }: any) => {', 'const IngRow = ({ name, amount, idx, isLast, IR, DS }: any) => {')

# 4. Convert Styles to generator functions
text = text.replace('const AL = StyleSheet.create({', 'const getALStyles = (DS: any) => StyleSheet.create({')
text = text.replace('const MC = StyleSheet.create({', 'const getMCStyles = (DS: any) => StyleSheet.create({')
text = text.replace('const ST = StyleSheet.create({', 'const getSTStyles = (DS: any) => StyleSheet.create({')
text = text.replace('const IR = StyleSheet.create({', 'const getIRStyles = (DS: any) => StyleSheet.create({')
text = text.replace('const S = StyleSheet.create({', 'const getSStyles = (DS: any, IMG_H: number, SW: number) => StyleSheet.create({')

# 5. Injection point in RecipeDetailsScreen
comp_start = "export default function RecipeDetailsScreen() {"
injection = """export default function RecipeDetailsScreen() {
  const { themeId } = useThemeStore();
  const DS = React.useMemo(() => getColors(themeId), [themeId]);
  const AL = React.useMemo(() => getALStyles(DS), [DS]);
  const MC = React.useMemo(() => getMCStyles(DS), [DS]);
  const ST = React.useMemo(() => getSTStyles(DS), [DS]);
  const IR = React.useMemo(() => getIRStyles(DS), [DS]);
  const S = React.useMemo(() => getSStyles(DS, IMG_H, SW), [DS]);
"""
text = text.replace(comp_start, injection)

# 6. Fix internal helper calls
text = text.replace('<BrandAlert state={alertS} onClose={closeAlert} />', '<BrandAlert state={alertS} onClose={closeAlert} DS={DS} AL={AL} />')
text = text.replace('<MacroCard ', '<MacroCard MC={MC} DS={DS} ')
text = text.replace('<StepCard ', '<StepCard ST={ST} DS={DS} ')
text = text.replace('<IngRow ', '<IngRow IR={IR} DS={DS} ')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)
