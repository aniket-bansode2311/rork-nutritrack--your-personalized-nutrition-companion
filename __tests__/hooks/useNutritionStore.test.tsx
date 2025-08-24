import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useNutrition, useMealsByType, useDailyNutrition } from '@/hooks/useNutritionStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock tRPC
const mockTrpcQueries = {
  profile: {
    get: {
      useQuery: jest.fn(() => ({
        data: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
          weight: 70,
          height: 170,
          age: 30,
          gender: 'male',
          activity_level: 'moderate',
          goal: 'maintain',
          calories_goal: 2000,
          protein_goal: 150,
          carbs_goal: 250,
          fat_goal: 67,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        isLoading: false,
        error: null,
      })),
    },
    update: {
      useMutation: jest.fn(() => ({
        mutateAsync: jest.fn(),
      })),
    },
  },
  food: {
    entries: {
      useQuery: jest.fn(() => ({
        data: [],
        isLoading: false,
        error: null,
      })),
    },
    log: {
      useMutation: jest.fn(() => ({
        mutateAsync: jest.fn(),
      })),
    },
    delete: {
      useMutation: jest.fn(() => ({
        mutateAsync: jest.fn(),
      })),
    },
    search: {
      useQuery: jest.fn(() => ({
        data: [],
        isLoading: false,
        error: null,
      })),
    },
  },
  customFoods: {
    list: {
      useQuery: jest.fn(() => ({
        data: [],
        isLoading: false,
        error: null,
      })),
    },
    create: {
      useMutation: jest.fn(() => ({
        mutateAsync: jest.fn(),
      })),
    },
  },
  recipes: {
    list: {
      useQuery: jest.fn(() => ({
        data: [],
        isLoading: false,
        error: null,
      })),
    },
    create: {
      useMutation: jest.fn(() => ({
        mutateAsync: jest.fn(),
      })),
    },
  },
};

jest.mock('@/lib/trpc', () => ({
  trpc: mockTrpcQueries,
}));

// Mock AsyncStorage
const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock useQueryClient
const mockQueryClient = {
  setQueryData: jest.fn(),
  invalidateQueries: jest.fn(),
  getQueryData: jest.fn(),
};

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => mockQueryClient,
}));

