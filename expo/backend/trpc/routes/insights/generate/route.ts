import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import { PersonalizedInsights, NutrientInsight, MealTimingInsight, HealthGoalInsight } from '../../../../../types/nutrition';

const generateInsightsSchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
  userId: z.string(),
});

type NutritionData = {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  mealTimes: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
  };
};

type UserGoals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  weightGoal: 'lose' | 'maintain' | 'gain';
  activityLevel: string;
};

const analyzeNutrientDeficiencies = (nutritionData: NutritionData[], goals: UserGoals): NutrientInsight[] => {
  const insights: NutrientInsight[] = [];
  
  if (nutritionData.length === 0) return insights;
  
  // Calculate averages
  const avgCalories = nutritionData.reduce((sum, day) => sum + day.calories, 0) / nutritionData.length;
  const avgProtein = nutritionData.reduce((sum, day) => sum + day.protein, 0) / nutritionData.length;
  const avgCarbs = nutritionData.reduce((sum, day) => sum + day.carbs, 0) / nutritionData.length;
  const avgFat = nutritionData.reduce((sum, day) => sum + day.fat, 0) / nutritionData.length;
  const avgFiber = nutritionData.reduce((sum, day) => sum + (day.fiber || 0), 0) / nutritionData.length;
  const avgSodium = nutritionData.reduce((sum, day) => sum + (day.sodium || 0), 0) / nutritionData.length;
  
  // Analyze protein intake
  const proteinDeficit = goals.protein - avgProtein;
  if (proteinDeficit > 10) {
    insights.push({
      id: 'protein-deficiency',
      type: 'deficiency',
      nutrient: 'protein',
      severity: proteinDeficit > 30 ? 'high' : proteinDeficit > 20 ? 'medium' : 'low',
      title: 'Protein Intake Below Target',
      description: `Your average protein intake is ${avgProtein.toFixed(1)}g, which is ${proteinDeficit.toFixed(1)}g below your daily goal.`,
      recommendation: 'Consider adding lean protein sources to your meals to support muscle maintenance and satiety.',
      actionItems: [
        'Add Greek yogurt or cottage cheese to breakfast',
        'Include lean meats, fish, or legumes in lunch and dinner',
        'Consider a protein smoothie as a snack',
        'Try protein-rich snacks like nuts or hard-boiled eggs'
      ],
      suggestedFoods: {
        targetValue: goals.protein,
        currentValue: avgProtein,
        trend: 'declining'
      }
    });
  } else if (proteinDeficit < -10) {
    insights.push({
      id: 'protein-excess',
      type: 'excess',
      nutrient: 'protein',
      severity: 'low',
      title: 'Protein Intake Above Target',
      description: `Your protein intake is ${Math.abs(proteinDeficit).toFixed(1)}g above your daily goal. This is generally fine for active individuals.`,
      recommendation: 'Your protein intake is adequate. Ensure you\'re balancing it with other macronutrients.',
      actionItems: [
        'Monitor kidney health if consistently high',
        'Ensure adequate hydration',
        'Balance with complex carbohydrates and healthy fats'
      ]
    });
  }
  
  // Analyze fiber intake (recommended 25-35g daily)
  if (avgFiber < 20) {
    insights.push({
      id: 'fiber-deficiency',
      type: 'deficiency',
      nutrient: 'fiber',
      severity: avgFiber < 15 ? 'high' : 'medium',
      title: 'Low Fiber Intake',
      description: `Your average fiber intake is ${avgFiber.toFixed(1)}g, below the recommended 25-35g daily.`,
      recommendation: 'Increase fiber intake gradually to support digestive health and satiety.',
      actionItems: [
        'Choose whole grains over refined grains',
        'Add more vegetables and fruits to meals',
        'Include legumes and beans in your diet',
        'Snack on nuts, seeds, and fresh fruits'
      ]
    });
  }
  
  // Analyze sodium intake (recommended <2300mg daily)
  if (avgSodium > 2500) {
    insights.push({
      id: 'sodium-excess',
      type: 'excess',
      nutrient: 'sodium',
      severity: avgSodium > 3500 ? 'high' : 'medium',
      title: 'High Sodium Intake',
      description: `Your average sodium intake is ${avgSodium.toFixed(0)}mg, above the recommended 2300mg daily.`,
      recommendation: 'Reduce sodium intake to support cardiovascular health and reduce water retention.',
      actionItems: [
        'Cook more meals at home',
        'Use herbs and spices instead of salt',
        'Choose fresh foods over processed ones',
        'Read nutrition labels carefully'
      ]
    });
  }
  
  // Analyze calorie balance
  const calorieDeficit = goals.calories - avgCalories;
  if (Math.abs(calorieDeficit) > 200) {
    const isDeficit = calorieDeficit > 0;
    insights.push({
      id: 'calorie-balance',
      type: isDeficit ? 'deficiency' : 'excess',
      nutrient: 'calories',
      severity: Math.abs(calorieDeficit) > 500 ? 'high' : 'medium',
      title: isDeficit ? 'Calorie Intake Below Target' : 'Calorie Intake Above Target',
      description: `Your average calorie intake is ${Math.abs(calorieDeficit).toFixed(0)} calories ${isDeficit ? 'below' : 'above'} your daily goal.`,
      recommendation: isDeficit 
        ? 'Consider adding nutrient-dense calories to meet your energy needs.'
        : 'Consider reducing portion sizes or increasing physical activity.',
      actionItems: isDeficit ? [
        'Add healthy snacks between meals',
        'Include healthy fats like avocado and nuts',
        'Consider larger portions of nutrient-dense foods'
      ] : [
        'Practice portion control',
        'Increase physical activity',
        'Focus on low-calorie, high-volume foods like vegetables'
      ]
    });
  }
  
  return insights;
};

