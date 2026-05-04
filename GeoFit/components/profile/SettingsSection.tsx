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
  onThemePress: () => void;
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
  onThemePress,
  onResetPress,
  THEME_NAMES,
  C,
  S,
  router
}: SettingsSectionProps) => {
  return (
    <View style={{ gap: 20, marginBottom: 40 }}>
      <View>
        <Text style={S.sectionTitle}>პარამეტრები & მხარდაჭერა</Text>
        <View style={[S.settingsGroup, { marginTop: 12 }]}>
          <SettingsRow icon={Bell} title="შეტყობინებები" subtitle="ყოველდღიური შეხსენებები"
            color={C.blue} bg={C.blueLight} isSwitch switchValue={notifEnabled} onSwitchChange={toggleNotifications} S={S} />
          <View style={S.settingsDivider} />

          <SettingsRow 
            icon={Leaf} 
            title="სტილი" 
            subtitle="თემები და ვიზუალი"
            color={C.primaryDark} 
            bg={C.primaryLight} 
            onPress={onThemePress} 
            S={S} 
          />
          <View style={S.settingsDivider} />

          {!isPro && (
            <>
              <SettingsRow icon={Gift} title="პრომო კოდი" subtitle="ექსკლუზიური შეთავაზებები"
                color={C.gold} bg={C.goldLight} onPress={onPromoPress} S={S} />
              <View style={S.settingsDivider} />
            </>
          )}

          <SettingsRow icon={Share2} title="გაზიარება" subtitle="მოუყევი მეგობრებს Balansi-ზე"
            color={C.teal} bg={C.tealLight} onPress={onSharePress} S={S} />
          <View style={S.settingsDivider} />
          <SettingsRow icon={HelpCircle} title="დახმარება & FAQ" subtitle="კითხვები და მხარდაჭერა"
            color={C.inkMid} bg={C.surfaceMid} onPress={onHelpPress} S={S} />
          <View style={S.settingsDivider} />
          <SettingsRow icon={Trash2} title="მონაცემების წაშლა" subtitle="ყველა მონაცემის განულება"
            color={C.red} bg={C.redLight} onPress={onResetPress} isDestructive S={S} />
        </View>
      </View>
    </View>
  );
};
