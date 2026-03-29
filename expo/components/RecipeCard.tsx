import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Clock, Users, Heart, ChefHat } from 'lucide-react-native';
import { Recipe } from '@/types/nutrition';
import { colors } from '@/constants/colors';

interface RecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
  onFavoritePress: () => void;
  isFavorite: boolean;
  testID?: string;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onPress,
  onFavoritePress,
  isFavorite,
  testID,
}) => {
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy':
        return colors.success;
      case 'medium':
        return colors.warning;
      case 'hard':
        return colors.error;
      default:
        return colors.mediumGray;
    }
  };

  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      testID={testID}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {recipe.imageUrl ? (
          <Image source={{ uri: recipe.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <ChefHat color={colors.mediumGray} size={32} />
          </View>
        )}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={onFavoritePress}
          testID={`${testID}-favorite`}
        >
          <Heart
            color={isFavorite ? colors.error : colors.white}
            fill={isFavorite ? colors.error : 'transparent'}
            size={20}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {recipe.name}
          </Text>
          {recipe.difficulty && (
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(recipe.difficulty) }]}>
              <Text style={styles.difficultyText}>{recipe.difficulty}</Text>
            </View>
          )}
        </View>

        {recipe.description && (
          <Text style={styles.description} numberOfLines={2}>
            {recipe.description}
          </Text>
        )}

        <View style={styles.metadata}>
          <View style={styles.metadataItem}>
            <Users color={colors.mediumGray} size={16} />
            <Text style={styles.metadataText}>{recipe.servings} servings</Text>
          </View>
          {totalTime > 0 && (
            <View style={styles.metadataItem}>
              <Clock color={colors.mediumGray} size={16} />
              <Text style={styles.metadataText}>{totalTime} min</Text>
            </View>
          )}
        </View>

        <View style={styles.nutrition}>
          <Text style={styles.nutritionText}>
            {Math.round(recipe.nutritionPerServing.calories)} cal
          </Text>
          <Text style={styles.nutritionText}>
            P: {Math.round(recipe.nutritionPerServing.protein)}g
          </Text>
          <Text style={styles.nutritionText}>
            C: {Math.round(recipe.nutritionPerServing.carbs)}g
          </Text>
          <Text style={styles.nutritionText}>
            F: {Math.round(recipe.nutritionPerServing.fat)}g
          </Text>
        </View>

        {recipe.tags && recipe.tags.length > 0 && (
          <View style={styles.tags}>
            {recipe.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {recipe.tags.length > 3 && (
              <Text style={styles.moreTagsText}>+{recipe.tags.length - 3}</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 160,
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
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.white,
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 14,
    color: colors.mediumGray,
    marginBottom: 12,
    lineHeight: 20,
  },
  metadata: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metadataText: {
    fontSize: 14,
    color: colors.mediumGray,
    marginLeft: 4,
  },
  nutrition: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
  },
  nutritionText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  tag: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 12,
    color: colors.mediumGray,
    fontStyle: 'italic',
  },
});