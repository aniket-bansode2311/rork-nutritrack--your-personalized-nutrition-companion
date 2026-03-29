// Production configuration utilities
import React from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const PRODUCTION_CONFIG = {
  // Environment detection
  isDevelopment: __DEV__,
  isProduction: !__DEV__,
  
  // API Configuration
  apiTimeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second base delay
  
  // Performance thresholds
  maxBundleSize: 50 * 1024 * 1024, // 50MB
  maxStartupTime: 3000, // 3 seconds
  maxApiResponseTime: 2000, // 2 seconds
  
  // Security settings
  enableDebugLogs: __DEV__,
  enableDevTools: __DEV__,
  enableSourceMaps: __DEV__,
  
  // Cache settings
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  maxCacheSize: 100 * 1024 * 1024, // 100MB
  
  // Analytics
  enableAnalytics: !__DEV__,
  enableCrashReporting: !__DEV__,
  enablePerformanceMonitoring: !__DEV__,
} as const;

// Environment-specific URLs
export const getApiBaseUrl = (): string => {
  const envUrl = Constants.expoConfig?.extra?.apiBaseUrl || process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  
  if (PRODUCTION_CONFIG.isProduction) {
    return envUrl || 'https://toolkit.rork.com';
  }
  
  return envUrl || 'https://toolkit.rork.com';
};

// Supabase configuration
export const getSupabaseConfig = () => {
  const url = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !anonKey) {
    throw new Error('Supabase configuration missing. Please check environment variables.');
  }
  
  return { url, anonKey };
};

// Performance monitoring utilities
export const performanceMonitor = {
  // Track app startup time
  trackStartupTime: (() => {
    const startTime = Date.now();
    return () => {
      const startupTime = Date.now() - startTime;
      if (PRODUCTION_CONFIG.enableAnalytics) {
        console.log(`App startup time: ${startupTime}ms`);
        // In production, send to analytics service
      }
      return startupTime;
    };
  })(),
  
  // Track API response times
  trackApiCall: async <T>(
    apiCall: () => Promise<T>,
    endpoint: string
  ): Promise<T> => {
    const startTime = Date.now();
    
    try {
      const result = await apiCall();
      const responseTime = Date.now() - startTime;
      
      if (PRODUCTION_CONFIG.enableAnalytics) {
        console.log(`API ${endpoint} response time: ${responseTime}ms`);
        // In production, send to analytics service
      }
      
      if (responseTime > PRODUCTION_CONFIG.maxApiResponseTime) {
        console.warn(`Slow API response: ${endpoint} took ${responseTime}ms`);
      }
      
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`API ${endpoint} failed after ${responseTime}ms:`, error);
      throw error;
    }
  },
  
  // Track memory usage
  trackMemoryUsage: () => {
    if (Platform.OS === 'web' && 'memory' in performance) {
      const memInfo = (performance as any).memory;
      const memoryUsage = {
        used: memInfo.usedJSHeapSize,
        total: memInfo.totalJSHeapSize,
        limit: memInfo.jsHeapSizeLimit,
      };
      
      if (PRODUCTION_CONFIG.enableAnalytics) {
        console.log('Memory usage:', memoryUsage);
      }
      
      return memoryUsage;
    }
    
    return null;
  },
};

// Bundle size monitoring
export const bundleMonitor = {
  checkBundleSize: () => {
    // This would be implemented with build tools
    // For now, just log a reminder
    if (PRODUCTION_CONFIG.isProduction) {
      console.log('Bundle size check should be implemented in build process');
    }
  },
};

// Production logging utility
export const productionLogger = {
  log: (message: string, ...args: any[]) => {
    if (PRODUCTION_CONFIG.enableDebugLogs) {
      console.log(`[${new Date().toISOString()}] ${message}`, ...args);
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    console.warn(`[${new Date().toISOString()}] WARNING: ${message}`, ...args);
  },
  
  error: (message: string, error?: Error, ...args: any[]) => {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`, error, ...args);
    
    // In production, send to error tracking service
    if (PRODUCTION_CONFIG.isProduction && PRODUCTION_CONFIG.enableCrashReporting) {
      // Example: Sentry.captureException(error, { extra: { message, args } });
    }
  },
  
  analytics: (event: string, properties?: Record<string, any>) => {
    if (PRODUCTION_CONFIG.enableAnalytics) {
      console.log(`Analytics: ${event}`, properties);
      // In production, send to analytics service
      // Example: Analytics.track(event, properties);
    }
  },
};

// Production health checks
export const healthCheck = {
  // Check if all required services are available
  checkServices: async (): Promise<{ healthy: boolean; issues: string[] }> => {
    const issues: string[] = [];
    
    try {
      // Check Supabase connection
      const { url } = getSupabaseConfig();
      const response = await fetch(`${url}/rest/v1/`, {
        method: 'HEAD',
        headers: { 'apikey': getSupabaseConfig().anonKey },
      });
      
      if (!response.ok) {
        issues.push('Supabase connection failed');
      }
    } catch {
      issues.push('Supabase unreachable');
    }
    
    try {
      // Check API connection
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/health`, { method: 'HEAD' });
      
      if (!response.ok) {
        issues.push('API health check failed');
      }
    } catch {
      issues.push('API unreachable');
    }
    
    return {
      healthy: issues.length === 0,
      issues,
    };
  },
  
  // Check device capabilities
  checkDeviceCapabilities: (): { supported: boolean; missing: string[] } => {
    const missing: string[] = [];
    
    // Check required APIs
    if (Platform.OS === 'web') {
      if (!navigator.mediaDevices) {
        missing.push('Camera API not available');
      }
      
      if (!('serviceWorker' in navigator)) {
        missing.push('Service Worker not supported');
      }
    }
    
    return {
      supported: missing.length === 0,
      missing,
    };
  },
};

// Production optimization utilities
export const optimizationUtils = {
  // Debounce function for search inputs
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  },
  
  // Throttle function for scroll events
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let lastCall = 0;
    
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  },
  
  // Lazy loading utility
  createLazyComponent: <T extends React.ComponentType<any>>(
    importFunc: () => Promise<{ default: T }>
  ) => {
    return React.lazy(importFunc);
  },
};

export default {
  PRODUCTION_CONFIG,
  getApiBaseUrl,
  getSupabaseConfig,
  performanceMonitor,
  bundleMonitor,
  productionLogger,
  healthCheck,
  optimizationUtils,
};