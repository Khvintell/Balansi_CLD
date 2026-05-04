import React from 'react';
import { BicepsFlexed, Zap, Leaf, Flame, Activity } from 'lucide-react-native';

export type BadgeResult = {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
} | null;

export function getRecipeBadge(recipe: any): BadgeResult {
  if (!recipe) return null;

  // Priority 1: Bulk (მასისთვის) -> > 600 kcal
  if (recipe.total_calories > 600) {
    return {
      label: 'მასისთვის',
      icon: Flame,
      color: '#EF4444', // Red
      bg: 'rgba(239,68,68,0.12)',
    };
  }

  // Priority 2: High Protein (ცილოვანი) -> >= 25g
  if (recipe.protein >= 25) {
    return {
      label: 'ცილოვანი',
      icon: BicepsFlexed,
      color: '#3B82F6', // Blue
      bg: 'rgba(59,130,246,0.12)',
    };
  }

  // Priority 4: Energy (ენერგია) -> Carbs > 50
  if (recipe.carbs >= 50) {
    return {
      label: 'ენერგია',
      icon: Activity,
      color: '#EC4899', // Pink
      bg: 'rgba(236,72,153,0.12)',
    };
  }

  // Priority 5: Low Calorie (მსუბუქი) -> <= 350 kcal
  if (recipe.total_calories > 0 && recipe.total_calories <= 350) {
    return {
      label: 'მსუბუქი',
      icon: Leaf,
      color: '#10B981', // Emerald
      bg: 'rgba(16,185,129,0.12)',
    };
  }

  // Priority 6: Fast & Easy (სწრაფი) -> <= 15 mins
  if (recipe.prep_time > 0 && recipe.prep_time <= 15) {
    return {
      label: 'სწრაფი',
      icon: Zap,
      color: '#F59E0B', // Amber
      bg: 'rgba(245,158,11,0.12)',
    };
  }

  return null;
}
