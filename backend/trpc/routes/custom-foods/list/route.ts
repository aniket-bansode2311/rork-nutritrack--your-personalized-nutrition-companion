import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

const getCustomFoodsSchema = z.object({
  search: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

export default protectedProcedure
  .input(getCustomFoodsSchema)
  .query(async ({ input, ctx }) => {
    let query = ctx.supabase
      .from('custom_foods')
      .select('*')
      .eq('user_id', ctx.user.id)
      .order('created_at', { ascending: false });

    if (input.search) {
      query = query.ilike('name', `%${input.search}%`);
    }

    if (input.limit) {
      query = query.limit(input.limit);
    }

    if (input.offset) {
      query = query.range(input.offset, input.offset + (input.limit || 10) - 1);
    }

    const { data: customFoods, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch custom foods: ${error.message}`);
    }

    return customFoods || [];
  });