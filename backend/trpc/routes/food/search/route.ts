import { z } from "zod";
import { publicProcedure } from "../../../create-context";

// Basic food database - in a real app, this would be a proper food database
const BASIC_FOODS = [
  {
    id: 'apple',
    name: 'Apple',
    serving_size: 100,
    serving_unit: 'g',
    calories: 52,
    protein: 0.3,
    carbs: 14,
    fat: 0.2,
    fiber: 2.4,
    sugar: 10.3,
  },
  {
    id: 'chicken-breast',
    name: 'Chicken Breast',
    serving_size: 100,
    serving_unit: 'g',
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    sodium: 74,
  },
  {
    id: 'brown-rice',
    name: 'Brown Rice',
    serving_size: 100,
    serving_unit: 'g',
    calories: 112,
    protein: 2.6,
    carbs: 23.5,
    fat: 0.9,
    fiber: 1.8,
    sodium: 5,
  },
  {
    id: 'salmon',
    name: 'Salmon',
    serving_size: 100,
    serving_unit: 'g',
    calories: 208,
    protein: 20,
    carbs: 0,
    fat: 13,
    sodium: 59,
  },
  {
    id: 'avocado',
    name: 'Avocado',
    serving_size: 100,
    serving_unit: 'g',
    calories: 160,
    protein: 2,
    carbs: 8.5,
    fat: 14.7,
    fiber: 6.7,
  },
  {
    id: 'greek-yogurt',
    name: 'Greek Yogurt',
    brand: 'Fage',
    serving_size: 100,
    serving_unit: 'g',
    calories: 59,
    protein: 10.2,
    carbs: 3.6,
    fat: 0.4,
  },
  {
    id: 'spinach',
    name: 'Spinach',
    serving_size: 100,
    serving_unit: 'g',
    calories: 23,
    protein: 2.9,
    carbs: 3.6,
    fat: 0.4,
    fiber: 2.2,
  },
  {
    id: 'banana',
    name: 'Banana',
    serving_size: 100,
    serving_unit: 'g',
    calories: 89,
    protein: 1.1,
    carbs: 22.8,
    fat: 0.3,
    fiber: 2.6,
  },
  {
    id: 'egg',
    name: 'Egg',
    serving_size: 50,
    serving_unit: 'g',
    calories: 78,
    protein: 6.3,
    carbs: 0.6,
    fat: 5.3,
  },
  {
    id: 'oatmeal',
    name: 'Oatmeal',
    serving_size: 100,
    serving_unit: 'g',
    calories: 68,
    protein: 2.4,
    carbs: 12,
    fat: 1.4,
    fiber: 1.7,
  },
];

const searchFoodSchema = z.object({
  query: z.string().min(1),
  limit: z.number().optional().default(10),
});

export default publicProcedure
  .input(searchFoodSchema)
  .query(async ({ input }) => {
    const { query, limit } = input;
    const lowerQuery = query.toLowerCase().trim();
    
    const results = BASIC_FOODS
      .filter(food => 
        food.name.toLowerCase().includes(lowerQuery) ||
        (food.brand && food.brand.toLowerCase().includes(lowerQuery))
      )
      .slice(0, limit);
    
    return results;
  });