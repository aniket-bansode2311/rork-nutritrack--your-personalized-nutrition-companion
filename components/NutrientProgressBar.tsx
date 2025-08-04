import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';

interface NutrientProgressBarProps {
  label: string;
  current: number;
  goal: number;
  unit: string;
  color: string;
}

export const NutrientProgressBar: React.FC<NutrientProgressBarProps> = ({
  label,
  current,
  goal,
  unit,
  color,
}) => {
  const percentage = Math.min(100, (current / goal) * 100);
  
  return (
    <View style={styles.container} testID={`nutrient-progress-${label.toLowerCase()}`}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.values}>
          {current.toFixed(1)}/{goal} {unit}
        </Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBar, 
            { width: `${percentage}%`, backgroundColor: color }
          ]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  values: {
    fontSize: 14,
    color: colors.darkGray,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
});