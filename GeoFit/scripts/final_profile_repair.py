import sys
import re

filepath = r'c:\Users\Beka\Desktop\GeoFitApp\GeoFit\app\(tabs)\profile.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Fix the getStyles generator to remove duplicates and be clean
# I will find the duplicate sheet: and rename it.
# I'll also rename the pw and modal specific ones.

# First, fix the component setup
comp_old = "export default function ProfileScreen() {"
comp_new = """export default function ProfileScreen() {
  const { themeId } = useThemeStore();
  const C = React.useMemo(() => getColors(themeId), [themeId]);
  const S = React.useMemo(() => getStyles(C, BOTTOM), [C]);
"""
text = text.replace(comp_old, comp_new)

# 2. Fix JSX usage: Replace styles. with S. and ms. with S. and pw. with S.
text = re.sub(r'style=\{styles\.', 'style={S.', text)
text = re.sub(r'style=\{ms\.',     'style={S.', text)
text = re.sub(r'style=\{pw\.',     'style={S.', text)
text = re.sub(r'style=\{PW\.',     'style={S.', text)

# 3. Fix the generator keys in getStyles
# I'll rename the second 'sheet:' to 'modalSheet:' and the third etc.

# Actually, I'll just write a CLEAN getStyles at the end.
# I'll find where // ─── STYLES ─── starts and replace everything after it.

