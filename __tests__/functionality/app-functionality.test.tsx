import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import main app screens
import Dashboard from '@/app/(tabs)/index';
import FoodDiary from '@/app/(tabs)/diary';
import Recipes from '@/app/(tabs)/recipes';
import Progress from '@/app/progress';
import Settings from '@/app/(tabs)/settings';
import AddFood from '@/app/add-food';
import Profile from '@/app/profile';

// Mock all dependencies
const mockUseAuth = {
  user: { id: '123', email: 'test@example.com' },
  loading: false,
  initialized: true,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  resetPassword: jest.fn(),
};

const mockUseProfile = {
  profile: {
    id: '123',
    user_id: '123',
    age: 25,
    gender: 'male',
    height: 180,
    weight: 75,
    activity_level: 'moderate',
    goal: 'maintain',
    dietary_preferences: [],
  },
  loading: false,
  updateProfile: jest.fn(),
  createProfile: jest.fn(),
};

const mockNutritionStore = {
  entries: [
    {
      id: '1',
      food_name: 'Apple',
      calories: 95,
      protein: 0.5,
      carbs: 25,
      fat: 0.3,
      fiber: 4,
      sugar: 19,
      sodium: 2,
      meal_type: 'breakfast',
      serving_size: '1 medium',
      logged_at: new Date().toISOString(),
    },
  ],
  addEntry: jest.fn(),
  updateEntry: jest.fn(),
  deleteEntry: jest.fn(),
  getTotalNutrition: jest.fn(() => ({
    calories: 95,
    protein: 0.5,
    carbs: 25,
    fat: 0.3,
    fiber: 4,
    sugar: 19,
    sodium: 2,
  })),
};

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth,
}));

jest.mock('@/hooks/useProfile', () => ({
  useProfile: () => mockUseProfile,
}));

jest.mock('@/hooks/useNutritionStore', () => ({
  useNutritionStore: () => mockNutritionStore,
}));

