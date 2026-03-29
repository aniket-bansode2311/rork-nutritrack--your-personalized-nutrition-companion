export interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface WellnessGoals {
  waterIntake: number; // ml per day
  activityMinutes: number; // minutes per day
  steps?: number; // steps per day
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
  wellnessGoals?: WellnessGoals;
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

export interface NutrientInsight {
  id: string;
  type: 'deficiency' | 'excess' | 'optimal' | 'recommendation';
  nutrient: string;
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  recommendation: string;
  actionItems: string[];
  suggestedFoods?: {
    targetValue?: number;
    currentValue?: number;
    trend?: 'improving' | 'declining' | 'stable';
  };
}

export interface MealTimingInsight {
  id: string;
  type: 'timing' | 'frequency' | 'distribution';
  title: string;
  description: string;
  recommendation: string;
  suggestedTiming?: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks?: string[];
  };
  currentPattern?: {
    averageBreakfastTime: string;
    averageLunchTime: string;
    averageDinnerTime: string;
    mealFrequency?: number;
  };
}

export interface HealthGoalInsight {
  id: string;
  goalType: 'weight_loss' | 'weight_gain' | 'muscle_gain' | 'maintenance' | 'performance';
  title: string;
  description: string;
  progressStatus: 'on_track' | 'behind' | 'ahead' | 'stalled';
  recommendation: string;
  actionItems: string[];
  estimatedTimeToGoal?: string;
  adjustedCalorieTarget?: number;
  adjustedMacroTargets?: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface PersonalizedInsights {
  id: string;
  userId: string;
  generatedAt: string;
  period: 'daily' | 'weekly' | 'monthly';
  overallScore: number; // 0-100
  summary: string;
  nutrientInsights: NutrientInsight[];
  mealTimingInsights: MealTimingInsight[];
  healthGoalInsights: HealthGoalInsight[];
  patterns: {
    consistencyScore: number;
    hydrationScore: number;
    varietyScore: number;
    balanceScore: number;
  };
  achievements: string[];
  challenges: string[];
  nextWeekFocus: string[];
}

export interface GoalReview {
  id: string;
  userId: string;
  reviewDate: string;
  period: 'weekly' | 'monthly' | 'quarterly';
  currentGoals: NutritionGoals;
  suggestedGoals: NutritionGoals;
  progressAnalysis: {
    calorieAdherence: number; // percentage
    proteinAdherence: number;
    carbsAdherence: number;
    fatAdherence: number;
    weightProgress: number; // kg change
    consistencyScore: number; // 0-100
    trendDirection: 'improving' | 'declining' | 'stable';
  };
  recommendations: GoalRecommendation[];
  adjustmentReason: string;
  userFeedback?: {
    energyLevel: 'low' | 'normal' | 'high';
    hungerLevel: 'always_hungry' | 'satisfied' | 'rarely_hungry';
    workoutPerformance: 'declining' | 'stable' | 'improving';
    sleepQuality: 'poor' | 'fair' | 'good' | 'excellent';
    stressLevel: 'low' | 'moderate' | 'high';
    goalSatisfaction: number; // 1-10
    additionalNotes?: string;
  };
  status: 'pending' | 'accepted' | 'rejected' | 'modified';
  implementedAt?: string;
}

export interface GoalRecommendation {
  id: string;
  type: 'calorie_adjustment' | 'macro_rebalance' | 'timing_change' | 'activity_increase' | 'hydration_focus';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  rationale: string;
  expectedOutcome: string;
  implementation: {
    timeframe: string;
    steps: string[];
    metrics: string[];
  };
  impact: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    expectedWeightChange?: number;
  };
}

export interface GoalAdjustmentHistory {
  id: string;
  userId: string;
  adjustmentDate: string;
  previousGoals: NutritionGoals;
  newGoals: NutritionGoals;
  reason: string;
  source: 'user_request' | 'system_recommendation' | 'periodic_review';
  effectiveness?: {
    adherenceImprovement: number;
    progressImprovement: number;
    satisfactionScore: number;
    reviewedAt: string;
  };
}

export interface SmartGoalSuggestion {
  id: string;
  userId: string;
  generatedAt: string;
  confidence: number; // 0-100
  suggestedGoals: NutritionGoals;
  reasoning: {
    dataPoints: string[];
    patterns: string[];
    predictions: string[];
  };
  expectedOutcomes: {
    weightChange: number;
    adherenceImprovement: number;
    energyLevel: 'improved' | 'maintained' | 'decreased';
    timeToGoal: string;
  };
  riskFactors: string[];
  alternatives: {
    conservative: NutritionGoals;
    aggressive: NutritionGoals;
  };
}