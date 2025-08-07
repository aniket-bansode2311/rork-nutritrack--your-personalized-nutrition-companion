import { z } from "zod";
import { protectedProcedure } from "../../../../create-context";

const generateReviewSchema = z.object({
  period: z.enum(["week", "month", "quarter"]).default("week"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export default protectedProcedure
  .input(generateReviewSchema)
  .query(async ({ input, ctx }) => {
    const { period, startDate, endDate } = input;
    
    // Calculate date range if not provided
    const now = new Date();
    let reviewStartDate = startDate;
    let reviewEndDate = endDate || now.toISOString().split('T')[0];
    
    if (!reviewStartDate) {
      const start = new Date(now);
      switch (period) {
        case 'week':
          start.setDate(now.getDate() - 7);
          break;
        case 'month':
          start.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          start.setMonth(now.getMonth() - 3);
          break;
      }
      reviewStartDate = start.toISOString().split('T')[0];
    }

    // Fetch user's current goals
    const { data: profile } = await ctx.supabase
      .from("profiles")
      .select("calories_goal, protein_goal, carbs_goal, fat_goal")
      .eq("id", ctx.user.id)
      .single();

    if (!profile) {
      throw new Error("User profile not found");
    }

    // Fetch nutrition data for the period
    const { data: nutritionData } = await ctx.supabase
      .from("food_entries")
      .select("*")
      .eq("user_id", ctx.user.id)
      .gte("logged_at", reviewStartDate)
      .lte("logged_at", reviewEndDate);

    // Fetch weight data
    const { data: weightData } = await ctx.supabase
      .from("weight_entries")
      .select("*")
      .eq("user_id", ctx.user.id)
      .gte("date", reviewStartDate)
      .lte("date", reviewEndDate)
      .order("date", { ascending: true });

    // Calculate averages and progress
    const totalDays = Math.ceil((new Date(reviewEndDate).getTime() - new Date(reviewStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let daysLogged = 0;

    // Group by date to count actual logging days
    const dailyTotals = new Map();
    
    nutritionData?.forEach((entry) => {
      const date = entry.logged_at.split('T')[0];
      if (!dailyTotals.has(date)) {
        dailyTotals.set(date, {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        });
        daysLogged++;
      }
      const daily = dailyTotals.get(date);
      daily.calories += entry.calories || 0;
      daily.protein += entry.protein || 0;
      daily.carbs += entry.carbs || 0;
      daily.fat += entry.fat || 0;
    });

    // Calculate totals
    for (const daily of dailyTotals.values()) {
      totalCalories += daily.calories;
      totalProtein += daily.protein;
      totalCarbs += daily.carbs;
      totalFat += daily.fat;
    }

    const avgCalories = daysLogged > 0 ? totalCalories / daysLogged : 0;
    const avgProtein = daysLogged > 0 ? totalProtein / daysLogged : 0;
    const avgCarbs = daysLogged > 0 ? totalCarbs / daysLogged : 0;
    const avgFat = daysLogged > 0 ? totalFat / daysLogged : 0;

    // Calculate goal adherence
    const calorieAdherence = profile.calories_goal > 0 ? (avgCalories / profile.calories_goal) * 100 : 0;
    const proteinAdherence = profile.protein_goal > 0 ? (avgProtein / profile.protein_goal) * 100 : 0;
    const carbsAdherence = profile.carbs_goal > 0 ? (avgCarbs / profile.carbs_goal) * 100 : 0;
    const fatAdherence = profile.fat_goal > 0 ? (avgFat / profile.fat_goal) * 100 : 0;

    // Weight progress
    const weightChange = weightData && weightData.length > 1 
      ? weightData[weightData.length - 1].weight - weightData[0].weight 
      : 0;

    // Generate insights
    const insights = [];
    
    if (calorieAdherence < 80) {
      insights.push({
        type: 'warning',
        category: 'nutrition',
        message: `You consumed ${Math.round(avgCalories)} calories daily on average, which is ${Math.round(100 - calorieAdherence)}% below your goal. Consider adding nutrient-dense foods to meet your energy needs.`,
      });
    } else if (calorieAdherence > 120) {
      insights.push({
        type: 'info',
        category: 'nutrition',
        message: `You exceeded your calorie goal by ${Math.round(calorieAdherence - 100)}% on average. Consider portion control or more physical activity.`,
      });
    } else {
      insights.push({
        type: 'success',
        category: 'nutrition',
        message: 'Great job staying within your calorie goals! Your consistency is paying off.',
      });
    }

    if (proteinAdherence < 70) {
      insights.push({
        type: 'warning',
        category: 'nutrition',
        message: `Your protein intake averaged ${Math.round(avgProtein)}g daily, ${Math.round(profile.protein_goal - avgProtein)}g below your goal. Consider adding lean meats, legumes, or protein supplements.`,
      });
    }

    if (daysLogged < totalDays * 0.5) {
      insights.push({
        type: 'info',
        category: 'tracking',
        message: `You logged food on ${daysLogged} out of ${totalDays} days. More consistent tracking will help you reach your goals faster.`,
      });
    }

    // Recommendations
    const recommendations = [];
    
    if (calorieAdherence < 90) {
      recommendations.push({
        priority: 'high',
        category: 'nutrition',
        action: 'Increase calorie intake',
        description: 'Add healthy snacks between meals, such as nuts, fruits, or yogurt.',
      });
    }

    if (proteinAdherence < 80) {
      recommendations.push({
        priority: 'high',
        category: 'nutrition',
        action: 'Boost protein intake',
        description: 'Include a protein source with every meal and consider a post-workout protein shake.',
      });
    }

    if (daysLogged < totalDays * 0.7) {
      recommendations.push({
        priority: 'medium',
        category: 'tracking',
        action: 'Improve tracking consistency',
        description: 'Set daily reminders to log your meals, especially breakfast and snacks.',
      });
    }

    return {
      period,
      dateRange: {
        start: reviewStartDate,
        end: reviewEndDate,
      },
      summary: {
        daysInPeriod: totalDays,
        daysLogged,
        consistency: Math.round((daysLogged / totalDays) * 100),
      },
      nutrition: {
        averages: {
          calories: Math.round(avgCalories),
          protein: Math.round(avgProtein),
          carbs: Math.round(avgCarbs),
          fat: Math.round(avgFat),
        },
        adherence: {
          calories: Math.round(calorieAdherence),
          protein: Math.round(proteinAdherence),
          carbs: Math.round(carbsAdherence),
          fat: Math.round(fatAdherence),
        },
        goals: {
          calories: profile.calories_goal,
          protein: profile.protein_goal,
          carbs: profile.carbs_goal,
          fat: profile.fat_goal,
        },
      },
      progress: {
        weightChange: Math.round(weightChange * 10) / 10,
        weightEntries: weightData?.length || 0,
      },
      insights,
      recommendations,
    };
  });