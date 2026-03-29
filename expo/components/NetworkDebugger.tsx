import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { RefreshCw, Wifi, WifiOff, AlertTriangle } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { resetTRPCClient } from '@/lib/trpc';

interface NetworkDebuggerProps {
  onRetry?: () => void;
}

export const NetworkDebugger: React.FC<NetworkDebuggerProps> = ({ onRetry }) => {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'failed'>('unknown');
  const [lastError, setLastError] = useState<string | null>(null);

  const testConnection = async () => {
    setIsTestingConnection(true);
    setLastError(null);
    
    try {
      console.log('Testing tRPC connection...');
      
      // Reset the client to force a fresh connection
      resetTRPCClient();
      
      // Try to make a simple API call using the client directly
      const { trpcClient } = await import('@/lib/trpc');
      const result = await trpcClient.example.hi.query({ name: 'Test' });
      
      console.log('Connection test successful:', result);
      setConnectionStatus('connected');
      
      Alert.alert(
        'Connection Test Successful',
        `Server responded: ${result.greeting}`,
        [{ text: 'OK' }]
      );
      
    } catch (error: any) {
      console.error('Connection test failed:', error);
      setConnectionStatus('failed');
      setLastError(error.message || 'Unknown error');
      
      Alert.alert(
        'Connection Test Failed',
        `Error: ${error.message || 'Unknown error'}\\n\\nPlease check:\\n1. Backend server is running\\n2. Network connection\\n3. API endpoint configuration`,
        [
          { text: 'Retry', onPress: testConnection },
          { text: 'Cancel' }
        ]
      );
    } finally {
      setIsTestingConnection(false);
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return colors.success;
      case 'failed': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi size={20} color={colors.success} />;
      case 'failed': return <WifiOff size={20} color={colors.error} />;
      default: return <AlertTriangle size={20} color={colors.textSecondary} />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'failed': return 'Connection Failed';
      default: return 'Unknown';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Network Debugger</Text>
        <View style={styles.statusContainer}>
          {getStatusIcon()}
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
      </View>

      {lastError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Last Error:</Text>
          <Text style={styles.errorText}>{lastError}</Text>
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Connection Info:</Text>
        <Text style={styles.infoText}>Platform: {Platform.OS}</Text>
        <Text style={styles.infoText}>
          API Base URL: {__DEV__ ? 
            (Platform.OS === 'web' ? 'http://localhost:3000' : process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000') :
            process.env.EXPO_PUBLIC_RORK_API_BASE_URL || 'https://toolkit.rork.com'
          }
        </Text>
        <Text style={styles.infoText}>Environment: {__DEV__ ? 'Development' : 'Production'}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={testConnection}
          disabled={isTestingConnection}
        >
          <RefreshCw 
            size={20} 
            color={colors.white} 
            style={isTestingConnection ? { opacity: 0.5 } : {}}
          />
          <Text style={styles.buttonText}>
            {isTestingConnection ? 'Testing...' : 'Test Connection'}
          </Text>
        </TouchableOpacity>

        {onRetry && (
          <TouchableOpacity
            style={[styles.button, styles.retryButton]}
            onPress={onRetry}
          >
            <RefreshCw size={20} color={colors.primary} />
            <Text style={[styles.buttonText, { color: colors.primary }]}>
              Retry App
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.troubleshooting}>
        <Text style={styles.troubleshootingTitle}>Troubleshooting:</Text>
        <Text style={styles.troubleshootingText}>
          1. Ensure backend server is running on port 3000{'\n'}
          2. Check network connectivity{'\n'}
          3. Verify API endpoint configuration{'\n'}
          4. Check browser console for detailed errors
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    margin: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: colors.error + '15',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  infoContainer: {
    backgroundColor: colors.gray50,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  testButton: {
    backgroundColor: colors.primary,
  },
  retryButton: {
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  troubleshooting: {
    backgroundColor: colors.gray50,
    borderRadius: 8,
    padding: 12,
  },
  troubleshootingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  troubleshootingText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});