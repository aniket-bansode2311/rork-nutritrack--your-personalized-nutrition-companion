import AsyncStorage from '@react-native-async-storage/async-storage';
import { cacheManager, CacheConfigs, CacheUtils } from '@/lib/cache-manager';
import { FoodItem, Recipe, MealEntry, UserProfile } from '@/types/nutrition';

export interface OfflineDataStore {
  // Core data
  userProfile: UserProfile | null;
  customFoods: FoodItem[];
  recipes: Recipe[];
  mealEntries: { [date: string]: MealEntry[] };
  
  // Frequently accessed data
  frequentFoods: FoodItem[];
  favoriteFoods: string[];
  favoriteRecipes: string[];
  
  // Search cache
  searchResults: { [query: string]: FoodItem[] };
  
  // Metadata
  lastUpdated: string;
  version: string;
}

class OfflineDataManager {
  private static instance: OfflineDataManager;
  private readonly OFFLINE_DATA_KEY = '@offline_nutrition_data';
  private readonly CURRENT_VERSION = '1.0.0';
  
  private constructor() {}

  public static getInstance(): OfflineDataManager {
    if (!OfflineDataManager.instance) {
      OfflineDataManager.instance = new OfflineDataManager();
    }
    return OfflineDataManager.instance;
  }

  // Initialize offline data store
  async initializeOfflineData(): Promise<OfflineDataStore> {
    try {
      const existingData = await this.getOfflineData();
      if (existingData && existingData.version === this.CURRENT_VERSION) {
        console.log('Loaded existing offline data');
        return existingData;
      }
      
      // Create new offline data store
      const newStore: OfflineDataStore = {
        userProfile: null,
        customFoods: [],
        recipes: [],
        mealEntries: {},
        frequentFoods: [],
        favoriteFoods: [],
        favoriteRecipes: [],
        searchResults: {},
        lastUpdated: new Date().toISOString(),
        version: this.CURRENT_VERSION,
      };
      
      await this.saveOfflineData(newStore);
      console.log('Created new offline data store');
      return newStore;
    } catch (error) {
      console.error('Failed to initialize offline data:', error);
      throw error;
    }
  }

