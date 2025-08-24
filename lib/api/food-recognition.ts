
import { LogMealAPI } from './logmeal';
import { EdamamAPI } from './edamam';
import { FoodItem, BarcodeProduct } from '@/types/nutrition';
import { getSecurityHeaders, sanitizeInput } from '@/lib/security';

/**
 * Unified API service that integrates LogMeal and Edamam APIs
 * with robust error handling and fallback mechanisms
 */
export class FoodRecognitionService {
  /**
   * Analyze food from image using LogMeal API with fallback to general AI
   */
  static async analyzeFoodImage(imageBase64: string): Promise<Omit<FoodItem, 'id'>> {
    console.log('Starting food image analysis...');
    
    try {
      // Try LogMeal API first for professional food recognition
      console.log('Attempting LogMeal API...');
      const logMealResult = await LogMealAPI.analyzeFood(imageBase64);
      console.log('LogMeal API success:', logMealResult);
      return logMealResult;
    } catch (logMealError) {
      console.log('LogMeal API failed, trying fallback AI:', logMealError);
      
      try {
        // Fallback to general AI API
        const aiResult = await this.fallbackAIAnalysis(imageBase64);
        console.log('Fallback AI success:', aiResult);
        return aiResult;
      } catch (aiError) {
        console.error('All food recognition methods failed:', aiError);
        throw new Error('Unable to analyze food image. Please try again or add manually.');
      }
    }
  }

  /**
   * Search for food by barcode using Edamam API
   */
  static async searchByBarcode(barcode: string): Promise<BarcodeProduct | null> {
    console.log('Searching for barcode:', barcode);
    
    try {
      const product = await EdamamAPI.searchByBarcode(barcode);
      if (product) {
        console.log('Barcode found:', product);
        return product;
      }
      
      console.log('No product found for barcode');
      return null;
    } catch (error) {
      console.error('Barcode search failed:', error);
      throw error;
    }
  }

  /**
   * Search for food by text query using multiple sources
   */
  static async searchFoodByText(query: string, limit: number = 10): Promise<{
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
    source: 'edamam' | 'custom';
  }[]> {
    console.log('Searching for food by text:', query);
    
    try {
      const results = await EdamamAPI.searchByText(query, limit);
      return results.map(result => ({
        ...result,
        source: 'edamam' as const,
      }));
    } catch (error) {
      console.error('Text search failed:', error);
      return [];
    }
  }

