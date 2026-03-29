import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Brain, TrendingUp, Clock, Target, Award, AlertTriangle, CheckCircle, Info } from 'lucide-react-native';

import { colors } from '@/constants/colors';
// Import types for insights
import { trpc } from '@/lib/trpc';

interface InsightsDashboardProps {
  userId: string;
}

export default function InsightsDashboard({ userId }: InsightsDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  
  const { data: insights, isLoading, error, refetch } = trpc.insights.generate.useQuery({
    userId,
    period: selectedPeriod,
  });

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high': return colors.error;
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.mediumGray;
    }
  };

  const getInsightTypeIcon = (type: string) => {
    switch (type) {
      case 'deficiency': return <AlertTriangle size={16} color={colors.warning} />;
      case 'excess': return <Info size={16} color={colors.primary} />;
      case 'optimal': return <CheckCircle size={16} color={colors.success} />;
      case 'recommendation': return <TrendingUp size={16} color={colors.primary} />;
      default: return <Info size={16} color={colors.mediumGray} />;
    }
  };

  const getProgressStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return colors.success;
      case 'ahead': return colors.primary;
      case 'behind': return colors.warning;
      case 'stalled': return colors.error;
      default: return colors.mediumGray;
    }
  };

  const renderOverallScore = () => {
    if (!insights) return null;

    const scoreColor = insights.overallScore >= 80 ? colors.success : 
                      insights.overallScore >= 60 ? colors.warning : colors.error;

    return (
      <View style={styles.scoreCard}>
        <View style={styles.scoreHeader}>
          <Brain size={24} color={colors.primary} />
          <Text style={styles.scoreTitle}>Overall Nutrition Score</Text>
        </View>
        <View style={styles.scoreContent}>
          <Text style={[styles.scoreValue, { color: scoreColor }]}>
            {insights.overallScore}/100
          </Text>
          <Text style={styles.scorePeriod}>{selectedPeriod} average</Text>
        </View>
        <Text style={styles.summaryText}>{insights.summary}</Text>
      </View>
    );
  };

  const renderPatternScores = () => {
    if (!insights) return null;

    const patterns = [
      { label: 'Consistency', value: insights.patterns.consistencyScore, icon: Target },
      { label: 'Hydration', value: insights.patterns.hydrationScore, icon: TrendingUp },
      { label: 'Variety', value: insights.patterns.varietyScore, icon: Award },
      { label: 'Balance', value: insights.patterns.balanceScore, icon: CheckCircle },
    ];

    return (
      <View style={styles.patternsCard}>
        <Text style={styles.sectionTitle}>Nutrition Patterns</Text>
        <View style={styles.patternsGrid}>
          {patterns.map((pattern, index) => {
            const IconComponent = pattern.icon;
            const scoreColor = pattern.value >= 80 ? colors.success : 
                              pattern.value >= 60 ? colors.warning : colors.error;
            
            return (
              <View key={index} style={styles.patternItem}>
                <IconComponent size={20} color={scoreColor} />
                <Text style={styles.patternLabel}>{pattern.label}</Text>
                <Text style={[styles.patternValue, { color: scoreColor }]}>
                  {pattern.value}%
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderNutrientInsights = () => {
    if (!insights?.nutrientInsights.length) return null;

    return (
      <View style={styles.insightsSection}>
        <Text style={styles.sectionTitle}>Nutrient Analysis</Text>
        {insights.nutrientInsights.map((insight) => (
          <View key={insight.id} style={styles.insightCard}>
            <View style={styles.insightHeader}>
              {getInsightTypeIcon(insight.type)}
              <Text style={styles.insightTitle}>{insight.title}</Text>
              <View style={[
                styles.severityBadge,
                { backgroundColor: getSeverityColor(insight.severity) }
              ]}>
                <Text style={styles.severityText}>{insight.severity}</Text>
              </View>
            </View>
            <Text style={styles.insightDescription}>{insight.description}</Text>
            <Text style={styles.insightRecommendation}>{insight.recommendation}</Text>
            {insight.actionItems.length > 0 && (
              <View style={styles.actionItems}>
                <Text style={styles.actionItemsTitle}>Action Items:</Text>
                {insight.actionItems.map((item, index) => (
                  <Text key={index} style={styles.actionItem}>• {item}</Text>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderMealTimingInsights = () => {
    if (!insights?.mealTimingInsights.length) return null;

    return (
      <View style={styles.insightsSection}>
        <Text style={styles.sectionTitle}>Meal Timing</Text>
        {insights.mealTimingInsights.map((insight) => (
          <View key={insight.id} style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Clock size={16} color={colors.primary} />
              <Text style={styles.insightTitle}>{insight.title}</Text>
            </View>
            <Text style={styles.insightDescription}>{insight.description}</Text>
            <Text style={styles.insightRecommendation}>{insight.recommendation}</Text>
            {insight.suggestedTiming && (
              <View style={styles.timingContainer}>
                <Text style={styles.timingTitle}>Suggested Timing:</Text>
                <View style={styles.timingGrid}>
                  <Text style={styles.timingItem}>Breakfast: {insight.suggestedTiming.breakfast}</Text>
                  <Text style={styles.timingItem}>Lunch: {insight.suggestedTiming.lunch}</Text>
                  <Text style={styles.timingItem}>Dinner: {insight.suggestedTiming.dinner}</Text>
                </View>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderHealthGoalInsights = () => {
    if (!insights?.healthGoalInsights.length) return null;

    return (
      <View style={styles.insightsSection}>
        <Text style={styles.sectionTitle}>Health Goals</Text>
        {insights.healthGoalInsights.map((insight) => (
          <View key={insight.id} style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Target size={16} color={getProgressStatusColor(insight.progressStatus)} />
              <Text style={styles.insightTitle}>{insight.title}</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getProgressStatusColor(insight.progressStatus) }
              ]}>
                <Text style={styles.statusText}>
                  {insight.progressStatus.replace('_', ' ')}
                </Text>
              </View>
            </View>
            <Text style={styles.insightDescription}>{insight.description}</Text>
            <Text style={styles.insightRecommendation}>{insight.recommendation}</Text>
            {insight.actionItems.length > 0 && (
              <View style={styles.actionItems}>
                <Text style={styles.actionItemsTitle}>Action Items:</Text>
                {insight.actionItems.map((item, index) => (
                  <Text key={index} style={styles.actionItem}>• {item}</Text>
                ))}
              </View>
            )}
            {insight.estimatedTimeToGoal && (
              <Text style={styles.timeToGoal}>
                Estimated time to goal: {insight.estimatedTimeToGoal}
              </Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderAchievementsAndChallenges = () => {
    if (!insights) return null;

    return (
      <View style={styles.achievementsSection}>
        {insights.achievements.length > 0 && (
          <View style={styles.achievementsCard}>
            <View style={styles.achievementsHeader}>
              <Award size={20} color={colors.success} />
              <Text style={styles.achievementsTitle}>Recent Achievements</Text>
            </View>
            {insights.achievements.map((achievement, index) => (
              <Text key={index} style={styles.achievementItem}>🎉 {achievement}</Text>
            ))}
          </View>
        )}

        {insights.challenges.length > 0 && (
          <View style={styles.challengesCard}>
            <View style={styles.challengesHeader}>
              <AlertTriangle size={20} color={colors.warning} />
              <Text style={styles.challengesTitle}>Areas for Improvement</Text>
            </View>
            {insights.challenges.map((challenge, index) => (
              <Text key={index} style={styles.challengeItem}>⚠️ {challenge}</Text>
            ))}
          </View>
        )}

        {insights.nextWeekFocus.length > 0 && (
          <View style={styles.focusCard}>
            <View style={styles.focusHeader}>
              <TrendingUp size={20} color={colors.primary} />
              <Text style={styles.focusTitle}>Next Week Focus</Text>
            </View>
            {insights.nextWeekFocus.map((focus, index) => (
              <Text key={index} style={styles.focusItem}>🎯 {focus}</Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Analyzing your nutrition data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <AlertTriangle size={48} color={colors.error} />
        <Text style={styles.errorTitle}>Unable to Generate Insights</Text>
        <Text style={styles.errorText}>
          We could not analyze your nutrition data right now. Please try again.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Nutrition Insights</Text>
        <View style={styles.periodSelector}>
          {(['daily', 'weekly', 'monthly'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period)}
              testID={`period-${period}`}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive
              ]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {renderOverallScore()}
      {renderPatternScores()}
      {renderNutrientInsights()}
      {renderMealTimingInsights()}
      {renderHealthGoalInsights()}
      {renderAchievementsAndChallenges()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.background,
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
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.darkGray,
  },
  periodButtonTextActive: {
    color: colors.white,
  },
  scoreCard: {
    backgroundColor: colors.white,
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
  },
  scoreContent: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  scorePeriod: {
    fontSize: 14,
    color: colors.mediumGray,
    marginTop: 4,
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    textAlign: 'center',
  },
  patternsCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  patternsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  patternItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  patternLabel: {
    fontSize: 14,
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  patternValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  insightsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  insightCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
    textTransform: 'capitalize',
  },
  insightDescription: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  insightRecommendation: {
    fontSize: 14,
    color: colors.primary,
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 12,
  },
  actionItems: {
    marginTop: 8,
  },
  actionItemsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  actionItem: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 20,
    marginBottom: 2,
  },
  timingContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  timingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  timingGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timingItem: {
    fontSize: 12,
    color: colors.darkGray,
  },
  timeToGoal: {
    fontSize: 12,
    color: colors.mediumGray,
    fontStyle: 'italic',
    marginTop: 8,
  },
  achievementsSection: {
    marginHorizontal: 16,
  },
  achievementsCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  achievementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  achievementItem: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  challengesCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  challengesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  challengesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  challengeItem: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  focusCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  focusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  focusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  focusItem: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: colors.mediumGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});