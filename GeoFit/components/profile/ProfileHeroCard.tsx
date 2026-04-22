import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Image } from 'expo-image';
import { 
  Star, Crown, Flame, CheckCircle2, AlertCircle, 
  Share2, User, Activity, Target, BarChart2 
} from 'lucide-react-native';
import AvatarHead from '../avatar/AvatarHead';

interface ProfileHeroCardProps {
  profile: any;
  isPro: boolean;
  level: number;
  totalXP: number;
  bmiInfo: any;
  heroScale: Animated.Value;
  C: any;
  S: any;
  onAvatarPress: () => void;
  onSharePress: () => void;
}

const StatChip = ({ icon: Icon, value, label, color, bg, S }: any) => (
  <View style={S.statChip}>
    <View style={[S.statChipIcon, { backgroundColor: bg }]}><Icon size={14} color={color} /></View>
    <View style={{ flexShrink: 1 }}>
      <Text style={S.statChipVal} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={S.statChipLabel} numberOfLines={1}>{label}</Text>
    </View>
  </View>
);

export const ProfileHeroCard = ({
  profile,
  isPro,
  level,
  totalXP,
  bmiInfo,
  heroScale,
  C,
  S,
  onAvatarPress,
  onSharePress
}: ProfileHeroCardProps) => {
  return (
    <Animated.View style={[S.heroCard, { transform: [{ scale: heroScale }] }]}>
      <View style={[S.heroGlow, { top: -60, left: -40, backgroundColor: C.primary, opacity: 0.12 }]} />
      <View style={[S.heroGlow, { bottom: -40, right: -20, backgroundColor: C.blue, opacity: 0.08, width: 180, height: 180 }]} />

      <View style={S.heroTopRow}>
        <TouchableOpacity style={S.avatarWrap} onPress={onAvatarPress} activeOpacity={0.85}>
          <View style={S.avatarRing}>
            {isPro ? (
              <AvatarHead C={C} size={56} />
            ) : (
              <Text style={S.avatarEmoji}>{profile.avatar}</Text>
            )}
          </View>
          {isPro && <View style={S.avatarEditBadge}><Activity size={9} color="#FFF" /></View>}
        </TouchableOpacity>

        <View style={S.heroIdentity}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={S.heroName}>{profile.name}</Text>
            {isPro && (
              <View style={S.proBadgeRefined}>
                <Star size={10} color={C.proBg} fill={C.proBg} />
                <Text style={S.proBadgeTxtRefined}>PRO</Text>
              </View>
            )}
          </View>
          <View style={S.heroPillRow}>
            <View style={S.heroPillGreen}>
              <Crown size={9} color={C.primaryDark} />
              <Text style={S.heroPillText}>Level {level} ✨ {totalXP} XP</Text>
            </View>
            {(profile.streak || 0) > 0 && (
              <View style={S.heroPillOrange}>
                <Flame size={9} color={C.orange} />
                <Text style={[S.heroPillText, { color: C.orange }]}>{profile.streak}d</Text>
              </View>
            )}

            {profile.isVerified ? (
              <View style={S.heroPillBlue}>
                <CheckCircle2 size={9} color={C.blue} />
                <Text style={[S.heroPillText, { color: C.blue }]}>Verified</Text>
              </View>
            ) : (
              <View style={S.heroPillGray}>
                <AlertCircle size={9} color={C.inkMid} />
                <Text style={[S.heroPillText, { color: C.inkMid }]}>Unverified</Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity style={S.shareBtn} onPress={onSharePress} activeOpacity={0.8}>
          <Share2 size={16} color={C.primaryDark} />
        </TouchableOpacity>
      </View>

      <View style={S.heroDivider} />

      <View style={S.heroStatsRow}>
        <StatChip icon={User} value={`${profile.age}წ`} label="ასაკი" color={C.purple} bg={C.purpleLight} S={S} />
        <StatChip icon={Activity} value={`${profile.height}სმ`} label="სიმაღლე" color={C.blue} bg={C.blueLight} S={S} />
        <StatChip icon={Target} value={`${profile.targetWeight}კგ`} label="მიზანი" color={C.primaryDark} bg={C.primaryLight} S={S} />
        {profile.bmi && (
          <StatChip icon={BarChart2} value={profile.bmi} label={bmiInfo?.label || 'BMI'} color={bmiInfo?.color || C.inkLight} bg={C.surfaceMid} S={S} />
        )}
      </View>
    </Animated.View>
  );
};
