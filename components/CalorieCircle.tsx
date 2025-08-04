import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '@/constants/colors';

interface CalorieCircleProps {
  consumed: number;
  goal: number;
  size?: number;
}

export const CalorieCircle: React.FC<CalorieCircleProps> = ({
  consumed,
  goal,
  size = 180,
}) => {
  const strokeWidth = size * 0.07;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate percentage, capped at 100%
  const percentage = Math.min(100, (consumed / goal) * 100);
  const strokeDashoffset = circumference - (circumference * percentage) / 100;
  
  const remaining = Math.max(0, goal - consumed);
  
  return (
    <View style={styles.container} testID="calorie-circle">
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.lightGray}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.primary}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>
      <View style={styles.textContainer}>
        <Text style={styles.remainingLabel}>Remaining</Text>
        <Text style={styles.remainingValue}>{remaining}</Text>
        <Text style={styles.goalText}>
          {consumed.toFixed(0)} / {goal} kcal
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  remainingLabel: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 4,
  },
  remainingValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
  },
  goalText: {
    fontSize: 14,
    color: colors.darkGray,
    marginTop: 4,
  },
});