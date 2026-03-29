import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

const updateProfileSchema = z.object({
  name: z.string().optional(),
  weight: z.number().optional(),
  height: z.number().optional(),
  age: z.number().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very active']).optional(),
  goal: z.enum(['lose', 'maintain', 'gain']).optional(),
  calories_goal: z.number().optional(),
  protein_goal: z.number().optional(),
  carbs_goal: z.number().optional(),
  fat_goal: z.number().optional(),
  dietary_preferences: z.any().optional(),
  notification_settings: z.any().optional(),
  privacy_settings: z.any().optional(),
  health_integrations: z.any().optional(),
});

export default protectedProcedure
  .input(updateProfileSchema)
  .mutation(async ({ input, ctx }) => {
    // First try to update the existing profile
    const { data: profile, error } = await ctx.supabase
      .from('profiles')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', ctx.user.id)
      .select()
      .single();

    if (error) {
      // If no profile exists (PGRST116), create one with the update data
      if (error.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await ctx.supabase
          .from('profiles')
          .insert({
            id: ctx.user.id,
            email: ctx.user.email!,
            ...input,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) {
          throw new Error(`Failed to create profile: ${createError.message}`);
        }

        return newProfile;
      }
      
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    return profile;
  });