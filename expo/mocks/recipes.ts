import { Recipe } from '@/types/nutrition';
import { mockFoodItems } from './foodItems';

export const mockRecipes: Recipe[] = [
  {
    id: 'recipe-1',
    name: 'Chicken and Rice Bowl',
    description: 'A healthy and balanced meal with grilled chicken breast, brown rice, and steamed vegetables.',
    servings: 2,
    prepTime: 15,
    cookTime: 25,
    difficulty: 'easy',
    category: 'Main Course',
    tags: ['healthy', 'protein-rich', 'gluten-free'],
    ingredients: [
      {
        id: 'ing-1',
        foodItem: mockFoodItems.find(f => f.name === 'Chicken Breast')!,
        quantity: 200,
        unit: 'g'
      },
      {
        id: 'ing-2',
        foodItem: mockFoodItems.find(f => f.name === 'Brown Rice')!,
        quantity: 150,
        unit: 'g'
      },
      {
        id: 'ing-3',
        foodItem: mockFoodItems.find(f => f.name === 'Spinach')!,
        quantity: 100,
        unit: 'g'
      }
    ],
    instructions: [
      'Season chicken breast with salt and pepper',
      'Grill chicken for 6-7 minutes per side until cooked through',
      'Cook brown rice according to package instructions',
      'Steam spinach for 2-3 minutes until wilted',
      'Slice chicken and serve over rice with spinach'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    nutritionPerServing: {
      calories: 389,
      protein: 34.45,
      carbs: 35.25,
      fat: 5.25,
      fiber: 2.5,
      sodium: 79.5
    }
  },
  {
    id: 'recipe-2',
    name: 'Greek Yogurt Parfait',
    description: 'A delicious and nutritious breakfast parfait with Greek yogurt, banana, and oats.',
    servings: 1,
    prepTime: 5,
    cookTime: 0,
    difficulty: 'easy',
    category: 'Breakfast',
    tags: ['quick', 'healthy', 'vegetarian', 'high-protein'],
    ingredients: [
      {
        id: 'ing-4',
        foodItem: mockFoodItems.find(f => f.name === 'Greek Yogurt')!,
        quantity: 150,
        unit: 'g'
      },
      {
        id: 'ing-5',
        foodItem: mockFoodItems.find(f => f.name === 'Banana')!,
        quantity: 100,
        unit: 'g'
      },
      {
        id: 'ing-6',
        foodItem: mockFoodItems.find(f => f.name === 'Oatmeal')!,
        quantity: 30,
        unit: 'g'
      }
    ],
    instructions: [
      'Layer half the Greek yogurt in a bowl or glass',
      'Add sliced banana',
      'Sprinkle oats over banana',
      'Top with remaining yogurt',
      'Garnish with additional banana slices if desired'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-10T08:00:00Z',
    nutritionPerServing: {
      calories: 237.4,
      protein: 16.6,
      carbs: 37.4,
      fat: 3.02,
      fiber: 4.18,
      sodium: 0
    }
  },
  {
    id: 'recipe-3',
    name: 'Salmon Avocado Salad',
    description: 'Fresh and healthy salad with grilled salmon, avocado, and mixed greens.',
    servings: 1,
    prepTime: 10,
    cookTime: 8,
    difficulty: 'medium',
    category: 'Salad',
    tags: ['healthy', 'omega-3', 'low-carb', 'keto-friendly'],
    ingredients: [
      {
        id: 'ing-7',
        foodItem: mockFoodItems.find(f => f.name === 'Salmon')!,
        quantity: 120,
        unit: 'g'
      },
      {
        id: 'ing-8',
        foodItem: mockFoodItems.find(f => f.name === 'Avocado')!,
        quantity: 80,
        unit: 'g'
      },
      {
        id: 'ing-9',
        foodItem: mockFoodItems.find(f => f.name === 'Spinach')!,
        quantity: 50,
        unit: 'g'
      }
    ],
    instructions: [
      'Season salmon with salt, pepper, and lemon juice',
      'Grill salmon for 3-4 minutes per side',
      'Wash and prepare spinach leaves',
      'Slice avocado',
      'Arrange spinach on plate, top with sliced avocado and flaked salmon',
      'Drizzle with olive oil and lemon juice'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
    createdAt: '2024-01-12T12:30:00Z',
    updatedAt: '2024-01-12T12:30:00Z',
    nutritionPerServing: {
      calories: 389.36,
      protein: 25.45,
      carbs: 4.6,
      fat: 27.36,
      fiber: 6.46,
      sodium: 85.2
    }
  }
];