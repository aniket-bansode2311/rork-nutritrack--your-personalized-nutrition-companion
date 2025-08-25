import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '@/constants/colors';
import { useDailyNutrition } from '@/hooks/useNutritionStore';

interface MacroRingProps {
  protein: number;
  carbs: number;
  fat: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  size?: number;
}

const MacroRingComponent: React.FC<MacroRingProps> = ({
  protein,
  carbs,
  fat,
  proteinGoal,
  carbsGoal,
  fatGoal,
  size = 120,
}) => {
  // Memoize expensive calculations
  const ringData = useMemo(() => {
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    
    const proteinPercentage = Math.min(100, (protein / proteinGoal) * 100);
    const carbsPercentage = Math.min(100, (carbs / carbsGoal) * 100);
    const fatPercentage = Math.min(100, (fat / fatGoal) * 100);
    
    const proteinOffset = circumference - (circumference * proteinPercentage) / 100;
    const carbsOffset = circumference - (circumference * carbsPercentage) / 100;
    const fatOffset = circumference - (circumference * fatPercentage) / 100;
    
    return {
      strokeWidth,
      radius,
      circumference,
      proteinOffset,
      carbsOffset,
      fatOffset,
    };
  }, [protein, carbs, fat, proteinGoal, carbsGoal, fatGoal, size]);
  
  const { strokeWidth, radius, circumference, proteinOffset, carbsOffset, fatOffset } = ringData;
  
  return (
    <View style={styles.ringContainer}>
      <Svg width={size} height={size}>
        {/* Background circles */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius - 16}
          stroke={colors.lightGray}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius - 8}
          stroke={colors.lightGray}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.lightGray}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress circles */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.success}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={proteinOffset}
          strokeLinecap="round"
          fill="transparent"
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius - 8}
          stroke={colors.warning}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={carbsOffset}
          strokeLinecap="round"
          fill="transparent"
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius - 16}
          stroke={colors.secondary}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={fatOffset}
          strokeLinecap="round"
          fill="transparent"
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>
    </View>
  );
};

MacroRingComponent.displayName = 'MacroRing';
const MacroRing = React.memo(MacroRingComponent);

const NutritionSummaryComponent: React.FC = () => {
  const { total, goals } = useDailyNutrition();
  
  // Memoize macro stats to prevent unnecessary re-renders
  const macroStats = useMemo(() => [
    {
      label: 'Protein',
      value: total.protein,
      goal: goals.protein,
      color: colors.success,
    },
    {
      label: 'Carbs',
      value: total.carbs,
      goal: goals.carbs,
      color: colors.warning,
    },
    {
      label: 'Fat',
      value: total.fat,
      goal: goals.fat,
      color: colors.secondary,
    },
  ], [total.protein, total.carbs, total.fat, goals.protein, goals.carbs, goals.fat]);
  
  return (
    <View style={styles.container} testID="nutrition-summary">
      <Text style={styles.title}>Macronutrients</Text>
      
      <View style={styles.content}>
        <MacroRing
          protein={total.protein}
          carbs={total.carbs}
          fat={total.fat}
          proteinGoal={goals.protein}
          carbsGoal={goals.carbs}
          fatGoal={goals.fat}
        />
        
        <View style={styles.macroStats}>
          {macroStats.map((macro) => {
            const percentage = ((macro.value / macro.goal) * 100).toFixed(0);
            return (
              <View key={macro.label} style={styles.macroStat}>
                <View style={[styles.macroIndicator, { backgroundColor: macro.color }]} />
                <View style={styles.macroInfo}>
                  <Text style={styles.macroLabel}>{macro.label}</Text>
                  <Text style={styles.macroValue}>{macro.value.toFixed(0)}g / {macro.goal}g</Text>
                  <Text style={styles.macroPercentage}>{percentage}%</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

NutritionSummaryComponent.displayName = 'NutritionSummary';

export const NutritionSummary = React.memo(NutritionSummaryComponent);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroStats: {
    flex: 1,
    gap: 12,
  },
  macroStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  macroIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  macroInfo: {
    flex: 1,
  },
  macroLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  macroValue: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
    fontWeight: '500',
  },
  macroPercentage: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});