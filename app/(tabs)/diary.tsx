import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { colors } from '@/constants/colors';
import { DateSelector } from '@/components/DateSelector';
import { MealSection } from '@/components/MealSection';
import { DailySummary } from '@/components/DailySummary';
import { WaterTracker } from '@/components/WaterTracker';
import { ActivityTracker } from '@/components/ActivityTracker';
import { useNutrition, useMealsByType } from '@/hooks/useNutritionStore';

export default function DiaryScreen() {
  const { selectedDate, setSelectedDate } = useNutrition();
  
  const breakfastEntries = useMealsByType('breakfast');
  const lunchEntries = useMealsByType('lunch');
  const dinnerEntries = useMealsByType('dinner');
  const snackEntries = useMealsByType('snack');
  
  // Calculate total calories for each meal
  const calculateTotalCalories = (entries: any[]) => {
    return entries.reduce((total, entry) => {
      return total + entry.foodItem.calories * entry.servings;
    }, 0);
  };
  
  const breakfastCalories = calculateTotalCalories(breakfastEntries);
  const lunchCalories = calculateTotalCalories(lunchEntries);
  const dinnerCalories = calculateTotalCalories(dinnerEntries);
  const snackCalories = calculateTotalCalories(snackEntries);
  
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <DateSelector 
          date={selectedDate} 
          onDateChange={setSelectedDate} 
        />
        
        <DailySummary date={selectedDate} />
        
        <MealSection
          title="Breakfast"
          mealType="breakfast"
          entries={breakfastEntries}
          totalCalories={breakfastCalories}
        />
        
        <MealSection
          title="Lunch"
          mealType="lunch"
          entries={lunchEntries}
          totalCalories={lunchCalories}
        />
        
        <MealSection
          title="Dinner"
          mealType="dinner"
          entries={dinnerEntries}
          totalCalories={dinnerCalories}
        />
        
        <MealSection
          title="Snacks"
          mealType="snack"
          entries={snackEntries}
          totalCalories={snackCalories}
        />
        
        <WaterTracker date={selectedDate} />
        
        <ActivityTracker date={selectedDate} />
      </ScrollView>
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
  scrollContent: {
    paddingVertical: 16,
    paddingBottom: 32,
  },
});