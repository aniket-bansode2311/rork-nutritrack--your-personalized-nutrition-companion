import { z } from "zod";
import { protectedProcedure } from "../../../../create-context";

export const measurementLogProcedure = protectedProcedure
  .input(
    z.object({
      type: z.enum(["waist", "chest", "hips", "arms", "thighs", "neck"]),
      measurement: z.number().positive(),
      date: z.string(),
    })
  )
  .mutation(async ({ input, ctx }: { input: { type: "waist" | "chest" | "hips" | "arms" | "thighs" | "neck"; measurement: number; date: string }; ctx: any }) => {
    console.log("Logging body measurement:", input);
    
    const { data, error } = await ctx.supabase
      .from("body_measurements")
      .insert({
        user_id: ctx.user.id,
        type: input.type,
        measurement: input.measurement,
        date: input.date,
      })
      .select()
      .single();

    if (error) {
      console.error("Error logging measurement:", error);
      throw new Error("Failed to log body measurement");
    }

    return {
      id: data.id,
      type: data.type,
      measurement: data.measurement,
      date: data.date,
      userId: data.user_id,
    };
  });

export default measurementLogProcedure;
