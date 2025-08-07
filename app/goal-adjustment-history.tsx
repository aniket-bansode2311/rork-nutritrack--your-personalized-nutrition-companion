import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  Bot,
  RotateCcw,
  ChevronRight,
} from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';

export default function GoalAdjustmentHistoryScreen() {
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'system_recommendation' | 'user_request' | 'periodic_review'>('all');

  const adjustmentHistoryQuery = trpc.goals.adjustmentHistory.useQuery({
    limit: 50,
    offset: 0,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await adjustmentHistoryQuery.refetch();
    setRefreshing(false);
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'system_recommendation':
        return <Bot size={16} color={colors.primary} />;
      case 'user_request':
        return <User size={16} color={colors.success} />;
      case 'periodic_review':
        return <RotateCcw size={16} color={colors.warning} />;
      default:
        return <Calendar size={16} color={colors.mediumGray} />;
    }
  };



  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'system_recommendation':
        return 'AI Recommendation';
      case 'user_request':
        return 'Manual Adjustment';
      case 'periodic_review':
        return 'Periodic Review';
      default:
        return 'Other';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateGoalChange = (previous: any, current: any) => {
    const calorieChange = current.calories - previous.calories;
    const proteinChange = current.protein - previous.protein;
    
    return {
      calories: calorieChange,
      protein: proteinChange,
      hasSignificantChange: Math.abs(calorieChange) > 50 || Math.abs(proteinChange) > 10,
    };
  };

  const filteredHistory = adjustmentHistoryQuery.data?.history?.filter(
    (adjustment) => selectedFilter === 'all' || adjustment.source === selectedFilter
  ) || [];

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Goal Adjustment History',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterTabs}>
              {[
                { key: 'all', label: 'All' },
                { key: 'system_recommendation', label: 'AI' },
                { key: 'user_request', label: 'Manual' },
                { key: 'periodic_review', label: 'Reviews' },
              ].map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterTab,
                    selectedFilter === filter.key && styles.filterTabSelected,
                  ]}
                  onPress={() => setSelectedFilter(filter.key as any)}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      selectedFilter === filter.key && styles.filterTabTextSelected,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Summary Stats */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{filteredHistory.length}</Text>
            <Text style={styles.summaryLabel}>Total Adjustments</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>
              {filteredHistory.filter(h => h.effectiveness?.adherenceImprovement && h.effectiveness.adherenceImprovement > 0).length}
            </Text>
            <Text style={styles.summaryLabel}>Successful</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>
              {filteredHistory.filter(h => h.source === 'system_recommendation').length}
            </Text>
            <Text style={styles.summaryLabel}>AI Suggested</Text>
          </View>
        </View>

        {/* History List */}
        <View style={styles.historyContainer}>
          {filteredHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={48} color={colors.lightGray} />
              <Text style={styles.emptyStateTitle}>No Adjustments Yet</Text>
              <Text style={styles.emptyStateText}>
                Your goal adjustments will appear here as you make changes to your nutrition targets.
              </Text>
            </View>
          ) : (
            filteredHistory.map((adjustment) => {
              const goalChange = calculateGoalChange(adjustment.previousGoals, adjustment.newGoals);
              
              return (
                <View key={adjustment.id} style={styles.historyItem}>
                  <View style={styles.historyHeader}>
                    <View style={styles.historyTitleRow}>
                      {getSourceIcon(adjustment.source)}
                      <Text style={styles.historyTitle}>
                        {getSourceLabel(adjustment.source)}
                      </Text>
                      <Text style={styles.historyDate}>
                        {formatDate(adjustment.adjustmentDate)}
                      </Text>
                    </View>
                    <ChevronRight size={16} color={colors.lightGray} />
                  </View>

                  <Text style={styles.historyReason} numberOfLines={2}>
                    {adjustment.reason}
                  </Text>

                  {goalChange.hasSignificantChange && (
                    <View style={styles.goalChanges}>
                      <Text style={styles.goalChangesTitle}>Changes Made:</Text>
                      <View style={styles.goalChangeRow}>
                        <Text style={styles.goalChangeLabel}>Calories:</Text>
                        <View style={styles.goalChangeValue}>
                          {goalChange.calories > 0 ? (
                            <TrendingUp size={14} color={colors.success} />
                          ) : goalChange.calories < 0 ? (
                            <TrendingDown size={14} color={colors.danger} />
                          ) : null}
                          <Text
                            style={[
                              styles.goalChangeText,
                              {
                                color: goalChange.calories > 0 
                                  ? colors.success 
                                  : goalChange.calories < 0 
                                    ? colors.danger 
                                    : colors.mediumGray
                              }
                            ]}
                          >
                            {goalChange.calories > 0 ? '+' : ''}{goalChange.calories}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.goalChangeRow}>
                        <Text style={styles.goalChangeLabel}>Protein:</Text>
                        <View style={styles.goalChangeValue}>
                          {goalChange.protein > 0 ? (
                            <TrendingUp size={14} color={colors.success} />
                          ) : goalChange.protein < 0 ? (
                            <TrendingDown size={14} color={colors.danger} />
                          ) : null}
                          <Text
                            style={[
                              styles.goalChangeText,
                              {
                                color: goalChange.protein > 0 
                                  ? colors.success 
                                  : goalChange.protein < 0 
                                    ? colors.danger 
                                    : colors.mediumGray
                              }
                            ]}
                          >
                            {goalChange.protein > 0 ? '+' : ''}{goalChange.protein}g
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {adjustment.effectiveness && (
                    <View style={styles.effectivenessContainer}>
                      <Text style={styles.effectivenessTitle}>Results:</Text>
                      <View style={styles.effectivenessMetrics}>
                        <View style={styles.effectivenessMetric}>
                          <Text style={styles.effectivenessLabel}>Adherence</Text>
                          <Text
                            style={[
                              styles.effectivenessValue,
                              {
                                color: adjustment.effectiveness.adherenceImprovement > 0 
                                  ? colors.success 
                                  : colors.danger
                              }
                            ]}
                          >
                            {adjustment.effectiveness.adherenceImprovement > 0 ? '+' : ''}
                            {adjustment.effectiveness.adherenceImprovement}%
                          </Text>
                        </View>
                        <View style={styles.effectivenessMetric}>
                          <Text style={styles.effectivenessLabel}>Satisfaction</Text>
                          <Text style={styles.effectivenessValue}>
                            {adjustment.effectiveness.satisfactionScore}/10
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
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
  filterContainer: {
    paddingVertical: 16,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  filterTabSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.mediumGray,
  },
  filterTabTextSelected: {
    color: colors.white,
  },
  summaryContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.mediumGray,
    marginTop: 4,
  },
  historyContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.mediumGray,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  },
  historyItem: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  historyDate: {
    fontSize: 12,
    color: colors.mediumGray,
  },
  historyReason: {
    fontSize: 14,
    color: colors.mediumGray,
    lineHeight: 20,
    marginBottom: 16,
  },
  goalChanges: {
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  goalChangesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  goalChangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  goalChangeLabel: {
    fontSize: 12,
    color: colors.mediumGray,
  },
  goalChangeValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  goalChangeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  effectivenessContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: 12,
  },
  effectivenessTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  effectivenessMetrics: {
    flexDirection: 'row',
    gap: 20,
  },
  effectivenessMetric: {
    alignItems: 'center',
  },
  effectivenessLabel: {
    fontSize: 10,
    color: colors.mediumGray,
    marginBottom: 2,
  },
  effectivenessValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});