import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, Download, Trash2, Eye, EyeOff, Save } from 'lucide-react-native';

import { colors } from '@/constants/colors';
import { PrivacySettings } from '@/types/nutrition';
import { useProfile } from '@/hooks/useProfile';

export default function PrivacyScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useProfile();
  
  const [settings, setSettings] = useState<PrivacySettings>({
    dataSharing: false,
    analyticsOptOut: false,
    profileVisibility: 'private',
    allowDataExport: true,
    allowDataDeletion: true,
    ...profile?.privacy_settings,
  });
  
  const [loading, setLoading] = useState<boolean>(false);

  const toggleSetting = (key: keyof Omit<PrivacySettings, 'profileVisibility'>) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const updateProfileVisibility = (visibility: 'private' | 'friends' | 'public') => {
    setSettings(prev => ({
      ...prev,
      profileVisibility: visibility,
    }));
  };

  const handleDataExport = async () => {
    Alert.alert(
      'Export Data',
      'We will prepare your data export and send it to your email address. This may take a few minutes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            try {
              // In a real app, this would trigger a data export process
              Alert.alert(
                'Export Requested',
                'Your data export has been requested. You will receive an email with your data within 24 hours.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to request data export. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDataDeletion = async () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your data including your profile, meal logs, and preferences. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'Are you absolutely sure you want to delete all your data? This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Everything',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      // In a real app, this would trigger account deletion
                      Alert.alert(
                        'Deletion Requested',
                        'Your account deletion has been requested. All data will be permanently deleted within 30 days.',
                        [{ text: 'OK' }]
                      );
                    } catch (error) {
                      Alert.alert('Error', 'Failed to request data deletion. Please try again.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    
    try {
      const { error } = await updateProfile({
        privacy_settings: settings,
      });

      if (error) {
        Alert.alert('Error', error);
        return;
      }

      Alert.alert(
        'Success',
        'Your privacy settings have been updated.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Save privacy settings error:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Sharing</Text>
          <Text style={styles.sectionDescription}>
            Control how your data is used to improve our services
          </Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Share Anonymous Data</Text>
              <Text style={styles.settingDescription}>
                Help improve the app by sharing anonymous usage data
              </Text>
            </View>
            <Switch
              value={settings.dataSharing}
              onValueChange={() => toggleSetting('dataSharing')}
              trackColor={{ false: colors.lightGray, true: colors.primary }}
              thumbColor={colors.white}
              testID="data-sharing-switch"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Opt Out of Analytics</Text>
              <Text style={styles.settingDescription}>
                Disable all analytics and tracking
              </Text>
            </View>
            <Switch
              value={settings.analyticsOptOut}
              onValueChange={() => toggleSetting('analyticsOptOut')}
              trackColor={{ false: colors.lightGray, true: colors.primary }}
              thumbColor={colors.white}
              testID="analytics-opt-out-switch"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Visibility</Text>
          <Text style={styles.sectionDescription}>
            Choose who can see your profile and progress
          </Text>
          
          <View style={styles.visibilityOptions}>
            <TouchableOpacity
              style={[
                styles.visibilityOption,
                settings.profileVisibility === 'private' && styles.selectedVisibilityOption,
              ]}
              onPress={() => updateProfileVisibility('private')}
              testID="visibility-private"
            >
              <EyeOff size={20} color={settings.profileVisibility === 'private' ? colors.white : colors.text} />
              <View style={styles.visibilityContent}>
                <Text
                  style={[
                    styles.visibilityTitle,
                    settings.profileVisibility === 'private' && styles.selectedVisibilityTitle,
                  ]}
                >
                  Private
                </Text>
                <Text
                  style={[
                    styles.visibilityDescription,
                    settings.profileVisibility === 'private' && styles.selectedVisibilityDescription,
                  ]}
                >
                  Only you can see your profile and data
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.visibilityOption,
                settings.profileVisibility === 'friends' && styles.selectedVisibilityOption,
              ]}
              onPress={() => updateProfileVisibility('friends')}
              testID="visibility-friends"
            >
              <Eye size={20} color={settings.profileVisibility === 'friends' ? colors.white : colors.text} />
              <View style={styles.visibilityContent}>
                <Text
                  style={[
                    styles.visibilityTitle,
                    settings.profileVisibility === 'friends' && styles.selectedVisibilityTitle,
                  ]}
                >
                  Friends Only
                </Text>
                <Text
                  style={[
                    styles.visibilityDescription,
                    settings.profileVisibility === 'friends' && styles.selectedVisibilityDescription,
                  ]}
                >
                  Only your friends can see your progress
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.visibilityOption,
                settings.profileVisibility === 'public' && styles.selectedVisibilityOption,
              ]}
              onPress={() => updateProfileVisibility('public')}
              testID="visibility-public"
            >
              <Eye size={20} color={settings.profileVisibility === 'public' ? colors.white : colors.text} />
              <View style={styles.visibilityContent}>
                <Text
                  style={[
                    styles.visibilityTitle,
                    settings.profileVisibility === 'public' && styles.selectedVisibilityTitle,
                  ]}
                >
                  Public
                </Text>
                <Text
                  style={[
                    styles.visibilityDescription,
                    settings.profileVisibility === 'public' && styles.selectedVisibilityDescription,
                  ]}
                >
                  Anyone can see your public profile
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Rights</Text>
          <Text style={styles.sectionDescription}>
            Manage your personal data and exercise your privacy rights
          </Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDataExport}
            testID="export-data-button"
          >
            <Download size={20} color={colors.primary} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Export My Data</Text>
              <Text style={styles.actionDescription}>
                Download a copy of all your personal data
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.dangerActionButton]}
            onPress={handleDataDeletion}
            testID="delete-data-button"
          >
            <Trash2 size={20} color={colors.danger} />
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, styles.dangerActionTitle]}>
                Delete All Data
              </Text>
              <Text style={styles.actionDescription}>
                Permanently delete your account and all data
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <Text style={styles.sectionDescription}>
            Additional security and privacy controls
          </Text>
          
          <View style={styles.infoRow}>
            <Shield size={20} color={colors.success} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Data Encryption</Text>
              <Text style={styles.infoDescription}>
                All your data is encrypted in transit and at rest
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Shield size={20} color={colors.success} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Secure Authentication</Text>
              <Text style={styles.infoDescription}>
                Your account is protected with industry-standard security
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
          testID="save-privacy"
        >
          <Save size={20} color={colors.white} />
          <Text style={styles.saveButtonText}>Save Settings</Text>
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
  visibilityOptions: {
    gap: 12,
  },
  visibilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  selectedVisibilityOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  visibilityContent: {
    flex: 1,
    marginLeft: 12,
  },
  visibilityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  selectedVisibilityTitle: {
    color: colors.white,
  },
  visibilityDescription: {
    fontSize: 14,
    color: colors.darkGray,
  },
  selectedVisibilityDescription: {
    color: colors.white,
    opacity: 0.9,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  dangerActionButton: {
    borderColor: colors.danger,
  },
  actionContent: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  dangerActionTitle: {
    color: colors.danger,
  },
  actionDescription: {
    fontSize: 14,
    color: colors.darkGray,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  infoDescription: {
    fontSize: 14,
    color: colors.darkGray,
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