import { z } from 'zod';
import { protectedProcedure } from '../../create-context';

export const goalAdjustmentHistoryProcedure = protectedProcedure
  .input(
    z.object({
      limit: z.number().min(1).max(50).default(20),
      offset: z.number().min(0).default(0),
    })
  )
  .query(async ({ input, ctx }) => {
    const { limit, offset } = input;
    const userId = ctx.user.id;

    const { data: adjustmentHistory, error } = await ctx.supabase
      .from('goal_adjustment_history')
      .select('*')
      .eq('user_id', userId)
      .order('adjustment_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch adjustment history: ${error.message}`);
    }

    // Transform the data to match our TypeScript interface
    const formattedHistory = adjustmentHistory?.map((entry: any) => ({
      id: entry.id,
      userId: entry.user_id,
      adjustmentDate: entry.adjustment_date,
      previousGoals: entry.previous_goals,
      newGoals: entry.new_goals,
      reason: entry.reason,
      source: entry.source,
      effectiveness: entry.effectiveness,
    })) || [];

    return {
      history: formattedHistory,
      total: adjustmentHistory?.length || 0,
      hasMore: (adjustmentHistory?.length || 0) === limit,
    };
  });