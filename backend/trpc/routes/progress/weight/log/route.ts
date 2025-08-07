import { z } from "zod";
import { protectedProcedure } from "../../../../create-context";

export const weightLogProcedure = protectedProcedure
  .input(
    z.object({
      weight: z.number().positive(),
      date: z.string(),
    })
  )
  .mutation(async ({ input, ctx }: { input: { weight: number; date: string }; ctx: any }) => {
    console.log("Logging weight entry:", input);
    
    const { data, error } = await ctx.supabase
      .from("weight_entries")
      .insert({
        user_id: ctx.user.id,
        weight: input.weight,
        date: input.date,
      })
      .select()
      .single();

    if (error) {
      console.error("Error logging weight:", error);
      throw new Error("Failed to log weight entry");
    }

    return {
      id: data.id,
      weight: data.weight,
      date: data.date,
      userId: data.user_id,
    };
  });

export default weightLogProcedure;