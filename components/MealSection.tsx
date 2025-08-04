import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Plus, Camera } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { colors } from '@/constants/colors';
import { MealEntry } from '@/types/nutrition';
import { FoodItemRow } from './FoodItemRow';

interface MealSectionProps {
  title: string;
  mealType: MealEntry['mealType'];
  entries: MealEntry[];
  totalCalories: number;
}

export const MealSection: React.FC<MealSectionProps> = ({
  title,
  mealType,
  entries,
  totalCalories,
}) => {
  const router = useRouter();
  
  const handleAddFood = () => {
    router.push({
      pathname: '/add-food',
      params: { mealType },
    });
  };
  
  const handleScanFood = () => {
    router.push({
      pathname: '/ai-food-scan',
      params: { mealType },
    });
  };
  
  return (
    <View style={styles.container} testID={`meal-section-${mealType}`}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.calories}>{totalCalories.toFixed(0)} kcal</Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.scanButton} 
            onPress={handleScanFood}
            testID={`scan-${mealType}`}
          >
            <Camera size={18} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={handleAddFood}
            testID={`add-to-${mealType}`}
          >
            <Plus size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.foodList}>
        {entries.length === 0 ? (
          <Text style={styles.emptyText}>No food items added yet</Text>
        ) : (
          entries.map((entry) => (
            <FoodItemRow 
              key={entry.id} 
              entry={entry} 
            />
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  calories: {
    fontSize: 14,
    color: colors.darkGray,
    marginTop: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  scanButton: {
    backgroundColor: colors.secondary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodList: {
    marginTop: 8,
  },
  emptyText: {
    color: colors.mediumGray,
    textAlign: 'center',
    paddingVertical: 16,
    fontStyle: 'italic',
  },
});