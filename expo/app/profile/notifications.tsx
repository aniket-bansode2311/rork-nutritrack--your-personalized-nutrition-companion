import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Switch, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Clock, Save } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { colors } from '@/constants/colors';
import { NotificationSettings } from '@/types/nutrition';
import { useProfile } from '@/hooks/useProfile';

export default function NotificationsScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useProfile();
  
  const [settings, setSettings] = useState<NotificationSettings>({
    mealReminders: true,
    waterReminders: true,
    goalAchievements: true,
    weeklyReports: true,
    mealReminderTimes: {
      breakfast: '08:00',
      lunch: '12:30',
      dinner: '18:00',
    },
    waterReminderInterval: 120, // 2 hours
    ...profile?.notification_settings,
  });
  
  const [showTimePicker, setShowTimePicker] = useState<{
    visible: boolean;
    meal: 'breakfast' | 'lunch' | 'dinner' | null;
  }>({ visible: false, meal: null });
  
  const [loading, setLoading] = useState<boolean>(false);

  const toggleSetting = (key: keyof Omit<NotificationSettings, 'mealReminderTimes' | 'waterReminderInterval'>) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const updateMealTime = (meal: 'breakfast' | 'lunch' | 'dinner', time: string) => {
    setSettings(prev => ({
      ...prev,
      mealReminderTimes: {
        ...prev.mealReminderTimes,
        [meal]: time,
      },
    }));
  };

  const updateWaterInterval = (interval: number) => {
    setSettings(prev => ({
      ...prev,
      waterReminderInterval: interval,
    }));
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker({ visible: false, meal: null });
    
    if (selectedTime && showTimePicker.meal) {
      const timeString = selectedTime.toTimeString().slice(0, 5);
      updateMealTime(showTimePicker.meal, timeString);
    }
  };

  const showTimePickerForMeal = (meal: 'breakfast' | 'lunch' | 'dinner') => {
    setShowTimePicker({ visible: true, meal });
  };

  const handleSave = async () => {
    setLoading(true);
    
    try {
      const { error } = await updateProfile({
        notification_settings: settings,
      });

      if (error) {
        Alert.alert('Error', error);
        return;
      }

      Alert.alert(
        'Success',
        'Your notification settings have been updated.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Save notification settings error:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meal Reminders</Text>
          <Text style={styles.sectionDescription}>
            Get reminded to log your meals at your preferred times
          </Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Enable Meal Reminders</Text>
              <Text style={styles.settingDescription}>
                Receive notifications to log your meals
              </Text>
            </View>
            <Switch
              value={settings.mealReminders}
              onValueChange={() => toggleSetting('mealReminders')}
              trackColor={{ false: colors.lightGray, true: colors.primary }}
              thumbColor={colors.white}
              testID="meal-reminders-switch"
            />
          </View>

          {settings.mealReminders && (
            <>
              <View style={styles.timeSettingRow}>
                <Text style={styles.timeLabel}>Breakfast</Text>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => showTimePickerForMeal('breakfast')}
                  testID="breakfast-time-button"
                >
                  <Clock size={16} color={colors.primary} />
                  <Text style={styles.timeText}>
                    {formatTime(settings.mealReminderTimes.breakfast)}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.timeSettingRow}>
                <Text style={styles.timeLabel}>Lunch</Text>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => showTimePickerForMeal('lunch')}
                  testID="lunch-time-button"
                >
                  <Clock size={16} color={colors.primary} />
                  <Text style={styles.timeText}>
                    {formatTime(settings.mealReminderTimes.lunch)}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.timeSettingRow}>
                <Text style={styles.timeLabel}>Dinner</Text>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => showTimePickerForMeal('dinner')}
                  testID="dinner-time-button"
                >
                  <Clock size={16} color={colors.primary} />
                  <Text style={styles.timeText}>
                    {formatTime(settings.mealReminderTimes.dinner)}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Water Reminders</Text>
          <Text style={styles.sectionDescription}>
            Stay hydrated with regular water intake reminders
          </Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Enable Water Reminders</Text>
              <Text style={styles.settingDescription}>
                Receive notifications to drink water
              </Text>
            </View>
            <Switch
              value={settings.waterReminders}
              onValueChange={() => toggleSetting('waterReminders')}
              trackColor={{ false: colors.lightGray, true: colors.primary }}
              thumbColor={colors.white}
              testID="water-reminders-switch"
            />
          </View>

          {settings.waterReminders && (
            <View style={styles.intervalContainer}>
              <Text style={styles.intervalLabel}>Reminder Interval</Text>
              <View style={styles.intervalButtons}>
                {[60, 120, 180, 240].map((interval) => (
                  <TouchableOpacity
                    key={interval}
                    style={[
                      styles.intervalButton,
                      settings.waterReminderInterval === interval && styles.selectedIntervalButton,
                    ]}
                    onPress={() => updateWaterInterval(interval)}
                    testID={`water-interval-${interval}`}
                  >
                    <Text
                      style={[
                        styles.intervalButtonText,
                        settings.waterReminderInterval === interval && styles.selectedIntervalButtonText,
                      ]}
                    >
                      {interval / 60}h
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievement & Progress</Text>
          <Text style={styles.sectionDescription}>
            Get notified about your progress and achievements
          </Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Goal Achievements</Text>
              <Text style={styles.settingDescription}>
                Celebrate when you reach your daily goals
              </Text>
            </View>
            <Switch
              value={settings.goalAchievements}
              onValueChange={() => toggleSetting('goalAchievements')}
              trackColor={{ false: colors.lightGray, true: colors.primary }}
              thumbColor={colors.white}
              testID="goal-achievements-switch"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Weekly Reports</Text>
              <Text style={styles.settingDescription}>
                Receive weekly nutrition summaries and insights
              </Text>
            </View>
            <Switch
              value={settings.weeklyReports}
              onValueChange={() => toggleSetting('weeklyReports')}
              trackColor={{ false: colors.lightGray, true: colors.primary }}
              thumbColor={colors.white}
              testID="weekly-reports-switch"
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
          testID="save-notifications"
        >
          <Save size={20} color={colors.white} />
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>
      </View>

      {showTimePicker.visible && showTimePicker.meal && (
        <DateTimePicker
          value={new Date(`2000-01-01T${settings.mealReminderTimes[showTimePicker.meal]}:00`)}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}
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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.darkGray,
  },
  timeSettingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingLeft: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  timeLabel: {
    fontSize: 16,
    color: colors.text,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  timeText: {
    fontSize: 16,
    color: colors.primary,
    marginLeft: 6,
    fontWeight: '600',
  },
  intervalContainer: {
    paddingLeft: 16,
    paddingTop: 12,
  },
  intervalLabel: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  intervalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  intervalButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  selectedIntervalButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  intervalButtonText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  selectedIntervalButtonText: {
    color: colors.white,
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