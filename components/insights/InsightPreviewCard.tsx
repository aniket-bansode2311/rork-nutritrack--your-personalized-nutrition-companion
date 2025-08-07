import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Brain, TrendingUp, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';

import { colors } from '@/constants/colors';

interface InsightPreviewCardProps {
  overallScore?: number;
  topInsight?: string;
  isLoading?: boolean;
}

export default function InsightPreviewCard({ 
  overallScore = 75, 
  topInsight = "Your protein intake has been consistently good this week!",
  isLoading = false 
}: InsightPreviewCardProps) {
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.error;
  };

  const handlePress = () => {
    router.push('/ai-coaching');
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} testID="insight-preview-card">
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Brain size={20} color={colors.primary} />
          <Text style={styles.title}>AI Insights</Text>
        </View>
        <ChevronRight size={16} color={colors.mediumGray} />
      </View>
      
      <View style={styles.content}>
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreValue, { color: getScoreColor(overallScore) }]}>
            {overallScore}
          </Text>
          <Text style={styles.scoreLabel}>Score</Text>
        </View>
        
        <View style={styles.insightContainer}>
          <TrendingUp size={16} color={colors.success} />
          <Text style={styles.insightText} numberOfLines={2}>
            {topInsight}
          </Text>
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Tap for detailed analysis</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 12,
    color: colors.mediumGray,
    marginTop: 2,
  },
  insightContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  insightText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: colors.mediumGray,
    textAlign: 'center',
  },
});