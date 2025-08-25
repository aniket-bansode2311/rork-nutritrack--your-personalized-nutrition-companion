import { Tabs } from "expo-router";
import React from "react";
import { Home, PieChart, User, ChefHat, TrendingUp } from "lucide-react-native";
import { Platform } from "react-native";

import { colors } from "@/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        headerShown: true,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.gray200,
        },
        headerTitleStyle: {
          color: colors.text,
          fontWeight: "700",
          fontSize: 18,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, focused }) => (
            <Home 
              color={color} 
              size={focused ? 26 : 24} 
              fill={focused ? color : 'transparent'}
            />
          ),
          tabBarLabel: "Home",
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: "Food Diary",
          tabBarIcon: ({ color, focused }) => (
            <PieChart 
              color={color} 
              size={focused ? 26 : 24}
              fill={focused ? color : 'transparent'}
            />
          ),
          tabBarLabel: "Diary",
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: "Recipes",
          tabBarIcon: ({ color, focused }) => (
            <ChefHat 
              color={color} 
              size={focused ? 26 : 24}
              fill={focused ? color : 'transparent'}
            />
          ),
          tabBarLabel: "Recipes",
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: ({ color, focused }) => (
            <TrendingUp 
              color={color} 
              size={focused ? 26 : 24}
              fill={focused ? color : 'transparent'}
            />
          ),
          tabBarLabel: "Progress",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <User 
              color={color} 
              size={focused ? 26 : 24}
              fill={focused ? color : 'transparent'}
            />
          ),
          tabBarLabel: "Settings",
        }}
      />
    </Tabs>
  );
}