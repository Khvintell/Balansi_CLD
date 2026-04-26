import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { 
  CheckCircle, Leaf, Lock, Bell, Gift, 
  Share2, HelpCircle, Trash2, ChevronRight 
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface SettingsSectionProps {
  themeId: string;
  setTheme: (id: any) => void;
  isPro: boolean;
  notifEnabled: boolean;
  toggleNotifications: () => void;
  onPromoPress: () => void;
  onSharePress: () => void;
  onHelpPress: () => void;
  onResetPress: () => void;
  THEME_NAMES: any;
  C: any;
  S: any;
  router: any;
}

const SettingsRow = ({ icon: Icon, title, subtitle, color, bg, onPress, isSwitch, switchValue, onSwitchChange, isDestructive, S }: any) => (
  <TouchableOpacity 
    style={S.settingsRow} 
    onPress={onPress} 
    disabled={isSwitch} 
    activeOpacity={0.7}
  >
    <View style={[S.settingsIconWrap, { backgroundColor: bg }]}>
      <Icon size={18} color={color} />
    </View>
    <View style={{ flex: 1, marginLeft: 14 }}>
      <Text style={[S.settingsTitle, isDestructive && { color: '#EF4444' }]}>{title}</Text>
      {subtitle && <Text style={S.settingsSub}>{subtitle}</Text>}
    </View>
    {isSwitch ? (
      <Switch 
        value={switchValue} 
        onValueChange={onSwitchChange}
        trackColor={{ false: '#E2E8F0', true: '#10B981' }}
        thumbColor="#FFF"
      />
    ) : (
      <ChevronRight size={18} color="#94A3B8" />
    )}
  </TouchableOpacity>
);

export const SettingsSection = ({
  themeId,
  setTheme,
  isPro,
  notifEnabled,
  toggleNotifications,
  onPromoPress,
  onSharePress,
  onHelpPress,
  onResetPress,
  THEME_NAMES,
  C,
  S,
  router
}: SettingsSectionProps) => {
  return (
    <View style={{ gap: 20, marginBottom: 40 }}>
      <View>
        <Text style={S.sectionTitle}>🎨 აირჩიე შენი სტილი</Text>
        <View style={[S.settingsGroup, { marginTop: 12 }]}>
          {Object.keys(THEME_NAMES).map((tId: any, i: number) => {
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
                    {tOpts.isPremium && !isPro ? <Lock size={18} color={tOpts.iconColor} /> : <Leaf size={18} color={tOpts.iconColor} />}
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={S.settingsTitle}>{tOpts.name}</Text>
                    <Text style={S.settingsSub}>{tOpts.desc}</Text>
                  </View>
                  {tOpts.isPremium && !isPro && (
                    <View style={S.settingsBadge}><Text style={S.settingsBadgeText}>PRO</Text></View>
                  )}
                  {isActive && <CheckCircle size={20} color={C.primary} />}
                </TouchableOpacity>
                {i < Object.keys(THEME_NAMES).length - 1 && <View style={S.settingsDivider} />}
              </View>
            );
          })}
        </View>
      </View>

      <View>
        <Text style={S.sectionTitle}>⚙️ შენი პრეფერენციები</Text>
        <View style={[S.settingsGroup, { marginTop: 12 }]}>
          <SettingsRow icon={Bell} title="შეგახსენო ხოლმე? 🔔" subtitle="ყოველდღიური მეგობრული შეხსენება"
            color={C.blue} bg={C.blueLight} isSwitch switchValue={notifEnabled} onSwitchChange={toggleNotifications} S={S} />
          <View style={S.settingsDivider} />

          {!isPro && (
            <>
              <SettingsRow icon={Gift} title="საჩუქარი გაქვს? 🎁" subtitle="გააქტიურე პრომო კოდი"
                color={C.primaryDark} bg={C.primaryLight} onPress={onPromoPress} S={S} />
              <View style={S.settingsDivider} />
            </>
          )}

          <SettingsRow icon={Share2} title="მეგობრებსაც ვაჩვენოთ? ✨" subtitle="შენი პროგრესის გაზიარება"
            color={C.teal} bg={C.tealLight} onPress={onSharePress} S={S} />
          <View style={S.settingsDivider} />
          <SettingsRow icon={HelpCircle} title="კითხვები გაქვს? 💡" subtitle="FAQ და მხარდაჭერა"
            color={C.inkMid} bg={C.surfaceMid} onPress={onHelpPress} S={S} />
          <View style={S.settingsDivider} />
          <SettingsRow icon={Trash2} title="თავიდან დავიწყოთ? 🔄"
            color={C.red} bg={C.redLight} onPress={onResetPress} isDestructive S={S} />
        </View>
      </View>
    </View>
  );
};
