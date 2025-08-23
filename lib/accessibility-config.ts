// Accessibility configuration and utilities
import { Platform, AccessibilityInfo } from 'react-native';
import { productionLogger } from './production-config';

export const ACCESSIBILITY_CONFIG = {
  // Minimum touch target size (44x44 points on iOS, 48x48 dp on Android)
  minTouchTargetSize: Platform.OS === 'ios' ? 44 : 48,
  
  // Text scaling limits
  minTextScale: 0.8,
  maxTextScale: 2.0,
  
  // Animation preferences
  respectReducedMotion: true,
  defaultAnimationDuration: 300,
  reducedAnimationDuration: 150,
  
  // Color contrast ratios (WCAG AA compliance)
  minContrastRatio: 4.5, // For normal text
  minLargeTextContrastRatio: 3.0, // For large text (18pt+ or 14pt+ bold)
  
  // Focus management
  focusTimeout: 100,
  announcementDelay: 500,
} as const;

// Accessibility state management
export class AccessibilityManager {
  private static instance: AccessibilityManager;
  private isScreenReaderEnabled = false;
  private isReduceMotionEnabled = false;
  private isReduceTransparencyEnabled = false;
  private textScale = 1.0;
  
  private constructor() {
    this.initializeAccessibilityState();
  }
  
  static getInstance(): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager();
    }
    return AccessibilityManager.instance;
  }
  
  private async initializeAccessibilityState() {
    try {
      // Check screen reader status
      this.isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      
      // Check reduce motion preference
      this.isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
      
      // Check reduce transparency preference (iOS only)
      if (Platform.OS === 'ios') {
        this.isReduceTransparencyEnabled = await AccessibilityInfo.isReduceTransparencyEnabled();
      }
      
      // Listen for accessibility changes
      AccessibilityInfo.addEventListener('screenReaderChanged', this.handleScreenReaderChange);
      AccessibilityInfo.addEventListener('reduceMotionChanged', this.handleReduceMotionChange);
      
      if (Platform.OS === 'ios') {
        AccessibilityInfo.addEventListener('reduceTransparencyChanged', this.handleReduceTransparencyChange);
      }
      
      productionLogger.log('Accessibility state initialized', {
        screenReader: this.isScreenReaderEnabled,
        reduceMotion: this.isReduceMotionEnabled,
        reduceTransparency: this.isReduceTransparencyEnabled,
      });
    } catch (error) {
      productionLogger.error('Failed to initialize accessibility state', error as Error);
    }
  }
  
  private handleScreenReaderChange = (enabled: boolean) => {
    this.isScreenReaderEnabled = enabled;
    productionLogger.log('Screen reader status changed', { enabled });
  };
  
  private handleReduceMotionChange = (enabled: boolean) => {
    this.isReduceMotionEnabled = enabled;
    productionLogger.log('Reduce motion preference changed', { enabled });
  };
  
  private handleReduceTransparencyChange = (enabled: boolean) => {
    this.isReduceTransparencyEnabled = enabled;
    productionLogger.log('Reduce transparency preference changed', { enabled });
  };
  
  // Public getters
  get screenReaderEnabled(): boolean {
    return this.isScreenReaderEnabled;
  }
  
  get reduceMotionEnabled(): boolean {
    return this.isReduceMotionEnabled;
  }
  
  get reduceTransparencyEnabled(): boolean {
    return this.isReduceTransparencyEnabled;
  }
  
  get currentTextScale(): number {
    return this.textScale;
  }
  
  // Animation duration based on user preferences
  getAnimationDuration(defaultDuration: number = ACCESSIBILITY_CONFIG.defaultAnimationDuration): number {
    if (this.isReduceMotionEnabled) {
      return Math.min(defaultDuration * 0.5, ACCESSIBILITY_CONFIG.reducedAnimationDuration);
    }
    return defaultDuration;
  }
  
  // Announce text to screen reader
  announceForAccessibility(text: string, priority: 'low' | 'high' = 'low') {
    if (this.isScreenReaderEnabled) {
      setTimeout(() => {
        AccessibilityInfo.announceForAccessibility(text);
      }, priority === 'high' ? 0 : ACCESSIBILITY_CONFIG.announcementDelay);
    }
  }
  
  // Set focus to element (for screen readers)
  setAccessibilityFocus(reactTag: number) {
    if (this.isScreenReaderEnabled) {
      setTimeout(() => {
        AccessibilityInfo.setAccessibilityFocus(reactTag);
      }, ACCESSIBILITY_CONFIG.focusTimeout);
    }
  }
  
  // Cleanup
  destroy() {
    // Note: React Native AccessibilityInfo doesn't have removeEventListener
    // Event listeners are automatically cleaned up when the app is destroyed
    productionLogger.log('AccessibilityManager destroyed');
  }
}

