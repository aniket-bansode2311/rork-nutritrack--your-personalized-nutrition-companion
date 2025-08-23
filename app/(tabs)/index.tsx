import React, { useMemo, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Settings, Camera, Sparkles, Plus, TrendingUp, Target } from 'lucide-react-native';

import { colors } from '@/constants/colors';
import { CalorieCircle } from '@/components/CalorieCircle';
import { DateSelector } from '@/components/DateSelector';
import { NutritionSummary } from '@/components/NutritionSummary';
import { HealthInsights } from '@/components/HealthInsights';
import { MealSection } from '@/components/MealSection';
import InsightPreviewCard from '@/components/insights/InsightPreviewCard';
import { useDailyNutrition, useNutrition, useMealsByType } from '@/hooks/useNutritionStore';
import { LoadingState } from '@/components/LoadingState';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useToast } from '@/components/ToastProvider';

const DashboardScreenComponent: React.FC = () => {
  const router = useRouter();
  const { selectedDate, setSelectedDate, userProfile, isLoading } = useNutrition();
  const { total, goals, remaining } = useDailyNutrition();
  const { errorState, handleError, handleAsyncOperation } = useErrorHandler({
    showAlert: false, // We'll use toast instead
  });
  const { showError, showSuccess } = useToast();
  
  // Get meals by type for the selected date
  const breakfastMeals = useMealsByType('breakfast');
  const lunchMeals = useMealsByType('lunch');
  const dinnerMeals = useMealsByType('dinner');
  const snackMeals = useMealsByType('snack');
  
  // Memoize calorie calculations
  const mealCalories = useMemo(() => {
    const calculateMealCalories = (meals: any[]) => {
      return meals.reduce((total, meal) => {
        return total + (meal.foodItem.calories * meal.servings);
      }, 0);
    };
    
    return {
      breakfast: calculateMealCalories(breakfastMeals),
      lunch: calculateMealCalories(lunchMeals),
      dinner: calculateMealCalories(dinnerMeals),
      snack: calculateMealCalories(snackMeals),
    };
  }, [breakfastMeals, lunchMeals, dinnerMeals, snackMeals]);
  
  // Memoize navigation handlers with error handling
  const navigateToProfile = useCallback(async () => {
    await handleAsyncOperation(async () => {
      router.push('/profile');
    }, 'navigation');
  }, [router, handleAsyncOperation]);

  const navigateToGoalReview = useCallback(async () => {
    await handleAsyncOperation(async () => {
      router.push('/goal-review');
    }, 'navigation');
  }, [router, handleAsyncOperation]);
  
  const navigateToAIFoodScan = useCallback(async () => {
    await handleAsyncOperation(async () => {
      router.push('/ai-food-scan');
    }, 'navigation');
  }, [router, handleAsyncOperation]);
  
  const navigateToBarcodeScanner = useCallback(async () => {
    await handleAsyncOperation(async () => {
      router.push('/barcode-scanner');
    }, 'navigation');
  }, [router, handleAsyncOperation]);
  
  const navigateToCreateFood = useCallback(async () => {
    await handleAsyncOperation(async () => {
      router.push('/create-food');
    }, 'navigation');
  }, [router, handleAsyncOperation]);
  
  const navigateToRecipes = useCallback(async () => {
    await handleAsyncOperation(async () => {
      router.push('/recipes');
    }, 'navigation');
  }, [router, handleAsyncOperation]);
  
  // Show error state if there's an error
  React.useEffect(() => {
    if (errorState.hasError && errorState.error) {
      showError(errorState.error.message);
    }
  }, [errorState.hasError, errorState.error, showError]);
  
  return (
    <LoadingState
      loading={isLoading}
      error={errorState.hasError ? errorState.error : null}
      loadingMessage="Loading your nutrition dashboard..."
      onRetry={() => {
        // Trigger a refetch of data
        window.location.reload();
      }}
    >
      <DashboardContent
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        userProfile={userProfile}
        total={total}
        goals={goals}
        remaining={remaining}
        mealCalories={mealCalories}
        breakfastMeals={breakfastMeals}
        lunchMeals={lunchMeals}
        dinnerMeals={dinnerMeals}
        snackMeals={snackMeals}
        navigateToProfile={navigateToProfile}
        navigateToAIFoodScan={navigateToAIFoodScan}
        navigateToBarcodeScanner={navigateToBarcodeScanner}
        navigateToCreateFood={navigateToCreateFood}
        navigateToRecipes={navigateToRecipes}
      />
    </LoadingState>
  );
};

interface DashboardContentProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  userProfile: any;
  total: any;
  goals: any;
  remaining: any;
  mealCalories: any;
  breakfastMeals: any[];
  lunchMeals: any[];
  dinnerMeals: any[];
  snackMeals: any[];
  navigateToProfile: () => void;
  navigateToAIFoodScan: () => void;
  navigateToBarcodeScanner: () => void;
  navigateToCreateFood: () => void;
  navigateToRecipes: () => void;
}

