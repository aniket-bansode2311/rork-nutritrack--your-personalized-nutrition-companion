import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

const deleteFoodEntrySchema = z.object({
  id: z.string(),
});

export default protectedProcedure
  .input(deleteFoodEntrySchema)
  .mutation(async ({ input, ctx }) => {
    const { data: deletedEntry, error } = await ctx.supabase
      .from('food_entries')
      .delete()
      .eq('id', input.id)
      .eq('user_id', ctx.user.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to delete food entry: ${error.message}`);
    }

    return deletedEntry;
  });