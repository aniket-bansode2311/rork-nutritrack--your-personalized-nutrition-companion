import React from 'react';
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

const MacroRing: React.FC<MacroRingProps> = ({
  protein,
  carbs,
  fat,
  proteinGoal,
  carbsGoal,
  fatGoal,
  size = 120,
}) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const proteinPercentage = Math.min(100, (protein / proteinGoal) * 100);
  const carbsPercentage = Math.min(100, (carbs / carbsGoal) * 100);
  const fatPercentage = Math.min(100, (fat / fatGoal) * 100);
  
  const proteinOffset = circumference - (circumference * proteinPercentage) / 100;
  const carbsOffset = circumference - (circumference * carbsPercentage) / 100;
  const fatOffset = circumference - (circumference * fatPercentage) / 100;
  
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

export const NutritionSummary: React.FC = () => {
  const { total, goals } = useDailyNutrition();
  
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
          <View style={styles.macroStat}>
            <View style={[styles.macroIndicator, { backgroundColor: colors.success }]} />
            <View style={styles.macroInfo}>
              <Text style={styles.macroLabel}>Protein</Text>
              <Text style={styles.macroValue}>{total.protein.toFixed(0)}g / {goals.protein}g</Text>
              <Text style={styles.macroPercentage}>{((total.protein / goals.protein) * 100).toFixed(0)}%</Text>
            </View>
          </View>
          
          <View style={styles.macroStat}>
            <View style={[styles.macroIndicator, { backgroundColor: colors.warning }]} />
            <View style={styles.macroInfo}>
              <Text style={styles.macroLabel}>Carbs</Text>
              <Text style={styles.macroValue}>{total.carbs.toFixed(0)}g / {goals.carbs}g</Text>
              <Text style={styles.macroPercentage}>{((total.carbs / goals.carbs) * 100).toFixed(0)}%</Text>
            </View>
          </View>
          
          <View style={styles.macroStat}>
            <View style={[styles.macroIndicator, { backgroundColor: colors.secondary }]} />
            <View style={styles.macroInfo}>
              <Text style={styles.macroLabel}>Fat</Text>
              <Text style={styles.macroValue}>{total.fat.toFixed(0)}g / {goals.fat}g</Text>
              <Text style={styles.macroPercentage}>{((total.fat / goals.fat) * 100).toFixed(0)}%</Text>
            </View>
          </View>
        </View>
      </View>
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
    marginBottom: 16,
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
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  macroValue: {
    fontSize: 12,
    color: colors.darkGray,
    marginBottom: 1,
  },
  macroPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
});