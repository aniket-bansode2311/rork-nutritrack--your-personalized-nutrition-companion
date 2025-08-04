import { UserProfile } from '@/types/nutrition';

export const mockUserProfile: UserProfile = {
  id: '1',
  name: 'John Doe',
  weight: 75, // kg
  height: 175, // cm
  age: 30,
  gender: 'male',
  activityLevel: 'moderate',
  goal: 'lose',
  nutritionGoals: {
    calories: 2200,
    protein: 165, // g
    carbs: 220, // g
    fat: 73, // g
  },
};