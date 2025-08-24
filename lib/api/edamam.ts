import { getSecurityHeaders, sanitizeInput } from '@/lib/security';
import { BarcodeProduct } from '@/types/nutrition';

// Edamam API configuration
const EDAMAM_BASE_URL = 'https://api.edamam.com/api/food-database/v2';
const APP_ID = process.env.EDAMAM_APP_ID || '';
const APP_KEY = process.env.EDAMAM_APP_KEY || '';

interface EdamamFoodSearchResponse {
  text: string;
  parsed: {
    food: {
      foodId: string;
      label: string;
      brand?: string;
      nutrients: {
        ENERC_KCAL: number; // calories
        PROCNT: number; // protein
        CHOCDF: number; // carbs
        FAT: number; // fat
        FIBTG?: number; // fiber
        SUGAR?: number; // sugar
        NA?: number; // sodium
      };
      servingSizes?: {
        uri: string;
        label: string;
        quantity: number;
      }[];
    };
  }[];
  hints: {
    food: {
      foodId: string;
      label: string;
      brand?: string;
      nutrients: {
        ENERC_KCAL: number;
        PROCNT: number;
        CHOCDF: number;
        FAT: number;
        FIBTG?: number;
        SUGAR?: number;
        NA?: number;
      };
    };
    measures: {
      uri: string;
      label: string;
      weight: number;
    }[];
  }[];
}

interface EdamamBarcodeResponse {
  hints: {
    food: {
      foodId: string;
      label: string;
      brand?: string;
      nutrients: {
        ENERC_KCAL: number;
        PROCNT: number;
        CHOCDF: number;
        FAT: number;
        FIBTG?: number;
        SUGAR?: number;
        NA?: number;
      };
      servingSizes?: {
        uri: string;
        label: string;
        quantity: number;
      }[];
    };
    measures: {
      uri: string;
      label: string;
      weight: number;
    }[];
  }[];
}

interface EdamamError {
  error: string;
  message: string;
}

