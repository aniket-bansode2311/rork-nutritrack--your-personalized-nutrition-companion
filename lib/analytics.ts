import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

interface AnalyticsEvent {
  name: string;
  parameters?: Record<string, any>;
}

interface UserProperties {
  [key: string]: string | number | boolean;
}

class AnalyticsService {
  private isEnabled: boolean = true;
  private userId: string | null = null;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeDeviceInfo();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async initializeDeviceInfo() {
    try {
      const deviceInfo = {
        platform: Platform.OS,
        version: Platform.Version,
        deviceName: Device.deviceName,
        deviceType: Device.deviceType,
        appVersion: Application.nativeApplicationVersion,
        buildVersion: Application.nativeBuildVersion,
        sessionId: this.sessionId,
      };
      
      console.log('[Analytics] Device info initialized:', deviceInfo);
    } catch (error) {
      console.warn('[Analytics] Failed to initialize device info:', error);
    }
  }

  setUserId(userId: string | null) {
    this.userId = userId;
    console.log('[Analytics] User ID set:', userId ? 'logged_in' : 'logged_out');
  }

  setUserProperties(properties: UserProperties) {
    if (!this.isEnabled) return;
    
    // Filter out sensitive data
    const sanitizedProperties = this.sanitizeUserProperties(properties);
    console.log('[Analytics] User properties set:', sanitizedProperties);
  }

  logEvent(event: AnalyticsEvent) {
    if (!this.isEnabled) return;
    
    const sanitizedEvent = {
      ...event,
      parameters: event.parameters ? this.sanitizeEventParameters(event.parameters) : undefined,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId ? 'user_logged_in' : 'anonymous',
    };
    
    console.log('[Analytics] Event logged:', sanitizedEvent);
    
    // In production, send to analytics service
    if (!__DEV__) {
      this.sendToAnalyticsService(sanitizedEvent);
    }
  }

  logScreenView(screenName: string, screenClass?: string) {
    this.logEvent({
      name: 'screen_view',
      parameters: {
        screen_name: screenName,
        screen_class: screenClass || screenName,
      },
    });
  }

  logUserAction(action: string, category?: string, label?: string, value?: number) {
    this.logEvent({
      name: 'user_action',
      parameters: {
        action,
        category,
        label,
        value,
      },
    });
  }

  logFoodLogged(foodType: 'manual' | 'recipe' | 'barcode' | 'ai_recognition') {
    this.logEvent({
      name: 'food_logged',
      parameters: {
        food_type: foodType,
      },
    });
  }

  logFeatureUsage(feature: string, success: boolean = true) {
    this.logEvent({
      name: 'feature_usage',
      parameters: {
        feature_name: feature,
        success,
      },
    });
  }

  logError(error: Error, context?: string) {
    this.logEvent({
      name: 'app_error',
      parameters: {
        error_message: error.message,
        error_name: error.name,
        context,
        stack_trace: __DEV__ ? error.stack : undefined,
      },
    });
  }

  private sanitizeUserProperties(properties: UserProperties): UserProperties {
    const sanitized: UserProperties = {};
    
    for (const [key, value] of Object.entries(properties)) {
      // Exclude sensitive fields
      if (this.isSensitiveField(key)) {
        continue;
      }
      
      // Hash or anonymize certain fields
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

  private sanitizeEventParameters(parameters: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(parameters)) {
      if (this.isSensitiveField(key)) {
        continue;
      }
      
      // Convert specific values to categories
      if (key === 'calories' && typeof value === 'number') {
        sanitized['calorie_range'] = this.getCalorieRange(value);
      } else if (key === 'weight' && typeof value === 'number') {
        sanitized['weight_change'] = this.getWeightChangeCategory(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  private isSensitiveField(fieldName: string): boolean {
    const sensitiveFields = [
      'email',
      'password',
      'token',
      'api_key',
      'personal_info',
      'address',
      'phone',
      'full_name',
      'birth_date',
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

  private getCalorieRange(calories: number): string {
    if (calories < 100) return 'under_100';
    if (calories < 300) return '100_299';
    if (calories < 500) return '300_499';
    if (calories < 800) return '500_799';
    return '800_plus';
  }

  private getWeightChangeCategory(weight: number): string {
    // This would be used for weight change tracking
    if (weight < -2) return 'significant_loss';
    if (weight < -0.5) return 'moderate_loss';
    if (weight < 0.5) return 'stable';
    if (weight < 2) return 'moderate_gain';
    return 'significant_gain';
  }

  private async sendToAnalyticsService(event: any) {
    try {
      // In a real implementation, send to your analytics service
      // For now, we'll just log it
      console.log('[Analytics] Would send to service:', event);
    } catch (error) {
      console.warn('[Analytics] Failed to send event:', error);
    }
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    console.log('[Analytics] Analytics', enabled ? 'enabled' : 'disabled');
  }
}

export const analytics = new AnalyticsService();
export default analytics;