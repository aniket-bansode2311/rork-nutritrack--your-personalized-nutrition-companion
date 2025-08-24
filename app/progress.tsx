import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Stack } from 'expo-router';
import { TrendingUp, Droplets, Activity, Calendar } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';
import LineChart from '@/components/charts/LineChart';
import BarChart from '@/components/charts/BarChart';

type TimePeriod = 'week' | 'month' | 'quarter';

export default function ProgressScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('week');
  
  const endDate = new Date().toISOString();
  const startDate = new Date(
    Date.now() - (selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 90) * 24 * 60 * 60 * 1000
  ).toISOString();

  const waterHistoryQuery = trpc.progress.water.history.useQuery({
    period: selectedPeriod === 'quarter' ? 'month' : selectedPeriod,
    startDate,
    endDate,
  });

  const activityHistoryQuery = trpc.progress.activity.history.useQuery({
    period: selectedPeriod,
    startDate,
    endDate,
  });

  const weightHistoryQuery = trpc.progress.weight.history.useQuery({
    period: selectedPeriod,
    startDate,
    endDate,
  });

  const progressStatsQuery = trpc.progress.stats.useQuery({
    period: selectedPeriod,
  });

  const waterData = waterHistoryQuery.data || [];
  const activityData = activityHistoryQuery.data || [];
  const weightData = weightHistoryQuery.data || [];
  const stats = progressStatsQuery.data;

  // Process water data for chart
  const waterChartData = waterData.reduce((acc: { [key: string]: number }, entry) => {
    const date = new Date(entry.timestamp).toDateString();
    acc[date] = (acc[date] || 0) + entry.amount;
    return acc;
  }, {});

  // Process activity data for chart
  const activityChartData = activityData.reduce((acc: { [key: string]: number }, entry) => {
    const date = new Date(entry.timestamp).toDateString();
    acc[date] = (acc[date] || 0) + entry.duration;
    return acc;
  }, {});

  // Process weight data for chart
  const weightChartData = weightData.map(entry => ({
    date: new Date(entry.date).toDateString(),
    value: entry.weight,
  }));

  const periods: { label: string; value: TimePeriod }[] = [
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
    { label: 'Quarter', value: 'quarter' },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Progress Tracking',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.value}
              style={[
                styles.periodButton,
                selectedPeriod === period.value && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period.value)}
              testID={`period-${period.value}`}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period.value && styles.periodButtonTextActive,
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Overview */}
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Droplets size={24} color={colors.primary} />
              <Text style={styles.statValue}>{Math.round(stats.averageWater)}ml</Text>
              <Text style={styles.statLabel}>Avg Water/Day</Text>
            </View>
            
            <View style={styles.statCard}>
              <Activity size={24} color={colors.secondary} />
              <Text style={styles.statValue}>{stats.totalActivities}</Text>
              <Text style={styles.statLabel}>Activities</Text>
            </View>
            
            <View style={styles.statCard}>
              <TrendingUp size={24} color={colors.success} />
              <Text style={styles.statValue}>{stats.totalCaloriesBurned}</Text>
              <Text style={styles.statLabel}>Calories Burned</Text>
            </View>
          </View>
        )}

        {/* Water Intake Chart */}
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <Droplets size={20} color={colors.primary} />
            <Text style={styles.chartTitle}>Water Intake Trend</Text>
          </View>
          {Object.keys(waterChartData).length > 0 ? (
            <BarChart
              data={{
                labels: Object.keys(waterChartData).map(date => 
                  new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
                ),
                datasets: [{
                  data: Object.values(waterChartData),
                }],
              }}
              height={200}
              yAxisSuffix="ml"
            />
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No water data for this period</Text>
            </View>
          )}
        </View>

        {/* Activity Chart */}
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <Activity size={20} color={colors.secondary} />
            <Text style={styles.chartTitle}>Activity Duration</Text>
          </View>
          {Object.keys(activityChartData).length > 0 ? (
            <BarChart
              data={{
                labels: Object.keys(activityChartData).map(date => 
                  new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
                ),
                datasets: [{
                  data: Object.values(activityChartData),
                }],
              }}
              height={200}
              yAxisSuffix="min"
            />
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No activity data for this period</Text>
            </View>
          )}
        </View>

        {/* Weight Trend Chart */}
        {weightChartData.length > 0 && (
          <View style={styles.chartContainer}>
            <View style={styles.chartHeader}>
              <TrendingUp size={20} color={colors.success} />
              <Text style={styles.chartTitle}>Weight Trend</Text>
            </View>
            <LineChart
              data={{
                labels: weightChartData.map(entry => 
                  new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                ),
                datasets: [{
                  data: weightChartData.map(entry => entry.value),
                }],
              }}
              height={200}
              yAxisSuffix="kg"
            />
          </View>
        )}

        {/* Activity Types Breakdown */}
        {activityData.length > 0 && (
          <View style={styles.chartContainer}>
            <View style={styles.chartHeader}>
              <Calendar size={20} color={colors.info} />
              <Text style={styles.chartTitle}>Activity Types</Text>
            </View>
            <View style={styles.activityBreakdown}>
              {activityData.reduce((acc: { [key: string]: { duration: number; calories: number } }, entry) => {
                if (!acc[entry.type]) {
                  acc[entry.type] = { duration: 0, calories: 0 };
                }
                acc[entry.type].duration += entry.duration;
                acc[entry.type].calories += entry.caloriesBurned || 0;
                return acc;
              }, {}) && Object.entries(
                activityData.reduce((acc: { [key: string]: { duration: number; calories: number } }, entry) => {
                  if (!acc[entry.type]) {
                    acc[entry.type] = { duration: 0, calories: 0 };
                  }
                  acc[entry.type].duration += entry.duration;
                  acc[entry.type].calories += entry.caloriesBurned || 0;
                  return acc;
                }, {})
              ).map(([type, data]) => (
                <View key={type} style={styles.activityBreakdownItem}>
                  <Text style={styles.activityType}>{type}</Text>
                  <View style={styles.activityStats}>
                    <Text style={styles.activityStat}>{data.duration}min</Text>
                    <Text style={styles.activityStat}>{data.calories}cal</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingBottom: 32,
  },
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  periodButtonTextActive: {
    color: colors.text,
    fontWeight: '600' as const,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginLeft: 8,
  },
  noDataContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  activityBreakdown: {
    marginTop: 8,
  },
  activityBreakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  activityType: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.text,
  },
  activityStats: {
    flexDirection: 'row',
  },
  activityStat: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 12,
  },
});