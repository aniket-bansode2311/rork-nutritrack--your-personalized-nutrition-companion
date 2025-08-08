import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

const getFoodEntriesSchema = z.object({
  date: z.string().optional(),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

export default protectedProcedure
  .input(getFoodEntriesSchema)
  .query(async ({ input, ctx }) => {
    // Optimized query with selective fields and better indexing
    let query = ctx.supabase
      .from('food_entries')
      .select(`
        id,
        food_name,
        brand,
        serving_size,
        serving_unit,
        calories,
        protein,
        carbs,
        fat,
        fiber,
        sugar,
        sodium,
        meal_type,
        logged_at
      `)
      .eq('user_id', ctx.user.id);

    // Optimize date filtering for better index usage
    if (input.date) {
      const startOfDay = new Date(input.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(input.date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query = query
        .gte('logged_at', startOfDay.toISOString())
        .lt('logged_at', endOfDay.toISOString());
    }

    if (input.meal_type) {
      query = query.eq('meal_type', input.meal_type);
    }

    // Apply ordering after filtering for better performance
    query = query.order('logged_at', { ascending: false });

    if (input.limit) {
      query = query.limit(input.limit);
    }

    if (input.offset) {
      query = query.range(input.offset, input.offset + (input.limit || 10) - 1);
    }

    const { data: entries, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch food entries: ${error.message}`);
    }

    return entries || [];
  });