import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import {
  Heart,
  Clock,
  Users,
  ChefHat,
  Plus,
  Edit3,
  Trash2,
  Share,
  ExternalLink,
} from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useNutrition } from '@/hooks/useNutritionStore';

export default function RecipeDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    recipes,
    toggleRecipeFavorite,
    isRecipeFavorite,
    deleteRecipe,
    addRecipeEntry,
    selectedDate,
  } = useNutrition();

  const [servings, setServings] = useState<string>('1');
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');

  const recipe = recipes.find(r => r.id === id);

  if (!recipe) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Recipe Not Found' }} />
        <View style={styles.errorContainer}>
          <ChefHat color={colors.gray} size={64} />
          <Text style={styles.errorTitle}>Recipe not found</Text>
          <Text style={styles.errorText}>
            The recipe you&apos;re looking for doesn&apos;t exist or has been removed.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            testID="back-button"
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleFavoritePress = () => {
    toggleRecipeFavorite(recipe.id);
  };

  const handleEditPress = () => {
    router.push(`/edit-recipe?id=${recipe.id}`);
  };

  const handleDeletePress = () => {
    Alert.alert(
      'Delete Recipe',
      'Are you sure you want to delete this recipe? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteRecipe(recipe.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleSharePress = () => {
    Alert.alert('Share Recipe', 'Sharing functionality coming soon!');
  };

  const handleAddToMeal = () => {
    const servingCount = parseFloat(servings) || 1;
    
    addRecipeEntry({
      recipe,
      servings: servingCount,
      mealType: selectedMealType,
      date: selectedDate,
    });

    Alert.alert(
      'Recipe Added',
      `${recipe.name} has been added to your ${selectedMealType} for today.`,
      [
        { text: 'OK', onPress: () => router.back() },
      ]
    );
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy':
        return colors.success;
      case 'medium':
        return colors.warning;
      case 'hard':
        return colors.error;
      default:
        return colors.gray;
    }
  };

  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  const servingMultiplier = parseFloat(servings) || 1;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: recipe.name,
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity
                onPress={handleSharePress}
                style={styles.headerButton}
                testID="share-button"
              >
                <Share color={colors.primary} size={24} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleFavoritePress}
                style={styles.headerButton}
                testID="favorite-button"
              >
                <Heart
                  color={isRecipeFavorite(recipe.id) ? colors.error : colors.primary}
                  fill={isRecipeFavorite(recipe.id) ? colors.error : 'transparent'}
                  size={24}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEditPress}
                style={styles.headerButton}
                testID="edit-button"
              >
                <Edit3 color={colors.primary} size={24} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeletePress}
                style={styles.headerButton}
                testID="delete-button"
              >
                <Trash2 color={colors.error} size={24} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Recipe Image */}
        <View style={styles.imageContainer}>
          {recipe.imageUrl ? (
            <Image source={{ uri: recipe.imageUrl }} style={styles.image} />
          ) : (
            <View style={styles.placeholderImage}>
              <ChefHat color={colors.gray} size={64} />
            </View>
          )}
        </View>

        {/* Recipe Info */}
        <View style={styles.infoContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>{recipe.name}</Text>
            {recipe.difficulty && (
              <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(recipe.difficulty) }]}>
                <Text style={styles.difficultyText}>{recipe.difficulty}</Text>
              </View>
            )}
          </View>

          {recipe.description && (
            <Text style={styles.description}>{recipe.description}</Text>
          )}

          {/* Metadata */}
          <View style={styles.metadata}>
            <View style={styles.metadataItem}>
              <Users color={colors.gray} size={20} />
              <Text style={styles.metadataText}>{recipe.servings} servings</Text>
            </View>
            {recipe.prepTime && (
              <View style={styles.metadataItem}>
                <Clock color={colors.gray} size={20} />
                <Text style={styles.metadataText}>Prep: {recipe.prepTime} min</Text>
              </View>
            )}
            {recipe.cookTime && (
              <View style={styles.metadataItem}>
                <Clock color={colors.gray} size={20} />
                <Text style={styles.metadataText}>Cook: {recipe.cookTime} min</Text>
              </View>
            )}
          </View>

          {totalTime > 0 && (
            <View style={styles.totalTimeContainer}>
              <Text style={styles.totalTimeText}>Total Time: {totalTime} minutes</Text>
            </View>
          )}

          {/* Source URL */}
          {recipe.sourceUrl && (
            <TouchableOpacity style={styles.sourceContainer} testID="source-link">
              <ExternalLink color={colors.primary} size={16} />
              <Text style={styles.sourceText}>View Original Recipe</Text>
            </TouchableOpacity>
          )}

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tags}>
                {recipe.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Nutrition */}
          <View style={styles.nutritionContainer}>
            <Text style={styles.sectionTitle}>Nutrition per Serving</Text>
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {Math.round(recipe.nutritionPerServing.calories * servingMultiplier)}
                </Text>
                <Text style={styles.nutritionLabel}>Calories</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {Math.round(recipe.nutritionPerServing.protein * servingMultiplier)}g
                </Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {Math.round(recipe.nutritionPerServing.carbs * servingMultiplier)}g
                </Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {Math.round(recipe.nutritionPerServing.fat * servingMultiplier)}g
                </Text>
                <Text style={styles.nutritionLabel}>Fat</Text>
              </View>
            </View>
          </View>

          {/* Ingredients */}
          <View style={styles.ingredientsContainer}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {recipe.ingredients.map((ingredient, index) => (
              <View key={ingredient.id} style={styles.ingredient}>
                <Text style={styles.ingredientText}>
                  {Math.round(ingredient.quantity * servingMultiplier * 10) / 10} {ingredient.unit} {ingredient.foodItem.name}
                </Text>
              </View>
            ))}
          </View>

          {/* Instructions */}
          {recipe.instructions && recipe.instructions.length > 0 && (
            <View style={styles.instructionsContainer}>
              <Text style={styles.sectionTitle}>Instructions</Text>
              {recipe.instructions.map((instruction, index) => (
                <View key={index} style={styles.instruction}>
                  <View style={styles.instructionNumber}>
                    <Text style={styles.instructionNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.instructionText}>{instruction}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Add to Meal */}
          <View style={styles.addToMealContainer}>
            <Text style={styles.sectionTitle}>Add to Meal</Text>
            
            <View style={styles.servingsContainer}>
              <Text style={styles.servingsLabel}>Servings:</Text>
              <TextInput
                style={styles.servingsInput}
                value={servings}
                onChangeText={setServings}
                keyboardType="numeric"
                testID="servings-input"
              />
            </View>

            <View style={styles.mealTypeContainer}>
              <Text style={styles.mealTypeLabel}>Meal Type:</Text>
              <View style={styles.mealTypeButtons}>
                {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(mealType => (
                  <TouchableOpacity
                    key={mealType}
                    style={[
                      styles.mealTypeButton,
                      selectedMealType === mealType && styles.mealTypeButtonActive,
                    ]}
                    onPress={() => setSelectedMealType(mealType)}
                    testID={`meal-type-${mealType}`}
                  >
                    <Text
                      style={[
                        styles.mealTypeButtonText,
                        selectedMealType === mealType && styles.mealTypeButtonTextActive,
                      ]}
                    >
                      {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddToMeal}
              testID="add-to-meal-button"
            >
              <Plus color={colors.white} size={20} />
              <Text style={styles.addButtonText}>Add to {selectedMealType}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 16,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    height: 250,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginRight: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 16,
    color: colors.gray,
    lineHeight: 24,
    marginBottom: 16,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    marginBottom: 8,
  },
  metadataText: {
    fontSize: 16,
    color: colors.gray,
    marginLeft: 8,
  },
  totalTimeContainer: {
    backgroundColor: colors.primary + '20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  totalTimeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sourceText: {
    fontSize: 16,
    color: colors.primary,
    marginLeft: 8,
    textDecorationLine: 'underline',
  },
  tagsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  nutritionContainer: {
    marginBottom: 24,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  nutritionLabel: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 4,
  },
  ingredientsContainer: {
    marginBottom: 24,
  },
  ingredient: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  ingredientText: {
    fontSize: 16,
    color: colors.text,
  },
  instructionsContainer: {
    marginBottom: 24,
  },
  instruction: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  instructionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  instructionNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  addToMealContainer: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  servingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  servingsLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginRight: 12,
  },
  servingsInput: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: colors.text,
    width: 80,
    textAlign: 'center',
  },
  mealTypeContainer: {
    marginBottom: 16,
  },
  mealTypeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  mealTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  mealTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
    marginRight: 8,
    marginBottom: 8,
  },
  mealTypeButtonActive: {
    backgroundColor: colors.primary,
  },
  mealTypeButtonText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  mealTypeButtonTextActive: {
    color: colors.white,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});