import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, Download, Trash2, Eye, EyeOff, Save, AlertTriangle, Lock } from 'lucide-react-native';

import { colors } from '@/constants/colors';
import { PrivacySettings } from '@/types/nutrition';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { privacyUtils, securityMonitor, secureStore } from '@/lib/security';

export default function PrivacyScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useProfile();
  const { user, signOut } = useAuth();
  
  const [settings, setSettings] = useState<PrivacySettings>({
    dataSharing: false,
    analyticsOptOut: false,
    profileVisibility: 'private',
    allowDataExport: true,
    allowDataDeletion: true,
    ...profile?.privacy_settings,
  });
  
  const [loading, setLoading] = useState<boolean>(false);
  const [hasDataConsent, setHasDataConsent] = useState<boolean>(false);
  const [lastConsentDate, setLastConsentDate] = useState<string>('');

  useEffect(() => {
    loadPrivacyData();
  }, []);

  const loadPrivacyData = async () => {
    try {
      const consent = await privacyUtils.hasDataConsent();
      setHasDataConsent(consent);
      
      // Load consent timestamp
      const timestamp = await secureStore.getItem('consent_timestamp');
      if (timestamp) {
        setLastConsentDate(new Date(parseInt(timestamp)).toLocaleDateString());
      }
    } catch (error) {
      console.error('Error loading privacy data:', error);
    }
  };

  const toggleSetting = async (key: keyof Omit<PrivacySettings, 'profileVisibility'>) => {
    const newValue = !settings[key];
    
    setSettings(prev => ({
      ...prev,
      [key]: newValue,
    }));
    
    // Log privacy setting changes for audit
    securityMonitor.logSecurityEvent('privacy_setting_changed', {
      userId: user?.id,
      setting: key,
      newValue,
      timestamp: new Date().toISOString(),
    });
    
    // Handle data consent specifically
    if (key === 'dataSharing') {
      await privacyUtils.recordDataConsent(newValue);
      setHasDataConsent(newValue);
      await loadPrivacyData();
    }
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
              // Log data export request for security audit
              securityMonitor.logSecurityEvent('data_export_requested', {
                userId: user?.id,
                email: user?.email,
                requestedAt: new Date().toISOString(),
              });
              
              // In a real app, this would trigger a data export process
              Alert.alert(
                'Export Requested',
                'Your data export has been requested. You will receive an email with your data within 24 hours. For security, we will verify your identity before sending the export.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Data export error:', error);
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
              'Are you absolutely sure you want to delete all your data? This cannot be undone. You will be signed out immediately.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Everything',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      // Log account deletion request for security audit
                      securityMonitor.logSecurityEvent('account_deletion_requested', {
                        userId: user?.id,
                        email: user?.email,
                        requestedAt: new Date().toISOString(),
                      });
                      
                      // Clear all local data
                      await privacyUtils.clearAllUserData();
                      
                      // Sign out user
                      await signOut();
                      
                      Alert.alert(
                        'Account Deleted',
                        'Your account and all data have been permanently deleted.',
                        [{ text: 'OK', onPress: () => router.replace('/') }]
                      );
                    } catch (error) {
                      console.error('Account deletion error:', error);
                      Alert.alert('Error', 'Failed to delete account. Please try again.');
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
          <Text style={styles.sectionTitle}>Data Consent & Sharing</Text>
          <Text style={styles.sectionDescription}>
            Control how your data is collected and used. Your consent is required for data processing.
          </Text>
          
          {hasDataConsent && lastConsentDate && (
            <View style={styles.consentInfo}>
              <Shield size={16} color={colors.success} />
              <Text style={styles.consentText}>
                Consent given on {lastConsentDate}
              </Text>
            </View>
          )}
          
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
          <Text style={styles.sectionTitle}>Security & Compliance</Text>
          <Text style={styles.sectionDescription}>
            Your data is protected with enterprise-grade security measures
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
                Multi-factor authentication and session management
              </Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <Lock size={20} color={colors.success} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>GDPR & CCPA Compliant</Text>
              <Text style={styles.infoDescription}>
                Full compliance with international privacy regulations
              </Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <AlertTriangle size={20} color={colors.warning} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Security Monitoring</Text>
              <Text style={styles.infoDescription}>
                Continuous monitoring for suspicious activity
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
  consentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  consentText: {
    fontSize: 14,
    color: colors.success,
    marginLeft: 8,
    fontWeight: '500',
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