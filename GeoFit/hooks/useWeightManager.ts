import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useDiaryStore } from '../store/useDiaryStore';
import { calculateBMI, checkWeightGoalReached } from '../utils/fitnessCalc';
import { SERVER_URL } from '../config/api';
import * as Haptics from 'expo-haptics';

export const useWeightManager = (profile: any, setProfile: (p: any) => void) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const { updateProfile: updateDiaryProfile } = useDiaryStore();

  const verifyWeightWithAI = async (imageUri: string, expectedWeight: number) => {
    try {
      const formData = new FormData();
      // @ts-ignore
      formData.append('file', {
        uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
        name: 'weight_scale.jpg',
        type: 'image/jpeg',
      });
      formData.append('expected_weight', expectedWeight.toString());

      const response = await fetch(`${SERVER_URL}/verify-weight`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('AI Verification Error:', error);
      return { success: false, message: 'სერვერთან კავშირი ვერ მოხერხდა.' };
    }
  };

  const handleWeightSave = useCallback(async (newWeight: number, isVerifiedAction: boolean, imageUri?: string) => {
    try {
      let isTruth = isVerifiedAction;
      let aiMessage = '';
      let xpGain = 10;
      let trustScore = profile.trustScore ?? 100;
      let badges = [...(profile.badges || [])];
      let streak = profile.streak || 0;

      // 1. AI Verification Path
      if (isVerifiedAction && imageUri) {
        setIsVerifying(true);
        const aiResult = await verifyWeightWithAI(imageUri, newWeight);
        setIsVerifying(false);

        if (aiResult.success) {
          isTruth = aiResult.is_truth;
          aiMessage = aiResult.message;
          
          if (isTruth) {
            xpGain = 50;
            trustScore = Math.min(100, trustScore + 20);
            if (trustScore > 70) badges = badges.filter(b => b !== 'pinocchio');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else {
            // THE PINOCCHIO PENALTY 🤥
            xpGain = 0;
            trustScore = 0;
            streak = 0; // Harsh reset
            if (!badges.includes('pinocchio')) badges.push('pinocchio');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }
        } else {
          // AI Error (Network/Parser) - Treat as unverified save for safety but warn
          isTruth = false;
          aiMessage = aiResult.message || 'ვერ მოხერხდა AI ვერიფიკაცია.';
          xpGain = 10;
          trustScore = Math.max(0, trustScore - 5);
        }
      } else {
        // 2. Manual Save Path
        xpGain = 10;
        trustScore = Math.max(0, trustScore - 8);
        if (trustScore < 40 && !badges.includes('pinocchio')) badges.push('pinocchio');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // 3. Common Logic (BMI, Goals)
      const bmi = calculateBMI(newWeight, profile.height || 175);
      const totalXP = (profile.totalXP || 0) + xpGain;

      if (checkWeightGoalReached(newWeight, parseFloat(profile.targetWeight), profile.goal)) {
        if (!badges.includes('goal_crusher')) badges.push('goal_crusher');
      }

      // 4. Update Profile Object
      const updatedProfile = {
        ...profile,
        weight: newWeight,
        bmi,
        totalXP,
        trustScore,
        badges,
        streak,
        isVerified: isTruth,
        lastWeightDate: new Date().toISOString(),
      };

      // 5. Persistence
      const historyStr = await AsyncStorage.getItem('weightHistory');
      const history = historyStr ? JSON.parse(historyStr) : [];
      const newHistory = [...history, newWeight].slice(-30);

      await AsyncStorage.multiSet([
        ['userProfile', JSON.stringify(updatedProfile)],
        ['weightHistory', JSON.stringify(newHistory)]
      ]);

      // 6. Sync Stores
      setProfile(updatedProfile);
      updateDiaryProfile(updatedProfile);

      return { 
        success: true, 
        isTruth, 
        message: aiMessage || (isTruth ? 'წონა შენახულია!' : 'წონა შენახულია ვერიფიკაციის გარეშე.'),
        xpGain 
      };
    } catch (error) {
      console.error('Save weight failed:', error);
      return { success: false, message: 'დაფიქსირდა შეცდომა.' };
    }
  }, [profile, setProfile, updateDiaryProfile]);

  return {
    isVerifying,
    setIsVerifying,
    handleWeightSave,
  };
};

