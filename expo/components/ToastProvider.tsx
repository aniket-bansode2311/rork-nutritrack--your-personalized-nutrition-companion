import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react-native';
import { colors } from '@/constants/colors';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  type?: ToastType;
  duration?: number;
  position?: 'top' | 'bottom';
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  position: 'top' | 'bottom';
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastContextType {
  showToast: (message: string, options?: ToastOptions) => void;
  hideToast: (id: string) => void;
  showSuccess: (message: string, options?: Omit<ToastOptions, 'type'>) => void;
  showError: (message: string, options?: Omit<ToastOptions, 'type'>) => void;
  showWarning: (message: string, options?: Omit<ToastOptions, 'type'>) => void;
  showInfo: (message: string, options?: Omit<ToastOptions, 'type'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastItem: React.FC<{
  toast: Toast;
  onHide: (id: string) => void;
}> = ({ toast, onHide }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(toast.position === 'top' ? -100 : 100));

  React.useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide
    if (toast.duration > 0) {
      const timer = setTimeout(() => {
        hideToast();
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, []);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: toast.position === 'top' ? -100 : 100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide(toast.id);
    });
  };

  const getToastStyle = () => {
    switch (toast.type) {
      case 'success':
        return {
          backgroundColor: '#10B981',
          borderColor: '#10B981',
        };
      case 'error':
        return {
          backgroundColor: '#EF4444',
          borderColor: '#EF4444',
        };
      case 'warning':
        return {
          backgroundColor: '#F59E0B',
          borderColor: '#F59E0B',
        };
      case 'info':
      default:
        return {
          backgroundColor: '#3B82F6',
          borderColor: '#3B82F6',
        };
    }
  };

  const getIcon = () => {
    const iconProps = { size: 20, color: colors.white };
    
    switch (toast.type) {
      case 'success':
        return <CheckCircle {...iconProps} />;
      case 'error':
        return <XCircle {...iconProps} />;
      case 'warning':
        return <AlertTriangle {...iconProps} />;
      case 'info':
      default:
        return <Info {...iconProps} />;
    }
  };

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          [toast.position]: Platform.OS === 'web' ? 20 : 0,
        },
        getToastStyle(),
      ]}
    >
      <View style={styles.toastContent}>
        <View style={styles.iconContainer}>
          {getIcon()}
        </View>
        
        <Text style={styles.toastMessage} numberOfLines={3}>
          {toast.message}
        </Text>
        
        {toast.action && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={toast.action.onPress}
          >
            <Text style={styles.actionText}>{toast.action.label}</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={styles.closeButton}
          onPress={hideToast}
          testID={`toast-close-${toast.id}`}
        >
          <X size={16} color={colors.white} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, options: ToastOptions = {}) => {
    const {
      type = 'info',
      duration = 4000,
      position = 'top',
      action,
    } = options;

    const id = Date.now().toString() + Math.random().toString(36).substr(2);
    
    const newToast: Toast = {
      id,
      message,
      type,
      duration,
      position,
      action,
    };

    setToasts(prev => {
      // Limit to 3 toasts at a time
      const filtered = prev.slice(-2);
      return [...filtered, newToast];
    });
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = useCallback((message: string, options: Omit<ToastOptions, 'type'> = {}) => {
    showToast(message, { ...options, type: 'success' });
  }, [showToast]);

  const showError = useCallback((message: string, options: Omit<ToastOptions, 'type'> = {}) => {
    showToast(message, { ...options, type: 'error' });
  }, [showToast]);

  const showWarning = useCallback((message: string, options: Omit<ToastOptions, 'type'> = {}) => {
    showToast(message, { ...options, type: 'warning' });
  }, [showToast]);

  const showInfo = useCallback((message: string, options: Omit<ToastOptions, 'type'> = {}) => {
    showToast(message, { ...options, type: 'info' });
  }, [showToast]);

  const contextValue: ToastContextType = {
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* Toast Container */}
      <View style={styles.toastWrapper} pointerEvents="box-none">
        <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
          {toasts.map(toast => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onHide={hideToast}
            />
          ))}
        </SafeAreaView>
      </View>
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  safeArea: {
    flex: 1,
  },
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 56,
  },
  iconContainer: {
    marginRight: 12,
  },
  toastMessage: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.white,
    lineHeight: 20,
  },
  actionButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
});

export default ToastProvider;