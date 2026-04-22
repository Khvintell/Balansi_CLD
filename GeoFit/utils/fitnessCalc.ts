/**
 * Balansi Fitness & Nutrition Calculator
 * Centralized formulas for BMI, Water targets, Calorie targets, and Macros.
 */

export interface UserProfileData {
  age: number;
  weight: number;
  height: number;
  goal: 'lose' | 'maintain' | 'gain';
  gender?: 'male' | 'female';
}

/**
 * Calculates Body Mass Index (BMI)
 */
export const calculateBMI = (weight: number, height: number): string => {
  if (!weight || !height) return '0.0';
  const heightM = height / 100;
  return (weight / (heightM * heightM)).toFixed(1);
};

/**
 * Categorizes BMI into human-readable labels
 */
export const getBMICategory = (bmi: number) => {
  if (bmi < 18.5) return { label: 'წონაში დეფიციტი', color: '#60A5FA' };
  if (bmi < 25) return { label: 'ნორმა', color: '#10B981' };
  if (bmi < 30) return { label: 'ჭარბი წონა', color: '#F59E0B' };
  return { label: 'სიმსუქნე', color: '#EF4444' };
};

/**
 * Calculates daily water intake target in milliliters
 */
export const calculateWaterTarget = (p: UserProfileData): number => {
  if (!p) return 2200;
  
  const w = p.weight || 75;
  const h = p.height || 175;
  const a = p.age || 30;
  const goal = p.goal || 'maintain';

  // Base hydration based on weight (35ml per kg)
  let target = w * 35;

  // Height adjustment (taller people need more)
  if (h > 165) target += ((h - 165) / 5) * 100;

  // Age adjustment
  if (a < 30) target += 250;
  else if (a > 50) target -= 150;

  // Goal adjustment
  if (goal === 'gain') target += 400;
  if (goal === 'lose') target += 200;

  // Round to nearest 50ml and keep within healthy range
  return Math.max(1800, Math.round(target / 50) * 50);
};

/**
 * Calculates BMR and Daily Calorie Target using Mifflin-St Jeor Formula
 */
export const calculateDailyCalories = (p: UserProfileData): number => {
  if (!p) return 2000;
  
  const w = p.weight;
  const h = p.height;
  const a = p.age;
  const gender = p.gender || 'male';

  // Base BMR
  let bmr = (10 * w) + (6.25 * h) - (5 * a);
  bmr = gender === 'male' ? bmr + 5 : bmr - 161;

  // Sedentary activity multiplier (1.2) as baseline
  let tdee = bmr * 1.2;

  // Goal adjustment
  if (p.goal === 'lose') tdee -= 500;
  if (p.goal === 'gain') tdee += 400;

  return Math.round(tdee);
};

/**
 * Checks if weight goal has been reached within tolerance
 */
export const checkWeightGoalReached = (current: number, target: number, goal: string): boolean => {
  if (goal === 'lose') return current <= target;
  if (goal === 'gain') return current >= target;
  return Math.abs(current - target) <= 0.5;
};

/**
 * Calculates daily macro targets based on calorie budget
 */
export const calculateDailyMacros = (calories: number, goal: string) => {
  let ratios = { p: 0.3, c: 0.45, f: 0.25 }; // Standard

  if (goal === 'lose') ratios = { p: 0.35, c: 0.35, f: 0.3 };
  if (goal === 'gain') ratios = { p: 0.25, c: 0.55, f: 0.2 };

  return {
    protein: Math.round((calories * ratios.p) / 4),
    carbs: Math.round((calories * ratios.c) / 4),
    fats: Math.round((calories * ratios.f) / 9),
  };
};
