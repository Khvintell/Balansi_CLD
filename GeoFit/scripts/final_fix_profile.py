import sys
import re

filepath = r'c:\Users\Beka\Desktop\GeoFitApp\GeoFit\app\(tabs)\profile.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update StreakDots to take C and S
text = text.replace('const StreakDots = ({ loginDates = [], streak = 0 }: any) => {', 'const StreakDots = ({ loginDates = [], streak = 0, C, S }: any) => {')
text = text.replace('<StreakDots loginDates={profile.loginDates} streak={profile.streak} />', '<StreakDots loginDates={profile.loginDates} streak={profile.streak} C={C} S={S} />')

# 2. Update all static StyleSheets into generators
# We have:
# - PW (Paywall)
# - styles (Modal/FAQ)
# - S (Main screen) - already a generator I think? Let's check.
# Actually I'll just find all StyleSheet.create and wrap them.

# First, fix the PW refs
text = text.replace('const PW = StyleSheet.create({', 'const getPwStyles = (C: any) => StyleSheet.create({')
# Then the styles refs
text = text.replace('const styles = StyleSheet.create({', 'const getMsStyles = (C: any, BOTTOM: number) => StyleSheet.create({')

# 3. Inside ProfileScreen, inject the calls
comp_start = "export default function ProfileScreen() {"
injection = """export default function ProfileScreen() {
  const { themeId } = useThemeStore();
  const C = React.useMemo(() => getColors(themeId), [themeId]);
  const S = React.useMemo(() => getStyles(C), [C]);
  const pw = React.useMemo(() => getPwStyles(C), [C]);
  const ms = React.useMemo(() => getMsStyles(C, BOTTOM), [C]);
"""
text = text.replace(comp_start, injection)

# 4. Global replacement of PW. -> pw. and styles. -> ms.
# This might match too much. I'll be safer.
text = text.replace('style={PW.', 'style={pw.')
text = text.replace('style={styles.', 'style={ms.')
text = text.replace('styles={PW}', 'styles={pw}') # If any

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)
