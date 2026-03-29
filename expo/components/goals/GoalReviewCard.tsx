import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TrendingUp, TrendingDown, Minus, Target, Calendar, AlertCircle } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { GoalReview } from '@/types/nutrition';

interface GoalReviewCardProps {
  review: GoalReview;
  onViewDetails: () => void;
  onTakeAction: () => void;
}

export const GoalReviewCard: React.FC<GoalReviewCardProps> = ({
  review,
  onViewDetails,
  onTakeAction,
}) => {
  const getTrendIcon = () => {
    switch (review.progressAnalysis.trendDirection) {
      case 'improving':
        return <TrendingUp size={16} color={colors.success} />;
      case 'declining':
        return <TrendingDown size={16} color={colors.danger} />;
      default:
        return <Minus size={16} color={colors.mediumGray} />;
    }
  };

  const getTrendColor = () => {
    switch (review.progressAnalysis.trendDirection) {
      case 'improving':
        return colors.success;
      case 'declining':
        return colors.danger;
      default:
        return colors.mediumGray;
    }
  };

  const getStatusColor = () => {
    switch (review.status) {
      case 'pending':
        return colors.warning;
      case 'accepted':
        return colors.success;
      case 'rejected':
        return colors.danger;
      case 'modified':
        return colors.primary;
      default:
        return colors.mediumGray;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const hasSignificantChanges = () => {
    return (
      Math.abs(review.suggestedGoals.calories - review.currentGoals.calories) > 50 ||
      Math.abs(review.suggestedGoals.protein - review.currentGoals.protein) > 10 ||
      Math.abs(review.suggestedGoals.carbs - review.currentGoals.carbs) > 20 ||
      Math.abs(review.suggestedGoals.fat - review.currentGoals.fat) > 5
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Calendar size={18} color={colors.primary} />
          <Text style={styles.title}>
            {review.period.charAt(0).toUpperCase() + review.period.slice(1)} Goal Review
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{review.status}</Text>
          </View>
        </View>
        <Text style={styles.date}>{formatDate(review.reviewDate)}</Text>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.sectionTitle}>Progress Analysis</Text>
          <View style={styles.trendIndicator}>
            {getTrendIcon()}
            <Text style={[styles.trendText, { color: getTrendColor() }]}>
              {review.progressAnalysis.trendDirection}
            </Text>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Adherence</Text>
            <Text style={styles.metricValue}>{review.progressAnalysis.calorieAdherence}%</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Consistency</Text>
            <Text style={styles.metricValue}>{review.progressAnalysis.consistencyScore}%</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Weight Change</Text>
            <Text style={[styles.metricValue, { color: review.progressAnalysis.weightProgress > 0 ? colors.danger : colors.success }]}>
              {review.progressAnalysis.weightProgress > 0 ? '+' : ''}{review.progressAnalysis.weightProgress}kg
            </Text>
          </View>
        </View>
      </View>

      {hasSignificantChanges() && (
        <View style={styles.changesSection}>
          <View style={styles.changesHeader}>
            <Target size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>Suggested Changes</Text>
          </View>
          <View style={styles.goalComparison}>
            <View style={styles.goalColumn}>
              <Text style={styles.goalColumnTitle}>Current</Text>
              <Text style={styles.goalValue}>{review.currentGoals.calories} cal</Text>
              <Text style={styles.goalValue}>{review.currentGoals.protein}g protein</Text>
            </View>
            <View style={styles.arrow}>
              <Text style={styles.arrowText}>→</Text>
            </View>
            <View style={styles.goalColumn}>
              <Text style={styles.goalColumnTitle}>Suggested</Text>
              <Text style={[styles.goalValue, { color: colors.primary }]}>
                {review.suggestedGoals.calories} cal
              </Text>
              <Text style={[styles.goalValue, { color: colors.primary }]}>
                {review.suggestedGoals.protein}g protein
              </Text>
            </View>
          </View>
        </View>
      )}

      {review.recommendations.length > 0 && (
        <View style={styles.recommendationsSection}>
          <Text style={styles.sectionTitle}>Key Recommendations</Text>
          {review.recommendations.slice(0, 2).map((rec, index) => (
            <View key={rec.id} style={styles.recommendation}>
              <View style={styles.recommendationHeader}>
                <AlertCircle size={14} color={colors.warning} />
                <Text style={styles.recommendationTitle}>{rec.title}</Text>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(rec.priority) }]}>
                  <Text style={styles.priorityText}>{rec.priority}</Text>
                </View>
              </View>
              <Text style={styles.recommendationDescription} numberOfLines={2}>
                {rec.description}
              </Text>
            </View>
          ))}
          {review.recommendations.length > 2 && (
            <Text style={styles.moreRecommendations}>
              +{review.recommendations.length - 2} more recommendations
            </Text>
          )}
        </View>
      )}

      <View style={styles.reasonSection}>
        <Text style={styles.reasonText}>{review.adjustmentReason}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onViewDetails}>
          <Text style={styles.secondaryButtonText}>View Details</Text>
        </TouchableOpacity>
        {review.status === 'pending' && (
          <TouchableOpacity style={styles.primaryButton} onPress={onTakeAction}>
            <Text style={styles.primaryButtonText}>Take Action</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return colors.danger;
    case 'medium':
      return colors.warning;
    case 'low':
      return colors.success;
    default:
      return colors.mediumGray;
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.white,
    textTransform: 'capitalize',
  },
  date: {
    fontSize: 14,
    color: colors.mediumGray,
    marginLeft: 26,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.mediumGray,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  changesSection: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: colors.lightGray,
    borderRadius: 12,
  },
  changesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalComparison: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalColumn: {
    flex: 1,
  },
  goalColumnTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mediumGray,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  goalValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  arrow: {
    paddingHorizontal: 16,
  },
  arrowText: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: 'bold',
  },
  recommendationsSection: {
    marginBottom: 16,
  },
  recommendation: {
    marginBottom: 12,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 6,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.white,
    textTransform: 'uppercase',
  },
  recommendationDescription: {
    fontSize: 13,
    color: colors.mediumGray,
    lineHeight: 18,
    marginLeft: 20,
  },
  moreRecommendations: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
  reasonSection: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  reasonText: {
    fontSize: 13,
    color: colors.mediumGray,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
});