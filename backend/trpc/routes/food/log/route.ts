import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

const logFoodSchema = z.object({
  food_name: z.string(),
  brand: z.string().optional(),
  barcode: z.string().optional(),
  serving_size: z.number(),
  serving_unit: z.string(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  fiber: z.number().optional(),
  sugar: z.number().optional(),
  sodium: z.number().optional(),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  logged_at: z.string().optional(),
});

export default protectedProcedure
  .input(logFoodSchema)
  .mutation(async ({ input, ctx }) => {
    const { data: foodEntry, error } = await ctx.supabase
      .from('food_entries')
      .insert({
        user_id: ctx.user.id,
        ...input,
        logged_at: input.logged_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to log food: ${error.message}`);
    }

    return foodEntry;
  });