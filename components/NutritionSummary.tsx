import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { NutrientProgressBar } from './NutrientProgressBar';
import { useDailyNutrition } from '@/hooks/useNutritionStore';

export const NutritionSummary: React.FC = () => {
  const { total, goals } = useDailyNutrition();
  
  return (
    <View style={styles.container} testID="nutrition-summary">
      <Text style={styles.title}>Macronutrients</Text>
      
      <NutrientProgressBar
        label="Protein"
        current={total.protein}
        goal={goals.protein}
        unit="g"
        color={colors.success}
      />
      
      <NutrientProgressBar
        label="Carbs"
        current={total.carbs}
        goal={goals.carbs}
        unit="g"
        color={colors.warning}
      />
      
      <NutrientProgressBar
        label="Fat"
        current={total.fat}
        goal={goals.fat}
        unit="g"
        color={colors.secondary}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
});