const DashboardContent: React.FC<DashboardContentProps> = ({
  selectedDate,
  setSelectedDate,
  userProfile,
  total,
  goals,
  remaining,
  mealCalories,
  breakfastMeals,
  lunchMeals,
  dinnerMeals,
  snackMeals,
  navigateToProfile,
  navigateToAIFoodScan,
  navigateToBarcodeScanner,
  navigateToCreateFood,
  navigateToRecipes,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {userProfile?.name || 'there'}</Text>
        <TouchableOpacity onPress={navigateToProfile} testID="profile-button">
          <Settings color={colors.text} size={24} />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <DateSelector 
          date={selectedDate} 
          onDateChange={setSelectedDate} 
        />
        
        {/* Daily Overview Cards */}
        <View style={styles.overviewCards}>
          <View style={styles.overviewCard}>
            <View style={styles.cardIcon}>
              <Target size={20} color={colors.primary} />
            </View>
            <Text style={styles.cardValue}>{total.calories.toFixed(0)}</Text>
            <Text style={styles.cardLabel}>Calories</Text>
            <Text style={styles.cardSubtext}>{remaining.calories > 0 ? `${remaining.calories.toFixed(0)} left` : 'Goal reached!'}</Text>
          </View>
          
          <View style={styles.overviewCard}>
            <View style={styles.cardIcon}>
              <TrendingUp size={20} color={colors.success} />
            </View>
            <Text style={styles.cardValue}>{total.protein.toFixed(0)}g</Text>
            <Text style={styles.cardLabel}>Protein</Text>
            <Text style={styles.cardSubtext}>{((total.protein / goals.protein) * 100).toFixed(0)}% of goal</Text>
          </View>
        </View>
        
        {/* Calorie Progress Circle */}
        <View style={styles.calorieSection}>
          <Text style={styles.sectionTitle}>Daily Progress</Text>
          <View style={styles.calorieCircleContainer}>
            <CalorieCircle 
              consumed={total.calories} 
              goal={goals.calories} 
            />
          </View>
        </View>
        
        {/* Macronutrient Summary */}
        <NutritionSummary />
        
        <View style={styles.aiSection}>
          <Text style={styles.sectionTitle}>AI-Powered Logging</Text>
          <TouchableOpacity 
            style={styles.aiButton}
            onPress={navigateToAIFoodScan}
            testID="ai-food-scan"
          >
            <Camera size={24} color={colors.white} />
            <Text style={styles.aiButtonText}>Scan Food with AI</Text>
            <Sparkles size={20} color={colors.secondary} />
          </TouchableOpacity>
          <Text style={styles.aiDescription}>
            Point your camera at any meal for instant recognition and accurate portion sizing
          </Text>
        </View>
        
        <InsightPreviewCard />
        
        <HealthInsights />
        
        {/* Meal Sections */}
        <MealSection
          title="Breakfast"
          mealType="breakfast"
          entries={breakfastMeals}
          totalCalories={mealCalories.breakfast}
        />
        
        <MealSection
          title="Lunch"
          mealType="lunch"
          entries={lunchMeals}
          totalCalories={mealCalories.lunch}
        />
        
        <MealSection
          title="Dinner"
          mealType="dinner"
          entries={dinnerMeals}
          totalCalories={mealCalories.dinner}
        />
        
        <MealSection
          title="Snacks"
          mealType="snack"
          entries={snackMeals}
          totalCalories={mealCalories.snack}
        />
        
        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={navigateToBarcodeScanner}
              testID="barcode-scanner"
            >
              <View style={styles.quickActionIcon}>
                <Camera size={24} color={colors.white} />
              </View>
              <Text style={styles.quickActionText}>Scan Barcode</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={navigateToCreateFood}
              testID="create-food"
            >
              <View style={styles.quickActionIcon}>
                <Plus size={24} color={colors.white} />
              </View>
              <Text style={styles.quickActionText}>Create Food</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={navigateToRecipes}
              testID="view-recipes"
            >
              <View style={styles.quickActionIcon}>
                <Sparkles size={24} color={colors.white} />
              </View>
              <Text style={styles.quickActionText}>My Recipes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

DashboardScreenComponent.displayName = 'DashboardScreen';

export default React.memo(DashboardScreenComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingBottom: 32,
  },
  overviewCards: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 8,
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.darkGray,
    marginBottom: 2,
  },
  cardSubtext: {
    fontSize: 12,
    color: colors.mediumGray,
    textAlign: 'center',
  },
  calorieSection: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  calorieCircleContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  quickActionsSection: {
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
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  aiSection: {
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
  aiButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  aiButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 18,
    marginHorizontal: 12,
  },
  aiDescription: {
    fontSize: 14,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
  },
});