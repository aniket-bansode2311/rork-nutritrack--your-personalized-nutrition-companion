export interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface UserProfile {
  id: string;
  name: string;
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very active';
  goal: 'lose' | 'maintain' | 'gain';
  nutritionGoals: NutritionGoals;
  dietaryPreferences?: DietaryPreferences;
  notifications?: NotificationSettings;
  privacy?: PrivacySettings;
  healthIntegrations?: HealthIntegrations;
}

export interface DietaryPreferences {
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  dairyFree: boolean;
  keto: boolean;
  paleo: boolean;
  lowCarb: boolean;
  lowFat: boolean;
  allergies: string[];
  dislikes: string[];
}

export interface NotificationSettings {
  mealReminders: boolean;
  waterReminders: boolean;
  goalAchievements: boolean;
  weeklyReports: boolean;
  mealReminderTimes: {
    breakfast: string;
    lunch: string;
    dinner: string;
  };
  waterReminderInterval: number; // minutes
}

export interface PrivacySettings {
  dataSharing: boolean;
  analyticsOptOut: boolean;
  profileVisibility: 'private' | 'friends' | 'public';
  allowDataExport: boolean;
  allowDataDeletion: boolean;
}

export interface HealthIntegrations {
  appleHealth: {
    enabled: boolean;
    syncWeight: boolean;
    syncActivity: boolean;
    syncNutrition: boolean;
  };
  googleFit: {
    enabled: boolean;
    syncWeight: boolean;
    syncActivity: boolean;
    syncNutrition: boolean;
  };
  fitbit: {
    enabled: boolean;
    syncWeight: boolean;
    syncActivity: boolean;
  };
}

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  cholesterol?: number;
  potassium?: number;
  vitaminA?: number;
  vitaminC?: number;
  calcium?: number;
  iron?: number;
}

export interface MealEntry {
  id: string;
  foodItem: FoodItem;
  servings: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  date: string; // ISO string
}

export interface DailyLog {
  date: string; // ISO string
  meals: MealEntry[];
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface BarcodeProduct {
  barcode: string;
  name: string;
  brand?: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  imageUrl?: string;
  ingredients?: string[];
}

export interface RecipeIngredient {
  id: string;
  foodItem: FoodItem;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  servings: number;
  prepTime?: number; // minutes
  cookTime?: number; // minutes
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
  tags?: string[];
  ingredients: RecipeIngredient[];
  instructions?: string[];
  imageUrl?: string;
  sourceUrl?: string;
  createdAt: string;
  updatedAt: string;
  nutritionPerServing: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
}

export interface RecipeEntry {
  id: string;
  recipe: Recipe;
  servings: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  date: string; // ISO string
}

export interface WaterEntry {
  id: string;
  amount: number; // in ml
  timestamp: string; // ISO string
  userId: string;
}

export interface ActivityEntry {
  id: string;
  type: string; // 'walking', 'running', 'cycling', 'swimming', etc.
  duration: number; // in minutes
  caloriesBurned?: number;
  distance?: number; // in km
  intensity?: 'low' | 'moderate' | 'high';
  timestamp: string; // ISO string
  userId: string;
}

export interface WeightEntry {
  id: string;
  weight: number; // in kg
  date: string; // ISO string
  userId: string;
}

export interface BodyMeasurement {
  id: string;
  type: 'waist' | 'chest' | 'hips' | 'arms' | 'thighs' | 'neck';
  measurement: number; // in cm
  date: string; // ISO string
  userId: string;
}

export interface NutritionTrend {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface ProgressData {
  weightTrend: WeightEntry[];
  nutritionTrend: NutritionTrend[];
  waterIntake: WaterEntry[];
  activities: ActivityEntry[];
  bodyMeasurements: BodyMeasurement[];
}

export interface ProgressStats {
  period: 'week' | 'month' | 'quarter' | 'year';
  averageCalories: number;
  averageProtein: number;
  averageCarbs: number;
  averageFat: number;
  averageWater: number;
  totalActivities: number;
  totalCaloriesBurned: number;
  weightChange: number;
  goalAchievementRate: number;
}