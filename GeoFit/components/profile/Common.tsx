import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Lock } from 'lucide-react-native';

export const GlowDot = ({ color, size = 8 }: { color: string; size?: number }) => (
  <View style={{ 
    width: size, 
    height: size, 
    borderRadius: size / 2, 
    backgroundColor: color, 
    shadowColor: color, 
    shadowOpacity: 0.4, 
    shadowRadius: 4, 
    elevation: 2 
  }} />
);

export const SectionHeader = ({ title, action, onAction, S }: any) => (
  <View style={S.sectionHeader}>
    <Text style={S.sectionTitle}>{title}</Text>
    {action && (
      <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
        <Text style={S.sectionAction}>{action}</Text>
      </TouchableOpacity>
    )}
  </View>
);

export const AchievementCard = ({ icon: Icon, label, desc, color, bg, locked, S, C }: any) => (
  <View style={[S.badgeCard, locked && S.badgeCardLocked]}>
    <View style={[S.badgeIconWrap, { backgroundColor: locked ? C.surfaceMid : bg, borderColor: locked ? C.border : color + '40' }]}>
      {locked ? <Lock size={18} color={C.inkLight} /> : <Icon size={22} color={color} />}
    </View>
    <Text style={[S.badgeLabel, locked && { color: C.inkLight }]} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
    <Text style={[S.badgeDesc, locked && { color: C.inkFaint }]} numberOfLines={1}>{desc}</Text>
  </View>
);
