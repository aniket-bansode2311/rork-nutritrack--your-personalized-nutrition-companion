import { z } from 'zod';
import { protectedProcedure } from '../../create-context';

export const smartGoalSuggestionsProcedure = protectedProcedure
  .input(
    z.object({
      analysisDepth: z.enum(['basic', 'detailed', 'comprehensive']).default('detailed'),
      includeAlternatives: z.boolean().default(true),
    })
  )
  .query(async ({ input, ctx }) => {
    const { analysisDepth, includeAlternatives } = input;
    const userId = ctx.user.id;

    // Get user profile
    const { data: profile } = await ctx.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!profile) {
      throw new Error('Profile not found');
    }

    // Get recent nutrition and weight data for analysis
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30); // Last 30 days

    const [nutritionData, weightData, activityData] = await Promise.all([
      ctx.supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('logged_at', startDate.toISOString())
        .lte('logged_at', endDate.toISOString()),
      
      ctx.supabase
        .from('weight_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true }),
      
      ctx.supabase
        .from('activity_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', startDate.toISOString())
    ]);

    // Analyze patterns and generate suggestions
    const currentGoals = {
      calories: profile.calorie_goal || 2000,
      protein: profile.protein_goal || 150,
      carbs: profile.carbs_goal || 200,
      fat: profile.fat_goal || 65,
    };

    // Calculate BMR and TDEE for baseline
    const bmr = calculateBMR(profile.weight, profile.height, profile.age, profile.gender);
    const tdee = bmr * getActivityMultiplier(profile.activity_level);

    // Analyze recent performance
    const recentPerformance = analyzeRecentPerformance(
      nutritionData.data || [],
      weightData.data || [],
      activityData.data || [],
      currentGoals
    );

    // Generate smart suggestions based on analysis
    const suggestedGoals = generateSmartGoals(
      currentGoals,
      recentPerformance,
      profile,
      tdee
    );

    // Calculate confidence based on data quality and patterns
    const confidence = calculateConfidence(
      nutritionData.data?.length || 0,
      weightData.data?.length || 0,
      recentPerformance.consistencyScore
    );

    // Generate reasoning
    const reasoning = {
      dataPoints: [
        `${nutritionData.data?.length || 0} nutrition entries in last 30 days`,
        `${weightData.data?.length || 0} weight measurements`,
        `Average adherence: ${Math.round(recentPerformance.averageAdherence)}%`,
        `Weight trend: ${recentPerformance.weightTrend}kg over 30 days`
      ],
      patterns: [
        recentPerformance.consistencyScore > 80 ? 'High logging consistency' : 'Inconsistent logging patterns',
        recentPerformance.averageAdherence > 90 ? 'Excellent goal adherence' : 
        recentPerformance.averageAdherence > 70 ? 'Good goal adherence' : 'Poor goal adherence',
        `${profile.goal} goal with ${recentPerformance.weightTrend > 0 ? 'weight gain' : recentPerformance.weightTrend < 0 ? 'weight loss' : 'stable weight'}`
      ],
      predictions: [
        `Estimated ${Math.abs(recentPerformance.projectedWeightChange)}kg ${recentPerformance.projectedWeightChange > 0 ? 'gain' : 'loss'} in next 30 days`,
        `${recentPerformance.adherenceImprovement > 0 ? 'Improving' : 'Declining'} adherence trend`,
        `Current approach ${recentPerformance.effectiveness > 0.7 ? 'effective' : 'needs adjustment'}`
      ]
    };

    const alternatives = includeAlternatives ? generateAlternativeGoals(
      suggestedGoals,
      profile,
      recentPerformance
    ) : [];

    return {
      currentGoals,
      suggestedGoals,
      alternatives,
      confidence,
      reasoning,
      analysisDepth,
      lastUpdated: new Date().toISOString()
    };
  });

// Helper functions
function calculateBMR(weight: number, height: number, age: number, gender: string): number {
  if (gender === 'male') {
    return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }
}

