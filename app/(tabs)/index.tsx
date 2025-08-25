import React, { useMemo, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Settings, Camera, Sparkles, Plus, TrendingUp, Target } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';

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
import { NetworkDebugger } from '@/components/NetworkDebugger';

const DashboardScreenComponent: React.FC = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
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
  
  // Show network debugger if there are network errors
  const showNetworkDebugger = errorState.hasError && 
    (errorState.error?.message?.includes('NETWORK_ERROR') ||
     errorState.error?.message?.includes('Failed to fetch') ||
     errorState.error?.message?.includes('NOT_FOUND'));
  
  return (
    <LoadingState
      loading={isLoading}
      error={errorState.hasError ? errorState.error : null}
      loadingMessage="Loading your nutrition dashboard..."
      onRetry={() => {
        // Platform-aware retry logic
        if (Platform.OS === 'web') {
          window.location.reload();
        } else {
          // On mobile, refetch queries instead of reloading
          queryClient.refetchQueries({ type: 'active' });
        }
      }}
    >
      {showNetworkDebugger && (
        <NetworkDebugger 
          onRetry={() => {
            if (Platform.OS === 'web') {
              window.location.reload();
            } else {
              queryClient.refetchQueries({ type: 'active' });
            }
          }}
        />
      )}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
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
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
    fontWeight: '500',
  },
  calorieSection: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  calorieCircleContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  quickActionsSection: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.gray100,
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  aiSection: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  aiButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  aiButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 18,
    marginHorizontal: 12,
    letterSpacing: -0.3,
  },
  aiDescription: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
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