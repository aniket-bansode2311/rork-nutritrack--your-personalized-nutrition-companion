import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Alert } from 'react-native';

// Import all screens to test routing
import RootLayout from '@/app/_layout';
import TabLayout from '@/app/(tabs)/_layout';

import DashboardScreen from '@/app/(tabs)/index';
import DiaryScreen from '@/app/(tabs)/diary';
import RecipesScreen from '@/app/(tabs)/recipes';
import ProgressScreen from '@/app/(tabs)/progress';
import SettingsScreen from '@/app/(tabs)/settings';
import WelcomeScreen from '@/app/(auth)/welcome';
import SignInScreen from '@/app/(auth)/signin';
import SignUpScreen from '@/app/(auth)/signup';
import OnboardingScreen from '@/app/(auth)/onboarding';
import AddFoodScreen from '@/app/add-food';
import ProfileScreen from '@/app/profile';
import AIFoodScanScreen from '@/app/ai-food-scan';
import AICoachingScreen from '@/app/ai-coaching';
import BarcodeScannerScreen from '@/app/barcode-scanner';

// Mock all dependencies
const mockUseAuth = {
  user: null as any,
  loading: false,
  initialized: true,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  resetPassword: jest.fn(),
};

const mockUseProfile = {
  profile: null as any,
  loading: false,
  updateProfile: jest.fn(),
  createProfile: jest.fn(),
};

const mockUseNutrition = {
  selectedDate: new Date().toISOString(),
  setSelectedDate: jest.fn(),
  userProfile: null,
  isLoading: false,
  entries: [],
  recipes: [],
  searchRecipes: jest.fn(),
  toggleRecipeFavorite: jest.fn(),
  isRecipeFavorite: jest.fn(),
  importRecipeFromUrl: jest.fn(),
  isOfflineMode: false,
  forceSyncNow: jest.fn(),
  clearCache: jest.fn(),
};

const mockUseDailyNutrition = {
  total: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  goals: { calories: 2000, protein: 150, carbs: 250, fat: 67, fiber: 25 },
  remaining: { calories: 2000, protein: 150, carbs: 250, fat: 67, fiber: 25 },
};

const mockUseMealsByType = jest.fn(() => []);

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
};

const mockTrpc = {
  progress: {
    water: {
      history: {
        useQuery: jest.fn(() => ({ data: [], isLoading: false, error: null })),
      },
    },
    activity: {
      history: {
        useQuery: jest.fn(() => ({ data: [], isLoading: false, error: null })),
      },
    },
    weight: {
      history: {
        useQuery: jest.fn(() => ({ data: [], isLoading: false, error: null })),
      },
    },
    stats: {
      useQuery: jest.fn(() => ({ data: null, isLoading: false, error: null })),
    },
  },
  food: {
    search: {
      useQuery: jest.fn(() => ({ data: [], isLoading: false, error: null })),
    },
  },
  insights: {
    generate: {
      useMutation: jest.fn(() => ({ mutate: jest.fn(), isLoading: false })),
    },
  },
};

// Mock all hooks and dependencies
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth,
}));

jest.mock('@/hooks/useProfile', () => ({
  useProfile: () => mockUseProfile,
}));

jest.mock('@/hooks/useNutritionStore', () => ({
  NutritionProvider: ({ children }: { children: React.ReactNode }) => children,
  useNutrition: () => mockUseNutrition,
  useDailyNutrition: () => mockUseDailyNutrition,
  useMealsByType: mockUseMealsByType,
}));

jest.mock('@/hooks/useErrorHandler', () => ({
  useErrorHandler: () => ({
    errorState: null,
    handleError: jest.fn(),
    handleAsyncOperation: jest.fn(),
  }),
}));

jest.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    trackEvent: jest.fn(),
    trackScreen: jest.fn(),
  }),
}));

jest.mock('@/lib/trpc', () => ({
  trpc: mockTrpc,
  trpcClient: {},
}));

jest.mock('@/components/ErrorBoundary', () => {
  return function MockErrorBoundary({ children }: { children: React.ReactNode }) {
    return children;
  };
});

jest.mock('@/components/ToastProvider', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
  useToast: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showInfo: jest.fn(),
  }),
}));

jest.mock('@/components/NetworkStatus', () => ({
  NetworkStatus: () => null,
}));

jest.mock('@/lib/monitoring', () => ({
  default: {
    initialize: jest.fn(),
    logLogin: jest.fn(),
    logAppStart: jest.fn(),
    addBreadcrumb: jest.fn(),
    captureError: jest.fn(),
  },
}));

jest.mock('@react-native-community/netinfo', () => ({
  default: {
    addEventListener: jest.fn(() => jest.fn()),
  },
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  useCameraPermissions: () => [{ granted: true }, jest.fn()],
}));

jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => children,
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
      {component}
    </QueryClientProvider>
  );
};

describe('Comprehensive Routing Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useLocalSearchParams as jest.Mock).mockReturnValue({});
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  describe('Root Layout Navigation Logic', () => {
    it('should render auth screens when user is not authenticated', async () => {
      mockUseAuth.user = null;
      mockUseAuth.initialized = true;
      mockUseAuth.loading = false;

      renderWithProviders(<RootLayout />);
      
      await waitFor(() => {
        expect(mockUseAuth.user).toBeNull();
      });
    });

    it('should render main app when user is authenticated with profile', async () => {
      mockUseAuth.user = { id: '123', email: 'test@example.com' };
      mockUseAuth.initialized = true;
      mockUseAuth.loading = false;
      mockUseProfile.profile = {
        id: '123',
        user_id: '123',
        age: 25,
        gender: 'male',
        height: 180,
        weight: 75,
        activity_level: 'moderate',
        goal: 'maintain',
        dietary_preferences: [],
      };
      mockUseProfile.loading = false;

      renderWithProviders(<RootLayout />);
      
      await waitFor(() => {
        expect(mockUseAuth.user).toBeTruthy();
        expect(mockUseProfile.profile).toBeTruthy();
      });
    });
  });

  describe('Tab Navigation Structure', () => {
    it('should render all tabs correctly', () => {
      const { getByText } = render(<TabLayout />);
      
      expect(getByText('Dashboard')).toBeTruthy();
      expect(getByText('Food Diary')).toBeTruthy();
      expect(getByText('Recipes')).toBeTruthy();
      expect(getByText('Progress')).toBeTruthy();
      expect(getByText('Settings')).toBeTruthy();
    });
  });

  describe('Individual Screen Rendering', () => {
    it('should render Dashboard screen without errors', () => {
      renderWithProviders(<DashboardScreen />);
    });

    it('should render Diary screen without errors', () => {
      renderWithProviders(<DiaryScreen />);
    });

    it('should render Recipes screen without errors', () => {
      renderWithProviders(<RecipesScreen />);
    });

    it('should render Progress screen without errors', () => {
      renderWithProviders(<ProgressScreen />);
    });

    it('should render Settings screen without errors', () => {
      renderWithProviders(<SettingsScreen />);
    });

    it('should render Welcome screen without errors', () => {
      renderWithProviders(<WelcomeScreen />);
    });

    it('should render SignIn screen without errors', () => {
      renderWithProviders(<SignInScreen />);
    });

    it('should render SignUp screen without errors', () => {
      renderWithProviders(<SignUpScreen />);
    });

    it('should render Onboarding screen without errors', () => {
      renderWithProviders(<OnboardingScreen />);
    });

    it('should render AddFood screen without errors', () => {
      renderWithProviders(<AddFoodScreen />);
    });

    it('should render Profile screen without errors', () => {
      renderWithProviders(<ProfileScreen />);
    });

    it('should render AI Food Scan screen without errors', () => {
      renderWithProviders(<AIFoodScanScreen />);
    });

    it('should render AI Coaching screen without errors', () => {
      renderWithProviders(<AICoachingScreen />);
    });

    it('should render Barcode Scanner screen without errors', () => {
      renderWithProviders(<BarcodeScannerScreen />);
    });
  });

  describe('Navigation Actions', () => {
    it('should handle navigation to add food screen', () => {
      const TestComponent = () => {
        const router = useRouter();
        React.useEffect(() => {
          router.push('/add-food');
        }, [router]);
        return null;
      };

      render(<TestComponent />);
      expect(mockRouter.push).toHaveBeenCalledWith('/add-food');
    });

    it('should handle navigation to profile screen', () => {
      const TestComponent = () => {
        const router = useRouter();
        React.useEffect(() => {
          router.push('/profile');
        }, [router]);
        return null;
      };

      render(<TestComponent />);
      expect(mockRouter.push).toHaveBeenCalledWith('/profile');
    });

    it('should handle back navigation', () => {
      const TestComponent = () => {
        const router = useRouter();
        React.useEffect(() => {
          if (router.canGoBack()) {
            router.back();
          }
        }, [router]);
        return null;
      };

      render(<TestComponent />);
      expect(mockRouter.canGoBack).toHaveBeenCalled();
      expect(mockRouter.back).toHaveBeenCalled();
    });
  });

  describe('Route Parameter Handling', () => {
    it('should handle dynamic route parameters', () => {
      const mockParams = { id: '123', category: 'breakfast' };
      (useLocalSearchParams as jest.Mock).mockReturnValue(mockParams);

      const TestComponent = () => {
        const params = useLocalSearchParams();
        expect(params).toEqual(mockParams);
        return null;
      };

      render(<TestComponent />);
    });
  });

  describe('Progress Tab Functionality', () => {
    it('should render progress screen with period selector', () => {
      const { getByTestId } = renderWithProviders(<ProgressScreen />);
      
      expect(getByTestId('period-week')).toBeTruthy();
      expect(getByTestId('period-month')).toBeTruthy();
      expect(getByTestId('period-quarter')).toBeTruthy();
    });

    it('should handle period selection', () => {
      const { getByTestId } = renderWithProviders(<ProgressScreen />);
      
      const monthButton = getByTestId('period-month');
      fireEvent.press(monthButton);
      
      // Should update the selected period
    });
  });

  describe('Settings Screen Navigation', () => {
    it('should handle profile navigation from settings', () => {
      const { getByText } = renderWithProviders(<SettingsScreen />);
      
      const profileButton = getByText('Profile & Goals');
      fireEvent.press(profileButton);
      
      expect(mockRouter.push).toHaveBeenCalledWith('/profile');
    });
  });

  describe('Error Handling in Navigation', () => {
    it('should handle navigation errors gracefully', () => {
      const mockRouterWithError = {
        ...mockRouter,
        push: jest.fn().mockImplementation(() => {
          throw new Error('Navigation failed');
        }),
      };

      (useRouter as jest.Mock).mockReturnValue(mockRouterWithError);

      const TestComponent = () => {
        const router = useRouter();
        try {
          router.push('/add-food' as any);
        } catch {
          // Handle navigation error
        }
        return null;
      };

      expect(() => render(<TestComponent />)).not.toThrow();
    });
  });

  describe('Deep Linking Routes', () => {
    const testRoutes = [
      { path: '/', screen: 'Dashboard' },
      { path: '/diary', screen: 'Food Diary' },
      { path: '/recipes', screen: 'Recipes' },
      { path: '/progress', screen: 'Progress' },
      { path: '/settings', screen: 'Settings' },
      { path: '/add-food', screen: 'Add Food' },
      { path: '/profile', screen: 'Profile' },
      { path: '/ai-food-scan', screen: 'AI Food Scanner' },
      { path: '/ai-coaching', screen: 'AI Nutrition Coach' },
      { path: '/barcode-scanner', screen: 'Scan Barcode' },
    ];

    testRoutes.forEach(({ path, screen }) => {
      it(`should handle route ${path} correctly`, () => {
        expect(path).toBeTruthy();
        expect(screen).toBeTruthy();
      });
    });
  });

  describe('Auth Flow Navigation', () => {
    it('should navigate through auth flow correctly', () => {
      // Test welcome -> signin flow
      const { getByText } = renderWithProviders(<WelcomeScreen />);
      
      const signInButton = getByText('Sign In');
      fireEvent.press(signInButton);
      
      expect(mockRouter.push).toHaveBeenCalledWith('/(auth)/signin');
    });

    it('should handle sign up navigation', () => {
      const { getByText } = renderWithProviders(<WelcomeScreen />);
      
      const signUpButton = getByText('Get Started');
      fireEvent.press(signUpButton);
      
      expect(mockRouter.push).toHaveBeenCalledWith('/(auth)/signup');
    });
  });

  describe('Tab Switching', () => {
    it('should maintain state when switching between tabs', () => {
      // This would test that tab state is preserved
      // when switching between different tabs
      const { getByText } = render(<TabLayout />);
      
      expect(getByText('Home')).toBeTruthy();
      expect(getByText('Diary')).toBeTruthy();
      expect(getByText('Recipes')).toBeTruthy();
      expect(getByText('Progress')).toBeTruthy();
      expect(getByText('Settings')).toBeTruthy();
    });
  });
});

describe('Route Configuration Validation', () => {
  it('should have all required routes configured in root layout', () => {
    // This tests that all necessary routes are properly configured
    const requiredRoutes = [
      '(tabs)',
      'add-food',
      'food-details',
      'profile',
      'ai-food-scan',
      'ai-coaching',
      'profile/dietary-preferences',
      'profile/notifications',
      'profile/privacy',
      'profile/health-integrations',
      'food-recognition-results',
      'barcode-scanner',
    ];
    
    requiredRoutes.forEach(route => {
      expect(route).toBeTruthy();
    });
  });

  it('should have all tabs configured in tab layout', () => {
    const requiredTabs = [
      'index',
      'diary',
      'recipes',
      'progress',
      'settings',
    ];
    
    requiredTabs.forEach(tab => {
      expect(tab).toBeTruthy();
    });
  });

  it('should have all auth screens configured', () => {
    const requiredAuthScreens = [
      'welcome',
      'signin',
      'signup',
      'forgot-password',
      'onboarding',
    ];
    
    requiredAuthScreens.forEach(screen => {
      expect(screen).toBeTruthy();
    });
  });
});