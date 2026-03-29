import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { X, CheckCircle, XCircle, Edit3, Star } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { GoalReview, NutritionGoals } from '@/types/nutrition';

interface GoalFeedbackModalProps {
  visible: boolean;
  review: GoalReview | null;
  onClose: () => void;
  onSubmit: (feedback: any, action: 'accept' | 'reject' | 'modify', modifiedGoals?: NutritionGoals) => void;
}

type FeedbackState = {
  energyLevel: 'low' | 'normal' | 'high';
  hungerLevel: 'always_hungry' | 'satisfied' | 'rarely_hungry';
  workoutPerformance: 'declining' | 'stable' | 'improving';
  sleepQuality: 'poor' | 'fair' | 'good' | 'excellent';
  stressLevel: 'low' | 'moderate' | 'high';
  goalSatisfaction: number;
  additionalNotes: string;
};

export const GoalFeedbackModal: React.FC<GoalFeedbackModalProps> = ({
  visible,
  review,
  onClose,
  onSubmit,
}) => {
  const [feedback, setFeedback] = useState<FeedbackState>({
    energyLevel: 'normal',
    hungerLevel: 'satisfied',
    workoutPerformance: 'stable',
    sleepQuality: 'good',
    stressLevel: 'moderate',
    goalSatisfaction: 7,
    additionalNotes: '',
  });

  const [selectedAction, setSelectedAction] = useState<'accept' | 'reject' | 'modify' | null>(null);
  const [modifiedGoals, setModifiedGoals] = useState<NutritionGoals | null>(null);
  const [showModifyForm, setShowModifyForm] = useState<boolean>(false);

  const handleActionSelect = (action: 'accept' | 'reject' | 'modify') => {
    setSelectedAction(action);
    if (action === 'modify' && review) {
      setModifiedGoals({ ...review.suggestedGoals });
      setShowModifyForm(true);
    } else {
      setShowModifyForm(false);
    }
  };

  const handleSubmit = () => {
    if (!selectedAction || !review) return;

    if (selectedAction === 'modify' && !modifiedGoals) {
      Alert.alert('Error', 'Please set your modified goals');
      return;
    }

    onSubmit(feedback, selectedAction, modifiedGoals || undefined);
    handleClose();
  };

  const handleClose = () => {
    setSelectedAction(null);
    setModifiedGoals(null);
    setShowModifyForm(false);
    setFeedback({
      energyLevel: 'normal',
      hungerLevel: 'satisfied',
      workoutPerformance: 'stable',
      sleepQuality: 'good',
      stressLevel: 'moderate',
      goalSatisfaction: 7,
      additionalNotes: '',
    });
    onClose();
  };

  const renderStarRating = (value: number, onChange: (value: number) => void) => {
    return (
      <View style={styles.starRating}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onChange(star)}
            style={styles.starButton}
          >
            <Star
              size={20}
              color={star <= value ? colors.warning : colors.lightGray}
              fill={star <= value ? colors.warning : 'transparent'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderOptionSelector = <T extends string>(
    value: T,
    options: { value: T; label: string; color?: string }[],
    onChange: (value: T) => void
  ) => {
    return (
      <View style={styles.optionSelector}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              value === option.value && styles.optionButtonSelected,
              value === option.value && option.color && { backgroundColor: option.color },
            ]}
            onPress={() => onChange(option.value)}
          >
            <Text
              style={[
                styles.optionText,
                value === option.value && styles.optionTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (!review) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Goal Review Feedback</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What would you like to do?</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  selectedAction === 'accept' && styles.actionButtonSelected,
                ]}
                onPress={() => handleActionSelect('accept')}
              >
                <CheckCircle
                  size={20}
                  color={selectedAction === 'accept' ? colors.white : colors.success}
                />
                <Text
                  style={[
                    styles.actionButtonText,
                    selectedAction === 'accept' && styles.actionButtonTextSelected,
                  ]}
                >
                  Accept Suggestions
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  selectedAction === 'modify' && styles.actionButtonSelected,
                ]}
                onPress={() => handleActionSelect('modify')}
              >
                <Edit3
                  size={20}
                  color={selectedAction === 'modify' ? colors.white : colors.primary}
                />
                <Text
                  style={[
                    styles.actionButtonText,
                    selectedAction === 'modify' && styles.actionButtonTextSelected,
                  ]}
                >
                  Modify Goals
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  selectedAction === 'reject' && styles.actionButtonSelected,
                ]}
                onPress={() => handleActionSelect('reject')}
              >
                <XCircle
                  size={20}
                  color={selectedAction === 'reject' ? colors.white : colors.danger}
                />
                <Text
                  style={[
                    styles.actionButtonText,
                    selectedAction === 'reject' && styles.actionButtonTextSelected,
                  ]}
                >
                  Keep Current Goals
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {showModifyForm && modifiedGoals && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Customize Your Goals</Text>
              <View style={styles.goalInputs}>
                <View style={styles.goalInput}>
                  <Text style={styles.goalLabel}>Daily Calories</Text>
                  <TextInput
                    style={styles.goalTextInput}
                    value={modifiedGoals.calories.toString()}
                    onChangeText={(text) =>
                      setModifiedGoals({ ...modifiedGoals, calories: parseInt(text) || 0 })
                    }
                    keyboardType="numeric"
                    placeholder="2000"
                  />
                </View>
                <View style={styles.goalInput}>
                  <Text style={styles.goalLabel}>Protein (g)</Text>
                  <TextInput
                    style={styles.goalTextInput}
                    value={modifiedGoals.protein.toString()}
                    onChangeText={(text) =>
                      setModifiedGoals({ ...modifiedGoals, protein: parseInt(text) || 0 })
                    }
                    keyboardType="numeric"
                    placeholder="150"
                  />
                </View>
                <View style={styles.goalInput}>
                  <Text style={styles.goalLabel}>Carbs (g)</Text>
                  <TextInput
                    style={styles.goalTextInput}
                    value={modifiedGoals.carbs.toString()}
                    onChangeText={(text) =>
                      setModifiedGoals({ ...modifiedGoals, carbs: parseInt(text) || 0 })
                    }
                    keyboardType="numeric"
                    placeholder="200"
                  />
                </View>
                <View style={styles.goalInput}>
                  <Text style={styles.goalLabel}>Fat (g)</Text>
                  <TextInput
                    style={styles.goalTextInput}
                    value={modifiedGoals.fat.toString()}
                    onChangeText={(text) =>
                      setModifiedGoals({ ...modifiedGoals, fat: parseInt(text) || 0 })
                    }
                    keyboardType="numeric"
                    placeholder="65"
                  />
                </View>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How have you been feeling?</Text>
            
            <View style={styles.question}>
              <Text style={styles.questionText}>Energy Level</Text>
              {renderOptionSelector(
                feedback.energyLevel,
                [
                  { value: 'low', label: 'Low', color: colors.danger },
                  { value: 'normal', label: 'Normal', color: colors.primary },
                  { value: 'high', label: 'High', color: colors.success },
                ],
                (value) => setFeedback({ ...feedback, energyLevel: value })
              )}
            </View>

            <View style={styles.question}>
              <Text style={styles.questionText}>Hunger Level</Text>
              {renderOptionSelector(
                feedback.hungerLevel,
                [
                  { value: 'always_hungry', label: 'Always Hungry', color: colors.danger },
                  { value: 'satisfied', label: 'Satisfied', color: colors.success },
                  { value: 'rarely_hungry', label: 'Rarely Hungry', color: colors.warning },
                ],
                (value) => setFeedback({ ...feedback, hungerLevel: value })
              )}
            </View>

            <View style={styles.question}>
              <Text style={styles.questionText}>Workout Performance</Text>
              {renderOptionSelector(
                feedback.workoutPerformance,
                [
                  { value: 'declining', label: 'Declining', color: colors.danger },
                  { value: 'stable', label: 'Stable', color: colors.primary },
                  { value: 'improving', label: 'Improving', color: colors.success },
                ],
                (value) => setFeedback({ ...feedback, workoutPerformance: value })
              )}
            </View>

            <View style={styles.question}>
              <Text style={styles.questionText}>Sleep Quality</Text>
              {renderOptionSelector(
                feedback.sleepQuality,
                [
                  { value: 'poor', label: 'Poor', color: colors.danger },
                  { value: 'fair', label: 'Fair', color: colors.warning },
                  { value: 'good', label: 'Good', color: colors.primary },
                  { value: 'excellent', label: 'Excellent', color: colors.success },
                ],
                (value) => setFeedback({ ...feedback, sleepQuality: value })
              )}
            </View>

            <View style={styles.question}>
              <Text style={styles.questionText}>Stress Level</Text>
              {renderOptionSelector(
                feedback.stressLevel,
                [
                  { value: 'low', label: 'Low', color: colors.success },
                  { value: 'moderate', label: 'Moderate', color: colors.primary },
                  { value: 'high', label: 'High', color: colors.danger },
                ],
                (value) => setFeedback({ ...feedback, stressLevel: value })
              )}
            </View>

            <View style={styles.question}>
              <Text style={styles.questionText}>Goal Satisfaction (1-10)</Text>
              {renderStarRating(feedback.goalSatisfaction, (value) =>
                setFeedback({ ...feedback, goalSatisfaction: value })
              )}
              <Text style={styles.ratingText}>{feedback.goalSatisfaction}/10</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={feedback.additionalNotes}
              onChangeText={(text) => setFeedback({ ...feedback, additionalNotes: text })}
              placeholder="Any additional thoughts or concerns..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.submitButton,
              !selectedAction && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!selectedAction}
          >
            <Text style={styles.submitButtonText}>Submit Feedback</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.lightGray,
    backgroundColor: colors.white,
  },
  actionButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 12,
  },
  actionButtonTextSelected: {
    color: colors.white,
  },
  goalInputs: {
    gap: 16,
  },
  goalInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  goalTextInput: {
    width: 100,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.lightGray,
    backgroundColor: colors.white,
    fontSize: 16,
    textAlign: 'center',
  },
  question: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 12,
  },
  optionSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.lightGray,
    backgroundColor: colors.white,
  },
  optionButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  optionTextSelected: {
    color: colors.white,
  },
  starRating: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  notesInput: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lightGray,
    backgroundColor: colors.white,
    fontSize: 16,
    minHeight: 100,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.mediumGray,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.mediumGray,
  },
  submitButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.lightGray,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});