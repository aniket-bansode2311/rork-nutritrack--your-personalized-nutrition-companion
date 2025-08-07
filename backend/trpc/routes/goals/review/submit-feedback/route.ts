import { z } from "zod";
import { protectedProcedure } from "../../../../create-context";

const submitFeedbackSchema = z.object({
  reviewId: z.string().optional(),
  period: z.enum(["week", "month", "quarter"]),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }),
  feedback: z.object({
    overall_satisfaction: z.number().min(1).max(5),
    goal_difficulty: z.enum(["too_easy", "just_right", "too_hard"]),
    motivation_level: z.number().min(1).max(5),
    challenges: z.array(z.enum([
      "time_management",
      "meal_planning",
      "portion_control",
      "food_tracking",
      "social_situations",
      "cravings",
      "exercise",
      "stress",
      "budget",
      "other"
    ])),
    successes: z.array(z.enum([
      "consistent_tracking",
      "meal_prep",
      "portion_control",
      "exercise_routine",
      "hydration",
      "sleep_schedule",
      "stress_management",
      "social_support",
      "goal_achievement",
      "other"
    ])),
    comments: z.string().optional(),
    goal_adjustments_requested: z.boolean().default(false),
    new_goal_preferences: z.object({
      calories: z.number().optional(),
      protein: z.number().optional(),
      carbs: z.number().optional(),
      fat: z.number().optional(),
    }).optional(),
  }),
});

export default protectedProcedure
  .input(submitFeedbackSchema)
  .mutation(async ({ input, ctx }) => {
    const { period, dateRange, feedback } = input;
    
    // Store feedback in database
    const { data: feedbackEntry, error: feedbackError } = await ctx.supabase
      .from('goal_reviews')
      .insert({
        user_id: ctx.user.id,
        period,
        start_date: dateRange.start,
        end_date: dateRange.end,
        overall_satisfaction: feedback.overall_satisfaction,
        goal_difficulty: feedback.goal_difficulty,
        motivation_level: feedback.motivation_level,
        challenges: feedback.challenges,
        successes: feedback.successes,
        comments: feedback.comments,
        goal_adjustments_requested: feedback.goal_adjustments_requested,
        new_goal_preferences: feedback.new_goal_preferences,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (feedbackError) {
      throw new Error(`Failed to submit feedback: ${feedbackError.message}`);
    }

    // If goal adjustments are requested, update the user's goals
    if (feedback.goal_adjustments_requested && feedback.new_goal_preferences) {
      const updateData: any = {};
      
      if (feedback.new_goal_preferences.calories) {
        updateData.calories_goal = feedback.new_goal_preferences.calories;
      }
      if (feedback.new_goal_preferences.protein) {
        updateData.protein_goal = feedback.new_goal_preferences.protein;
      }
      if (feedback.new_goal_preferences.carbs) {
        updateData.carbs_goal = feedback.new_goal_preferences.carbs;
      }
      if (feedback.new_goal_preferences.fat) {
        updateData.fat_goal = feedback.new_goal_preferences.fat;
      }

      if (Object.keys(updateData).length > 0) {
        updateData.goals_updated_at = new Date().toISOString();
        
        const { error: updateError } = await ctx.supabase
          .from('profiles')
          .update(updateData)
          .eq('id', ctx.user.id);

        if (updateError) {
          console.error('Failed to update goals:', updateError);
          // Don't throw error here, feedback was still saved successfully
        }
      }
    }

    // Generate personalized response based on feedback
    let responseMessage = "Thank you for your feedback! ";
    
    if (feedback.overall_satisfaction >= 4) {
      responseMessage += "We're glad you're satisfied with your progress. Keep up the great work!";
    } else if (feedback.overall_satisfaction <= 2) {
      responseMessage += "We understand this period was challenging. Let's work together to make adjustments that better suit your lifestyle.";
    } else {
      responseMessage += "We appreciate your honest feedback. We'll use this to help improve your experience.";
    }

    if (feedback.goal_difficulty === "too_hard") {
      responseMessage += " We've noted that your goals may be too ambitious. Consider making smaller, more manageable changes.";
    } else if (feedback.goal_difficulty === "too_easy") {
      responseMessage += " It sounds like you're ready for a bigger challenge! Let's set more ambitious targets.";
    }

    // Generate actionable insights based on challenges
    const actionableInsights = [];
    
    if (feedback.challenges.includes("time_management")) {
      actionableInsights.push({
        challenge: "time_management",
        insight: "Try meal prepping on weekends and using quick, healthy recipes during busy weekdays.",
        resources: ["15-minute meal recipes", "Weekend meal prep guide", "Time-saving kitchen tools"],
      });
    }

    if (feedback.challenges.includes("food_tracking")) {
      actionableInsights.push({
        challenge: "food_tracking",
        insight: "Set up daily reminders and try taking photos of your meals as a backup tracking method.",
        resources: ["Food tracking tips", "Best nutrition apps", "Quick logging techniques"],
      });
    }

    if (feedback.challenges.includes("cravings")) {
      actionableInsights.push({
        challenge: "cravings",
        insight: "Stock up on healthy alternatives and practice mindful eating techniques when cravings hit.",
        resources: ["Healthy snack alternatives", "Mindful eating guide", "Craving management strategies"],
      });
    }

    return {
      success: true,
      feedbackId: feedbackEntry.id,
      message: responseMessage,
      goalsUpdated: feedback.goal_adjustments_requested,
      actionableInsights,
      nextSteps: [
        "Review your updated goals in the Goals section",
        "Check out the recommended resources",
        "Schedule your next review for continued progress tracking",
      ],
    };
  });