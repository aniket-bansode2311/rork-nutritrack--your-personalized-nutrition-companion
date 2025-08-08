import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Smartphone,
  MapPin,
  Eye,
  Lock,
  Activity
} from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { securityMonitor, loginAttemptTracker } from '@/lib/security';

interface SecurityEvent {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

interface ActiveSession {
  id: string;
  device: string;
  location: string;
  lastActivity: string;
  current: boolean;
}

export default function SecurityDashboard() {
  const router = useRouter();
  const { user, validateAndRefreshSession } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [securityScore, setSecurityScore] = useState(85);
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [failedAttempts, setFailedAttempts] = useState(0);

  useEffect(() => {
    loadSecurityData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      
      // Validate current session
      await validateAndRefreshSession();
      
      // Load failed login attempts
      if (user?.email) {
        const attempts = await loginAttemptTracker.getFailedAttempts(user.email);
        setFailedAttempts(attempts.count);
      }
      
      // Mock data - in a real app, this would come from your backend
      setRecentEvents([
        {
          id: '1',
          type: 'login_success',
          description: 'Successful login from new device',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          severity: 'low',
          resolved: true,
        },
        {
          id: '2',
          type: 'password_change',
          description: 'Password changed successfully',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          severity: 'medium',
          resolved: true,
        },
        {
          id: '3',
          type: 'suspicious_activity',
          description: 'Multiple failed login attempts detected',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          severity: 'high',
          resolved: true,
        },
      ]);
      
      setActiveSessions([
        {
          id: '1',
          device: 'iPhone 15 Pro',
          location: 'San Francisco, CA',
          lastActivity: 'Active now',
          current: true,
        },
        {
          id: '2',
          device: 'MacBook Pro',
          location: 'San Francisco, CA',
          lastActivity: '2 hours ago',
          current: false,
        },
      ]);
      
      // Calculate security score based on various factors
      calculateSecurityScore();
      
    } catch (error) {
      console.error('Error loading security data:', error);
      Alert.alert('Error', 'Failed to load security information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateSecurityScore = () => {
    let score = 100;
    
    // Deduct points for security issues
    if (failedAttempts > 0) score -= failedAttempts * 5;
    if (!user?.email_confirmed_at) score -= 20;
    if (recentEvents.some(e => e.severity === 'high' && !e.resolved)) score -= 15;
    if (recentEvents.some(e => e.severity === 'critical' && !e.resolved)) score -= 30;
    
    setSecurityScore(Math.max(0, score));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSecurityData();
  };

  const handleTerminateSession = (sessionId: string) => {
    Alert.alert(
      'Terminate Session',
      'Are you sure you want to terminate this session? The device will be signed out immediately.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Terminate',
          style: 'destructive',
          onPress: () => {
            // In a real app, this would call your backend to terminate the session
            setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
            
            securityMonitor.logSecurityEvent('session_terminated', {
              userId: user?.id,
              sessionId,
              terminatedAt: new Date().toISOString(),
            });
            
            Alert.alert('Success', 'Session terminated successfully');
          },
        },
      ]
    );
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return colors.success;
    if (score >= 70) return colors.warning;
    return colors.error;
  };

  const getSecurityScoreText = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return colors.error;
      case 'high': return '#ff6b35';
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.textSecondary;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading security information...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Security Score */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreHeader}>
          <Shield color={getSecurityScoreColor(securityScore)} size={32} />
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreTitle}>Security Score</Text>
            <Text style={[styles.scoreValue, { color: getSecurityScoreColor(securityScore) }]}>
              {securityScore}/100
            </Text>
            <Text style={styles.scoreStatus}>
              {getSecurityScoreText(securityScore)}
            </Text>
          </View>
        </View>
        
        <View style={styles.scoreBar}>
          <View 
            style={[
              styles.scoreProgress, 
              { 
                width: `${securityScore}%`,
                backgroundColor: getSecurityScoreColor(securityScore)
              }
            ]} 
          />
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <CheckCircle color={colors.success} size={24} />
          <Text style={styles.statValue}>{user?.email_confirmed_at ? 'Verified' : 'Pending'}</Text>
          <Text style={styles.statLabel}>Email Status</Text>
        </View>
        
        <View style={styles.statCard}>
          <AlertTriangle color={failedAttempts > 0 ? colors.warning : colors.success} size={24} />
          <Text style={styles.statValue}>{failedAttempts}</Text>
          <Text style={styles.statLabel}>Failed Attempts</Text>
        </View>
        
        <View style={styles.statCard}>
          <Smartphone color={colors.primary} size={24} />
          <Text style={styles.statValue}>{activeSessions.length}</Text>
          <Text style={styles.statLabel}>Active Sessions</Text>
        </View>
      </View>

      {/* Recent Security Events */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Security Events</Text>
        {recentEvents.length === 0 ? (
          <Text style={styles.emptyText}>No recent security events</Text>
        ) : (
          recentEvents.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <View style={[styles.severityDot, { backgroundColor: getSeverityColor(event.severity) }]} />
                <Text style={styles.eventDescription}>{event.description}</Text>
                {event.resolved && <CheckCircle color={colors.success} size={16} />}
              </View>
              <View style={styles.eventFooter}>
                <Clock color={colors.textSecondary} size={14} />
                <Text style={styles.eventTime}>{formatTimestamp(event.timestamp)}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Active Sessions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Sessions</Text>
        {activeSessions.map((session) => (
          <View key={session.id} style={styles.sessionCard}>
            <View style={styles.sessionInfo}>
              <Smartphone color={colors.primary} size={20} />
              <View style={styles.sessionDetails}>
                <Text style={styles.sessionDevice}>
                  {session.device}
                  {session.current && <Text style={styles.currentSession}> (Current)</Text>}
                </Text>
                <View style={styles.sessionMeta}>
                  <MapPin color={colors.textSecondary} size={14} />
                  <Text style={styles.sessionLocation}>{session.location}</Text>
                </View>
                <View style={styles.sessionMeta}>
                  <Activity color={colors.textSecondary} size={14} />
                  <Text style={styles.sessionActivity}>{session.lastActivity}</Text>
                </View>
              </View>
            </View>
            
            {!session.current && (
              <TouchableOpacity
                style={styles.terminateButton}
                onPress={() => handleTerminateSession(session.id)}
              >
                <Text style={styles.terminateButtonText}>Terminate</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* Security Recommendations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security Recommendations</Text>
        
        {!user?.email_confirmed_at && (
          <View style={styles.recommendationCard}>
            <AlertTriangle color={colors.warning} size={20} />
            <View style={styles.recommendationContent}>
              <Text style={styles.recommendationTitle}>Verify Your Email</Text>
              <Text style={styles.recommendationDescription}>
                Verify your email address to improve account security
              </Text>
            </View>
          </View>
        )}
        
        {failedAttempts > 0 && (
          <View style={styles.recommendationCard}>
            <AlertTriangle color={colors.error} size={20} />
            <View style={styles.recommendationContent}>
              <Text style={styles.recommendationTitle}>Review Failed Login Attempts</Text>
              <Text style={styles.recommendationDescription}>
                {failedAttempts} failed login attempts detected. Consider changing your password.
              </Text>
            </View>
          </View>
        )}
        
        <View style={styles.recommendationCard}>
          <Lock color={colors.primary} size={20} />
          <View style={styles.recommendationContent}>
            <Text style={styles.recommendationTitle}>Enable Two-Factor Authentication</Text>
            <Text style={styles.recommendationDescription}>
              Add an extra layer of security to your account
            </Text>
          </View>
        </View>
      </View>

      {/* Privacy Settings Link */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.privacyButton}
          onPress={() => router.push('/profile/privacy')}
        >
          <Eye color={colors.primary} size={20} />
          <Text style={styles.privacyButtonText}>Privacy Settings</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 50,
  },
  scoreCard: {
    backgroundColor: colors.white,
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreInfo: {
    marginLeft: 16,
    flex: 1,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  scoreStatus: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  scoreBar: {
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreProgress: {
    height: '100%',
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    backgroundColor: colors.white,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  eventCard: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  eventDescription: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  sessionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sessionDetails: {
    marginLeft: 12,
    flex: 1,
  },
  sessionDevice: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  currentSession: {
    color: colors.success,
    fontSize: 12,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  sessionLocation: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  sessionActivity: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  terminateButton: {
    backgroundColor: colors.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  terminateButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  recommendationContent: {
    marginLeft: 12,
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  recommendationDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  privacyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  privacyButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
});