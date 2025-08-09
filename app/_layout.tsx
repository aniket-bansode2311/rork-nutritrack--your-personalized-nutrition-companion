import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

import { NutritionProvider } from "@/hooks/useNutritionStore";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { trpc, trpcClient } from "@/lib/trpc";
import { colors } from "@/constants/colors";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Create query client with better error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on network errors or auth errors
        if (error?.message?.includes('NETWORK_ERROR') || error?.message?.includes('AUTH_ERROR')) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry mutations on auth errors
        if (error?.message?.includes('AUTH_ERROR')) {
          return false;
        }
        return failureCount < 1;
      },
    },
  },
});

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>Something went wrong</Text>
          <Text style={errorStyles.message}>
            We&apos;re having trouble connecting to our servers. Please check your internet connection and try again.
          </Text>
          <TouchableOpacity
            style={errorStyles.button}
            onPress={() => {
              this.setState({ hasError: false, error: undefined });
              // Clear query cache to force refetch
              queryClient.clear();
            }}
          >
            <Text style={errorStyles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

function RootLayoutNav() {
  const { user, loading: authLoading, initialized } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

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
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <NutritionProvider>
              <RootLayoutNav />
            </NutritionProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  );
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});