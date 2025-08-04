import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Minus, Plus, Trash2 } from 'lucide-react-native';

import { colors } from '@/constants/colors';
import { useNutrition } from '@/hooks/useNutritionStore';
import { NutrientProgressBar } from '@/components/NutrientProgressBar';

export default function FoodDetailsScreen() {
  const router = useRouter();
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const { mealEntries, updateMealEntry, removeMealEntry } = useNutrition();
  
  const entry = mealEntries.find((entry) => entry.id === entryId);
  const [servings, setServings] = useState<number>(entry?.servings || 1);
  
  if (!entry) {
    router.back();
    return null;
  }
  
  const handleUpdateServings = (newServings: number) => {
    if (newServings <= 0) return;
    setServings(newServings);
  };
  
  const handleSave = () => {
    updateMealEntry(entry.id, { servings });
    router.back();
  };
  
  const handleDelete = () => {
    Alert.alert(
      'Delete Food Item',
      'Are you sure you want to remove this food item from your diary?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            removeMealEntry(entry.id);
            router.back();
          }
        },
      ]
    );
  };
  
  const { foodItem } = entry;
  const totalCalories = foodItem.calories * servings;
  const totalProtein = foodItem.protein * servings;
  const totalCarbs = foodItem.carbs * servings;
  const totalFat = foodItem.fat * servings;
  
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.foodHeader}>
          <Text style={styles.foodName}>{foodItem.name}</Text>
          {foodItem.brand && (
            <Text style={styles.foodBrand}>{foodItem.brand}</Text>
          )}
        </View>
        
        <View style={styles.servingSection}>
          <Text style={styles.sectionTitle}>Serving Size</Text>
          <View style={styles.servingControls}>
            <TouchableOpacity 
              style={styles.servingButton}
              onPress={() => handleUpdateServings(servings - 0.5)}
              disabled={servings <= 0.5}
              testID="decrease-serving"
            >
              <Minus size={20} color={servings <= 0.5 ? colors.mediumGray : colors.text} />
            </TouchableOpacity>
            
            <TextInput
              style={styles.servingInput}
              value={servings.toString()}
              onChangeText={(text) => {
                const value = parseFloat(text);
                if (!isNaN(value) && value > 0) {
                  setServings(value);
                }
              }}
              keyboardType="numeric"
              testID="serving-input"
            />
            
            <TouchableOpacity 
              style={styles.servingButton}
              onPress={() => handleUpdateServings(servings + 0.5)}
              testID="increase-serving"
            >
              <Plus size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.servingInfo}>
            {servings} {servings === 1 ? 'serving' : 'servings'} = {(foodItem.servingSize * servings).toFixed(1)} {foodItem.servingUnit}
          </Text>
        </View>
        
        <View style={styles.nutritionSection}>
          <Text style={styles.sectionTitle}>Nutrition Facts</Text>
          
          <View style={styles.calorieRow}>
            <Text style={styles.calorieLabel}>Calories</Text>
            <Text style={styles.calorieValue}>{totalCalories.toFixed(0)}</Text>
          </View>
          
          <View style={styles.macrosContainer}>
            <NutrientProgressBar
              label="Protein"
              current={totalProtein}
              goal={50}
              unit="g"
              color={colors.success}
            />
            
            <NutrientProgressBar
              label="Carbs"
              current={totalCarbs}
              goal={100}
              unit="g"
              color={colors.warning}
            />
            
            <NutrientProgressBar
              label="Fat"
              current={totalFat}
              goal={30}
              unit="g"
              color={colors.secondary}
            />
          </View>
          
          {/* Additional nutrition info if available */}
          {(foodItem.fiber || foodItem.sugar || foodItem.sodium || foodItem.cholesterol) && (
            <View style={styles.additionalNutrition}>
              <Text style={styles.additionalTitle}>Additional Information</Text>
              
              {foodItem.fiber && (
                <View style={styles.nutritionRow}>
                  <Text style={styles.nutritionLabel}>Fiber</Text>
                  <Text style={styles.nutritionValue}>{(foodItem.fiber * servings).toFixed(1)} g</Text>
                </View>
              )}
              
              {foodItem.sugar && (
                <View style={styles.nutritionRow}>
                  <Text style={styles.nutritionLabel}>Sugar</Text>
                  <Text style={styles.nutritionValue}>{(foodItem.sugar * servings).toFixed(1)} g</Text>
                </View>
              )}
              
              {foodItem.sodium && (
                <View style={styles.nutritionRow}>
                  <Text style={styles.nutritionLabel}>Sodium</Text>
                  <Text style={styles.nutritionValue}>{(foodItem.sodium * servings).toFixed(1)} mg</Text>
                </View>
              )}
              
              {foodItem.cholesterol && (
                <View style={styles.nutritionRow}>
                  <Text style={styles.nutritionLabel}>Cholesterol</Text>
                  <Text style={styles.nutritionValue}>{(foodItem.cholesterol * servings).toFixed(1)} mg</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={handleDelete}
          testID="delete-button"
        >
          <Trash2 size={24} color={colors.danger} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
          testID="save-button"
        >
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  foodHeader: {
    backgroundColor: colors.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  foodName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  foodBrand: {
    fontSize: 16,
    color: colors.darkGray,
    marginTop: 4,
  },
  servingSection: {
    backgroundColor: colors.white,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  servingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  servingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  servingInput: {
    width: 80,
    height: 40,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    marginHorizontal: 16,
    textAlign: 'center',
    fontSize: 18,
    color: colors.text,
  },
  servingInfo: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.darkGray,
  },
  nutritionSection: {
    backgroundColor: colors.white,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 100,
    borderRadius: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  calorieRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    marginBottom: 16,
  },
  calorieLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  calorieValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  macrosContainer: {
    marginBottom: 16,
  },
  additionalNutrition: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  additionalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  nutritionLabel: {
    fontSize: 14,
    color: colors.text,
  },
  nutritionValue: {
    fontSize: 14,
    color: colors.darkGray,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  deleteButton: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  saveButton: {
    flex: 1,
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});