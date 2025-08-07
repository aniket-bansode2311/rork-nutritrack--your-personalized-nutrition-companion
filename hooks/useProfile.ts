import { useEffect, useState } from 'react';
import { supabase, Database } from '@/lib/supabase';
import { useAuth } from './useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

      // Try to get profile from AsyncStorage first (fallback for when DB is not set up)
      const localProfile = await AsyncStorage.getItem(`profile_${user.id}`);
      if (localProfile) {
        setProfile(JSON.parse(localProfile));
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') {
          // Table doesn't exist or no rows found - this is expected for new users
          setProfile(null);
          return;
        }
        throw error;
      }

      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      // Don't set error for database issues, just use local storage fallback
      setProfile(null);
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

      const newProfile = {
        ...profileData,
        id: user.id,
        email: user.email || '',
        dietary_preferences: defaultDietaryPreferences,
        notification_settings: defaultNotificationSettings,
        privacy_settings: defaultPrivacySettings,
        health_integrations: defaultHealthIntegrations,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      try {
        const { data, error } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();

        if (error) {
          throw error;
        }

        setProfile(data);
        return { data, error: null };
      } catch (dbError) {
        console.log('Database not available, using local storage fallback');
        // Fallback to AsyncStorage if database is not available
        await AsyncStorage.setItem(`profile_${user.id}`, JSON.stringify(newProfile));
        setProfile(newProfile as Profile);
        return { data: newProfile as Profile, error: null };
      }
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

      try {
        const { data, error } = await supabase
          .from('profiles')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', user.id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        setProfile(data);
        return { data, error: null };
      } catch (dbError) {
        console.log('Database not available, using local storage fallback');
        // Fallback to AsyncStorage if database is not available
        const currentProfile = profile || await AsyncStorage.getItem(`profile_${user.id}`);
        if (currentProfile) {
          const parsedProfile = typeof currentProfile === 'string' ? JSON.parse(currentProfile) : currentProfile;
          const updatedProfile = { 
            ...parsedProfile, 
            ...updates, 
            updated_at: new Date().toISOString() 
          };
          await AsyncStorage.setItem(`profile_${user.id}`, JSON.stringify(updatedProfile));
          setProfile(updatedProfile);
          return { data: updatedProfile, error: null };
        }
        throw new Error('No profile found to update');
      }
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