import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, ArrowLeft } from 'lucide-react-native';

import { colors } from '@/constants/colors';
import { useProfile } from '@/hooks/useProfile';

interface OnboardingData {
  name: string;
  age: string;
  gender: 'male' | 'female' | 'other' | '';
  weight: string;
  height: string;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very active' | '';
  goal: 'lose' | 'maintain' | 'gain' | '';
}

const STEPS = [
  { id: 'personal', title: 'Personal Info', subtitle: 'Tell us about yourself' },
  { id: 'physical', title: 'Physical Stats', subtitle: 'Your current measurements' },
  { id: 'lifestyle', title: 'Lifestyle', subtitle: 'Activity level and goals' },
  { id: 'goals', title: 'Your Goals', subtitle: 'What do you want to achieve?' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { createProfile, calculateNutritionGoals } = useProfile();
  
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    age: '',
    gender: '',
    weight: '',
    height: '',
    activityLevel: '',
    goal: '',
  });

  const updateData = (field: keyof OnboardingData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 0: // Personal Info
        return data.name.trim().length >= 2 && data.age && parseInt(data.age) > 0 && data.gender;
      case 1: // Physical Stats
        return data.weight && parseFloat(data.weight) > 0 && data.height && parseFloat(data.height) > 0;
      case 2: // Lifestyle
        return data.activityLevel;
      case 3: // Goals
        return data.goal;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleComplete();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    
    try {
      const nutritionGoals = calculateNutritionGoals(
        parseFloat(data.weight),
        parseFloat(data.height),
        parseInt(data.age),
        data.gender as 'male' | 'female' | 'other',
        data.activityLevel as 'sedentary' | 'light' | 'moderate' | 'active' | 'very active',
        data.goal as 'lose' | 'maintain' | 'gain'
      );

      const { error } = await createProfile({
        email: '', // Will be set by the hook from auth user
        name: data.name.trim(),
        age: parseInt(data.age),
        gender: data.gender as 'male' | 'female' | 'other',
        weight: parseFloat(data.weight),
        height: parseFloat(data.height),
        activity_level: data.activityLevel as 'sedentary' | 'light' | 'moderate' | 'active' | 'very active',
        goal: data.goal as 'lose' | 'maintain' | 'gain',
        calories_goal: nutritionGoals.calories,
        protein_goal: nutritionGoals.protein,
        carbs_goal: nutritionGoals.carbs,
        fat_goal: nutritionGoals.fat,
      });

      if (error) {
        Alert.alert('Error', error);
        return;
      }

      // Navigation will be handled by the auth state change
      console.log('Profile created successfully');
    } catch (error) {
      console.error('Onboarding error:', error);
      Alert.alert('Error', 'Failed to complete setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderPersonalInfo = () => (
    <View style={styles.stepContent}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={data.name}
          onChangeText={(text) => updateData('name', text)}
          placeholder="Enter your full name"
          placeholderTextColor={colors.mediumGray}
          autoCapitalize="words"
          testID="name-input"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Age</Text>
        <TextInput
          style={styles.input}
          value={data.age}
          onChangeText={(text) => updateData('age', text)}
          placeholder="Enter your age"
          placeholderTextColor={colors.mediumGray}
          keyboardType="numeric"
          testID="age-input"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Gender</Text>
        <View style={styles.optionButtons}>
          {(['male', 'female', 'other'] as const).map((gender) => (
            <TouchableOpacity
              key={gender}
              style={[
                styles.optionButton,
                data.gender === gender && styles.selectedOptionButton,
              ]}
              onPress={() => updateData('gender', gender)}
              testID={`gender-${gender}`}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  data.gender === gender && styles.selectedOptionButtonText,
                ]}
              >
                {gender.charAt(0).toUpperCase() + gender.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderPhysicalStats = () => (
    <View style={styles.stepContent}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Weight (kg)</Text>
        <TextInput
          style={styles.input}
          value={data.weight}
          onChangeText={(text) => updateData('weight', text)}
          placeholder="Enter your weight"
          placeholderTextColor={colors.mediumGray}
          keyboardType="numeric"
          testID="weight-input"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Height (cm)</Text>
        <TextInput
          style={styles.input}
          value={data.height}
          onChangeText={(text) => updateData('height', text)}
          placeholder="Enter your height"
          placeholderTextColor={colors.mediumGray}
          keyboardType="numeric"
          testID="height-input"
        />
      </View>
    </View>
  );

  const renderLifestyle = () => (
    <View style={styles.stepContent}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Activity Level</Text>
        <Text style={styles.description}>How active are you on a typical day?</Text>
        
        <View style={styles.activityOptions}>
          {([
            { key: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise' },
            { key: 'light', label: 'Light', desc: 'Light exercise 1-3 days/week' },
            { key: 'moderate', label: 'Moderate', desc: 'Moderate exercise 3-5 days/week' },
            { key: 'active', label: 'Active', desc: 'Hard exercise 6-7 days/week' },
            { key: 'very active', label: 'Very Active', desc: 'Very hard exercise, physical job' },
          ] as const).map((activity) => (
            <TouchableOpacity
              key={activity.key}
              style={[
                styles.activityOption,
                data.activityLevel === activity.key && styles.selectedActivityOption,
              ]}
              onPress={() => updateData('activityLevel', activity.key)}
              testID={`activity-${activity.key}`}
            >
              <Text
                style={[
                  styles.activityOptionTitle,
                  data.activityLevel === activity.key && styles.selectedActivityOptionTitle,
                ]}
              >
                {activity.label}
              </Text>
              <Text
                style={[
                  styles.activityOptionDesc,
                  data.activityLevel === activity.key && styles.selectedActivityOptionDesc,
                ]}
              >
                {activity.desc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderGoals = () => (
    <View style={styles.stepContent}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Your Goal</Text>
        <Text style={styles.description}>What would you like to achieve?</Text>
        
        <View style={styles.goalOptions}>
          {([
            { key: 'lose', label: 'Lose Weight', desc: 'Create a calorie deficit' },
            { key: 'maintain', label: 'Maintain Weight', desc: 'Stay at current weight' },
            { key: 'gain', label: 'Gain Weight', desc: 'Build muscle and mass' },
          ] as const).map((goal) => (
            <TouchableOpacity
              key={goal.key}
              style={[
                styles.goalOption,
                data.goal === goal.key && styles.selectedGoalOption,
              ]}
              onPress={() => updateData('goal', goal.key)}
              testID={`goal-${goal.key}`}
            >
              <Text
                style={[
                  styles.goalOptionTitle,
                  data.goal === goal.key && styles.selectedGoalOptionTitle,
                ]}
              >
                {goal.label}
              </Text>
              <Text
                style={[
                  styles.goalOptionDesc,
                  data.goal === goal.key && styles.selectedGoalOptionDesc,
                ]}
              >
                {goal.desc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderPersonalInfo();
      case 1:
        return renderPhysicalStats();
      case 2:
        return renderLifestyle();
      case 3:
        return renderGoals();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentStep + 1) / STEPS.length) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {currentStep + 1} of {STEPS.length}
          </Text>
        </View>
        
        <Text style={styles.stepTitle}>{STEPS[currentStep].title}</Text>
        <Text style={styles.stepSubtitle}>{STEPS[currentStep].subtitle}</Text>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {renderStepContent()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          testID="back-button"
        >
          <ArrowLeft size={24} color={colors.darkGray} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.nextButton,
            !validateCurrentStep() && styles.nextButtonDisabled,
            loading && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!validateCurrentStep() || loading}
          testID="next-button"
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <Text style={styles.nextButtonText}>
                {currentStep === STEPS.length - 1 ? 'Complete Setup' : 'Next'}
              </Text>
              <ArrowRight size={20} color={colors.white} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.lightGray,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: colors.darkGray,
    textAlign: 'center',
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: colors.darkGray,
    lineHeight: 24,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  stepContent: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 16,
    lineHeight: 20,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  optionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lightGray,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  selectedOptionButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionButtonText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  selectedOptionButtonText: {
    color: colors.white,
  },
  activityOptions: {
    gap: 12,
  },
  activityOption: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lightGray,
    padding: 16,
  },
  selectedActivityOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  activityOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  selectedActivityOptionTitle: {
    color: colors.white,
  },
  activityOptionDesc: {
    fontSize: 14,
    color: colors.darkGray,
  },
  selectedActivityOptionDesc: {
    color: colors.white,
    opacity: 0.9,
  },
  goalOptions: {
    gap: 12,
  },
  goalOption: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lightGray,
    padding: 16,
  },
  selectedGoalOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  goalOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  selectedGoalOptionTitle: {
    color: colors.white,
  },
  goalOptionDesc: {
    fontSize: 14,
    color: colors.darkGray,
  },
  selectedGoalOptionDesc: {
    color: colors.white,
    opacity: 0.9,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  nextButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: colors.mediumGray,
  },
  nextButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});