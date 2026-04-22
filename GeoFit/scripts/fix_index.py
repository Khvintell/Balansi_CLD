import sys
import re

filepath = r'c:\Users\Beka\Desktop\GeoFitApp\GeoFit\app\(tabs)\index.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

comp_start_orig = "export default function HomeScreen() {"
if comp_start_orig in text:
    injection = """export default function HomeScreen() {
  const { themeId } = useThemeStore();
  const C = React.useMemo(() => getColors(themeId), [themeId]);
  const Object_T = {
    primary: C.primary, danger: C.red, success: C.primaryDark, warning: C.orange,
    dark: C.ink, mid: C.inkMid, light: C.inkLight,
    bg: C.bg, card: C.surface, border: C.border,
    proBg: C.proBg, proBox: C.proBox, gold: C.gold, goldLight: C.goldLight,
    fontFamily: 'System', // fallback
    xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 25,
    r_sm: 12, r_md: 16, r_lg: 20, r_xl: 25,
    fs_xs: 11, fs_sm: 13, fs_md: 15, fs_lg: 17, fs_xl: 20, fs_xxl: 26,
  };
  const T = React.useMemo(() => Object_T, [themeId]);
  const styles = React.useMemo(() => getStyles(T), [T]);
  const pw = React.useMemo(() => getPwStyles(T), [T]);"""
    
    text = text.replace(comp_start_orig, '')
    insert_point = 'const SkeletonPulse ='
    if insert_point in text:
        text = text.replace(insert_point, injection + '\n\n  ' + insert_point)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)
