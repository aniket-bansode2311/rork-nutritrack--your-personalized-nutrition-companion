import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AlertTriangle, RefreshCw, Home, WifiOff } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { router } from 'expo-router';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId: string;
}

class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorId: this.generateErrorId(),
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2),
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error for analytics
    this.logError(error, errorInfo);
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  private generateErrorId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private logError(error: Error, errorInfo: React.ErrorInfo) {
    const errorReport = {
      id: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location?.href || 'mobile-app',
    };

    console.error('Error Boundary caught an error:', errorReport);
    
    // In a real app, you would send this to your error tracking service
    // Example: Sentry.captureException(error, { extra: errorReport });
  }

  private getErrorType(error?: Error): 'network' | 'auth' | 'data' | 'unknown' {
    if (!error) return 'unknown';
    
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return 'network';
    }
    
    if (message.includes('auth') || message.includes('unauthorized') || message.includes('forbidden')) {
      return 'auth';
    }
    
    if (message.includes('null') || message.includes('undefined') || message.includes('cannot read')) {
      return 'data';
    }
    
    return 'unknown';
  }

  private getErrorMessage(errorType: string): { title: string; message: string; icon: ReactNode } {
    switch (errorType) {
      case 'network':
        return {
          title: 'Connection Problem',
          message: 'We\'re having trouble connecting to our servers. Please check your internet connection and try again.',
          icon: <WifiOff color={colors.error} size={48} />,
        };
      case 'auth':
        return {
          title: 'Authentication Error',
          message: 'Your session has expired. Please sign in again to continue.',
          icon: <AlertTriangle color={colors.error} size={48} />,
        };
      case 'data':
        return {
          title: 'Data Error',
          message: 'We encountered an issue loading your data. This is usually temporary.',
          icon: <AlertTriangle color={colors.error} size={48} />,
        };
      default:
        return {
          title: 'Something Went Wrong',
          message: 'We encountered an unexpected error. Our team has been notified and is working on a fix.',
          icon: <AlertTriangle color={colors.error} size={48} />,
        };
    }
  }

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        errorId: this.generateErrorId(),
      });
    }
  };

  private handleGoHome = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: this.generateErrorId(),
    });
    router.replace('/(tabs)');
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorType = this.getErrorType(this.state.error);
      const { title, message, icon } = this.getErrorMessage(errorType);
      const canRetry = this.retryCount < this.maxRetries;

      return (
        <View style={styles.container}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.iconContainer}>
              <View>{icon}</View>
            </View>
            
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            
            {__DEV__ && this.state.error && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Info (Development Only)</Text>
                <Text style={styles.debugText}>Error ID: {this.state.errorId}</Text>
                <Text style={styles.debugText}>Message: {this.state.error.message}</Text>
                {this.state.error.stack && (
                  <ScrollView style={styles.stackTrace} horizontal>
                    <Text style={styles.stackText}>{this.state.error.stack}</Text>
                  </ScrollView>
                )}
              </View>
            )}
            
            <View style={styles.buttonContainer}>
              {canRetry && (
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={this.handleRetry}
                  testID="error-retry-button"
                >
                  <RefreshCw color={colors.white} size={20} style={styles.buttonIcon} />
                  <Text style={styles.primaryButtonText}>
                    Try Again ({this.maxRetries - this.retryCount} left)
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={this.handleGoHome}
                testID="error-home-button"
              >
                <Home color={colors.primary} size={20} style={styles.buttonIcon} />
                <Text style={styles.secondaryButtonText}>Go to Home</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.supportText}>
              If this problem persists, please contact support with error ID: {this.state.errorId}
            </Text>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 300,
  },
  debugContainer: {
    backgroundColor: colors.lightGray,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
    maxWidth: 400,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: colors.darkGray,
    marginBottom: 4,
  },
  stackTrace: {
    maxHeight: 100,
    marginTop: 8,
  },
  stackText: {
    fontSize: 10,
    color: colors.darkGray,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  supportText: {
    fontSize: 12,
    color: colors.darkGray,
    textAlign: 'center',
    marginTop: 24,
    fontStyle: 'italic',
  },
});

export default ErrorBoundary;