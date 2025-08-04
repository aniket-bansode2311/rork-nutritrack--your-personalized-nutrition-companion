import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Settings, Camera, Sparkles } from 'lucide-react-native';

import { colors } from '@/constants/colors';
import { CalorieCircle } from '@/components/CalorieCircle';
import { DateSelector } from '@/components/DateSelector';
import { NutritionSummary } from '@/components/NutritionSummary';
import { HealthInsights } from '@/components/HealthInsights';
import { useDailyNutrition, useNutrition } from '@/hooks/useNutritionStore';

export default function DashboardScreen() {
  const router = useRouter();
  const { selectedDate, setSelectedDate, userProfile } = useNutrition();
  const { total, goals } = useDailyNutrition();
  
  const navigateToProfile = () => {
    router.push('/profile');
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {userProfile.name}</Text>
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
        
        <View style={styles.calorieSection}>
          <Text style={styles.sectionTitle}>Daily Calories</Text>
          <View style={styles.calorieCircleContainer}>
            <CalorieCircle 
              consumed={total.calories} 
              goal={goals.calories} 
            />
          </View>
        </View>
        
        <NutritionSummary />
        
        <View style={styles.aiSection}>
          <Text style={styles.sectionTitle}>AI-Powered Logging</Text>
          <TouchableOpacity 
            style={styles.aiButton}
            onPress={() => router.push('/ai-food-scan')}
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
        
        <HealthInsights />
        
        <View style={styles.quickAddSection}>
          <Text style={styles.sectionTitle}>Quick Add</Text>
          <View style={styles.mealButtons}>
            <TouchableOpacity 
              style={styles.mealButton}
              onPress={() => router.push({ pathname: '/add-food', params: { mealType: 'breakfast' } })}
              testID="add-breakfast"
            >
              <Text style={styles.mealButtonText}>Breakfast</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.mealButton}
              onPress={() => router.push({ pathname: '/add-food', params: { mealType: 'lunch' } })}
              testID="add-lunch"
            >
              <Text style={styles.mealButtonText}>Lunch</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.mealButton}
              onPress={() => router.push({ pathname: '/add-food', params: { mealType: 'dinner' } })}
              testID="add-dinner"
            >
              <Text style={styles.mealButtonText}>Dinner</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.mealButton}
              onPress={() => router.push({ pathname: '/add-food', params: { mealType: 'snack' } })}
              testID="add-snack"
            >
              <Text style={styles.mealButtonText}>Snack</Text>
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
  quickAddSection: {
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
  mealButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  mealButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    width: '48%',
    alignItems: 'center',
  },
  mealButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
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
});