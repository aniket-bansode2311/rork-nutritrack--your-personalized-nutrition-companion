import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MoreVertical } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { colors } from '@/constants/colors';
import { MealEntry } from '@/types/nutrition';
import { useNutrition } from '@/hooks/useNutritionStore';

interface FoodItemRowProps {
  entry: MealEntry;
}

export const FoodItemRow: React.FC<FoodItemRowProps> = ({ entry }) => {
  const router = useRouter();
  const { removeMealEntry } = useNutrition();
  const { foodItem, servings } = entry;
  
  const totalCalories = foodItem.calories * servings;
  
  const handlePress = () => {
    router.push({
      pathname: '/food-details',
      params: { entryId: entry.id },
    });
  };
  
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
          {servings} {servings === 1 ? 'serving' : 'servings'} ({servings * foodItem.servingSize} {foodItem.servingUnit})
        </Text>
      </View>
      
      <View style={styles.caloriesContainer}>
        <Text style={styles.calories}>{totalCalories.toFixed(0)} kcal</Text>
        <TouchableOpacity 
          style={styles.moreButton}
          onPress={() => removeMealEntry(entry.id)}
          testID={`remove-food-${entry.id}`}
        >
          <MoreVertical size={16} color={colors.darkGray} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  infoContainer: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  brand: {
    fontSize: 14,
    color: colors.darkGray,
    marginTop: 2,
  },
  serving: {
    fontSize: 14,
    color: colors.darkGray,
    marginTop: 2,
  },
  caloriesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calories: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginRight: 8,
  },
  moreButton: {
    padding: 8,
  },
});