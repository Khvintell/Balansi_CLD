import sys
import re

filepath = r'c:\Users\Beka\Desktop\GeoFitApp\GeoFit\app\(tabs)\index.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

# I will fix the T availability by ensuring T is passed to skeletons or just fixing the scope correctly.
# Actually, the simplest fix is to make sure T is correctly defined.
# I will move the Skeletons OUTSIDE the component again and give them props.

skeleton_defs = """
const SkeletonPulse = ({ style, T }: { style?: any, T: any }) => {
  const anim = React.useRef(new Animated.Value(0.4)).current;
  React.useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
    ])).start();
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
"""

# Remove the internal versions
text = re.sub(r'const SkeletonPulse = \(.*?\);\s*};', '', text, flags=re.DOTALL)
text = re.sub(r'const GridCardSkeleton = \(.*?\) => \(.*?\);', '', text, flags=re.DOTALL)
text = re.sub(r'const TrendingCardSkeleton = \(.*?\) => \(.*?\);', '', text, flags=re.DOTALL)

# Insert external skeletons before the component
text = text.replace('export default function HomeScreen() {', skeleton_defs + '\nexport default function HomeScreen() {')

# Fix the calls inside renderDiscoverContent
text = text.replace('{[0,1,2].map(i => <TrendingCardSkeleton key={i} />)}', '{[0,1,2].map(i => <TrendingCardSkeleton key={i} T={T} styles={styles} />)}')
text = text.replace('{[0,1,2,3].map(i => <GridCardSkeleton key={i} />)}', '{[0,1,2,3].map(i => <GridCardSkeleton key={i} T={T} styles={styles} />)}')
text = text.replace('<TrendingCardSkeleton key={i} />', '<TrendingCardSkeleton key={i} T={T} styles={styles} />')
text = text.replace('<GridCardSkeleton key={i} />', '<GridCardSkeleton key={i} T={T} styles={styles} />')
text = text.replace('<SkeletonPulse style={{ height: 18, width: 160 }} />', '<SkeletonPulse style={{ height: 18, width: 160 }} T={T} />')
text = text.replace('<SkeletonPulse style={{ height: 18, width: 120 }} />', '<SkeletonPulse style={{ height: 18, width: 120 }} T={T} />')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)
