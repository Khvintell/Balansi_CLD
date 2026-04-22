import sys
import re

filepath = r'c:\Users\Beka\Desktop\GeoFitApp\GeoFit\app\(tabs)\profile.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Convert all static StyleSheet.create calls that use C into generators
# We have PW and the modal styles.

# Wrap PW
text = text.replace('const PW = StyleSheet.create({', 'const getPwStyles = (C: any) => StyleSheet.create({')

# Wrap the other styles (usually named 'styles' but outside the component)
# I will find the one after PW and wrap it.
text = text.replace('const styles = StyleSheet.create({', 'const getModalStyles = (C: any, BOTTOM: number) => StyleSheet.create({')

# 2. Inside the component, call them.
# I already have getStyles(C). I'll add the others.
comp_setup = """  const { themeId } = useThemeStore();
  const C = React.useMemo(() => getColors(themeId), [themeId]);
  const styles = React.useMemo(() => getStyles(C), [C]);
"""
new_setup = comp_setup + """  const pw = React.useMemo(() => getPwStyles(C), [C]);
  const ms = React.useMemo(() => getModalStyles(C, BOTTOM), [C]);
"""
# Note: BOTTOM is defined inside the component usually or as a constant. 
# Looking at the code, BOTTOM is Dimensions.get().height - ... or similar.
# Actually let's check where BOTTOM is defined.
if 'const BOTTOM =' in text:
    pass # it's there
else:
    # If not, it might be in an old refactor.
    pass

text = text.replace(comp_setup, new_setup)

# 3. Replace PW. with pw. and styles. with ms. in the JSX/Logic
# BUT only for the parts that use the MODAL/PAYWALL styles.
# This is hard. 

# Actually, a better way is to move ALL style definitions INTO getStyles(C) 
# and return one giant object { ...styles, ...pw, ...ms }.

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)
