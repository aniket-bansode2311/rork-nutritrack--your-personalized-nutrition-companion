import { Tabs } from "expo-router";
import React from "react";
import { Home, PieChart, User, ChefHat } from "lucide-react-native";

import { colors } from "@/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerShown: true,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.lightGray,
        },
        headerTitleStyle: {
          color: colors.text,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
          tabBarLabel: "Dashboard",
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: "Food Diary",
          tabBarIcon: ({ color }) => <PieChart color={color} size={24} />,
          tabBarLabel: "Diary",
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: "Recipes",
          tabBarIcon: ({ color }) => <ChefHat color={color} size={24} />,
          tabBarLabel: "Recipes",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <User color={color} size={24} />,
          tabBarLabel: "Settings",
        }}
      />
    </Tabs>
  );
}