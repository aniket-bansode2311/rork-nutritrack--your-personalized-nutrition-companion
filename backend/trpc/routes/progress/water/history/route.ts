import { z } from "zod";
import { protectedProcedure } from "../../../../create-context";

export const waterHistoryProcedure = protectedProcedure
  .input(
    z.object({
      period: z.enum(["day", "week", "month"]).default("week"),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
  )
  .query(async ({ input, ctx }: { input: { period: "day" | "week" | "month"; startDate?: string; endDate?: string }; ctx: any }) => {
    console.log("Fetching water history:", input);
    
    let query = ctx.supabase
      .from("water_entries")
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
      console.error("Error fetching water history:", error);
      throw new Error("Failed to fetch water history");
    }

    return data.map((entry: any) => ({
      id: entry.id,
      amount: entry.amount,
      timestamp: entry.timestamp,
      userId: entry.user_id,
    }));
  });

export default waterHistoryProcedure;
