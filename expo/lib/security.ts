import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Security constants
export const SECURITY_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  PASSWORD_MIN_LENGTH: 8,
  API_TIMEOUT: 30000, // 30 seconds
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 100,
} as const;

// Input sanitization
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 1000); // Limit length
};

export const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase().replace(/[^\w@.-]/g, '');
};

// XSS Protection
export const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const detectXSS = (input: string): boolean => {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
};

// Data validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < SECURITY_CONFIG.PASSWORD_MIN_LENGTH) {
    return { isValid: false, message: `Password must be at least ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH} characters long` };
  }
  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character (@$!%*?&)' };
  }
  return { isValid: true };
};

export const validateName = (name: string): boolean => {
  return name.length >= 2 && name.length <= 50 && /^[a-zA-Z\s'-]+$/.test(name);
};

// Secure storage utilities
export const secureStore = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      const encryptedValue = await encryptData(value);
      await AsyncStorage.setItem(`secure_${key}`, encryptedValue);
    } catch (error) {
      console.error('Error storing secure data:', error);
      throw new Error('Failed to store secure data');
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      const encryptedValue = await AsyncStorage.getItem(`secure_${key}`);
      if (!encryptedValue) return null;
      
      return await decryptData(encryptedValue);
    } catch (error) {
      console.error('Error retrieving secure data:', error);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`secure_${key}`);
    } catch (error) {
      console.error('Error removing secure data:', error);
    }
  },

  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const secureKeys = keys.filter(key => key.startsWith('secure_'));
      await AsyncStorage.multiRemove(secureKeys);
    } catch (error) {
      console.error('Error clearing secure data:', error);
    }
  },
};

// Simple encryption/decryption (for demo purposes - use proper encryption in production)
const encryptData = async (data: string): Promise<string> => {
  // In production, use proper encryption libraries like react-native-keychain
  // This is a simple base64 encoding for demonstration
  try {
    return btoa(data);
  } catch (error) {
    console.error('Encryption error:', error);
    return data;
  }
};

const decryptData = async (encryptedData: string): Promise<string> => {
  // In production, use proper decryption
  try {
    return atob(encryptedData);
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedData;
  }
};

// Login attempt tracking
export const loginAttemptTracker = {
  async recordFailedAttempt(email: string): Promise<void> {
    const key = `failed_attempts_${sanitizeEmail(email)}`;
    const attempts = await this.getFailedAttempts(email);
    const newAttempts = {
      count: attempts.count + 1,
      lastAttempt: Date.now(),
    };
    
    await AsyncStorage.setItem(key, JSON.stringify(newAttempts));
  },

  async getFailedAttempts(email: string): Promise<{ count: number; lastAttempt: number }> {
    const key = `failed_attempts_${sanitizeEmail(email)}`;
    try {
      const data = await AsyncStorage.getItem(key);
      if (!data) return { count: 0, lastAttempt: 0 };
      
      const attempts = JSON.parse(data);
      
      // Reset if lockout period has passed
      if (Date.now() - attempts.lastAttempt > SECURITY_CONFIG.LOGIN_LOCKOUT_DURATION) {
        await AsyncStorage.removeItem(key);
        return { count: 0, lastAttempt: 0 };
      }
      
      return attempts;
    } catch (error) {
      console.error('Error getting failed attempts:', error);
      return { count: 0, lastAttempt: 0 };
    }
  },

  async clearFailedAttempts(email: string): Promise<void> {
    const key = `failed_attempts_${sanitizeEmail(email)}`;
    await AsyncStorage.removeItem(key);
  },

  async isAccountLocked(email: string): Promise<boolean> {
    const attempts = await this.getFailedAttempts(email);
    return attempts.count >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS;
  },

  async getLockoutTimeRemaining(email: string): Promise<number> {
    const attempts = await this.getFailedAttempts(email);
    if (attempts.count < SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) return 0;
    
    const timeElapsed = Date.now() - attempts.lastAttempt;
    const timeRemaining = SECURITY_CONFIG.LOGIN_LOCKOUT_DURATION - timeElapsed;
    
    return Math.max(0, timeRemaining);
  },
};

// Security headers for API requests
export const getSecurityHeaders = (): Record<string, string> => {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Client-Platform': Platform.OS,
    'X-Client-Version': '1.0.0',
  };
};

// Privacy compliance utilities
export const privacyUtils = {
  // Generate privacy-compliant user ID
  generateAnonymousId(): string {
    return 'anon_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  },

  // Check if user has consented to data collection
  async hasDataConsent(): Promise<boolean> {
    try {
      const consent = await AsyncStorage.getItem('data_consent');
      return consent === 'true';
    } catch (error) {
      console.error('Error checking data consent:', error);
      return false;
    }
  },

  // Record user consent
  async recordDataConsent(consented: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem('data_consent', consented.toString());
      await AsyncStorage.setItem('consent_timestamp', Date.now().toString());
    } catch (error) {
      console.error('Error recording data consent:', error);
    }
  },

  // Clear all user data (for GDPR compliance)
  async clearAllUserData(): Promise<void> {
    try {
      await AsyncStorage.clear();
      console.log('All user data cleared for privacy compliance');
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  },
};

// Security monitoring
export const securityMonitor = {
  // Log security events
  logSecurityEvent(event: string, details: Record<string, any>): void {
    const logEntry = {
      event,
      details,
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
    };
    
    console.warn('Security Event:', logEntry);
    
    // In production, send to security monitoring service
    // this.sendToSecurityService(logEntry);
  },

  // Detect suspicious activity
  detectSuspiciousActivity(userAgent?: string, ip?: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
    ];
    
    if (userAgent && suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
      this.logSecurityEvent('suspicious_user_agent', { userAgent, ip });
      return true;
    }
    
    return false;
  },
};

// Export all security utilities
export default {
  SECURITY_CONFIG,
  sanitizeInput,
  sanitizeEmail,
  escapeHtml,
  detectXSS,
  validateEmail,
  validatePassword,
  validateName,
  secureStore,
  loginAttemptTracker,
  getSecurityHeaders,
  privacyUtils,
  securityMonitor,
};