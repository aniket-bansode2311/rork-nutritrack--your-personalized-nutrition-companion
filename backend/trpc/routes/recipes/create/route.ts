import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

const createRecipeSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  servings: z.number(),
  prep_time: z.number().optional(),
  cook_time: z.number().optional(),
  instructions: z.array(z.string()).optional(),
  ingredients: z.array(z.any()),
  total_calories: z.number(),
  total_protein: z.number(),
  total_carbs: z.number(),
  total_fat: z.number(),
  image_url: z.string().optional(),
  is_public: z.boolean().optional(),
});

export default protectedProcedure
  .input(createRecipeSchema)
  .mutation(async ({ input, ctx }) => {
    const { data: recipe, error } = await ctx.supabase
      .from('recipes')
      .insert({
        user_id: ctx.user.id,
        ...input,
        is_public: input.is_public || false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create recipe: ${error.message}`);
    }

    return recipe;
  });