describe('useNutrition Hook', () => {
  let queryClient: QueryClient;
  
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
  });

  describe('Initial State', () => {
    it('should initialize with default values', async () => {
      const { result } = renderHook(() => useNutrition(), { wrapper });
      
      expect(result.current.selectedDate).toBe(new Date().toISOString().split('T')[0]);
      expect(result.current.mealEntries).toEqual([]);
      expect(result.current.customFoods).toEqual([]);
      expect(result.current.recipes).toEqual([]);
      expect(result.current.favoriteFoods).toEqual([]);
    });

    it('should load user profile data', async () => {
      const { result } = renderHook(() => useNutrition(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.userProfile).toEqual({
          id: 'user-1',
          name: 'Test User',
          weight: 70,
          height: 170,
          age: 30,
          gender: 'male',
          activityLevel: 'moderate',
          goal: 'maintain',
          nutritionGoals: {
            calories: 2000,
            protein: 150,
            carbs: 250,
            fat: 67,
          },
        });
      });
    });

    it('should handle loading state', () => {
      (mockTrpcQueries.profile.get.useQuery as jest.Mock).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      const { result } = renderHook(() => useNutrition(), { wrapper });
      
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Food Entry Management', () => {
    it('should add meal entry successfully', async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue({
        id: 'entry-1',
        food_name: 'Apple',
        calories: 95,
        protein: 0.5,
        carbs: 25,
        fat: 0.3,
      });

      mockTrpcQueries.food.log.useMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
      });

      const { result } = renderHook(() => useNutrition(), { wrapper });

      const mealEntry = {
        foodItem: {
          id: 'food-1',
          name: 'Apple',
          brand: '',
          servingSize: 100,
          servingUnit: 'g',
          calories: 95,
          protein: 0.5,
          carbs: 25,
          fat: 0.3,
        },
        servings: 1,
        mealType: 'breakfast' as const,
        date: '2024-01-01',
      };

      await act(async () => {
        await result.current.addMealEntry(mealEntry);
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        food_name: 'Apple',
        brand: '',
        serving_size: 100,
        serving_unit: 'g',
        calories: 95,
        protein: 0.5,
        carbs: 25,
        fat: 0.3,
        fiber: undefined,
        sugar: undefined,
        sodium: undefined,
        meal_type: 'breakfast',
        logged_at: new Date('2024-01-01T12:00:00').toISOString(),
      });
    });

    it('should remove meal entry successfully', async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);

      mockTrpcQueries.food.delete.useMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
      });

      const { result } = renderHook(() => useNutrition(), { wrapper });

      await act(async () => {
        await result.current.removeMealEntry('entry-1');
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({ id: 'entry-1' });
    });

    it('should handle meal entry errors', async () => {
      const mockError = new Error('Network error');
      const mockMutateAsync = jest.fn().mockRejectedValue(mockError);

      mockTrpcQueries.food.log.useMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
      });

      const { result } = renderHook(() => useNutrition(), { wrapper });

      const mealEntry = {
        foodItem: {
          id: 'food-1',
          name: 'Apple',
          brand: '',
          servingSize: 100,
          servingUnit: 'g',
          calories: 95,
          protein: 0.5,
          carbs: 25,
          fat: 0.3,
        },
        servings: 1,
        mealType: 'breakfast' as const,
        date: '2024-01-01',
      };

      await expect(result.current.addMealEntry(mealEntry)).rejects.toThrow('Network error');
    });
  });

  describe('Food Search', () => {
    it('should search food items', () => {
      const mockFoodData = [
        {
          id: 'food-1',
          name: 'Apple',
          brand: 'Fresh',
          serving_size: 100,
          serving_unit: 'g',
          calories: 95,
          protein: 0.5,
          carbs: 25,
          fat: 0.3,
        },
      ];

      (mockTrpcQueries.food.search.useQuery as jest.Mock).mockReturnValue({
        data: mockFoodData,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useNutrition(), { wrapper });

      const searchResults = result.current.searchFoodItems('apple');
      
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].name).toBe('Apple');
    });

    it('should return empty array for empty search query', () => {
      const { result } = renderHook(() => useNutrition(), { wrapper });

      const searchResults = result.current.searchFoodItems('');
      
      expect(searchResults).toEqual([]);
    });
  });

  describe('Favorites Management', () => {
    it('should load favorites from AsyncStorage', async () => {
      const mockFavorites = ['food-1', 'food-2'];
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'favoriteFoods') {
          return Promise.resolve(JSON.stringify(mockFavorites));
        }
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useNutrition(), { wrapper });

      await waitFor(() => {
        expect(result.current.favoriteFoods).toEqual(mockFavorites);
      });
    });

    it('should toggle favorite status', async () => {
      const { result } = renderHook(() => useNutrition(), { wrapper });

      act(() => {
        result.current.toggleFavorite('food-1');
      });

      expect(result.current.favoriteFoods).toContain('food-1');
      expect(result.current.isFavorite('food-1')).toBe(true);

      act(() => {
        result.current.toggleFavorite('food-1');
      });

      expect(result.current.favoriteFoods).not.toContain('food-1');
      expect(result.current.isFavorite('food-1')).toBe(false);
    });
  });

  describe('Date Management', () => {
    it('should change selected date', () => {
      const { result } = renderHook(() => useNutrition(), { wrapper });

      act(() => {
        result.current.setSelectedDate('2024-01-01');
      });

      expect(result.current.selectedDate).toBe('2024-01-01');
    });
  });

  describe('Profile Management', () => {
    it('should update user profile', async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue({
        id: 'user-1',
        name: 'Updated User',
        weight: 75,
      });

      mockTrpcQueries.profile.update.useMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
      });

      const { result } = renderHook(() => useNutrition(), { wrapper });

      const updates = {
        name: 'Updated User',
        weight: 75,
      };

      await act(async () => {
        await result.current.updateUserProfile(updates);
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        name: 'Updated User',
        weight: 75,
      });
    });
  });
});

describe('useMealsByType Hook', () => {
  let queryClient: QueryClient;
  
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  it('should filter meals by type', () => {
    const mockMealEntries = [
      {
        id: 'entry-1',
        food_name: 'Apple',
        meal_type: 'breakfast',
        logged_at: new Date().toISOString(),
        calories: 95,
        protein: 0.5,
        carbs: 25,
        fat: 0.3,
      },
      {
        id: 'entry-2',
        food_name: 'Sandwich',
        meal_type: 'lunch',
        logged_at: new Date().toISOString(),
        calories: 300,
        protein: 15,
        carbs: 40,
        fat: 10,
      },
    ];

    (mockTrpcQueries.food.entries.useQuery as jest.Mock).mockReturnValue({
      data: mockMealEntries,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useMealsByType('breakfast'), { wrapper });

    expect(result.current).toHaveLength(1);
    expect(result.current[0].foodItem.name).toBe('Apple');
  });
});

describe('useDailyNutrition Hook', () => {
  let queryClient: QueryClient;
  
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  it('should calculate daily nutrition summary', () => {
    const mockMealEntries = [
      {
        id: 'entry-1',
        food_name: 'Apple',
        meal_type: 'breakfast',
        logged_at: new Date().toISOString(),
        calories: 95,
        protein: 0.5,
        carbs: 25,
        fat: 0.3,
      },
    ];

    (mockTrpcQueries.food.entries.useQuery as jest.Mock).mockReturnValue({
      data: mockMealEntries,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useDailyNutrition(), { wrapper });

    expect(result.current.total.calories).toBe(95);
    expect(result.current.goals.calories).toBe(2000);
    expect(result.current.percentages.calories).toBeCloseTo(4.75);
    expect(result.current.remaining.calories).toBe(1905);
  });

  it('should handle missing user profile', () => {
    (mockTrpcQueries.profile.get.useQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useDailyNutrition(), { wrapper });

    expect(result.current.goals.calories).toBe(2000);
    expect(result.current.goals.protein).toBe(150);
  });
});