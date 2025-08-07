import { z } from "zod";
import { protectedProcedure } from "../../../../create-context";

export const nutritionTrendsProcedure = protectedProcedure
  .input(
    z.object({
      period: z.enum(["week", "month", "quarter", "year"]).default("month"),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
  )
  .query(async ({ input, ctx }: { input: { period: "week" | "month" | "quarter" | "year"; startDate?: string; endDate?: string }; ctx: any }) => {
    console.log("Fetching nutrition trends:", input);
    
    // Get food entries for the specified period
    let query = ctx.supabase
      .from("food_entries")
      .select(`
        *,
        food_items (*)
      `)
      .eq("user_id", ctx.user.id)
      .order("date", { ascending: true });

    if (input.startDate) {
      query = query.gte("date", input.startDate);
    }
    if (input.endDate) {
      query = query.lte("date", input.endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching nutrition trends:", error);
      throw new Error("Failed to fetch nutrition trends");
    }

    // Group by date and calculate daily totals
    const dailyTotals = new Map<string, any>();
    
    data.forEach((entry: any) => {
      const date = entry.date;
      const foodItem = entry.food_items;
      const servings = entry.servings;
      
      if (!dailyTotals.has(date)) {
        dailyTotals.set(date, {
          date,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          sodium: 0,
        });
      }
      
      const daily = dailyTotals.get(date);
      daily.calories += (foodItem.calories || 0) * servings;
      daily.protein += (foodItem.protein || 0) * servings;
      daily.carbs += (foodItem.carbs || 0) * servings;
      daily.fat += (foodItem.fat || 0) * servings;
      daily.fiber += (foodItem.fiber || 0) * servings;
      daily.sugar += (foodItem.sugar || 0) * servings;
      daily.sodium += (foodItem.sodium || 0) * servings;
    });

    return Array.from(dailyTotals.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  });

export default nutritionTrendsProcedure;
