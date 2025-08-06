import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          weight: number;
          height: number;
          age: number;
          gender: 'male' | 'female' | 'other';
          activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very active';
          goal: 'lose' | 'maintain' | 'gain';
          calories_goal: number;
          protein_goal: number;
          carbs_goal: number;
          fat_goal: number;
          dietary_preferences?: any;
          notification_settings?: any;
          privacy_settings?: any;
          health_integrations?: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          weight: number;
          height: number;
          age: number;
          gender: 'male' | 'female' | 'other';
          activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very active';
          goal: 'lose' | 'maintain' | 'gain';
          calories_goal: number;
          protein_goal: number;
          carbs_goal: number;
          fat_goal: number;
          dietary_preferences?: any;
          notification_settings?: any;
          privacy_settings?: any;
          health_integrations?: any;
        };
        Update: {
          name?: string;
          weight?: number;
          height?: number;
          age?: number;
          gender?: 'male' | 'female' | 'other';
          activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very active';
          goal?: 'lose' | 'maintain' | 'gain';
          calories_goal?: number;
          protein_goal?: number;
          carbs_goal?: number;
          fat_goal?: number;
          dietary_preferences?: any;
          notification_settings?: any;
          privacy_settings?: any;
          health_integrations?: any;
        };
      };
      food_entries: {
        Row: {
          id: string;
          user_id: string;
          food_name: string;
          brand?: string;
          barcode?: string;
          serving_size: number;
          serving_unit: string;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          fiber?: number;
          sugar?: number;
          sodium?: number;
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
          logged_at: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          food_name: string;
          brand?: string;
          barcode?: string;
          serving_size: number;
          serving_unit: string;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          fiber?: number;
          sugar?: number;
          sodium?: number;
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
          logged_at?: string;
        };
        Update: {
          food_name?: string;
          brand?: string;
          serving_size?: number;
          serving_unit?: string;
          calories?: number;
          protein?: number;
          carbs?: number;
          fat?: number;
          fiber?: number;
          sugar?: number;
          sodium?: number;
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
          logged_at?: string;
        };
      };
      recipes: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description?: string;
          servings: number;
          prep_time?: number;
          cook_time?: number;
          instructions?: string[];
          ingredients: any[];
          total_calories: number;
          total_protein: number;
          total_carbs: number;
          total_fat: number;
          image_url?: string;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          description?: string;
          servings: number;
          prep_time?: number;
          cook_time?: number;
          instructions?: string[];
          ingredients: any[];
          total_calories: number;
          total_protein: number;
          total_carbs: number;
          total_fat: number;
          image_url?: string;
          is_public?: boolean;
        };
        Update: {
          name?: string;
          description?: string;
          servings?: number;
          prep_time?: number;
          cook_time?: number;
          instructions?: string[];
          ingredients?: any[];
          total_calories?: number;
          total_protein?: number;
          total_carbs?: number;
          total_fat?: number;
          image_url?: string;
          is_public?: boolean;
        };
      };
      custom_foods: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          brand?: string;
          serving_size: number;
          serving_unit: string;
          calories_per_serving: number;
          protein_per_serving: number;
          carbs_per_serving: number;
          fat_per_serving: number;
          fiber_per_serving?: number;
          sugar_per_serving?: number;
          sodium_per_serving?: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          brand?: string;
          serving_size: number;
          serving_unit: string;
          calories_per_serving: number;
          protein_per_serving: number;
          carbs_per_serving: number;
          fat_per_serving: number;
          fiber_per_serving?: number;
          sugar_per_serving?: number;
          sodium_per_serving?: number;
        };
        Update: {
          name?: string;
          brand?: string;
          serving_size?: number;
          serving_unit?: string;
          calories_per_serving?: number;
          protein_per_serving?: number;
          carbs_per_serving?: number;
          fat_per_serving?: number;
          fiber_per_serving?: number;
          sugar_per_serving?: number;
          sodium_per_serving?: number;
        };
      };
    };
  };
};