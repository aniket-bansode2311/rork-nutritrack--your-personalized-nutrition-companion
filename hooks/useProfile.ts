import { useEffect, useState } from 'react';
import { supabase, Database } from '@/lib/supabase';
import { useAuth } from './useAuth';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (profileData: Omit<ProfileInsert, 'id'>) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      setError(null);

      // Set default values for new fields
      const defaultDietaryPreferences = {
        vegetarian: false,
        vegan: false,
        glutenFree: false,
        dairyFree: false,
        keto: false,
        paleo: false,
        lowCarb: false,
        lowFat: false,
        allergies: [],
        dislikes: [],
      };

      const defaultNotificationSettings = {
        mealReminders: true,
        waterReminders: true,
        goalAchievements: true,
        weeklyReports: true,
        mealReminderTimes: {
          breakfast: '08:00',
          lunch: '12:30',
          dinner: '18:00',
        },
        waterReminderInterval: 120,
      };

      const defaultPrivacySettings = {
        dataSharing: false,
        analyticsOptOut: false,
        profileVisibility: 'private' as const,
        allowDataExport: true,
        allowDataDeletion: true,
      };

      const defaultHealthIntegrations = {
        appleHealth: {
          enabled: false,
          syncWeight: false,
          syncActivity: false,
          syncNutrition: false,
        },
        googleFit: {
          enabled: false,
          syncWeight: false,
          syncActivity: false,
          syncNutrition: false,
        },
        fitbit: {
          enabled: false,
          syncWeight: false,
          syncActivity: false,
        },
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          ...profileData,
          id: user.id,
          email: user.email || '',
          dietary_preferences: defaultDietaryPreferences,
          notification_settings: defaultNotificationSettings,
          privacy_settings: defaultPrivacySettings,
          health_integrations: defaultHealthIntegrations,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setProfile(data);
      return { data, error: null };
    } catch (err) {
      console.error('Error creating profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create profile';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: ProfileUpdate) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setProfile(data);
      return { data, error: null };
    } catch (err) {
      console.error('Error updating profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const calculateNutritionGoals = (
    weight: number,
    height: number,
    age: number,
    gender: 'male' | 'female' | 'other',
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very active',
    goal: 'lose' | 'maintain' | 'gain'
  ) => {
    // Calculate BMR using Mifflin-St Jeor Equation
    let bmr: number;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Activity multipliers
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      'very active': 1.9,
    };

    // Calculate TDEE
    const tdee = bmr * activityMultipliers[activityLevel];

    // Adjust for goal
    let calories: number;
    switch (goal) {
      case 'lose':
        calories = tdee - 500; // 1 lb per week deficit
        break;
      case 'gain':
        calories = tdee + 500; // 1 lb per week surplus
        break;
      default:
        calories = tdee;
    }

    // Calculate macros (40% carbs, 30% protein, 30% fat)
    const protein = Math.round((calories * 0.3) / 4); // 4 calories per gram
    const carbs = Math.round((calories * 0.4) / 4); // 4 calories per gram
    const fat = Math.round((calories * 0.3) / 9); // 9 calories per gram

    return {
      calories: Math.round(calories),
      protein,
      carbs,
      fat,
    };
  };

  return {
    profile,
    loading,
    error,
    createProfile,
    updateProfile,
    fetchProfile,
    calculateNutritionGoals,
  };
};