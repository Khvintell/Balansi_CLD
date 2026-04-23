import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  StyleSheet, Text, View, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, Dimensions, Platform,
  StatusBar, Modal, Animated, FlatList, RefreshControl, Pressable,
} from 'react-native';

let PagerView: any;
if (Platform.OS !== 'web') {
  try {
    PagerView = require('react-native-pager-view').default;
  } catch (e) {
    console.warn('PagerView could not be loaded');
  }
}
import Svg, {
  Defs, LinearGradient as SvgGradient, Stop, RadialGradient,
  Rect, Circle, Ellipse, Path, G, Line,
} from 'react-native-svg';
import {
  default as Reanimated,
  useSharedValue, useAnimatedStyle, withSpring,
  withRepeat, withTiming, Easing, interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter, useFocusEffect } from 'expo-router';
import { useThemeStore } from '../../store/useThemeStore';
import { useDiaryStore } from '../../store/useDiaryStore';
import { getColors } from '../../config/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Search, Flame, Clock, Zap, Star, Activity,
  Heart, PieChart, ArrowLeft, ChevronRight,
  Dumbbell, WifiOff, Database, RotateCcw, RefreshCw,
  AlertCircle, CheckCircle2, XCircle, Lock, Sparkles, Lightbulb,
  TrendingDown, Target,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { useAvatarStore } from '../../store/useAvatarStore';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = ['აღმოაჩინე', 'საუზმე', 'სადილი', 'ვახშამი', 'წახემსება', 'სოუსები', 'ფავორიტები'];
const SWIPE_CATEGORIES = ['საუზმე', 'სადილი', 'ვახშამი', 'წახემსება', 'სოუსები', 'ფავორიტები'];
const { width: SW } = Dimensions.get('window');
const TRENDING_TTL = 4 * 60 * 60 * 1000;
import { SERVER_URL } from '../../config/api';

const POD_WIDTH = Math.round(SW * 0.36);
const POD_HEIGHT = Math.round(POD_WIDTH * 1.78);

