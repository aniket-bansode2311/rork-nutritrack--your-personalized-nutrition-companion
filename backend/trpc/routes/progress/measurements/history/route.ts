import { z } from "zod";
import { protectedProcedure } from "../../../../create-context";

export const measurementHistoryProcedure = protectedProcedure
  .input(
    z.object({
      type: z.enum(["waist", "chest", "hips", "arms", "thighs", "neck"]).optional(),
      period: z.enum(["week", "month", "quarter", "year"]).default("month"),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
  )
  .query(async ({ input, ctx }: { input: { type?: "waist" | "chest" | "hips" | "arms" | "thighs" | "neck"; period: "week" | "month" | "quarter" | "year"; startDate?: string; endDate?: string }; ctx: any }) => {
    console.log("Fetching measurement history:", input);
    
    let query = ctx.supabase
      .from("body_measurements")
      .select("*")
      .eq("user_id", ctx.user.id)
      .order("date", { ascending: true });

    if (input.type) {
      query = query.eq("type", input.type);
    }
    if (input.startDate) {
      query = query.gte("date", input.startDate);
    }
    if (input.endDate) {
      query = query.lte("date", input.endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching measurement history:", error);
      throw new Error("Failed to fetch measurement history");
    }

    return data.map((entry: any) => ({
      id: entry.id,
      type: entry.type,
      measurement: entry.measurement,
      date: entry.date,
      userId: entry.user_id,
    }));
  });

export default measurementHistoryProcedure;