function getActivityMultiplier(activityLevel: string): number {
  const multipliers: Record<string, number> = {
    'sedentary': 1.2,
    'lightly_active': 1.375,
    'moderately_active': 1.55,
    'very_active': 1.725,
    'extremely_active': 1.9
  };
  return multipliers[activityLevel] || 1.375;
}

function analyzeRecentPerformance(
  nutritionData: any[],
  weightData: any[],
  activityData: any[],
  currentGoals: any
) {
  const totalDays = 30;
  const loggedDays = new Set(nutritionData.map(entry => entry.logged_at.split('T')[0])).size;
  const consistencyScore = (loggedDays / totalDays) * 100;

  const adherenceScores = nutritionData.map(entry => {
    const calorieAdherence = Math.min(100, (entry.calories / currentGoals.calories) * 100);
    const proteinAdherence = Math.min(100, (entry.protein / currentGoals.protein) * 100);
    return (calorieAdherence + proteinAdherence) / 2;
  });

  const averageAdherence = adherenceScores.length > 0 
    ? adherenceScores.reduce((sum, score) => sum + score, 0) / adherenceScores.length 
    : 0;

  const weightTrend = weightData.length > 1 
    ? weightData[weightData.length - 1].weight - weightData[0].weight 
    : 0;

  const projectedWeightChange = weightTrend * (30 / Math.max(1, weightData.length));
  const adherenceImprovement = adherenceScores.length > 7 
    ? adherenceScores.slice(-7).reduce((sum, score) => sum + score, 0) / 7 - 
      adherenceScores.slice(0, 7).reduce((sum, score) => sum + score, 0) / 7
    : 0;

  const effectiveness = Math.abs(weightTrend) > 0.5 ? 0.8 : 0.6;

  return {
    consistencyScore,
    averageAdherence,
    weightTrend,
    projectedWeightChange,
    adherenceImprovement,
    effectiveness
  };
}

function generateSmartGoals(
  currentGoals: any,
  performance: any,
  profile: any,
  tdee: number
) {
  const adjustmentFactor = performance.averageAdherence > 90 ? 1.05 : 
                          performance.averageAdherence < 70 ? 0.95 : 1.0;

  const goalAdjustment = profile.goal === 'lose_weight' ? -500 : 
                        profile.goal === 'gain_weight' ? 500 : 0;

  return {
    calories: Math.round((tdee + goalAdjustment) * adjustmentFactor),
    protein: Math.round((profile.weight * 2.2) * adjustmentFactor),
    carbs: Math.round(((tdee + goalAdjustment) * 0.45 / 4) * adjustmentFactor),
    fat: Math.round(((tdee + goalAdjustment) * 0.25 / 9) * adjustmentFactor)
  };
}

function calculateConfidence(
  nutritionEntries: number,
  weightEntries: number,
  consistencyScore: number
): number {
  const dataScore = Math.min(100, (nutritionEntries / 20) * 50 + (weightEntries / 8) * 30);
  const consistencyWeight = consistencyScore * 0.2;
  return Math.round(dataScore + consistencyWeight);
}

function generateAlternativeGoals(
  suggestedGoals: any,
  profile: any,
  performance: any
) {
  return [
    {
      name: 'Conservative Approach',
      description: 'Smaller adjustments for gradual progress',
      goals: {
        calories: Math.round(suggestedGoals.calories * 0.95),
        protein: suggestedGoals.protein,
        carbs: Math.round(suggestedGoals.carbs * 0.95),
        fat: Math.round(suggestedGoals.fat * 0.95)
      }
    },
    {
      name: 'Aggressive Approach',
      description: 'Larger adjustments for faster results',
      goals: {
        calories: Math.round(suggestedGoals.calories * 1.05),
        protein: Math.round(suggestedGoals.protein * 1.1),
        carbs: Math.round(suggestedGoals.carbs * 1.05),
        fat: suggestedGoals.fat
      }
    }
  ];
}