// Accessibility utilities
export const accessibilityUtils = {
  // Generate accessibility label for complex components
  generateLabel: (parts: (string | undefined)[]): string => {
    return parts.filter(Boolean).join(', ');
  },
  
  // Format numbers for screen readers
  formatNumberForScreenReader: (num: number, unit?: string): string => {
    const formatted = num.toLocaleString();
    return unit ? `${formatted} ${unit}` : formatted;
  },
  
  // Format dates for screen readers
  formatDateForScreenReader: (date: Date): string => {
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  },
  
  // Format time for screen readers
  formatTimeForScreenReader: (date: Date): string => {
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  },
  
  // Create accessible button props
  createButtonProps: ({
    label,
    hint,
    disabled = false,
    role = 'button',
  }: {
    label: string;
    hint?: string;
    disabled?: boolean;
    role?: 'button' | 'link' | 'tab';
  }) => ({
    accessible: true,
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityRole: role,
    accessibilityState: { disabled },
  }),
  
  // Create accessible text input props
  createTextInputProps: ({
    label,
    value,
    placeholder,
    required = false,
    invalid = false,
    errorMessage,
  }: {
    label: string;
    value?: string;
    placeholder?: string;
    required?: boolean;
    invalid?: boolean;
    errorMessage?: string;
  }) => {
    const accessibilityLabel = required ? `${label}, required` : label;
    const accessibilityValue = value ? { text: value } : undefined;
    const accessibilityHint = invalid && errorMessage ? errorMessage : placeholder;
    
    return {
      accessible: true,
      accessibilityLabel,
      accessibilityValue,
      accessibilityHint,
      accessibilityState: { disabled: false },
      placeholder,
    };
  },
  
  // Create accessible list item props
  createListItemProps: ({
    label,
    position,
    total,
    selected = false,
  }: {
    label: string;
    position: number;
    total: number;
    selected?: boolean;
  }) => ({
    accessible: true,
    accessibilityLabel: `${label}, ${position} of ${total}`,
    accessibilityRole: 'button' as const,
    accessibilityState: { selected },
  }),
  
  // Create accessible progress indicator props
  createProgressProps: ({
    label,
    value,
    max = 100,
    unit = 'percent',
  }: {
    label: string;
    value: number;
    max?: number;
    unit?: string;
  }) => {
    const percentage = Math.round((value / max) * 100);
    const accessibilityValue = {
      min: 0,
      max,
      now: value,
      text: `${percentage} ${unit}`,
    };
    
    return {
      accessible: true,
      accessibilityLabel: label,
      accessibilityRole: 'progressbar' as const,
      accessibilityValue,
    };
  },
  
  // Check if touch target meets minimum size requirements
  validateTouchTarget: (width: number, height: number): boolean => {
    const minSize = ACCESSIBILITY_CONFIG.minTouchTargetSize;
    return width >= minSize && height >= minSize;
  },
  
  // Calculate appropriate text size based on accessibility settings
  getAccessibleTextSize: (baseSize: number, scale?: number): number => {
    const textScale = scale || AccessibilityManager.getInstance().currentTextScale;
    const scaledSize = baseSize * textScale;
    
    // Ensure text doesn't become too small or too large
    const minSize = baseSize * ACCESSIBILITY_CONFIG.minTextScale;
    const maxSize = baseSize * ACCESSIBILITY_CONFIG.maxTextScale;
    
    return Math.max(minSize, Math.min(maxSize, scaledSize));
  },
};

// Export singleton instance
export const accessibilityManager = AccessibilityManager.getInstance();

export default {
  ACCESSIBILITY_CONFIG,
  AccessibilityManager,
  accessibilityUtils,
  accessibilityManager,
};