const TIPS = [
  "დილით 1 ჭიქა წყალი მეტაბოლიზმს 30%-ით აჩქარებს! 💧",
  "ნუ შეგეშინდება ცხიმების, ავოკადო შენი მეგობარია! 🥑",
  "ცილა გეხმარება კუნთის შენარჩუნებასა და წვაში. 🍳",
  "ვარჯიშის მერე ნახშირწყალი აუცილებელია აღსადგენად! 🍌",
  "ჭამამდე 30 წთ ადრე წყალი მადის კონტროლში გეხმარება. 🚰",
  "კუნთი იზრდება ძილში. დაისვენე სრულყოფილად! 💤",
  "კალორიები შეჭამე და არა დალიო (მოერიდე წვენებს). 🥤",
  "ნელა და კარგად დაღეჭვა მონელებას 50%-ით აუმჯობესებს. 🍽️",
  "დაიცავი 80/20 წესი: 80% ჯანსაღი, 20% საყვარელი. 🍕",
  "ფეხით სიარული ცხიმის წვის საუკეთესო მეთოდია. 🚶‍♂️",
  "ბოსტნეული და შვრია სისხლში შაქარს არეგულირებს. 🥦",
  "მოხარშვა ან გამოცხობა სჯობს შეწვას! 🍲",
  "ორაგული ტვინისა და გულის საუკეთესო მცველია. 🐟",
  "ფერადი ბოსტნეული სხვადასხვა ვიტამინს ნიშნავს! 🌈",
  "მწვანე ჩაი უჯრედებს დაბერებისგან იცავს. 🍵",
  "წაიკითხე ეტიკეტი — მოერიდე ფარულ შაქრებს! 🔍",
  "მცირე ულუფები ნივთიერებათა ცვლას აჩქარებს. ⏳",
  "მუქი მწვანე ბოსტნეული კალციუმის წყაროა. 🥬",
  "ივახშმე დაძინებამდე 2-3 საათით ადრე. 🌙",
  "შაქრის ნაცვლად გამოიყენე სტევია ან თაფლი. 🍯",
  "მარილი ზომიერად! ჭარბი ნატრიუმი სითხეს აკავებს. 🧂",
  "ცილოვანი საუზმე შაქრის მოთხოვნილებას ამცირებს. 🥚",
  "თხილეული იდეალური წახემსებაა პორციების კონტროლით. 🥜",
  "კეფირი და მაწონი ნაწლავებისთვის მეგობარია. 🦠",
  "რთული ნახშირწყლები ენერგიას სტაბილურად გაძლევს. 🍚",
  "ვარჯიშამდე 1 სთ ადრე ბანანი ენერგიას მოგცემს. 🍌",
  "შავი შოკოლადი სტრესს ამცირებს და გულისთვის კარგია. 🍫",
  "მზის შუქი D ვიტამინისა და განწყობის წყაროა. ☀️",
  "ხილი სჯობს წვენს, რადგან ბოჭკოს შეიცავს. 🍎",
  "სტრესის დროს ჭამას მოერიდე, ის მონელებას აუარესებს. 🧘‍♀️",
  "ყავა კარგია, მაგრამ შუადღის მერე შეზღუდე. ☕",
  "სხეული ცხიმს თანაბრად კარგავს, არა ლოკალურად! 📉",
  "შიმშილი ხშირად წყურვილია. ჯერ წყალი დალიე. 💦",
  "ზეითუნის ზეთი იდეალურია სალათებისთვის. 🫒",
  "წონის კლება არ არის სწორხაზოვანი პროცესი. 📊",
  "ჭამისას გამორთე ტელეფონი — შეიგრძენი სიმაძღრე! 📱🚫",
  "ლობიო და ოსპი ცილის იაფი და კარგი წყაროა. 🫘",
  "დიეტური პროდუქტები ხშირად შაქრით სავსეა! 🛑",
  "სითხით კიტრი და საზამთროც გამარაგებს. 🍉",
  "თუ სულ გშია, ცილა და ჯანსაღი ცხიმი გაკლია! 🥑",
  "ძვლებისთვის K2 და D3 ვიტამინებიც საჭიროა. 🦴",
  "დეჰიდრატაცია იწვევს დაღლილობას. სვი წყალი! 💧",
  "ალკოჰოლი ცხიმის წვის პროცესს დროებით აჩერებს. 🍷",
  "მოამზადე საკვები თავად, მოერიდე ნახევარფაბრიკატებს! 🍔🚫",
  "კალორიების მკვეთრი შეზღუდვა მეტაბოლიზმს ანელებს. ⚖️",
  "ცილას ყველაზე მაღალი თერმული ეფექტი აქვს! 🥩",
  "კენკროვანები ტვინის 'სუპერფუდია'. 🫐",
  "გაყინული ბოსტნეული ისეთივე სასარგებლოა. ❄️",
  "კურკუმა და დარიჩინი ანთების საწინააღმდეგოა. 🌶️",
  "იზრუნე სხეულზე სიყვარულით და არა აკრძალვებით! ❤️",
  "ანანასი ცილების მონელებაში გეხმარება. 🍍",
  "შავი ყავა ნამდვილი ბოსების ენერგიაა! ☕️🖤",
  "კვერცხის გულში ვიტამინების 90%-ია. 🍳",
  "დილით ვაშლი ყავაზე უკეთ გაფხიზლებს. 🍏",
  "პატარა თეფში ტვინს ატყუებს, რომ ბევრი ჭამე. 🍽️🧠",
  "უძილობა შიმშილის ჰორმონს ზრდის. იძინე! 😴",
  "ჩია თავის წონაზე 10-ჯერ მეტ წყალს იწოვს. 💧🫐",
  "ზღვის და სუფრის მარილი თითქმის იდენტურია. 🌊🧂",
  "ნამდვილი თაფლი არასდროს ფუჭდება! 🍯",
  "სოკო მზეზე D ვიტამინს თავისით გამოიმუშავებს. 🍄☀️",
  "წითელ ბულგარულში 3-ჯერ მეტი C ვიტამინია! 🫑💥",
  "დარიჩინი ტვინს უშაქროდ ატყუებს სიტკბოთი. 🍂",
  "პოპკორნი 100%-ით მთელმარცვლოვანია! 🍿",
  "გრეიფრუტი მედიკამენტების მოქმედებას ცვლის. 🍊💊",
  "ჭარხლის წვენი საუკეთესო ბუნებრივი პრევორქაუთია! 🔴🏃‍♂️",
  "ფისტა ნამდვილი 'გამხდარი თხილია'. 🥜",
  "კანიანი კივი 50%-ით მეტ ბოჭკოს შეიცავს! 🥝",
  "სოიოს მარცვლები ცხრავე შეუცვლელ ამინომჟავას შეიცავს! 🫛💪",
  "15 წუთი სიცილი 40 კალორიას წვავს! 😂🔥",
  "ყოველდღიური ფუსფუსი მეტაბოლიზმს ყველაზე მეტად აჩქარებს. 🚶‍♀️🧹",
  "გრილი შხაპი ცხიმის წვას ააქტიურებს! 🚿❄️",
  "ცხარე საკვები მეტაბოლიზმს აჩქარებს! 🌶️🔥",
  "სტრესი მუცელზე ცხიმს აგროვებს. დაისვენე! 🧘‍♂️",
  "დიეტის დასაწყისში დაკლებული წონა უბრალოდ წყალია! 💧📉",
  "კრეატინი ყველაზე უსაფრთხო და შესწავლილი დანამატია! ⚡️",
  "ვარჯიშამდე სტატიკური გაწელვა ძალას გაკარგვინებს! 🤸‍♂️",
  "ნიორი დაჭყლეტიდან 10 წუთში უფრო სასარგებლოა. 🧄",
  "ბატატი ენერგიას სტაბილურად გაძლევს! 🍠",
  "საზამთრო საუკეთესო საზაფხულო ჰიდრატაციაა! 🍉💧",
  "სატაცური იდეალურია შეშუპების ჩასაცხრობად. 🎋",
  "ორგანიზმი ნუშის კალორიების 20%-ს ვერ ითვისებს! 🌰",
  "ლიმონიანი წყლის მერე ეგრევე ნუ გაიხეხავ! 🍋🪥",
  "უშაქრო გაზიანი წყალიც იდეალურად ატენიანებს! 🫧💦",
  "პიტნის სურნელი შიმშილს დროებით აქრობს. 🌿",
  "ნუ ებრძვი ცდუნებას, უბრალოდ ნუ იყიდი ტკბილეულს! 🍪🚫",
  "ჯანსაღი მუცელი = ბედნიერ ტვინს! 🦠🧠",
  "მშიერზე კევის ღეჭვას მოერიდე! 🍬",
  "ლოკალურად ცხიმის წვა არ არსებობს! 🍕📉",
  "მეტი კუნთი მეტ კალორიას წვავს დასვენებისას! 💪🛋️",
  "დისციპლინა ყოველთვის სჯობს მოტივაციას! 📈",
  "სხეული მანქანაა, ნუ ჩაასხამ ცუდ საწვავს! 🏎️🔥",
  "შიმშილიდან 12 საათში უჯრედები სუფთავდება! 🧬",
  "HIIT ვარჯიშის შემდეგ ცხიმის წვა გრძელდება! 🔥",
  "კუნთი 3-ჯერ მეტ კალორიას მოიხმარს! 💪",
  "ცარიელ კუჭზე ყავა სტრესის ჰორმონს ზრდის! ☕🍳",
  "კეტჩუპში ხშირად შოკოლადზე მეტი შაქარია! 🍅📉",
  "მედიტაცია მუცელზე ცხიმის კლებას უწყობს ხელს. 🧘‍♂️",
  "ვაშლის ძმარი სისხლში შაქარს არეგულირებს! 🍏",
  "ცივი წყლის დალევა დამატებით კალორიებს წვავს! 🧊💧",
  "ცილას ყველაზე მაღალი თერმული ეფექტი აქვს! 🥩",
  "კენკროვანები ტვინის 'სუპერფუდია'. 🫐",
  "გაყინული ბოსტნეული ისეთივე სასარგებლოა. ❄️",
  "კურკუმა და დარიჩინი ანთების საწინააღმდეგოა. 🌶️",
  "იზრუნე სხეულზე სიყვარულით და არა აკრძალვებით! ❤️",
  "ანანასი ცილების მონელებაში გეხმარება. 🍍",
  "შავი ყავა ნამდვილი ბოსების ენერგიაა! ☕️🖤",
  "კვერცხის გულში ვიტამინების 90%-ია. 🍳",
  "დილით ვაშლი ყავაზე უკეთ გაფხიზლებს. 🍏",
  "პატარა თეფში ტვინს ატყუებს, რომ ბევრი ჭამე. 🍽️🧠",
  "უძილობა შიმშილის ჰორმონს ზრდის. იძინე! 😴",
  "ჩია თავის წონაზე 10-ჯერ მეტ წყალს იწოვს. 💧🫐",
];