export class EdamamAPI {
  private static async makeRequest<T>(
    endpoint: string,
    params: Record<string, string> = {}
  ): Promise<T> {
    if (!APP_ID || !APP_KEY) {
      throw new Error('Edamam API credentials not configured');
    }

    const url = new URL(`${EDAMAM_BASE_URL}${endpoint}`);
    
    // Add authentication parameters
    url.searchParams.append('app_id', APP_ID);
    url.searchParams.append('app_key', APP_KEY);
    
    // Add other parameters
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    console.log('Making Edamam API request to:', url.toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...getSecurityHeaders(),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as EdamamError;
      throw new Error(
        errorData.message || 
        `Edamam API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Search for food items by barcode using Edamam API
   */
  static async searchByBarcode(barcode: string): Promise<BarcodeProduct | null> {
    try {
      console.log('Searching Edamam for barcode:', barcode);
      
      const response = await this.makeRequest<EdamamBarcodeResponse>('/parser', {
        upc: barcode,
      });

      console.log('Edamam barcode response:', response);

      if (!response.hints || response.hints.length === 0) {
        console.log('No products found for barcode:', barcode);
        return null;
      }

      // Get the first (most relevant) result
      const hint = response.hints[0];
      const food = hint.food;
      const nutrients = food.nutrients;

      // Find the best serving size (prefer 100g or first available)
      const servingSize = food.servingSizes?.find(s => s.label.includes('100')) || 
                         food.servingSizes?.[0] ||
                         hint.measures.find(m => m.weight === 100) ||
                         hint.measures[0];

      const weight = ('weight' in servingSize ? servingSize.weight : servingSize?.quantity) || 100;

      return {
        barcode,
        name: sanitizeInput(food.label),
        brand: food.brand ? sanitizeInput(food.brand) : undefined,
        servingSize: weight,
        servingUnit: 'g',
        calories: Math.round(nutrients.ENERC_KCAL || 0),
        protein: Math.round(nutrients.PROCNT || 0),
        carbs: Math.round(nutrients.CHOCDF || 0),
        fat: Math.round(nutrients.FAT || 0),
        fiber: Math.round(nutrients.FIBTG || 0),
        sugar: Math.round(nutrients.SUGAR || 0),
        sodium: Math.round(nutrients.NA || 0),
      };
    } catch (error) {
      console.error('Edamam barcode search error:', error);
      throw error;
    }
  }

  /**
   * Search for food items by text query using Edamam API
   */
  static async searchByText(query: string, limit: number = 10): Promise<{
    foodId: string;
    name: string;
    brand?: string;
    nutrients: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber?: number;
      sugar?: number;
      sodium?: number;
    };
    servingSize: number;
    servingUnit: string;
  }[]> {
    try {
      console.log('Searching Edamam for text:', query);
      
      const response = await this.makeRequest<EdamamFoodSearchResponse>('/parser', {
        ingr: sanitizeInput(query),
        'nutrition-type': 'cooking',
      });

      console.log('Edamam text search response:', response);

      const results: {
        foodId: string;
        name: string;
        brand?: string;
        nutrients: {
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          fiber?: number;
          sugar?: number;
          sodium?: number;
        };
        servingSize: number;
        servingUnit: string;
      }[] = [];

      // Process parsed results first (more accurate)
      if (response.parsed) {
        response.parsed.forEach(parsed => {
          const food = parsed.food;
          const nutrients = food.nutrients;
          
          results.push({
            foodId: food.foodId,
            name: sanitizeInput(food.label),
            brand: food.brand ? sanitizeInput(food.brand) : undefined,
            nutrients: {
              calories: Math.round(nutrients.ENERC_KCAL || 0),
              protein: Math.round(nutrients.PROCNT || 0),
              carbs: Math.round(nutrients.CHOCDF || 0),
              fat: Math.round(nutrients.FAT || 0),
              fiber: Math.round(nutrients.FIBTG || 0),
              sugar: Math.round(nutrients.SUGAR || 0),
              sodium: Math.round(nutrients.NA || 0),
            },
            servingSize: 100, // Default to 100g
            servingUnit: 'g',
          });
        });
      }

      // Process hints if we need more results
      if (response.hints && results.length < limit) {
        const remainingSlots = limit - results.length;
        
        response.hints.slice(0, remainingSlots).forEach(hint => {
          const food = hint.food;
          const nutrients = food.nutrients;
          
          // Skip if we already have this food
          if (results.some(r => r.foodId === food.foodId)) {
            return;
          }
          
          results.push({
            foodId: food.foodId,
            name: sanitizeInput(food.label),
            brand: food.brand ? sanitizeInput(food.brand) : undefined,
            nutrients: {
              calories: Math.round(nutrients.ENERC_KCAL || 0),
              protein: Math.round(nutrients.PROCNT || 0),
              carbs: Math.round(nutrients.CHOCDF || 0),
              fat: Math.round(nutrients.FAT || 0),
              fiber: Math.round(nutrients.FIBTG || 0),
              sugar: Math.round(nutrients.SUGAR || 0),
              sodium: Math.round(nutrients.NA || 0),
            },
            servingSize: 100, // Default to 100g
            servingUnit: 'g',
          });
        });
      }

      return results;
    } catch (error) {
      console.error('Edamam text search error:', error);
      throw error;
    }
  }

  /**
   * Get detailed nutrition information for a specific food ID
   */
  static async getFoodDetails(foodId: string): Promise<{
    foodId: string;
    name: string;
    brand?: string;
    nutrients: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber?: number;
      sugar?: number;
      sodium?: number;
    };
    servingSizes: {
      label: string;
      weight: number;
      unit: string;
    }[];
  } | null> {
    try {
      console.log('Getting Edamam food details for ID:', foodId);
      
      const response = await this.makeRequest<EdamamFoodSearchResponse>('/parser', {
        foodId: foodId,
      });

      console.log('Edamam food details response:', response);

      if (!response.hints || response.hints.length === 0) {
        return null;
      }

      const hint = response.hints[0];
      const food = hint.food;
      const nutrients = food.nutrients;

      return {
        foodId: food.foodId,
        name: sanitizeInput(food.label),
        brand: food.brand ? sanitizeInput(food.brand) : undefined,
        nutrients: {
          calories: Math.round(nutrients.ENERC_KCAL || 0),
          protein: Math.round(nutrients.PROCNT || 0),
          carbs: Math.round(nutrients.CHOCDF || 0),
          fat: Math.round(nutrients.FAT || 0),
          fiber: Math.round(nutrients.FIBTG || 0),
          sugar: Math.round(nutrients.SUGAR || 0),
          sodium: Math.round(nutrients.NA || 0),
        },
        servingSizes: hint.measures.map(measure => ({
          label: measure.label,
          weight: measure.weight,
          unit: 'g',
        })),
      };
    } catch (error) {
      console.error('Edamam food details error:', error);
      throw error;
    }
  }

  /**
   * Analyze nutrition for a recipe or meal
   */
  static async analyzeRecipe(ingredients: string[]): Promise<{
    totalNutrients: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber?: number;
      sugar?: number;
      sodium?: number;
    };
    ingredientBreakdown: {
      ingredient: string;
      nutrients: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
      };
    }[];
  }> {
    try {
      console.log('Analyzing recipe with Edamam:', ingredients);
      
      // For recipe analysis, we'd use the Nutrition Analysis API
      // This is a simplified version - in production you'd want to use the proper endpoint
      const results = await Promise.all(
        ingredients.map(async (ingredient) => {
          const searchResults = await this.searchByText(ingredient, 1);
          if (searchResults.length > 0) {
            const food = searchResults[0];
            return {
              ingredient: sanitizeInput(ingredient),
              nutrients: food.nutrients,
            };
          }
          return null;
        })
      );

      const validResults = results.filter(r => r !== null) as {
        ingredient: string;
        nutrients: {
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          fiber?: number;
          sugar?: number;
          sodium?: number;
        };
      }[];

      // Calculate totals
      const totalNutrients = validResults.reduce(
        (total, result) => ({
          calories: total.calories + result.nutrients.calories,
          protein: total.protein + result.nutrients.protein,
          carbs: total.carbs + result.nutrients.carbs,
          fat: total.fat + result.nutrients.fat,
          fiber: (total.fiber || 0) + (result.nutrients.fiber || 0),
          sugar: (total.sugar || 0) + (result.nutrients.sugar || 0),
          sodium: (total.sodium || 0) + (result.nutrients.sodium || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
      );

      return {
        totalNutrients,
        ingredientBreakdown: validResults.map(result => ({
          ingredient: result.ingredient,
          nutrients: {
            calories: result.nutrients.calories,
            protein: result.nutrients.protein,
            carbs: result.nutrients.carbs,
            fat: result.nutrients.fat,
          },
        })),
      };
    } catch (error) {
      console.error('Edamam recipe analysis error:', error);
      throw error;
    }
  }
}

export default EdamamAPI;