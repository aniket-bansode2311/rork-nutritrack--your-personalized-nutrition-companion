import React, { useState, useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Minus, Plus, Trash2, Scan, Star, Heart } from 'lucide-react-native';

import { colors } from '@/constants/colors';
import { useNutrition } from '@/hooks/useNutritionStore';
import { NutrientProgressBar } from '@/components/NutrientProgressBar';
import type { FoodItem, MealEntry } from '@/types/nutrition';

export default function FoodDetailsScreen() {
  const router = useRouter();
  const { entryId, foodData, source, mealType, foodId } = useLocalSearchParams<{ 
    entryId?: string;
    foodData?: string;
    source?: string;
    mealType?: MealEntry['mealType'];
    foodId?: string;
  }>();
  const { mealEntries, updateMealEntry, removeMealEntry, addMealEntry, foodItems, customFoods, toggleFavorite, isFavorite } = useNutrition();
  
  // Initialize state first
  const [servings, setServings] = useState<number>(1);
  
  // Determine data source and get food item
  const entry = entryId ? mealEntries.find((entry) => entry.id === entryId) : null;
  const isNewItem = !entryId && (!!foodData || !!foodId);
  
  let foodItem: FoodItem | null = null;
  
  if (entry) {
    foodItem = entry.foodItem;
  } else if (foodData) {
    try {
      foodItem = JSON.parse(foodData);
    } catch (error) {
      console.error('Failed to parse food data:', error);
    }
  } else if (foodId) {
    // Find food item by ID from both regular and custom foods
    const allFoods = [...foodItems, ...customFoods];
    foodItem = allFoods.find(food => food.id === foodId) || null;
  }
  
  // Update servings state when entry changes
  useEffect(() => {
    if (entry) {
      setServings(entry.servings);
    }
  }, [entry]);
  
  // Handle navigation for invalid data
  useEffect(() => {
    if (!foodItem) {
      router.back();
    }
  }, [foodItem, router]);
  
  // Early return if no valid data
  if (!foodItem) {
    return null;
  }
  
  const handleUpdateServings = (newServings: number) => {
    if (newServings <= 0) return;
    setServings(newServings);
  };
  
  const handleToggleFavorite = () => {
    if (foodItem) {
      toggleFavorite(foodItem.id);
    }
  };
  
  const getServingSizeOptions = () => {
    const unit = foodItem?.servingUnit || 'g';
    
    return [
      { label: `0.5 ${unit === 'piece' || unit === 'slice' ? unit : 'serving'}`, value: 0.5 },
      { label: `1 ${unit === 'piece' || unit === 'slice' ? unit : 'serving'}`, value: 1 },
      { label: `1.5 ${unit === 'piece' || unit === 'slice' ? unit : 'serving'}`, value: 1.5 },
      { label: `2 ${unit === 'piece' || unit === 'slice' ? unit : 'serving'}`, value: 2 },
      { label: `3 ${unit === 'piece' || unit === 'slice' ? unit : 'serving'}`, value: 3 },
    ];
  };
  
  const handleSave = () => {
    if (isNewItem && mealType) {
      // Add new meal entry for barcode-scanned product
      const today = new Date().toISOString().split('T')[0];
      addMealEntry({
        foodItem,
        servings,
        mealType: mealType as MealEntry['mealType'],
        date: today,
      });
    } else if (entry) {
      // Update existing meal entry
      updateMealEntry(entry.id, { servings });
    }
    router.back();
  };
  
  const handleDelete = () => {
    if (isNewItem) {
      // Just go back for new items
      router.back();
      return;
    }
    
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
  
  // Remove this line since foodItem is now defined above
  const totalCalories = foodItem.calories * servings;
  const totalProtein = foodItem.protein * servings;
  const totalCarbs = foodItem.carbs * servings;
  const totalFat = foodItem.fat * servings;
  
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.foodHeader}>
          <View style={styles.foodHeaderContent}>
            <View style={styles.foodInfo}>
              <View style={styles.foodNameRow}>
                <Text style={styles.foodName}>{foodItem.name}</Text>
                <TouchableOpacity
                  style={styles.favoriteButton}
                  onPress={handleToggleFavorite}
                  testID="favorite-button"
                >
                  <Heart 
                    size={24} 
                    color={isFavorite(foodItem.id) ? colors.error : colors.mediumGray}
                    fill={isFavorite(foodItem.id) ? colors.error : 'transparent'}
                  />
                </TouchableOpacity>
              </View>
              {foodItem.brand && (
                <Text style={styles.foodBrand}>{foodItem.brand}</Text>
              )}
              {source === 'barcode' && (foodItem as any).barcode && (
                <View style={styles.barcodeInfo}>
                  <Scan size={16} color={colors.mediumGray} />
                  <Text style={styles.barcodeText}>Barcode: {(foodItem as any).barcode}</Text>
                </View>
              )}
              {foodItem.id.startsWith('custom-') && (
                <View style={styles.customBadge}>
                  <Star size={14} color={colors.secondary} />
                  <Text style={styles.customText}>Custom Food</Text>
                </View>
              )}
            </View>
            {(foodItem as any).imageUrl && (
              <Image 
                source={{ uri: (foodItem as any).imageUrl }} 
                style={styles.productImage}
                resizeMode="cover"
              />
            )}
          </View>
        </View>
        
        <View style={styles.servingSection}>
          <Text style={styles.sectionTitle}>Serving Size</Text>
          
          {/* Quick serving options */}
          <View style={styles.quickServings}>
            {getServingSizeOptions().map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.quickServingButton,
                  servings === option.value && styles.activeQuickServing
                ]}
                onPress={() => setServings(option.value)}
              >
                <Text style={[
                  styles.quickServingText,
                  servings === option.value && styles.activeQuickServingText
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Manual serving controls */}
          <View style={styles.servingControls}>
            <TouchableOpacity 
              style={styles.servingButton}
              onPress={() => handleUpdateServings(servings - 0.25)}
              disabled={servings <= 0.25}
              testID="decrease-serving"
            >
              <Minus size={20} color={servings <= 0.25 ? colors.mediumGray : colors.text} />
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
              onPress={() => handleUpdateServings(servings + 0.25)}
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
        {!isNewItem && (
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDelete}
            testID="delete-button"
          >
            <Trash2 size={24} color={colors.danger} />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.saveButton, isNewItem && styles.fullWidthButton]}
          onPress={handleSave}
          testID="save-button"
        >
          <Text style={styles.saveButtonText}>
            {isNewItem ? 'Add to Diary' : 'Save Changes'}
          </Text>
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
  foodHeaderContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  foodInfo: {
    flex: 1,
  },
  barcodeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  barcodeText: {
    fontSize: 12,
    color: colors.mediumGray,
    marginLeft: 4,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginLeft: 16,
  },
  fullWidthButton: {
    marginRight: 0,
  },
  foodNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  favoriteButton: {
    padding: 4,
  },
  customBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  customText: {
    fontSize: 12,
    color: colors.secondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  quickServings: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  quickServingButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.lightGray,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  activeQuickServing: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickServingText: {
    fontSize: 12,
    color: colors.darkGray,
    fontWeight: '500',
  },
  activeQuickServingText: {
    color: colors.white,
  },
});