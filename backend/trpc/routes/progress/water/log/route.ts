import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

export const waterLogProcedure = protectedProcedure
  .input(
    z.object({
      amount: z.number().positive(),
      timestamp: z.string(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    console.log("Logging water entry:", input);
    
    const { data, error } = await ctx.supabase
      .from("water_entries")
      .insert({
        user_id: ctx.user.id,
        amount: input.amount,
        timestamp: input.timestamp,
      })
      .select()
      .single();

    if (error) {
      console.error("Error logging water:", error);
      throw new Error("Failed to log water entry");
    }

    return {
      id: data.id,
      amount: data.amount,
      timestamp: data.timestamp,
      userId: data.user_id,
    };
  });

export default waterLogProcedure;
