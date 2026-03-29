import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import NetInfo from '@react-native-community/netinfo';
import { NutritionProvider } from "@/hooks/useNutritionStore";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { trpc, trpcClient } from "@/lib/trpc";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/ToastProvider";
import { NetworkStatus } from "@/components/NetworkStatus";
import monitoring from "@/lib/monitoring";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Create query client with better error handling and network awareness
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on network errors or auth errors
        if (error?.message?.includes('NETWORK_ERROR') || 
            error?.message?.includes('AUTH_ERROR') ||
            error?.message?.includes('Failed to fetch') ||
            error?.message?.includes('AbortError')) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      networkMode: 'offlineFirst', // Allow cached data when offline
      refetchOnWindowFocus: false, // Disable refetch on window focus for mobile
      refetchOnReconnect: true, // Refetch when network reconnects
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry mutations on auth errors or network errors
        if (error?.message?.includes('AUTH_ERROR') ||
            error?.message?.includes('NETWORK_ERROR') ||
            error?.message?.includes('Failed to fetch')) {
          return false;
        }
        return failureCount < 1;
      },
      networkMode: 'online', // Only run mutations when online
    },
  },
});



function RootLayoutNav() {
  const { user, loading: authLoading, initialized } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  // Initialize monitoring when user changes
  useEffect(() => {
    if (initialized) {
      monitoring.initialize({
        enableAnalytics: true,
        enableErrorLogging: true,
        userId: user?.id || null,
        userProperties: profile ? {
          age: profile.age,
          gender: profile.gender,
          activity_level: profile.activity_level,
          dietary_preferences: profile.dietary_preferences,
        } : undefined,
      });

      if (user) {
        monitoring.logLogin('app_start');
      }
    }
  }, [initialized, user, profile]);

  // Don't render anything until auth is initialized
  if (!initialized || authLoading) {
    return null;
  }

  // If no user, show auth screens
  if (!user) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
      </Stack>
    );
  }

  // If user exists but no profile, show onboarding
  if (user && !profileLoading && !profile) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>
    );
  }

  // User is authenticated and has profile, show main app
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="add-food" 
        options={{ 
          title: "Add Food",
          headerTintColor: "#2A9D8F",
        }} 
      />
      <Stack.Screen 
        name="food-details" 
        options={{ 
          title: "Food Details",
          headerTintColor: "#2A9D8F",
        }} 
      />
      <Stack.Screen 
        name="profile" 
        options={{ 
          title: "Profile",
          headerTintColor: "#2A9D8F",
        }} 
      />
      <Stack.Screen 
        name="ai-food-scan" 
        options={{ 
          title: "AI Food Scanner",
          headerTintColor: "#2A9D8F",
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="ai-coaching" 
        options={{ 
          title: "AI Nutrition Coach",
          headerTintColor: "#2A9D8F",
        }} 
      />
      <Stack.Screen 
        name="profile/dietary-preferences" 
        options={{ 
          title: "Dietary Preferences",
          headerTintColor: "#2A9D8F",
        }} 
      />
      <Stack.Screen 
        name="profile/notifications" 
        options={{ 
          title: "Notifications",
          headerTintColor: "#2A9D8F",
        }} 
      />
      <Stack.Screen 
        name="profile/privacy" 
        options={{ 
          title: "Privacy & Data",
          headerTintColor: "#2A9D8F",
        }} 
      />
      <Stack.Screen 
        name="profile/health-integrations" 
        options={{ 
          title: "Health Integrations",
          headerTintColor: "#2A9D8F",
        }} 
      />
      <Stack.Screen 
        name="food-recognition-results" 
        options={{ 
          title: "Recognition Results",
          headerTintColor: "#2A9D8F",
        }} 
      />
      <Stack.Screen 
        name="barcode-scanner" 
        options={{ 
          title: "Scan Barcode",
          headerTintColor: "#2A9D8F",
          headerShown: false,
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    SplashScreen.hideAsync();
    
    // Initialize monitoring on app start
    monitoring.logAppStart();
    
    // Monitor network status
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      setIsOnline(online);
      
      if (online) {
        console.log('Network connected, refetching queries');
        monitoring.addBreadcrumb('Network reconnected', 'network');
        queryClient.refetchQueries({ type: 'active' });
      } else {
        console.log('Network disconnected');
        monitoring.addBreadcrumb('Network disconnected', 'network');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleRetry = () => {
    console.log('Retrying network requests');
    queryClient.refetchQueries({ type: 'active' });
  };

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Root Error Boundary:', error, errorInfo);
        monitoring.captureError(error, {
          type: 'error_boundary',
          componentStack: errorInfo.componentStack,
        });
      }}
    >
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <NetworkStatus isOnline={isOnline} onRetry={handleRetry} />
              <NutritionProvider>
                <RootLayoutNav />
              </NutritionProvider>
            </GestureHandlerRootView>
          </ToastProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  );
}

