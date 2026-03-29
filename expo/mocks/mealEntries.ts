import { MealEntry } from '@/types/nutrition';
import { mockFoodItems } from './foodItems';

// Get today's date as ISO string (YYYY-MM-DD)
const today = new Date().toISOString().split('T')[0];

export const mockMealEntries: MealEntry[] = [
  {
    id: '1',
    foodItem: mockFoodItems[5], // Greek Yogurt
    servings: 1.5,
    mealType: 'breakfast',
    date: today,
  },
  {
    id: '2',
    foodItem: mockFoodItems[7], // Banana
    servings: 1,
    mealType: 'breakfast',
    date: today,
  },
  {
    id: '3',
    foodItem: mockFoodItems[1], // Chicken Breast
    servings: 1.5,
    mealType: 'lunch',
    date: today,
  },
  {
    id: '4',
    foodItem: mockFoodItems[2], // Brown Rice
    servings: 1,
    mealType: 'lunch',
    date: today,
  },
  {
    id: '5',
    foodItem: mockFoodItems[6], // Spinach
    servings: 1,
    mealType: 'lunch',
    date: today,
  },
  {
    id: '6',
    foodItem: mockFoodItems[3], // Salmon
    servings: 1,
    mealType: 'dinner',
    date: today,
  },
  {
    id: '7',
    foodItem: mockFoodItems[4], // Avocado
    servings: 0.5,
    mealType: 'dinner',
    date: today,
  },
  {
    id: '8',
    foodItem: mockFoodItems[0], // Apple
    servings: 1,
    mealType: 'snack',
    date: today,
  },
];