  /**
   * Get detailed nutrition information for a specific food
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
    console.log('Getting food details for ID:', foodId);
    
    try {
      return await EdamamAPI.getFoodDetails(foodId);
    } catch (error) {
      console.error('Failed to get food details:', error);
      return null;
    }
  }

  /**
   * Analyze recipe nutrition using Edamam API
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
    console.log('Analyzing recipe with ingredients:', ingredients);
    
    try {
      return await EdamamAPI.analyzeRecipe(ingredients);
    } catch (error) {
      console.error('Recipe analysis failed:', error);
      throw error;
    }
  }

  /**
   * Fallback AI analysis using general AI API
   */
  private static async fallbackAIAnalysis(imageBase64: string): Promise<Omit<FoodItem, 'id'>> {
    const response = await fetch('https://toolkit.rork.com/text/llm/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getSecurityHeaders(),
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are a highly accurate nutrition expert AI specializing in food recognition and portion estimation. Analyze food images with precision and provide detailed nutritional information. If multiple food items are visible, focus on the main/largest item. Return a JSON object with: name (descriptive food name), estimatedWeight (in grams, be precise with portion size), calories, protein, carbs, fat, fiber, sugar, sodium. Consider cooking methods, ingredients, and realistic portion sizes. Be conservative with estimates rather than overestimating.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this food image carefully. Identify the main food item and estimate its nutritional content based on the visible portion size. Consider the cooking method, ingredients, and realistic serving size. Provide accurate nutritional data in JSON format.'
              },
              {
                type: 'image',
                image: imageBase64
              }
            ]
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status} ${response.statusText}`);
    }

    const aiResult = await response.json();
    
    let foodData;
    try {
      foodData = JSON.parse(aiResult.completion);
    } catch {
      throw new Error('AI returned invalid JSON response');
    }

    return {
      name: sanitizeInput(foodData.name || 'AI Scanned Food'),
      brand: 'AI Detected',
      servingSize: foodData.estimatedWeight || 100,
      servingUnit: 'g',
      calories: Math.round(foodData.calories || 200),
      protein: Math.round(foodData.protein || 10),
      carbs: Math.round(foodData.carbs || 20),
      fat: Math.round(foodData.fat || 8),
      fiber: Math.round(foodData.fiber || 3),
      sugar: Math.round(foodData.sugar || 5),
      sodium: Math.round(foodData.sodium || 300),
    };
  }

  /**
   * Validate API configuration
   */
  static validateConfiguration(): {
    logMeal: boolean;
    edamam: boolean;
    fallbackAI: boolean;
  } {
    return {
      logMeal: !!process.env.LOGMEAL_API_KEY,
      edamam: !!(process.env.EDAMAM_APP_ID && process.env.EDAMAM_APP_KEY),
      fallbackAI: true, // Always available
    };
  }

  /**
   * Get API status and health check
   */
  static async getAPIStatus(): Promise<{
    logMeal: 'available' | 'unavailable' | 'error';
    edamam: 'available' | 'unavailable' | 'error';
    fallbackAI: 'available' | 'unavailable' | 'error';
  }> {
    let logMealStatus: 'available' | 'unavailable' | 'error' = 'unavailable';
    let edamamStatus: 'available' | 'unavailable' | 'error' = 'unavailable';
    const fallbackAIStatus: 'available' | 'unavailable' | 'error' = 'available';

    // Check LogMeal API
    try {
      if (process.env.LOGMEAL_API_KEY) {
        // Simple health check - you could implement a ping endpoint
        logMealStatus = 'available';
      }
    } catch {
      logMealStatus = 'error';
    }

    // Check Edamam API
    try {
      if (process.env.EDAMAM_APP_ID && process.env.EDAMAM_APP_KEY) {
        // Simple health check
        edamamStatus = 'available';
      }
    } catch {
      edamamStatus = 'error';
    }

    return {
      logMeal: logMealStatus,
      edamam: edamamStatus,
      fallbackAI: fallbackAIStatus,
    };
  }

  /**
   * Enhanced error handling with user-friendly messages
   */
  static handleAPIError(error: any, context: string): string {
    console.error(`${context} error:`, error);

    if (error?.message?.includes('API key')) {
      return 'API configuration error. Please check your settings.';
    }

    if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      return 'Network error. Please check your internet connection and try again.';
    }

    if (error?.message?.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }

    if (error?.message?.includes('rate limit')) {
      return 'Too many requests. Please wait a moment and try again.';
    }

    if (error?.message?.includes('not found')) {
      return 'No results found. Try a different search or add the item manually.';
    }

    return 'An unexpected error occurred. Please try again or add the item manually.';
  }

  /**
   * Batch process multiple food items
   */
  static async batchAnalyze(items: { type: 'image' | 'barcode' | 'text'; data: string }[]): Promise<{
    success: (Omit<FoodItem, 'id'> | BarcodeProduct)[];
    errors: { index: number; error: string }[];
  }> {
    const success: (Omit<FoodItem, 'id'> | BarcodeProduct)[] = [];
    const errors: { index: number; error: string }[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      try {
        let result;
        
        switch (item.type) {
          case 'image':
            result = await this.analyzeFoodImage(item.data);
            break;
          case 'barcode':
            result = await this.searchByBarcode(item.data);
            if (!result) {
              throw new Error('Product not found');
            }
            break;
          case 'text':
            const textResults = await this.searchFoodByText(item.data, 1);
            if (textResults.length === 0) {
              throw new Error('No results found');
            }
            result = {
              name: textResults[0].name,
              brand: textResults[0].brand,
              servingSize: textResults[0].servingSize,
              servingUnit: textResults[0].servingUnit,
              calories: textResults[0].nutrients.calories,
              protein: textResults[0].nutrients.protein,
              carbs: textResults[0].nutrients.carbs,
              fat: textResults[0].nutrients.fat,
              fiber: textResults[0].nutrients.fiber,
              sugar: textResults[0].nutrients.sugar,
              sodium: textResults[0].nutrients.sodium,
            };
            break;
          default:
            throw new Error('Invalid item type');
        }
        
        success.push(result);
      } catch (error) {
        errors.push({
          index: i,
          error: this.handleAPIError(error, `Batch item ${i}`),
        });
      }
    }

    return { success, errors };
  }
}

export default FoodRecognitionService;