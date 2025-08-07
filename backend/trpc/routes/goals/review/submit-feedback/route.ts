import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';

export const submitGoalFeedbackProcedure = protectedProcedure
  .input(
    z.object({
      reviewId: z.string(),
      feedback: z.object({
        energyLevel: z.enum(['low', 'normal', 'high']),
        hungerLevel: z.enum(['always_hungry', 'satisfied', 'rarely_hungry']),
        workoutPerformance: z.enum(['declining', 'stable', 'improving']),
        sleepQuality: z.enum(['poor', 'fair', 'good', 'excellent']),
        stressLevel: z.enum(['low', 'moderate', 'high']),
        goalSatisfaction: z.number().min(1).max(10),
        additionalNotes: z.string().optional(),
      }),
      action: z.enum(['accept', 'reject', 'modify']),
      modifiedGoals: z.object({
        calories: z.number(),
        protein: z.number(),
        carbs: z.number(),
        fat: z.number(),
      }).optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const { reviewId, feedback, action, modifiedGoals } = input;
    const userId = ctx.user.id;

    // Store the feedback and decision
    const { data: goalReviewFeedback, error } = await ctx.supabase
      .from('goal_review_feedback')
      .insert({
        review_id: reviewId,
        user_id: userId,
        energy_level: feedback.energyLevel,
        hunger_level: feedback.hungerLevel,
        workout_performance: feedback.workoutPerformance,
        sleep_quality: feedback.sleepQuality,
        stress_level: feedback.stressLevel,
        goal_satisfaction: feedback.goalSatisfaction,
        additional_notes: feedback.additionalNotes,
        action,
        modified_goals: modifiedGoals,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to submit feedback: ${error.message}`);
    }

    // If user accepted or modified goals, update their profile
    if (action === 'accept' || (action === 'modify' && modifiedGoals)) {
      const goalsToApply = action === 'accept' 
        ? await getReviewSuggestedGoals(reviewId, ctx)
        : modifiedGoals!;

      const { error: updateError } = await ctx.supabase
        .from('profiles')
        .update({
          calorie_goal: goalsToApply.calories,
          protein_goal: goalsToApply.protein,
          carbs_goal: goalsToApply.carbs,
          fat_goal: goalsToApply.fat,
          goals_last_updated: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        throw new Error(`Failed to update goals: ${updateError.message}`);
      }

      // Log the goal adjustment history
      await ctx.supabase
        .from('goal_adjustment_history')
        .insert({
          user_id: userId,
          adjustment_date: new Date().toISOString(),
          previous_goals: await getCurrentGoals(userId, ctx),
          new_goals: goalsToApply,
          reason: `Goal review ${action}ed with user feedback`,
          source: action === 'accept' ? 'system_recommendation' : 'user_request',
        });
    }

    return {
      success: true,
      message: `Goal review ${action}ed successfully`,
      appliedGoals: action !== 'reject' ? (modifiedGoals || await getReviewSuggestedGoals(reviewId, ctx)) : null,
    };
  });

async function getCurrentGoals(userId: string, ctx: any) {
  const { data: profile } = await ctx.supabase
    .from('profiles')
    .select('calorie_goal, protein_goal, carbs_goal, fat_goal')
    .eq('id', userId)
    .single();

  return {
    calories: profile?.calorie_goal || 2000,
    protein: profile?.protein_goal || 150,
    carbs: profile?.carbs_goal || 200,
    fat: profile?.fat_goal || 65,
  };
}

async function getReviewSuggestedGoals(reviewId: string, ctx: any) {
  // In a real implementation, you'd fetch this from stored review data
  // For now, we'll return a placeholder
  return {
    calories: 1900,
    protein: 160,
    carbs: 190,
    fat: 60,
  };
}