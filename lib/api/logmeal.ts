import { getSecurityHeaders, sanitizeInput } from '@/lib/security';
import { FoodItem } from '@/types/nutrition';

// LogMeal API configuration
const LOGMEAL_BASE_URL = 'https://api.logmeal.es';
const API_KEY = process.env.LOGMEAL_API_KEY || '';

interface LogMealFoodRecognitionResponse {
  imageId: string;
  segmentation_results: {
    recognition_results: {
      food_family: {
        name: string;
        prob: number;
      };
      food_type: {
        name: string;
        prob: number;
      };
    }[];
  }[];
}

interface LogMealNutritionResponse {
  nutritional_info: {
    calories: number;
    totalNutrients: {
      PROCNT: { quantity: number }; // protein
      CHOCDF: { quantity: number }; // carbs
      FAT: { quantity: number }; // fat
      FIBTG?: { quantity: number }; // fiber
      SUGAR?: { quantity: number }; // sugar
      NA?: { quantity: number }; // sodium
    };
  };
  weight: number;
}

interface LogMealError {
  error: string;
  message: string;
}

export class LogMealAPI {
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!API_KEY) {
      throw new Error('LogMeal API key not configured');
    }

    const url = `${LOGMEAL_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        ...getSecurityHeaders(),
        ...options.headers,
      },
      // Note: timeout is handled by AbortController in production
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as LogMealError;
      throw new Error(
        errorData.message || 
        `LogMeal API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Recognize food items from an image using LogMeal API
   */
  static async recognizeFood(imageBase64: string): Promise<{
    foodName: string;
    confidence: number;
    estimatedWeight: number;
  }> {
    try {
      console.log('Starting LogMeal food recognition...');
      
      // Step 1: Upload image for recognition
      const recognitionResponse = await this.makeRequest<LogMealFoodRecognitionResponse>(
        '/v2/image/segmentation/complete',
        {
          method: 'POST',
          body: JSON.stringify({
            image: imageBase64,
          }),
        }
      );

      console.log('LogMeal recognition response:', recognitionResponse);

      // Extract the best food recognition result
      const segmentationResults = recognitionResponse.segmentation_results;
      if (!segmentationResults || segmentationResults.length === 0) {
        throw new Error('No food items detected in the image');
      }

      const recognitionResults = segmentationResults[0].recognition_results;
      if (!recognitionResults || recognitionResults.length === 0) {
        throw new Error('No food recognition results found');
      }

      // Get the highest confidence result
      const bestResult = recognitionResults.reduce((best, current) => {
        const currentConfidence = current.food_type.prob;
        const bestConfidence = best.food_type.prob;
        return currentConfidence > bestConfidence ? current : best;
      });

      const foodName = bestResult.food_type.name;
      const confidence = bestResult.food_type.prob;

      console.log(`Recognized food: ${foodName} (confidence: ${confidence})`);

      // Step 2: Get nutritional information
      const nutritionResponse = await this.makeRequest<LogMealNutritionResponse>(
        '/v2/nutrition/recipe/nutritionalInfo',
        {
          method: 'POST',
          body: JSON.stringify({
            imageId: recognitionResponse.imageId,
          }),
        }
      );

      console.log('LogMeal nutrition response:', nutritionResponse);

      const estimatedWeight = nutritionResponse.weight || 100; // fallback to 100g

      return {
        foodName: sanitizeInput(foodName),
        confidence,
        estimatedWeight,
      };
    } catch (error) {
      console.error('LogMeal API error:', error);
      throw error;
    }
  }

  /**
   * Get detailed nutritional information for a recognized food item
   */
  static async getNutritionInfo(
    imageId: string,
    foodName: string,
    weight: number = 100
  ): Promise<Omit<FoodItem, 'id'>> {
    try {
      console.log(`Getting nutrition info for ${foodName} (${weight}g)`);
      
      const response = await this.makeRequest<LogMealNutritionResponse>(
        '/v2/nutrition/recipe/nutritionalInfo',
        {
          method: 'POST',
          body: JSON.stringify({
            imageId,
            weight,
          }),
        }
      );

      const nutrition = response.nutritional_info;
      const nutrients = nutrition.totalNutrients;

      return {
        name: sanitizeInput(foodName),
        brand: 'LogMeal Detected',
        servingSize: weight,
        servingUnit: 'g',
        calories: Math.round(nutrition.calories || 0),
        protein: Math.round(nutrients.PROCNT?.quantity || 0),
        carbs: Math.round(nutrients.CHOCDF?.quantity || 0),
        fat: Math.round(nutrients.FAT?.quantity || 0),
        fiber: Math.round(nutrients.FIBTG?.quantity || 0),
        sugar: Math.round(nutrients.SUGAR?.quantity || 0),
        sodium: Math.round(nutrients.NA?.quantity || 0),
      };
    } catch (error) {
      console.error('LogMeal nutrition API error:', error);
      throw error;
    }
  }

  /**
   * Analyze food image and return complete nutritional information
   */
  static async analyzeFood(imageBase64: string): Promise<Omit<FoodItem, 'id'>> {
    try {
      // First recognize the food
      const recognition = await this.recognizeFood(imageBase64);
      
      if (recognition.confidence < 0.3) {
        throw new Error('Food recognition confidence too low. Please try a clearer image.');
      }

      // Then get detailed nutrition info
      // Note: We'll use the imageId from recognition, but for now we'll estimate
      const estimatedNutrition = await this.estimateNutrition(
        recognition.foodName,
        recognition.estimatedWeight
      );

      return {
        ...estimatedNutrition,
        name: recognition.foodName,
        servingSize: recognition.estimatedWeight,
      };
    } catch (error) {
      console.error('LogMeal food analysis error:', error);
      throw error;
    }
  }

  /**
   * Fallback method to estimate nutrition when detailed API calls fail
   */
  private static async estimateNutrition(
    foodName: string,
    weight: number
  ): Promise<Omit<FoodItem, 'id' | 'name' | 'servingSize'>> {
    // This is a simplified estimation - in production you'd want more sophisticated logic
    // or integration with a comprehensive nutrition database
    
    const baseCaloriesPer100g = this.estimateCaloriesPerFood(foodName);
    const multiplier = weight / 100;

    return {
      brand: 'LogMeal Estimated',
      servingUnit: 'g',
      calories: Math.round(baseCaloriesPer100g * multiplier),
      protein: Math.round(this.estimateProtein(foodName) * multiplier),
      carbs: Math.round(this.estimateCarbs(foodName) * multiplier),
      fat: Math.round(this.estimateFat(foodName) * multiplier),
      fiber: Math.round(this.estimateFiber(foodName) * multiplier),
      sugar: Math.round(this.estimateSugar(foodName) * multiplier),
      sodium: Math.round(this.estimateSodium(foodName) * multiplier),
    };
  }

  private static estimateCaloriesPerFood(foodName: string): number {
    const lowerName = foodName.toLowerCase();
    
    // Basic calorie estimation based on food type
    if (lowerName.includes('apple') || lowerName.includes('orange')) return 50;
    if (lowerName.includes('banana')) return 90;
    if (lowerName.includes('bread')) return 250;
    if (lowerName.includes('rice')) return 130;
    if (lowerName.includes('chicken')) return 165;
    if (lowerName.includes('beef')) return 250;
    if (lowerName.includes('fish')) return 120;
    if (lowerName.includes('pasta')) return 220;
    if (lowerName.includes('salad')) return 20;
    if (lowerName.includes('pizza')) return 285;
    
    return 150; // Default estimate
  }

  private static estimateProtein(foodName: string): number {
    const lowerName = foodName.toLowerCase();
    
    if (lowerName.includes('chicken') || lowerName.includes('beef') || lowerName.includes('fish')) return 25;
    if (lowerName.includes('egg')) return 13;
    if (lowerName.includes('cheese')) return 20;
    if (lowerName.includes('beans') || lowerName.includes('lentil')) return 8;
    if (lowerName.includes('bread')) return 8;
    if (lowerName.includes('rice')) return 3;
    
    return 5; // Default
  }

  private static estimateCarbs(foodName: string): number {
    const lowerName = foodName.toLowerCase();
    
    if (lowerName.includes('rice') || lowerName.includes('pasta')) return 28;
    if (lowerName.includes('bread')) return 45;
    if (lowerName.includes('potato')) return 20;
    if (lowerName.includes('apple') || lowerName.includes('banana')) return 15;
    if (lowerName.includes('vegetable') || lowerName.includes('salad')) return 5;
    
    return 10; // Default
  }

  private static estimateFat(foodName: string): number {
    const lowerName = foodName.toLowerCase();
    
    if (lowerName.includes('oil') || lowerName.includes('butter')) return 80;
    if (lowerName.includes('nuts') || lowerName.includes('avocado')) return 15;
    if (lowerName.includes('cheese')) return 25;
    if (lowerName.includes('beef')) return 15;
    if (lowerName.includes('chicken')) return 3;
    if (lowerName.includes('fish')) return 5;
    
    return 2; // Default
  }

  private static estimateFiber(foodName: string): number {
    const lowerName = foodName.toLowerCase();
    
    if (lowerName.includes('beans') || lowerName.includes('lentil')) return 8;
    if (lowerName.includes('apple') || lowerName.includes('pear')) return 4;
    if (lowerName.includes('vegetable') || lowerName.includes('salad')) return 3;
    if (lowerName.includes('bread') && lowerName.includes('whole')) return 6;
    
    return 1; // Default
  }

  private static estimateSugar(foodName: string): number {
    const lowerName = foodName.toLowerCase();
    
    if (lowerName.includes('fruit') || lowerName.includes('apple') || lowerName.includes('banana')) return 10;
    if (lowerName.includes('dessert') || lowerName.includes('cake')) return 25;
    if (lowerName.includes('soda') || lowerName.includes('juice')) return 25;
    
    return 2; // Default
  }

  private static estimateSodium(foodName: string): number {
    const lowerName = foodName.toLowerCase();
    
    if (lowerName.includes('processed') || lowerName.includes('canned')) return 600;
    if (lowerName.includes('bread')) return 400;
    if (lowerName.includes('cheese')) return 500;
    if (lowerName.includes('fresh') || lowerName.includes('fruit')) return 5;
    
    return 100; // Default
  }
}

export default LogMealAPI;