  // Get offline data
  async getOfflineData(): Promise<OfflineDataStore | null> {
    try {
      const data = await AsyncStorage.getItem(this.OFFLINE_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get offline data:', error);
      return null;
    }
  }

  // Save offline data
  async saveOfflineData(data: OfflineDataStore): Promise<void> {
    try {
      data.lastUpdated = new Date().toISOString();
      await AsyncStorage.setItem(this.OFFLINE_DATA_KEY, JSON.stringify(data));
      console.log('Saved offline data');
    } catch (error) {
      console.error('Failed to save offline data:', error);
      throw error;
    }
  }

  // Update user profile in offline store
  async updateUserProfile(profile: UserProfile): Promise<void> {
    try {
      const data = await this.getOfflineData();
      if (data) {
        data.userProfile = profile;
        await this.saveOfflineData(data);
        
        // Also cache using cache manager
        const userId = profile.id;
        const cacheKey = CacheUtils.generateUserKey(userId, 'profile');
        await cacheManager.set(cacheKey, profile, CacheConfigs.USER_PROFILE);
      }
    } catch (error) {
      console.error('Failed to update user profile offline:', error);
      throw error;
    }
  }

  // Add custom food to offline store
  async addCustomFood(food: FoodItem): Promise<void> {
    try {
      const data = await this.getOfflineData();
      if (data) {
        // Check if food already exists
        const existingIndex = data.customFoods.findIndex(f => f.id === food.id);
        if (existingIndex >= 0) {
          data.customFoods[existingIndex] = food;
        } else {
          data.customFoods.push(food);
        }
        
        await this.saveOfflineData(data);
        
        // Also cache using cache manager
        const userId = 'current-user';
        const cacheKey = CacheUtils.generateUserKey(userId, 'custom_foods');
        await cacheManager.set(cacheKey, data.customFoods, CacheConfigs.FOOD_ITEMS);
      }
    } catch (error) {
      console.error('Failed to add custom food offline:', error);
      throw error;
    }
  }

  // Add recipe to offline store
  async addRecipe(recipe: Recipe): Promise<void> {
    try {
      const data = await this.getOfflineData();
      if (data) {
        // Check if recipe already exists
        const existingIndex = data.recipes.findIndex(r => r.id === recipe.id);
        if (existingIndex >= 0) {
          data.recipes[existingIndex] = recipe;
        } else {
          data.recipes.push(recipe);
        }
        
        await this.saveOfflineData(data);
        
        // Also cache using cache manager
        const userId = 'current-user';
        const cacheKey = CacheUtils.generateUserKey(userId, 'recipes');
        await cacheManager.set(cacheKey, data.recipes, CacheConfigs.RECIPES);
      }
    } catch (error) {
      console.error('Failed to add recipe offline:', error);
      throw error;
    }
  }

  // Add meal entry to offline store
  async addMealEntry(entry: MealEntry): Promise<void> {
    try {
      const data = await this.getOfflineData();
      if (data) {
        if (!data.mealEntries[entry.date]) {
          data.mealEntries[entry.date] = [];
        }
        
        // Check if entry already exists
        const existingIndex = data.mealEntries[entry.date].findIndex(e => e.id === entry.id);
        if (existingIndex >= 0) {
          data.mealEntries[entry.date][existingIndex] = entry;
        } else {
          data.mealEntries[entry.date].push(entry);
        }
        
        await this.saveOfflineData(data);
        
        // Also cache using cache manager
        const cacheKey = CacheUtils.generateDateKey(entry.date, 'food_entries');
        await cacheManager.set(cacheKey, data.mealEntries[entry.date], CacheConfigs.FOOD_ENTRIES);
      }
    } catch (error) {
      console.error('Failed to add meal entry offline:', error);
      throw error;
    }
  }

  // Remove meal entry from offline store
  async removeMealEntry(entryId: string, date: string): Promise<void> {
    try {
      const data = await this.getOfflineData();
      if (data && data.mealEntries[date]) {
        data.mealEntries[date] = data.mealEntries[date].filter(e => e.id !== entryId);
        
        await this.saveOfflineData(data);
        
        // Also update cache
        const cacheKey = CacheUtils.generateDateKey(date, 'food_entries');
        await cacheManager.set(cacheKey, data.mealEntries[date], CacheConfigs.FOOD_ENTRIES);
      }
    } catch (error) {
      console.error('Failed to remove meal entry offline:', error);
      throw error;
    }
  }

  // Update frequent foods
  async updateFrequentFoods(foods: FoodItem[]): Promise<void> {
    try {
      const data = await this.getOfflineData();
      if (data) {
        data.frequentFoods = foods.slice(0, 10); // Keep top 10
        await this.saveOfflineData(data);
        
        // Also cache using cache manager
        const userId = 'current-user';
        const cacheKey = CacheUtils.generateUserKey(userId, 'frequent_foods');
        await cacheManager.set(cacheKey, data.frequentFoods, CacheConfigs.FREQUENT_FOODS);
      }
    } catch (error) {
      console.error('Failed to update frequent foods offline:', error);
      throw error;
    }
  }

  // Update favorites
  async updateFavorites(foodIds: string[], recipeIds: string[]): Promise<void> {
    try {
      const data = await this.getOfflineData();
      if (data) {
        data.favoriteFoods = foodIds;
        data.favoriteRecipes = recipeIds;
        await this.saveOfflineData(data);
      }
    } catch (error) {
      console.error('Failed to update favorites offline:', error);
      throw error;
    }
  }

  // Cache search results
  async cacheSearchResults(query: string, results: FoodItem[]): Promise<void> {
    try {
      const data = await this.getOfflineData();
      if (data) {
        // Limit search cache size
        const maxCacheSize = 50;
        const cacheKeys = Object.keys(data.searchResults);
        
        if (cacheKeys.length >= maxCacheSize) {
          // Remove oldest entries
          const keysToRemove = cacheKeys.slice(0, cacheKeys.length - maxCacheSize + 1);
          keysToRemove.forEach(key => {
            delete data.searchResults[key];
          });
        }
        
        data.searchResults[query.toLowerCase()] = results;
        await this.saveOfflineData(data);
        
        // Also cache using cache manager
        const cacheKey = CacheUtils.generateSearchKey(query);
        await cacheManager.set(cacheKey, results, CacheConfigs.SEARCH_RESULTS);
      }
    } catch (error) {
      console.error('Failed to cache search results offline:', error);
      throw error;
    }
  }

  // Get cached search results
  async getCachedSearchResults(query: string): Promise<FoodItem[] | null> {
    try {
      const data = await this.getOfflineData();
      if (data && data.searchResults[query.toLowerCase()]) {
        return data.searchResults[query.toLowerCase()];
      }
      
      // Also try cache manager
      const cacheKey = CacheUtils.generateSearchKey(query);
      return await cacheManager.get<FoodItem[]>(cacheKey, CacheConfigs.SEARCH_RESULTS.version);
    } catch (error) {
      console.error('Failed to get cached search results:', error);
      return null;
    }
  }

  // Get meal entries for a specific date
  async getMealEntriesForDate(date: string): Promise<MealEntry[]> {
    try {
      const data = await this.getOfflineData();
      if (data && data.mealEntries[date]) {
        return data.mealEntries[date];
      }
      
      // Also try cache manager
      const cacheKey = CacheUtils.generateDateKey(date, 'food_entries');
      const cached = await cacheManager.get<any[]>(cacheKey, CacheConfigs.FOOD_ENTRIES.version);
      
      if (cached) {
        // Transform cached data to MealEntry format
        return cached.map((entry: any) => ({
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
      }
      
      return [];
    } catch (error) {
      console.error('Failed to get meal entries for date:', error);
      return [];
    }
  }

  // Sync offline data with server data
  async syncWithServerData(serverData: {
    userProfile?: UserProfile;
    customFoods?: FoodItem[];
    recipes?: Recipe[];
    mealEntries?: { [date: string]: MealEntry[] };
  }): Promise<void> {
    try {
      const data = await this.getOfflineData();
      if (!data) return;
      
      // Merge server data with offline data
      if (serverData.userProfile) {
        data.userProfile = serverData.userProfile;
      }
      
      if (serverData.customFoods) {
        // Merge custom foods, preferring server data for conflicts
        const mergedFoods = [...serverData.customFoods];
        data.customFoods.forEach(offlineFood => {
          if (!mergedFoods.find(f => f.id === offlineFood.id)) {
            mergedFoods.push(offlineFood);
          }
        });
        data.customFoods = mergedFoods;
      }
      
      if (serverData.recipes) {
        // Merge recipes, preferring server data for conflicts
        const mergedRecipes = [...serverData.recipes];
        data.recipes.forEach(offlineRecipe => {
          if (!mergedRecipes.find(r => r.id === offlineRecipe.id)) {
            mergedRecipes.push(offlineRecipe);
          }
        });
        data.recipes = mergedRecipes;
      }
      
      if (serverData.mealEntries) {
        // Merge meal entries by date
        Object.keys(serverData.mealEntries).forEach(date => {
          if (!data.mealEntries[date]) {
            data.mealEntries[date] = [];
          }
          
          const serverEntries = serverData.mealEntries![date];
          const mergedEntries = [...serverEntries];
          
          data.mealEntries[date].forEach(offlineEntry => {
            if (!mergedEntries.find(e => e.id === offlineEntry.id)) {
              mergedEntries.push(offlineEntry);
            }
          });
          
          data.mealEntries[date] = mergedEntries;
        });
      }
      
      await this.saveOfflineData(data);
      console.log('Synced offline data with server data');
    } catch (error) {
      console.error('Failed to sync offline data with server:', error);
      throw error;
    }
  }

  // Clear all offline data
  async clearOfflineData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.OFFLINE_DATA_KEY);
      await cacheManager.clear();
      console.log('Cleared all offline data');
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      throw error;
    }
  }

  // Get offline data size
  async getOfflineDataSize(): Promise<{ totalSize: number; breakdown: { [key: string]: number } }> {
    try {
      const data = await this.getOfflineData();
      if (!data) {
        return { totalSize: 0, breakdown: {} };
      }
      
      const breakdown = {
        userProfile: JSON.stringify(data.userProfile || {}).length,
        customFoods: JSON.stringify(data.customFoods).length,
        recipes: JSON.stringify(data.recipes).length,
        mealEntries: JSON.stringify(data.mealEntries).length,
        frequentFoods: JSON.stringify(data.frequentFoods).length,
        favorites: JSON.stringify({ foods: data.favoriteFoods, recipes: data.favoriteRecipes }).length,
        searchResults: JSON.stringify(data.searchResults).length,
      };
      
      const totalSize = Object.values(breakdown).reduce((sum, size) => sum + size, 0);
      
      return { totalSize, breakdown };
    } catch (error) {
      console.error('Failed to get offline data size:', error);
      return { totalSize: 0, breakdown: {} };
    }
  }

  // Optimize offline data (remove old entries, compress data)
  async optimizeOfflineData(): Promise<void> {
    try {
      const data = await this.getOfflineData();
      if (!data) return;
      
      // Remove meal entries older than 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const cutoffDate = ninetyDaysAgo.toISOString().split('T')[0];
      
      Object.keys(data.mealEntries).forEach(date => {
        if (date < cutoffDate) {
          delete data.mealEntries[date];
        }
      });
      
      // Limit search results cache
      const searchKeys = Object.keys(data.searchResults);
      if (searchKeys.length > 20) {
        const keysToKeep = searchKeys.slice(-20); // Keep last 20 searches
        const newSearchResults: { [key: string]: FoodItem[] } = {};
        keysToKeep.forEach(key => {
          newSearchResults[key] = data.searchResults[key];
        });
        data.searchResults = newSearchResults;
      }
      
      // Limit frequent foods to top 10
      data.frequentFoods = data.frequentFoods.slice(0, 10);
      
      await this.saveOfflineData(data);
      console.log('Optimized offline data');
    } catch (error) {
      console.error('Failed to optimize offline data:', error);
      throw error;
    }
  }
}

export const offlineDataManager = OfflineDataManager.getInstance();