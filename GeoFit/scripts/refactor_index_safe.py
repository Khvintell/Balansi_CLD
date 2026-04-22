import sys
import re

filepath = r'c:\Users\Beka\Desktop\GeoFitApp\GeoFit\app\(tabs)\index.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add Imports if missing
if 'useThemeStore' not in text:
    text = text.replace(
        "import { useRouter, useFocusEffect } from 'expo-router';",
        "import { useRouter, useFocusEffect } from 'expo-router';\nimport { useThemeStore } from '../../store/useThemeStore';\nimport { getColors } from '../../config/theme';"
    )

# 2. Extract and remove the old static T = { ... }
# It usually starts with const T = { and ends with fs_xxl: 26,\n  };
text = re.sub(r'const T = \{.*?fs_xxl: 26,\s*\};\s*', '', text, flags=re.DOTALL)

# 3. Create generator functions for styles
text = text.replace('const styles = StyleSheet.create({', 'const getStyles = (T: any) => StyleSheet.create({')
text = text.replace('const pw = StyleSheet.create({', 'const getPwStyles = (T: any) => StyleSheet.create({')

# 4. Update Skeletons to take T and styles
text = text.replace('const SkeletonPulse = ({ style }: { style?: any }) => {', 'const SkeletonPulse = ({ style, T }: { style?: any, T: any }) => {')
text = text.replace('const GridCardSkeleton = () => (', 'const GridCardSkeleton = ({ T, styles }: any) => (')
text = text.replace('const TrendingCardSkeleton = () => (', 'const TrendingCardSkeleton = ({ T, styles }: any) => (')

# 5. Injection point
comp_start = "export default function HomeScreen() {"
injection = """export default function HomeScreen() {
  const { themeId } = useThemeStore();
  const C = React.useMemo(() => getColors(themeId), [themeId]);
  const T = React.useMemo(() => ({
    primary: C.primary, danger: C.red, success: C.primaryDark, warning: C.orange,
    dark: C.ink, mid: C.inkMid, light: C.inkLight,
    bg: C.bg, card: C.surface, border: C.border,
    proBg: C.proBg, proBox: C.proBox, gold: C.gold, goldLight: C.goldLight,
    fontFamily: (Platform.OS === 'ios' ? 'System' : 'sans-serif') as any,
    xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 25,
    r_sm: 12, r_md: 16, r_lg: 20, r_xl: 25,
    fs_xs: 11, fs_sm: 13, fs_md: 15, fs_lg: 17, fs_xl: 20, fs_xxl: 26,
  }), [C]);
  const styles = React.useMemo(() => getStyles(T), [T]);
  const pw = React.useMemo(() => getPwStyles(T), [T]);
"""
text = text.replace(comp_start, injection)

# 6. Fix internal skeleton usage
text = text.replace('<TrendingCardSkeleton key={i} />', '<TrendingCardSkeleton key={i} T={T} styles={styles} />')
text = text.replace('<GridCardSkeleton key={i} />', '<GridCardSkeleton key={i} T={T} styles={styles} />')
text = text.replace('<SkeletonPulse style={{ height: 18, width: 160 }} />', '<SkeletonPulse style={{ height: 18, width: 160 }} T={T} />')
text = text.replace('<SkeletonPulse style={{ height: 18, width: 120 }} />', '<SkeletonPulse style={{ height: 18, width: 120 }} T={T} />')
text = text.replace('<SkeletonPulse style={{ height: 130, borderRadius: T.r_lg, marginBottom: T.sm }} />', '<SkeletonPulse style={{ height: 130, borderRadius: T.r_lg, marginBottom: T.sm }} T={T} />')
text = text.replace('<SkeletonPulse style={{ height: 14, width: \'80%\', marginBottom: 6 }} />', '<SkeletonPulse style={{ height: 14, width: \'80%\', marginBottom: 6 }} T={T} />')
text = text.replace('<SkeletonPulse style={{ height: 11, width: \'50%\' }} />', '<SkeletonPulse style={{ height: 11, width: \'50%\' }} T={T} />')
text = text.replace('<SkeletonPulse style={{ height: 160, borderRadius: T.r_lg, marginBottom: T.sm }} />', '<SkeletonPulse style={{ height: 160, borderRadius: T.r_lg, marginBottom: T.sm }} T={T} />')
text = text.replace('<SkeletonPulse style={{ height: 16, width: \'75%\', marginBottom: 8 }} />', '<SkeletonPulse style={{ height: 16, width: \'75%\', marginBottom: 8 }} T={T} />')
text = text.replace('<SkeletonPulse style={{ height: 12, width: \'55%\' }} />', '<SkeletonPulse style={{ height: 12, width: \'55%\' }} T={T} />')
# One more for the Animated.View inside SkeletonPulse
text = text.replace('backgroundColor: T.border', 'backgroundColor: T.border') # it's the same but ensure its in scope

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)
