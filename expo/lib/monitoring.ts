import analytics from './analytics';
import errorLogger from './error-logger';

interface MonitoringConfig {
  enableAnalytics?: boolean;
  enableErrorLogging?: boolean;
  userId?: string | null;
  userProperties?: Record<string, any>;
}

class MonitoringService {
  private isInitialized: boolean = false;

  initialize(config: MonitoringConfig = {}) {
    if (this.isInitialized) return;

    const {
      enableAnalytics = true,
      enableErrorLogging = true,
      userId = null,
      userProperties = {},
    } = config;

    try {
      // Initialize error logging
      if (enableErrorLogging) {
        errorLogger.initialize();
        if (userId) {
          errorLogger.setUser(userId, userProperties);
        }
      }

      // Initialize analytics
      if (enableAnalytics) {
        analytics.setEnabled(true);
        if (userId) {
          analytics.setUserId(userId);
          analytics.setUserProperties(userProperties);
        }
      } else {
        analytics.setEnabled(false);
      }

      this.isInitialized = true;
      console.log('[Monitoring] Service initialized');
    } catch (error) {
      console.warn('[Monitoring] Failed to initialize:', error);
    }
  }

  setUser(userId: string | null, userProperties?: Record<string, any>) {
    analytics.setUserId(userId);
    errorLogger.setUser(userId, userProperties);
    
    if (userProperties) {
      analytics.setUserProperties(userProperties);
    }
  }

  // Analytics methods
  logScreenView(screenName: string, screenClass?: string) {
    analytics.logScreenView(screenName, screenClass);
    errorLogger.addBreadcrumb(`Screen viewed: ${screenName}`, 'navigation');
  }

  logUserAction(action: string, category?: string, label?: string, value?: number) {
    analytics.logUserAction(action, category, label, value);
    errorLogger.addBreadcrumb(`User action: ${action}`, 'user_interaction', {
      category,
      label,
      value,
    });
  }

  logFoodLogged(foodType: 'manual' | 'recipe' | 'barcode' | 'ai_recognition') {
    analytics.logFoodLogged(foodType);
    errorLogger.addBreadcrumb(`Food logged: ${foodType}`, 'food_logging');
  }

  logFeatureUsage(feature: string, success: boolean = true) {
    analytics.logFeatureUsage(feature, success);
    errorLogger.addBreadcrumb(`Feature used: ${feature}`, 'feature_usage', {
      success,
    });
  }

  // Error logging methods
  captureError(error: Error, context?: Record<string, any>) {
    // Log to analytics as well
    analytics.logError(error, context?.screen);
    
    // Capture in error logging service
    errorLogger.captureError(error, context);
  }

  captureMessage(message: string, level: 'debug' | 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) {
    errorLogger.captureMessage(message, level, context);
  }

  addBreadcrumb(message: string, category?: string, data?: Record<string, any>) {
    errorLogger.addBreadcrumb(message, category, data);
  }

  setTag(key: string, value: string) {
    errorLogger.setTag(key, value);
  }

  setContext(key: string, context: Record<string, any>) {
    errorLogger.setContext(key, context);
  }

  // Convenience methods for common app events
  logAppStart() {
    this.logUserAction('app_start', 'lifecycle');
    this.addBreadcrumb('App started', 'lifecycle');
  }

  logAppBackground() {
    this.logUserAction('app_background', 'lifecycle');
    this.addBreadcrumb('App backgrounded', 'lifecycle');
  }

  logAppForeground() {
    this.logUserAction('app_foreground', 'lifecycle');
    this.addBreadcrumb('App foregrounded', 'lifecycle');
  }

  logLogin(method: string) {
    this.logUserAction('login', 'auth', method);
    this.addBreadcrumb(`User logged in via ${method}`, 'auth');
  }

  logLogout() {
    this.logUserAction('logout', 'auth');
    this.addBreadcrumb('User logged out', 'auth');
  }

  logSignup(method: string) {
    this.logUserAction('signup', 'auth', method);
    this.addBreadcrumb(`User signed up via ${method}`, 'auth');
  }

  logApiCall(endpoint: string, method: string, success: boolean, duration?: number) {
    this.logUserAction('api_call', 'network', endpoint);
    this.addBreadcrumb(`API call: ${method} ${endpoint}`, 'http', {
      method,
      endpoint,
      success,
      duration,
    });
  }

  logNetworkError(endpoint: string, error: Error) {
    this.captureError(error, {
      type: 'network_error',
      endpoint,
    });
  }

  logDatabaseError(operation: string, error: Error) {
    this.captureError(error, {
      type: 'database_error',
      operation,
    });
  }

  logPerformanceMetric(metric: string, value: number, unit: string = 'ms') {
    this.logUserAction('performance_metric', 'performance', metric, value);
    this.addBreadcrumb(`Performance: ${metric} = ${value}${unit}`, 'performance');
  }

  // Privacy and compliance
  enableAnalytics(enabled: boolean) {
    analytics.setEnabled(enabled);
    this.addBreadcrumb(`Analytics ${enabled ? 'enabled' : 'disabled'}`, 'privacy');
  }

  clearUserData() {
    this.setUser(null);
    this.addBreadcrumb('User data cleared', 'privacy');
  }
}

export const monitoring = new MonitoringService();
export default monitoring;