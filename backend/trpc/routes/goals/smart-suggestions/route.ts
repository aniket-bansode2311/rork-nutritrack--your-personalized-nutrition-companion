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
    const bmr = calculateBMR(profile.weight, profile.height, profile.age, profile.gender);\n    const tdee = bmr * getActivityMultiplier(profile.activity_level);\n\n    // Analyze recent performance\n    const recentPerformance = analyzeRecentPerformance(\n      nutritionData.data || [],\n      weightData.data || [],\n      activityData.data || [],\n      currentGoals\n    );\n\n    // Generate smart suggestions based on analysis\n    const suggestedGoals = generateSmartGoals(\n      currentGoals,\n      recentPerformance,\n      profile,\n      tdee\n    );\n\n    // Calculate confidence based on data quality and patterns\n    const confidence = calculateConfidence(\n      nutritionData.data?.length || 0,\n      weightData.data?.length || 0,\n      recentPerformance.consistencyScore\n    );\n\n    // Generate reasoning\n    const reasoning = {\n      dataPoints: [\n        `${nutritionData.data?.length || 0} nutrition entries in last 30 days`,\n        `${weightData.data?.length || 0} weight measurements`,\n        `Average adherence: ${Math.round(recentPerformance.averageAdherence)}%`,\n        `Weight trend: ${recentPerformance.weightTrend}kg over 30 days`\n      ],\n      patterns: [\n        recentPerformance.consistencyScore > 80 ? 'High logging consistency' : 'Inconsistent logging patterns',\n        recentPerformance.averageAdherence > 90 ? 'Excellent goal adherence' : \n        recentPerformance.averageAdherence > 70 ? 'Good goal adherence' : 'Poor goal adherence',\n        `${profile.goal} goal with ${recentPerformance.weightTrend > 0 ? 'weight gain' : recentPerformance.weightTrend < 0 ? 'weight loss' : 'stable weight'}`\n      ],\n      predictions: [\n        `Estimated ${Math.abs(recentPerformance.projectedWeightChange)}kg ${recentPerformance.projectedWeightChange > 0 ? 'gain' : 'loss'} in next 30 days`,\n        `${recentPerformance.adherenceImprovement > 0 ? 'Improving' : 'Declining'} adherence trend`,\n        `Current approach ${recentPerformance.isEffective ? 'is effective' : 'needs adjustment'}`\n      ]\n    };\n\n    // Generate expected outcomes\n    const expectedOutcomes = {\n      weightChange: recentPerformance.projectedWeightChange,\n      adherenceImprovement: Math.max(0, 100 - recentPerformance.averageAdherence) * 0.3,\n      energyLevel: recentPerformance.isEffective ? 'maintained' as const : 'improved' as const,\n      timeToGoal: estimateTimeToGoal(profile, recentPerformance, suggestedGoals)\n    };\n\n    // Identify risk factors\n    const riskFactors = [];\n    if (recentPerformance.consistencyScore < 50) riskFactors.push('Low logging consistency may affect accuracy');\n    if (recentPerformance.averageAdherence < 60) riskFactors.push('Poor adherence may indicate unrealistic goals');\n    if (Math.abs(recentPerformance.weightTrend) > 1) riskFactors.push('Rapid weight changes may not be sustainable');\n    if (confidence < 70) riskFactors.push('Limited data may reduce recommendation accuracy');\n\n    // Generate alternatives if requested\n    let alternatives = undefined;\n    if (includeAlternatives) {\n      alternatives = {\n        conservative: {\n          calories: Math.round(suggestedGoals.calories * 1.05),\n          protein: Math.round(suggestedGoals.protein * 0.95),\n          carbs: Math.round(suggestedGoals.carbs * 1.05),\n          fat: Math.round(suggestedGoals.fat * 1.05),\n        },\n        aggressive: {\n          calories: Math.round(suggestedGoals.calories * 0.95),\n          protein: Math.round(suggestedGoals.protein * 1.1),\n          carbs: Math.round(suggestedGoals.carbs * 0.9),\n          fat: Math.round(suggestedGoals.fat * 0.9),\n        }\n      };\n    }\n\n    const smartSuggestion = {\n      id: `smart-suggestion-${userId}-${Date.now()}`,\n      userId,\n      generatedAt: new Date().toISOString(),\n      confidence: Math.round(confidence),\n      suggestedGoals,\n      reasoning,\n      expectedOutcomes,\n      riskFactors,\n      alternatives\n    };\n\n    return smartSuggestion;\n  });\n\n// Helper functions\nfunction calculateBMR(weight: number, height: number, age: number, gender: string): number {\n  if (gender === 'male') {\n    return 10 * weight + 6.25 * height - 5 * age + 5;\n  } else {\n    return 10 * weight + 6.25 * height - 5 * age - 161;\n  }\n}\n\nfunction getActivityMultiplier(activityLevel: string): number {\n  const multipliers: { [key: string]: number } = {\n    'sedentary': 1.2,\n    'light': 1.375,\n    'moderate': 1.55,\n    'active': 1.725,\n    'very active': 1.9,\n  };\n  return multipliers[activityLevel] || 1.2;\n}\n\nfunction analyzeRecentPerformance(nutritionData: any[], weightData: any[], activityData: any[], currentGoals: any) {\n  // Calculate daily totals\n  const dailyTotals = nutritionData.reduce((acc: any, entry: any) => {\n    const date = entry.logged_at.split('T')[0];\n    if (!acc[date]) {\n      acc[date] = { calories: 0, protein: 0, carbs: 0, fat: 0 };\n    }\n    acc[date].calories += entry.calories * entry.servings;\n    acc[date].protein += entry.protein * entry.servings;\n    acc[date].carbs += entry.carbs * entry.servings;\n    acc[date].fat += entry.fat * entry.servings;\n    return acc;\n  }, {});\n\n  const days = Object.keys(dailyTotals);\n  const consistencyScore = (days.length / 30) * 100;\n\n  // Calculate adherence\n  const adherenceScores = days.map(day => {\n    const dayData = dailyTotals[day];\n    const calorieAdherence = Math.min((dayData.calories / currentGoals.calories) * 100, 150);\n    return calorieAdherence;\n  });\n\n  const averageAdherence = adherenceScores.length > 0 \n    ? adherenceScores.reduce((sum, score) => sum + score, 0) / adherenceScores.length \n    : 0;\n\n  // Calculate weight trend\n  const weightTrend = weightData.length >= 2 \n    ? weightData[weightData.length - 1].weight - weightData[0].weight\n    : 0;\n\n  // Project future performance\n  const projectedWeightChange = weightTrend * (30 / Math.max(1, weightData.length));\n  const adherenceImprovement = adherenceScores.length > 7 \n    ? adherenceScores.slice(-7).reduce((sum, score) => sum + score, 0) / 7 - \n      adherenceScores.slice(0, 7).reduce((sum, score) => sum + score, 0) / 7\n    : 0;\n\n  const isEffective = averageAdherence > 80 && Math.abs(weightTrend) > 0.2;\n\n  return {\n    consistencyScore,\n    averageAdherence,\n    weightTrend,\n    projectedWeightChange,\n    adherenceImprovement,\n    isEffective\n  };\n}\n\nfunction generateSmartGoals(currentGoals: any, performance: any, profile: any, tdee: number) {\n  let adjustedCalories = currentGoals.calories;\n  let adjustedProtein = currentGoals.protein;\n  let adjustedCarbs = currentGoals.carbs;\n  let adjustedFat = currentGoals.fat;\n\n  // Adjust based on adherence and progress\n  if (performance.averageAdherence < 70) {\n    // Poor adherence - make goals more achievable\n    adjustedCalories = Math.round(adjustedCalories * 1.05);\n  } else if (performance.averageAdherence > 95 && !performance.isEffective) {\n    // High adherence but no progress - adjust goals\n    if (profile.goal === 'lose') {\n      adjustedCalories = Math.round(adjustedCalories * 0.95);\n    } else if (profile.goal === 'gain') {\n      adjustedCalories = Math.round(adjustedCalories * 1.05);\n    }\n  }\n\n  // Ensure goals are within reasonable bounds\n  const minCalories = Math.round(tdee * 0.8);\n  const maxCalories = Math.round(tdee * 1.2);\n  adjustedCalories = Math.max(minCalories, Math.min(maxCalories, adjustedCalories));\n\n  // Adjust macros proportionally\n  const proteinRatio = adjustedProtein / currentGoals.calories;\n  const carbsRatio = adjustedCarbs / currentGoals.calories;\n  const fatRatio = adjustedFat / currentGoals.calories;\n\n  adjustedProtein = Math.round((adjustedCalories * proteinRatio) / 4);\n  adjustedCarbs = Math.round((adjustedCalories * carbsRatio) / 4);\n  adjustedFat = Math.round((adjustedCalories * fatRatio) / 9);\n\n  return {\n    calories: adjustedCalories,\n    protein: adjustedProtein,\n    carbs: adjustedCarbs,\n    fat: adjustedFat\n  };\n}\n\nfunction calculateConfidence(nutritionEntries: number, weightEntries: number, consistencyScore: number): number {\n  let confidence = 0;\n  \n  // Data quantity factor (0-40 points)\n  confidence += Math.min(40, (nutritionEntries / 20) * 40);\n  \n  // Weight data factor (0-20 points)\n  confidence += Math.min(20, (weightEntries / 10) * 20);\n  \n  // Consistency factor (0-40 points)\n  confidence += (consistencyScore / 100) * 40;\n  \n  return Math.min(100, confidence);\n}\n\nfunction estimateTimeToGoal(profile: any, performance: any, suggestedGoals: any): string {\n  if (profile.goal === 'maintain') return 'Ongoing maintenance';\n  \n  const weeklyWeightChange = Math.abs(performance.weightTrend) / 4;\n  if (weeklyWeightChange < 0.1) return '12+ weeks (slow progress)';\n  if (weeklyWeightChange > 1) return '4-6 weeks (rapid progress - monitor closely)';\n  \n  return '6-10 weeks (healthy pace)';\n}"