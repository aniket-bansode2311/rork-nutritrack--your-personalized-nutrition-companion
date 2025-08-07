import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  TrendingUp,
  Target,
  Clock,
  BarChart3,
  Settings,
  RefreshCw,
} from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { GoalReview } from '@/types/nutrition';
import { GoalReviewCard } from './GoalReviewCard';
import { GoalFeedbackModal } from './GoalFeedbackModal';
import { trpc } from '@/lib/trpc';

interface GoalReviewDashboardProps {
  onNavigateToHistory: () => void;
  onNavigateToSettings: () => void;
}

export const GoalReviewDashboard: React.FC<GoalReviewDashboardProps> = ({
  onNavigateToHistory,
  onNavigateToSettings,
}) => {
  const [selectedReview, setSelectedReview] = useState<GoalReview | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'quarterly'>('weekly');

  // tRPC queries
  const goalReviewQuery = trpc.goals.review.generate.useQuery({
    period: selectedPeriod,
    includeUserFeedback: true,
  });

  const smartSuggestionsQuery = trpc.goals.smartSuggestions.useQuery({
    analysisDepth: 'detailed',
    includeAlternatives: true,
  });

  const adjustmentHistoryQuery = trpc.goals.adjustmentHistory.useQuery({
    limit: 5,
    offset: 0,
  });

  // Mutations
  const submitFeedbackMutation = trpc.goals.review.submitFeedback.useMutation({
    onSuccess: () => {
      Alert.alert('Success', 'Your feedback has been submitted successfully!');
      goalReviewQuery.refetch();
      adjustmentHistoryQuery.refetch();
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      goalReviewQuery.refetch(),
      smartSuggestionsQuery.refetch(),
      adjustmentHistoryQuery.refetch(),
    ]);
    setRefreshing(false);
  };

  const handleViewReviewDetails = (review: GoalReview) => {
    setSelectedReview(review);
    // Navigate to detailed review screen
  };

  const handleTakeAction = (review: GoalReview) => {
    setSelectedReview(review);
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = (feedback: any, action: 'accept' | 'reject' | 'modify', modifiedGoals?: any) => {
    if (!selectedReview) return;

    submitFeedbackMutation.mutate({
      reviewId: selectedReview.id,
      feedback,
      action,
      modifiedGoals,
    });

    setShowFeedbackModal(false);
    setSelectedReview(null);
  };

  const getNextReviewDate = () => {
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);
    return nextWeek.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const renderQuickStats = () => {
    const review = goalReviewQuery.data;
    if (!review) return null;

    return (
      <View style={styles.quickStats}>
        <View style={styles.statCard}>
          <TrendingUp size={20} color={colors.success} />
          <Text style={styles.statValue}>{review.progressAnalysis.calorieAdherence}%</Text>
          <Text style={styles.statLabel}>Adherence</Text>
        </View>
        <View style={styles.statCard}>
          <Target size={20} color={colors.primary} />
          <Text style={styles.statValue}>{review.progressAnalysis.consistencyScore}%</Text>
          <Text style={styles.statLabel}>Consistency</Text>
        </View>
        <View style={styles.statCard}>
          <BarChart3 size={20} color={colors.warning} />
          <Text style={[
            styles.statValue,
            { color: review.progressAnalysis.weightProgress > 0 ? colors.danger : colors.success }
          ]}>
            {review.progressAnalysis.weightProgress > 0 ? '+' : ''}{review.progressAnalysis.weightProgress}kg
          </Text>
          <Text style={styles.statLabel}>Weight Change</Text>
        </View>
      </View>
    );
  };

  const renderSmartSuggestions = () => {
    const suggestions = smartSuggestionsQuery.data;
    if (!suggestions || suggestions.confidence < 70) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Smart Suggestions</Text>
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>{suggestions.confidence}% confidence</Text>
          </View>
        </View>
        
        <View style={styles.suggestionCard}>
          <Text style={styles.suggestionTitle}>Recommended Adjustments</Text>
          <View style={styles.goalComparison}>
            <View style={styles.goalColumn}>
              <Text style={styles.goalLabel}>Calories</Text>
              <Text style={styles.goalValue}>{suggestions.suggestedGoals.calories}</Text>
            </View>
            <View style={styles.goalColumn}>
              <Text style={styles.goalLabel}>Protein</Text>
              <Text style={styles.goalValue}>{suggestions.suggestedGoals.protein}g</Text>
            </View>
            <View style={styles.goalColumn}>
              <Text style={styles.goalLabel}>Carbs</Text>
              <Text style={styles.goalValue}>{suggestions.suggestedGoals.carbs}g</Text>
            </View>
            <View style={styles.goalColumn}>
              <Text style={styles.goalLabel}>Fat</Text>
              <Text style={styles.goalValue}>{suggestions.suggestedGoals.fat}g</Text>
            </View>
          </View>
          
          <Text style={styles.suggestionReason}>
            {suggestions.reasoning.predictions[0]}
          </Text>
          
          {suggestions.riskFactors.length > 0 && (
            <View style={styles.riskFactors}>
              <Text style={styles.riskTitle}>Consider:</Text>
              {suggestions.riskFactors.slice(0, 2).map((risk, index) => (
                <Text key={index} style={styles.riskText}>• {risk}</Text>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderRecentAdjustments = () => {
    const history = adjustmentHistoryQuery.data?.history;
    if (!history || history.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Adjustments</Text>
          <TouchableOpacity onPress={onNavigateToHistory}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {history.slice(0, 3).map((adjustment) => (
          <View key={adjustment.id} style={styles.adjustmentItem}>
            <View style={styles.adjustmentHeader}>
              <Text style={styles.adjustmentDate}>
                {new Date(adjustment.adjustmentDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
              <View style={[styles.sourceBadge, { backgroundColor: getSourceColor(adjustment.source) }]}>
                <Text style={styles.sourceText}>{getSourceLabel(adjustment.source)}</Text>
              </View>
            </View>
            <Text style={styles.adjustmentReason} numberOfLines={2}>
              {adjustment.reason}
            </Text>
            {adjustment.effectiveness && (
              <Text style={styles.effectivenessText}>
                Adherence improved by {adjustment.effectiveness.adherenceImprovement}%
              </Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'system_recommendation':
        return colors.primary;
      case 'user_request':
        return colors.success;
      case 'periodic_review':
        return colors.warning;
      default:
        return colors.mediumGray;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'system_recommendation':
        return 'AI';
      case 'user_request':
        return 'Manual';
      case 'periodic_review':
        return 'Review';
      default:
        return 'Other';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Goal Review</Text>
            <Text style={styles.headerSubtitle}>
              Next review: {getNextReviewDate()}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => goalReviewQuery.refetch()}
            >
              <RefreshCw size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={onNavigateToSettings}
            >
              <Settings size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['weekly', 'monthly', 'quarterly'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonSelected,
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period && styles.periodButtonTextSelected,
                ]}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Stats */}
        {renderQuickStats()}

        {/* Current Review */}
        {goalReviewQuery.data && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Review</Text>
            <GoalReviewCard
              review={goalReviewQuery.data}
              onViewDetails={() => handleViewReviewDetails(goalReviewQuery.data!)}
              onTakeAction={() => handleTakeAction(goalReviewQuery.data!)}
            />
          </View>
        )}

        {/* Smart Suggestions */}
        {renderSmartSuggestions()}

        {/* Recent Adjustments */}
        {renderRecentAdjustments()}

        {/* Next Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Steps</Text>
          <View style={styles.nextStepsCard}>
            <Clock size={20} color={colors.primary} />
            <View style={styles.nextStepsContent}>
              <Text style={styles.nextStepsTitle}>Stay Consistent</Text>
              <Text style={styles.nextStepsText}>
                Continue logging your meals and tracking progress. Your next automatic review will be in 7 days.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Feedback Modal */}
      <GoalFeedbackModal
        visible={showFeedbackModal}
        review={selectedReview}
        onClose={() => {
          setShowFeedbackModal(false);
          setSelectedReview(null);
        }}
        onSubmit={handleSubmitFeedback}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.mediumGray,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonSelected: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.mediumGray,
  },
  periodButtonTextSelected: {
    color: colors.white,
  },
  quickStats: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.mediumGray,
    marginTop: 4,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  confidenceBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.white,
  },
  suggestionCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  goalComparison: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  goalColumn: {
    alignItems: 'center',
  },
  goalLabel: {
    fontSize: 12,
    color: colors.mediumGray,
    marginBottom: 4,
  },
  goalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  suggestionReason: {
    fontSize: 14,
    color: colors.mediumGray,
    lineHeight: 20,
    marginBottom: 12,
  },
  riskFactors: {
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    padding: 12,
  },
  riskTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  riskText: {
    fontSize: 12,
    color: colors.mediumGray,
    lineHeight: 16,
  },
  adjustmentItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  adjustmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  adjustmentDate: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.white,
    textTransform: 'uppercase',
  },
  adjustmentReason: {
    fontSize: 13,
    color: colors.mediumGray,
    lineHeight: 18,
    marginBottom: 6,
  },
  effectivenessText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '500',
  },
  nextStepsCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
  },
  nextStepsContent: {
    flex: 1,
    marginLeft: 12,
  },
  nextStepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  nextStepsText: {
    fontSize: 14,
    color: colors.mediumGray,
    lineHeight: 20,
  },
});