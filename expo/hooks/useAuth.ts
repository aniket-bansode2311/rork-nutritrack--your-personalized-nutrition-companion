import { useEffect, useState, useCallback } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase, validateSession, secureSignOut } from '@/lib/supabase';
import { Alert } from 'react-native';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    initialized: false,
  });

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }
        
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
          initialized: true,
        });
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        setAuthState({
          user: null,
          session: null,
          loading: false,
          initialized: true,
        });
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
          initialized: true,
        });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Input validation and sanitization
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim().toLowerCase());
  };

  const validatePassword = (password: string): { isValid: boolean; message?: string } => {
    if (password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long' };
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

  const sanitizeName = (name: string): string => {
    return name.trim().replace(/[<>"'&]/g, '');
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      // Input validation
      const sanitizedEmail = email.trim().toLowerCase();
      const sanitizedName = sanitizeName(name);
      
      if (!validateEmail(sanitizedEmail)) {
        return { data: null, error: { message: 'Please enter a valid email address' } as AuthError };
      }
      
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return { data: null, error: { message: passwordValidation.message } as AuthError };
      }
      
      if (sanitizedName.length < 2) {
        return { data: null, error: { message: 'Name must be at least 2 characters long' } as AuthError };
      }

      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          data: {
            name: sanitizedName,
          },
        },
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Input validation and sanitization
      const sanitizedEmail = email.trim().toLowerCase();
      
      if (!validateEmail(sanitizedEmail)) {
        return { data: null, error: { message: 'Please enter a valid email address' } as AuthError };
      }
      
      if (!password || password.length < 1) {
        return { data: null, error: { message: 'Password is required' } as AuthError };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });

      if (error) {
        // Don't expose detailed error messages for security
        if (error.message.includes('Invalid login credentials')) {
          throw { ...error, message: 'Invalid email or password' };
        }
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error: error as AuthError };
    }
  };

  const signOut = async () => {
    try {
      return await secureSignOut();
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: error as AuthError };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const sanitizedEmail = email.trim().toLowerCase();
      
      if (!validateEmail(sanitizedEmail)) {
        return { data: null, error: { message: 'Please enter a valid email address' } as AuthError };
      }

      const { data, error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
        redirectTo: 'your-app://reset-password',
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { data: null, error: error as AuthError };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return { data: null, error: { message: passwordValidation.message } as AuthError };
      }

      const { data, error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Update password error:', error);
      return { data: null, error: error as AuthError };
    }
  };

  const resendConfirmation = async (email: string) => {
    try {
      const sanitizedEmail = email.trim().toLowerCase();
      
      if (!validateEmail(sanitizedEmail)) {
        return { data: null, error: { message: 'Please enter a valid email address' } as AuthError };
      }

      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: sanitizedEmail,
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Resend confirmation error:', error);
      return { data: null, error: error as AuthError };
    }
  };

  // Session validation with automatic refresh
  const validateAndRefreshSession = useCallback(async () => {
    const session = await validateSession();
    if (session) {
      setAuthState(prev => ({
        ...prev,
        user: session.user,
        session,
        loading: false,
        initialized: true,
      }));
    } else {
      setAuthState(prev => ({
        ...prev,
        user: null,
        session: null,
        loading: false,
        initialized: true,
      }));
    }
    return session;
  }, []);

  // Security monitoring
  const checkSecurityThreats = useCallback(async () => {
    try {
      const session = await supabase.auth.getSession();
      if (session.data.session) {
        // Check for suspicious activity patterns
        const lastSignIn = new Date(session.data.session.user.last_sign_in_at || '');
        const now = new Date();
        const timeDiff = now.getTime() - lastSignIn.getTime();
        
        // If session is older than 24 hours, prompt for re-authentication
        if (timeDiff > 24 * 60 * 60 * 1000) {
          Alert.alert(
            'Security Check',
            'For your security, please sign in again.',
            [
              {
                text: 'Sign In',
                onPress: () => signOut(),
              },
            ]
          );
        }
      }
    } catch (error) {
      console.error('Security check failed:', error);
    }
  }, []);

  // Periodic security checks
  useEffect(() => {
    const securityInterval = setInterval(checkSecurityThreats, 60 * 60 * 1000); // Every hour
    return () => clearInterval(securityInterval);
  }, [checkSecurityThreats]);

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    resendConfirmation,
    validateAndRefreshSession,
    validateEmail,
    validatePassword,
  };
};