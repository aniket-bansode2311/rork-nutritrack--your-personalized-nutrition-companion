import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

const createCustomFoodSchema = z.object({
  name: z.string(),
  brand: z.string().optional(),
  serving_size: z.number(),
  serving_unit: z.string(),
  calories_per_serving: z.number(),
  protein_per_serving: z.number(),
  carbs_per_serving: z.number(),
  fat_per_serving: z.number(),
  fiber_per_serving: z.number().optional(),
  sugar_per_serving: z.number().optional(),
  sodium_per_serving: z.number().optional(),
});

export default protectedProcedure
  .input(createCustomFoodSchema)
  .mutation(async ({ input, ctx }) => {
    const { data: customFood, error } = await ctx.supabase
      .from('custom_foods')
      .insert({
        user_id: ctx.user.id,
        ...input,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create custom food: ${error.message}`);
    }

    return customFood;
  });