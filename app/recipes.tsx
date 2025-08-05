import React, { useState, useMemo } from 'react';
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
import { Plus, Search, Filter, Heart, ChefHat, Link } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useNutrition } from '@/hooks/useNutritionStore';
import { RecipeCard } from '@/components/RecipeCard';

const CATEGORIES = ['All', 'Breakfast', 'Main Course', 'Salad', 'Dessert', 'Snack'];
const TAGS = ['healthy', 'quick', 'vegetarian', 'vegan', 'keto', 'low-carb', 'high-protein'];

export default function RecipesScreen() {
  const {
    recipes,
    searchRecipes,
    toggleRecipeFavorite,
    isRecipeFavorite,
    getFavoriteRecipes,
    getRecipesByCategory,
    getRecipesByTag,
    importRecipeFromUrl,
  } = useNutrition();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [importUrl, setImportUrl] = useState<string>('');

  const filteredRecipes = useMemo(() => {
    let filtered = recipes;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = searchRecipes(searchQuery);
    }

    // Apply category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(recipe => recipe.category === selectedCategory);
    }

    // Apply tag filters
    if (selectedTags.length > 0) {
      filtered = filtered.filter(recipe =>
        selectedTags.every(tag => recipe.tags?.includes(tag))
      );
    }

    // Apply favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter(recipe => isRecipeFavorite(recipe.id));
    }

    return filtered;
  }, [recipes, searchQuery, selectedCategory, selectedTags, showFavoritesOnly, searchRecipes, isRecipeFavorite]);

  const handleRecipePress = (recipeId: string) => {
    router.push(`/recipe-details?id=${recipeId}`);
  };

  const handleFavoritePress = (recipeId: string) => {
    toggleRecipeFavorite(recipeId);
  };

  const handleCreateRecipe = () => {
    router.push('/create-recipe');
  };

  const handleImportRecipe = async () => {
    if (!importUrl.trim()) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    try {
      await importRecipeFromUrl(importUrl.trim());
      setImportUrl('');
      Alert.alert('Success', 'Recipe imported successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to import recipe. This feature is coming soon!');
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Recipes',
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity
                onPress={() => setShowFilters(!showFilters)}
                style={styles.headerButton}
                testID="filter-button"
              >
                <Filter color={colors.primary} size={24} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateRecipe}
                style={styles.headerButton}
                testID="create-recipe-button"
              >
                <Plus color={colors.primary} size={24} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search color={colors.mediumGray} size={20} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search recipes..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              testID="search-input"
            />
          </View>
        </View>

        {/* Import Recipe */}
        <View style={styles.importContainer}>
          <Text style={styles.sectionTitle}>Import Recipe</Text>
          <View style={styles.importInputContainer}>
            <Link color={colors.mediumGray} size={20} />
            <TextInput
              style={styles.importInput}
              placeholder="Paste recipe URL here..."
              value={importUrl}
              onChangeText={setImportUrl}
              testID="import-url-input"
            />
            <TouchableOpacity
              onPress={handleImportRecipe}
              style={styles.importButton}
              testID="import-button"
            >
              <Text style={styles.importButtonText}>Import</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filters */}
        {showFilters && (
          <View style={styles.filtersContainer}>
            {/* Categories */}
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Categories</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterOptions}>
                  {CATEGORIES.map(category => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.filterOption,
                        selectedCategory === category && styles.filterOptionActive,
                      ]}
                      onPress={() => setSelectedCategory(category)}
                      testID={`category-${category.toLowerCase()}`}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          selectedCategory === category && styles.filterOptionTextActive,
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Tags */}
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Tags</Text>
              <View style={styles.tagsContainer}>
                {TAGS.map(tag => (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.tagOption,
                      selectedTags.includes(tag) && styles.tagOptionActive,
                    ]}
                    onPress={() => toggleTag(tag)}
                    testID={`tag-${tag}`}
                  >
                    <Text
                      style={[
                        styles.tagOptionText,
                        selectedTags.includes(tag) && styles.tagOptionTextActive,
                      ]}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Favorites Toggle */}
            <TouchableOpacity
              style={styles.favoritesToggle}
              onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
              testID="favorites-toggle"
            >
              <Heart
                color={showFavoritesOnly ? colors.error : colors.mediumGray}
                fill={showFavoritesOnly ? colors.error : 'transparent'}
                size={20}
              />
              <Text
                style={[
                  styles.favoritesToggleText,
                  showFavoritesOnly && styles.favoritesToggleTextActive,
                ]}
              >
                Show favorites only
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Results */}
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsCount}>
            {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''} found
          </Text>

          {filteredRecipes.length === 0 ? (
            <View style={styles.emptyState}>
              <ChefHat color={colors.mediumGray} size={64} />
              <Text style={styles.emptyStateTitle}>No recipes found</Text>
              <Text style={styles.emptyStateText}>
                Try adjusting your search or filters, or create a new recipe!
              </Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateRecipe}
                testID="empty-create-button"
              >
                <Plus color={colors.white} size={20} />
                <Text style={styles.createButtonText}>Create Recipe</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.recipesList}>
              {filteredRecipes.map(recipe => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onPress={() => handleRecipePress(recipe.id)}
                  onFavoritePress={() => handleFavoritePress(recipe.id)}
                  isFavorite={isRecipeFavorite(recipe.id)}
                  testID={`recipe-card-${recipe.id}`}
                />
              ))}
            </View>
          )}
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
    padding: 16,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
  },
  importContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  importInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  importInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
  },
  importButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  importButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  filtersContainer: {
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
  filterSection: {
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
    marginRight: 8,
  },
  filterOptionActive: {
    backgroundColor: colors.primary,
  },
  filterOptionText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: colors.white,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.lightGray,
    marginRight: 8,
    marginBottom: 8,
  },
  tagOptionActive: {
    backgroundColor: colors.primary,
  },
  tagOptionText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  tagOptionTextActive: {
    color: colors.white,
  },
  favoritesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  favoritesToggleText: {
    fontSize: 16,
    color: colors.gray,
    marginLeft: 8,
  },
  favoritesToggleTextActive: {
    color: colors.error,
    fontWeight: '500',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsCount: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  recipesList: {
    paddingBottom: 24,
  },
});