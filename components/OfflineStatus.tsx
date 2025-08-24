import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Wifi, WifiOff, Database, Send, Trash2, Info } from 'lucide-react-native';
import { cacheManager } from '@/lib/cache-manager';

interface OfflineStatusProps {
  isOfflineMode?: boolean;
  onSyncPress?: () => void;
  onClearCachePress?: () => void;
}

export const OfflineStatus: React.FC<OfflineStatusProps> = ({
  isOfflineMode = false,
  onSyncPress,
  onClearCachePress,
}) => {
  const [cacheInfo, setCacheInfo] = useState({
    cacheSize: 0,
    syncQueueLength: 0,
    isOnline: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const updateCacheInfo = async () => {
      try {
        const size = await cacheManager.getCacheSize();
        const syncQueueLength = cacheManager.getSyncQueueLength();
        const isOnline = cacheManager.isNetworkAvailable();
        
        setCacheInfo({
          cacheSize: size,
          syncQueueLength,
          isOnline,
        });
      } catch (error) {
        console.error('Failed to get cache info:', error);
      }
    };

    updateCacheInfo();
    const interval = setInterval(updateCacheInfo, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  const handleSyncPress = async () => {
    if (!cacheInfo.isOnline) {
      Alert.alert('Offline', 'Cannot sync while offline. Please check your internet connection.');
      return;
    }

    if (cacheInfo.syncQueueLength === 0) {
      Alert.alert('No Changes', 'No pending changes to sync.');
      return;
    }

    setIsLoading(true);
    try {
      await cacheManager.forceSyncNow();
      onSyncPress?.();
      Alert.alert('Success', 'All changes have been synced successfully.');
    } catch (error) {
      console.error('Sync failed:', error);
      Alert.alert('Sync Failed', 'Failed to sync changes. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will remove all cached data. You may need to reload data when you go back online. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await cacheManager.clear();
              onClearCachePress?.();
              Alert.alert('Success', 'Cache cleared successfully.');
            } catch (error) {
              console.error('Failed to clear cache:', error);
              Alert.alert('Error', 'Failed to clear cache.');
            }
          },
        },
      ]
    );
  };

  const showCacheDetails = () => {
    Alert.alert(
      'Cache Information',
      `Cache Size: ${cacheInfo.cacheSize} items\\nPending Sync: ${cacheInfo.syncQueueLength} items\\nStatus: ${cacheInfo.isOnline ? 'Online' : 'Offline'}\\n\\nCached data allows you to use the app offline. Pending sync items will be uploaded when you're back online.`
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={styles.statusIndicator}>
          {cacheInfo.isOnline ? (
            <Wifi size={16} color="#10B981" />
          ) : (
            <WifiOff size={16} color="#EF4444" />
          )}
          <Text style={[styles.statusText, { color: cacheInfo.isOnline ? '#10B981' : '#EF4444' }]}>
            {cacheInfo.isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>

        <View style={styles.cacheInfo}>
          <Database size={14} color="#6B7280" />
          <Text style={styles.cacheText}>{cacheInfo.cacheSize}</Text>
          
          {cacheInfo.syncQueueLength > 0 && (
            <>
              <Send size={14} color="#F59E0B" />
              <Text style={styles.pendingText}>{cacheInfo.syncQueueLength}</Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.infoButton]}
          onPress={showCacheDetails}
        >
          <Info size={14} color="#6B7280" />
        </TouchableOpacity>

        {cacheInfo.syncQueueLength > 0 && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.syncButton,
              (!cacheInfo.isOnline || isLoading) && styles.disabledButton
            ]}
            onPress={handleSyncPress}
            disabled={!cacheInfo.isOnline || isLoading}
          >
            <Send size={14} color={cacheInfo.isOnline && !isLoading ? '#10B981' : '#9CA3AF'} />
            <Text style={[
              styles.actionText,
              { color: cacheInfo.isOnline && !isLoading ? '#10B981' : '#9CA3AF' }
            ]}>
              {isLoading ? 'Syncing...' : 'Sync'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.clearButton]}
          onPress={handleClearCache}
        >
          <Trash2 size={14} color="#EF4444" />
          <Text style={[styles.actionText, { color: '#EF4444' }]}>Clear</Text>
        </TouchableOpacity>
      </View>

      {isOfflineMode && (
        <View style={styles.offlineBanner}>
          <WifiOff size={16} color="#F59E0B" />
          <Text style={styles.offlineText}>
            You&apos;re offline. Changes will sync when connection is restored.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cacheInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cacheText: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 8,
  },
  pendingText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  infoButton: {
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  syncButton: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  clearButton: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  disabledButton: {
    borderColor: '#D1D5DB',
    backgroundColor: '#F3F4F6',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  offlineText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
});