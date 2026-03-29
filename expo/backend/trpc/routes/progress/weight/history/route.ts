import { z } from "zod";
import { protectedProcedure, type Context } from "../../../../create-context";

export const weightHistoryProcedure = protectedProcedure
  .input(
    z.object({
      period: z.enum(["week", "month", "quarter", "year"]).default("month"),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
  )
  .query(async ({ input, ctx }: { input: { period: "week" | "month" | "quarter" | "year"; startDate?: string; endDate?: string }; ctx: Context & { user: NonNullable<Context['user']> } }) => {
    console.log("Fetching weight history:", input);
    
    let query = ctx.supabase
      .from("weight_entries")
      .select("*")
      .eq("user_id", ctx.user.id)
      .order("date", { ascending: true });

    if (input.startDate) {
      query = query.gte("date", input.startDate);
    }
    if (input.endDate) {
      query = query.lte("date", input.endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching weight history:", error);
      throw new Error("Failed to fetch weight history");
    }

    return data.map((entry: any) => ({
      id: entry.id,
      weight: entry.weight,
      date: entry.date,
      userId: entry.user_id,
    }));
  });

export default weightHistoryProcedure;
