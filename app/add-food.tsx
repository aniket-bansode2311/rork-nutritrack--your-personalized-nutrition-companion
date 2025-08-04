import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Plus, Camera, Sparkles, Search, Scan } from 'lucide-react-native';

import { colors } from '@/constants/colors';
import { SearchBar } from '@/components/SearchBar';
import { FoodItem, MealEntry } from '@/types/nutrition';
import { useNutrition } from '@/hooks/useNutritionStore';

export default function AddFoodScreen() {
  const router = useRouter();
  const { mealType } = useLocalSearchParams<{ mealType: MealEntry['mealType'] }>();
  const { searchFoodItems, addMealEntry } = useNutrition();
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [aiSearchResults, setAiSearchResults] = useState<FoodItem[]>([]);
  const [isAiSearching, setIsAiSearching] = useState<boolean>(false);
  
  useEffect(() => {
    if (searchQuery.trim()) {
      const localResults = searchFoodItems(searchQuery);
      setSearchResults(localResults);
      
      // Trigger AI search for better results
      performAiSearch(searchQuery);
    } else {
      setSearchResults([]);
      setAiSearchResults([]);
    }
  }, [searchQuery, searchFoodItems]);
  
  const performAiSearch = async (query: string) => {
    if (query.length < 3) return;
    
    setIsAiSearching(true);
    try {
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a nutrition database expert. When given a food search query, return a JSON array of up to 5 relevant food items with accurate nutritional data. Each item should have: name, brand (optional), servingSize (number), servingUnit (string), calories, protein, carbs, fat, fiber, sugar, sodium. Be precise with nutritional values.'
            },
            {
              role: 'user',
              content: `Find nutritional information for: ${query}`
            }
          ]
        }),
      });
      
      const result = await response.json();
      
      try {
        const aiResults = JSON.parse(result.completion);
        const formattedResults: FoodItem[] = aiResults.map((item: any, index: number) => ({
          id: `ai-${Date.now()}-${index}`,
          name: item.name || 'Unknown Food',
          brand: item.brand || 'AI Suggested',
          servingSize: item.servingSize || 100,
          servingUnit: item.servingUnit || 'g',
          calories: item.calories || 0,
          protein: item.protein || 0,
          carbs: item.carbs || 0,
          fat: item.fat || 0,
          fiber: item.fiber || 0,
          sugar: item.sugar || 0,
          sodium: item.sodium || 0,
        }));
        
        setAiSearchResults(formattedResults);
      } catch (parseError) {
        console.error('Failed to parse AI search results:', parseError);
        setAiSearchResults([]);
      }
    } catch (error) {
      console.error('AI search error:', error);
      setAiSearchResults([]);
    } finally {
      setIsAiSearching(false);
    }
  };
  
  const handleAddFood = (foodItem: FoodItem) => {
    if (!mealType) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    addMealEntry({
      foodItem,
      servings: 1,
      mealType: mealType as MealEntry['mealType'],
      date: today,
    });
    
    router.back();
  };
  
  const renderFoodItem = ({ item, isAiResult = false }: { item: FoodItem; isAiResult?: boolean }) => (
    <TouchableOpacity 
      style={[styles.foodItem, isAiResult && styles.aiFoodItem]} 
      onPress={() => handleAddFood(item)}
      testID={`add-food-item-${item.id}`}
    >
      <View style={styles.foodInfo}>
        <View style={styles.foodNameContainer}>
          <Text style={styles.foodName}>{item.name}</Text>
          {isAiResult && <Sparkles size={16} color={colors.secondary} />}
        </View>
        {item.brand && <Text style={styles.foodBrand}>{item.brand}</Text>}
        <Text style={styles.foodServing}>
          {item.servingSize} {item.servingUnit} | {item.calories} kcal
        </Text>
        <Text style={styles.macros}>
          P: {item.protein}g • C: {item.carbs}g • F: {item.fat}g
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => handleAddFood(item)}
        testID={`add-button-${item.id}`}
      >
        <Plus size={20} color={colors.white} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
  
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      {searchQuery.trim() ? (
        <View>
          <Search size={48} color={colors.mediumGray} style={styles.emptyIcon} />
          <Text style={styles.emptyText}>No food items found.</Text>
          <Text style={styles.emptySubtext}>Try a different search term or use AI scanning.</Text>
        </View>
      ) : (
        <View>
          <Text style={styles.emptyText}>Search for food items to add to your meal.</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={() => router.push({ pathname: '/ai-food-scan', params: { mealType } })}
              testID="scan-food-button"
            >
              <Camera size={20} color={colors.white} />
              <Text style={styles.scanButtonText}>Scan Food with AI</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.scanButton, styles.barcodeButton]}
              onPress={() => router.push({ pathname: '/barcode-scanner', params: { mealType } })}
              testID="barcode-scan-button"
            >
              <Scan size={20} color={colors.white} />
              <Text style={styles.scanButtonText}>Scan Barcode</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
  
  const renderSectionHeader = (title: string, isAi: boolean = false) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {isAi && isAiSearching && (
        <ActivityIndicator size="small" color={colors.primary} />
      )}
    </View>
  );
  

  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.mealTypeText}>
          Adding to: {mealType?.charAt(0).toUpperCase() + mealType?.slice(1)}
        </Text>
      </View>
      
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search for food..."
      />
      
      {searchQuery.trim() && searchResults.length > 0 && (
        <View>
          {renderSectionHeader('Local Database')}
          <FlatList
            data={searchResults}
            renderItem={({ item }) => renderFoodItem({ item, isAiResult: false })}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      )}
      
      {searchQuery.trim() && aiSearchResults.length > 0 && (
        <View>
          {renderSectionHeader('AI Suggestions', true)}
          <FlatList
            data={aiSearchResults}
            renderItem={({ item }) => renderFoodItem({ item, isAiResult: true })}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      )}
      
      {(!searchQuery.trim() || (searchResults.length === 0 && aiSearchResults.length === 0 && !isAiSearching)) && (
        renderEmptyList()
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  mealTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  listContent: {
    paddingVertical: 8,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  foodBrand: {
    fontSize: 14,
    color: colors.darkGray,
    marginTop: 2,
  },
  foodServing: {
    fontSize: 14,
    color: colors.darkGray,
    marginTop: 2,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.mediumGray,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyIcon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  scanButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  scanButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  aiFoodItem: {
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
  },
  foodNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macros: {
    fontSize: 12,
    color: colors.mediumGray,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.darkGray,
    textTransform: 'uppercase',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barcodeButton: {
    backgroundColor: colors.secondary,
  },
});