import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { NutritionProvider } from "@/hooks/useNutritionStore";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { trpc, trpcClient } from "@/lib/trpc";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

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
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <NutritionProvider>
            <RootLayoutNav />
          </NutritionProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}