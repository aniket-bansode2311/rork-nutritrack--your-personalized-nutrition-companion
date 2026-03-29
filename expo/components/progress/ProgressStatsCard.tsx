import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { ProgressStats } from '@/types/nutrition';

interface ProgressStatsCardProps {
  stats: ProgressStats;
}

export default function ProgressStatsCard({ stats }: ProgressStatsCardProps) {
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const getWeightChangeColor = (change: number) => {
    if (change > 0) return colors.error;
    if (change < 0) return colors.success;
    return colors.text;
  };

  const getWeightChangeText = (change: number) => {
    if (change > 0) return `+${change} kg`;
    if (change < 0) return `${change} kg`;
    return 'No change';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Progress Summary ({stats.period})</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatNumber(stats.averageCalories)}</Text>
          <Text style={styles.statLabel}>Avg Calories</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatNumber(stats.averageProtein)}g</Text>
          <Text style={styles.statLabel}>Avg Protein</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatNumber(stats.averageWater)}ml</Text>
          <Text style={styles.statLabel}>Avg Water</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalActivities}</Text>
          <Text style={styles.statLabel}>Activities</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatNumber(stats.totalCaloriesBurned)}</Text>
          <Text style={styles.statLabel}>Calories Burned</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: getWeightChangeColor(stats.weightChange) }]}>
            {getWeightChangeText(stats.weightChange)}
          </Text>
          <Text style={styles.statLabel}>Weight Change</Text>
        </View>
      </View>
      
      <View style={styles.goalSection}>
        <Text style={styles.goalLabel}>Goal Achievement Rate</Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${Math.min(stats.goalAchievementRate, 100)}%` }
            ]} 
          />
        </View>
        <Text style={styles.goalPercentage}>{stats.goalAchievementRate}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.lightGray,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.secondary,
    textAlign: 'center',
  },
  goalSection: {
    alignItems: 'center',
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  goalPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
});