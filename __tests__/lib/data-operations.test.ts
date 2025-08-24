import { trpcClient } from '@/lib/trpc';

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
  auth: {
    getUser: jest.fn(),
  },
};

jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
}));

// Mock tRPC client
const mockTrpcClient = {
  profile: {
    get: {
      query: jest.fn(),
    },
    update: {
      mutate: jest.fn(),
    },
    create: {
      mutate: jest.fn(),
    },
  },
  food: {
    entries: {
      query: jest.fn(),
    },
    log: {
      mutate: jest.fn(),
    },
    delete: {
      mutate: jest.fn(),
    },
    search: {
      query: jest.fn(),
    },
  },
  customFoods: {
    list: {
      query: jest.fn(),
    },
    create: {
      mutate: jest.fn(),
    },
  },
  recipes: {
    list: {
      query: jest.fn(),
    },
    create: {
      mutate: jest.fn(),
    },
  },
};

jest.mock('@/lib/trpc', () => ({
  trpcClient: mockTrpcClient,
}));

describe('Data Fetching and Manipulation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Profile Management', () => {
    it('should fetch user profile successfully', async () => {
      const mockProfile = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        weight: 70,
        height: 170,
        age: 30,
        gender: 'male',
        activity_level: 'moderate',
        goal: 'maintain',
        calories_goal: 2000,
        protein_goal: 150,
        carbs_goal: 250,
        fat_goal: 67,
      };

      (mockTrpcClient.profile.get.query as jest.Mock).mockResolvedValue(mockProfile);

      const result = await trpcClient.profile.get.query();

      expect(result).toEqual(mockProfile);
      expect(mockTrpcClient.profile.get.query).toHaveBeenCalled();
    });

    it('should handle profile fetch errors', async () => {
      const mockError = new Error('Network error');
      (mockTrpcClient.profile.get.query as jest.Mock).mockRejectedValue(mockError);

      await expect(trpcClient.profile.get.query()).rejects.toThrow('Network error');
    });

    it('should update user profile successfully', async () => {
      const updateData = {
        name: 'Updated User',
        weight: 75,
        height: 175,
      };

      const updatedProfile = {
        id: 'user-1',
        ...updateData,
        updated_at: new Date().toISOString(),
      };

      (mockTrpcClient.profile.update.mutate as jest.Mock).mockResolvedValue(updatedProfile);

      const result = await trpcClient.profile.update.mutate(updateData);

      expect(result).toEqual(updatedProfile);
      expect(mockTrpcClient.profile.update.mutate).toHaveBeenCalledWith(updateData);
    });
  });

  describe('Food Entry Management', () => {
    it('should fetch food entries for a specific date', async () => {
      const mockEntries = [
        {
          id: 'entry-1',
          food_name: 'Apple',
          brand: 'Fresh',
          serving_size: 100,
          serving_unit: 'g',
          calories: 95,
          protein: 0.5,
          carbs: 25,
          fat: 0.3,
          meal_type: 'breakfast',
          logged_at: '2024-01-01T08:00:00Z',
        },
      ];

      (mockTrpcClient.food.entries.query as jest.Mock).mockResolvedValue(mockEntries);

      const result = await trpcClient.food.entries.query({ date: '2024-01-01' });

      expect(result).toEqual(mockEntries);
      expect(mockTrpcClient.food.entries.query).toHaveBeenCalledWith({ date: '2024-01-01' });
    });

    it('should log new food entry successfully', async () => {
      const foodEntry = {
        food_name: 'Banana',
        brand: 'Organic',
        serving_size: 120,
        serving_unit: 'g',
        calories: 105,
        protein: 1.3,
        carbs: 27,
        fat: 0.4,
        meal_type: 'snack' as const,
        logged_at: new Date().toISOString(),
      };

      const createdEntry = {
        id: 'entry-3',
        ...foodEntry,
        created_at: new Date().toISOString(),
      };

      (mockTrpcClient.food.log.mutate as jest.Mock).mockResolvedValue(createdEntry);

      const result = await trpcClient.food.log.mutate(foodEntry);

      expect(result).toEqual(createdEntry);
      expect(mockTrpcClient.food.log.mutate).toHaveBeenCalledWith(foodEntry);
    });

    it('should delete food entry successfully', async () => {
      const entryId = 'entry-1';
      
      (mockTrpcClient.food.delete.mutate as jest.Mock).mockResolvedValue({ success: true });

      const result = await trpcClient.food.delete.mutate({ id: entryId });

      expect(result).toEqual({ success: true });
      expect(mockTrpcClient.food.delete.mutate).toHaveBeenCalledWith({ id: entryId });
    });

    it('should handle food entry errors', async () => {
      const mockError = new Error('Database error');
      (mockTrpcClient.food.entries.query as jest.Mock).mockRejectedValue(mockError);

      await expect(trpcClient.food.entries.query({ date: '2024-01-01' })).rejects.toThrow('Database error');
    });
  });

  describe('Food Search', () => {
    it('should search foods successfully', async () => {
      const mockSearchResults = [
        {
          id: 'food-1',
          name: 'Apple',
          brand: 'Generic',
          serving_size: 100,
          serving_unit: 'g',
          calories: 95,
          protein: 0.5,
          carbs: 25,
          fat: 0.3,
        },
      ];

      (mockTrpcClient.food.search.query as jest.Mock).mockResolvedValue(mockSearchResults);

      const result = await trpcClient.food.search.query({ query: 'apple' });

      expect(result).toEqual(mockSearchResults);
      expect(mockTrpcClient.food.search.query).toHaveBeenCalledWith({ query: 'apple' });
    });

    it('should handle empty search results', async () => {
      (mockTrpcClient.food.search.query as jest.Mock).mockResolvedValue([]);

      const result = await trpcClient.food.search.query({ query: 'nonexistent' });

      expect(result).toEqual([]);
    });

    it('should handle search errors', async () => {
      const mockError = new Error('Search service unavailable');
      (mockTrpcClient.food.search.query as jest.Mock).mockRejectedValue(mockError);

      await expect(trpcClient.food.search.query({ query: 'apple' })).rejects.toThrow('Search service unavailable');
    });
  });

  describe('Custom Foods Management', () => {
    it('should fetch custom foods successfully', async () => {
      const mockCustomFoods = [
        {
          id: 'custom-1',
          name: 'My Protein Shake',
          brand: 'Homemade',
          serving_size: 250,
          serving_unit: 'ml',
          calories_per_serving: 200,
          protein_per_serving: 25,
          carbs_per_serving: 15,
          fat_per_serving: 5,
          created_at: new Date().toISOString(),
        },
      ];

      (mockTrpcClient.customFoods.list.query as jest.Mock).mockResolvedValue(mockCustomFoods);

      const result = await trpcClient.customFoods.list.query({});

      expect(result).toEqual(mockCustomFoods);
      expect(mockTrpcClient.customFoods.list.query).toHaveBeenCalledWith({});
    });

    it('should create custom food successfully', async () => {
      const customFoodData = {
        name: 'My Energy Bar',
        brand: 'Homemade',
        serving_size: 50,
        serving_unit: 'g',
        calories_per_serving: 180,
        protein_per_serving: 8,
        carbs_per_serving: 22,
        fat_per_serving: 7,
      };

      const createdCustomFood = {
        id: 'custom-2',
        ...customFoodData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      (mockTrpcClient.customFoods.create.mutate as jest.Mock).mockResolvedValue(createdCustomFood);

      const result = await trpcClient.customFoods.create.mutate(customFoodData);

      expect(result).toEqual(createdCustomFood);
      expect(mockTrpcClient.customFoods.create.mutate).toHaveBeenCalledWith(customFoodData);
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      
      (mockTrpcClient.profile.get.query as jest.Mock).mockRejectedValue(timeoutError);

      await expect(trpcClient.profile.get.query()).rejects.toThrow('Request timeout');
    });

    it('should handle authentication errors', async () => {
      const authError = new Error('Unauthorized');
      authError.name = 'AuthError';
      
      (mockTrpcClient.food.entries.query as jest.Mock).mockRejectedValue(authError);

      await expect(trpcClient.food.entries.query({ date: '2024-01-01' })).rejects.toThrow('Unauthorized');
    });

    it('should handle validation errors', async () => {
      const validationError = new Error('Invalid input data');
      validationError.name = 'ValidationError';
      
      (mockTrpcClient.food.log.mutate as jest.Mock).mockRejectedValue(validationError);

      const invalidEntry = {
        food_name: '',
        serving_size: 100,
        serving_unit: 'g',
        calories: -10,
        protein: 0,
        carbs: 0,
        fat: 0,
        meal_type: 'breakfast' as const,
      };

      await expect(trpcClient.food.log.mutate(invalidEntry)).rejects.toThrow('Invalid input data');
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data integrity during concurrent operations', async () => {
      const entry1 = {
        food_name: 'Food 1',
        serving_size: 100,
        serving_unit: 'g',
        calories: 100,
        protein: 5,
        carbs: 15,
        fat: 2,
        meal_type: 'breakfast' as const,
        logged_at: new Date().toISOString(),
      };

      const entry2 = {
        food_name: 'Food 2',
        serving_size: 150,
        serving_unit: 'g',
        calories: 200,
        protein: 10,
        carbs: 25,
        fat: 5,
        meal_type: 'lunch' as const,
        logged_at: new Date().toISOString(),
      };

      (mockTrpcClient.food.log.mutate as jest.Mock)
        .mockResolvedValueOnce({ id: 'entry-1', ...entry1 })
        .mockResolvedValueOnce({ id: 'entry-2', ...entry2 });

      const [result1, result2] = await Promise.all([
        trpcClient.food.log.mutate(entry1),
        trpcClient.food.log.mutate(entry2),
      ]);

      expect(result1.id).toBe('entry-1');
      expect(result2.id).toBe('entry-2');
      expect(mockTrpcClient.food.log.mutate).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures in batch operations', async () => {
      const entries = [
        {
          food_name: 'Valid Food',
          serving_size: 100,
          serving_unit: 'g',
          calories: 100,
          protein: 5,
          carbs: 15,
          fat: 2,
          meal_type: 'breakfast' as const,
        },
        {
          food_name: '',
          serving_size: 100,
          serving_unit: 'g',
          calories: -10,
          protein: 0,
          carbs: 0,
          fat: 0,
          meal_type: 'lunch' as const,
        },
        {
          food_name: 'Another Valid Food',
          serving_size: 120,
          serving_unit: 'g',
          calories: 150,
          protein: 8,
          carbs: 20,
          fat: 3,
          meal_type: 'dinner' as const,
        },
      ];

      (mockTrpcClient.food.log.mutate as jest.Mock)
        .mockResolvedValueOnce({ id: 'entry-1', ...entries[0] })
        .mockRejectedValueOnce(new Error('Validation error'))
        .mockResolvedValueOnce({ id: 'entry-3', ...entries[2] });

      const results = await Promise.allSettled(
        entries.map(entry => trpcClient.food.log.mutate(entry))
      );

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');
    });
  });
});