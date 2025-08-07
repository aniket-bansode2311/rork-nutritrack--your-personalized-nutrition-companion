import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, User, Target, Scale, Dumbbell, Settings as SettingsIcon, LogOut, Bell, Shield, Smartphone, Utensils } from 'lucide-react-native';

import { colors } from '@/constants/colors';
import { useNutrition } from '@/hooks/useNutritionStore';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

export default function SettingsScreen() {
  const router = useRouter();
  const { userProfile } = useNutrition();
  const { signOut } = useAuth();
  const { profile } = useProfile();
  
  const navigateToProfile = () => {
    router.push('/profile');
  };
  
  const showComingSoon = () => {
    Alert.alert(
      'Coming Soon',
      'This feature will be available in a future update.',
      [{ text: 'OK' }]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  // Use profile data if available, fallback to userProfile
  const displayProfile = profile || userProfile;
  
  // Show loading state if profile is still loading
  if (!displayProfile) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.profileCard}>
          <View style={styles.profileIconContainer}>
            <User size={32} color={colors.white} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayProfile.name || 'User'}</Text>
            <Text style={styles.profileDetails}>
              {displayProfile.weight || 0} kg • {displayProfile.height || 0} cm • {displayProfile.age || 0} years
            </Text>
          </View>
          <TouchableOpacity onPress={navigateToProfile} testID="edit-profile-button">
            <ChevronRight size={24} color={colors.darkGray} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goals & Tracking</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={navigateToProfile} testID="nutrition-goals-button">
            <View style={styles.menuItemLeft}>
              <Target size={24} color={colors.primary} style={styles.menuItemIcon} />
              <Text style={styles.menuItemText}>Nutrition Goals</Text>
            </View>
            <ChevronRight size={20} color={colors.darkGray} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={showComingSoon} testID="weight-goals-button">
            <View style={styles.menuItemLeft}>
              <Scale size={24} color={colors.primary} style={styles.menuItemIcon} />
              <Text style={styles.menuItemText}>Weight Goals</Text>
            </View>
            <ChevronRight size={20} color={colors.darkGray} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={showComingSoon} testID="activity-level-button">
            <View style={styles.menuItemLeft}>
              <Dumbbell size={24} color={colors.primary} style={styles.menuItemIcon} />
              <Text style={styles.menuItemText}>Activity Level</Text>
            </View>
            <ChevronRight size={20} color={colors.darkGray} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => router.push('/profile/dietary-preferences')}
            testID="dietary-preferences-button"
          >
            <View style={styles.menuItemLeft}>
              <Utensils size={24} color={colors.primary} style={styles.menuItemIcon} />
              <Text style={styles.menuItemText}>Dietary Preferences</Text>
            </View>
            <ChevronRight size={20} color={colors.darkGray} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => router.push('/profile/notifications')}
            testID="notifications-button"
          >
            <View style={styles.menuItemLeft}>
              <Bell size={24} color={colors.primary} style={styles.menuItemIcon} />
              <Text style={styles.menuItemText}>Notifications</Text>
            </View>
            <ChevronRight size={20} color={colors.darkGray} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => router.push('/profile/privacy')}
            testID="privacy-button"
          >
            <View style={styles.menuItemLeft}>
              <Shield size={24} color={colors.primary} style={styles.menuItemIcon} />
              <Text style={styles.menuItemText}>Privacy & Data</Text>
            </View>
            <ChevronRight size={20} color={colors.darkGray} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => router.push('/profile/health-integrations')}
            testID="health-integrations-button"
          >
            <View style={styles.menuItemLeft}>
              <Smartphone size={24} color={colors.primary} style={styles.menuItemIcon} />
              <Text style={styles.menuItemText}>Health Integrations</Text>
            </View>
            <ChevronRight size={20} color={colors.darkGray} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={showComingSoon} testID="app-preferences-button">
            <View style={styles.menuItemLeft}>
              <SettingsIcon size={24} color={colors.primary} style={styles.menuItemIcon} />
              <Text style={styles.menuItemText}>App Preferences</Text>
            </View>
            <ChevronRight size={20} color={colors.darkGray} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.menuItem, styles.signOutItem]} 
            onPress={handleSignOut} 
            testID="sign-out-button"
          >
            <View style={styles.menuItemLeft}>
              <LogOut size={24} color={colors.danger} style={styles.menuItemIcon} />
              <Text style={[styles.menuItemText, styles.signOutText]}>Sign Out</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Version 1.0.0</Text>
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
  scrollView: {
    flex: 1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  profileIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  profileDetails: {
    fontSize: 14,
    color: colors.darkGray,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemIcon: {
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: colors.text,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.darkGray,
  },
  signOutItem: {
    borderBottomWidth: 0,
  },
  signOutText: {
    color: colors.danger,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: colors.darkGray,
  },
});