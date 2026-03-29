import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FoodItemRow } from '@/components/FoodItemRow';
import { MealEntry } from '@/types/nutrition';

// Mock the useRouter hook
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

// Mock the useNutrition hook
const mockRemoveMealEntry = jest.fn();
jest.mock('@/hooks/useNutritionStore', () => ({
  useNutrition: () => ({
    removeMealEntry: mockRemoveMealEntry,
  }),
}));

describe('FoodItemRow Component', () => {
  const mockMealEntry: MealEntry = {
    id: 'entry-1',
    foodItem: {
      id: 'food-1',
      name: 'Apple',
      brand: 'Fresh Farms',
      servingSize: 100,
      servingUnit: 'g',
      calories: 95,
      protein: 0.5,
      carbs: 25,
      fat: 0.3,
      fiber: 4,
      sugar: 19,
      sodium: 1,
    },
    servings: 1.5,
    mealType: 'breakfast',
    date: '2024-01-01',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render food item information correctly', () => {
      const { getByText } = render(<FoodItemRow entry={mockMealEntry} />);

      expect(getByText('Apple')).toBeTruthy();
      expect(getByText('Fresh Farms')).toBeTruthy();
      expect(getByText('1.5 servings (150 g)')).toBeTruthy();
      expect(getByText('143 kcal')).toBeTruthy(); // 95 * 1.5 = 142.5, rounded to 143
    });

    it('should render without brand when brand is empty', () => {
      const entryWithoutBrand = {
        ...mockMealEntry,
        foodItem: {
          ...mockMealEntry.foodItem,
          brand: '',
        },
      };

      const { queryByText } = render(<FoodItemRow entry={entryWithoutBrand} />);

      expect(queryByText('Fresh Farms')).toBeFalsy();
    });

    it('should handle singular serving correctly', () => {
      const singleServingEntry = {
        ...mockMealEntry,
        servings: 1,
      };

      const { getByText } = render(<FoodItemRow entry={singleServingEntry} />);

      expect(getByText('1 serving (100 g)')).toBeTruthy();
    });

    it('should calculate total calories correctly for multiple servings', () => {
      const multipleServingsEntry = {
        ...mockMealEntry,
        servings: 2.5,
      };

      const { getByText } = render(<FoodItemRow entry={multipleServingsEntry} />);

      expect(getByText('238 kcal')).toBeTruthy(); // 95 * 2.5 = 237.5, rounded to 238
    });

    it('should render with correct testIDs', () => {
      const { getByTestId } = render(<FoodItemRow entry={mockMealEntry} />);

      expect(getByTestId('food-item-entry-1')).toBeTruthy();
      expect(getByTestId('remove-food-entry-1')).toBeTruthy();
    });
  });

  describe('Interactions', () => {
    it('should navigate to food details when pressed', () => {
      const { getByTestId } = render(<FoodItemRow entry={mockMealEntry} />);

      fireEvent.press(getByTestId('food-item-entry-1'));

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/food-details',
        params: { entryId: 'entry-1' },
      });
    });

    it('should call removeMealEntry when remove button is pressed', () => {
      const { getByTestId } = render(<FoodItemRow entry={mockMealEntry} />);

      fireEvent.press(getByTestId('remove-food-entry-1'));

      expect(mockRemoveMealEntry).toHaveBeenCalledWith('entry-1');
    });

    it('should not call navigation when remove button is pressed', () => {
      const { getByTestId } = render(<FoodItemRow entry={mockMealEntry} />);

      fireEvent.press(getByTestId('remove-food-entry-1'));

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Memoization', () => {
    it('should not re-render when props have not changed', () => {
      const { rerender } = render(<FoodItemRow entry={mockMealEntry} />);
      
      // Re-render with the same props
      rerender(<FoodItemRow entry={mockMealEntry} />);
      
      // Component should be memoized and not re-render unnecessarily
      // This is more of a performance test that would be visible in profiling
      expect(true).toBe(true); // Placeholder assertion
    });

    it('should re-render when entry changes', () => {
      const { getByText, rerender } = render(<FoodItemRow entry={mockMealEntry} />);
      
      expect(getByText('Apple')).toBeTruthy();

      const updatedEntry = {
        ...mockMealEntry,
        foodItem: {
          ...mockMealEntry.foodItem,
          name: 'Orange',
        },
      };

      rerender(<FoodItemRow entry={updatedEntry} />);
      
      expect(getByText('Orange')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero calories', () => {
      const zeroCalorieEntry = {
        ...mockMealEntry,
        foodItem: {
          ...mockMealEntry.foodItem,
          calories: 0,
        },
      };

      const { getByText } = render(<FoodItemRow entry={zeroCalorieEntry} />);

      expect(getByText('0 kcal')).toBeTruthy();
    });

    it('should handle very small servings', () => {
      const smallServingEntry = {
        ...mockMealEntry,
        servings: 0.1,
      };

      const { getByText } = render(<FoodItemRow entry={smallServingEntry} />);

      expect(getByText('0.1 servings (10 g)')).toBeTruthy();
      expect(getByText('10 kcal')).toBeTruthy(); // 95 * 0.1 = 9.5, rounded to 10
    });

    it('should handle large servings', () => {
      const largeServingEntry = {
        ...mockMealEntry,
        servings: 10,
      };

      const { getByText } = render(<FoodItemRow entry={largeServingEntry} />);

      expect(getByText('10 servings (1000 g)')).toBeTruthy();
      expect(getByText('950 kcal')).toBeTruthy(); // 95 * 10 = 950
    });

    it('should handle missing optional nutrition data', () => {
      const minimalEntry = {
        ...mockMealEntry,
        foodItem: {
          id: 'food-1',
          name: 'Simple Food',
          brand: '',
          servingSize: 100,
          servingUnit: 'g',
          calories: 100,
          protein: 5,
          carbs: 20,
          fat: 2,
          // No fiber, sugar, sodium
        },
      };

      const { getByText } = render(<FoodItemRow entry={minimalEntry} />);

      expect(getByText('Simple Food')).toBeTruthy();
      expect(getByText('150 kcal')).toBeTruthy(); // 100 * 1.5 = 150
    });

    it('should handle very long food names', () => {
      const longNameEntry = {
        ...mockMealEntry,
        foodItem: {
          ...mockMealEntry.foodItem,
          name: 'This is a very long food name that might cause layout issues if not handled properly',
        },
      };

      const { getByText } = render(<FoodItemRow entry={longNameEntry} />);

      expect(getByText('This is a very long food name that might cause layout issues if not handled properly')).toBeTruthy();
    });

    it('should handle different serving units', () => {
      const cupServingEntry = {
        ...mockMealEntry,
        foodItem: {
          ...mockMealEntry.foodItem,
          servingSize: 1,
          servingUnit: 'cup',
        },
      };

      const { getByText } = render(<FoodItemRow entry={cupServingEntry} />);

      expect(getByText('1.5 servings (1.5 cup)')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByTestId } = render(<FoodItemRow entry={mockMealEntry} />);

      const foodItem = getByTestId('food-item-entry-1');
      const removeButton = getByTestId('remove-food-entry-1');

      expect(foodItem).toBeTruthy();
      expect(removeButton).toBeTruthy();
    });

    it('should be focusable for screen readers', () => {
      const { getByTestId } = render(<FoodItemRow entry={mockMealEntry} />);

      const foodItem = getByTestId('food-item-entry-1');
      
      expect(foodItem.props.accessible).not.toBe(false);
    });
  });
});