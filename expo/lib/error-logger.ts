import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

interface ErrorContext {
  [key: string]: any;
}

class ErrorLoggingService {
  private isInitialized: boolean = false;
  private userId: string | null = null;

  initialize() {
    if (this.isInitialized) return;

    try {
      Sentry.init({
        dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
        debug: __DEV__,
        environment: __DEV__ ? 'development' : 'production',
        enableAutoSessionTracking: true,
        sessionTrackingIntervalMillis: 30000,
        beforeSend: (event) => {
          // Filter out sensitive data before sending
          return this.sanitizeEvent(event);
        },
        beforeBreadcrumb: (breadcrumb) => {
          // Filter sensitive breadcrumbs
          return this.sanitizeBreadcrumb(breadcrumb);
        },
      });

      // Set device context
      Sentry.setContext('device', {
        platform: Platform.OS,
        version: Platform.Version,
        deviceName: Device.deviceName,
        deviceType: Device.deviceType,
        isDevice: Device.isDevice,
      });

      // Set app context
      Sentry.setContext('app', {
        version: Constants.expoConfig?.version,
        buildVersion: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode,
        sdkVersion: Constants.expoConfig?.sdkVersion,
      });

      this.isInitialized = true;
      console.log('[Sentry] Error logging initialized');
    } catch (error) {
      console.warn('[Sentry] Failed to initialize:', error);
    }
  }

  setUser(userId: string | null, userProperties?: Record<string, any>) {
    if (!this.isInitialized) return;

    this.userId = userId;
    
    const sanitizedUser = userId ? {
      id: userId,
      // Only include non-sensitive user properties
      ...this.sanitizeUserProperties(userProperties || {}),
    } : null;

    Sentry.setUser(sanitizedUser);
    console.log('[Sentry] User context set');
  }

  captureError(error: Error, context?: ErrorContext) {
    if (!this.isInitialized) {
      console.error('[Sentry] Not initialized, logging error locally:', error);
      return;
    }

    try {
      if (context) {
        Sentry.withScope((scope) => {
          // Add context while filtering sensitive data
          const sanitizedContext = this.sanitizeContext(context);
          Object.entries(sanitizedContext).forEach(([key, value]) => {
            scope.setContext(key, value);
          });
          
          Sentry.captureException(error);
        });
      } else {
        Sentry.captureException(error);
      }

      console.log('[Sentry] Error captured:', error.message);
    } catch (sentryError) {
      console.warn('[Sentry] Failed to capture error:', sentryError);
      console.error('[Sentry] Original error:', error);
    }
  }

  captureMessage(message: string, level: 'debug' | 'info' | 'warning' | 'error' = 'info', context?: ErrorContext) {
    if (!this.isInitialized) {
      console.log(`[Sentry] Not initialized, logging message locally [${level}]:`, message);
      return;
    }

    try {
      if (context) {
        Sentry.withScope((scope) => {
          const sanitizedContext = this.sanitizeContext(context);
          Object.entries(sanitizedContext).forEach(([key, value]) => {
            scope.setContext(key, value);
          });
          
          Sentry.captureMessage(message, level);
        });
      } else {
        Sentry.captureMessage(message, level);
      }

      console.log(`[Sentry] Message captured [${level}]:`, message);
    } catch (error) {
      console.warn('[Sentry] Failed to capture message:', error);
    }
  }

  addBreadcrumb(message: string, category?: string, data?: Record<string, any>) {
    if (!this.isInitialized) return;

    try {
      Sentry.addBreadcrumb({
        message,
        category: category || 'app',
        data: data ? this.sanitizeContext(data) : undefined,
        level: 'info',
        timestamp: Date.now() / 1000,
      });
    } catch (error) {
      console.warn('[Sentry] Failed to add breadcrumb:', error);
    }
  }

  setTag(key: string, value: string) {
    if (!this.isInitialized) return;

    try {
      Sentry.setTag(key, value);
    } catch (error) {
      console.warn('[Sentry] Failed to set tag:', error);
    }
  }

  setContext(key: string, context: Record<string, any>) {
    if (!this.isInitialized) return;

    try {
      const sanitizedContext = this.sanitizeContext(context);
      Sentry.setContext(key, sanitizedContext);
    } catch (error) {
      console.warn('[Sentry] Failed to set context:', error);
    }
  }

  private sanitizeEvent(event: any): any {
    if (!event) return event;

    // Remove sensitive data from the event
    if (event.request?.data) {
      event.request.data = this.sanitizeRequestData(event.request.data);
    }

    if (event.extra) {
      event.extra = this.sanitizeContext(event.extra);
    }

    return event;
  }

  private sanitizeBreadcrumb(breadcrumb: any): any {
    if (!breadcrumb) return breadcrumb;

    // Filter out sensitive breadcrumbs
    if (breadcrumb.category === 'http' && breadcrumb.data?.url) {
      // Remove query parameters that might contain sensitive data
      try {
        const url = new URL(breadcrumb.data.url);
        url.search = '';
        breadcrumb.data.url = url.toString();
      } catch {
        // If URL parsing fails, just remove the URL
        delete breadcrumb.data.url;
      }
    }

    if (breadcrumb.data) {
      breadcrumb.data = this.sanitizeContext(breadcrumb.data);
    }

    return breadcrumb;
  }

  private sanitizeContext(context: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(context)) {
      if (this.isSensitiveField(key)) {
        continue;
      }

      if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeContext(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private sanitizeUserProperties(properties: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(properties)) {
      if (this.isSensitiveField(key)) {
        continue;
      }

      // Convert sensitive fields to non-sensitive equivalents
      if (key === 'email') {
        sanitized['has_email'] = !!value;
      } else if (key === 'age') {
        sanitized['age_group'] = this.getAgeGroup(value as number);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private sanitizeRequestData(data: any): any {
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        return JSON.stringify(this.sanitizeContext(parsed));
      } catch {
        return '[Sanitized Request Data]';
      }
    }

    if (typeof data === 'object' && data !== null) {
      return this.sanitizeContext(data);
    }

    return data;
  }

  private isSensitiveField(fieldName: string): boolean {
    const sensitiveFields = [
      'password',
      'token',
      'api_key',
      'secret',
      'auth',
      'credential',
      'email',
      'phone',
      'address',
      'ssn',
      'credit_card',
      'personal_info',
      'birth_date',
      'full_name',
    ];

    return sensitiveFields.some(field => 
      fieldName.toLowerCase().includes(field)
    );
  }

  private getAgeGroup(age: number): string {
    if (age < 18) return 'under_18';
    if (age < 25) return '18_24';
    if (age < 35) return '25_34';
    if (age < 45) return '35_44';
    if (age < 55) return '45_54';
    if (age < 65) return '55_64';
    return '65_plus';
  }
}

export const errorLogger = new ErrorLoggingService();
export default errorLogger;