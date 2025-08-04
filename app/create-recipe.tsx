import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Plus, Minus, Save, Search, X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useNutrition } from '@/hooks/useNutritionStore';
import { Recipe, RecipeIngredient, FoodItem } from '@/types/nutrition';

interface IngredientInput {
  id: string;
  foodItem: FoodItem | null;
  quantity: string;
  unit: string;
}

const COMMON_UNITS = ['g', 'kg', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'slice'];
const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard'] as const;

export default function CreateRecipeScreen() {
  const { addRecipe, searchFoodItems, calculateRecipeNutrition } = useNutrition();

  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [servings, setServings] = useState<string>('4');
  const [prepTime, setPrepTime] = useState<string>('');
  const [cookTime, setCookTime] = useState<string>('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [category, setCategory] = useState<string>('');
  const [tags, setTags] = useState<string>('');
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [ingredients, setIngredients] = useState<IngredientInput[]>([
    { id: '1', foodItem: null, quantity: '', unit: 'g' }
  ]);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [sourceUrl, setSourceUrl] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [activeIngredientId, setActiveIngredientId] = useState<string | null>(null);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = searchFoodItems(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const selectFoodItem = (foodItem: FoodItem) => {
    if (activeIngredientId) {
      setIngredients(prev =>
        prev.map(ing =>
          ing.id === activeIngredientId
            ? { ...ing, foodItem, unit: foodItem.servingUnit }
            : ing
        )
      );
      setActiveIngredientId(null);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const addIngredient = () => {
    const newIngredient: IngredientInput = {
      id: Date.now().toString(),
      foodItem: null,
      quantity: '',
      unit: 'g',
    };
    setIngredients(prev => [...prev, newIngredient]);
  };

  const removeIngredient = (id: string) => {
    if (ingredients.length > 1) {
      setIngredients(prev => prev.filter(ing => ing.id !== id));
    }
  };

  const updateIngredient = (id: string, field: keyof IngredientInput, value: string) => {
    setIngredients(prev =>
      prev.map(ing =>
        ing.id === id ? { ...ing, [field]: value } : ing
      )
    );
  };

  const addInstruction = () => {
    setInstructions(prev => [...prev, '']);
  };

  const removeInstruction = (index: number) => {
    if (instructions.length > 1) {
      setInstructions(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateInstruction = (index: number, value: string) => {
    setInstructions(prev =>
      prev.map((inst, i) => (i === index ? value : inst))
    );
  };

  const validateForm = (): string | null => {
    if (!name.trim()) return 'Recipe name is required';
    if (!servings.trim() || isNaN(Number(servings)) || Number(servings) <= 0) {
      return 'Valid number of servings is required';
    }
    
    const validIngredients = ingredients.filter(ing => 
      ing.foodItem && ing.quantity.trim() && !isNaN(Number(ing.quantity)) && Number(ing.quantity) > 0
    );
    
    if (validIngredients.length === 0) {
      return 'At least one valid ingredient is required';
    }

    return null;
  };

  const handleSave = () => {
    const error = validateForm();
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }

    const validIngredients: RecipeIngredient[] = ingredients
      .filter(ing => ing.foodItem && ing.quantity.trim() && !isNaN(Number(ing.quantity)))
      .map(ing => ({
        id: ing.id,
        foodItem: ing.foodItem!,
        quantity: Number(ing.quantity),
        unit: ing.unit,
      }));

    const validInstructions = instructions.filter(inst => inst.trim());

    const recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> = {
      name: name.trim(),
      description: description.trim() || undefined,
      servings: Number(servings),
      prepTime: prepTime.trim() ? Number(prepTime) : undefined,
      cookTime: cookTime.trim() ? Number(cookTime) : undefined,
      difficulty,
      category: category.trim() || undefined,
      tags: tags.trim() ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
      ingredients: validIngredients,
      instructions: validInstructions.length > 0 ? validInstructions : undefined,
      imageUrl: imageUrl.trim() || undefined,
      sourceUrl: sourceUrl.trim() || undefined,
      nutritionPerServing: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    };

    // Calculate nutrition
    const tempRecipe = { ...recipeData, id: 'temp', createdAt: '', updatedAt: '' };
    const nutrition = calculateRecipeNutrition(tempRecipe);
    recipeData.nutritionPerServing = nutrition;

    try {
      addRecipe(recipeData);
      Alert.alert(
        'Success',
        'Recipe created successfully!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create recipe. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Create Recipe',
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSave}
              style={styles.saveButton}
              testID="save-button"
            >
              <Save color={colors.primary} size={24} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Recipe Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter recipe name"
              testID="recipe-name-input"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your recipe..."
              multiline
              numberOfLines={3}
              testID="description-input"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Servings *</Text>
              <TextInput
                style={styles.input}
                value={servings}
                onChangeText={setServings}
                placeholder="4"
                keyboardType="numeric"
                testID="servings-input"
              />
            </View>

            <View style={[styles.inputGroup, styles.flex1, styles.marginLeft]}>
              <Text style={styles.label}>Difficulty</Text>
              <View style={styles.difficultyButtons}>
                {DIFFICULTY_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.difficultyButton,
                      difficulty === option && styles.difficultyButtonActive,
                    ]}
                    onPress={() => setDifficulty(option)}
                    testID={`difficulty-${option}`}
                  >
                    <Text
                      style={[
                        styles.difficultyButtonText,
                        difficulty === option && styles.difficultyButtonTextActive,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Prep Time (min)</Text>
              <TextInput
                style={styles.input}
                value={prepTime}
                onChangeText={setPrepTime}
                placeholder="15"
                keyboardType="numeric"
                testID="prep-time-input"
              />
            </View>

            <View style={[styles.inputGroup, styles.flex1, styles.marginLeft]}>
              <Text style={styles.label}>Cook Time (min)</Text>
              <TextInput
                style={styles.input}
                value={cookTime}
                onChangeText={setCookTime}
                placeholder="30"
                keyboardType="numeric"
                testID="cook-time-input"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <TextInput
              style={styles.input}
              value={category}
              onChangeText={setCategory}
              placeholder="e.g., Main Course, Breakfast, Dessert"
              testID="category-input"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tags (comma separated)</Text>
            <TextInput
              style={styles.input}
              value={tags}
              onChangeText={setTags}
              placeholder="e.g., healthy, quick, vegetarian"
              testID="tags-input"
            />
          </View>
        </View>

        {/* Ingredients */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <TouchableOpacity
              onPress={addIngredient}
              style={styles.addButton}
              testID="add-ingredient-button"
            >
              <Plus color={colors.primary} size={20} />
            </TouchableOpacity>
          </View>

          {/* Food Search */}
          {activeIngredientId && (
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Search color={colors.gray} size={20} />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={handleSearch}
                  placeholder="Search for food items..."
                  testID="food-search-input"
                />
                <TouchableOpacity
                  onPress={() => {
                    setActiveIngredientId(null);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  testID="close-search-button"
                >
                  <X color={colors.gray} size={20} />
                </TouchableOpacity>
              </View>

              {searchResults.length > 0 && (
                <View style={styles.searchResults}>
                  {searchResults.slice(0, 5).map(item => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.searchResultItem}
                      onPress={() => selectFoodItem(item)}
                      testID={`search-result-${item.id}`}
                    >
                      <Text style={styles.searchResultText}>{item.name}</Text>
                      {item.brand && (
                        <Text style={styles.searchResultBrand}>{item.brand}</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {ingredients.map((ingredient, index) => (
            <View key={ingredient.id} style={styles.ingredientRow}>
              <TouchableOpacity
                style={[styles.foodItemButton, ingredient.foodItem && styles.foodItemButtonSelected]}
                onPress={() => setActiveIngredientId(ingredient.id)}
                testID={`ingredient-food-${index}`}
              >
                <Text style={[styles.foodItemButtonText, ingredient.foodItem && styles.foodItemButtonTextSelected]}>
                  {ingredient.foodItem ? ingredient.foodItem.name : 'Select food item'}
                </Text>
              </TouchableOpacity>

              <TextInput
                style={styles.quantityInput}
                value={ingredient.quantity}
                onChangeText={(value) => updateIngredient(ingredient.id, 'quantity', value)}
                placeholder="Amount"
                keyboardType="numeric"
                testID={`ingredient-quantity-${index}`}
              />

              <View style={styles.unitContainer}>
                <Text style={styles.unitText}>{ingredient.unit}</Text>
              </View>

              <TouchableOpacity
                onPress={() => removeIngredient(ingredient.id)}
                style={styles.removeButton}
                testID={`remove-ingredient-${index}`}
              >
                <Minus color={colors.error} size={20} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <TouchableOpacity
              onPress={addInstruction}
              style={styles.addButton}
              testID="add-instruction-button"
            >
              <Plus color={colors.primary} size={20} />
            </TouchableOpacity>
          </View>

          {instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionRow}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>{index + 1}</Text>
              </View>
              <TextInput
                style={styles.instructionInput}
                value={instruction}
                onChangeText={(value) => updateInstruction(index, value)}
                placeholder={`Step ${index + 1}...`}
                multiline
                testID={`instruction-${index}`}
              />
              <TouchableOpacity
                onPress={() => removeInstruction(index)}
                style={styles.removeButton}
                testID={`remove-instruction-${index}`}
              >
                <Minus color={colors.error} size={20} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Additional Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Image URL</Text>
            <TextInput
              style={styles.input}
              value={imageUrl}
              onChangeText={setImageUrl}
              placeholder="https://example.com/image.jpg"
              testID="image-url-input"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Source URL</Text>
            <TextInput
              style={styles.input}
              value={sourceUrl}
              onChangeText={setSourceUrl}
              placeholder="https://example.com/recipe"
              testID="source-url-input"
            />
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
  saveButton: {
    marginRight: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  addButton: {
    padding: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  marginLeft: {
    marginLeft: 12,
  },
  difficultyButtons: {
    flexDirection: 'row',
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: colors.lightGray,
    marginRight: 4,
    alignItems: 'center',
  },
  difficultyButtonActive: {
    backgroundColor: colors.primary,
  },
  difficultyButtonText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  difficultyButtonTextActive: {
    color: colors.white,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: colors.text,
  },
  searchResults: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: colors.white,
    maxHeight: 200,
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  searchResultText: {
    fontSize: 16,
    color: colors.text,
  },
  searchResultBrand: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 2,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  foodItemButton: {
    flex: 2,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginRight: 8,
  },
  foodItemButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  foodItemButtonText: {
    fontSize: 14,
    color: colors.gray,
  },
  foodItemButtonTextSelected: {
    color: colors.primary,
    fontWeight: '500',
  },
  quantityInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    marginRight: 8,
  },
  unitContainer: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    marginRight: 8,
    minWidth: 40,
  },
  unitText: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
  },
  removeButton: {
    padding: 4,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  instructionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 8,
  },
  instructionNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  instructionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    marginRight: 8,
    minHeight: 48,
    textAlignVertical: 'top',
  },
  bottomPadding: {
    height: 32,
  },
});