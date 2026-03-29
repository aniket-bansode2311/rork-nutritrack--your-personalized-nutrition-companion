import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import {
  Check,
  X,
  Edit3,
  Sparkles,
  Camera,
  Scale,
  Utensils,
} from 'lucide-react-native';

import { colors } from '@/constants/colors';
import { useNutrition } from '@/hooks/useNutritionStore';
import { FoodItem, MealEntry } from '@/types/nutrition';

interface RecognizedFoodData extends FoodItem {
  imageUri: string;
  mealType: MealEntry['mealType'];
}

export default function FoodRecognitionResultsScreen() {
  const router = useRouter();
  const { foodData } = useLocalSearchParams<{ foodData: string }>();
  const { addMealEntry } = useNutrition();

  const [recognizedFood, setRecognizedFood] = useState<RecognizedFoodData | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedFood, setEditedFood] = useState<RecognizedFoodData | null>(null);
  const [servings, setServings] = useState<string>('1');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  useEffect(() => {
    if (foodData) {
      try {
        const parsed = JSON.parse(foodData) as RecognizedFoodData;
        setRecognizedFood(parsed);
        setEditedFood(parsed);
      } catch (error) {
        console.error('Error parsing food data:', error);
        Alert.alert('Error', 'Failed to load food recognition results.');
        router.back();
      }
    }
  }, [foodData, router]);

  const reanalyzeFood = async () => {
    if (!recognizedFood?.imageUri) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch(recognizedFood.imageUri);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        const base64Image = base64Data.split(',')[1];

        try {
          const aiResponse = await fetch('https://toolkit.rork.com/text/llm/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [
                {
                  role: 'system',
                  content: 'You are a nutrition expert AI. Analyze food images and provide detailed nutritional information. Return a JSON object with: name, estimatedWeight (in grams), calories, protein, carbs, fat, fiber, sugar, sodium. Be as accurate as possible with portion estimation.'
                },
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: 'Re-analyze this food image with more precision. Provide accurate nutritional information for the portion shown.'
                    },
                    {
                      type: 'image',
                      image: base64Image
                    }
                  ]
                }
              ]
            }),
          });

          const aiResult = await aiResponse.json();
          let foodData;
          try {
            foodData = JSON.parse(aiResult.completion);
          } catch {
            throw new Error('Invalid AI response');
          }

          const updatedFood: RecognizedFoodData = {
            ...recognizedFood,
            name: foodData.name || recognizedFood.name,
            servingSize: foodData.estimatedWeight || recognizedFood.servingSize,
            calories: foodData.calories || recognizedFood.calories,
            protein: foodData.protein || recognizedFood.protein,
            carbs: foodData.carbs || recognizedFood.carbs,
            fat: foodData.fat || recognizedFood.fat,
            fiber: foodData.fiber || recognizedFood.fiber,
            sugar: foodData.sugar || recognizedFood.sugar,
            sodium: foodData.sodium || recognizedFood.sodium,
          };

          setRecognizedFood(updatedFood);
          setEditedFood(updatedFood);
        } catch (error) {
          console.error('Re-analysis error:', error);
          Alert.alert('Re-analysis Failed', 'Unable to re-analyze the food image.');
        }
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Image processing error:', error);
      Alert.alert('Error', 'Failed to process image for re-analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    if (!editedFood) return;

    const servingAmount = parseFloat(servings) || 1;
    const today = new Date().toISOString().split('T')[0];

    addMealEntry({
      foodItem: editedFood,
      servings: servingAmount,
      mealType: editedFood.mealType,
      date: today,
    });

    Alert.alert(
      'Food Added!',
      `${editedFood.name} has been added to your ${editedFood.mealType}.`,
      [
        {
          text: 'Add Another',
          onPress: () => router.back(),
        },
        {
          text: 'View Diary',
          onPress: () => {
            router.dismissAll();
            router.push('/(tabs)/diary');
          },
        },
      ]
    );
  };

  const updateNutrientValue = (field: keyof FoodItem, value: string) => {
    if (!editedFood) return;
    const numValue = parseFloat(value) || 0;
    setEditedFood({ ...editedFood, [field]: numValue });
  };

  const updateTextValue = (field: keyof FoodItem, value: string) => {
    if (!editedFood) return;
    setEditedFood({ ...editedFood, [field]: value });
  };

  if (!recognizedFood || !editedFood) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading recognition results...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalCalories = editedFood.calories * parseFloat(servings || '1');
  const totalProtein = editedFood.protein * parseFloat(servings || '1');
  const totalCarbs = editedFood.carbs * parseFloat(servings || '1');
  const totalFat = editedFood.fat * parseFloat(servings || '1');

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Review Recognition',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setIsEditing(!isEditing)}
              style={styles.editButton}
              testID="toggle-edit"
            >
              <Edit3 size={20} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Food Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: recognizedFood.imageUri }} style={styles.foodImage} />
          <View style={styles.aiIndicator}>
            <Sparkles size={16} color={colors.white} />
            <Text style={styles.aiIndicatorText}>AI Detected</Text>
          </View>
        </View>

        {/* Food Name */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Food Item</Text>
          {isEditing ? (
            <TextInput
              style={styles.textInput}
              value={editedFood.name}
              onChangeText={(value) => updateTextValue('name', value)}
              placeholder="Food name"
              testID="food-name-input"
            />
          ) : (
            <Text style={styles.foodName}>{editedFood.name}</Text>
          )}
          {editedFood.brand && (
            <Text style={styles.brandName}>{editedFood.brand}</Text>
          )}
        </View>

        {/* Serving Size */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Serving Size</Text>
          <View style={styles.servingContainer}>
            <Scale size={20} color={colors.primary} />
            {isEditing ? (
              <View style={styles.servingInputContainer}>
                <TextInput
                  style={styles.servingInput}
                  value={editedFood.servingSize.toString()}
                  onChangeText={(value) => updateNutrientValue('servingSize', value)}
                  keyboardType="numeric"
                  testID="serving-size-input"
                />
                <Text style={styles.servingUnit}>{editedFood.servingUnit}</Text>
              </View>
            ) : (
              <Text style={styles.servingText}>
                {editedFood.servingSize} {editedFood.servingUnit}
              </Text>
            )}
          </View>
        </View>

        {/* Number of Servings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Number of Servings</Text>
          <View style={styles.servingContainer}>
            <Utensils size={20} color={colors.primary} />
            <TextInput
              style={styles.servingInput}
              value={servings}
              onChangeText={setServings}
              keyboardType="numeric"
              placeholder="1"
              testID="servings-input"
            />
          </View>
        </View>

        {/* Nutrition Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutrition Information</Text>
          <Text style={styles.nutritionSubtitle}>
            Per {servings || '1'} serving{parseFloat(servings || '1') !== 1 ? 's' : ''}
          </Text>

          <View style={styles.nutritionGrid}>
            <NutrientRow
              label="Calories"
              value={isEditing ? editedFood.calories : totalCalories}
              unit="kcal"
              isEditing={isEditing}
              onChangeText={(value) => updateNutrientValue('calories', value)}
              testID="calories"
            />
            <NutrientRow
              label="Protein"
              value={isEditing ? editedFood.protein : totalProtein}
              unit="g"
              isEditing={isEditing}
              onChangeText={(value) => updateNutrientValue('protein', value)}
              testID="protein"
            />
            <NutrientRow
              label="Carbs"
              value={isEditing ? editedFood.carbs : totalCarbs}
              unit="g"
              isEditing={isEditing}
              onChangeText={(value) => updateNutrientValue('carbs', value)}
              testID="carbs"
            />
            <NutrientRow
              label="Fat"
              value={isEditing ? editedFood.fat : totalFat}
              unit="g"
              isEditing={isEditing}
              onChangeText={(value) => updateNutrientValue('fat', value)}
              testID="fat"
            />
            {editedFood.fiber !== undefined && (
              <NutrientRow
                label="Fiber"
                value={isEditing ? editedFood.fiber : editedFood.fiber * parseFloat(servings || '1')}
                unit="g"
                isEditing={isEditing}
                onChangeText={(value) => updateNutrientValue('fiber', value)}
                testID="fiber"
              />
            )}
            {editedFood.sugar !== undefined && (
              <NutrientRow
                label="Sugar"
                value={isEditing ? editedFood.sugar : editedFood.sugar * parseFloat(servings || '1')}
                unit="g"
                isEditing={isEditing}
                onChangeText={(value) => updateNutrientValue('sugar', value)}
                testID="sugar"
              />
            )}
            {editedFood.sodium !== undefined && (
              <NutrientRow
                label="Sodium"
                value={isEditing ? editedFood.sodium : editedFood.sodium * parseFloat(servings || '1')}
                unit="mg"
                isEditing={isEditing}
                onChangeText={(value) => updateNutrientValue('sodium', value)}
                testID="sodium"
              />
            )}
          </View>
        </View>

        {/* Re-analyze Button */}
        <TouchableOpacity
          style={styles.reanalyzeButton}
          onPress={reanalyzeFood}
          disabled={isAnalyzing}
          testID="reanalyze-button"
        >
          {isAnalyzing ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <Camera size={20} color={colors.white} />
              <Text style={styles.reanalyzeButtonText}>Re-analyze with AI</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          testID="cancel-button"
        >
          <X size={20} color={colors.darkGray} />
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          testID="save-button"
        >
          <Check size={20} color={colors.white} />
          <Text style={styles.saveButtonText}>Add to Diary</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

interface NutrientRowProps {
  label: string;
  value: number;
  unit: string;
  isEditing: boolean;
  onChangeText: (value: string) => void;
  testID: string;
}

function NutrientRow({ label, value, unit, isEditing, onChangeText, testID }: NutrientRowProps) {
  return (
    <View style={styles.nutrientRow}>
      <Text style={styles.nutrientLabel}>{label}</Text>
      {isEditing ? (
        <View style={styles.nutrientInputContainer}>
          <TextInput
            style={styles.nutrientInput}
            value={value.toString()}
            onChangeText={onChangeText}
            keyboardType="numeric"
            testID={`${testID}-input`}
          />
          <Text style={styles.nutrientUnit}>{unit}</Text>
        </View>
      ) : (
        <Text style={styles.nutrientValue}>
          {Math.round(value * 10) / 10} {unit}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.darkGray,
    marginTop: 16,
  },
  editButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  foodImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.lightGray,
  },
  aiIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  aiIndicatorText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  foodName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  brandName: {
    fontSize: 16,
    color: colors.darkGray,
  },
  textInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    paddingVertical: 8,
  },
  servingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servingText: {
    fontSize: 18,
    color: colors.text,
    marginLeft: 12,
  },
  servingInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  servingInput: {
    fontSize: 18,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 60,
    textAlign: 'center',
  },
  servingUnit: {
    fontSize: 18,
    color: colors.text,
    marginLeft: 8,
  },
  nutritionSubtitle: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 16,
  },
  nutritionGrid: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  nutrientLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  nutrientValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  nutrientInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nutrientInput: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    paddingVertical: 2,
    paddingHorizontal: 8,
    minWidth: 50,
    textAlign: 'center',
  },
  nutrientUnit: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 4,
  },
  reanalyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  reanalyzeButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    paddingVertical: 16,
    marginRight: 8,
  },
  cancelButtonText: {
    color: colors.darkGray,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginLeft: 8,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});