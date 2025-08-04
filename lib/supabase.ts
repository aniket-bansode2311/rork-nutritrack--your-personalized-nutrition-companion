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
    };
  };
};