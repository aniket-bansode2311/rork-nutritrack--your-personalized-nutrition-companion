import { useEffect, useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { DailyLog, FoodItem, MealEntry, UserProfile, Recipe, RecipeEntry } from '@/types/nutrition';
import { trpcClient } from '@/lib/trpc';
import { cacheManager, CacheConfigs, CacheUtils } from '@/lib/cache-manager';

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
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [favoriteFoods, setFavoriteFoods] = useState<string[]>([]);
  const [favoriteRecipes, setFavoriteRecipes] = useState<string[]>([]);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const queryClient = useQueryClient();

  // Monitor network status
  useEffect(() => {
    const checkNetworkStatus = () => {
      setIsOfflineMode(!cacheManager.isNetworkAvailable());
    };
    
    checkNetworkStatus();
    const interval = setInterval(checkNetworkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Enhanced profile query with offline support
  const profileQuery = useQuery({
    queryKey: ['profile', 'get'],
    queryFn: async () => {
      const userId = 'current-user'; // Get from auth context
      const cacheKey = CacheUtils.generateUserKey(userId, 'profile');
      
      return await cacheManager.getWithFallback(
        cacheKey,
        async () => {
          const result = await trpcClient.profile.get.query();
          return result;
        },
        CacheConfigs.USER_PROFILE
      );
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error?.message?.includes('AUTH_ERROR') || error?.message?.includes('NETWORK_ERROR')) {
        return false;
      }
      return failureCount < 2;
    },
    placeholderData: () => ({
      id: 'offline-user',
      name: 'User',
      email: '',
      weight: 70,
      height: 170,
      age: 30,
      gender: 'other' as const,
      activity_level: 'moderate' as const,
      goal: 'maintain' as const,
      calories_goal: 2000,
      protein_goal: 150,
      carbs_goal: 250,
      fat_goal: 67,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
    networkMode: 'offlineFirst',
  });
  
  // Enhanced food entries query with offline support
  const foodEntriesQuery = useQuery({
    queryKey: ['food', 'entries', selectedDate],
    queryFn: async () => {
      const cacheKey = CacheUtils.generateDateKey(selectedDate, 'food_entries');
      
      return await cacheManager.getWithFallback(
        cacheKey,
        async () => {
          const result = await trpcClient.food.entries.query({ date: selectedDate });
          return result;
        },
        CacheConfigs.FOOD_ENTRIES
      );
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData || [],
    retry: (failureCount, error) => {
      if (error?.message?.includes('AUTH_ERROR') || error?.message?.includes('NETWORK_ERROR')) {
        return false;
      }
      return failureCount < 2;
    },
    networkMode: 'offlineFirst',
  });
  
  // Enhanced custom foods query with offline support
  const customFoodsQuery = useQuery({
    queryKey: ['customFoods', 'list'],
    queryFn: async () => {
      const userId = 'current-user';
      const cacheKey = CacheUtils.generateUserKey(userId, 'custom_foods');
      
      return await cacheManager.getWithFallback(
        cacheKey,
        async () => {
          const result = await trpcClient.customFoods.list.query({});
          return result;
        },
        CacheConfigs.FOOD_ITEMS
      );
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    placeholderData: [],
    retry: (failureCount, error) => {
      if (error?.message?.includes('AUTH_ERROR') || error?.message?.includes('NETWORK_ERROR')) {
        return false;
      }
      return failureCount < 2;
    },
    networkMode: 'offlineFirst',
  });
  
  // Enhanced recipes query with offline support
  const recipesQuery = useQuery({
    queryKey: ['recipes', 'list'],
    queryFn: async () => {
      const userId = 'current-user';
      const cacheKey = CacheUtils.generateUserKey(userId, 'recipes');
      
      return await cacheManager.getWithFallback(
        cacheKey,
        async () => {
          const result = await trpcClient.recipes.list.query({});
          return result;
        },
        CacheConfigs.RECIPES
      );
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    placeholderData: [],
    retry: (failureCount, error) => {
      if (error?.message?.includes('AUTH_ERROR') || error?.message?.includes('NETWORK_ERROR')) {
        return false;
      }
      return failureCount < 2;
    },
    networkMode: 'offlineFirst',
  });
  
  // Enhanced mutations with offline support
  const logFoodMutation = useMutation({
    mutationFn: async (data: any) => {
      if (cacheManager.isNetworkAvailable()) {
        return await trpcClient.food.log.mutate(data);
      } else {
        // Add to sync queue for offline processing
        await cacheManager.addToSyncQueue({
          type: 'create',
          table: 'food_entries',
          data,
        });
        
        // Create optimistic entry for immediate UI update
        const optimisticEntry = {
          id: `offline_${Date.now()}`,
          ...data,
          logged_at: new Date().toISOString(),
        };
        
        return optimisticEntry;
      }
    },
    onSuccess: (newEntry) => {
      // Update cache immediately
      const cacheKey = CacheUtils.generateDateKey(selectedDate, 'food_entries');
      queryClient.setQueryData(
        ['food', 'entries', selectedDate],
        (oldData: any) => oldData ? [...oldData, newEntry] : [newEntry]
      );
      
      // Update cache storage
      cacheManager.set(cacheKey, queryClient.getQueryData(['food', 'entries', selectedDate]), CacheConfigs.FOOD_ENTRIES);
    },
    onError: (error) => {
      console.error('Failed to log food:', error);
    },
  });
  
  const deleteFoodMutation = useMutation({
    mutationFn: async (data: { id: string }) => {
      if (cacheManager.isNetworkAvailable()) {
        return await trpcClient.food.delete.mutate(data);
      } else {
        // Add to sync queue for offline processing
        await cacheManager.addToSyncQueue({
          type: 'delete',
          table: 'food_entries',
          data,
        });
        
        return data;
      }
    },
    onSuccess: (_, variables) => {
      // Update cache immediately
      const cacheKey = CacheUtils.generateDateKey(selectedDate, 'food_entries');
      queryClient.setQueryData(
        ['food', 'entries', selectedDate],
        (oldData: any) => oldData ? oldData.filter((entry: any) => entry.id !== variables.id) : []
      );
      
      // Update cache storage
      cacheManager.set(cacheKey, queryClient.getQueryData(['food', 'entries', selectedDate]), CacheConfigs.FOOD_ENTRIES);
    },
  });
  
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      if (cacheManager.isNetworkAvailable()) {
        return await trpcClient.profile.update.mutate(data);
      } else {
        // Add to sync queue for offline processing
        await cacheManager.addToSyncQueue({
          type: 'update',
          table: 'profiles',
          data,
        });
        
        // Return optimistic update
        const currentProfile = queryClient.getQueryData(['profile', 'get']) as any;
        return { ...currentProfile, ...data };
      }
    },
    onSuccess: (updatedProfile) => {
      // Update cache immediately
      const userId = 'current-user';
      const cacheKey = CacheUtils.generateUserKey(userId, 'profile');
      queryClient.setQueryData(['profile', 'get'], updatedProfile);
      
      // Update cache storage
      cacheManager.set(cacheKey, updatedProfile, CacheConfigs.USER_PROFILE);
    },
  });
  
  const createCustomFoodMutation = useMutation({
    mutationFn: async (data: any) => {
      if (cacheManager.isNetworkAvailable()) {
        return await trpcClient.customFoods.create.mutate(data);
      } else {
        // Add to sync queue for offline processing
        await cacheManager.addToSyncQueue({
          type: 'create',
          table: 'custom_foods',
          data,
        });
        
        // Create optimistic entry
        const optimisticFood = {
          id: `offline_${Date.now()}`,
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        return optimisticFood;
      }
    },
    onSuccess: (newFood) => {
      // Update cache immediately
      const userId = 'current-user';
      const cacheKey = CacheUtils.generateUserKey(userId, 'custom_foods');
      queryClient.setQueryData(
        ['customFoods', 'list'],
        (oldData: any) => oldData ? [...oldData, newFood] : [newFood]
      );
      
      // Update cache storage
      cacheManager.set(cacheKey, queryClient.getQueryData(['customFoods', 'list']), CacheConfigs.FOOD_ITEMS);
    },
  });
  
  const createRecipeMutation = useMutation({
    mutationFn: async (data: any) => {
      if (cacheManager.isNetworkAvailable()) {
        return await trpcClient.recipes.create.mutate(data);
      } else {
        // Add to sync queue for offline processing
        await cacheManager.addToSyncQueue({
          type: 'create',
          table: 'recipes',
          data,
        });
        
        // Create optimistic entry
        const optimisticRecipe = {
          id: `offline_${Date.now()}`,
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        return optimisticRecipe;
      }
    },
    onSuccess: (newRecipe) => {
      // Update cache immediately
      const userId = 'current-user';
      const cacheKey = CacheUtils.generateUserKey(userId, 'recipes');
      queryClient.setQueryData(
        ['recipes', 'list'],
        (oldData: any) => oldData ? [...oldData, newRecipe] : [newRecipe]
      );
      
      // Update cache storage
      cacheManager.set(cacheKey, queryClient.getQueryData(['recipes', 'list']), CacheConfigs.RECIPES);
    },
  });

  // Transform database data to match our types
  const userProfile: UserProfile | null = useMemo(() => {
    if (!profileQuery.data) return null;
    const profile = profileQuery.data;
    return {
      id: profile.id,
      name: profile.name,
      weight: Number(profile.weight),
      height: Number(profile.height),
      age: profile.age,
      gender: profile.gender as 'male' | 'female' | 'other',
      activityLevel: profile.activity_level as 'sedentary' | 'light' | 'moderate' | 'active' | 'very active',
      goal: profile.goal as 'lose' | 'maintain' | 'gain',
      nutritionGoals: {
        calories: profile.calories_goal,
        protein: Number(profile.protein_goal),
        carbs: Number(profile.carbs_goal),
        fat: Number(profile.fat_goal),
      },
    };
  }, [profileQuery.data]);

  const mealEntries: MealEntry[] = useMemo(() => {
    if (!foodEntriesQuery.data) return [];
    return foodEntriesQuery.data.map((entry: any) => ({
      id: entry.id,
      foodItem: {
        id: entry.id,
        name: entry.food_name,
        brand: entry.brand,
        servingSize: Number(entry.serving_size),
        servingUnit: entry.serving_unit,
        calories: Number(entry.calories),
        protein: Number(entry.protein),
        carbs: Number(entry.carbs),
        fat: Number(entry.fat),
        fiber: entry.fiber ? Number(entry.fiber) : undefined,
        sugar: entry.sugar ? Number(entry.sugar) : undefined,
        sodium: entry.sodium ? Number(entry.sodium) : undefined,
      },
      servings: 1,
      mealType: entry.meal_type as 'breakfast' | 'lunch' | 'dinner' | 'snack',
      date: new Date(entry.logged_at).toISOString().split('T')[0],
    }));
  }, [foodEntriesQuery.data]);

  const customFoods: FoodItem[] = useMemo(() => {
    if (!customFoodsQuery.data) return [];
    return customFoodsQuery.data.map((food: any) => ({
      id: food.id,
      name: food.name,
      brand: food.brand,
      servingSize: Number(food.serving_size),
      servingUnit: food.serving_unit,
      calories: Number(food.calories_per_serving),
      protein: Number(food.protein_per_serving),
      carbs: Number(food.carbs_per_serving),
      fat: Number(food.fat_per_serving),
      fiber: food.fiber_per_serving ? Number(food.fiber_per_serving) : undefined,
      sugar: food.sugar_per_serving ? Number(food.sugar_per_serving) : undefined,
      sodium: food.sodium_per_serving ? Number(food.sodium_per_serving) : undefined,
    }));
  }, [customFoodsQuery.data]);

  const recipes: Recipe[] = useMemo(() => {
    if (!recipesQuery.data) return [];
    return recipesQuery.data.map((recipe: any) => ({
      id: recipe.id,
      name: recipe.name,
      description: recipe.description,
      servings: recipe.servings,
      prepTime: recipe.prep_time,
      cookTime: recipe.cook_time,
      instructions: recipe.instructions || [],
      ingredients: recipe.ingredients || [],
      nutritionPerServing: {
        calories: Number(recipe.total_calories) / recipe.servings,
        protein: Number(recipe.total_protein) / recipe.servings,
        carbs: Number(recipe.total_carbs) / recipe.servings,
        fat: Number(recipe.total_fat) / recipe.servings,
      },
      imageUrl: recipe.image_url,
      createdAt: recipe.created_at,
      updatedAt: recipe.updated_at,
    }));
  }, [recipesQuery.data]);

  const isLoading = profileQuery.isLoading || foodEntriesQuery.isLoading || customFoodsQuery.isLoading || recipesQuery.isLoading;

  // Load favorites from AsyncStorage on mount
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const storedFavoriteFoods = await AsyncStorage.getItem('favoriteFoods');
        const storedFavoriteRecipes = await AsyncStorage.getItem('favoriteRecipes');

        if (storedFavoriteFoods) {
          setFavoriteFoods(JSON.parse(storedFavoriteFoods));
        }
        if (storedFavoriteRecipes) {
          setFavoriteRecipes(JSON.parse(storedFavoriteRecipes));
        }
      } catch (error) {
        console.error('Error loading favorites from AsyncStorage:', error);
      }
    };

    loadFavorites();
  }, []);

  // Save favorites to AsyncStorage when they change
  useEffect(() => {
    const saveFavorites = async () => {
      try {
        await AsyncStorage.setItem('favoriteFoods', JSON.stringify(favoriteFoods));
        await AsyncStorage.setItem('favoriteRecipes', JSON.stringify(favoriteRecipes));
      } catch (error) {
        console.error('Error saving favorites to AsyncStorage:', error);
      }
    };

    saveFavorites();
  }, [favoriteFoods, favoriteRecipes]);

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
      totalNutrition: calculateTotalNutrition(meals, []),
    };
  };

  // Add a meal entry with offline support
  const addMealEntry = async (entry: Omit<MealEntry, 'id'>) => {
    try {
      await logFoodMutation.mutateAsync({
        food_name: entry.foodItem.name,
        brand: entry.foodItem.brand,
        serving_size: entry.foodItem.servingSize,
        serving_unit: entry.foodItem.servingUnit,
        calories: entry.foodItem.calories * entry.servings,
        protein: entry.foodItem.protein * entry.servings,
        carbs: entry.foodItem.carbs * entry.servings,
        fat: entry.foodItem.fat * entry.servings,
        fiber: entry.foodItem.fiber ? entry.foodItem.fiber * entry.servings : undefined,
        sugar: entry.foodItem.sugar ? entry.foodItem.sugar * entry.servings : undefined,
        sodium: entry.foodItem.sodium ? entry.foodItem.sodium * entry.servings : undefined,
        meal_type: entry.mealType,
        logged_at: new Date(`${entry.date}T12:00:00`).toISOString(),
      });
    } catch (error) {
      console.error('Error adding meal entry:', error);
      throw error;
    }
  };

  // Remove a meal entry with offline support
  const removeMealEntry = async (id: string) => {
    try {
      await deleteFoodMutation.mutateAsync({ id });
    } catch (error) {
      console.error('Error removing meal entry:', error);
      throw error;
    }
  };

  // Update user profile with offline support
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!userProfile) return;
    
    try {
      const updateData: any = {};
      
      if (updates.name) updateData.name = updates.name;
      if (updates.weight) updateData.weight = updates.weight;
      if (updates.height) updateData.height = updates.height;
      if (updates.age) updateData.age = updates.age;
      if (updates.gender) updateData.gender = updates.gender;
      if (updates.activityLevel) updateData.activity_level = updates.activityLevel;
      if (updates.goal) updateData.goal = updates.goal;
      if (updates.nutritionGoals) {
        updateData.calories_goal = updates.nutritionGoals.calories;
        updateData.protein_goal = updates.nutritionGoals.protein;
        updateData.carbs_goal = updates.nutritionGoals.carbs;
        updateData.fat_goal = updates.nutritionGoals.fat;
      }
      
      await updateProfileMutation.mutateAsync(updateData);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  // Enhanced search with caching
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  const foodSearchQuery = useQuery({
    queryKey: ['food', 'search', debouncedSearchQuery],
    queryFn: async () => {
      const cacheKey = CacheUtils.generateSearchKey(debouncedSearchQuery);
      
      return await cacheManager.getWithFallback(
        cacheKey,
        async () => {
          const result = await trpcClient.food.search.query({ query: debouncedSearchQuery });
          return result;
        },
        CacheConfigs.SEARCH_RESULTS
      );
    },
    enabled: debouncedSearchQuery.length > 2,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: [],
    retry: (failureCount, error) => {
      if (error?.message?.includes('AUTH_ERROR') || error?.message?.includes('NETWORK_ERROR')) {
        return false;
      }
      return failureCount < 2;
    },
    networkMode: 'offlineFirst',
  });

  // Memoized search function
  const searchFoodItems = useCallback((query: string) => {
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase().trim();
    
    // Search custom foods
    const customResults = customFoods.filter(
      (item) =>
        item.name.toLowerCase().includes(lowerQuery) ||
        (item.brand && item.brand.toLowerCase().includes(lowerQuery))
    );
    
    // Search basic foods from database
    const basicResults = (foodSearchQuery.data || []).map((food: any) => ({
      id: food.id,
      name: food.name,
      brand: food.brand,
      servingSize: Number(food.serving_size),
      servingUnit: food.serving_unit,
      calories: Number(food.calories),
      protein: Number(food.protein),
      carbs: Number(food.carbs),
      fat: Number(food.fat),
      fiber: food.fiber ? Number(food.fiber) : undefined,
      sugar: food.sugar ? Number(food.sugar) : undefined,
      sodium: food.sodium ? Number(food.sodium) : undefined,
    }));
    
    // Trigger search if query changed
    if (query !== searchQuery) {
      setSearchQuery(query);
    }
    
    // Combine results, prioritizing custom foods
    return [...customResults, ...basicResults];
  }, [customFoods, foodSearchQuery.data, searchQuery]);

  // Add a custom food item with offline support
  const addFoodItem = async (item: Omit<FoodItem, 'id'>) => {
    try {
      const result = await createCustomFoodMutation.mutateAsync({
        name: item.name,
        brand: item.brand,
        serving_size: item.servingSize,
        serving_unit: item.servingUnit,
        calories_per_serving: item.calories,
        protein_per_serving: item.protein,
        carbs_per_serving: item.carbs,
        fat_per_serving: item.fat,
        fiber_per_serving: item.fiber,
        sugar_per_serving: item.sugar,
        sodium_per_serving: item.sodium,
      });
      
      return {
        id: result.id,
        name: result.name,
        brand: result.brand,
        servingSize: Number(result.serving_size),
        servingUnit: result.serving_unit,
        calories: Number(result.calories_per_serving),
        protein: Number(result.protein_per_serving),
        carbs: Number(result.carbs_per_serving),
        fat: Number(result.fat_per_serving),
        fiber: result.fiber_per_serving ? Number(result.fiber_per_serving) : undefined,
        sugar: result.sugar_per_serving ? Number(result.sugar_per_serving) : undefined,
        sodium: result.sodium_per_serving ? Number(result.sodium_per_serving) : undefined,
      };
    } catch (error) {
      console.error('Error adding custom food:', error);
      throw error;
    }
  };
  
  // Memoized frequent foods calculation with caching
  const getFrequentFoods = useMemo(() => {
    const userId = 'current-user';
    const cacheKey = CacheUtils.generateUserKey(userId, 'frequent_foods');
    
    // Try to get from cache first
    cacheManager.get(cacheKey, CacheConfigs.FREQUENT_FOODS.version)
      .then(cachedData => {
        if (cachedData) return cachedData;
      });
    
    const foodCounts = new Map<string, { count: number; food: FoodItem; lastUsed: string }>();
    
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
    const result = Array.from(foodCounts.values())
      .sort((a, b) => {
        if (a.count !== b.count) {
          return b.count - a.count; // Higher count first
        }
        return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime(); // More recent first
      })
      .map(item => item.food)
      .slice(0, 10); // Return top 10
    
    // Cache the result
    cacheManager.set(cacheKey, result, CacheConfigs.FREQUENT_FOODS);
    
    return result;
  }, [mealEntries]);
  
  // Get favorite foods
  const getFavorites = () => {
    return customFoods.filter(food => favoriteFoods.includes(food.id));
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

  // Recipe management functions with offline support
  const addRecipe = async (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const totalNutrition = recipe.nutritionPerServing;
      const result = await createRecipeMutation.mutateAsync({
        name: recipe.name,
        description: recipe.description,
        servings: recipe.servings,
        prep_time: recipe.prepTime,
        cook_time: recipe.cookTime,
        instructions: recipe.instructions,
        ingredients: recipe.ingredients,
        total_calories: totalNutrition.calories * recipe.servings,
        total_protein: totalNutrition.protein * recipe.servings,
        total_carbs: totalNutrition.carbs * recipe.servings,
        total_fat: totalNutrition.fat * recipe.servings,
        image_url: recipe.imageUrl,
      });
      
      return {
        id: result.id,
        name: result.name,
        description: result.description,
        servings: result.servings,
        prepTime: result.prep_time,
        cookTime: result.cook_time,
        instructions: result.instructions || [],
        ingredients: result.ingredients || [],
        nutritionPerServing: {
          calories: Number(result.total_calories) / result.servings,
          protein: Number(result.total_protein) / result.servings,
          carbs: Number(result.total_carbs) / result.servings,
          fat: Number(result.total_fat) / result.servings,
        },
        imageUrl: result.image_url,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
      };
    } catch (error) {
      console.error('Error adding recipe:', error);
      throw error;
    }
  };

  const updateRecipe = async (id: string, updates: Partial<Omit<Recipe, 'id' | 'createdAt'>>) => {
    console.log('Recipe update not implemented yet:', id, updates);
  };

  const deleteRecipe = async (id: string) => {
    console.log('Recipe delete not implemented yet:', id);
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

  const addRecipeEntry = async (entry: Omit<RecipeEntry, 'id'>) => {
    console.log('Recipe entry logging not implemented yet:', entry);
  };

  const removeRecipeEntry = async (id: string) => {
    console.log('Recipe entry removal not implemented yet:', id);
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
    console.log('Recipe import from URL not implemented yet:', url);
    throw new Error('Recipe import from URL is not implemented yet');
  };

  // Cache management functions
  const clearCache = async () => {
    await cacheManager.clear();
    queryClient.clear();
  };

  const forceSyncNow = async () => {
    try {
      await cacheManager.forceSyncNow();
      // Refetch all queries after sync
      await queryClient.refetchQueries();
    } catch (error) {
      console.error('Failed to force sync:', error);
      throw error;
    }
  };

  const getCacheInfo = async () => {
    const size = await cacheManager.getCacheSize();
    const syncQueueLength = cacheManager.getSyncQueueLength();
    const isOnline = cacheManager.isNetworkAvailable();
    
    return {
      cacheSize: size,
      syncQueueLength,
      isOnline,
      isOfflineMode,
    };
  };

  return {
    userProfile,
    updateUserProfile,
    mealEntries,
    addMealEntry,
    removeMealEntry,
    updateMealEntry: async (id: string, updates: Partial<Omit<MealEntry, 'id'>>) => {
      console.log('Update meal entry not fully implemented yet:', id, updates);
    },
    foodItems: [],
    customFoods,
    searchFoodItems,
    addFoodItem,
    selectedDate,
    setSelectedDate,
    getDailyLog,
    isLoading: isLoading || foodSearchQuery.isLoading,
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
    recipeEntries: [],
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
    // Offline/cache management
    isOfflineMode,
    clearCache,
    forceSyncNow,
    getCacheInfo,
  };
});

// Custom hook to get filtered meal entries by meal type
export const useMealsByType = (mealType: MealEntry['mealType']) => {
  const { mealEntries, selectedDate } = useNutrition();
  
  return useMemo(() => 
    mealEntries.filter(
      (entry) => entry.date === selectedDate && entry.mealType === mealType
    ),
    [mealEntries, selectedDate, mealType]
  );
};

// Custom hook to get daily nutrition summary
export const useDailyNutrition = () => {
  const { getDailyLog, selectedDate, userProfile } = useNutrition();
  
  return useMemo(() => {
    const dailyLog = getDailyLog(selectedDate);
    const { totalNutrition } = dailyLog;
    
    if (!userProfile) {
      return {
        total: totalNutrition,
        goals: { calories: 2000, protein: 150, carbs: 250, fat: 67 },
        percentages: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        remaining: { calories: 2000, protein: 150, carbs: 250, fat: 67 },
      };
    }
    
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
  }, [getDailyLog, selectedDate, userProfile]);
};