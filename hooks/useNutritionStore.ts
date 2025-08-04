import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState } from 'react';

import { mockMealEntries } from '@/mocks/mealEntries';
import { mockUserProfile } from '@/mocks/userProfile';
import { DailyLog, FoodItem, MealEntry, UserProfile } from '@/types/nutrition';
import { mockFoodItems } from '@/mocks/foodItems';

// Helper function to calculate total nutrition for a day
const calculateTotalNutrition = (meals: MealEntry[]) => {
  return meals.reduce(
    (acc, meal) => {
      const { foodItem, servings } = meal;
      return {
        calories: acc.calories + foodItem.calories * servings,
        protein: acc.protein + foodItem.protein * servings,
        carbs: acc.carbs + foodItem.carbs * servings,
        fat: acc.fat + foodItem.fat * servings,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
};

// Helper to get today's date in YYYY-MM-DD format
const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

export const [NutritionProvider, useNutrition] = createContextHook(() => {
  const [userProfile, setUserProfile] = useState<UserProfile>(mockUserProfile);
  const [mealEntries, setMealEntries] = useState<MealEntry[]>(mockMealEntries);
  const [foodItems, setFoodItems] = useState<FoodItem[]>(mockFoodItems);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load data from AsyncStorage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedUserProfile = await AsyncStorage.getItem('userProfile');
        const storedMealEntries = await AsyncStorage.getItem('mealEntries');
        const storedFoodItems = await AsyncStorage.getItem('foodItems');

        if (storedUserProfile) {
          setUserProfile(JSON.parse(storedUserProfile));
        }
        if (storedMealEntries) {
          setMealEntries(JSON.parse(storedMealEntries));
        }
        if (storedFoodItems) {
          setFoodItems(JSON.parse(storedFoodItems));
        }
      } catch (error) {
        console.error('Error loading data from AsyncStorage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Save data to AsyncStorage when it changes
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem('userProfile', JSON.stringify(userProfile));
        await AsyncStorage.setItem('mealEntries', JSON.stringify(mealEntries));
        await AsyncStorage.setItem('foodItems', JSON.stringify(foodItems));
      } catch (error) {
        console.error('Error saving data to AsyncStorage:', error);
      }
    };

    if (!isLoading) {
      saveData();
    }
  }, [userProfile, mealEntries, foodItems, isLoading]);

  // Get meals for the selected date
  const getMealsForDate = (date: string) => {
    return mealEntries.filter((entry) => entry.date === date);
  };

  // Get daily log for the selected date
  const getDailyLog = (date: string): DailyLog => {
    const meals = getMealsForDate(date);
    return {
      date,
      meals,
      totalNutrition: calculateTotalNutrition(meals),
    };
  };

  // Add a meal entry
  const addMealEntry = (entry: Omit<MealEntry, 'id'>) => {
    const newEntry: MealEntry = {
      ...entry,
      id: Date.now().toString(),
    };
    setMealEntries((prev) => [...prev, newEntry]);
  };

  // Remove a meal entry
  const removeMealEntry = (id: string) => {
    setMealEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  // Update a meal entry
  const updateMealEntry = (id: string, updates: Partial<Omit<MealEntry, 'id'>>) => {
    setMealEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, ...updates } : entry
      )
    );
  };

  // Update user profile
  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...updates }));
  };

  // Search food items
  const searchFoodItems = (query: string) => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase().trim();
    return foodItems.filter(
      (item) =>
        item.name.toLowerCase().includes(lowerQuery) ||
        (item.brand && item.brand.toLowerCase().includes(lowerQuery))
    );
  };

  // Add a custom food item
  const addFoodItem = (item: Omit<FoodItem, 'id'>) => {
    const newItem: FoodItem = {
      ...item,
      id: Date.now().toString(),
    };
    setFoodItems((prev) => [...prev, newItem]);
    return newItem;
  };

  return {
    userProfile,
    updateUserProfile,
    mealEntries,
    addMealEntry,
    removeMealEntry,
    updateMealEntry,
    foodItems,
    searchFoodItems,
    addFoodItem,
    selectedDate,
    setSelectedDate,
    getDailyLog,
    isLoading,
  };
});

// Custom hook to get filtered meal entries by meal type
export const useMealsByType = (mealType: MealEntry['mealType']) => {
  const { mealEntries, selectedDate } = useNutrition();
  
  return mealEntries.filter(
    (entry) => entry.date === selectedDate && entry.mealType === mealType
  );
};

// Custom hook to get daily nutrition summary
export const useDailyNutrition = () => {
  const { getDailyLog, selectedDate, userProfile } = useNutrition();
  
  const dailyLog = getDailyLog(selectedDate);
  const { totalNutrition } = dailyLog;
  const { nutritionGoals } = userProfile;
  
  const percentages = {
    calories: (totalNutrition.calories / nutritionGoals.calories) * 100,
    protein: (totalNutrition.protein / nutritionGoals.protein) * 100,
    carbs: (totalNutrition.carbs / nutritionGoals.carbs) * 100,
    fat: (totalNutrition.fat / nutritionGoals.fat) * 100,
  };
  
  return {
    total: totalNutrition,
    goals: nutritionGoals,
    percentages,
    remaining: {
      calories: nutritionGoals.calories - totalNutrition.calories,
      protein: nutritionGoals.protein - totalNutrition.protein,
      carbs: nutritionGoals.carbs - totalNutrition.carbs,
      fat: nutritionGoals.fat - totalNutrition.fat,
    },
  };
};