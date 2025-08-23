import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Modal, TouchableOpacity } from 'react-native';
import { colors } from '@/constants/colors';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  transparent?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Loading...',
  transparent = false,
}) => {
  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={[styles.overlay, transparent && styles.transparentOverlay]}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
};

interface LoadingStateProps {
  loading: boolean;
  error?: Error | null;
  children: React.ReactNode;
  loadingMessage?: string;
  errorMessage?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  loading,
  error,
  children,
  loadingMessage = 'Loading...',
  errorMessage,
  onRetry,
  showRetry = true,
}) => {
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{loadingMessage}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>
          {errorMessage || error.message || 'An unexpected error occurred'}
        </Text>
        {showRetry && onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return <>{children}</>;
};

interface InlineLoadingProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  size = 'small',
  color = colors.primary,
  message,
}) => {
  return (
    <View style={styles.inlineContainer}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.inlineMessage}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transparentOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  container: {
    backgroundColor: colors.white,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  inlineMessage: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.darkGray,
  },
});