import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

const createProfileSchema = z.object({
  name: z.string(),
  weight: z.number(),
  height: z.number(),
  age: z.number(),
  gender: z.enum(['male', 'female', 'other']),
  activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very active']),
  goal: z.enum(['lose', 'maintain', 'gain']),
  calories_goal: z.number(),
  protein_goal: z.number(),
  carbs_goal: z.number(),
  fat_goal: z.number(),
  dietary_preferences: z.any().optional(),
  notification_settings: z.any().optional(),
  privacy_settings: z.any().optional(),
  health_integrations: z.any().optional(),
});

export default protectedProcedure
  .input(createProfileSchema)
  .mutation(async ({ input, ctx }) => {
    const { data: profile, error } = await ctx.supabase
      .from('profiles')
      .insert({
        id: ctx.user.id,
        email: ctx.user.email!,
        ...input,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create profile: ${error.message}`);
    }

    return profile;
  });