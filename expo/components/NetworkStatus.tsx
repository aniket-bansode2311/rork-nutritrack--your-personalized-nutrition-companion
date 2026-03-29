import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react-native';
import { colors } from '@/constants/colors';

interface NetworkStatusProps {
  isOnline?: boolean;
  onRetry?: () => void;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({ 
  isOnline = true, 
  onRetry 
}) => {
  const [showStatus, setShowStatus] = useState<boolean>(false);

  useEffect(() => {
    if (!isOnline) {
      setShowStatus(true);
    } else {
      // Hide status after a delay when back online
      const timer = setTimeout(() => {
        setShowStatus(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!showStatus) {
    return null;
  }

  return (
    <View style={[styles.container, isOnline ? styles.online : styles.offline]}>
      <View style={styles.content}>
        {isOnline ? (
          <Wifi size={16} color={colors.white} />
        ) : (
          <WifiOff size={16} color={colors.white} />
        )}
        <Text style={styles.text}>
          {isOnline ? 'Back online' : 'No internet connection'}
        </Text>
        {!isOnline && onRetry && (
          <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
            <RefreshCw size={14} color={colors.white} />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  online: {
    backgroundColor: colors.success,
  },
  offline: {
    backgroundColor: colors.error,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  retryText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
});