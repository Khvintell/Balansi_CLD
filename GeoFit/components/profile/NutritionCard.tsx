import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Platform, Dimensions } from 'react-native';
import { Utensils, AlertCircle, Dumbbell, Zap, Droplet, Brain, ChevronRight } from 'lucide-react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import * as Haptics from 'expo-haptics';

const { width: SW } = Dimensions.get('window');

interface NutritionCardProps {
  consumedToday: any;
  profile: any;
  calorieProgress: number;
  chartType: 'weight' | 'calories';
  setChartType: (type: 'weight' | 'calories') => void;
  chartLabels: string[];
  chartWeightLabels: string[];
  chartWeightData: number[];
  calorieHistory: number[];
  totalChange: string;
  C: any;
  S: any;
}

import { MacroBar } from './MacroBar';


export const NutritionCard = ({
  consumedToday,
  profile,
  calorieProgress,
  chartType,
  setChartType,
  chartLabels,
  chartWeightLabels,
  chartWeightData,
  calorieHistory,
  totalChange,
  C,
  S
}: NutritionCardProps) => {
  return (
    <View style={{ gap: 16 }}>
      <View style={[S.card, { paddingVertical: 24 }]}>
        <View style={[S.cardHeader, { marginBottom: 20 }]}>
          <View style={[S.cardIconWrap, { backgroundColor: '#F0FDF4' }]}>
            <Utensils size={18} color="#10B981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[S.cardTitle, { fontSize: 18, fontWeight: '900' }]}>დღევანდელი კვება</Text>
            <Text style={[S.cardSub, { fontSize: 11 }]}>დღიური კალორიების ანალიზი</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 25 }}>
          {/* Progress Ring (Simulated with high-end style) */}
          <View style={{ width: 110, height: 110, borderRadius: 55, borderWidth: 8, borderColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ position: 'absolute', width: 110, height: 110, borderRadius: 55, borderWidth: 8, borderColor: calorieProgress >= 1 ? '#EF4444' : '#10B981', borderTopColor: 'transparent', borderLeftColor: 'transparent', transform: [{ rotate: `${(calorieProgress * 360) - 45}deg` }] }} />
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#0F172A' }}>{consumedToday.calories}</Text>
            <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '800', marginTop: 2 }}>კკალ</Text>
          </View>

          <View style={{ flex: 1, paddingLeft: 25, gap: 12 }}>
            <View>
              <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '900', textTransform: 'uppercase' }}>დარჩა</Text>
              <Text style={{ fontSize: 20, fontWeight: '900', color: calorieProgress >= 1 ? '#EF4444' : '#0F172A', marginTop: 2 }}>
                {Math.max(0, (profile.targetCalories || 2000) - consumedToday.calories)} <Text style={{ fontSize: 12 }}>კკალ</Text>
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: '#F1F5F9', width: '40%' }} />
            <View>
              <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '900', textTransform: 'uppercase' }}>მიზანი</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#64748B', marginTop: 2 }}>{profile.targetCalories || 2000} კკალ</Text>
            </View>
          </View>
        </View>

        <View style={{ gap: 12 }}>
          <MacroBar label="ცილა" value={consumedToday.protein} target={profile.macros?.protein || 120} color="#EF4444" bg="rgba(239, 68, 68, 0.1)" unit="გ" icon={Dumbbell} S={S} />
          <MacroBar label="ნახშირწყალი" value={consumedToday.carbs} target={profile.macros?.carbs || 200} color="#F59E0B" bg="rgba(245, 158, 11, 0.1)" unit="გ" icon={Zap} S={S} />
          <MacroBar label="ცხიმი" value={consumedToday.fats} target={profile.macros?.fats || 65} color="#10B981" bg="rgba(16, 185, 129, 0.1)" unit="გ" icon={Droplet} S={S} />
        </View>
      </View>

      <View style={S.card}>
        <View style={S.chartControls}>
          <View style={S.chartTypeToggle}>
            {(['weight', 'calories'] as const).map(ct => (
              <TouchableOpacity
                key={ct}
                style={[S.chartTypeBtn, chartType === ct && S.chartTypeBtnActive]}
                onPress={() => { Haptics.selectionAsync(); setChartType(ct); }}
              >
                <Text style={[S.chartTypeTxt, chartType === ct && S.chartTypeTxtActive]} numberOfLines={1} adjustsFontSizeToFit>
                  {ct === 'weight' ? '⚖️ წონა' : '🔥 კკალ'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={S.chartRangeRow}>
            <View style={[S.rangeBtn, S.rangeBtnActive]}>
              <Text style={S.rangeTxtActive}>ბოლო 7 დღე</Text>
            </View>
          </View>
        </View>

        {chartType === 'weight' && !profile.isVerified && (
          <View style={S.unverifiedWarning}>
            <AlertCircle size={14} color={C.orange} />
            <Text style={S.unverifiedWarningText}>ბოლო აწონვა არ არის დადასტურებული AI-ს მიერ.</Text>
          </View>
        )}

        {Platform.OS !== 'web' && (
          <View style={{ marginLeft: -16, paddingRight: 12 }}>
            {chartType === 'weight' ? (
              <LineChart
                data={{
                  labels: chartWeightLabels,
                  datasets: [{ data: chartWeightData }],
                }}
                width={SW - 60}
                height={180}
                withInnerLines={true}
                withOuterLines={false}
                withVerticalLines={false}
                yAxisSuffix="კგ"
                chartConfig={{
                  backgroundColor: '#FFF',
                  backgroundGradientFrom: '#FFF',
                  backgroundGradientTo: '#FFF',
                  decimalPlaces: 1,
                  color: (o = 1) => profile.isVerified ? `rgba(16, 185, 129, ${o})` : `rgba(249, 115, 22, ${o})`,
                  labelColor: () => '#64748B',
                  propsForDots: { r: 5, strokeWidth: 2, stroke: '#FFF' },
                  fillShadowGradient: profile.isVerified ? '#10B981' : '#F97316',
                  fillShadowGradientOpacity: 0.1,
                  propsForBackgroundLines: { stroke: '#F1F5F9', strokeDasharray: '' }
                }}
                bezier
                style={{ marginTop: 16, borderRadius: 16 }}
              />
            ) : (
              <BarChart
                data={{
                  labels: chartLabels,
                  datasets: [{ data: calorieHistory }]
                }}
                width={SW - 45}
                height={180}
                yAxisLabel=""
                yAxisSuffix=""
                fromZero
                showBarTops={false}
                chartConfig={{
                  backgroundColor: '#FFF',
                  backgroundGradientFrom: '#FFF',
                  backgroundGradientTo: '#FFF',
                  color: (o = 1) => `rgba(14, 165, 233, ${o})`,
                  labelColor: () => '#64748B',
                  barPercentage: 0.6,
                  propsForBackgroundLines: { stroke: '#F1F5F9', strokeDasharray: '4' }
                }}
                style={{ marginTop: 16, borderRadius: 16, marginLeft: -8 }}
              />
            )}
          </View>
        )}

        <View style={S.aiInsight}>
          <View style={S.aiInsightHeader}>
            <Brain size={13} color={C.primaryDark} />
            <Text style={S.aiInsightTitle}>AI ინსაიტი</Text>
          </View>
          {!profile.isVerified && chartType === 'weight' ? (
            <Text style={[S.aiInsightTxt, { color: C.orange }]}>
              ⚠️ მონაცემები ხელით არის შეყვანილი. ზუსტი ინსაიტებისთვის და ბეჯებისთვის გამოიყენე AI სკანერი.
            </Text>
          ) : (
            <Text style={S.aiInsightTxt}>
              {parseFloat(totalChange) < 0
                ? `შენი ტრენდი ➘ — ${Math.abs(parseFloat(totalChange))} კგ შემცირდა. იგივე სათრიქი! 🎯`
                : parseFloat(totalChange) > 0
                  ? `+${totalChange} კგ შეიმჩნევა. კვების ბალანსი შეამოწმე! 💪`
                  : 'წონა სრულიად სტაბილურია. შენარჩუნების ფაზა! ⚖️'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};
