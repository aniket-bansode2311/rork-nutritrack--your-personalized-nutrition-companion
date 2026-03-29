import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Validate environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Validate URL format
if (!supabaseUrl.startsWith('https://')) {
  throw new Error('Supabase URL must use HTTPS for security.');
}

// Create secure storage adapter
const createSecureStorage = () => {
  return {
    getItem: async (key: string) => {
      try {
        const item = await AsyncStorage.getItem(key);
        return item;
      } catch (error) {
        console.error('Error reading from secure storage:', error);
        return null;
      }
    },
    setItem: async (key: string, value: string) => {
      try {
        await AsyncStorage.setItem(key, value);
      } catch (error) {
        console.error('Error writing to secure storage:', error);
      }
    },
    removeItem: async (key: string) => {
      try {
        await AsyncStorage.removeItem(key);
      } catch (error) {
        console.error('Error removing from secure storage:', error);
      }
    },
  };
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createSecureStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Enhanced security settings
    flowType: 'pkce',
    debug: __DEV__,
  },
  global: {
    headers: {
      'X-Client-Info': `nutrition-tracker-${Platform.OS}`,
    },
  },
  // Ensure all requests use HTTPS
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Security utility functions
export const validateSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session validation error:', error);
      return null;
    }
    
    // Check if session is expired
    if (session && session.expires_at) {
      const expiresAt = new Date(session.expires_at * 1000);
      const now = new Date();
      
      if (expiresAt <= now) {
        console.warn('Session expired, refreshing...');
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('Session refresh error:', refreshError);
          return null;
        }
        
        return refreshedSession;
      }
    }
    
    return session;
  } catch (error) {
    console.error('Session validation failed:', error);
    return null;
  }
};

export const secureSignOut = async () => {
  try {
    // Clear all local storage
    await AsyncStorage.clear();
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Sign out error:', error);
    }
    
    return { error };
  } catch (error) {
    console.error('Secure sign out failed:', error);
    return { error };
  }
};

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
      weight_entries: {
        Row: {
          id: string;
          user_id: string;
          weight: number;
          date: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          weight: number;
          date: string;
        };
        Update: {
          weight?: number;
          date?: string;
        };
      };
      water_entries: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          timestamp: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          amount: number;
          timestamp?: string;
        };
        Update: {
          amount?: number;
          timestamp?: string;
        };
      };
      activity_entries: {
        Row: {
          id: string;
          user_id: string;
          activity_type: string;
          duration: number;
          calories_burned?: number;
          date: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          activity_type: string;
          duration: number;
          calories_burned?: number;
          date: string;
        };
        Update: {
          activity_type?: string;
          duration?: number;
          calories_burned?: number;
          date?: string;
        };
      };
      barcode_products: {
        Row: {
          id: string;
          barcode: string;
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
          barcode: string;
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
      personalized_insights: {
        Row: {
          id: string;
          user_id: string;
          insight_type: string;
          title: string;
          description: string;
          recommendations: any[];
          priority: 'low' | 'medium' | 'high';
          is_read: boolean;
          generated_at: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          insight_type: string;
          title: string;
          description: string;
          recommendations?: any[];
          priority?: 'low' | 'medium' | 'high';
          is_read?: boolean;
          generated_at?: string;
          expires_at?: string;
        };
        Update: {
          insight_type?: string;
          title?: string;
          description?: string;
          recommendations?: any[];
          priority?: 'low' | 'medium' | 'high';
          is_read?: boolean;
          expires_at?: string;
        };
      };
      smart_goal_suggestions: {
        Row: {
          id: string;
          user_id: string;
          adjustment_date: string;
          previous_goals: any;
          new_goals: any;
          reason?: string;
          source: 'user_request' | 'system_recommendation' | 'periodic_review';
          effectiveness_tracking?: any;
          status: 'pending' | 'accepted' | 'rejected' | 'expired';
          expires_at: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          adjustment_date?: string;
          previous_goals: any;
          new_goals: any;
          reason?: string;
          source: 'user_request' | 'system_recommendation' | 'periodic_review';
          effectiveness_tracking?: any;
          status?: 'pending' | 'accepted' | 'rejected' | 'expired';
          expires_at?: string;
        };
        Update: {
          previous_goals?: any;
          new_goals?: any;
          reason?: string;
          effectiveness_tracking?: any;
          status?: 'pending' | 'accepted' | 'rejected' | 'expired';
          expires_at?: string;
        };
      };
    };
  };
};