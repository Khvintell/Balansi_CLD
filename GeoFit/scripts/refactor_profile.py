import sys

filepath = r'c:\Users\Beka\Desktop\GeoFitApp\GeoFit\app\(tabs)\profile.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Imports
if 'useThemeStore' not in content:
    content = content.replace(
        "import { useRouter, useFocusEffect } from 'expo-router';",
        "import { useRouter, useFocusEffect } from 'expo-router';\nimport { useThemeStore } from '../../store/useThemeStore';\nimport { getColors, THEME_NAMES, ThemeId } from '../../config/theme';"
    )

# 2. Extract and remove `const C = { ... };`
# We know `const C = {` starts around line 27 and ends at `  r_full: 100,\n  };\n`
import re
content = re.sub(r'const C = \{.*?r_full:\s*100,\s*\};\s*', '', content, flags=re.DOTALL)

# 3. Modify component start
component_start = "export default function ProfileScreen() {"
injection = """export default function ProfileScreen() {
  const { themeId, setTheme } = useThemeStore();
  const C = React.useMemo(() => getColors(themeId), [themeId]);
  const S = React.useMemo(() => getStyles(C), [C]);
  const pw = React.useMemo(() => getPwStyles(C), [C]);
"""
content = content.replace(component_start, injection)

# 4. Modify stylesheets
content = content.replace('const S = StyleSheet.create({', 'const getStyles = (C: any) => StyleSheet.create({')
content = content.replace('const pw = StyleSheet.create({', 'const getPwStyles = (C: any) => StyleSheet.create({')

# 5. Insert Theme Selector UI in the settings section
# Search for: <SettingsRow icon={Bell}  title="შეტყობინებები"
settings_ui = """
          <SectionHeader title="🎨 აპლიკაციის თემა" />
          <View style={S.settingsGroup}>
            {(Object.keys(THEME_NAMES) as ThemeId[]).map((tId, i) => {
              const tOpts = THEME_NAMES[tId];
              const isActive = themeId === tId;
              return (
                <View key={tId}>
                  <TouchableOpacity 
                    style={[S.settingsRow, isActive && { backgroundColor: C.surfaceMid }]} 
                    activeOpacity={0.7}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (tOpts.isPremium && !isPro) {
                        router.push('/paywall');
                        return;
                      }
                      setTheme(tId);
                    }}
                  >
                    <View style={[S.settingsIconWrap, { backgroundColor: tOpts.iconColor + '20' }]}>
                      {tOpts.isPremium && !isPro ? <Lock size={18} color={tOpts.iconColor} /> : <div/>} 
                      {/* Using view instead of div for react native icon */}
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={S.settingsTitle}>{tOpts.name}</Text>
                      <Text style={S.settingsSub}>{tOpts.desc}</Text>
                    </View>
                    {tOpts.isPremium && !isPro && (
                      <View style={S.settingsBadge}><Text style={S.settingsBadgeText}>PRO</Text></View>
                    )}
                    {isActive && <CheckCircle2 size={20} color={C.primary} />}
                  </TouchableOpacity>
                  {i < 2 && <View style={S.settingsDivider} />}
                </View>
              );
            })}
          </View>

          <SectionHeader title="⚙️ პარამეტრები" />
"""

# fix the view for the icon wrap
settings_ui = settings_ui.replace('<div/>', '<Leaf size={18} color={tOpts.iconColor} />')

content = content.replace('<SectionHeader title="⚙️ პარამეტრები" />', settings_ui)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

