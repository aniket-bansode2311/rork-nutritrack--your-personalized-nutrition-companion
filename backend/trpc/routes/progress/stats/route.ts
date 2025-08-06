import { z } from "zod";
import { protectedProcedure } from "../../create-context";

export const progressStatsProcedure = protectedProcedure
  .input(
    z.object({
      period: z.enum(["week", "month", "quarter", "year"]).default("month"),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
  )
  .query(async ({ input, ctx }) => {
    console.log("Fetching progress stats:", input);
    
    const now = new Date();
    let startDate = input.startDate;
    let endDate = input.endDate || now.toISOString().split('T')[0];
    
    if (!startDate) {
      const start = new Date(now);
      switch (input.period) {
        case 'week':
          start.setDate(now.getDate() - 7);
          break;
        case 'month':
          start.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          start.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          start.setFullYear(now.getFullYear() - 1);
          break;
      }
      startDate = start.toISOString().split('T')[0];
    }

    // Fetch nutrition data
    const { data: nutritionData } = await ctx.supabase
      .from("food_entries")
      .select(`
        *,
        food_items (*)
      `)
      .eq("user_id", ctx.user.id)
      .gte("date", startDate)
      .lte("date", endDate);

    // Fetch water data
    const { data: waterData } = await ctx.supabase
      .from("water_entries")
      .select("*")
      .eq("user_id", ctx.user.id)
      .gte("timestamp", startDate)
      .lte("timestamp", endDate);

    // Fetch activity data
    const { data: activityData } = await ctx.supabase
      .from("activity_entries")
      .select("*")
      .eq("user_id", ctx.user.id)
      .gte("timestamp", startDate)
      .lte("timestamp", endDate);

    // Fetch weight data
    const { data: weightData } = await ctx.supabase
      .from("weight_entries")
      .select("*")
      .eq("user_id", ctx.user.id)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    // Calculate averages and totals
    const totalDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    
    nutritionData?.forEach((entry) => {
      const foodItem = entry.food_items;
      const servings = entry.servings;
      totalCalories += (foodItem.calories || 0) * servings;
      totalProtein += (foodItem.protein || 0) * servings;
      totalCarbs += (foodItem.carbs || 0) * servings;
      totalFat += (foodItem.fat || 0) * servings;
    });

    const totalWater = waterData?.reduce((sum, entry) => sum + entry.amount, 0) || 0;
    const totalActivities = activityData?.length || 0;
    const totalCaloriesBurned = activityData?.reduce((sum, entry) => sum + (entry.calories_burned || 0), 0) || 0;
    
    const weightChange = weightData && weightData.length > 1 
      ? weightData[weightData.length - 1].weight - weightData[0].weight 
      : 0;

    // Get user's goals for achievement rate calculation
    const { data: profile } = await ctx.supabase
      .from("profiles")
      .select("nutrition_goals")
      .eq("id", ctx.user.id)
      .single();

    const dailyCalorieGoal = profile?.nutrition_goals?.calories || 2000;
    const averageCalories = totalCalories / totalDays;
    const goalAchievementRate = Math.min((averageCalories / dailyCalorieGoal) * 100, 100);

    return {
      period: input.period,
      averageCalories: Math.round(averageCalories),
      averageProtein: Math.round(totalProtein / totalDays),
      averageCarbs: Math.round(totalCarbs / totalDays),
      averageFat: Math.round(totalFat / totalDays),
      averageWater: Math.round(totalWater / totalDays),
      totalActivities,
      totalCaloriesBurned,
      weightChange: Math.round(weightChange * 10) / 10,
      goalAchievementRate: Math.round(goalAchievementRate),
    };
  });

export default progressStatsProcedure;