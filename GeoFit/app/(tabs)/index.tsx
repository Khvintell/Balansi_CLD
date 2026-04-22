import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet, Text, View, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, Dimensions, Platform,
  StatusBar, Modal, Animated, FlatList, RefreshControl, Pressable,
} from 'react-native';
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
  "ზღვის მარილსა და ჩვეულებრივ სუფრის მარილს თითქმის იდენტური რაოდენობის ნატრიუმი აქვთ. ნუ მოტყუვდები მარკეტინგით! 🌊🧂",
  "ნამდვილი თაფლი არასდროს ფუჭდება. არქეოლოგებმა ეგვიპტის პირამიდებში 3000 წლის წინანდელი თაფლი იპოვეს და ისევ ვარგისი იყო! 🍯🏺",
  "სოკო ერთადერთი მცენარეული პროდუქტია, რომელიც მზის სხივების ქვეშ D ვიტამინს თავისით გამოიმუშავებს. 🍄☀️",
  "გგონია ფორთოხალშია ყველაზე მეტი C ვიტამინი? წითელ ბულგარულ წიწაკას მასზე 3-ჯერ მეტი აქვს! 🫑💥",
  "დარიჩინს შეუძლია ტვინი მოატყუოს — ის კერძს სიტკბოს შეგრძნებას აძლევს ისე, რომ 1 გრამ შაქარსაც არ შეიცავს. 🍂",
  "პოპკორნი 100%-ით მთელმარცვლოვანი პროდუქტია! მთავარია, კინოთეატრის კარაქში არ ჩაახრჩო. 🍿🎥",
  "გრეიფრუტს შეუძლია ზოგიერთი მედიკამენტის მოქმედება დაბლოკოს ან გააძლიეროს. თუ წამლებს სვამ, ექიმს კითხე! 🍊💊",
  "ჭარხლის წვენი ვარჯიშის წინ გამძლეობას 15%-ით ზრდის. ნამდვილი ბუნებრივი 'პრევორქაუთია'! 🔴🏃‍♂️",
  "ფისტას (Pistachios) ხშირად 'გამხდარ თხილს' უწოდებენ, რადგან მისი გარჩევა დროს მოითხოვს და ტვინი ასწრებს სიმაძღრის აღქმას. 🥜",
  "კივის თუ კანიანად შეჭამ, 50%-ით მეტ ბოჭკოს მიიღებ! 🥝",
  "სოიოს მარცვლები (Edamame) მცენარეული სამყაროს ნამდვილი 'ბოსები' არიან — შეიცავენ ცხრა-ვე შეუცვლელ ამინომჟავას! 🫛💪",
  "10-15 წუთი გულიანი სიცილი 40-მდე კალორიას წვავს. იცინე ბევრი, ეს შენი მინი-ვარჯიშია! 😂🔥",
  "შენს მეტაბოლიზმს ყველაზე მეტად შენი ყოველდღიური ფუსფუსი (NEAT) აჩქარებს და არა მხოლოდ 1-საათიანი ვარჯიში დარბაზში. 🚶‍♀️🧹",
  "გრილი შხაპი ორგანიზმში ე.წ. 'ყავისფერ ცხიმს' ააქტიურებს, რომელიც სითბოს გამოსაყოფად ჩვეულებრივ ცხიმს წვავს! 🚿❄️",
  "ცხარე საკვები (რომელიც კაპსაიცინს შეიცავს) დროებით აჩქარებს მეტაბოლიზმს და ამცირებს მადას. ცეცხლი დაანთე! 🌶️🔥",
  "ქრონიკული სტრესი (კორტიზოლი) პირდაპირ კავშირშია მუცლის ზონაში ცხიმის დაგროვებასთან. დაიკიდე და დაისვენე! 🧘‍♂️",
  "ნახშირწყლები წყალს იკავებს ორგანიზმში (1 გრამი = 3 გრამ წყალს). ეგ 'სწრაფად დაკლებული' 2 კილო დიეტის დაწყებისას უბრალოდ წყალია! 💧📉",
  "კრეატინი ყველაზე კარგად შესწავლილი და უსაფრთხო დანამატია ძალისა და კუნთის ზრდისთვის. არ შეგეშინდეს! ⚡️",
  "ვარჯიშამდე სტატიკური გაწელვა ძალას გაკარგვინებს! ვარჯიშამდე იმოძრავე (დინამიკური), გაწელვა კი ბოლოსთვის შემოინახე. 🤸‍♂️",
  "ნიორი ბუნებრივი ანტიბიოტიკია, მაგრამ მისი სუპერძალა (ალიცინი) ყველაზე კარგად დაჭყლეტიდან 10 წუთის შემდეგ აქტიურდება. 🧄",
  "ბატატს (ტკბილ კარტოფილს) ჩვეულებრივ კარტოფილზე დაბალი გლიკემიური ინდექსი აქვს — ანუ ენერგიას უფრო სტაბილურად გაძლევს! 🍠",
  "საზამთრო 92% წყალია, მაგრამ სავსეა ელექტროლიტებით. ზაფხულის საუკეთესო ჰიდრატაცია! 🍉💧",
  "ასპარაგუსი (სატაცური) ბუნებრივი შარდმდენია — იდეალურია შეშუპების ჩასაცხრობად. 🎋",
  "ორგანიზმი ნუშის კალორიების 20%-ს საერთოდ ვერ ითვისებს! ასე რომ, ნუ შეგაშინებს ეტიკეტზე დაწერილი რიცხვები. 🌰",
  "ლიმონიანი წყალი დილით მაგარია, მაგრამ ეგრევე კბილებს ნუ გამოიხეხავ — მჟავა მინანქარს აზიანებს! დაელოდე 30 წუთი. 🍋🪥",
  "გაზიანი წყალი (უშაქრო) ზუსტად ისევე ატენიანებს ორგანიზმს, როგორც ჩვეულებრივი. იბუყბუყე თამამად! 🫧💦",
  "პიტნის სურნელის შესუნთქვას შეუძლია შიმშილის გრძნობა დროებით გააქროს. ფსიქოლოგია მუშაობს! 🌿",
  "ნებისყოფა ამოწურვადი რესურსია. ნუ ებრძვი ცდუნებას — უბრალოდ ნუ იყიდი ტკბილეულს სახლში! 🍪🚫",
  "ბედნიერების ჰორმონის (სეროტონინის) 90% შენს ნაწლავებში გამომუშავდება. ჯანსაღი მუცელი = ბედნიერ ტვინს! 🦠🧠",
  "კევის ღეჭვისას ტვინს ჰგონია, რომ საჭმელი მოდის და კუჭის წვენის გამოყოფას იწყებს. მშიერზე მოერიდე! 🍬",
  "ლოკალურად ცხიმის წვა არ არსებობს. 1000 პრესი მუცლიდან ცხიმს ვერ გააქრობს, თუ სამზარეულოში არ მოაგვარე საქმე. 🍕📉",
  "რაც უფრო მეტი კუნთი გაქვს, მით მეტ კალორიას წვავ მოსვენებულ მდგომარეობაშიც კი (დიახ, დივანზე წოლისას!). 💪🛋️",
  "დისციპლინა > მოტივაცია. სტაბილური 80%-იანი ძალისხმევა ყოველთვის აჯობებს 1-კვირიან 100%-იან 'გაგიჟებას'. 📈",
  "შენი სხეული მანქანაა, საკვები კი საწვავი. ნუ ჩაასხამ პორშეში ცუდ ბენზინს! 'Balansi' შენი სტილია. 🏎️🔥",
  "ინტერვალური შიმშილის (16/8) დროს, 12 საათის შემდეგ იწყება აუტოფაგია - სხეული თავის თავს ასუფთავებს დაზიანებული უჯრედებისგან. 🧬",
  "მაღალი ინტენსივობის ვარჯიშის (HIIT) შემდეგ სხეული ინარჩუნებს კალორიების წვის მაღალ ტემპს მომდევნო 24-48 საათის განმავლობაში! 🔥",
  "კუნთოვანი ქსოვილი 3-ჯერ მეტ კალორიას მოიხმარს, ვიდრე ცხიმოვანი, მაშინაც კი როცა ისვენებ. ააშენე კუნთი! 💪",
  "ცარიელ კუჭზე ყავის დალევა კორტიზოლის (სტრესის ჰორმონის) პიკს იწვევს. უმჯობესია ყავა საუზმის შემდეგ მიირთვა. ☕🍳",
  "შაქრის შემცველობა კეტჩუპში ხშირად უფრო მაღალია, ვიდრე ზოგიერთ შოკოლადში. ყოველთვის შეამოწმე ეტიკეტი! 🍅📉",
  "დღის განმავლობაში ხანმოკლე (15-20 წთ) მედიტაცია ამცირებს კორტიზოლს, რაც თავის მხრივ ხელს უწყობს მუცლის ზონაში ცხიმის კლებას. 🧘‍♂️",
  "ჭამის წინ თბილ წყალში განზავებული ერთი კოვზი ვაშლის ძმარი სისხლში შაქრის მკვეთრ ნახტომს აფერხებს! 🍏",
  "ცივი წყლის დალევა ერთგვარი მინი-ვარჯიშია — სხეული ხარჯავს დამატებით კალორიებსმის სხეულის ტემპერატურამდე გასათბობად 🧊💧",
];

