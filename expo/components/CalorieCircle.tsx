import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '@/constants/colors';

interface CalorieCircleProps {
  consumed: number;
  goal: number;
  size?: number;
}

const CalorieCircleComponent: React.FC<CalorieCircleProps> = ({
  consumed,
  goal,
  size = 180,
}) => {
  // Memoize expensive calculations
  const circleData = useMemo(() => {
    const strokeWidth = size * 0.07;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const percentage = Math.min(100, (consumed / goal) * 100);
    const strokeDashoffset = circumference - (circumference * percentage) / 100;
    const remaining = Math.max(0, goal - consumed);
    
    return {
      strokeWidth,
      radius,
      circumference,
      percentage,
      strokeDashoffset,
      remaining,
    };
  }, [consumed, goal, size]);
  
  const { strokeWidth, radius, circumference, strokeDashoffset, remaining } = circleData;
  
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

CalorieCircleComponent.displayName = 'CalorieCircle';

export const CalorieCircle = React.memo(CalorieCircleComponent);

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
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 6,
    fontWeight: '600',
  },
  remainingValue: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1,
  },
  goalText: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 6,
    fontWeight: '600',
  },
});