import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Switch, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Smartphone, Activity, Heart, Save, ExternalLink } from 'lucide-react-native';

import { colors } from '@/constants/colors';
import { HealthIntegrations } from '@/types/nutrition';
import { useProfile } from '@/hooks/useProfile';

export default function HealthIntegrationsScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useProfile();
  
  const [integrations, setIntegrations] = useState<HealthIntegrations>({
    appleHealth: {
      enabled: false,
      syncWeight: false,
      syncActivity: false,
      syncNutrition: false,
    },
    googleFit: {
      enabled: false,
      syncWeight: false,
      syncActivity: false,
      syncNutrition: false,
    },
    fitbit: {
      enabled: false,
      syncWeight: false,
      syncActivity: false,
    },
    ...profile?.health_integrations,
  });
  
  const [loading, setLoading] = useState<boolean>(false);

  const toggleIntegration = (
    platform: keyof HealthIntegrations,
    setting: string,
    value: boolean
  ) => {
    setIntegrations(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [setting]: value,
      },
    }));
  };

  const handleConnectAppleHealth = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Not Available', 'Apple Health is only available on iOS devices.');
      return;
    }

    Alert.alert(
      'Connect Apple Health',
      'This will allow the app to read and write health data to Apple Health.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Connect',
          onPress: () => {
            // In a real app, this would use react-native-health or similar
            toggleIntegration('appleHealth', 'enabled', true);
            Alert.alert('Success', 'Apple Health connected successfully!');
          },
        },
      ]
    );
  };

  const handleConnectGoogleFit = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Not Available', 'Google Fit is only available on Android devices.');
      return;
    }

    Alert.alert(
      'Connect Google Fit',
      'This will allow the app to read and write fitness data to Google Fit.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Connect',
          onPress: () => {
            // In a real app, this would use @react-native-google-fit/google-fit or similar
            toggleIntegration('googleFit', 'enabled', true);
            Alert.alert('Success', 'Google Fit connected successfully!');
          },
        },
      ]
    );
  };

  const handleConnectFitbit = async () => {
    Alert.alert(
      'Connect Fitbit',
      'You will be redirected to Fitbit to authorize the connection.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Connect',
          onPress: () => {
            // In a real app, this would open Fitbit OAuth flow
            toggleIntegration('fitbit', 'enabled', true);
            Alert.alert('Success', 'Fitbit connected successfully!');
          },
        },
      ]
    );
  };

  const handleDisconnect = (platform: keyof HealthIntegrations, platformName: string) => {
    Alert.alert(
      `Disconnect ${platformName}`,
      `This will stop syncing data with ${platformName}. Your existing data will not be affected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => {
            setIntegrations(prev => ({
              ...prev,
              [platform]: {
                ...prev[platform],
                enabled: false,
                syncWeight: false,
                syncActivity: false,
                syncNutrition: false,
              },
            }));
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    
    try {
      const { error } = await updateProfile({
        health_integrations: integrations,
      });

      if (error) {
        Alert.alert('Error', error);
        return;
      }

      Alert.alert(
        'Success',
        'Your health integration settings have been updated.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Save health integrations error:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderIntegrationSection = (
    platform: keyof HealthIntegrations,
    platformName: string,
    icon: React.ReactNode,
    onConnect: () => void,
    syncOptions: { key: string; label: string; description: string }[]
  ) => {
    const integration = integrations[platform];
    
    return (
      <View style={styles.section}>
        <View style={styles.integrationHeader}>
          {icon}
          <Text style={styles.sectionTitle}>{platformName}</Text>
        </View>
        
        {!integration.enabled ? (
          <View>
            <Text style={styles.sectionDescription}>
              Connect {platformName} to automatically sync your health data and get more accurate insights.
            </Text>
            <TouchableOpacity
              style={styles.connectButton}
              onPress={onConnect}
              testID={`connect-${platform}`}
            >
              <ExternalLink size={20} color={colors.white} />
              <Text style={styles.connectButtonText}>Connect {platformName}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.connectedStatus}>
              <Text style={styles.connectedText}>✓ Connected</Text>
              <TouchableOpacity
                style={styles.disconnectButton}
                onPress={() => handleDisconnect(platform, platformName)}
                testID={`disconnect-${platform}`}
              >
                <Text style={styles.disconnectButtonText}>Disconnect</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.syncOptionsTitle}>Sync Options</Text>
            
            {syncOptions.map((option) => (
              <View key={option.key} style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>{option.label}</Text>
                  <Text style={styles.settingDescription}>{option.description}</Text>
                </View>
                <Switch
                  value={integration[option.key as keyof typeof integration] as boolean}
                  onValueChange={(value) => toggleIntegration(platform, option.key, value)}
                  trackColor={{ false: colors.lightGray, true: colors.primary }}
                  thumbColor={colors.white}
                  testID={`${platform}-${option.key}-switch`}
                />
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Health Device Integration</Text>
          <Text style={styles.infoDescription}>
            Connect your health devices and apps to automatically track your activity, weight, and nutrition data for more accurate insights.
          </Text>
        </View>

        {Platform.OS === 'ios' && renderIntegrationSection(
          'appleHealth',
          'Apple Health',
          <Smartphone size={24} color={colors.primary} />,
          handleConnectAppleHealth,
          [
            { key: 'syncWeight', label: 'Sync Weight', description: 'Automatically update weight from Apple Health' },
            { key: 'syncActivity', label: 'Sync Activity', description: 'Import steps, workouts, and calories burned' },
            { key: 'syncNutrition', label: 'Sync Nutrition', description: 'Share nutrition data with Apple Health' },
          ]
        )}

        {Platform.OS === 'android' && renderIntegrationSection(
          'googleFit',
          'Google Fit',
          <Activity size={24} color={colors.primary} />,
          handleConnectGoogleFit,
          [
            { key: 'syncWeight', label: 'Sync Weight', description: 'Automatically update weight from Google Fit' },
            { key: 'syncActivity', label: 'Sync Activity', description: 'Import steps, workouts, and calories burned' },
            { key: 'syncNutrition', label: 'Sync Nutrition', description: 'Share nutrition data with Google Fit' },
          ]
        )}

        {renderIntegrationSection(
          'fitbit',
          'Fitbit',
          <Heart size={24} color={colors.primary} />,
          handleConnectFitbit,
          [
            { key: 'syncWeight', label: 'Sync Weight', description: 'Automatically update weight from Fitbit' },
            { key: 'syncActivity', label: 'Sync Activity', description: 'Import steps, workouts, and calories burned' },
          ]
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Notice</Text>
          <Text style={styles.privacyText}>
            • Your health data is encrypted and stored securely{'\n'}
            • Data is only shared with connected services you authorize{'\n'}
            • You can disconnect any service at any time{'\n'}
            • We never sell your personal health information
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
          testID="save-integrations"
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
  infoSection: {
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
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 20,
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
  integrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 16,
    lineHeight: 20,
  },
  connectButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  connectedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  connectedText: {
    fontSize: 16,
    color: colors.success,
    fontWeight: '600',
  },
  disconnectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  disconnectButtonText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '500',
  },
  syncOptionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
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
  privacyText: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 20,
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