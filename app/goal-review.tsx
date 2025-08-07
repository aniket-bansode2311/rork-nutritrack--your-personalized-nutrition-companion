import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { GoalReviewDashboard } from '@/components/goals/GoalReviewDashboard';
import { colors } from '@/constants/colors';

export default function GoalReviewScreen() {
  const router = useRouter();

  const handleNavigateToHistory = () => {
    router.push('/goal-adjustment-history');
  };

  const handleNavigateToSettings = () => {
    router.push('/profile');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Goal Review',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
      
      <GoalReviewDashboard
        onNavigateToHistory={handleNavigateToHistory}
        onNavigateToSettings={handleNavigateToSettings}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});