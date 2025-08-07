import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';

export const generateGoalReviewProcedure = protectedProcedure
  .input(
    z.object({
      period: z.enum(['weekly', 'monthly', 'quarterly']).default('weekly'),
      includeUserFeedback: z.boolean().default(false),
    })
  )
  .query(async ({ input, ctx }) => {
    const { period, includeUserFeedback } = input;
    const userId = ctx.user.id;

    // Get user profile and current goals
    const { data: profile } = await ctx.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!profile) {
      throw new Error('Profile not found');
    }

    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'weekly':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case 'quarterly':
        startDate.setDate(endDate.getDate() - 90);
        break;
    }

    // Get nutrition data for the period
    const { data: foodEntries } = await ctx.supabase
      .from('food_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', startDate.toISOString())
      .lte('logged_at', endDate.toISOString());

    // Get weight data
    const { data: weightEntries } = await ctx.supabase
      .from('weight_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    // Calculate adherence and progress
    const currentGoals = {
      calories: profile.calorie_goal || 2000,
      protein: profile.protein_goal || 150,
      carbs: profile.carbs_goal || 200,
      fat: profile.fat_goal || 65,
    };

    // Analyze nutrition adherence
    const dailyTotals = foodEntries?.reduce((acc: any, entry: any) => {
      const date = entry.logged_at.split('T')[0];
      if (!acc[date]) {
        acc[date] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }
      acc[date].calories += entry.calories * entry.servings;
      acc[date].protein += entry.protein * entry.servings;
      acc[date].carbs += entry.carbs * entry.servings;
      acc[date].fat += entry.fat * entry.servings;
      return acc;
    }, {}) || {};

    const days = Object.keys(dailyTotals);
    const avgCalories = days.length > 0 ? days.reduce((sum, day) => sum + dailyTotals[day].calories, 0) / days.length : 0;
    const avgProtein = days.length > 0 ? days.reduce((sum, day) => sum + dailyTotals[day].protein, 0) / days.length : 0;
    const avgCarbs = days.length > 0 ? days.reduce((sum, day) => sum + dailyTotals[day].carbs, 0) / days.length : 0;
    const avgFat = days.length > 0 ? days.reduce((sum, day) => sum + dailyTotals[day].fat, 0) / days.length : 0;

    const calorieAdherence = currentGoals.calories > 0 ? Math.min((avgCalories / currentGoals.calories) * 100, 150) : 0;
    const proteinAdherence = currentGoals.protein > 0 ? Math.min((avgProtein / currentGoals.protein) * 100, 150) : 0;
    const carbsAdherence = currentGoals.carbs > 0 ? Math.min((avgCarbs / currentGoals.carbs) * 100, 150) : 0;
    const fatAdherence = currentGoals.fat > 0 ? Math.min((avgFat / currentGoals.fat) * 100, 150) : 0;

    // Calculate weight progress
    const weightProgress = weightEntries && weightEntries.length >= 2 
      ? weightEntries[weightEntries.length - 1].weight - weightEntries[0].weight
      : 0;

    // Calculate consistency score
    const consistencyScore = days.length > 0 ? (days.length / (period === 'weekly' ? 7 : period === 'monthly' ? 30 : 90)) * 100 : 0;

    // Determine trend direction
    let trendDirection: 'improving' | 'declining' | 'stable' = 'stable';
    if (profile.goal === 'lose' && weightProgress < -0.5) trendDirection = 'improving';
    else if (profile.goal === 'lose' && weightProgress > 0.5) trendDirection = 'declining';
    else if (profile.goal === 'gain' && weightProgress > 0.5) trendDirection = 'improving';
    else if (profile.goal === 'gain' && weightProgress < -0.5) trendDirection = 'declining';

    // Generate smart goal suggestions
    const suggestedGoals = { ...currentGoals };
    const recommendations = [];

    // Calorie adjustment logic
    if (calorieAdherence < 80 && profile.goal === 'lose') {
      suggestedGoals.calories = Math.round(currentGoals.calories * 0.95);
      recommendations.push({
        id: `cal-adj-${Date.now()}`,
        type: 'calorie_adjustment' as const,
        priority: 'high' as const,
        title: 'Reduce Daily Calorie Target',
        description: 'Your current calorie goal may be too high based on your adherence patterns.',
        rationale: `You've been averaging ${Math.round(avgCalories)} calories (${Math.round(calorieAdherence)}% of target). A lower target may improve adherence.`,
        expectedOutcome: 'Better adherence and more consistent progress toward weight loss.',
        implementation: {
          timeframe: '2 weeks',
          steps: [
            'Reduce daily calorie target by 5%',
            'Focus on high-satiety foods',
            'Monitor hunger levels and energy'
          ],
          metrics: ['Daily calorie adherence', 'Weekly weight change', 'Energy levels']
        },
        impact: {
          calories: suggestedGoals.calories - currentGoals.calories,
          expectedWeightChange: -0.3
        }
      });
    }

    // Protein adjustment
    if (proteinAdherence < 70) {
      const proteinIncrease = Math.round(currentGoals.protein * 0.1);
      suggestedGoals.protein = currentGoals.protein + proteinIncrease;
      recommendations.push({
        id: `protein-adj-${Date.now()}`,
        type: 'macro_rebalance' as const,
        priority: 'medium' as const,
        title: 'Increase Protein Target',
        description: 'Low protein adherence may be affecting satiety and muscle preservation.',
        rationale: `Current protein intake is ${Math.round(proteinAdherence)}% of target. Increasing target with better strategies may improve overall adherence.`,
        expectedOutcome: 'Improved satiety, better muscle preservation, and enhanced recovery.',
        implementation: {
          timeframe: '1 week',
          steps: [
            'Add protein to each meal',
            'Include protein-rich snacks',
            'Consider protein supplements if needed'
          ],
          metrics: ['Daily protein intake', 'Satiety levels', 'Workout recovery']
        },
        impact: {
          protein: proteinIncrease
        }
      });
    }

    // Generate adjustment reason
    let adjustmentReason = '';
    if (recommendations.length > 0) {
      adjustmentReason = `Based on ${period} analysis: ${Math.round(calorieAdherence)}% calorie adherence, ${Math.round(consistencyScore)}% consistency, and ${weightProgress > 0 ? '+' : ''}${weightProgress.toFixed(1)}kg weight change.`;
    } else {
      adjustmentReason = 'Current goals appear well-suited based on your progress and adherence patterns.';
    }

    const goalReview = {
      id: `review-${userId}-${Date.now()}`,
      userId,
      reviewDate: new Date().toISOString(),
      period,
      currentGoals,
      suggestedGoals,
      progressAnalysis: {
        calorieAdherence: Math.round(calorieAdherence),
        proteinAdherence: Math.round(proteinAdherence),
        carbsAdherence: Math.round(carbsAdherence),
        fatAdherence: Math.round(fatAdherence),
        weightProgress: Math.round(weightProgress * 10) / 10,
        consistencyScore: Math.round(consistencyScore),
        trendDirection
      },
      recommendations,
      adjustmentReason,
      status: 'pending' as const
    };

    return goalReview;
  });