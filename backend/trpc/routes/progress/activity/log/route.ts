import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

export const activityLogProcedure = protectedProcedure
  .input(
    z.object({
      type: z.string(),
      duration: z.number().positive(),
      caloriesBurned: z.number().optional(),
      distance: z.number().optional(),
      intensity: z.enum(["low", "moderate", "high"]).optional(),
      timestamp: z.string(),
    })
  )
  .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
    console.log("Logging activity entry:", input);
    
    const { data, error } = await ctx.supabase
      .from("activity_entries")
      .insert({
        user_id: ctx.user.id,
        type: input.type,
        duration: input.duration,
        calories_burned: input.caloriesBurned,
        distance: input.distance,
        intensity: input.intensity,
        timestamp: input.timestamp,
      })
      .select()
      .single();

    if (error) {
      console.error("Error logging activity:", error);
      throw new Error("Failed to log activity entry");
    }

    return {
      id: data.id,
      type: data.type,
      duration: data.duration,
      caloriesBurned: data.calories_burned,
      distance: data.distance,
      intensity: data.intensity,
      timestamp: data.timestamp,
      userId: data.user_id,
    };
  });

export default activityLogProcedure;