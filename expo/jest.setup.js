import React from "react";
import '@testing-library/jest-native/extend-expect';
import 'react-native-gesture-handler/jestSetup';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock React Native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock Expo modules
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Stack: {
    Screen: ({ children }) => children,
  },
  Tabs: {
    Screen: ({ children }) => children,
  },
}));

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(),
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images',
  },
}));

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      resend: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      eq: jest.fn(),
      order: jest.fn(),
    })),
  },
  validateSession: jest.fn(),
  secureSignOut: jest.fn(),
}));

// Mock tRPC
jest.mock('@/lib/trpc', () => ({
  trpc: {
    profile: {
      get: {
        useQuery: jest.fn(() => ({
          data: null,
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
  },
  trpcClient: {
    profile: {
      get: {
        query: jest.fn(),
      },
    },
  },
}));

// Mock React Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
  useMutation: jest.fn(() => ({
    mutateAsync: jest.fn(),
    mutate: jest.fn(),
    isLoading: false,
    error: null,
  })),
  useQueryClient: jest.fn(() => ({
    setQueryData: jest.fn(),
    invalidateQueries: jest.fn(),
    getQueryData: jest.fn(),
  })),
  QueryClient: jest.fn(),
  QueryClientProvider: ({ children }) => children,
}));

// Mock Lucide React Native icons
jest.mock('lucide-react-native', () => ({
  MoreVertical: 'MoreVertical',
  Plus: 'Plus',
  Search: 'Search',
  User: 'User',
  Settings: 'Settings',
  Calendar: 'Calendar',
  ChevronLeft: 'ChevronLeft',
  ChevronRight: 'ChevronRight',
  Camera: 'Camera',
  Image: 'Image',
  X: 'X',
  Check: 'Check',
  Heart: 'Heart',
  Star: 'Star',
  Clock: 'Clock',
  Users: 'Users',
  Book: 'Book',
  Utensils: 'Utensils',
}));

// Mock React Native components that might cause issues
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
    Platform: {
      OS: 'ios',
      select: jest.fn((obj) => obj.ios || obj.default),
    },
  };
});

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log in tests unless needed
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock timers
jest.useFakeTimers();