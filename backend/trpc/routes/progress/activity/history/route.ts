import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

export const activityHistoryProcedure = protectedProcedure
  .input(
    z.object({
      period: z.enum(["week", "month", "quarter", "year"]).default("month"),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
  )
  .query(async ({ input, ctx }: { input: { period: "week" | "month" | "quarter" | "year"; startDate?: string; endDate?: string; }; ctx: any }) => {
    console.log("Fetching activity history:", input);
    
    let query = ctx.supabase
      .from("activity_entries")
      .select("*")
      .eq("user_id", ctx.user.id)
      .order("timestamp", { ascending: true });

    if (input.startDate) {
      query = query.gte("timestamp", input.startDate);
    }
    if (input.endDate) {
      query = query.lte("timestamp", input.endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching activity history:", error);
      throw new Error("Failed to fetch activity history");
    }

    return data.map((entry: any) => ({
      id: entry.id,
      type: entry.type,
      duration: entry.duration,
      caloriesBurned: entry.calories_burned,
      distance: entry.distance,
      intensity: entry.intensity,
      timestamp: entry.timestamp,
      userId: entry.user_id,
    }));
  });

export default activityHistoryProcedure;