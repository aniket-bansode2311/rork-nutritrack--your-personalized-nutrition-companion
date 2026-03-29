import { useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import monitoring from '@/lib/monitoring';

export interface ErrorState {
  hasError: boolean;
  error: Error | null;
  errorType: 'network' | 'auth' | 'validation' | 'server' | 'unknown';
  isRetrying: boolean;
  retryCount: number;
}

export interface ErrorHandlerOptions {
  maxRetries?: number;
  showAlert?: boolean;
  logError?: boolean;
  onError?: (error: Error) => void;
  onRetry?: () => void;
}

export const useErrorHandler = (options: ErrorHandlerOptions = {}) => {
  const {
    maxRetries = 3,
    showAlert = true,
    logError = true,
    onError,
    onRetry,
  } = options;

  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    errorType: 'unknown',
    isRetrying: false,
    retryCount: 0,
  });

  const getErrorType = useCallback((error: Error): ErrorState['errorType'] => {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch failed') || message.includes('timeout')) {
      return 'network';
    }
    
    if (message.includes('auth') || message.includes('unauthorized') || message.includes('forbidden')) {
      return 'auth';
    }
    
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return 'validation';
    }
    
    if (message.includes('server') || message.includes('internal') || message.includes('500')) {
      return 'server';
    }
    
    return 'unknown';
  }, []);

  const getUserFriendlyMessage = useCallback((error: Error, errorType: ErrorState['errorType']): string => {
    switch (errorType) {
      case 'network':
        return 'Please check your internet connection and try again.';
      case 'auth':
        return 'Your session has expired. Please sign in again.';
      case 'validation':
        return 'Please check your input and try again.';
      case 'server':
        return 'Our servers are experiencing issues. Please try again in a moment.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }, []);

  const logErrorDetails = useCallback((error: Error, context?: string) => {
    if (!logError) return;

    const errorDetails = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
      userAgent: Platform.OS === 'web' ? navigator.userAgent : undefined,
    };

    console.error('Error Handler:', errorDetails);
    
    // Send to monitoring service
    monitoring.captureError(error, {
      context,
      platform: Platform.OS,
      userAgent: Platform.OS === 'web' ? navigator.userAgent : undefined,
    });
  }, [logError]);

  const handleError = useCallback(async (error: Error, context?: string) => {
    const errorType = getErrorType(error);
    
    logErrorDetails(error, context);
    
    setErrorState(prev => ({
      hasError: true,
      error,
      errorType,
      isRetrying: false,
      retryCount: prev.retryCount,
    }));

    if (showAlert) {
      const message = getUserFriendlyMessage(error, errorType);
      Alert.alert('Error', message);
    }

    onError?.(error);
  }, [getErrorType, logErrorDetails, showAlert, getUserFriendlyMessage, onError]);

  const retry = useCallback(async (retryFn: () => Promise<void> | void) => {
    if (errorState.retryCount >= maxRetries) {
      Alert.alert('Error', 'Maximum retry attempts reached. Please try again later.');
      return;
    }

    setErrorState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1,
    }));

    try {
      await retryFn();
      
      // Success - clear error state
      setErrorState({
        hasError: false,
        error: null,
        errorType: 'unknown',
        isRetrying: false,
        retryCount: 0,
      });
      
      onRetry?.();
    } catch (error) {
      await handleError(error as Error, 'retry');
    }
  }, [errorState.retryCount, maxRetries, handleError, onRetry]);

  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      errorType: 'unknown',
      isRetrying: false,
      retryCount: 0,
    });
  }, []);

  const checkNetworkConnection = useCallback(async (): Promise<boolean> => {
    try {
      const netInfo = await NetInfo.fetch();
      return netInfo.isConnected === true;
    } catch (error) {
      console.warn('Failed to check network connection:', error);
      return false;
    }
  }, []);

  const handleAsyncOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T | null> => {
    try {
      // Check network connection for network operations
      if (context?.includes('network') || context?.includes('api')) {
        const isConnected = await checkNetworkConnection();
        if (!isConnected) {
          throw new Error('NETWORK_ERROR: No internet connection');
        }
      }

      const result = await operation();
      
      // Clear any previous errors on success
      if (errorState.hasError) {
        clearError();
      }
      
      return result;
    } catch (error) {
      await handleError(error as Error, context);
      return null;
    }
  }, [checkNetworkConnection, errorState.hasError, clearError, handleError]);

  return {
    errorState,
    handleError,
    retry,
    clearError,
    handleAsyncOperation,
    checkNetworkConnection,
  };
};

// Utility functions for common error scenarios
export const createNetworkError = (message: string = 'Network request failed') => {
  return new Error(`NETWORK_ERROR: ${message}`);
};

export const createAuthError = (message: string = 'Authentication failed') => {
  return new Error(`AUTH_ERROR: ${message}`);
};

export const createValidationError = (message: string = 'Validation failed') => {
  return new Error(`VALIDATION_ERROR: ${message}`);
};

export const createServerError = (message: string = 'Server error') => {
  return new Error(`SERVER_ERROR: ${message}`);
};

// Error boundary hook for functional components
export const useErrorBoundary = () => {
  const [error, setError] = useState<Error | null>(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const captureError = useCallback((error: Error) => {
    setError(error);
  }, []);

  if (error) {
    throw error;
  }

  return { captureError, resetError };
};

// Network status monitoring
export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  const checkConnection = useCallback(async () => {
    try {
      const netInfo = await NetInfo.fetch();
      setIsConnected(netInfo.isConnected === true);
      setConnectionType(netInfo.type || 'unknown');
      return netInfo.isConnected === true;
    } catch (error) {
      console.warn('Network check failed:', error);
      setIsConnected(false);
      return false;
    }
  }, []);

  return {
    isConnected,
    connectionType,
    checkConnection,
  };
};