const analyzeMealTiming = (nutritionData: NutritionData[]): MealTimingInsight[] => {
  const insights: MealTimingInsight[] = [];
  
  if (nutritionData.length === 0) return insights;
  
  // Analyze meal timing patterns
  const mealTimes = nutritionData
    .filter(day => day.mealTimes.breakfast || day.mealTimes.lunch || day.mealTimes.dinner)
    .map(day => day.mealTimes);
  
  if (mealTimes.length === 0) return insights;
  
  // Calculate average meal times
  const avgBreakfastTime = mealTimes
    .filter(times => times.breakfast)
    .reduce((sum, times, _, arr) => {
      const time = times.breakfast!;
      const [hours, minutes] = time.split(':').map(Number);
      return sum + (hours * 60 + minutes) / arr.length;
    }, 0);
  
  const avgLunchTime = mealTimes
    .filter(times => times.lunch)
    .reduce((sum, times, _, arr) => {
      const time = times.lunch!;
      const [hours, minutes] = time.split(':').map(Number);
      return sum + (hours * 60 + minutes) / arr.length;
    }, 0);
  
  const avgDinnerTime = mealTimes
    .filter(times => times.dinner)
    .reduce((sum, times, _, arr) => {
      const time = times.dinner!;
      const [hours, minutes] = time.split(':').map(Number);
      return sum + (hours * 60 + minutes) / arr.length;
    }, 0);
  
  // Convert back to time format
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };
  
  // Check for late dinner timing
  if (avgDinnerTime > 20 * 60) { // After 8 PM
    insights.push({
      id: 'late-dinner',
      type: 'timing',
      title: 'Late Dinner Timing',
      description: `Your average dinner time is ${formatTime(avgDinnerTime)}, which may affect sleep quality and digestion.`,
      recommendation: 'Try to eat dinner at least 2-3 hours before bedtime for better sleep and digestion.',
      suggestedTiming: {
        breakfast: '07:00',
        lunch: '12:30',
        dinner: '18:30'
      },
      currentPattern: {
        averageBreakfastTime: formatTime(avgBreakfastTime),
        averageLunchTime: formatTime(avgLunchTime),
        averageDinnerTime: formatTime(avgDinnerTime)
      }
    });
  }
  
  // Check for skipped breakfast
  const breakfastDays = mealTimes.filter(times => times.breakfast).length;
  const breakfastRate = breakfastDays / mealTimes.length;
  
  if (breakfastRate < 0.7) {
    insights.push({
      id: 'skipped-breakfast',
      type: 'frequency',
      title: 'Inconsistent Breakfast Habits',
      description: `You skip breakfast ${Math.round((1 - breakfastRate) * 100)}% of the time, which may affect energy levels and metabolism.`,
      recommendation: 'Try to eat a balanced breakfast within 2 hours of waking to kickstart your metabolism.',
      suggestedTiming: {
        breakfast: '07:30',
        lunch: '12:30',
        dinner: '18:30'
      }
    });
  }
  
  return insights;
};

