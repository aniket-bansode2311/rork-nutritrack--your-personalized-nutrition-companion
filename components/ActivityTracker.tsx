import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { Activity, Plus, Clock, Zap } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';

interface ActivityTrackerProps {
  date: string;
}

const ACTIVITY_TYPES = [
  { name: 'Walking', icon: '🚶', caloriesPerMinute: 4 },
  { name: 'Running', icon: '🏃', caloriesPerMinute: 10 },
  { name: 'Cycling', icon: '🚴', caloriesPerMinute: 8 },
  { name: 'Swimming', icon: '🏊', caloriesPerMinute: 12 },
  { name: 'Yoga', icon: '🧘', caloriesPerMinute: 3 },
  { name: 'Weight Training', icon: '🏋️', caloriesPerMinute: 6 },
  { name: 'Dancing', icon: '💃', caloriesPerMinute: 5 },
  { name: 'Other', icon: '🏃', caloriesPerMinute: 5 },
];

const INTENSITY_LEVELS = [
  { label: 'Low', value: 'low' as const, multiplier: 0.8 },
  { label: 'Moderate', value: 'moderate' as const, multiplier: 1.0 },
  { label: 'High', value: 'high' as const, multiplier: 1.3 },
];

export function ActivityTracker({ date }: ActivityTrackerProps) {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedActivity, setSelectedActivity] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [intensity, setIntensity] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [customActivity, setCustomActivity] = useState<string>('');

  const activityHistoryQuery = trpc.progress.activity.history.useQuery({
    period: 'week',
    startDate: date,
    endDate: date,
  });

  const activityLogMutation = trpc.progress.activity.log.useMutation({
    onSuccess: () => {
      activityHistoryQuery.refetch();
      setShowModal(false);
      resetForm();
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to log activity');
      console.error('Activity log error:', error);
    },
  });

  const todayActivities = activityHistoryQuery.data || [];
  const totalDuration = todayActivities.reduce((sum, entry) => sum + entry.duration, 0);
  const totalCaloriesBurned = todayActivities.reduce((sum, entry) => sum + (entry.caloriesBurned || 0), 0);

  const resetForm = () => {
    setSelectedActivity('');
    setDuration('');
    setIntensity('moderate');
    setCustomActivity('');
  };

  const handleActivitySelect = (activityName: string) => {
    setSelectedActivity(activityName);
    if (activityName !== 'Other') {
      setCustomActivity('');
    }
  };

  const handleLogActivity = () => {
    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum <= 0) {
      Alert.alert('Invalid Duration', 'Please enter a valid duration in minutes');
      return;
    }

    const activityName = selectedActivity === 'Other' ? customActivity : selectedActivity;
    if (!activityName.trim()) {
      Alert.alert('Missing Activity', 'Please select or enter an activity type');
      return;
    }

    const activityType = ACTIVITY_TYPES.find(a => a.name === selectedActivity);
    const baseCalories = activityType ? activityType.caloriesPerMinute : 5;
    const intensityMultiplier = INTENSITY_LEVELS.find(i => i.value === intensity)?.multiplier || 1.0;
    const caloriesBurned = Math.round(baseCalories * durationNum * intensityMultiplier);

    activityLogMutation.mutate({
      type: activityName,
      duration: durationNum,
      caloriesBurned,
      intensity,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Activity size={24} color={colors.secondary} />
          <Text style={styles.title}>Physical Activity</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowModal(true)}
          testID="add-activity-button"
        >
          <Plus size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Clock size={20} color={colors.secondary} />
          <Text style={styles.statValue}>{totalDuration}</Text>
          <Text style={styles.statLabel}>minutes</Text>
        </View>
        <View style={styles.statItem}>
          <Zap size={20} color={colors.secondary} />
          <Text style={styles.statValue}>{totalCaloriesBurned}</Text>
          <Text style={styles.statLabel}>calories</Text>
        </View>
      </View>

      {todayActivities.length > 0 && (
        <View style={styles.activitiesList}>
          <Text style={styles.activitiesTitle}>Today&apos;s Activities</Text>
          {todayActivities.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <Text style={styles.activityName}>{activity.type}</Text>
              <Text style={styles.activityDetails}>
                {activity.duration}min • {activity.caloriesBurned || 0} cal
              </Text>
            </View>
          ))}
        </View>
      )}

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Log Activity</Text>
              
              <Text style={styles.sectionTitle}>Activity Type</Text>
              <View style={styles.activityGrid}>
                {ACTIVITY_TYPES.map((activity) => (
                  <TouchableOpacity
                    key={activity.name}
                    style={[
                      styles.activityButton,
                      selectedActivity === activity.name && styles.activityButtonSelected,
                    ]}
                    onPress={() => handleActivitySelect(activity.name)}
                    testID={`activity-${activity.name}`}
                  >
                    <Text style={styles.activityIcon}>{activity.icon}</Text>
                    <Text style={[
                      styles.activityButtonText,
                      selectedActivity === activity.name && styles.activityButtonTextSelected,
                    ]}>
                      {activity.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedActivity === 'Other' && (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter activity name"
                    value={customActivity}
                    onChangeText={setCustomActivity}
                    testID="custom-activity-input"
                  />
                </View>
              )}

              <Text style={styles.sectionTitle}>Duration (minutes)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Duration in minutes"
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="numeric"
                  testID="duration-input"
                />
              </View>

              <Text style={styles.sectionTitle}>Intensity</Text>
              <View style={styles.intensityContainer}>
                {INTENSITY_LEVELS.map((level) => (
                  <TouchableOpacity
                    key={level.value}
                    style={[
                      styles.intensityButton,
                      intensity === level.value && styles.intensityButtonSelected,
                    ]}
                    onPress={() => setIntensity(level.value)}
                    testID={`intensity-${level.value}`}
                  >
                    <Text style={[
                      styles.intensityButtonText,
                      intensity === level.value && styles.intensityButtonTextSelected,
                    ]}>
                      {level.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleLogActivity}
                  disabled={activityLogMutation.isPending}
                  testID="confirm-activity-button"
                >
                  <Text style={styles.confirmButtonText}>
                    {activityLogMutation.isPending ? 'Logging...' : 'Log Activity'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginLeft: 8,
  },
  addButton: {
    backgroundColor: colors.secondary,
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  activitiesList: {
    marginTop: 8,
  },
  activitiesTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  activityName: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.text,
  },
  activityDetails: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 12,
    marginTop: 16,
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  activityButton: {
    width: '48%',
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  activityButtonSelected: {
    backgroundColor: colors.secondary,
  },
  activityIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  activityButtonText: {
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
  },
  activityButtonTextSelected: {
    color: colors.white,
    fontWeight: '600' as const,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  intensityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  intensityButton: {
    flex: 1,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  intensityButtonSelected: {
    backgroundColor: colors.secondary,
  },
  intensityButtonText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
  intensityButtonTextSelected: {
    color: colors.white,
    fontWeight: '600' as const,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: colors.lightGray,
  },
  confirmButton: {
    backgroundColor: colors.secondary,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500' as const,
    textAlign: 'center',
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500' as const,
    textAlign: 'center',
  },
});