const getImageUrl = (url: string, baseUrl: string) => {
  if (!url) return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800';
  if (url.startsWith('http')) return encodeURI(decodeURI(url));
  let cleanPath = url.replace(/^\/+/, '');
  if (!cleanPath.startsWith('assets/')) cleanPath = `assets/${cleanPath}`;
  return `${baseUrl}/${encodeURI(decodeURI(cleanPath))}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// 🎯 PREMIUM HEADER
// ─────────────────────────────────────────────────────────────────────────────
const SimpleHeader = React.memo(({ userName, T }: { userName: string; T: any }) => (
  <View style={headerStyles.container}>
    <Text style={[headerStyles.name, { color: T.dark }]}>გამარჯობა, {userName || 'ბექა'}! 👋</Text>
    <Text style={[headerStyles.sub, { color: T.mid }]}>რას მოვამზადებთ დღეს?</Text>
  </View>
));

const headerStyles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  name: { fontSize: 28, fontWeight: '900', letterSpacing: -0.7 },
  sub: { fontSize: 15, fontWeight: '600', opacity: 0.55, marginTop: 4 },
});

// ─────────────────────────────────────────────────────────────────────────────
// 💎 HERO STATS ROW — კომპაქტური, ბალანსირებული side-by-side cards
// ─────────────────────────────────────────────────────────────────────────────
const HeroStatsRow = React.memo(({ consumed, target, tip, C, T, onTipPress, onCaloriePress }: {
  consumed: number; target: number; tip: string; C: any; T: any;
  onTipPress: () => void; onCaloriePress: () => void;
}) => {
  const remaining = Math.max(target - consumed, 0);
  const progress = target > 0 ? Math.min(consumed / target, 1) : 0;
  const percentage = Math.round(progress * 100);
  const isOver = consumed > target;

  const progressColor = useMemo(() => {
    if (isOver) return '#EF4444';
    if (progress > 0.85) return '#F59E0B';
    return C.primary;
  }, [progress, isOver, C.primary]);

  // ანიმაცია რჩევის შეცვლისას
  const tipFade = useRef(new Animated.Value(1)).current;
  const tipRef = useRef(tip);
  useEffect(() => {
    if (tipRef.current !== tip) {
      tipFade.setValue(0);
      Animated.timing(tipFade, { toValue: 1, duration: 280, useNativeDriver: true }).start();
      tipRef.current = tip;
    }
  }, [tip]);

  return (
    <View style={heroStyles.row}>
      {/* ── CALORIE CARD ── */}
      <Pressable
        style={({ pressed }) => [
          heroStyles.card,
          { backgroundColor: T.card, opacity: pressed ? 0.92 : 1 },
        ]}
        onPress={onCaloriePress}
      >
        <View style={heroStyles.cardHeader}>
          <View style={[heroStyles.iconCircle, { backgroundColor: progressColor + '18' }]}>
            <Flame size={14} color={progressColor} />
          </View>
          <Text style={[heroStyles.cardLabel, { color: T.mid }]}>დარჩენილია</Text>
        </View>

        <View style={heroStyles.valueRow}>
          <Text style={[heroStyles.bigValue, { color: T.dark }]}>
            {isOver ? '0' : remaining.toLocaleString()}
          </Text>
          <Text style={[heroStyles.valueUnit, { color: T.mid }]}>კკალ</Text>
        </View>

        <Text style={[heroStyles.subInfo, { color: T.light }]}>
          {consumed} / {target}
        </Text>

        <View style={heroStyles.progressBlock}>
          <View style={[heroStyles.progressTrack, { backgroundColor: T.border }]}>
            <View
              style={[
                heroStyles.progressFill,
                { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: progressColor },
              ]}
            />
          </View>
          <Text style={[heroStyles.percentInline, { color: progressColor }]}>{percentage}%</Text>
        </View>
      </Pressable>

      {/* ── TIP CARD ── */}
      <Pressable
        style={({ pressed }) => [
          heroStyles.card,
          { backgroundColor: T.card, opacity: pressed ? 0.92 : 1 },
        ]}
        onPress={onTipPress}
      >
        <View style={heroStyles.cardHeader}>
          <View style={[heroStyles.iconCircle, { backgroundColor: '#FFB80018' }]}>
            <Lightbulb size={14} color="#FFB800" />
          </View>
          <Text style={[heroStyles.cardLabel, { color: T.mid }]}>დღის რჩევა</Text>
        </View>

        <Animated.View style={[heroStyles.tipBody, { opacity: tipFade }]}>
          <Text style={[heroStyles.tipText, { color: T.dark }]}>
            {tip}
          </Text>
        </Animated.View>
      </Pressable>
    </View>
  );
});

const heroStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginVertical: 12,
    alignItems: 'stretch',
  },
  card: {
    flex: 1,
    padding: 14,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    flex: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 2,
  },
  bigValue: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 32,
  },
  valueUnit: {
    fontSize: 12,
    fontWeight: '700',
  },
  subInfo: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 10,
  },
  progressBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 'auto',
  },
  progressTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  percentInline: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.2,
    minWidth: 32,
    textAlign: 'right',
  },
  tipBody: {
    flex: 1,
    justifyContent: 'center',
  },
  tipText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
});

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonPulse = ({ style, T }: { style?: any; T: any }) => {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[{ backgroundColor: T.border, borderRadius: T.r_md }, style, { opacity: anim }]} />;
};
const GridCardSkeleton = ({ T, styles }: any) => (
  <View style={[styles.gridCard, { overflow: 'visible' }]}>
    <SkeletonPulse style={{ height: 130, borderRadius: T.r_lg, marginBottom: T.sm }} T={T} />
    <SkeletonPulse style={{ height: 14, width: '80%', marginBottom: 6 }} T={T} />
    <SkeletonPulse style={{ height: 11, width: '50%' }} T={T} />
  </View>
);
const TrendingCardSkeleton = ({ T, styles }: any) => (
  <View style={[styles.trendingCard, { overflow: 'visible' }]}>
    <SkeletonPulse style={{ height: 160, borderRadius: T.r_lg, marginBottom: T.sm }} T={T} />
    <SkeletonPulse style={{ height: 16, width: '75%', marginBottom: 8 }} T={T} />
    <SkeletonPulse style={{ height: 12, width: '55%' }} T={T} />
  </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { themeId } = useThemeStore();
  const C = useMemo(() => getColors(themeId), [themeId]);
  const T = useMemo(() => ({
    primary: C.primary, danger: C.red, success: C.primaryDark, warning: C.orange,
    dark: C.ink, mid: C.inkMid, light: C.inkLight,
    bg: C.bg, card: C.surface, border: C.border,
    fontFamily: (Platform.OS === 'ios' ? 'System' : 'sans-serif') as any,
    xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 25,
    r_sm: 12, r_md: 16, r_lg: 20, r_xl: 25,
    fs_xs: 11, fs_sm: 13, fs_md: 15, fs_lg: 17, fs_xl: 20, fs_xxl: 26,
  }), [C]);
  const styles = useMemo(() => getStyles(T), [T]);

  const router = useRouter();
  const { intake } = useDiaryStore();
  const { computeMood } = useAvatarStore();

  const [recipes, setRecipes] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('აღმოაჩინე');
  const [searchQuery, setSearchQuery] = useState('');
  const [dbStatus, setDbStatus] = useState<'loading' | 'ok' | 'empty' | 'error'>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');
  const [userGoal, setUserGoal] = useState('lose');
  const [targetCalories, setTargetCalories] = useState(2000);
  const [currentTip, setCurrentTip] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [quickRecipes, setQuickRecipes] = useState<any[]>([]);

  const [trendingRecipes, setTrendingRecipes] = useState<any[]>([]);
  const [goalBasedRecipes, setGoalBasedRecipes] = useState<any[]>([]);
  const [highProteinRecipes, setHighProteinRecipes] = useState<any[]>([]);
  const [viewAllSection, setViewAllSection] = useState<{ title: string; data: any[] } | null>(null);
  const [brandAlert, setBrandAlert] = useState({ visible: false, title: '', message: '', type: 'error' });
  const [tabHeights, setTabHeights] = useState<{ [k: string]: number }>({});

  const heartScales = useRef<{ [id: string]: Animated.Value }>({}).current;
  const getHeartScale = (id: string) => { if (!heartScales[id]) heartScales[id] = new Animated.Value(1); return heartScales[id]; };
  const scrollY = useRef(new Animated.Value(0)).current;
  const categoryScrollRef = useRef<ScrollView>(null);
  const pagerRef = useRef<PagerView>(null);
  const mainScrollRef = useRef<any>(null);
  const headerOpacity = scrollY.interpolate({ inputRange: [0, 80, 150], outputRange: [1, 0.5, 0], extrapolate: 'clamp' });

  useEffect(() => { computeMood(intake?.calories || 0, targetCalories || 2000, 0, 8); }, [intake, targetCalories]);

  useFocusEffect(useCallback(() => {
    loadDataSafely();
    useAvatarStore.getState().computeTimeState();
  }, []));

  const loadDataSafely = async (isPullRefresh = false) => {
    if (!isPullRefresh) setDbStatus('loading');
    try {
      let pGoal = 'lose', pTarget = 2000, pName = '';
      try {
        const ps = await AsyncStorage.getItem('userProfile');
        if (ps) {
          const p = JSON.parse(ps);
          pName = p.name || '';
          pGoal = p.goal || 'lose';
          pTarget = p.targetCalories > 0 ? p.targetCalories : 2000;
          useAvatarStore.getState().refreshAll(p);
        } else {
          router.replace('/onboarding');
          return;
        }
      } catch {
        router.replace('/onboarding');
        return;
      }
      setUserName(pName);
      setUserGoal(pGoal);
      setTargetCalories(pTarget);

      try { const f = await AsyncStorage.getItem('favoriteRecipes'); setFavorites(f ? JSON.parse(f) : []); } catch { }
      let list: any[] = [];
      try {
        const c = await AsyncStorage.getItem('cachedRecipes');
        if (c) list = JSON.parse(c).map((r: any) => ({ ...r, image_url: getImageUrl(r.image_url, SERVER_URL) }));
      } catch { }
      try {
        const res = await fetch(`${SERVER_URL}/recipes/`);
        if (res.ok) {
          const data = await res.json();
          const fresh = Array.isArray(data) ? data : (data?.recipes || []);
          if (fresh.length > 0) {
            const p = fresh.map((r: any) => ({ ...r, image_url: getImageUrl(r.image_url, SERVER_URL) }));
            list = p;
            AsyncStorage.setItem('cachedRecipes', JSON.stringify(p));
          }
        } else if (list.length === 0) { setDbStatus('error'); return; }
      } catch { if (list.length === 0) { setDbStatus('error'); return; } }
      if (list.length === 0) { setDbStatus('empty'); return; }
      setDbStatus('ok'); setRecipes(list);
      if (!currentTip) setCurrentTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
      let t: any[] = [];

      try {
        const s = await AsyncStorage.getItem('trendingData');
        if (s) { const td = JSON.parse(s); if (Date.now() - td.timestamp < TRENDING_TTL) t = list.filter((r: any) => td.ids.includes(r.id)); }
      } catch { }
      if (t.length < 5) {
        t = [...list].sort(() => 0.5 - Math.random()).slice(0, 6);
        AsyncStorage.setItem('trendingData', JSON.stringify({ timestamp: Date.now(), ids: t.map((r: any) => r.id) }));
      }
      setTrendingRecipes(t);
      setQuickRecipes(list.filter((r: any) => (r.prep_time || 0) <= 15));
      setHighProteinRecipes([...list].sort((a, b) => (b.protein || 0) - (a.protein || 0)).slice(0, 6));
      if (pGoal === 'lose') setGoalBasedRecipes(list.filter((r: any) => (r.total_calories || 0) <= 350));
      else if (pGoal === 'gain') setGoalBasedRecipes(list.filter((r: any) => (r.total_calories || 0) >= 500));
      else setGoalBasedRecipes(list.filter((r: any) => { const c = r.total_calories || 0; return c > 350 && c < 500; }));
    } catch { setDbStatus('error'); }
  };

  const onPullRefresh = async () => { setRefreshing(true); await loadDataSafely(true); setRefreshing(false); };

  const toggleFavorite = async (recipeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const scale = getHeartScale(recipeId);
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.4, useNativeDriver: true, speed: 50, bounciness: 20 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }),
    ]).start();
    try {
      const updated = favorites.includes(recipeId) ? favorites.filter(id => id !== recipeId) : [...favorites, recipeId];
      setFavorites(updated);
      await AsyncStorage.setItem('favoriteRecipes', JSON.stringify(updated));
      if (!favorites.includes(recipeId)) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setBrandAlert({ visible: true, title: 'Error', message: 'Failed to update favorites.', type: 'error' });
    }
  };

  // ── კატეგორიის Pill-ზე ხელის დაჭერა ──────────────────────────────────────
  const handleCategoryPress = useCallback((cat: string) => {
    Haptics.selectionAsync();
    setActiveCategory(cat);
    setSearchQuery('');
    mainScrollRef.current?.scrollTo?.({ y: 0, animated: true });
    const catIdx = CATEGORIES.indexOf(cat);
    requestAnimationFrame(() => {
      categoryScrollRef.current?.scrollTo({ x: Math.max(0, catIdx * 80 - 50), animated: true });
      if (cat !== 'აღმოაჩინე') {
        const si = SWIPE_CATEGORIES.indexOf(cat);
        if (si !== -1) pagerRef.current?.setPage(si);
      }
    });
  }, []);

  // ── PagerView-ის გვერდების შეცვლა (swipe ან setPage) ──────────────────────
  // Swipe-ის დროს ავტომატურად ზემოთ ასქროლვა, რომ მომხმარებელი დაიწყოს ახალი
  // კატეგორიის დათვალიერება თავიდან.
  const handlePageSelected = useCallback((e: any) => {
    const idx = e.nativeEvent.position;
    const newCat = SWIPE_CATEGORIES[idx];
    if (newCat && newCat !== activeCategory) {
      Haptics.selectionAsync();
      setActiveCategory(newCat);

      // ავტომატური scroll-up swipe-ზე
      mainScrollRef.current?.scrollTo?.({ y: 0, animated: true });

      categoryScrollRef.current?.scrollTo({
        x: Math.max(0, CATEGORIES.indexOf(newCat) * 80 - 50),
        animated: true,
      });
    }
  }, [activeCategory]);

  const getFilteredData = useCallback((cat: string) => {
    let r = recipes;
    if (cat === 'ფავორიტები') r = r.filter(x => favorites.includes(x.id?.toString() || x.name));
    else if (cat !== 'აღმოაჩინე') r = r.filter(x => x.category === cat);
    if (searchQuery.trim()) r = r.filter(x => x?.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    return r;
  }, [recipes, favorites, searchQuery]);

  const todayStr = new Date().toISOString().split('T')[0];
  const safeTarget = targetCalories > 0 ? targetCalories : 2000;
  const safeConsumed = Math.round(intake[todayStr]?.calories || 0);

  const goalTitle = userGoal === 'lose' ? "ულტრა-მსუბუქი (< 350 კკალ)"
    : userGoal === 'gain' ? "პროტებომბები (> 500 კკალ)" : "ოქროს შუალედი";
  const GoalIcon = userGoal === 'gain' ? Activity : Star;
  const goalColor = userGoal === 'lose' ? T.primary : userGoal === 'gain' ? T.danger : T.success;

  const SectionHeader = ({ title, icon: Icon, color, data }: any) => (
    <View style={styles.sectionHeader}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Icon size={22} color={color} style={{ marginRight: T.sm }} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {data?.length > 0 && (
        <TouchableOpacity
          onPress={() => { Haptics.selectionAsync(); setViewAllSection({ title, data }); }}
          activeOpacity={0.7}
        >
          <Text style={styles.seeAllText}>ნახვა</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderGridCard = useCallback((recipe: any, idx: number) => {
    if (!recipe) return null;
    const rId = recipe.id?.toString() || recipe.name;
    const isFav = favorites.includes(rId);
    const scale = getHeartScale(rId);
    return (
      <TouchableOpacity
        key={idx}
        style={styles.gridCard}
        activeOpacity={0.85}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/details/${recipe.id}`); }}
      >
        <Image
          source={{ uri: recipe.image_url || 'https://via.placeholder.com/150' }}
          style={styles.gridImg}
          contentFit="cover"
          transition={250}
          placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
        />
        <TouchableOpacity style={styles.heartBtnGrid} onPress={() => toggleFavorite(rId)} activeOpacity={0.8}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <Heart size={18} color={isFav ? T.danger : '#FFF'} fill={isFav ? T.danger : 'rgba(0,0,0,0.3)'} />
          </Animated.View>
        </TouchableOpacity>
        <View style={styles.gridInfo}>
          <Text style={styles.gridName} numberOfLines={2}>{recipe.name}</Text>
          <View style={styles.gridMetaRow}>
            <View style={styles.metaBadge}>
              <Clock size={10} color={T.mid} />
              <Text style={styles.gridMetaText}> {recipe.prep_time || 0}წთ</Text>
            </View>
            <View style={[styles.metaBadge, { backgroundColor: 'rgba(255,71,87,0.1)' }]}>
              <Flame size={10} color={T.danger} />
              <Text style={[styles.gridMetaText, { color: T.danger }]}> {recipe.total_calories || 0}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [favorites]);

  // ── Category Grid — უკეთესი height measurement scroll-ისთვის ───────────────
  const renderCategoryGrid = useCallback((catName: string) => {
    const data = getFilteredData(catName);

    if (data.length === 0) {
      return (
        <View
          key={catName}
          onLayout={(e) => {
            const h = Math.round(e.nativeEvent.layout.height);
            if (h > 100 && Math.abs((tabHeights[catName] || 0) - h) > 20) {
              setTabHeights(prev => ({ ...prev, [catName]: h }));
            }
          }}
          style={styles.emptyState}
        >
          <View style={styles.emptyIconWrap}><Search size={36} color={T.light} /></View>
          <Text style={styles.emptyTitle}>
            {catName === 'ფავორიტები' ? 'ჯერ ფავორიტი არ გაქვს' : 'რეცეპტი ვერ მოიძებნა'}
          </Text>
          <Text style={styles.emptySub}>
            {catName === 'ფავორიტები' ? 'დააჭირე ❤️ ღილაკს, რომ შეინახო.' : 'ამ კატეგორიაში ჯერ არაფერი გვაქვს.'}
          </Text>
        </View>
      );
    }

    // ზუსტი height გამოთვლა: 2 სვეტი, card height ~ 210 (image 130 + info ~60 + margin)
    const rowCount = Math.ceil(data.length / 2);
    const estimatedHeight = rowCount * 210 + 40;

    return (
      <View
        key={catName}
        onLayout={(e) => {
          const h = Math.round(e.nativeEvent.layout.height);
          if (h > 100 && Math.abs((tabHeights[catName] || 0) - h) > 20) {
            setTabHeights(prev => ({ ...prev, [catName]: h }));
          }
        }}
        style={{ minHeight: estimatedHeight }}
      >
        <FlatList
          data={data}
          keyExtractor={(item, i) => item.id?.toString() || i.toString()}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: T.xl }}
          contentContainerStyle={{ paddingTop: T.md, paddingBottom: 40 }}
          renderItem={({ item, index }) => renderGridCard(item, index)}
          scrollEnabled={false}
          removeClippedSubviews={false}
        />
      </View>
    );
  }, [getFilteredData, renderGridCard, T, tabHeights]);

  const renderDiscoverContent = () => {
    if (dbStatus === 'loading') return (
      <View style={{ paddingTop: 15, paddingHorizontal: T.xl }}>
        <View style={styles.sectionHeader}><SkeletonPulse style={{ height: 18, width: 160 }} T={T} /></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
          {[0, 1, 2].map(i => <TrendingCardSkeleton key={i} T={T} styles={styles} />)}
        </ScrollView>
        <View style={styles.sectionHeader}><SkeletonPulse style={{ height: 18, width: 120 }} T={T} /></View>
        <View style={styles.gridContainer}>{[0, 1, 2, 3].map(i => <GridCardSkeleton key={i} T={T} styles={styles} />)}</View>
      </View>
    );
    return (
      <View style={{ paddingTop: 15, paddingBottom: 40 }}>
        <SectionHeader title="ტრენდული (რჩეული)" icon={Flame} color={T.danger} data={trendingRecipes} />
        {trendingRecipes.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} decelerationRate="fast" contentContainerStyle={styles.carouselContainer}>
            {trendingRecipes.map((recipe, idx) => {
              if (!recipe) return null;
              const rId = recipe.id?.toString();
              const isFav = favorites.includes(rId);
              const scale = getHeartScale(rId);
              return (
                <TouchableOpacity
                  key={idx}
                  style={styles.trendingCard}
                  activeOpacity={0.88}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/details/${recipe.id}`); }}
                >
                  <Image
                    source={{ uri: recipe.image_url }}
                    style={styles.trendingImg}
                    contentFit="cover"
                    transition={250}
                    placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
                  />
                  <TouchableOpacity style={styles.heartBtn} onPress={() => toggleFavorite(rId)} activeOpacity={0.8}>
                    <Animated.View style={{ transform: [{ scale }] }}>
                      <Heart size={20} color={isFav ? T.danger : '#FFF'} fill={isFav ? T.danger : 'rgba(0,0,0,0.3)'} />
                    </Animated.View>
                  </TouchableOpacity>
                  <View style={styles.trendingInfo}>
                    <Text style={styles.trendingName} numberOfLines={2}>{recipe.name}</Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaTextSmall}><Clock size={12} color={T.mid} /> {recipe.prep_time || 0} წთ</Text>
                      <Text style={styles.metaTextSmall}><Flame size={12} color={T.danger} /> {recipe.total_calories || 0} კკალ</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
        <SectionHeader title="პროტეინის ბომბები" icon={Dumbbell} color={T.success} data={highProteinRecipes} />
        {highProteinRecipes.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} decelerationRate="fast" contentContainerStyle={styles.carouselContainer}>
            {highProteinRecipes.map((r, idx) => !r ? null : (
              <TouchableOpacity
                key={idx}
                style={styles.proteinCard}
                activeOpacity={0.88}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/details/${r.id}`); }}
              >
                <Image source={{ uri: r.image_url }} style={styles.proteinImg} contentFit="cover" transition={250} placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }} />
                <View style={styles.proteinBadge}><Text style={styles.proteinBadgeText}>{r.protein || Math.round((r.total_calories || 0) * 0.08)}გ ცილა</Text></View>
                <View style={styles.proteinInfo}><Text style={styles.proteinName} numberOfLines={1}>{r.name}</Text></View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        <SectionHeader title="სწრაფი 15 წუთში" icon={Zap} color={T.warning} data={quickRecipes} />
        {quickRecipes.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} decelerationRate="fast" contentContainerStyle={styles.carouselContainer}>
            {quickRecipes.map((r, idx) => !r ? null : (
              <TouchableOpacity
                key={idx}
                style={styles.quickCard}
                activeOpacity={0.88}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/details/${r.id}`); }}
              >
                <Image source={{ uri: r.image_url }} style={styles.quickImg} contentFit="cover" transition={250} placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }} />
                <View style={styles.quickInfo}>
                  <Text style={styles.quickName} numberOfLines={2}>{r.name}</Text>
                  <Text style={styles.quickTime}>{r.prep_time || 0} წუთი</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        <SectionHeader title={goalTitle} icon={GoalIcon} color={goalColor} data={goalBasedRecipes} />
        {goalBasedRecipes.length > 0 && (
          <View style={styles.verticalListContainer}>
            {goalBasedRecipes.slice(0, 5).map((r, idx) => !r ? null : (
              <TouchableOpacity
                key={idx}
                style={styles.verticalCard}
                activeOpacity={0.88}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/details/${r.id}`); }}
              >
                <Image source={{ uri: r.image_url }} style={styles.verticalImg} contentFit="cover" transition={250} placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }} />
                <View style={styles.verticalInfo}>
                  <Text style={styles.verticalName} numberOfLines={2}>{r.name}</Text>
                  <View style={styles.verticalMeta}><Text style={styles.verticalCals}>{r.total_calories || 0} კკალ</Text></View>
                </View>
                <ChevronRight size={20} color={T.light} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderStatusScreen = () => {
    if (dbStatus === 'error') return (
      <View style={styles.brandedStateContainer}>
        <View style={[styles.stateIconBg, { backgroundColor: 'rgba(255,71,87,0.1)' }]}><WifiOff size={55} color={T.danger} /></View>
        <Text style={styles.stateTitle}>კავშირის ერორი 📡</Text>
        <Text style={styles.stateSub}>სერვერთან დაკავშირება ვერ მოხერხდა.</Text>
        <TouchableOpacity
          style={[styles.brandedRetryBtn, { backgroundColor: T.danger }]}
          onPress={() => loadDataSafely()}
          activeOpacity={0.8}
        >
          <RotateCcw size={18} color="#FFF" style={{ marginRight: T.sm }} />
          <Text style={styles.brandedRetryText}>თავიდან ცდა</Text>
        </TouchableOpacity>
      </View>
    );
    if (dbStatus === 'empty') return (
      <View style={styles.brandedStateContainer}>
        <View style={[styles.stateIconBg, { backgroundColor: 'rgba(255,165,2,0.1)' }]}><Database size={55} color={T.warning} /></View>
        <Text style={styles.stateTitle}>ბაზა ცარიელია 🍽️</Text>
        <Text style={styles.stateSub}>გაუშვით "python seed.py" ტერმინალში.</Text>
        <TouchableOpacity
          style={[styles.brandedRetryBtn, { backgroundColor: T.warning }]}
          onPress={() => loadDataSafely()}
          activeOpacity={0.8}
        >
          <RefreshCw size={18} color="#FFF" style={{ marginRight: T.sm }} />
          <Text style={styles.brandedRetryText}>ბაზის შემოწმება</Text>
        </TouchableOpacity>
      </View>
    );
    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.ScrollView
        ref={mainScrollRef}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        stickyHeaderIndices={[1]}
        contentContainerStyle={{
          paddingBottom: Platform.OS === 'ios' ? 120 : 100,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onPullRefresh}
            tintColor={T.primary}
            colors={[T.primary]}
          />
        }
      >
        {/* INDEX 0 — Hero */}
        <Animated.View style={{ opacity: headerOpacity, overflow: 'hidden' }}>
          {!viewAllSection && <SimpleHeader userName={userName} T={T} />}
          {!viewAllSection && (
            <HeroStatsRow
              consumed={safeConsumed}
              target={safeTarget}
              tip={currentTip || TIPS[0]}
              C={C}
              T={T}
              onTipPress={() => {
                Haptics.selectionAsync();
                const next = TIPS[Math.floor(Math.random() * TIPS.length)];
                setCurrentTip(next);
              }}
              onCaloriePress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/diary'); }}
            />
          )}
        </Animated.View>

        {/* INDEX 1 — Sticky Search + Categories */}
        <View style={styles.stickySearchWrapper}>
          <View style={styles.searchContainer}>
            <Search size={20} color={T.light} style={{ marginRight: T.sm }} />
            <TextInput
              style={styles.searchInput}
              placeholder="მოძებნე რეცეპტი..."
              placeholderTextColor={T.light}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                if (text.length > 0 && activeCategory !== 'აღმოაჩინე') handleCategoryPress('აღმოაჩინე');
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                <XCircle size={18} color={T.light} />
              </TouchableOpacity>
            )}
          </View>
          <ScrollView
            ref={categoryScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScrollContent}
          >
            {CATEGORIES.map((cat, i) => {
              const isActive = activeCategory === cat;
              const isSpecial = cat === 'აღმოაჩინე';
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.categoryPill,
                    isActive && styles.categoryPillActive,
                    isSpecial && !isActive && styles.categoryPillSpecial,
                  ]}
                  onPress={() => handleCategoryPress(cat)}
                  activeOpacity={0.8}
                  hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
                >
                  {cat === 'ფავორიტები' && (
                    <Heart
                      size={13}
                      color={isActive ? '#FFF' : T.mid}
                      style={{ marginRight: 5 }}
                      fill={isActive ? '#FFF' : 'transparent'}
                    />
                  )}
                  {isSpecial && !isActive && (
                    <Zap size={13} color={T.primary} style={{ marginRight: 5 }} fill={T.primary} />
                  )}
                  <Text
                    style={[
                      styles.categoryPillText,
                      isActive && styles.categoryPillTextActive,
                      isSpecial && !isActive && { color: T.primary },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* INDEX 2 — Content */}
        <View style={styles.contentContainer}>
          {viewAllSection ? (
            <View style={{ paddingBottom: 40, paddingTop: 15 }}>
              <View style={styles.viewAllHeader}>
                <TouchableOpacity
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setViewAllSection(null); }}
                  style={styles.backBtn}
                  activeOpacity={0.7}
                >
                  <ArrowLeft size={20} color={T.dark} />
                </TouchableOpacity>
                <Text style={styles.viewAllTitle}>{viewAllSection.title}</Text>
              </View>
              <FlatList
                data={viewAllSection.data}
                keyExtractor={(item, i) => item.id?.toString() || i.toString()}
                numColumns={2}
                columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: T.xl }}
                contentContainerStyle={{ paddingBottom: 40 }}
                renderItem={({ item, index }) => renderGridCard(item, index)}
                scrollEnabled={false}
                removeClippedSubviews={false}
              />
            </View>
          ) : (dbStatus === 'error' || dbStatus === 'empty') ? (
            renderStatusScreen()
          ) : activeCategory === 'აღმოაჩინე' ? (
            searchQuery.trim() !== '' ? (
              <View style={{ paddingTop: 15 }}>
                <View style={{ paddingHorizontal: T.xl, marginBottom: T.md }}>
                  <Text style={styles.searchResultsLabel}>
                    "{searchQuery}" — {getFilteredData('აღმოაჩინე').length} რეცეპტი
                  </Text>
                </View>
                {renderCategoryGrid('აღმოაჩინე')}
              </View>
            ) : (
              renderDiscoverContent()
            )
          ) : Platform.OS === 'web' ? (
            <View style={styles.pagerPage}>
              {renderCategoryGrid(activeCategory)}
            </View>
          ) : (
            <PagerView
              ref={pagerRef}
              style={[
                styles.pagerView,
                { height: tabHeights[activeCategory] || Dimensions.get('window').height * 0.8 },
              ]}
              initialPage={SWIPE_CATEGORIES.indexOf(activeCategory)}
              onPageSelected={handlePageSelected}
              offscreenPageLimit={1}
              overdrag
            >
              {SWIPE_CATEGORIES.map((cat) => (
                <View key={cat} style={styles.pagerPage}>
                  {renderCategoryGrid(cat)}
                </View>
              ))}
            </PagerView>
          )}
        </View>
      </Animated.ScrollView>

      <Modal visible={brandAlert.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                borderWidth: 2,
                borderColor: brandAlert.type === 'error' ? T.danger
                  : brandAlert.type === 'success' ? T.success : T.warning,
              },
            ]}
          >
            <View style={styles.brandAlertIconBg}>
              {brandAlert.type === 'success' ? <CheckCircle2 size={60} color={T.success} />
                : brandAlert.type === 'error' ? <XCircle size={60} color={T.danger} />
                  : <AlertCircle size={60} color={T.warning} />}
            </View>
            <Text style={styles.modalTitle}>{brandAlert.title}</Text>
            <Text style={styles.brandAlertMessage}>{brandAlert.message}</Text>
            <TouchableOpacity
              style={[
                styles.brandedRetryBtn,
                {
                  width: '100%',
                  justifyContent: 'center',
                  backgroundColor: brandAlert.type === 'error' ? T.danger
                    : brandAlert.type === 'success' ? T.success : T.warning,
                },
              ]}
              onPress={() => setBrandAlert({ ...brandAlert, visible: false })}
            >
              <Text style={{ fontFamily: T.fontFamily, color: '#FFF', fontWeight: 'bold', fontSize: T.fs_md }}>
                გასაგებია
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const getStyles = (T: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: T.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },

  // Pager View styles — dynamic height per active tab
  pagerView: {
    minHeight: Dimensions.get('window').height * 0.6,
  },
  pagerPage: {
    flex: 1,
    paddingTop: 15,
    paddingBottom: 20,
  },

  stickySearchWrapper: {
    backgroundColor: T.bg,
    paddingTop: T.sm,
    paddingBottom: 4,
    zIndex: 100,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.card,
    marginHorizontal: T.xl,
    marginBottom: 12,
    borderRadius: 15,
    paddingHorizontal: T.md,
    height: 46,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  searchInput: { flex: 1, fontFamily: T.fontFamily, fontSize: T.fs_md, color: T.dark, fontWeight: '600' },
  categoriesScrollContent: { paddingHorizontal: T.xl, paddingBottom: T.sm, gap: T.sm },
  categoryPill: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  categoryPillActive: {
    backgroundColor: T.primary,
    borderColor: T.primary,
    elevation: 3,
    shadowColor: T.primary,
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  categoryPillSpecial: {
    borderColor: T.primary,
    borderWidth: 2,
    shadowColor: T.primary,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryPillText: { fontFamily: T.fontFamily, fontSize: T.fs_md, fontWeight: '700', color: T.mid },
  categoryPillTextActive: { color: '#FFF', fontWeight: '900' },
  contentContainer: { paddingBottom: 15 },

  brandedStateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40, paddingHorizontal: 30, minHeight: 400 },
  stateIconBg: { padding: 25, borderRadius: 40, marginBottom: T.xl },
  stateTitle: { fontFamily: T.fontFamily, fontSize: T.fs_xl, fontWeight: '900', color: T.dark, marginBottom: T.sm, textAlign: 'center' },
  stateSub: { fontFamily: T.fontFamily, fontSize: T.fs_md, color: T.mid, textAlign: 'center', lineHeight: 24, fontWeight: '600', marginBottom: 30 },
  brandedRetryBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, paddingVertical: T.md, borderRadius: T.r_md, elevation: 4 },
  brandedRetryText: { fontFamily: T.fontFamily, color: '#FFF', fontSize: T.fs_md, fontWeight: 'bold' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: T.xl, marginBottom: T.md },
  sectionTitle: { fontFamily: T.fontFamily, fontSize: T.fs_lg, fontWeight: '900', color: T.dark },
  seeAllText: { fontFamily: T.fontFamily, fontSize: T.fs_sm, fontWeight: '700', color: T.primary },

  carouselContainer: { paddingLeft: T.xl, paddingRight: T.sm, marginBottom: 28 },
  trendingCard: { width: SW * 0.7, backgroundColor: T.card, borderRadius: T.r_xl, marginRight: T.md, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10 },
  trendingImg: { width: '100%', height: 160 },
  trendingInfo: { padding: T.md },
  trendingName: { fontFamily: T.fontFamily, fontSize: T.fs_md, fontWeight: '900', color: T.dark, marginBottom: T.sm },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaTextSmall: { fontFamily: T.fontFamily, fontSize: T.fs_xs, color: T.mid, fontWeight: '700' },
  heartBtn: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(255,255,255,0.92)', padding: 8, borderRadius: 20, elevation: 2 },

  proteinCard: { width: 160, backgroundColor: T.card, borderRadius: T.r_lg, marginRight: T.md, overflow: 'hidden', elevation: 2, borderWidth: 1, borderColor: T.border },
  proteinImg: { width: '100%', height: 110 },
  proteinBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: T.success, paddingHorizontal: 8, paddingVertical: 4, borderRadius: T.sm },
  proteinBadgeText: { fontFamily: T.fontFamily, color: '#FFF', fontSize: T.fs_xs, fontWeight: '900' },
  proteinInfo: { padding: T.sm },
  proteinName: { fontFamily: T.fontFamily, fontSize: T.fs_sm, fontWeight: '700', color: T.dark },

  quickCard: { width: 140, backgroundColor: T.card, borderRadius: T.r_lg, marginRight: T.md, overflow: 'hidden', elevation: 2 },
  quickImg: { width: '100%', height: 100 },
  quickInfo: { padding: T.sm },
  quickName: { fontFamily: T.fontFamily, fontSize: T.fs_sm, fontWeight: '700', color: T.dark, marginBottom: 4 },
  quickTime: { fontFamily: T.fontFamily, fontSize: T.fs_xs, fontWeight: '900', color: T.warning },

  verticalListContainer: { paddingHorizontal: T.xl },
  verticalCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.card, padding: T.sm, borderRadius: T.r_lg, marginBottom: T.sm, elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4 },
  verticalImg: { width: 70, height: 70, borderRadius: T.r_sm, marginRight: T.md },
  verticalInfo: { flex: 1 },
  verticalName: { fontFamily: T.fontFamily, fontSize: T.fs_md, fontWeight: '700', color: T.dark, marginBottom: 4 },
  verticalMeta: { backgroundColor: 'rgba(255,71,87,0.1)', alignSelf: 'flex-start', paddingHorizontal: T.sm, paddingVertical: 4, borderRadius: T.xs },
  verticalCals: { fontFamily: T.fontFamily, fontSize: T.fs_xs, color: T.danger, fontWeight: '900' },

  gridCard: { width: '48%', backgroundColor: T.card, borderRadius: T.r_lg, marginBottom: T.md, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  gridImg: { width: '100%', height: 130 },
  gridInfo: { padding: T.sm },
  gridName: { fontFamily: T.fontFamily, fontSize: T.fs_sm, fontWeight: '900', color: T.dark, marginBottom: T.sm },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 12 },
  gridMetaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.bg, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  gridMetaText: { fontFamily: T.fontFamily, fontSize: T.fs_xs, color: T.mid, fontWeight: '700' },
  heartBtnGrid: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(255,255,255,0.92)', padding: 6, borderRadius: T.r_sm, elevation: 2 },

  viewAllHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: T.xl, marginBottom: T.xl },
  backBtn: { padding: T.sm, backgroundColor: T.card, borderRadius: T.r_sm, marginRight: T.md, elevation: 2 },
  viewAllTitle: { fontFamily: T.fontFamily, fontSize: T.fs_xl, fontWeight: '900', color: T.dark },

  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 30, minHeight: 300 },
  emptyIconWrap: { backgroundColor: T.border, padding: T.xl, borderRadius: 40, marginBottom: T.lg },
  emptyTitle: { fontFamily: T.fontFamily, fontSize: T.fs_lg, fontWeight: '800', color: T.dark, marginBottom: T.sm, textAlign: 'center' },
  emptySub: { fontFamily: T.fontFamily, fontSize: T.fs_sm, color: T.mid, textAlign: 'center', lineHeight: 20 },
  searchResultsLabel: { fontFamily: T.fontFamily, fontSize: T.fs_sm, color: T.mid, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(10,15,13,0.65)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: T.card, borderRadius: 28, padding: 28, alignItems: 'center', elevation: 10 },
  modalTitle: { fontFamily: T.fontFamily, fontSize: T.fs_xl, fontWeight: '900', color: T.dark, marginBottom: T.sm, textAlign: 'center' },
  brandAlertIconBg: { backgroundColor: T.bg, padding: T.md, borderRadius: 40, marginBottom: T.md },
  brandAlertMessage: { fontFamily: T.fontFamily, textAlign: 'center', marginBottom: 24, color: T.mid, fontWeight: '600', lineHeight: 22 },
});
