import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, X, Save } from 'lucide-react-native';

import { colors } from '@/constants/colors';
import { DietaryPreferences } from '@/types/nutrition';
import { useProfile } from '@/hooks/useProfile';

const DIET_TYPES = [
  { key: 'vegetarian', label: 'Vegetarian', description: 'No meat, but includes dairy and eggs' },
  { key: 'vegan', label: 'Vegan', description: 'No animal products' },
  { key: 'glutenFree', label: 'Gluten-Free', description: 'No wheat, barley, rye, or oats' },
  { key: 'dairyFree', label: 'Dairy-Free', description: 'No milk, cheese, or dairy products' },
  { key: 'keto', label: 'Ketogenic', description: 'Very low carb, high fat' },
  { key: 'paleo', label: 'Paleo', description: 'Whole foods, no processed foods' },
  { key: 'lowCarb', label: 'Low Carb', description: 'Reduced carbohydrate intake' },
  { key: 'lowFat', label: 'Low Fat', description: 'Reduced fat intake' },
] as const;

export default function DietaryPreferencesScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useProfile();
  
  const [preferences, setPreferences] = useState<DietaryPreferences>({
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    dairyFree: false,
    keto: false,
    paleo: false,
    lowCarb: false,
    lowFat: false,
    allergies: [],
    dislikes: [],
    ...profile?.dietary_preferences,
  });
  
  const [newAllergy, setNewAllergy] = useState<string>('');
  const [newDislike, setNewDislike] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const toggleDietType = (key: keyof Omit<DietaryPreferences, 'allergies' | 'dislikes'>) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !preferences.allergies.includes(newAllergy.trim())) {
      setPreferences(prev => ({
        ...prev,
        allergies: [...prev.allergies, newAllergy.trim()],
      }));
      setNewAllergy('');
    }
  };

  const removeAllergy = (allergy: string) => {
    setPreferences(prev => ({
      ...prev,
      allergies: prev.allergies.filter(a => a !== allergy),
    }));
  };

  const addDislike = () => {
    if (newDislike.trim() && !preferences.dislikes.includes(newDislike.trim())) {
      setPreferences(prev => ({
        ...prev,
        dislikes: [...prev.dislikes, newDislike.trim()],
      }));
      setNewDislike('');
    }
  };

  const removeDislike = (dislike: string) => {
    setPreferences(prev => ({
      ...prev,
      dislikes: prev.dislikes.filter(d => d !== dislike),
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    
    try {
      const { error } = await updateProfile({
        dietary_preferences: preferences,
      });

      if (error) {
        Alert.alert('Error', error);
        return;
      }

      Alert.alert(
        'Success',
        'Your dietary preferences have been updated.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Save dietary preferences error:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diet Types</Text>
          <Text style={styles.sectionDescription}>
            Select any dietary restrictions or preferences you follow
          </Text>
          
          {DIET_TYPES.map((diet) => (
            <TouchableOpacity
              key={diet.key}
              style={[
                styles.dietOption,
                preferences[diet.key] && styles.selectedDietOption,
              ]}
              onPress={() => toggleDietType(diet.key)}
              testID={`diet-${diet.key}`}
            >
              <View style={styles.dietOptionContent}>
                <Text
                  style={[
                    styles.dietOptionTitle,
                    preferences[diet.key] && styles.selectedDietOptionTitle,
                  ]}
                >
                  {diet.label}
                </Text>
                <Text
                  style={[
                    styles.dietOptionDescription,
                    preferences[diet.key] && styles.selectedDietOptionDescription,
                  ]}
                >
                  {diet.description}
                </Text>
              </View>
              <View
                style={[
                  styles.checkbox,
                  preferences[diet.key] && styles.checkedCheckbox,
                ]}
              >
                {preferences[diet.key] && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Food Allergies</Text>
          <Text style={styles.sectionDescription}>
            Add any foods you&apos;re allergic to for safety warnings
          </Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={newAllergy}
              onChangeText={setNewAllergy}
              placeholder="Enter food allergy (e.g., peanuts, shellfish)"
              placeholderTextColor={colors.mediumGray}
              testID="allergy-input"
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={addAllergy}
              disabled={!newAllergy.trim()}
              testID="add-allergy"
            >
              <Plus size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.tagContainer}>
            {preferences.allergies.map((allergy, index) => (
              <View key={index} style={[styles.tag, styles.allergyTag]}>
                <Text style={styles.tagText}>{allergy}</Text>
                <TouchableOpacity
                  onPress={() => removeAllergy(allergy)}
                  testID={`remove-allergy-${index}`}
                >
                  <X size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Food Dislikes</Text>
          <Text style={styles.sectionDescription}>
            Add foods you prefer to avoid in meal suggestions
          </Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={newDislike}
              onChangeText={setNewDislike}
              placeholder="Enter food dislike (e.g., mushrooms, olives)"
              placeholderTextColor={colors.mediumGray}
              testID="dislike-input"
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={addDislike}
              disabled={!newDislike.trim()}
              testID="add-dislike"
            >
              <Plus size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.tagContainer}>
            {preferences.dislikes.map((dislike, index) => (
              <View key={index} style={[styles.tag, styles.dislikeTag]}>
                <Text style={styles.tagText}>{dislike}</Text>
                <TouchableOpacity
                  onPress={() => removeDislike(dislike)}
                  testID={`remove-dislike-${index}`}
                >
                  <X size={16} color={colors.darkGray} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
          testID="save-preferences"
        >
          <Save size={20} color={colors.white} />
          <Text style={styles.saveButtonText}>Save Preferences</Text>
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
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 16,
    lineHeight: 20,
  },
  dietOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  selectedDietOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dietOptionContent: {
    flex: 1,
  },
  dietOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  selectedDietOptionTitle: {
    color: colors.white,
  },
  dietOptionDescription: {
    fontSize: 14,
    color: colors.darkGray,
  },
  selectedDietOptionDescription: {
    color: colors.white,
    opacity: 0.9,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkedCheckbox: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  checkmark: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
  },
  allergyTag: {
    backgroundColor: colors.danger,
  },
  dislikeTag: {
    backgroundColor: colors.mediumGray,
  },
  tagText: {
    color: colors.white,
    fontSize: 14,
    marginRight: 6,
  },
  footer: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.mediumGray,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});