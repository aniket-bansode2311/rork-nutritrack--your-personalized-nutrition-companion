import React, { useMemo, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MoreVertical } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { colors } from '@/constants/colors';
import { MealEntry } from '@/types/nutrition';
import { useNutrition } from '@/hooks/useNutritionStore';

interface FoodItemRowProps {
  entry: MealEntry;
}

const FoodItemRowComponent: React.FC<FoodItemRowProps> = ({ entry }) => {
  const router = useRouter();
  const { removeMealEntry } = useNutrition();
  const { foodItem, servings } = entry;
  
  // Memoize expensive calculations
  const displayData = useMemo(() => {
    const totalCalories = foodItem.calories * servings;
    const totalWeight = servings * foodItem.servingSize;
    const servingText = `${servings} ${servings === 1 ? 'serving' : 'servings'} (${totalWeight} ${foodItem.servingUnit})`;
    
    return {
      totalCalories,
      servingText,
    };
  }, [foodItem.calories, foodItem.servingSize, foodItem.servingUnit, servings]);
  
  // Memoize event handlers
  const handlePress = useCallback(() => {
    router.push({
      pathname: '/food-details',
      params: { entryId: entry.id },
    });
  }, [router, entry.id]);
  
  const handleRemove = useCallback(() => {
    removeMealEntry(entry.id);
  }, [removeMealEntry, entry.id]);
  
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      testID={`food-item-${entry.id}`}
    >
      <View style={styles.infoContainer}>
        <Text style={styles.foodName}>{foodItem.name}</Text>
        {foodItem.brand && (
          <Text style={styles.brand}>{foodItem.brand}</Text>
        )}
        <Text style={styles.serving}>
          {displayData.servingText}
        </Text>
      </View>
      
      <View style={styles.caloriesContainer}>
        <Text style={styles.calories}>{displayData.totalCalories.toFixed(0)} kcal</Text>
        <TouchableOpacity 
          style={styles.moreButton}
          onPress={handleRemove}
          testID={`remove-food-${entry.id}`}
        >
          <MoreVertical size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

FoodItemRowComponent.displayName = 'FoodItemRow';

export const FoodItemRow = React.memo(FoodItemRowComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    borderRadius: 12,
    marginVertical: 2,
  },
  infoContainer: {
    flex: 1,
  },
  foodName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.2,
  },
  brand: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 3,
    fontWeight: '500',
  },
  serving: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 3,
    fontWeight: '500',
  },
  caloriesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calories: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 12,
    letterSpacing: -0.2,
  },
  moreButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: colors.gray100,
  },
});