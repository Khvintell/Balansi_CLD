import sys
import re

filepath = r'c:\Users\Beka\Desktop\GeoFitApp\GeoFit\app\(tabs)\profile.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Wrap the camera styles (around 1370)
text = text.replace('const styles = StyleSheet.create({', 'const getMsStyles = (C: any, BOTTOM: number) => StyleSheet.create({')

# 2. Inside the component, ensure all are called.
# I will search for the beginning of the component and replace the setup block.
comp_setup = """  const { themeId } = useThemeStore();
  const C = React.useMemo(() => getColors(themeId), [themeId]);
  const styles = React.useMemo(() => getStyles(C), [C]);
  const pw = React.useMemo(() => getPwStyles(C), [C]);
  const ms = React.useMemo(() => getMsStyles(C, BOTTOM), [C]);
"""

# 3. Fix the static style blocks that escaped.
# Actually I'll just move the definitions of getMsStyles and getPwStyles above the component.

# I'll use a more comprehensive approach.
# find all 'const someStyles = StyleSheet.create({' and turn them into 'const getSomeStyles = (C: any) => StyleSheet.create({'

text = text.replace('const PW = StyleSheet.create({', 'const getPwStyles = (C: any) => StyleSheet.create({')
# Note: I might have duplicate 'const styles = StyleSheet.create'
# I'll replace the one that uses camera styles specifically.
text = text.replace('  cameraContainer: { flex: 1, backgroundColor: \'#000\' },', '  cameraContainer: { flex: 1, backgroundColor: \'#000\' },') # hint

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)
