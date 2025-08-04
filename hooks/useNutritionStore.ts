import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState } from 'react';

import { mockMealEntries } from '@/mocks/mealEntries';
import { mockUserProfile } from '@/mocks/userProfile';
import { DailyLog, FoodItem, MealEntry, UserProfile, Recipe, RecipeEntry } from '@/types/nutrition';
import { mockFoodItems } from '@/mocks/foodItems';
import { mockRecipes } from '@/mocks/recipes';

// Helper function to calculate total nutrition for a day
const calculateTotalNutrition = (meals: MealEntry[], recipes: RecipeEntry[] = []) => {
  const mealNutrition = meals.reduce(
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
  
  const recipeNutrition = recipes.reduce(
    (acc, recipe) => {
      const { nutritionPerServing } = recipe.recipe;
      const { servings } = recipe;
      return {
        calories: acc.calories + nutritionPerServing.calories * servings,
        protein: acc.protein + nutritionPerServing.protein * servings,
        carbs: acc.carbs + nutritionPerServing.carbs * servings,
        fat: acc.fat + nutritionPerServing.fat * servings,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  
  return {
    calories: mealNutrition.calories + recipeNutrition.calories,
    protein: mealNutrition.protein + recipeNutrition.protein,
    carbs: mealNutrition.carbs + recipeNutrition.carbs,
    fat: mealNutrition.fat + recipeNutrition.fat,
  };
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
  const [favoriteFoods, setFavoriteFoods] = useState<string[]>([]);
  const [customFoods, setCustomFoods] = useState<FoodItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>(mockRecipes);
  const [recipeEntries, setRecipeEntries] = useState<RecipeEntry[]>([]);
  const [favoriteRecipes, setFavoriteRecipes] = useState<string[]>([]);

  // Load data from AsyncStorage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedUserProfile = await AsyncStorage.getItem('userProfile');
        const storedMealEntries = await AsyncStorage.getItem('mealEntries');
        const storedFoodItems = await AsyncStorage.getItem('foodItems');
        const storedFavoriteFoods = await AsyncStorage.getItem('favoriteFoods');
        const storedCustomFoods = await AsyncStorage.getItem('customFoods');
        const storedRecipes = await AsyncStorage.getItem('recipes');
        const storedRecipeEntries = await AsyncStorage.getItem('recipeEntries');
        const storedFavoriteRecipes = await AsyncStorage.getItem('favoriteRecipes');

        if (storedUserProfile) {
          setUserProfile(JSON.parse(storedUserProfile));
        }
        if (storedMealEntries) {
          setMealEntries(JSON.parse(storedMealEntries));
        }
        if (storedFoodItems) {
          setFoodItems(JSON.parse(storedFoodItems));
        }
        if (storedFavoriteFoods) {
          setFavoriteFoods(JSON.parse(storedFavoriteFoods));
        }
        if (storedCustomFoods) {
          setCustomFoods(JSON.parse(storedCustomFoods));
        }
        if (storedRecipes) {
          setRecipes(JSON.parse(storedRecipes));
        }
        if (storedRecipeEntries) {
          setRecipeEntries(JSON.parse(storedRecipeEntries));
        }
        if (storedFavoriteRecipes) {
          setFavoriteRecipes(JSON.parse(storedFavoriteRecipes));
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
        await AsyncStorage.setItem('favoriteFoods', JSON.stringify(favoriteFoods));
        await AsyncStorage.setItem('customFoods', JSON.stringify(customFoods));
        await AsyncStorage.setItem('recipes', JSON.stringify(recipes));
        await AsyncStorage.setItem('recipeEntries', JSON.stringify(recipeEntries));
        await AsyncStorage.setItem('favoriteRecipes', JSON.stringify(favoriteRecipes));
      } catch (error) {
        console.error('Error saving data to AsyncStorage:', error);
      }
    };

    if (!isLoading) {
      saveData();
    }
  }, [userProfile, mealEntries, foodItems, favoriteFoods, customFoods, recipes, recipeEntries, favoriteRecipes, isLoading]);

  // Get meals for the selected date
  const getMealsForDate = (date: string) => {
    return mealEntries.filter((entry) => entry.date === date);
  };

  // Get daily log for the selected date
  const getDailyLog = (date: string): DailyLog => {
    const meals = getMealsForDate(date);
    const recipes = recipeEntries.filter(entry => entry.date === date);
    return {
      date,
      meals,
      totalNutrition: calculateTotalNutrition(meals, recipes),
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

  // Search food items (includes custom foods)
  const searchFoodItems = (query: string) => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase().trim();
    const allFoods = [...foodItems, ...customFoods];
    return allFoods.filter(
      (item) =>
        item.name.toLowerCase().includes(lowerQuery) ||
        (item.brand && item.brand.toLowerCase().includes(lowerQuery))
    );
  };

  // Add a custom food item
  const addFoodItem = (item: Omit<FoodItem, 'id'>) => {
    const newItem: FoodItem = {
      ...item,
      id: `custom-${Date.now()}`,
    };
    setCustomFoods((prev) => [...prev, newItem]);
    return newItem;
  };
  
  // Get frequent foods based on meal entries
  const getFrequentFoods = () => {
    const foodCounts = new Map<string, { count: number; food: FoodItem; lastUsed: string }>();
    const allFoods = [...foodItems, ...customFoods];
    
    // Count food usage in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    mealEntries.forEach(entry => {
      const entryDate = new Date(entry.date);
      if (entryDate >= thirtyDaysAgo) {
        const existing = foodCounts.get(entry.foodItem.id);
        if (existing) {
          existing.count++;
          if (entry.date > existing.lastUsed) {
            existing.lastUsed = entry.date;
          }
        } else {
          foodCounts.set(entry.foodItem.id, {
            count: 1,
            food: entry.foodItem,
            lastUsed: entry.date
          });
        }
      }
    });
    
    // Sort by usage count and recency
    return Array.from(foodCounts.values())
      .sort((a, b) => {
        if (a.count !== b.count) {
          return b.count - a.count; // Higher count first
        }
        return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime(); // More recent first
      })
      .map(item => item.food)
      .slice(0, 10); // Return top 10
  };
  
  // Get favorite foods
  const getFavorites = () => {
    const allFoods = [...foodItems, ...customFoods];
    return allFoods.filter(food => favoriteFoods.includes(food.id));
  };
  
  // Toggle favorite status
  const toggleFavorite = (foodId: string) => {
    setFavoriteFoods(prev => {
      if (prev.includes(foodId)) {
        return prev.filter(id => id !== foodId);
      } else {
        return [...prev, foodId];
      }
    });
  };
  
  // Check if food is favorite
  const isFavorite = (foodId: string) => {
    return favoriteFoods.includes(foodId);
  };

  // Recipe management functions
  const addRecipe = (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newRecipe: Recipe = {
      ...recipe,
      id: `recipe-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setRecipes(prev => [...prev, newRecipe]);
    return newRecipe;
  };

  const updateRecipe = (id: string, updates: Partial<Omit<Recipe, 'id' | 'createdAt'>>) => {
    setRecipes(prev =>
      prev.map(recipe =>
        recipe.id === id
          ? { ...recipe, ...updates, updatedAt: new Date().toISOString() }
          : recipe
      )
    );
  };

  const deleteRecipe = (id: string) => {
    setRecipes(prev => prev.filter(recipe => recipe.id !== id));
    setRecipeEntries(prev => prev.filter(entry => entry.recipe.id !== id));
    setFavoriteRecipes(prev => prev.filter(recipeId => recipeId !== id));
  };

  const searchRecipes = (query: string) => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase().trim();
    return recipes.filter(
      recipe =>
        recipe.name.toLowerCase().includes(lowerQuery) ||
        recipe.description?.toLowerCase().includes(lowerQuery) ||
        recipe.category?.toLowerCase().includes(lowerQuery) ||
        recipe.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  };

  const addRecipeEntry = (entry: Omit<RecipeEntry, 'id'>) => {
    const newEntry: RecipeEntry = {
      ...entry,
      id: `recipe-entry-${Date.now()}`,
    };
    setRecipeEntries(prev => [...prev, newEntry]);
  };

  const removeRecipeEntry = (id: string) => {
    setRecipeEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const toggleRecipeFavorite = (recipeId: string) => {
    setFavoriteRecipes(prev => {
      if (prev.includes(recipeId)) {
        return prev.filter(id => id !== recipeId);
      } else {
        return [...prev, recipeId];
      }
    });
  };

  const isRecipeFavorite = (recipeId: string) => {
    return favoriteRecipes.includes(recipeId);
  };

  const getFavoriteRecipes = () => {
    return recipes.filter(recipe => favoriteRecipes.includes(recipe.id));
  };

  const getRecipesByCategory = (category: string) => {
    return recipes.filter(recipe => recipe.category === category);
  };

  const getRecipesByTag = (tag: string) => {
    return recipes.filter(recipe => recipe.tags?.includes(tag));
  };

  const calculateRecipeNutrition = (recipe: Recipe) => {
    const totalNutrition = recipe.ingredients.reduce(
      (acc, ingredient) => {
        const { foodItem, quantity, unit } = ingredient;
        // Convert quantity to grams based on food item's serving size
        const servingRatio = unit === 'g' ? quantity / foodItem.servingSize : quantity;
        
        return {
          calories: acc.calories + (foodItem.calories * servingRatio),
          protein: acc.protein + (foodItem.protein * servingRatio),
          carbs: acc.carbs + (foodItem.carbs * servingRatio),
          fat: acc.fat + (foodItem.fat * servingRatio),
          fiber: acc.fiber + ((foodItem.fiber || 0) * servingRatio),
          sugar: acc.sugar + ((foodItem.sugar || 0) * servingRatio),
          sodium: acc.sodium + ((foodItem.sodium || 0) * servingRatio),
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
    );

    // Return nutrition per serving
    return {
      calories: totalNutrition.calories / recipe.servings,
      protein: totalNutrition.protein / recipe.servings,
      carbs: totalNutrition.carbs / recipe.servings,
      fat: totalNutrition.fat / recipe.servings,
      fiber: totalNutrition.fiber / recipe.servings,
      sugar: totalNutrition.sugar / recipe.servings,
      sodium: totalNutrition.sodium / recipe.servings,
    };
  };

  const importRecipeFromUrl = async (url: string) => {
    // This would integrate with a recipe parsing API
    // For now, return a placeholder
    console.log('Recipe import from URL not implemented yet:', url);
    throw new Error('Recipe import from URL is not implemented yet');
  };

  return {
    userProfile,
    updateUserProfile,
    mealEntries,
    addMealEntry,
    removeMealEntry,
    updateMealEntry,
    foodItems,
    customFoods,
    searchFoodItems,
    addFoodItem,
    selectedDate,
    setSelectedDate,
    getDailyLog,
    isLoading,
    getFrequentFoods,
    getFavorites,
    toggleFavorite,
    isFavorite,
    favoriteFoods,
    // Recipe management
    recipes,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    searchRecipes,
    recipeEntries,
    addRecipeEntry,
    removeRecipeEntry,
    favoriteRecipes,
    toggleRecipeFavorite,
    isRecipeFavorite,
    getFavoriteRecipes,
    getRecipesByCategory,
    getRecipesByTag,
    calculateRecipeNutrition,
    importRecipeFromUrl,
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