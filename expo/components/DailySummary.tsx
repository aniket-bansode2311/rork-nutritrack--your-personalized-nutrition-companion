import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Droplets, Activity, Target, TrendingUp } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useDailyNutrition } from '@/hooks/useNutritionStore';
import { trpc } from '@/lib/trpc';

interface DailySummaryProps {
  date: string;
}

export function DailySummary({ date }: DailySummaryProps) {
  const { total, goals } = useDailyNutrition();
  
  const waterHistoryQuery = trpc.progress.water.history.useQuery({
    period: 'day',
    startDate: date,
    endDate: date,
  });

  const activityHistoryQuery = trpc.progress.activity.history.useQuery({
    period: 'week',
    startDate: date,
    endDate: date,
  });

  const dailyStats = useMemo(() => {
    const waterData = waterHistoryQuery.data || [];
    const activityData = activityHistoryQuery.data || [];
    
    const totalWater = waterData.reduce((sum, entry) => sum + entry.amount, 0);
    const totalActivityMinutes = activityData.reduce((sum, entry) => sum + entry.duration, 0);
    const totalCaloriesBurned = activityData.reduce((sum, entry) => sum + (entry.caloriesBurned || 0), 0);
    
    const waterGoal = 2000; // ml
    const activityGoal = 30; // minutes
    
    return {
      calories: {
        current: total.calories,
        goal: goals.calories,
        percentage: Math.min(100, (total.calories / goals.calories) * 100),
      },
      water: {
        current: totalWater,
        goal: waterGoal,
        percentage: Math.min(100, (totalWater / waterGoal) * 100),
      },
      activity: {
        current: totalActivityMinutes,
        goal: activityGoal,
        percentage: Math.min(100, (totalActivityMinutes / activityGoal) * 100),
        caloriesBurned: totalCaloriesBurned,
      },
    };
  }, [total, goals, waterHistoryQuery.data, activityHistoryQuery.data]);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return colors.success;
    if (percentage >= 75) return colors.warning;
    return colors.primary;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Daily Summary</Text>
      
      <View style={styles.statsGrid}>
        {/* Calories */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Target size={20} color={colors.primary} />
            <Text style={styles.statLabel}>Calories</Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${dailyStats.calories.percentage}%`,
                    backgroundColor: getProgressColor(dailyStats.calories.percentage),
                  },
                ]}
              />
            </View>
            <Text style={styles.statValue}>
              {Math.round(dailyStats.calories.current)} / {dailyStats.calories.goal}
            </Text>
            <Text style={styles.statPercentage}>
              {Math.round(dailyStats.calories.percentage)}%
            </Text>
          </View>
        </View>

        {/* Water */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Droplets size={20} color={colors.primary} />
            <Text style={styles.statLabel}>Water</Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${dailyStats.water.percentage}%`,
                    backgroundColor: getProgressColor(dailyStats.water.percentage),
                  },
                ]}
              />
            </View>
            <Text style={styles.statValue}>
              {dailyStats.water.current}ml / {dailyStats.water.goal}ml
            </Text>
            <Text style={styles.statPercentage}>
              {Math.round(dailyStats.water.percentage)}%
            </Text>
          </View>
        </View>

        {/* Activity */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Activity size={20} color={colors.secondary} />
            <Text style={styles.statLabel}>Activity</Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${dailyStats.activity.percentage}%`,
                    backgroundColor: getProgressColor(dailyStats.activity.percentage),
                  },
                ]}
              />
            </View>
            <Text style={styles.statValue}>
              {dailyStats.activity.current}min / {dailyStats.activity.goal}min
            </Text>
            <Text style={styles.statPercentage}>
              {Math.round(dailyStats.activity.percentage)}%
            </Text>
          </View>
        </View>

        {/* Calories Burned */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <TrendingUp size={20} color={colors.success} />
            <Text style={styles.statLabel}>Burned</Text>
          </View>
          <View style={styles.progressContainer}>
            <Text style={[styles.statValue, styles.burnedValue]}>
              {dailyStats.activity.caloriesBurned}
            </Text>
            <Text style={styles.statUnit}>calories</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

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
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.text,
    marginLeft: 6,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.lightGray,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  statPercentage: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  burnedValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.success,
    marginBottom: 4,
  },
  statUnit: {
    fontSize: 10,
    color: colors.textSecondary,
  },
});