styles_start = text.find('// ─── STYLES ───')
if styles_start != -1:
    # I'll keep the BOTTOM constant
    text = text[:styles_start] + """// ─── STYLES ───────────────────────────────────────────────────────────────────
const BOTTOM = Platform.OS === 'ios' ? 34 : 16;

const getStyles = (C: any, BOTTOM: number) => StyleSheet.create({
  // Main Profile Styles
  root: { flex: 1, backgroundColor: C.bg, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0 },
  scroll: { padding: 20, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.bg },
  headerBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  headerBtnPrimary: { width: 40, height: 40, borderRadius: 14, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.primaryBorder },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle:  { fontSize: 16, fontWeight: '800', color: C.ink, letterSpacing: 0.3 },

  heroCard: { backgroundColor: C.surface, borderRadius: 28, padding: 22, marginBottom: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 15, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
  heroGlow: { position: 'absolute', width: 200, height: 200, borderRadius: 100 },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  avatarWrap: { position: 'relative' },
  avatarRing: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.surfaceMid, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.primaryBorder },
  avatarEmoji:   { fontSize: 36 },
  avatarEditBadge: { position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.surface },
  heroIdentity: { flex: 1 },
  heroName:     { fontSize: 22, fontWeight: '900', color: C.ink, letterSpacing: -0.3 },
  heroPillRow:  { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  heroPillGreen: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.primaryLight, borderWidth: 1, borderColor: C.primaryBorder, paddingHorizontal: 9, paddingVertical: 4, borderRadius: C.r_full },
  heroPillOrange:{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.orangeLight, borderWidth: 1, borderColor: C.orangeBorder, paddingHorizontal: 9, paddingVertical: 4, borderRadius: C.r_full },
  heroPillBlue:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.blueLight,  borderWidth: 1, borderColor: C.blueBorder,  paddingHorizontal: 9, paddingVertical: 4, borderRadius: C.r_full },
  heroPillGray:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.surfaceMid, borderWidth: 1, borderColor: C.border, paddingHorizontal: 9, paddingVertical: 4, borderRadius: C.r_full },
  heroPillText:  { fontSize: 11, fontWeight: '700' },
  proBadgeRefined: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#022C22', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginLeft: 8, borderWidth: 1, borderColor: C.proBorder },
  proBadgeTxtRefined: { color: C.proText, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  shareBtn:      { width: 40, height: 40, borderRadius: 14, backgroundColor: C.primaryLight, borderWidth: 1, borderColor: C.primaryBorder, alignItems: 'center', justifyContent: 'center' },
  heroDivider:   { height: 1, backgroundColor: C.borderLight, marginBottom: 16 },
  heroStatsRow:  { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },

  statChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.surfaceMid, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: C.border, flex: 1, minWidth: 70 },
  statChipIcon: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statChipVal:  { fontSize: 13, fontWeight: '800', color: C.ink },
  statChipLabel:{ fontSize: 10, color: C.inkMid, fontWeight: '700' },

  // Paywall Banner
  proBanner: { backgroundColor: C.proBg, borderRadius: 24, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: C.gold, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  proBannerBgGlow: { position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: C.gold, opacity: 0.1 },
  proBannerContent: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  proBannerIconWrap: { width: 48, height: 48, borderRadius: 16, backgroundColor: C.goldLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)' },
  proBannerTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', marginBottom: 4 },
  proBannerSub: { color: C.proText, fontSize: 12, fontWeight: '600', lineHeight: 18 },
  proBannerArrowWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },

  avatarGrid: { backgroundColor: C.surface, borderRadius: 24, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  avatarGridTitle: { color: C.inkLight, fontSize: 12, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  avatarGridRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiBtn:        { width: 48, height: 48, borderRadius: 14, backgroundColor: C.surfaceMid, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  emojiBtnActive:  { backgroundColor: C.primaryLight, borderColor: C.primaryBorder },

  card: { backgroundColor: C.surface, borderRadius: 24, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  cardIconWrap:{ width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle:   { fontSize: 15, fontWeight: '800', color: C.ink },
  cardSub:     { fontSize: 11, color: C.inkMid, marginTop: 1, fontWeight: '600' },

  // Streak
  streakPremiumBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.orangeLight, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: C.orangeBorder },
  streakPremiumIcon:  { width: 30, height: 30, borderRadius: 10, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginRight: 8, shadowColor: C.orange, shadowOpacity: 0.2, shadowRadius: 5, elevation: 2 },
  streakPremiumNum:   { fontSize: 18, fontWeight: '900', color: C.orange, lineHeight: 20 },
  streakPremiumTxt:   { fontSize: 10, color: C.orange, fontWeight: '700', textTransform: 'uppercase' },
  streakDotsRow:  { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  streakDayWrap:  { alignItems: 'center', gap: 5, flex: 1 },
  streakDot:      { width: 32, height: 32, borderRadius: 16, backgroundColor: C.surfaceMid, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  streakDotFilled:{ backgroundColor: C.primary, borderColor: C.primary },
  streakDotCurrent:{ shadowColor: C.orange, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5, backgroundColor: C.orange, borderColor: C.orange },
  streakDayLabel: { fontSize: 9, fontWeight: '700', color: C.inkMid },

  // Weight
  weightCard: { backgroundColor: C.surface, borderRadius: 24, padding: 22, marginBottom: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  weightCardReached: { borderColor: C.primaryBorder },
  weightCardGlowBg:  { position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: C.primary, opacity: 0.04 },
  weightTopRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  weightEyebrow: { fontSize: 10, color: C.inkLight, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 },
  weightDisplay: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  weightBig:     { fontSize: 58, fontWeight: '900', color: C.ink, letterSpacing: -3 },
  weightDecimal: { fontSize: 22, fontWeight: '800', color: C.inkMid, marginBottom: 14 },
  weightUnit:    { fontSize: 14, color: C.inkMid, fontWeight: '700', marginBottom: 2 },
  deltaPill:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  deltaTxt:      { fontSize: 13, fontWeight: '800' },
  reachedPill:   { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.goldLight, borderWidth: 1, borderColor: C.goldBorder, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  reachedTxt:    { color: C.gold, fontSize: 12, fontWeight: '800' },
  progressRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  progressTrack: { flex: 1, height: 6, backgroundColor: C.surfaceMid, borderRadius: 3, overflow: 'hidden' },
  progressBar:   { height: '100%', backgroundColor: C.primary, borderRadius: 3 },
  progressGlowTip:{ position: 'absolute', right: 0, top: -3, width: 12, height: 12, borderRadius: 6, backgroundColor: C.primary, shadowColor: C.primary, shadowOpacity: 0.5, shadowRadius: 6, elevation: 3 },
  progressLabel: { fontSize: 12, fontWeight: '800', color: C.inkMid, width: 36, textAlign: 'right' },
  weightFooter:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTopWidth: 1, borderColor: C.borderLight },
  weightFooterTxt:  { fontSize: 12, color: C.inkLight, fontWeight: '600' },
  weightFooterRight:{ fontSize: 12, fontWeight: '800', color: C.inkMid },

  // Water
  waterCard: { backgroundColor: C.surface, borderRadius: 24, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: C.blueBorder, shadowColor: C.blue, shadowOpacity: 0.08, shadowRadius: 15, elevation: 4 },
  waterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  waterIconBg: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.blueLight, justifyContent: 'center', alignItems: 'center' },
  waterTitle: { fontSize: 16, fontWeight: '800', color: C.ink },
  waterSub: { fontSize: 13, color: C.blue, fontWeight: '800', marginTop: 2 },
  waterHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  waterResetBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.surfaceMid, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border },
  waterBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.blue, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
  waterBtnTxt: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  waterTrack: { height: 16, backgroundColor: C.blueLight, borderRadius: 8, overflow: 'hidden' },
  waterFill: { height: '100%', backgroundColor: C.blue, borderRadius: 8 },
  waterSuccess: { fontSize: 12, fontWeight: '800', color: C.primaryDark, marginTop: 10, textAlign: 'center' },

  // AI & Diary
  logBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 30, paddingVertical: 18, marginBottom: 20, overflow: 'hidden', shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  logBtnGlow: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.1)' },
  logBtnTxt:  { color: '#FFF', fontWeight: '800', fontSize: 16, letterSpacing: 0.3 },
  cooldownRow:{ backgroundColor: C.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 17, borderRadius: 30, marginBottom: 20, borderWidth: 1, borderColor: C.border },
  cooldownTxt:{ color: C.inkLight, fontSize: 14, fontWeight: '600' },
  cooldownTime: { color: C.ink, fontWeight: '800', fontVariant: ['tabular-nums'] },
  macroBarWrap:   { gap: 6 },
  macroBarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  macroBarIcon:   { width: 22, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  macroBarLabel:  { fontSize: 11, fontWeight: '700', color: C.inkMid }, 
  macroBarVal:    { fontSize: 13, fontWeight: '900' },
  macroBarUnit:   { fontSize: 10, color: C.inkLight, fontWeight: '600' },
  macroBarBg:     { height: 6, backgroundColor: C.surfaceMid, borderRadius: 3, overflow: 'hidden' },
  macroBarFill:   { height: '100%', borderRadius: 3, position: 'relative' },
  calorieRow:   { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  calorieCircle:{ width: 88, height: 88, borderRadius: 44, backgroundColor: C.surfaceMid, borderWidth: 3, borderColor: C.primaryBorder, alignItems: 'center', justifyContent: 'center' }, 
  calorieNum:   { fontSize: 20, fontWeight: '900', color: C.primary },
  calorieLabel: { fontSize: 11, color: C.inkMid, fontWeight: '700' },
  calorieMeta:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  calorieMetaLabel: { fontSize: 13, color: C.inkMid, fontWeight: '700' }, 
  calorieMetaVal:   { fontSize: 14, fontWeight: '800', textAlign: 'right', color: C.ink },

  // Charts
  chartControls:    { gap: 12, marginBottom: 4 },
  chartTypeToggle:  { flexDirection: 'row', backgroundColor: C.surfaceMid, borderRadius: 12, padding: 3 },
  chartTypeBtn:     { flex: 1, flexDirection: 'row', gap: 6, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  chartTypeBtnActive:{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  chartTypeTxt:     { fontSize: 12, fontWeight: '700', color: C.inkLight },
  chartTypeTxtActive:{ color: C.ink, fontWeight: '800' },
  chartRangeRow:    { flexDirection: 'row', gap: 6 },
  rangeBtn:         { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: C.surfaceMid },
  rangeBtnActive:   { backgroundColor: C.primaryLight, borderWidth: 1, borderColor: C.primaryBorder },
  rangeTxt:         { fontSize: 11, fontWeight: '600', color: C.inkLight },
  rangeTxtActive:   { color: C.primaryDark, fontWeight: '800' },

  // AI Insights
  unverifiedWarning: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.orangeLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start', marginTop: 10, marginBottom: 4 },
  unverifiedWarningText: { color: C.orange, fontSize: 11, fontWeight: '800' },
  aiInsight:        { backgroundColor: C.surfaceMid, borderRadius: 16, padding: 14, marginTop: 12, borderWidth: 1, borderColor: C.border },
  aiInsightHeader:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  aiInsightTitle:   { fontSize: 10, fontWeight: '900', color: C.primaryDark, textTransform: 'uppercase', letterSpacing: 1 },
  aiInsightTxt:     { fontSize: 13, color: C.inkMid, fontWeight: '600', lineHeight: 20 },

  // Sections & Badges
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 },
  sectionTitle:  { fontSize: 17, fontWeight: '900', color: C.ink },
  sectionAction: { fontSize: 13, fontWeight: '700', color: C.primary },
  badgeCard: { padding: 14, borderRadius: 20, alignItems: 'center', width: 96, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  badgeCardLocked: { opacity: 0.6 },
  badgeIconWrap:   { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8, borderWidth: 1 },
  badgeLabel:      { fontSize: 11, fontWeight: '800', color: C.ink, textAlign: 'center' },
  badgeDesc:       { fontSize: 9, color: C.inkMid, textAlign: 'center', marginTop: 3, fontWeight: '600' },

  // Summary Tiles
  summaryRow:  { flexDirection: 'row', gap: 10 },
  summaryTile: { flex: 1, backgroundColor: C.surfaceMid, borderRadius: 16, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1 },
  summaryVal:  { fontSize: 16, fontWeight: '900' },
  summaryLabel:{ fontSize: 10, color: C.inkMid, fontWeight: '700', textAlign: 'center' },

  // Settings & Account
  settingsGroup:   { backgroundColor: C.surface, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: C.border, marginBottom: 14 },
  settingsRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16 },
  settingsIconWrap:{ width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  settingsTitle:   { fontSize: 15, fontWeight: '700', color: C.ink },
  settingsSub:     { fontSize: 11, color: C.inkMid, marginTop: 1, fontWeight: '500' },
  settingsDivider: { height: 1, backgroundColor: C.borderLight, marginLeft: 66 },
  settingsBadge:   { backgroundColor: C.primaryLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: C.primaryBorder },
  settingsBadgeText:{ fontSize: 11, fontWeight: '800', color: C.primaryDark },
  versionTxt:      { textAlign: 'center', fontSize: 11, color: C.inkFaint, marginTop: 8, marginBottom: 16, fontWeight: '600' },

  // Paywall Specific (formerly PW)
  pwOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  pwSheet: { backgroundColor: C.proBg, padding: 24, paddingBottom: Platform.OS === 'ios' ? 50 : 40, borderTopLeftRadius: 35, borderTopRightRadius: 35, alignItems: 'center' },
  pwIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.goldLight, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.4)' },
  pwTitle: { color: '#FFF', fontSize: 22, fontWeight: '900', marginBottom: 16, textAlign: 'center', lineHeight: 30 },
  pwMainText: { color: '#D1FAE5', fontSize: 13, fontWeight: '500', textAlign: 'center', lineHeight: 20, paddingHorizontal: 5, marginBottom: 24 },
  pwCompareBox: { width: '100%', backgroundColor: C.proBox, paddingHorizontal: 20, paddingTop: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)', marginBottom: 24 },
  pwCompareHeader: { flexDirection: 'row', paddingBottom: 12, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 10, alignItems: 'center' },
  pwCompareHeaderFree: { flex: 1, color: '#94A3B8', fontSize: 12, fontWeight: '800', textAlign: 'right', textTransform: 'uppercase' },
  pwCompareHeaderPro: { flex: 1, color: C.gold, fontSize: 12, fontWeight: '900', textAlign: 'left', textTransform: 'uppercase' },
  pwCompareRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  pwCompareLabelWrap: { flex: 1.5, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  pwCompareLabel: { color: '#FFF', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  pwCompareFree: { flex: 1, color: '#94A3B8', fontSize: 12, fontWeight: '600', textAlign: 'right' },
  pwComparePro: { flex: 1, color: C.gold, fontSize: 12, fontWeight: '800', textAlign: 'left' },
  pwBuyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.gold, width: '100%', paddingVertical: 18, borderRadius: 100, marginBottom: 10 },
  pwBuyBtnTxt: { color: '#000', fontSize: 16, fontWeight: '900', marginRight: 4 },
  pwCancelWrapper: { minHeight: 50, justifyContent: 'center', alignItems: 'center', width: '100%' },
  pwCancelBtn: { paddingVertical: 12, paddingHorizontal: 20 },
  pwCancelTxt: { color: '#A7F3D0', fontSize: 15, fontWeight: '700', textAlign: 'center', includeFontPadding: false },

  // Modal Specific (formerly ms)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: C.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, borderTopWidth: 1, borderColor: C.border, paddingHorizontal: 24, paddingTop: 14, paddingBottom: BOTTOM + 20, alignItems: 'center' },
  modalSheetHandle: { width: 40, height: 4, backgroundColor: C.surfaceMid, borderRadius: 2, marginBottom: 24 },
  modalSheetIconWrap: { width: 72, height: 72, borderRadius: 24, backgroundColor: C.surfaceMid, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  modalSheetTitle: { fontSize: 22, fontWeight: '800', color: C.ink, marginBottom: 8, textAlign: 'center' },
  modalSheetSub: { fontSize: 14, color: C.inkMid, textAlign: 'center', lineHeight: 20, marginBottom: 24, paddingHorizontal: 10, fontWeight: '600' },
  modalSheetClose: { position: 'absolute', top: 18, right: 20, padding: 4 },
  modalPromoInput: { width: '100%', backgroundColor: C.surfaceMid, borderRadius: 16, padding: 18, fontSize: 18, fontWeight: '800', color: C.ink, textAlign: 'center', marginBottom: 20, borderWidth: 1, borderColor: C.border, textTransform: 'uppercase' },
  modalWeightInput: { width: '100%', backgroundColor: C.surfaceMid, borderRadius: 20, padding: 20, fontSize: 46, fontWeight: '900', color: C.ink, textAlign: 'center', marginBottom: 20, letterSpacing: -1.5, borderWidth: 1, borderColor: C.border },
  modalBtnRow: { flexDirection: 'row', gap: 10, width: '100%' },
  modalSolidBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.primary, paddingVertical: 18, borderRadius: 18 },
  modalSolidBtnTxt: { color: '#FFF', fontWeight: '900', fontSize: 16 },
  modalGhostBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.surfaceMid, paddingVertical: 18, borderRadius: 18, borderWidth: 1, borderColor: C.border },
  modalGhostBtnTxt: { color: C.ink, fontWeight: '800', fontSize: 16 },

  // Alerts & FAQ (formerly shared with modal)
  alertCard: { backgroundColor: C.surface, borderRadius: 28, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: C.border, width: '100%', maxHeight: '85%', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  alertIconBg: { padding: 18, borderRadius: 44, marginBottom: 14 },
  alertTitle: { fontSize: 20, fontWeight: '900', color: C.ink, marginBottom: 10, textAlign: 'center' },
  alertMsg: { fontSize: 14, color: C.inkMid, textAlign: 'center', lineHeight: 22, marginBottom: 14, fontWeight: '600' },
  faqItem: { backgroundColor: C.surfaceMid, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  faqItemOpen: { backgroundColor: C.surface, borderColor: C.primaryBorder },
  faqRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQ: { fontSize: 14, fontWeight: '800', color: C.ink, flex: 1, paddingRight: 10, lineHeight: 20 },
  faqA: { fontSize: 13, color: C.inkMid, fontWeight: '600', marginTop: 10, lineHeight: 20 },
  supportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, paddingVertical: 18, borderRadius: 18, marginTop: 10, shadowColor: C.primary, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  supportBtnTxt: { color: '#FFF', fontSize: 15, fontWeight: '900' },

  // Camera (formerly shared)
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  cameraOverlay: { flex: 1, justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.25)' },
  cameraHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'android' ? 48 : 28 },
  camCloseBtn: { padding: 8, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 22 },
  camTitle: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  cameraTarget: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  targetHint: { color: '#FFF', fontSize: 15, fontWeight: '800', marginBottom: 18, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 8 },
  scaleFrame: { width: 240, height: 110, borderWidth: 2, borderColor: C.primary, borderRadius: 18, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(29,185,84,0.15)' },
  feetRow: { flexDirection: 'row', alignItems: 'center', marginTop: 26, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  feetText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  cameraFooter: { paddingBottom: 56, alignItems: 'center' },
  captureBtnOuter: { width: 76, height: 76, borderRadius: 38, borderWidth: 3.5, borderColor: 'rgba(255,255,255,0.6)', justifyContent: 'center', alignItems: 'center' },
  captureBtnInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: C.primary },
  previewOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-between' },
  previewHeader: { padding: 20, paddingTop: Platform.OS === 'android' ? 48 : 38, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  previewTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  previewFooter: { flexDirection: 'row', justifyContent: 'space-around', padding: 28, backgroundColor: 'rgba(0,0,0,0.6)', paddingBottom: Platform.OS === 'ios' ? 44 : 28 },
  retakeBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 22, paddingVertical: 14, borderRadius: 16 },
  retakeText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.primary, paddingHorizontal: 26, paddingVertical: 14, borderRadius: 16 },
  confirmText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
});
"""

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)
f.close()
