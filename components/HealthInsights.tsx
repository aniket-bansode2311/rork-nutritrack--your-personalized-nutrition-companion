import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Brain } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { colors } from '@/constants/colors';
import { useDailyNutrition } from '@/hooks/useNutritionStore';

export const HealthInsights: React.FC = () => {
  const router = useRouter();
  const { total, goals, percentages } = useDailyNutrition();
  
  const generateInsights = () => {
    const insights = [];
    
    // Calorie insights
    if (percentages.calories < 80) {
      insights.push({
        type: 'warning',
        icon: AlertCircle,
        title: 'Low Calorie Intake',
        message: `You're ${Math.round(goals.calories - total.calories)} calories below your goal. Consider adding a healthy snack.`,
        color: colors.warning,
      });
    } else if (percentages.calories > 110) {
      insights.push({
        type: 'info',
        icon: TrendingUp,
        title: 'Above Calorie Goal',
        message: `You've exceeded your daily goal by ${Math.round(total.calories - goals.calories)} calories.`,
        color: colors.danger,
      });
    } else {
      insights.push({
        type: 'success',
        icon: CheckCircle,
        title: 'Great Calorie Balance',
        message: 'You\'re on track with your daily calorie goal!',
        color: colors.success,
      });
    }
    
    // Protein insights
    if (percentages.protein < 70) {
      insights.push({
        type: 'warning',
        icon: TrendingDown,
        title: 'Low Protein',
        message: `Add ${Math.round(goals.protein - total.protein)}g more protein for muscle maintenance and satiety.`,
        color: colors.warning,
      });
    }
    
    // Balanced diet insight
    const macroBalance = percentages.protein + percentages.carbs + percentages.fat;
    if (macroBalance > 0) {
      insights.push({
        type: 'info',
        icon: Brain,
        title: 'Macro Balance',
        message: 'Your macronutrient distribution looks balanced. Keep up the good work!',
        color: colors.primary,
      });
    }
    
    return insights.slice(0, 2); // Show max 2 insights
  };
  
  const insights = generateInsights();
  
  const navigateToCoaching = () => {
    router.push('/ai-coaching');
  };
  
  return (
    <View style={styles.container} testID="health-insights">
      <View style={styles.header}>
        <Text style={styles.title}>Health Insights</Text>
        <TouchableOpacity onPress={navigateToCoaching} testID="ai-coaching-button">
          <Brain size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      {insights.map((insight, index) => (
        <View key={index} style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <insight.icon size={20} color={insight.color} />
            <Text style={[styles.insightTitle, { color: insight.color }]}>
              {insight.title}
            </Text>
          </View>
          <Text style={styles.insightMessage}>{insight.message}</Text>
        </View>
      ))}
      
      <TouchableOpacity 
        style={styles.coachingButton}
        onPress={navigateToCoaching}
        testID="get-coaching-button"
      >
        <Brain size={18} color={colors.white} />
        <Text style={styles.coachingButtonText}>Get AI Coaching</Text>
      </TouchableOpacity>
    </View>
  );
};

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  insightCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  insightMessage: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 20,
  },
  coachingButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  coachingButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
});