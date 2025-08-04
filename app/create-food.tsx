import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Save, ArrowLeft } from 'lucide-react-native';

import { colors } from '@/constants/colors';
import { FoodItem, MealEntry } from '@/types/nutrition';
import { useNutrition } from '@/hooks/useNutritionStore';

interface FormData {
  name: string;
  brand: string;
  servingSize: string;
  servingUnit: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sugar: string;
  sodium: string;
}

const SERVING_UNITS = [
  'g', 'oz', 'cup', 'tbsp', 'tsp', 'ml', 'fl oz', 'piece', 'slice', 'serving'
];

export default function CreateFoodScreen() {
  const router = useRouter();
  const { mealType } = useLocalSearchParams<{ mealType: MealEntry['mealType'] }>();
  const { addFoodItem, addMealEntry } = useNutrition();
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    brand: '',
    servingSize: '100',
    servingUnit: 'g',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: '',
    sugar: '',
    sodium: '',
  });
  
  const [showUnitPicker, setShowUnitPicker] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Food name is required');
      return false;
    }
    
    if (!formData.servingSize || isNaN(Number(formData.servingSize)) || Number(formData.servingSize) <= 0) {
      Alert.alert('Error', 'Valid serving size is required');
      return false;
    }
    
    if (!formData.calories || isNaN(Number(formData.calories)) || Number(formData.calories) < 0) {
      Alert.alert('Error', 'Valid calories value is required');
      return false;
    }
    
    return true;
  };
  
  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const newFoodItem: Omit<FoodItem, 'id'> = {
        name: formData.name.trim(),
        brand: formData.brand.trim() || undefined,
        servingSize: Number(formData.servingSize),
        servingUnit: formData.servingUnit,
        calories: Number(formData.calories) || 0,
        protein: Number(formData.protein) || 0,
        carbs: Number(formData.carbs) || 0,
        fat: Number(formData.fat) || 0,
        fiber: Number(formData.fiber) || undefined,
        sugar: Number(formData.sugar) || undefined,
        sodium: Number(formData.sodium) || undefined,
      };
      
      const createdFood = addFoodItem(newFoodItem);
      
      // If we have a meal type, add it to the meal
      if (mealType) {
        const today = new Date().toISOString().split('T')[0];
        addMealEntry({
          foodItem: createdFood,
          servings: 1,
          mealType: mealType as MealEntry['mealType'],
          date: today,
        });
      }
      
      Alert.alert(
        'Success',
        `${createdFood.name} has been created${mealType ? ' and added to your meal' : ''}!`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error creating food item:', error);
      Alert.alert('Error', 'Failed to create food item. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderInput = (
    label: string,
    field: keyof FormData,
    placeholder: string,
    keyboardType: 'default' | 'numeric' = 'default',
    required: boolean = false
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={styles.input}
        value={formData[field]}
        onChangeText={(value) => updateField(field, value)}
        placeholder={placeholder}
        keyboardType={keyboardType}
        placeholderTextColor={colors.mediumGray}
      />
    </View>
  );
  
  const renderUnitPicker = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>Serving Unit *</Text>
      <TouchableOpacity
        style={styles.unitPicker}
        onPress={() => setShowUnitPicker(!showUnitPicker)}
      >
        <Text style={styles.unitText}>{formData.servingUnit}</Text>
      </TouchableOpacity>
      
      {showUnitPicker && (
        <View style={styles.unitOptions}>
          {SERVING_UNITS.map(unit => (
            <TouchableOpacity
              key={unit}
              style={[
                styles.unitOption,
                formData.servingUnit === unit && styles.selectedUnit
              ]}
              onPress={() => {
                updateField('servingUnit', unit);
                setShowUnitPicker(false);
              }}
            >
              <Text style={[
                styles.unitOptionText,
                formData.servingUnit === unit && styles.selectedUnitText
              ]}>
                {unit}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Create Custom Food</Text>
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.disabledButton]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Save size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          {renderInput('Food Name', 'name', 'e.g., Homemade Pasta Salad', 'default', true)}
          {renderInput('Brand (Optional)', 'brand', 'e.g., Homemade, Restaurant Name')}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Serving Information</Text>
          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Serving Size *</Text>
              <TextInput
                style={styles.input}
                value={formData.servingSize}
                onChangeText={(value) => updateField('servingSize', value)}
                placeholder="100"
                keyboardType="numeric"
                placeholderTextColor={colors.mediumGray}
              />
            </View>
            <View style={[styles.halfWidth, { marginLeft: 12 }]}>
              {renderUnitPicker()}
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutrition Facts (per serving)</Text>
          {renderInput('Calories', 'calories', '0', 'numeric', true)}
          
          <View style={styles.macroRow}>
            <View style={styles.macroInput}>
              {renderInput('Protein (g)', 'protein', '0', 'numeric')}
            </View>
            <View style={styles.macroInput}>
              {renderInput('Carbs (g)', 'carbs', '0', 'numeric')}
            </View>
            <View style={styles.macroInput}>
              {renderInput('Fat (g)', 'fat', '0', 'numeric')}
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Nutrients (Optional)</Text>
          <View style={styles.macroRow}>
            <View style={styles.macroInput}>
              {renderInput('Fiber (g)', 'fiber', '0', 'numeric')}
            </View>
            <View style={styles.macroInput}>
              {renderInput('Sugar (g)', 'sugar', '0', 'numeric')}
            </View>
            <View style={styles.macroInput}>
              {renderInput('Sodium (mg)', 'sodium', '0', 'numeric')}
            </View>
          </View>
        </View>
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.darkGray,
    marginBottom: 8,
  },
  required: {
    color: colors.error,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  halfWidth: {
    flex: 1,
  },
  unitPicker: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  unitText: {
    fontSize: 16,
    color: colors.text,
  },
  unitOptions: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
  },
  unitOption: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  selectedUnit: {
    backgroundColor: colors.primary,
  },
  unitOptionText: {
    fontSize: 16,
    color: colors.text,
  },
  selectedUnitText: {
    color: colors.white,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 12,
  },
  macroInput: {
    flex: 1,
  },
  bottomPadding: {
    height: 32,
  },
});