import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

const adjustmentHistorySchema = z.object({
  limit: z.number().min(1).max(50).default(10),
  offset: z.number().min(0).default(0),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export default protectedProcedure
  .input(adjustmentHistorySchema)
  .query(async ({ input, ctx }) => {
    const { limit, offset, startDate, endDate } = input;
    
    // Query goal adjustment history
    let query = ctx.supabase
      .from('goal_adjustments')
      .select(`
        *,
        goal_reviews (
          overall_satisfaction,
          goal_difficulty,
          motivation_level,
          challenges,
          successes
        )
      `)
      .eq('user_id', ctx.user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (offset > 0) {
      query = query.range(offset, offset + limit - 1);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: adjustments, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch adjustment history: ${error.message}`);
    }

    // Get total count for pagination
    let countQuery = ctx.supabase
      .from('goal_adjustments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', ctx.user.id);

    if (startDate) {
      countQuery = countQuery.gte('created_at', startDate);
    }

    if (endDate) {
      countQuery = countQuery.lte('created_at', endDate);
    }

    const { count } = await countQuery;

    // Transform data for better frontend consumption
    const transformedAdjustments = adjustments?.map(adjustment => ({
      id: adjustment.id,
      date: adjustment.created_at,
      reason: adjustment.reason,
      trigger: adjustment.trigger, // manual, automatic, review-based
      previousGoals: {
        calories: adjustment.previous_calories_goal,
        protein: adjustment.previous_protein_goal,
        carbs: adjustment.previous_carbs_goal,
        fat: adjustment.previous_fat_goal,
      },
      newGoals: {
        calories: adjustment.new_calories_goal,
        protein: adjustment.new_protein_goal,
        carbs: adjustment.new_carbs_goal,
        fat: adjustment.new_fat_goal,
      },
      changes: {
        calories: adjustment.new_calories_goal - adjustment.previous_calories_goal,
        protein: adjustment.new_protein_goal - adjustment.previous_protein_goal,
        carbs: adjustment.new_carbs_goal - adjustment.previous_carbs_goal,
        fat: adjustment.new_fat_goal - adjustment.previous_fat_goal,
      },
      percentageChanges: {
        calories: adjustment.previous_calories_goal > 0 
          ? ((adjustment.new_calories_goal - adjustment.previous_calories_goal) / adjustment.previous_calories_goal) * 100 
          : 0,
        protein: adjustment.previous_protein_goal > 0 
          ? ((adjustment.new_protein_goal - adjustment.previous_protein_goal) / adjustment.previous_protein_goal) * 100 
          : 0,
        carbs: adjustment.previous_carbs_goal > 0 
          ? ((adjustment.new_carbs_goal - adjustment.previous_carbs_goal) / adjustment.previous_carbs_goal) * 100 
          : 0,
        fat: adjustment.previous_fat_goal > 0 
          ? ((adjustment.new_fat_goal - adjustment.previous_fat_goal) / adjustment.previous_fat_goal) * 100 
          : 0,
      },
      associatedReview: adjustment.goal_reviews ? {
        satisfaction: adjustment.goal_reviews.overall_satisfaction,
        difficulty: adjustment.goal_reviews.goal_difficulty,
        motivation: adjustment.goal_reviews.motivation_level,
        challenges: adjustment.goal_reviews.challenges,
        successes: adjustment.goal_reviews.successes,
      } : null,
      metadata: {
        algorithm_version: adjustment.algorithm_version,
        confidence_score: adjustment.confidence_score,
        notes: adjustment.notes,
      },
    })) || [];

    // Calculate summary statistics
    const summary = {
      totalAdjustments: count || 0,
      averageCalorieChange: 0,
      averageProteinChange: 0,
      mostCommonReason: '',
      adjustmentFrequency: '', // weekly, monthly, etc.
    };

    if (transformedAdjustments.length > 0) {
      summary.averageCalorieChange = Math.round(
        transformedAdjustments.reduce((sum, adj) => sum + adj.changes.calories, 0) / transformedAdjustments.length
      );
      
      summary.averageProteinChange = Math.round(
        transformedAdjustments.reduce((sum, adj) => sum + adj.changes.protein, 0) / transformedAdjustments.length
      );

      // Find most common reason
      const reasonCounts = transformedAdjustments.reduce((acc, adj) => {
        acc[adj.reason] = (acc[adj.reason] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      summary.mostCommonReason = Object.entries(reasonCounts)
        .reduce((a, b) => reasonCounts[a[0]] > reasonCounts[b[0]] ? a : b)[0];

      // Calculate frequency
      if (transformedAdjustments.length > 1) {
        const firstDate = new Date(transformedAdjustments[transformedAdjustments.length - 1].date);
        const lastDate = new Date(transformedAdjustments[0].date);
        const daysBetween = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
        const avgDaysBetweenAdjustments = daysBetween / (transformedAdjustments.length - 1);
        
        if (avgDaysBetweenAdjustments <= 10) {
          summary.adjustmentFrequency = 'very_frequent';
        } else if (avgDaysBetweenAdjustments <= 30) {
          summary.adjustmentFrequency = 'frequent';
        } else if (avgDaysBetweenAdjustments <= 90) {
          summary.adjustmentFrequency = 'moderate';
        } else {
          summary.adjustmentFrequency = 'infrequent';
        }
      }
    }

    return {
      adjustments: transformedAdjustments,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0),
      },
      summary,
    };
  });