const getImageUrl = (url: string, baseUrl: string) => {
  if (!url) return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800';
  if (url.startsWith('http')) return encodeURI(url);
  let cleanPath = url.replace(/^\/+/, '');
  if (!cleanPath.startsWith('assets/')) cleanPath = `assets/${cleanPath}`;
  return `${baseUrl}/${encodeURI(cleanPath)}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// 🧬 SVG HUMAN FIGURE — Pure vector, professionally crafted body silhouette
// Athletic proportions, front-facing standing pose, lit from above-left.
// Zero external assets, zero dependencies beyond react-native-svg.
// ─────────────────────────────────────────────────────────────────────────────
const HumanFigureSVG = React.memo(({ primaryColor, width, height }: {
  primaryColor: string; width: number; height: number;
}) => {
  const W = width;
  const H = height;
  const cx = W / 2;
  // All measurements as ratio of width so figure scales perfectly
  const s = W / 72; // base unit

  // Key y-positions (top-anchored)
  const headR = 9 * s;
  const headCY = 14 * s;
  const neckT = headCY + headR - 0.5 * s;
  const neckB = neckT + 6 * s;
  const shouldY = neckB;
  const chestMid = shouldY + 20 * s;
  const waistY = shouldY + 38 * s;
  const hipY = waistY + 9 * s;
  const kneeY = hipY + 34 * s;
  const ankleY = kneeY + 28 * s;
  const footY = ankleY + 5 * s;

  // Key x-spans
  const shouldW = 32 * s;
  const chestW = 26 * s;
  const waistW = 18 * s;
  const hipW = 24 * s;
  const neckW = 6.5 * s;
  const thighW = 9 * s;
  const calfW = 6.5 * s;
  const footW = 9 * s;
  const armW = 5.5 * s;

  // Arm anchor points
  const armTopLX = cx - chestW / 2 - 1 * s;
  const armTopRX = cx + chestW / 2 + 1 * s;
  const armMidLX = cx - shouldW / 2 - 4 * s;
  const armMidRX = cx + shouldW / 2 + 4 * s;
  const armBotLX = cx - waistW / 2 - 5 * s;
  const armBotRX = cx + waistW / 2 + 5 * s;
  const armMidY = shouldY + 22 * s;
  const armBotY = waistY + 8 * s;

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Defs>
        {/* Main body fill — deep navy-teal, lit from upper-left */}
        <SvgGradient id="fig_body" x1="0.2" y1="0" x2="0.85" y2="1">
          <Stop offset="0%" stopColor="#2a4060" />
          <Stop offset="40%" stopColor="#1a2d42" />
          <Stop offset="100%" stopColor="#0d1825" />
        </SvgGradient>
        {/* Head — slightly warmer */}
        <SvgGradient id="fig_head" x1="0.3" y1="0" x2="0.75" y2="1">
          <Stop offset="0%" stopColor="#304e6a" />
          <Stop offset="100%" stopColor="#182535" />
        </SvgGradient>
        {/* Specular streak — upper-left lit edge */}
        <SvgGradient id="fig_spec" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.11" />
          <Stop offset="50%" stopColor="#ffffff" stopOpacity="0.03" />
          <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </SvgGradient>
        {/* Primary color rim glow */}
        <SvgGradient id="fig_rim" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor={primaryColor} stopOpacity="0" />
          <Stop offset="100%" stopColor={primaryColor} stopOpacity="0.3" />
        </SvgGradient>
        {/* Ground shadow */}
        <RadialGradient id="fig_shadow" cx="50%" cy="30%" rx="50%" ry="30%">
          <Stop offset="0%" stopColor="#000000" stopOpacity="0.4" />
          <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* ── Ground plane shadow ── */}
      <Ellipse cx={cx} cy={footY + 6 * s} rx={hipW * 0.9} ry={4 * s} fill="url(#fig_shadow)" />

      {/* ══ LEFT ARM (far from viewer — drawn first / behind torso) ══ */}
      {/* Upper arm */}
      <Path
        d={`M ${armTopLX} ${shouldY + 4 * s}
            C ${armMidLX - 2 * s} ${shouldY + 12 * s},
              ${armMidLX} ${armMidY},
              ${armMidLX + 3 * s} ${armMidY + 10 * s}`}
        stroke="#162230" strokeWidth={armW * 1.05}
        fill="none" strokeLinecap="round"
      />
      {/* Forearm */}
      <Path
        d={`M ${armMidLX + 3 * s} ${armMidY + 10 * s}
            C ${armMidLX + 1 * s} ${armMidY + 22 * s},
              ${armBotLX + 2 * s} ${armBotY - 4 * s},
              ${armBotLX + 4 * s} ${armBotY + 4 * s}`}
        stroke="#162230" strokeWidth={armW * 0.82}
        fill="none" strokeLinecap="round"
      />

      {/* ══ RIGHT ARM (near viewer — drawn first, rim lit) ══ */}
      <Path
        d={`M ${armTopRX} ${shouldY + 4 * s}
            C ${armMidRX + 2 * s} ${shouldY + 12 * s},
              ${armMidRX} ${armMidY},
              ${armMidRX - 3 * s} ${armMidY + 10 * s}`}
        stroke="url(#fig_body)" strokeWidth={armW * 1.05}
        fill="none" strokeLinecap="round"
      />
      <Path
        d={`M ${armMidRX - 3 * s} ${armMidY + 10 * s}
            C ${armMidRX - 1 * s} ${armMidY + 22 * s},
              ${armBotRX - 2 * s} ${armBotY - 4 * s},
              ${armBotRX - 4 * s} ${armBotY + 4 * s}`}
        stroke="url(#fig_body)" strokeWidth={armW * 0.82}
        fill="none" strokeLinecap="round"
      />
      {/* Right arm rim light */}
      <Path
        d={`M ${armTopRX + 1 * s} ${shouldY + 4 * s}
            C ${armMidRX + 3 * s} ${shouldY + 14 * s},
              ${armMidRX + 1 * s} ${armMidY + 2 * s},
              ${armMidRX - 2 * s} ${armMidY + 12 * s}`}
        stroke={primaryColor} strokeWidth={0.8} strokeOpacity={0.35}
        fill="none" strokeLinecap="round"
      />

      {/* ══ TORSO ══ */}
      {/*
        Vertices: neck-left → shoulder-left → chest-left → waist-left →
                  hip-left → hip-right → waist-right → chest-right →
                  shoulder-right → neck-right → close
      */}
      <Path
        d={`
          M ${cx - neckW / 2} ${neckB}
          L ${cx - shouldW / 2} ${shouldY}
          C ${cx - chestW / 2 - 2 * s} ${shouldY + 10 * s},
            ${cx - chestW / 2} ${chestMid - 6 * s},
            ${cx - chestW / 2} ${chestMid}
          C ${cx - chestW / 2} ${chestMid + 8 * s},
            ${cx - waistW / 2 - 1 * s} ${waistY - 4 * s},
            ${cx - waistW / 2} ${waistY}
          C ${cx - hipW / 2 + 2 * s} ${waistY + 5 * s},
            ${cx - hipW / 2} ${hipY - 3 * s},
            ${cx - hipW / 2} ${hipY}
          L ${cx + hipW / 2} ${hipY}
          C ${cx + hipW / 2} ${hipY - 3 * s},
            ${cx + hipW / 2 - 2 * s} ${waistY + 5 * s},
            ${cx + waistW / 2} ${waistY}
          C ${cx + chestW / 2} ${waistY - 4 * s},
            ${cx + chestW / 2} ${chestMid + 8 * s},
            ${cx + chestW / 2} ${chestMid}
          C ${cx + chestW / 2} ${chestMid - 6 * s},
            ${cx + chestW / 2 + 2 * s} ${shouldY + 10 * s},
            ${cx + shouldW / 2} ${shouldY}
          L ${cx + neckW / 2} ${neckB}
          Z
        `}
        fill="url(#fig_body)"
        stroke={primaryColor} strokeWidth={0.5} strokeOpacity={0.2}
      />

      {/* Torso specular highlight — left-side lit streak */}
      <Path
        d={`M ${cx - chestW / 2 + 1 * s} ${shouldY + 5 * s}
            L ${cx - waistW / 2 + 1 * s} ${waistY - 3 * s}
            L ${cx} ${waistY - 3 * s}
            L ${cx + 2 * s} ${shouldY + 5 * s}
            Z`}
        fill="url(#fig_spec)"
      />

      {/* Chest pectoral definition */}
      <Path
        d={`M ${cx - chestW / 2 + 3 * s} ${shouldY + 14 * s}
            Q ${cx - 2 * s} ${shouldY + 20 * s}, ${cx - 2 * s} ${chestMid}`}
        fill="none" stroke={primaryColor} strokeWidth={0.5} strokeOpacity={0.14}
      />
      <Path
        d={`M ${cx + chestW / 2 - 3 * s} ${shouldY + 14 * s}
            Q ${cx + 2 * s} ${shouldY + 20 * s}, ${cx + 2 * s} ${chestMid}`}
        fill="none" stroke={primaryColor} strokeWidth={0.5} strokeOpacity={0.14}
      />
      {/* Sternum center line */}
      <Line
        x1={cx} y1={shouldY + 8 * s}
        x2={cx} y2={waistY - 5 * s}
        stroke={primaryColor} strokeWidth={0.4} strokeOpacity={0.1}
      />
      {/* Waist cinch curve */}
      <Path
        d={`M ${cx - waistW / 2} ${waistY}
            Q ${cx} ${waistY + 3 * s}, ${cx + waistW / 2} ${waistY}`}
        fill="none" stroke={primaryColor} strokeWidth={0.5} strokeOpacity={0.16}
      />

      {/* Right-side rim light on torso */}
      <Path
        d={`M ${cx + shouldW / 2 - 1 * s} ${shouldY + 2 * s}
            C ${cx + chestW / 2 + 2 * s} ${shouldY + 14 * s},
              ${cx + chestW / 2 + 1 * s} ${chestMid},
              ${cx + waistW / 2 + 1 * s} ${waistY}
            L ${cx + hipW / 2 - 1 * s} ${hipY}`}
        fill="none" stroke={primaryColor} strokeWidth={0.9} strokeOpacity={0.3}
        strokeLinecap="round"
      />

      {/* ══ LEFT LEG (back, darker) ══ */}
      {/* Thigh */}
      <Path
        d={`M ${cx - hipW / 2 + thighW * 0.6} ${hipY}
            C ${cx - thighW * 0.4} ${hipY + 12 * s},
              ${cx - thighW * 0.55} ${kneeY - 10 * s},
              ${cx - thighW * 0.3} ${kneeY}`}
        stroke="#16232f" strokeWidth={thighW * 1.15}
        fill="none" strokeLinecap="round"
      />
      {/* Calf */}
      <Path
        d={`M ${cx - thighW * 0.3} ${kneeY}
            C ${cx - thighW * 0.55} ${kneeY + 10 * s},
              ${cx - calfW * 0.55} ${ankleY - 5 * s},
              ${cx - calfW * 0.2} ${ankleY}`}
        stroke="#16232f" strokeWidth={calfW * 1.1}
        fill="none" strokeLinecap="round"
      />
      {/* Left foot */}
      <Ellipse
        cx={cx - calfW * 0.5} cy={footY + 1 * s}
        rx={footW * 0.72} ry={3.5 * s}
        fill="#131e2a"
      />

      {/* ══ RIGHT LEG (front, lit) ══ */}
      <Path
        d={`M ${cx + hipW / 2 - thighW * 0.6} ${hipY}
            C ${cx + thighW * 0.4} ${hipY + 12 * s},
              ${cx + thighW * 0.55} ${kneeY - 10 * s},
              ${cx + thighW * 0.3} ${kneeY}`}
        stroke="url(#fig_body)" strokeWidth={thighW * 1.15}
        fill="none" strokeLinecap="round"
      />
      <Path
        d={`M ${cx + thighW * 0.3} ${kneeY}
            C ${cx + thighW * 0.55} ${kneeY + 10 * s},
              ${cx + calfW * 0.55} ${ankleY - 5 * s},
              ${cx + calfW * 0.2} ${ankleY}`}
        stroke="url(#fig_body)" strokeWidth={calfW * 1.1}
        fill="none" strokeLinecap="round"
      />
      {/* Right leg rim accent */}
      <Path
        d={`M ${cx + thighW * 0.7} ${hipY + 4 * s}
            C ${cx + thighW * 0.8} ${hipY + 18 * s},
              ${cx + thighW * 0.7} ${kneeY - 5 * s},
              ${cx + thighW * 0.4} ${kneeY + 1 * s}`}
        fill="none" stroke={primaryColor} strokeWidth={0.7} strokeOpacity={0.28}
        strokeLinecap="round"
      />
      {/* Right foot */}
      <Ellipse
        cx={cx + calfW * 0.5} cy={footY + 1 * s}
        rx={footW * 0.75} ry={3.8 * s}
        fill="url(#fig_body)"
        stroke={primaryColor} strokeWidth={0.4} strokeOpacity={0.25}
      />

      {/* Knee accent circles */}
      <Circle cx={cx - thighW * 0.3} cy={kneeY} r={1.6 * s} fill={primaryColor} fillOpacity={0.38} />
      <Circle cx={cx + thighW * 0.3} cy={kneeY} r={1.8 * s} fill={primaryColor} fillOpacity={0.42} />

      {/* ══ NECK ══ */}
      <Path
        d={`M ${cx - neckW / 2} ${neckB}
            L ${cx - neckW / 2 + 0.5 * s} ${neckT}
            L ${cx + neckW / 2 - 0.5 * s} ${neckT}
            L ${cx + neckW / 2} ${neckB} Z`}
        fill="url(#fig_head)"
      />

      {/* ══ HEAD ══ */}
      {/* Skull */}
      <Circle cx={cx} cy={headCY} r={headR}
        fill="url(#fig_head)"
        stroke={primaryColor} strokeWidth={0.4} strokeOpacity={0.25}
      />
      {/* Chin taper — slightly elongate for realism */}
      <Ellipse cx={cx} cy={headCY + headR * 0.55} rx={headR * 0.6} ry={headR * 0.5}
        fill="url(#fig_head)"
      />
      {/* Subtle cheekbones */}
      <Ellipse cx={cx - headR * 0.38} cy={headCY + headR * 0.12} rx={headR * 0.16} ry={headR * 0.09}
        fill={primaryColor} fillOpacity={0.07}
      />
      <Ellipse cx={cx + headR * 0.38} cy={headCY + headR * 0.12} rx={headR * 0.16} ry={headR * 0.09}
        fill={primaryColor} fillOpacity={0.07}
      />
      {/* Eye sockets */}
      <Ellipse cx={cx - headR * 0.29} cy={headCY - headR * 0.08} rx={headR * 0.13} ry={headR * 0.08}
        fill="#09141e" fillOpacity={0.55}
      />
      <Ellipse cx={cx + headR * 0.29} cy={headCY - headR * 0.08} rx={headR * 0.13} ry={headR * 0.08}
        fill="#09141e" fillOpacity={0.55}
      />
      {/* Head specular */}
      <Ellipse cx={cx - headR * 0.28} cy={headCY - headR * 0.38} rx={headR * 0.2} ry={headR * 0.12}
        fill="#ffffff" fillOpacity={0.07}
      />
      {/* Right rim light on head */}
      <Path
        d={`M ${cx + headR * 0.72} ${headCY - headR * 0.5}
            A ${headR} ${headR} 0 0 1 ${cx + headR * 0.65} ${headCY + headR * 0.6}`}
        fill="none" stroke={primaryColor} strokeWidth={0.9} strokeOpacity={0.3}
        strokeLinecap="round"
      />

      {/* ══ SHOULDER ACCENT DOTS ══ */}
      <Circle cx={cx - shouldW / 2} cy={shouldY} r={2 * s} fill={primaryColor} fillOpacity={0.45} />
      <Circle cx={cx + shouldW / 2} cy={shouldY} r={2 * s} fill={primaryColor} fillOpacity={0.45} />
      {/* Hip accent dots */}
      <Circle cx={cx - hipW / 2 + 2 * s} cy={hipY + 2 * s} r={1.4 * s} fill={primaryColor} fillOpacity={0.38} />
      <Circle cx={cx + hipW / 2 - 2 * s} cy={hipY + 2 * s} r={1.4 * s} fill={primaryColor} fillOpacity={0.38} />
    </Svg>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 🧬 HOLOGRAPHIC POD — Stasis capsule with full SVG figure, grid + breathing
// ─────────────────────────────────────────────────────────────────────────────
const HolographicPod = React.memo(({ C }: { C: any }) => {
  const primaryColor: string = C.primary;

  const breathPhase = useSharedValue(0);
  useEffect(() => {
    breathPhase.value = withRepeat(
      withTiming(1, { duration: 3400, easing: Easing.inOut(Easing.sin) }),
      -1, true,
    );
  }, []);

  const pressScale = useSharedValue(1);

  const podContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const breathOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(breathPhase.value, [0, 1], [0, 0.26]),
    transform: [{ scale: interpolate(breathPhase.value, [0, 1], [0.8, 1.08]) }],
  }));

  const scanLineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(breathPhase.value, [0, 0.1, 0.9, 1], [0, 0.65, 0.65, 0]),
    transform: [{ translateY: interpolate(breathPhase.value, [0, 1], [-POD_HEIGHT * 0.44, POD_HEIGHT * 0.44]) }],
  }));

  const handlePressIn = useCallback(() => {
    pressScale.value = withSpring(0.95, { damping: 14, stiffness: 220 });
  }, []);
  const handlePressOut = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    pressScale.value = withSpring(1, { damping: 8, stiffness: 180 });
  }, []);

  // Precompute grid lines count
  const hLines = Math.ceil(POD_HEIGHT / 14);
  const vLines = Math.ceil(POD_WIDTH / 14);

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Reanimated.View style={[podStyles.pod, podContainerStyle]}>

        {/* Deep background */}
        <LinearGradient
          colors={['#070e1a', '#0c1822', '#050c13']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Holographic grid texture */}
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <Svg width={POD_WIDTH} height={POD_HEIGHT} viewBox={`0 0 ${POD_WIDTH} ${POD_HEIGHT}`}>
            {Array.from({ length: hLines }).map((_, i) => (
              <Line key={`h${i}`} x1={0} y1={i * 14} x2={POD_WIDTH} y2={i * 14}
                stroke={primaryColor} strokeWidth={0.22} strokeOpacity={0.09} />
            ))}
            {Array.from({ length: vLines }).map((_, i) => (
              <Line key={`v${i}`} x1={i * 14} y1={0} x2={i * 14} y2={POD_HEIGHT}
                stroke={primaryColor} strokeWidth={0.22} strokeOpacity={0.09} />
            ))}
          </Svg>
        </View>

        {/* SVG Human Figure */}
        <View style={podStyles.figureContainer} pointerEvents="none">
          <HumanFigureSVG
            primaryColor={primaryColor}
            width={POD_WIDTH * 0.84}
            height={POD_HEIGHT * 0.86}
          />
        </View>

        {/* Breathing base glow */}
        <Reanimated.View
          style={[podStyles.breathGlow, breathOverlayStyle, { backgroundColor: primaryColor }]}
          pointerEvents="none"
        />

        {/* Scan line sweep */}
        <Reanimated.View
          style={[podStyles.scanLine, scanLineStyle, { backgroundColor: primaryColor }]}
          pointerEvents="none"
        />

        {/* Top vignette */}
        <LinearGradient colors={['#070e1a', 'transparent']} style={podStyles.vignetteTop} pointerEvents="none" />

        {/* Bottom vignette */}
        <LinearGradient colors={['transparent', 'rgba(5,12,19,0.9)']} style={podStyles.vignetteBottom} pointerEvents="none" />

        {/* Edge accent lines */}
        <View style={[podStyles.edgeH, podStyles.edgeTop, { borderColor: primaryColor + '40' }]} pointerEvents="none" />
        <View style={[podStyles.edgeH, podStyles.edgeBottom, { borderColor: primaryColor + '40' }]} pointerEvents="none" />

        {/* Glassmorphism Lock Pill */}
        <View style={podStyles.lockPillWrap} pointerEvents="none">
          <BlurView intensity={22} tint="dark" style={podStyles.lockBlur}>
            <Lock size={10} color="#FFFFFF" style={{ opacity: 0.82 }} />
            <Text style={podStyles.lockText}>მალე ⏳</Text>
          </BlurView>
        </View>

      </Reanimated.View>
    </Pressable>
  );
});

const podStyles = StyleSheet.create({
  pod: {
    width: POD_WIDTH, height: POD_HEIGHT,
    borderRadius: 24, overflow: 'hidden',
    backgroundColor: '#070e1a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.52, shadowRadius: 24,
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  figureContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 26,
  },
  breathGlow: {
    position: 'absolute',
    bottom: -24, left: -12, right: -12,
    height: 110, borderRadius: 55,
  },
  scanLine: {
    position: 'absolute', left: 0, right: 0,
    height: 1.5,
  },
  vignetteTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 40,
  },
  vignetteBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 58,
  },
  edgeH: {
    position: 'absolute', left: 12, right: 12, height: 1,
  },
  edgeTop: { top: 10, borderTopWidth: 1 },
  edgeBottom: { bottom: 10, borderBottomWidth: 1 },
  lockPillWrap: {
    position: 'absolute', bottom: 12, alignSelf: 'center',
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)',
  },
  lockBlur: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 11, paddingVertical: 5, gap: 5,
  },
  lockText: {
    fontSize: 10, fontWeight: '800',
    color: '#FFFFFF', letterSpacing: 0.3,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 💬 SPEECH BUBBLE — Right-tail, auto-size, tap to rotate
// ─────────────────────────────────────────────────────────────────────────────
const TAIL = 10;
const SpeechBubbleNew = React.memo(({ tips, C, T }: { tips: string[]; C: any; T: any }) => {
  const [currentTip, setCurrentTip] = useState(() => tips[Math.floor(Math.random() * tips.length)]);
  const fade = useRef(new Animated.Value(1)).current;

  const rotate = useCallback(() => {
    Haptics.selectionAsync();
    Animated.timing(fade, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setCurrentTip(tips[Math.floor(Math.random() * tips.length)]);
      Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  }, []);

  return (
    <TouchableOpacity onPress={rotate} activeOpacity={0.88} style={bubStyles.wrap}>
      <Animated.View style={[bubStyles.bubble, { backgroundColor: T.card, opacity: fade }]}>
        <View style={[bubStyles.icon, { backgroundColor: C.primary + '18' }]}>
          <Sparkles size={13} color={C.primary} />
        </View>
        <Text style={[bubStyles.tip, { color: T.dark }]} numberOfLines={0}>{currentTip}</Text>
        <Text style={[bubStyles.hint, { color: T.light }]}>შეეხე ახლისთვის ✨</Text>
      </Animated.View>
      <View style={[bubStyles.tailOuter, { borderLeftColor: 'rgba(0,0,0,0.06)' }]} />
      <View style={[bubStyles.tailInner, { borderLeftColor: T.card }]} />
    </TouchableOpacity>
  );
});

const bubStyles = StyleSheet.create({
  wrap: { flexShrink: 1, paddingRight: TAIL + 2 },
  bubble: {
    borderRadius: 18, borderTopRightRadius: 4,
    padding: 13, gap: 7,
    shadowColor: '#000', shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07, shadowRadius: 14, elevation: 4,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },
  icon: { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  tip: { fontSize: 12.5, fontWeight: '700', lineHeight: 18, flexShrink: 1 },
  hint: { fontSize: 10, fontWeight: '600', opacity: 0.55 },
  tailOuter: {
    position: 'absolute', right: 0, top: 24,
    width: 0, height: 0,
    borderTopWidth: TAIL, borderBottomWidth: TAIL, borderLeftWidth: TAIL + 2,
    borderTopColor: 'transparent', borderBottomColor: 'transparent',
  },
  tailInner: {
    position: 'absolute', right: 2, top: 24,
    width: 0, height: 0,
    borderTopWidth: TAIL, borderBottomWidth: TAIL, borderLeftWidth: TAIL,
    borderTopColor: 'transparent', borderBottomColor: 'transparent',
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 🎯 PREMIUM HEADER (SIDE-BY-SIDE)
// ─────────────────────────────────────────────────────────────────────────────
const SimpleHeader = React.memo(({ userName, T }: { userName: string; T: any }) => (
  <View style={headerStyles.container}>
    <Text style={[headerStyles.name, { color: T.dark }]}>გამარჯობა, {userName || 'ბექა'}! 👋</Text>
    <Text style={[headerStyles.sub, { color: T.mid }]}>რას მოვამზადებთ დღეს?</Text>
  </View>
));

const StatusCardsRow = React.memo(({ consumed, target, tip, C, T, onTipPress, onCaloriePress }: {
  consumed: number; target: number; tip: string; C: any; T: any; onTipPress: () => void; onCaloriePress: () => void;
}) => {
  const progress = Math.min(consumed / target, 1);
  return (
    <View style={statusRowStyles.container}>
      {/* CALORIE CARD */}
      <TouchableOpacity style={[statusRowStyles.card, { backgroundColor: T.card }]} activeOpacity={0.88} onPress={onCaloriePress}>
        <View style={statusRowStyles.cardHeader}>
          <View style={[statusRowStyles.iconCircle, { backgroundColor: C.primary + '15' }]}>
            <Flame size={16} color={C.primary} />
          </View>
          <Text style={[statusRowStyles.cardTitle, { color: T.mid }]}>კალორიები</Text>
        </View>
        <Text style={[statusRowStyles.cardValue, { color: T.dark }]}>{consumed} <Text style={statusRowStyles.cardTarget}>/ {target}</Text></Text>
        <View style={statusRowStyles.progressTrack}>
          <View style={[statusRowStyles.progressFill, { width: `${progress * 100}%`, backgroundColor: C.primary }]} />
        </View>
      </TouchableOpacity>

      {/* TIP CARD */}
      <TouchableOpacity style={[statusRowStyles.card, { backgroundColor: T.card }]} activeOpacity={0.88} onPress={onTipPress}>
        <View style={statusRowStyles.cardHeader}>
          <View style={[statusRowStyles.iconCircle, { backgroundColor: '#FFD70015' }]}>
            <Lightbulb size={16} color="#FFB800" />
          </View>
          <Text style={[statusRowStyles.cardTitle, { color: T.mid }]}>დღის რჩევა</Text>
        </View>
        <Text style={[statusRowStyles.tipText, { color: T.dark }]}>{tip}</Text>
      </TouchableOpacity>
    </View>
  );
});



const headerStyles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  name: { fontSize: 28, fontWeight: '900', letterSpacing: -0.7 },
  sub: { fontSize: 15, fontWeight: '600', opacity: 0.55, marginTop: 4 },
});

const statusRowStyles = StyleSheet.create({
  container: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginVertical: 12 },
  card: { flex: 1, padding: 16, borderRadius: 24, elevation: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  iconCircle: { width: 32, height: 32, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardValue: { fontSize: 21, fontWeight: '900', marginBottom: 10 },
  cardTarget: { fontSize: 12, fontWeight: '700', opacity: 0.4 },
  progressTrack: { height: 6, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  tipText: { fontSize: 12.5, fontWeight: '700', lineHeight: 17 },
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
  const C = React.useMemo(() => getColors(themeId), [themeId]);
  const T = React.useMemo(() => ({
    primary: C.primary, danger: C.red, success: C.primaryDark, warning: C.orange,
    dark: C.ink, mid: C.inkMid, light: C.inkLight,
    bg: C.bg, card: C.surface, border: C.border,
    fontFamily: (Platform.OS === 'ios' ? 'System' : 'sans-serif') as any,
    xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 25,
    r_sm: 12, r_md: 16, r_lg: 20, r_xl: 25,
    fs_xs: 11, fs_sm: 13, fs_md: 15, fs_lg: 17, fs_xl: 20, fs_xxl: 26,
  }), [C]);
  const styles = React.useMemo(() => getStyles(T), [T]);

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
  const swipeScrollRef = useRef<ScrollView>(null);
  const mainScrollRef = useRef<any>(null);
  const headerOpacity = scrollY.interpolate({ inputRange: [0, 80, 150], outputRange: [1, 0.5, 0], extrapolate: 'clamp' });

  React.useEffect(() => { computeMood(intake?.calories || 0, targetCalories || 2000, 0, 8); }, [intake, targetCalories]);

  useFocusEffect(useCallback(() => { loadDataSafely(); useAvatarStore.getState().computeTimeState(); }, []));

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
          // If no profile, force onboarding
          router.replace('/onboarding');
          return;
        }
      } catch { 
        router.replace('/onboarding');
        return;
      }
      try { const f = await AsyncStorage.getItem('favoriteRecipes'); setFavorites(f ? JSON.parse(f) : []); } catch { }
      let list: any[] = [];
      try { const c = await AsyncStorage.getItem('cachedRecipes'); if (c) list = JSON.parse(c).map((r: any) => ({ ...r, image_url: getImageUrl(r.image_url, SERVER_URL) })); } catch { }
      try {
        const res = await fetch(`${SERVER_URL}/recipes/`);
        if (res.ok) {
          const data = await res.json();
          const fresh = Array.isArray(data) ? data : (data?.recipes || []);
          if (fresh.length > 0) { const p = fresh.map((r: any) => ({ ...r, image_url: getImageUrl(r.image_url, SERVER_URL) })); list = p; AsyncStorage.setItem('cachedRecipes', JSON.stringify(p)); }
        } else if (list.length === 0) { setDbStatus('error'); return; }
      } catch { if (list.length === 0) { setDbStatus('error'); return; } }
      if (list.length === 0) { setDbStatus('empty'); return; }
      setDbStatus('ok'); setRecipes(list);
      if (!currentTip) setCurrentTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
      let t: any[] = [];

      try { const s = await AsyncStorage.getItem('trendingData'); if (s) { const td = JSON.parse(s); if (Date.now() - td.timestamp < TRENDING_TTL) t = list.filter((r: any) => td.ids.includes(r.id)); } } catch { }
      if (t.length < 5) { t = [...list].sort(() => 0.5 - Math.random()).slice(0, 6); AsyncStorage.setItem('trendingData', JSON.stringify({ timestamp: Date.now(), ids: t.map((r: any) => r.id) })); }
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
    Animated.sequence([Animated.spring(scale, { toValue: 1.4, useNativeDriver: true, speed: 50, bounciness: 20 }), Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 })]).start();
    try {
      const updated = favorites.includes(recipeId) ? favorites.filter(id => id !== recipeId) : [...favorites, recipeId];
      setFavorites(updated); await AsyncStorage.setItem('favoriteRecipes', JSON.stringify(updated));
      if (!favorites.includes(recipeId)) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { setBrandAlert({ visible: true, title: 'Error', message: 'Failed to update favorites.', type: 'error' }); }
  };

  const handleCategoryPress = useCallback((cat: string) => {
    Haptics.selectionAsync(); setActiveCategory(cat); setSearchQuery('');
    mainScrollRef.current?.scrollTo?.({ y: 0, animated: true });
    const catIdx = CATEGORIES.indexOf(cat);
    requestAnimationFrame(() => {
      categoryScrollRef.current?.scrollTo({ x: Math.max(0, catIdx * 80 - 50), animated: true });
      if (cat !== 'აღმოაჩინე') { const si = SWIPE_CATEGORIES.indexOf(cat); if (si !== -1) swipeScrollRef.current?.scrollTo({ x: si * SW, animated: true }); }
    });
  }, []);

  const handleSwipeScroll = useCallback((e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SW);
    const newCat = SWIPE_CATEGORIES[idx];
    if (newCat && newCat !== activeCategory) { setActiveCategory(newCat); categoryScrollRef.current?.scrollTo({ x: Math.max(0, CATEGORIES.indexOf(newCat) * 80 - 50), animated: true }); }
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
  const progressPct = Math.min((safeConsumed / safeTarget) * 100, 100);
  const goalTitle = userGoal === 'lose' ? "ულტრა-მსუბუქი (< 350 კკალ)" : userGoal === 'gain' ? "პროტებომბები (> 500 კკალ)" : "ოქროს შუალედი";
  const GoalIcon = userGoal === 'gain' ? Activity : Star;
  const goalColor = userGoal === 'lose' ? T.primary : userGoal === 'gain' ? T.danger : T.success;

  const SectionHeader = ({ title, icon: Icon, color, data }: any) => (
    <View style={styles.sectionHeader}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Icon size={22} color={color} style={{ marginRight: T.sm }} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {data?.length > 0 && <TouchableOpacity onPress={() => { Haptics.selectionAsync(); setViewAllSection({ title, data }); }} activeOpacity={0.7}><Text style={styles.seeAllText}>ნახვა</Text></TouchableOpacity>}
    </View>
  );

  const renderGridCard = useCallback((recipe: any, idx: number) => {
    if (!recipe) return null;
    const rId = recipe.id?.toString() || recipe.name;
    const isFav = favorites.includes(rId); const scale = getHeartScale(rId);
    return (
      <TouchableOpacity key={idx} style={styles.gridCard} activeOpacity={0.85}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/details/${recipe.id}`); }}>
        <Image source={{ uri: recipe.image_url || 'https://via.placeholder.com/150' }} style={styles.gridImg} contentFit="cover" transition={250} placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }} />
        <TouchableOpacity style={styles.heartBtnGrid} onPress={() => toggleFavorite(rId)} activeOpacity={0.8}>
          <Animated.View style={{ transform: [{ scale }] }}><Heart size={18} color={isFav ? T.danger : '#FFF'} fill={isFav ? T.danger : 'rgba(0,0,0,0.3)'} /></Animated.View>
        </TouchableOpacity>
        <View style={styles.gridInfo}>
          <Text style={styles.gridName} numberOfLines={2}>{recipe.name}</Text>
          <View style={styles.gridMetaRow}>
            <View style={styles.metaBadge}><Clock size={10} color={T.mid} /><Text style={styles.gridMetaText}> {recipe.prep_time || 0}წთ</Text></View>
            <View style={[styles.metaBadge, { backgroundColor: 'rgba(255,71,87,0.1)' }]}><Flame size={10} color={T.danger} /><Text style={[styles.gridMetaText, { color: T.danger }]}> {recipe.total_calories || 0}</Text></View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [favorites]);

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
              const rId = recipe.id?.toString(); const isFav = favorites.includes(rId); const scale = getHeartScale(rId);
              return (
                <TouchableOpacity key={idx} style={styles.trendingCard} activeOpacity={0.88}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/details/${recipe.id}`); }}>
                  <Image source={{ uri: recipe.image_url }} style={styles.trendingImg} contentFit="cover" transition={250} placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }} />
                  <TouchableOpacity style={styles.heartBtn} onPress={() => toggleFavorite(rId)} activeOpacity={0.8}>
                    <Animated.View style={{ transform: [{ scale }] }}><Heart size={20} color={isFav ? T.danger : '#FFF'} fill={isFav ? T.danger : 'rgba(0,0,0,0.3)'} /></Animated.View>
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
              <TouchableOpacity key={idx} style={styles.proteinCard} activeOpacity={0.88} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/details/${r.id}`); }}>
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
              <TouchableOpacity key={idx} style={styles.quickCard} activeOpacity={0.88} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/details/${r.id}`); }}>
                <Image source={{ uri: r.image_url }} style={styles.quickImg} contentFit="cover" transition={250} placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }} />
                <View style={styles.quickInfo}><Text style={styles.quickName} numberOfLines={2}>{r.name}</Text><Text style={styles.quickTime}>{r.prep_time || 0} წუთი</Text></View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        <SectionHeader title={goalTitle} icon={GoalIcon} color={goalColor} data={goalBasedRecipes} />
        {goalBasedRecipes.length > 0 && (
          <View style={styles.verticalListContainer}>
            {goalBasedRecipes.slice(0, 5).map((r, idx) => !r ? null : (
              <TouchableOpacity key={idx} style={styles.verticalCard} activeOpacity={0.88} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/details/${r.id}`); }}>
                <Image source={{ uri: r.image_url }} style={styles.verticalImg} contentFit="cover" transition={250} placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }} />
                <View style={styles.verticalInfo}><Text style={styles.verticalName} numberOfLines={2}>{r.name}</Text><View style={styles.verticalMeta}><Text style={styles.verticalCals}>{r.total_calories || 0} კკალ</Text></View></View>
                <ChevronRight size={20} color={T.light} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderCategoryGrid = useCallback((catName: string) => {
    const data = getFilteredData(catName);
    if (data.length === 0) return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconWrap}><Search size={36} color={T.light} /></View>
        <Text style={styles.emptyTitle}>{catName === 'ფავორიტები' ? 'ჯერ ფავორიტი არ გაქვს' : 'რეცეპტი ვერ მოიძებნა'}</Text>
        <Text style={styles.emptySub}>{catName === 'ფავორიტები' ? 'დააჭირე ❤️ ღილაკს, რომ შეინახო.' : 'ამ კატეგორიაში ჯერ არაფერი გვაქვს.'}</Text>
      </View>
    );
    return <FlatList data={data} keyExtractor={(item, i) => item.id?.toString() || i.toString()} numColumns={2}
      columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: T.xl }}
      contentContainerStyle={{ paddingTop: T.md, paddingBottom: 40 }}
      renderItem={({ item, index }) => renderGridCard(item, index)} scrollEnabled={false} removeClippedSubviews />;
  }, [getFilteredData, renderGridCard]);

  const renderStatusScreen = () => {
    if (dbStatus === 'error') return (
      <View style={styles.brandedStateContainer}>
        <View style={[styles.stateIconBg, { backgroundColor: 'rgba(255,71,87,0.1)' }]}><WifiOff size={55} color={T.danger} /></View>
        <Text style={styles.stateTitle}>კავშირის ერორი 📡</Text>
        <Text style={styles.stateSub}>სერვერთან დაკავშირება ვერ მოხერხდა.</Text>
        <TouchableOpacity style={[styles.brandedRetryBtn, { backgroundColor: T.danger }]} onPress={() => loadDataSafely()} activeOpacity={0.8}>
          <RotateCcw size={18} color="#FFF" style={{ marginRight: T.sm }} /><Text style={styles.brandedRetryText}>თავიდან ცდა</Text>
        </TouchableOpacity>
      </View>
    );
    if (dbStatus === 'empty') return (
      <View style={styles.brandedStateContainer}>
        <View style={[styles.stateIconBg, { backgroundColor: 'rgba(255,165,2,0.1)' }]}><Database size={55} color={T.warning} /></View>
        <Text style={styles.stateTitle}>ბაზა ცარიელია 🍽️</Text>
        <Text style={styles.stateSub}>გაუშვით "python seed.py" ტერმინალში.</Text>
        <TouchableOpacity style={[styles.brandedRetryBtn, { backgroundColor: T.warning }]} onPress={() => loadDataSafely()} activeOpacity={0.8}>
          <RefreshCw size={18} color="#FFF" style={{ marginRight: T.sm }} /><Text style={styles.brandedRetryText}>ბაზის შემოწმება</Text>
        </TouchableOpacity>
      </View>
    );
    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.ScrollView ref={mainScrollRef} showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16} stickyHeaderIndices={[1]}
        contentContainerStyle={{ paddingBottom: activeCategory === 'აღმოაჩინე' ? (Platform.OS === 'ios' ? 100 : 80) : 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onPullRefresh} tintColor={T.primary} colors={[T.primary]} />}>

        {/* INDEX 0 */}
        <Animated.View style={{ opacity: headerOpacity, overflow: 'hidden' }}>
          {!viewAllSection && <SimpleHeader userName={userName} T={T} />}
          {!viewAllSection && (
            <StatusCardsRow
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




        {/* INDEX 1 — Sticky */}
        <View style={styles.stickySearchWrapper}>
          <View style={styles.searchContainer}>
            <Search size={20} color={T.light} style={{ marginRight: T.sm }} />
            <TextInput style={styles.searchInput} placeholder="მოძებნე რეცეპტი..." placeholderTextColor={T.light}
              value={searchQuery} onChangeText={(text) => { setSearchQuery(text); if (text.length > 0 && activeCategory !== 'აღმოაჩინე') handleCategoryPress('აღმოაჩინე'); }} />
            {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}><XCircle size={18} color={T.light} /></TouchableOpacity>}
          </View>
          <ScrollView ref={categoryScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScrollContent}>
            {CATEGORIES.map((cat, i) => {
              const isActive = activeCategory === cat; const isSpecial = cat === 'აღმოაჩინე';
              return (
                <TouchableOpacity key={i} style={[styles.categoryPill, isActive && styles.categoryPillActive, isSpecial && !isActive && styles.categoryPillSpecial]}
                  onPress={() => handleCategoryPress(cat)} activeOpacity={0.8} hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}>
                  {cat === 'ფავორიტები' && <Heart size={13} color={isActive ? '#FFF' : T.mid} style={{ marginRight: 5 }} fill={isActive ? '#FFF' : 'transparent'} />}
                  {isSpecial && !isActive && <Zap size={13} color={T.primary} style={{ marginRight: 5 }} fill={T.primary} />}
                  <Text style={[styles.categoryPillText, isActive && styles.categoryPillTextActive, isSpecial && !isActive && { color: T.primary }]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* INDEX 2 */}
        <View style={styles.contentContainer}>
          {viewAllSection ? (
            <View style={{ paddingBottom: 40, paddingTop: 15 }}>
              <View style={styles.viewAllHeader}>
                <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setViewAllSection(null); }} style={styles.backBtn} activeOpacity={0.7}><ArrowLeft size={20} color={T.dark} /></TouchableOpacity>
                <Text style={styles.viewAllTitle}>{viewAllSection.title}</Text>
              </View>
              <FlatList data={viewAllSection.data} keyExtractor={(item, i) => item.id?.toString() || i.toString()} numColumns={2}
                columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: T.xl }} contentContainerStyle={{ paddingBottom: 40 }}
                renderItem={({ item, index }) => renderGridCard(item, index)} scrollEnabled={false} removeClippedSubviews />
            </View>
          ) : (dbStatus === 'error' || dbStatus === 'empty') ? renderStatusScreen()
            : activeCategory === 'აღმოაჩინე' ? (
              searchQuery.trim() !== '' ? (
                <View style={{ paddingTop: 15 }}>
                  <View style={{ paddingHorizontal: T.xl, marginBottom: T.md }}><Text style={styles.searchResultsLabel}>"{searchQuery}" — {getFilteredData('აღმოაჩინე').length} რეცეპტი</Text></View>
                  {renderCategoryGrid('აღმოაჩინე')}
                </View>
              ) : renderDiscoverContent()
            ) : (
              <View style={{ minHeight: Dimensions.get('window').height * 0.6, height: tabHeights[activeCategory] || undefined, overflow: 'hidden', paddingTop: 15 }}>
                <ScrollView ref={swipeScrollRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={handleSwipeScroll} scrollEventThrottle={16}>
                  {SWIPE_CATEGORIES.map((cat, i) => (
                    <View key={i} style={{ width: SW }}
                      onLayout={(e) => { const h = Math.round(e.nativeEvent.layout.height); if (Math.abs((tabHeights[cat] || 0) - h) > 30) setTabHeights(prev => ({ ...prev, [cat]: h })); }}>
                      {renderCategoryGrid(cat)}
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
        </View>
      </Animated.ScrollView>

      <Modal visible={brandAlert.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderWidth: 2, borderColor: brandAlert.type === 'error' ? T.danger : brandAlert.type === 'success' ? T.success : T.warning }]}>
            <View style={styles.brandAlertIconBg}>
              {brandAlert.type === 'success' ? <CheckCircle2 size={60} color={T.success} /> : brandAlert.type === 'error' ? <XCircle size={60} color={T.danger} /> : <AlertCircle size={60} color={T.warning} />}
            </View>
            <Text style={styles.modalTitle}>{brandAlert.title}</Text>
            <Text style={styles.brandAlertMessage}>{brandAlert.message}</Text>
            <TouchableOpacity style={[styles.brandedRetryBtn, { width: '100%', justifyContent: 'center', backgroundColor: brandAlert.type === 'error' ? T.danger : brandAlert.type === 'success' ? T.success : T.warning }]}
              onPress={() => setBrandAlert({ ...brandAlert, visible: false })}>
              <Text style={{ fontFamily: T.fontFamily, color: '#FFF', fontWeight: 'bold', fontSize: T.fs_md }}>გასაგებია</Text>
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
  calorieCard: { width: '100%', backgroundColor: T.card, borderRadius: T.r_xl, paddingVertical: 14, paddingHorizontal: 16, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  calorieRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  calorieLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  calorieIconCircle: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  calorieConsumed: { fontFamily: T.fontFamily, fontSize: 22, fontWeight: '900', color: T.dark },
  calorieOfTarget: { fontSize: 13, fontWeight: '600', color: T.mid },
  calorieSub: { fontFamily: T.fontFamily, fontSize: 10, fontWeight: '600', color: T.light, marginTop: 1 },
  calorieRight: { alignItems: 'flex-end' },
  calorieRemainBig: { fontFamily: T.fontFamily, fontSize: 24, fontWeight: '900' },
  calorieRemainSub: { fontFamily: T.fontFamily, fontSize: 10, fontWeight: '600', color: T.light, marginTop: 1 },
  calProgressTrack: { height: 7, backgroundColor: T.border, borderRadius: 4, overflow: 'hidden' },
  calProgressFill: { height: '100%', borderRadius: 4 },
  stickySearchWrapper: { backgroundColor: T.bg, paddingTop: T.sm, paddingBottom: 4, zIndex: 100, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.card, marginHorizontal: T.xl, marginBottom: 12, borderRadius: 15, paddingHorizontal: T.md, height: 46, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  searchInput: { flex: 1, fontFamily: T.fontFamily, fontSize: T.fs_md, color: T.dark, fontWeight: '600' },
  categoriesScrollContent: { paddingHorizontal: T.xl, paddingBottom: T.sm, gap: T.sm },
  categoryPill: { flexDirection: 'row', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 15, backgroundColor: T.card, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  categoryPillActive: { backgroundColor: T.primary, borderColor: T.primary, elevation: 3, shadowColor: T.primary, shadowOpacity: 0.3, shadowRadius: 5 },
  categoryPillSpecial: { borderColor: T.primary, borderWidth: 2, shadowColor: T.primary, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
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
  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 30 },
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
