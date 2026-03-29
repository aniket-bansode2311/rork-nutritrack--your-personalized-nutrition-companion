import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

const getRecipesSchema = z.object({
  search: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
  include_public: z.boolean().optional(),
});

export default protectedProcedure
  .input(getRecipesSchema)
  .query(async ({ input, ctx }) => {
    let query = ctx.supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (input.include_public) {
      query = query.or(`user_id.eq.${ctx.user.id},is_public.eq.true`);
    } else {
      query = query.eq('user_id', ctx.user.id);
    }

    if (input.search) {
      query = query.ilike('name', `%${input.search}%`);
    }

    if (input.limit) {
      query = query.limit(input.limit);
    }

    if (input.offset) {
      query = query.range(input.offset, input.offset + (input.limit || 10) - 1);
    }

    const { data: recipes, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch recipes: ${error.message}`);
    }

    return recipes || [];
  });