const analyzeHealthGoals = (nutritionData: NutritionData[], goals: UserGoals): HealthGoalInsight[] => {
  const insights: HealthGoalInsight[] = [];
  
  if (nutritionData.length === 0) return insights;
  
  const avgCalories = nutritionData.reduce((sum, day) => sum + day.calories, 0) / nutritionData.length;
  const calorieDeficit = goals.calories - avgCalories;
  
  // Weight loss goal analysis
  if (goals.weightGoal === 'lose') {
    if (calorieDeficit < 200) {
      insights.push({
        id: 'weight-loss-progress',
        goalType: 'weight_loss',
        title: 'Weight Loss Progress',
        description: 'Your calorie deficit may be too small for effective weight loss.',
        progressStatus: calorieDeficit < 0 ? 'behind' : 'stalled',
        recommendation: 'Create a moderate calorie deficit of 300-500 calories daily for sustainable weight loss.',
        actionItems: [
          'Increase physical activity by 30 minutes daily',
          'Reduce portion sizes by 10-15%',
          'Replace high-calorie snacks with vegetables and fruits',
          'Track your food intake more carefully'
        ],
        estimatedTimeToGoal: '12-16 weeks for 1-2 lbs per week',
        adjustedCalorieTarget: goals.calories - 400
      });
    } else if (calorieDeficit > 800) {
      insights.push({
        id: 'aggressive-deficit',
        goalType: 'weight_loss',
        title: 'Aggressive Calorie Deficit',
        description: 'Your calorie deficit may be too large, which could slow metabolism and cause muscle loss.',
        progressStatus: 'ahead',
        recommendation: 'Moderate your calorie deficit to preserve muscle mass and maintain energy levels.',
        actionItems: [
          'Increase calorie intake slightly',
          'Focus on protein-rich foods',
          'Include strength training exercises',
          'Ensure adequate rest and recovery'
        ],
        adjustedCalorieTarget: goals.calories - 500
      });
    } else {
      insights.push({
        id: 'weight-loss-on-track',
        goalType: 'weight_loss',
        title: 'Weight Loss On Track',
        description: 'Your calorie deficit is in the optimal range for sustainable weight loss.',
        progressStatus: 'on_track',
        recommendation: 'Continue your current approach while monitoring progress and adjusting as needed.',
        actionItems: [
          'Maintain consistent eating patterns',
          'Continue regular physical activity',
          'Monitor weight trends weekly',
          'Celebrate small victories'
        ]
      });
    }
  }
  
  // Weight gain goal analysis
  if (goals.weightGoal === 'gain') {
    if (calorieDeficit > -200) {
      insights.push({
        id: 'weight-gain-progress',
        goalType: 'weight_gain',
        title: 'Weight Gain Progress',
        description: 'Your calorie surplus may be too small for effective weight gain.',
        progressStatus: 'behind',
        recommendation: 'Increase calorie intake by 300-500 calories daily for healthy weight gain.',
        actionItems: [
          'Add healthy snacks between meals',
          'Include calorie-dense foods like nuts and avocados',
          'Increase portion sizes gradually',
          'Focus on strength training to build muscle'
        ],
        adjustedCalorieTarget: goals.calories + 400,
        adjustedMacroTargets: {
          protein: goals.protein + 20,
          carbs: goals.carbs + 50,
          fat: goals.fat + 15
        }
      });
    }
  }
  
  return insights;
};

