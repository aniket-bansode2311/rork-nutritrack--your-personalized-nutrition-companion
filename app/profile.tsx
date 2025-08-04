import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, Utensils, Bell, Shield, Smartphone } from 'lucide-react-native';

import { colors } from '@/constants/colors';
import { useNutrition } from '@/hooks/useNutritionStore';
import { useProfile } from '@/hooks/useProfile';
import { UserProfile } from '@/types/nutrition';

export default function ProfileScreen() {
  const router = useRouter();
  const { userProfile, updateUserProfile } = useNutrition();
  const { profile: supabaseProfile, updateProfile, calculateNutritionGoals } = useProfile();
  
  // Transform Supabase profile to UserProfile format
  const transformSupabaseProfile = (supabaseProfile: any): UserProfile => {
    return {
      id: supabaseProfile.id,
      name: supabaseProfile.name,
      weight: supabaseProfile.weight,
      height: supabaseProfile.height,
      age: supabaseProfile.age,
      gender: supabaseProfile.gender,
      activityLevel: supabaseProfile.activity_level,
      goal: supabaseProfile.goal,
      nutritionGoals: {
        calories: supabaseProfile.calories_goal,
        protein: supabaseProfile.protein_goal,
        carbs: supabaseProfile.carbs_goal,
        fat: supabaseProfile.fat_goal,
      },
      dietaryPreferences: supabaseProfile.dietary_preferences,
      notifications: supabaseProfile.notification_settings,
      privacy: supabaseProfile.privacy_settings,
      healthIntegrations: supabaseProfile.health_integrations,
    };
  };

  // Use Supabase profile if available, fallback to local profile
  const currentProfile = supabaseProfile ? transformSupabaseProfile(supabaseProfile) : userProfile;
  const [profile, setProfile] = useState<UserProfile>(() => ({...currentProfile}));
  const [loading, setLoading] = useState<boolean>(false);
  
  const handleChange = (field: keyof UserProfile, value: any) => {
    if (field === 'nutritionGoals') {
      setProfile({
        ...profile,
        nutritionGoals: {
          ...profile.nutritionGoals,
          ...value,
        },
      });
    } else {
      setProfile({
        ...profile,
        [field]: value,
      });
    }
  };
  
  const handleSave = async () => {
    setLoading(true);
    
    try {
      // Calculate new nutrition goals based on updated profile
      const nutritionGoals = calculateNutritionGoals(
        profile.weight,
        profile.height,
        profile.age,
        profile.gender,
        profile.activityLevel,
        profile.goal
      );

      if (supabaseProfile) {
        // Update Supabase profile
        const { error } = await updateProfile({
          name: profile.name,
          age: profile.age,
          gender: profile.gender,
          weight: profile.weight,
          height: profile.height,
          activity_level: profile.activityLevel,
          goal: profile.goal,
          calories_goal: nutritionGoals.calories,
          protein_goal: nutritionGoals.protein,
          carbs_goal: nutritionGoals.carbs,
          fat_goal: nutritionGoals.fat,
        });

        if (error) {
          Alert.alert('Error', error);
          return;
        }
      } else {
        // Update local profile
        updateUserProfile({
          ...profile,
          nutritionGoals,
        });
      }

      Alert.alert(
        'Success',
        'Your profile has been updated successfully.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Save profile error:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={profile.name}
              onChangeText={(text) => handleChange('name', text)}
              placeholder="Your name"
              testID="name-input"
            />
          </View>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                value={profile.age.toString()}
                onChangeText={(text) => {
                  const value = parseInt(text);
                  if (!isNaN(value)) {
                    handleChange('age', value);
                  }
                }}
                keyboardType="numeric"
                placeholder="Years"
                testID="age-input"
              />
            </View>
            
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderButtons}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    profile.gender === 'male' && styles.selectedGenderButton,
                  ]}
                  onPress={() => handleChange('gender', 'male')}
                  testID="male-button"
                >
                  <Text
                    style={[
                      styles.genderButtonText,
                      profile.gender === 'male' && styles.selectedGenderButtonText,
                    ]}
                  >
                    Male
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    profile.gender === 'female' && styles.selectedGenderButton,
                  ]}
                  onPress={() => handleChange('gender', 'female')}
                  testID="female-button"
                >
                  <Text
                    style={[
                      styles.genderButtonText,
                      profile.gender === 'female' && styles.selectedGenderButtonText,
                    ]}
                  >
                    Female
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    profile.gender === 'other' && styles.selectedGenderButton,
                  ]}
                  onPress={() => handleChange('gender', 'other')}
                  testID="other-gender-button"
                >
                  <Text
                    style={[
                      styles.genderButtonText,
                      profile.gender === 'other' && styles.selectedGenderButtonText,
                    ]}
                  >
                    Other
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={profile.weight.toString()}
                onChangeText={(text) => {
                  const value = parseFloat(text);
                  if (!isNaN(value)) {
                    handleChange('weight', value);
                  }
                }}
                keyboardType="numeric"
                placeholder="kg"
                testID="weight-input"
              />
            </View>
            
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                value={profile.height.toString()}
                onChangeText={(text) => {
                  const value = parseFloat(text);
                  if (!isNaN(value)) {
                    handleChange('height', value);
                  }
                }}
                keyboardType="numeric"
                placeholder="cm"
                testID="height-input"
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Activity Level</Text>
            <View style={styles.activityButtons}>
              {(['sedentary', 'light', 'moderate', 'active', 'very active'] as const).map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.activityButton,
                    profile.activityLevel === level && styles.selectedActivityButton,
                  ]}
                  onPress={() => handleChange('activityLevel', level)}
                  testID={`activity-${level}-button`}
                >
                  <Text
                    style={[
                      styles.activityButtonText,
                      profile.activityLevel === level && styles.selectedActivityButtonText,
                    ]}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Goal</Text>
            <View style={styles.goalButtons}>
              {(['lose', 'maintain', 'gain'] as const).map((goal) => (
                <TouchableOpacity
                  key={goal}
                  style={[
                    styles.goalButton,
                    profile.goal === goal && styles.selectedGoalButton,
                  ]}
                  onPress={() => handleChange('goal', goal)}
                  testID={`goal-${goal}-button`}
                >
                  <Text
                    style={[
                      styles.goalButtonText,
                      profile.goal === goal && styles.selectedGoalButtonText,
                    ]}
                  >
                    {goal.charAt(0).toUpperCase() + goal.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutrition Goals</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Daily Calories</Text>
            <TextInput
              style={styles.input}
              value={profile.nutritionGoals.calories.toString()}
              onChangeText={(text) => {
                const value = parseInt(text);
                if (!isNaN(value)) {
                  handleChange('nutritionGoals', { calories: value });
                }
              }}
              keyboardType="numeric"
              placeholder="kcal"
              testID="calories-input"
            />
          </View>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.thirdWidth]}>
              <Text style={styles.label}>Protein (g)</Text>
              <TextInput
                style={styles.input}
                value={profile.nutritionGoals.protein.toString()}
                onChangeText={(text) => {
                  const value = parseInt(text);
                  if (!isNaN(value)) {
                    handleChange('nutritionGoals', { protein: value });
                  }
                }}
                keyboardType="numeric"
                placeholder="g"
                testID="protein-input"
              />
            </View>
            
            <View style={[styles.inputGroup, styles.thirdWidth]}>
              <Text style={styles.label}>Carbs (g)</Text>
              <TextInput
                style={styles.input}
                value={profile.nutritionGoals.carbs.toString()}
                onChangeText={(text) => {
                  const value = parseInt(text);
                  if (!isNaN(value)) {
                    handleChange('nutritionGoals', { carbs: value });
                  }
                }}
                keyboardType="numeric"
                placeholder="g"
                testID="carbs-input"
              />
            </View>
            
            <View style={[styles.inputGroup, styles.thirdWidth]}>
              <Text style={styles.label}>Fat (g)</Text>
              <TextInput
                style={styles.input}
                value={profile.nutritionGoals.fat.toString()}
                onChangeText={(text) => {
                  const value = parseInt(text);
                  if (!isNaN(value)) {
                    handleChange('nutritionGoals', { fat: value });
                  }
                }}
                keyboardType="numeric"
                placeholder="g"
                testID="fat-input"
              />
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Settings</Text>
          
          <TouchableOpacity 
            style={styles.quickSettingItem}
            onPress={() => router.push('/profile/dietary-preferences')}
            testID="quick-dietary-preferences"
          >
            <View style={styles.quickSettingLeft}>
              <Utensils size={20} color={colors.primary} />
              <Text style={styles.quickSettingText}>Dietary Preferences</Text>
            </View>
            <ChevronRight size={16} color={colors.darkGray} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickSettingItem}
            onPress={() => router.push('/profile/notifications')}
            testID="quick-notifications"
          >
            <View style={styles.quickSettingLeft}>
              <Bell size={20} color={colors.primary} />
              <Text style={styles.quickSettingText}>Notifications</Text>
            </View>
            <ChevronRight size={16} color={colors.darkGray} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickSettingItem}
            onPress={() => router.push('/profile/privacy')}
            testID="quick-privacy"
          >
            <View style={styles.quickSettingLeft}>
              <Shield size={20} color={colors.primary} />
              <Text style={styles.quickSettingText}>Privacy & Data</Text>
            </View>
            <ChevronRight size={16} color={colors.darkGray} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickSettingItem}
            onPress={() => router.push('/profile/health-integrations')}
            testID="quick-health-integrations"
          >
            <View style={styles.quickSettingLeft}>
              <Smartphone size={20} color={colors.primary} />
              <Text style={styles.quickSettingText}>Health Integrations</Text>
            </View>
            <ChevronRight size={16} color={colors.darkGray} />
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
          testID="save-profile-button"
        >
          <Text style={styles.saveButtonText}>Save Profile</Text>
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
  scrollView: {
    flex: 1,
    paddingBottom: 80,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
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
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  thirdWidth: {
    width: '31%',
  },
  genderButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
    marginHorizontal: 2,
    borderRadius: 8,
  },
  selectedGenderButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genderButtonText: {
    color: colors.text,
    fontWeight: '500',
  },
  selectedGenderButtonText: {
    color: colors.white,
  },
  activityButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  activityButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    margin: 4,
  },
  selectedActivityButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  activityButtonText: {
    color: colors.text,
    fontSize: 14,
  },
  selectedActivityButtonText: {
    color: colors.white,
  },
  goalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
    marginHorizontal: 2,
    borderRadius: 8,
  },
  selectedGoalButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  goalButtonText: {
    color: colors.text,
    fontWeight: '500',
  },
  selectedGoalButtonText: {
    color: colors.white,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    backgroundColor: colors.mediumGray,
  },
  quickSettingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  quickSettingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickSettingText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
});