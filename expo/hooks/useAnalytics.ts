import { useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import monitoring from '@/lib/monitoring';

interface UseScreenTrackingOptions {
  screenName: string;
  screenClass?: string;
  trackOnMount?: boolean;
  trackOnFocus?: boolean;
}

export const useScreenTracking = (options: UseScreenTrackingOptions) => {
  const {
    screenName,
    screenClass,
    trackOnMount = true,
    trackOnFocus = true,
  } = options;

  // Track screen view on component mount
  useEffect(() => {
    if (trackOnMount) {
      monitoring.logScreenView(screenName, screenClass);
    }
  }, [screenName, screenClass, trackOnMount]);

  // Track screen view when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (trackOnFocus && !trackOnMount) {
        monitoring.logScreenView(screenName, screenClass);
      }
    }, [screenName, screenClass, trackOnFocus, trackOnMount])
  );
};

export const useUserActionTracking = () => {
  const trackAction = useCallback((
    action: string,
    category?: string,
    label?: string,
    value?: number
  ) => {
    monitoring.logUserAction(action, category, label, value);
  }, []);

  const trackFeatureUsage = useCallback((feature: string, success: boolean = true) => {
    monitoring.logFeatureUsage(feature, success);
  }, []);

  const trackFoodLogged = useCallback((foodType: 'manual' | 'recipe' | 'barcode' | 'ai_recognition') => {
    monitoring.logFoodLogged(foodType);
  }, []);

  return {
    trackAction,
    trackFeatureUsage,
    trackFoodLogged,
  };
};

export const usePerformanceTracking = () => {
  const trackPerformance = useCallback((metric: string, value: number, unit: string = 'ms') => {
    monitoring.logPerformanceMetric(metric, value, unit);
  }, []);

  const trackApiCall = useCallback((
    endpoint: string,
    method: string,
    success: boolean,
    duration?: number
  ) => {
    monitoring.logApiCall(endpoint, method, success, duration);
  }, []);

  return {
    trackPerformance,
    trackApiCall,
  };
};

export default useScreenTracking;