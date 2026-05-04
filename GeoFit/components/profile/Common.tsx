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
  <View style={[S.badgeCard, { 
    width: 110, 
    height: 145, 
    paddingVertical: 16, 
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'flex-start'
  }, locked && { borderColor: C.borderLight }]}>
    <View style={[S.badgeIconWrap, { 
      backgroundColor: locked ? C.surfaceMid : bg, 
      borderColor: locked ? C.border : color + '40',
      width: 54, height: 54, borderRadius: 18,
      marginBottom: 10,
      justifyContent: 'center',
      alignItems: 'center'
    }]}>
      <Icon size={24} color={locked ? C.inkFaint : color} />
      {locked && (
        <View style={{ 
          position: 'absolute', top: -3, right: -3, 
          backgroundColor: C.surface, borderRadius: 8, 
          padding: 2, borderWidth: 1, borderColor: C.border 
        }}>
          <Lock size={10} color={C.inkLight} />
        </View>
      )}
    </View>
    <View style={{ height: 40, justifyContent: 'center', width: '100%' }}>
      <Text style={[S.badgeLabel, { fontSize: 12, fontWeight: '800', textAlign: 'center', color: C.ink }]} 
        numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.9}>
        {label}
      </Text>
    </View>
    <View style={{ height: 15, width: '100%' }}>
      {locked && (
        <Text style={[S.badgeDesc, { fontSize: 9.5, color: C.inkLight, textAlign: 'center' }]} 
          numberOfLines={1} adjustsFontSizeToFit>
          ჩაკეტილია
        </Text>
      )}
    </View>
  </View>
);