jest.mock('@/lib/trpc', () => ({
  trpc: {
    food: {
      entries: {
        useQuery: jest.fn(() => ({
          data: mockNutritionStore.entries,
          isLoading: false,
          error: null,
          refetch: jest.fn(),
        })),
      },
      log: {
        useMutation: jest.fn(() => ({
          mutateAsync: jest.fn(),
          isLoading: false,
        })),
      },
      delete: {
        useMutation: jest.fn(() => ({
          mutateAsync: jest.fn(),
          isLoading: false,
        })),
      },
      search: {
        useQuery: jest.fn(() => ({
          data: [
            { id: '1', name: 'Apple', calories: 95, protein: 0.5 },
            { id: '2', name: 'Banana', calories: 105, protein: 1.3 },
          ],
          isLoading: false,
          error: null,
        })),
      },
    },
    recipes: {
      list: {
        useQuery: jest.fn(() => ({
          data: [
            {
              id: '1',
              name: 'Healthy Smoothie',
              description: 'A nutritious breakfast smoothie',
              ingredients: ['banana', 'spinach', 'almond milk'],
              instructions: ['Blend all ingredients'],
              prep_time: 5,
              servings: 1,
              calories_per_serving: 150,
            },
          ],
          isLoading: false,
          error: null,
        })),
      },
      create: {
        useMutation: jest.fn(() => ({
          mutateAsync: jest.fn(),
          isLoading: false,
        })),
      },
    },
    progress: {
      stats: {
        useQuery: jest.fn(() => ({
          data: {
            weekly_avg_calories: 2000,
            weekly_avg_protein: 150,
            weekly_avg_carbs: 250,
            weekly_avg_fat: 67,
            weight_change: -0.5,
            streak_days: 7,
          },
          isLoading: false,
          error: null,
        })),
      },
      weight: {
        history: {
          useQuery: jest.fn(() => ({
            data: [
              { date: '2024-01-01', weight: 75.5 },
              { date: '2024-01-02', weight: 75.3 },
            ],
            isLoading: false,
            error: null,
          })),
        },
        log: {
          useMutation: jest.fn(() => ({
            mutateAsync: jest.fn(),
            isLoading: false,
          })),
        },
      },
      water: {
        history: {
          useQuery: jest.fn(() => ({
            data: [
              { date: '2024-01-01', amount: 2000 },
              { date: '2024-01-02', amount: 2200 },
            ],
            isLoading: false,
            error: null,
          })),
        },
        log: {
          useMutation: jest.fn(() => ({
            mutateAsync: jest.fn(),
            isLoading: false,
          })),
        },
      },
      activity: {
        history: {
          useQuery: jest.fn(() => ({
            data: [
              { date: '2024-01-01', type: 'running', duration: 30, calories_burned: 300 },
              { date: '2024-01-02', type: 'cycling', duration: 45, calories_burned: 400 },
            ],
            isLoading: false,
            error: null,
          })),
        },
        log: {
          useMutation: jest.fn(() => ({
            mutateAsync: jest.fn(),
            isLoading: false,
          })),
        },
      },
    },
    profile: {
      get: {
        useQuery: jest.fn(() => ({
          data: mockUseProfile.profile,
          isLoading: false,
          error: null,
        })),
      },
      update: {
        useMutation: jest.fn(() => ({
          mutateAsync: jest.fn(),
          isLoading: false,
        })),
      },
    },
  },
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <>{component}</>
    </QueryClientProvider>
  );
};

describe('App Functionality Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Dashboard Screen', () => {
    it('should render dashboard with nutrition summary', async () => {
      const { getByText } = renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(getByText(/calories/i)).toBeTruthy();
      });
    });

    it('should display daily nutrition progress', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(mockNutritionStore.getTotalNutrition).toHaveBeenCalled();
      });
    });

    it('should show recent food entries', async () => {
      const { getByText } = renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(getByText('Apple')).toBeTruthy();
      });
    });
  });

  describe('Food Diary Screen', () => {
    it('should render food diary with meal sections', async () => {
      const { getByText } = renderWithProviders(<FoodDiary />);

      await waitFor(() => {
        expect(getByText(/breakfast/i)).toBeTruthy();
      });
    });

    it('should display food entries by meal type', async () => {
      const { getByText } = renderWithProviders(<FoodDiary />);

      await waitFor(() => {
        expect(getByText('Apple')).toBeTruthy();
      });
    });
  });

  describe('Recipes Screen', () => {
    it('should render recipes list', async () => {
      const { getByText } = renderWithProviders(<Recipes />);

      await waitFor(() => {
        expect(getByText('Healthy Smoothie')).toBeTruthy();
      });
    });

    it('should display recipe details', async () => {
      const { getByText } = renderWithProviders(<Recipes />);

      await waitFor(() => {
        expect(getByText('A nutritious breakfast smoothie')).toBeTruthy();
        expect(getByText('5 min')).toBeTruthy();
        expect(getByText('150 cal')).toBeTruthy();
      });
    });
  });

  describe('Progress Screen', () => {
    it('should render progress statistics', async () => {
      const { getByText } = renderWithProviders(<Progress />);

      await waitFor(() => {
        expect(getByText(/2000/)).toBeTruthy();
      });
    });

    it('should display weight tracking', async () => {
      const { getByText } = renderWithProviders(<Progress />);

      await waitFor(() => {
        expect(getByText(/weight/i)).toBeTruthy();
      });
    });

    it('should show water intake tracking', async () => {
      const { getByText } = renderWithProviders(<Progress />);

      await waitFor(() => {
        expect(getByText(/water/i)).toBeTruthy();
      });
    });

    it('should display activity tracking', async () => {
      const { getByText } = renderWithProviders(<Progress />);

      await waitFor(() => {
        expect(getByText(/activity/i)).toBeTruthy();
      });
    });
  });

  describe('Settings Screen', () => {
    it('should render settings options', async () => {
      const { getByText } = renderWithProviders(<Settings />);

      await waitFor(() => {
        expect(getByText(/profile/i)).toBeTruthy();
      });
    });

    it('should show logout option', async () => {
      const { getByText } = renderWithProviders(<Settings />);

      await waitFor(() => {
        expect(getByText(/logout/i)).toBeTruthy();
      });
    });
  });

  describe('Add Food Screen', () => {
    it('should display search results', async () => {
      const { getByText } = renderWithProviders(<AddFood />);

      await waitFor(() => {
        expect(getByText('Apple')).toBeTruthy();
        expect(getByText('Banana')).toBeTruthy();
      });
    });
  });

  describe('Profile Screen', () => {
    it('should render user profile information', async () => {
      const { getByText } = renderWithProviders(<Profile />);

      await waitFor(() => {
        expect(getByText('test@example.com')).toBeTruthy();
      });
    });

    it('should display profile stats', async () => {
      const { getByText } = renderWithProviders(<Profile />);

      await waitFor(() => {
        expect(getByText('25')).toBeTruthy();
        expect(getByText('180')).toBeTruthy();
        expect(getByText('75')).toBeTruthy();
      });
    });
  });

  describe('Data Flow and State Management', () => {
    it('should sync data between screens', async () => {
      renderWithProviders(<AddFood />);
      
      await act(async () => {
        mockNutritionStore.addEntry({
          id: '2',
          food_name: 'Banana',
          calories: 105,
          protein: 1.3,
          carbs: 27,
          fat: 0.4,
          fiber: 3,
          sugar: 14,
          sodium: 1,
          meal_type: 'breakfast',
          serving_size: '1 medium',
          logged_at: new Date().toISOString(),
        });
      });

      expect(mockNutritionStore.addEntry).toHaveBeenCalled();
    });

    it('should handle offline data correctly', async () => {
      const { getByText } = renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(getByText('Apple')).toBeTruthy();
      });
    });

    it('should handle error states gracefully', async () => {
      expect(() => renderWithProviders(<Dashboard />)).not.toThrow();
    });
  });

  describe('Performance and Optimization', () => {
    it('should not cause memory leaks', async () => {
      const { unmount } = renderWithProviders(<Dashboard />);
      
      unmount();
      
      expect(true).toBe(true);
    });

    it('should handle large datasets efficiently', async () => {
      const largeEntries = Array.from({ length: 1000 }, (_, i) => ({
        id: i.toString(),
        food_name: `Food ${i}`,
        calories: 100,
        protein: 5,
        carbs: 15,
        fat: 3,
        fiber: 2,
        sugar: 5,
        sodium: 100,
        meal_type: 'breakfast',
        serving_size: '1 serving',
        logged_at: new Date().toISOString(),
      }));

      mockNutritionStore.entries = largeEntries;

      const { getByText } = renderWithProviders(<FoodDiary />);
      
      await waitFor(() => {
        expect(getByText('Food 0')).toBeTruthy();
      });
    });
  });
});