const generateAIInsights = async (nutritionData: NutritionData[], userGoals: UserGoals, period: string): Promise<string> => {
  try {
    const prompt = `As a nutrition AI assistant, analyze the following nutrition data and provide personalized insights:

User Goals:
- Calories: ${userGoals.calories}
- Protein: ${userGoals.protein}g
- Carbs: ${userGoals.carbs}g
- Fat: ${userGoals.fat}g
- Weight Goal: ${userGoals.weightGoal}
- Activity Level: ${userGoals.activityLevel}

Nutrition Data (${period}):
${nutritionData.map(day => `Date: ${day.date}, Calories: ${day.calories}, Protein: ${day.protein}g, Carbs: ${day.carbs}g, Fat: ${day.fat}g`).join('\n')}

Provide a brief, encouraging summary of their nutrition patterns and one key recommendation for improvement. Keep it under 150 words and maintain a positive, supportive tone.`;

    const response = await fetch('https://toolkit.rork.com/text/llm/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are a supportive nutrition coach. Provide encouraging, actionable advice in a friendly tone.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();
    return data.completion || 'Keep up the great work with your nutrition journey! Focus on consistency and balance.';
  } catch (error) {
    console.error('Error generating AI insights:', error);
    return 'Keep up the great work with your nutrition journey! Focus on consistency and balance.';
  }
};

const generateInsightsProcedure = protectedProcedure
  .input(generateInsightsSchema)
  .query(async ({ input, ctx }) => {
    const { period, userId } = input;
    
    // Mock nutrition data - in a real app, this would come from the database
    const mockNutritionData: NutritionData[] = [
      {
        date: '2024-01-01',
        calories: 1800,
        protein: 85,
        carbs: 200,
        fat: 65,
        fiber: 18,
        sodium: 2100,
        mealTimes: { breakfast: '08:00', lunch: '13:00', dinner: '19:30' }
      },
      {
        date: '2024-01-02',
        calories: 2100,
        protein: 95,
        carbs: 250,
        fat: 75,
        fiber: 22,
        sodium: 2400,
        mealTimes: { breakfast: '07:30', lunch: '12:30', dinner: '20:00' }
      },
      {
        date: '2024-01-03',
        calories: 1650,
        protein: 70,
        carbs: 180,
        fat: 55,
        fiber: 15,
        sodium: 1900,
        mealTimes: { lunch: '14:00', dinner: '21:00' }
      }
    ];
    
    const mockUserGoals: UserGoals = {
      calories: 2000,
      protein: 120,
      carbs: 225,
      fat: 65,
      weightGoal: 'lose',
      activityLevel: 'moderate'
    };
    
    // Generate insights
    const nutrientInsights = analyzeNutrientDeficiencies(mockNutritionData, mockUserGoals);
    const mealTimingInsights = analyzeMealTiming(mockNutritionData);
    const healthGoalInsights = analyzeHealthGoals(mockNutritionData, mockUserGoals);
    
    // Generate AI summary
    const aiSummary = await generateAIInsights(mockNutritionData, mockUserGoals, period);
    
    // Calculate pattern scores
    const avgCalories = mockNutritionData.reduce((sum, day) => sum + day.calories, 0) / mockNutritionData.length;
    const calorieVariance = mockNutritionData.reduce((sum, day) => sum + Math.pow(day.calories - avgCalories, 2), 0) / mockNutritionData.length;
    const consistencyScore = Math.max(0, 100 - (Math.sqrt(calorieVariance) / avgCalories) * 100);
    
    const avgFiber = mockNutritionData.reduce((sum, day) => sum + (day.fiber || 0), 0) / mockNutritionData.length;
    const hydrationScore = 75; // Mock score
    const varietyScore = 80; // Mock score
    const balanceScore = Math.min(100, (avgCalories / mockUserGoals.calories) * 100);
    
    const insights: PersonalizedInsights = {
      id: `insights-${Date.now()}`,
      userId,
      generatedAt: new Date().toISOString(),
      period,
      overallScore: Math.round((consistencyScore + hydrationScore + varietyScore + balanceScore) / 4),
      summary: aiSummary,
      nutrientInsights,
      mealTimingInsights,
      healthGoalInsights,
      patterns: {
        consistencyScore: Math.round(consistencyScore),
        hydrationScore,
        varietyScore,
        balanceScore: Math.round(balanceScore)
      },
      achievements: [
        'Maintained protein intake above 70g for 3 days',
        'Kept sodium under 2500mg most days'
      ],
      challenges: [
        'Inconsistent breakfast habits',
        'Late dinner timing affecting sleep'
      ],
      nextWeekFocus: [
        'Eat breakfast within 2 hours of waking',
        'Increase fiber intake with more vegetables',
        'Move dinner time earlier for better sleep'
      ]
    };
    
    return insights;
  });

export default generateInsightsProcedure;