import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Platform, Dimensions } from 'react-native';
import { Utensils, AlertCircle, Dumbbell, Zap, Droplet, Brain } from 'lucide-react-native';
import { LineChart } from 'react-native-chart-kit';
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
    <View style={{ gap: 14 }}>
      <View style={S.card}>
        <View style={S.cardHeader}>
          <View style={[S.cardIconWrap, { backgroundColor: C.primaryLight }]}>
            <Utensils size={17} color={C.primaryDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.cardTitle}>დღეს მიღებული</Text>
            <Text style={S.cardSub}>დღიური ლიმიტიდან</Text>
          </View>
        </View>

        <View style={S.calorieRow}>
          <View style={S.calorieCircle}>
            <Text style={S.calorieNum} adjustsFontSizeToFit numberOfLines={1}>{consumedToday.calories}</Text>
            <Text style={S.calorieLabel}>კკალ</Text>
          </View>
          <View style={{ flex: 1, gap: 10, paddingLeft: 8 }}>
            <View style={S.calorieMeta}>
              <Text style={S.calorieMetaLabel}>ლიმიტი</Text>
              <Text style={[S.calorieMetaVal, { color: C.ink }]}>{profile.targetCalories || 2000} კკ</Text>
            </View>
            <View style={S.calorieMeta}>
              <Text style={S.calorieMetaLabel}>დარჩა</Text>
              <Text style={[S.calorieMetaVal, { color: calorieProgress >= 1 ? C.red : C.primaryDark }]}>
                {Math.max(0, (profile.targetCalories || 2000) - consumedToday.calories)} კკ
              </Text>
            </View>
            <View style={S.calorieMeta}>
              <Text style={S.calorieMetaLabel}>პროგრესი</Text>
              <Text style={[S.calorieMetaVal, { color: C.orange }]}>{Math.round(calorieProgress * 100)}%</Text>
            </View>
          </View>
        </View>

        <View style={{ gap: 10, marginTop: 8 }}>
          <MacroBar label="ცილა" value={consumedToday.protein} target={profile.macros?.protein || 120} color={C.blue} bg={C.blueLight} unit="გ" icon={Dumbbell} S={S} />
          <MacroBar label="ნახშირწყალი" value={consumedToday.carbs} target={profile.macros?.carbs || 200} color={C.orange} bg={C.orangeLight} unit="გ" icon={Zap} S={S} />
          <MacroBar label="ცხიმი" value={consumedToday.fats} target={profile.macros?.fats || 65} color={C.purple} bg={C.purpleLight} unit="გ" icon={Droplet} S={S} />
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
            <LineChart
              data={{
                labels: chartType === 'weight' ? chartWeightLabels : chartLabels,
                datasets: [{
                  data: chartType === 'weight' ? chartWeightData : calorieHistory,
                }],
              }}
              width={SW - 60}
              height={180}
              withInnerLines={true}
              withOuterLines={false}
              withVerticalLines={false}
              yAxisSuffix={chartType === 'weight' ? 'კგ' : ''}
              yAxisLabel=""
              chartConfig={{
                backgroundColor: C.surface,
                backgroundGradientFrom: C.surface,
                backgroundGradientTo: C.surface,
                decimalPlaces: chartType === 'weight' ? 1 : 0,
                color: (o = 1) => chartType === 'weight'
                  ? (profile.isVerified ? `rgba(29,185,84,${o})` : `rgba(249,115,22,${o})`)
                  : `rgba(251,146,60,${o})`,
                labelColor: () => C.inkLight,
                propsForDots: { r: '5', strokeWidth: '2.5', stroke: C.surface },
                fillShadowGradient: chartType === 'weight' ? (profile.isVerified ? C.primary : C.orange) : C.orange,
                fillShadowGradientOpacity: 0.18,
                propsForBackgroundLines: { stroke: C.border, strokeDasharray: '4' },
                propsForLabels: { fontSize: 10, fontWeight: '700' },
                formatXLabel: (label) => ` ${label} `
              }}
              bezier
              style={{ marginTop: 16, borderRadius: 16 }}
            />
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
