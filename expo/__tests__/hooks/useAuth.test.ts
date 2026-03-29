import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAuth } from '@/hooks/useAuth';
import { Alert } from 'react-native';

// Mock the supabase module
const mockSupabase = {
  auth: {
    getSession: jest.fn(),
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    updateUser: jest.fn(),
    resend: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
};

jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
  validateSession: jest.fn(),
  secureSignOut: jest.fn(),
}));

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  describe('Initial State', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useAuth());
      
      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBe(null);
      expect(result.current.session).toBe(null);
      expect(result.current.initialized).toBe(false);
    });

    it('should get initial session on mount', async () => {
      const mockSession = {
        user: { id: '123', email: 'test@example.com' },
        access_token: 'token',
      };

      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.initialized).toBe(true);
        expect(result.current.user).toEqual(mockSession.user);
        expect(result.current.session).toEqual(mockSession);
      });
    });

    it('should handle session error gracefully', async () => {
      const mockError = new Error('Session error');
      (mockSupabase.auth.getSession as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.initialized).toBe(true);
        expect(result.current.user).toBe(null);
        expect(result.current.session).toBe(null);
      });
    });
  });

  describe('Email Validation', () => {
    it('should validate correct email formats', () => {
      const { result } = renderHook(() => useAuth());
      
      expect(result.current.validateEmail('test@example.com')).toBe(true);
      expect(result.current.validateEmail('user.name+tag@domain.co.uk')).toBe(true);
      expect(result.current.validateEmail('test123@test-domain.com')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      const { result } = renderHook(() => useAuth());
      
      expect(result.current.validateEmail('invalid-email')).toBe(false);
      expect(result.current.validateEmail('test@')).toBe(false);
      expect(result.current.validateEmail('@domain.com')).toBe(false);
      expect(result.current.validateEmail('test.domain.com')).toBe(false);
      expect(result.current.validateEmail('')).toBe(false);
    });

    it('should handle email with whitespace', () => {
      const { result } = renderHook(() => useAuth());
      
      expect(result.current.validateEmail('  test@example.com  ')).toBe(true);
      expect(result.current.validateEmail('\\n\\ttest@example.com\\n')).toBe(true);
    });
  });

  describe('Password Validation', () => {
    it('should validate strong passwords', () => {
      const { result } = renderHook(() => useAuth());
      
      const strongPassword = 'StrongPass123!';
      const validation = result.current.validatePassword(strongPassword);
      
      expect(validation.isValid).toBe(true);
      expect(validation.message).toBeUndefined();
    });

    it('should reject passwords that are too short', () => {
      const { result } = renderHook(() => useAuth());
      
      const shortPassword = 'Short1!';
      const validation = result.current.validatePassword(shortPassword);
      
      expect(validation.isValid).toBe(false);
      expect(validation.message).toBe('Password must be at least 8 characters long');
    });

    it('should reject passwords without lowercase letters', () => {
      const { result } = renderHook(() => useAuth());
      
      const password = 'PASSWORD123!';
      const validation = result.current.validatePassword(password);
      
      expect(validation.isValid).toBe(false);
      expect(validation.message).toBe('Password must contain at least one lowercase letter');
    });

    it('should reject passwords without uppercase letters', () => {
      const { result } = renderHook(() => useAuth());
      
      const password = 'password123!';
      const validation = result.current.validatePassword(password);
      
      expect(validation.isValid).toBe(false);
      expect(validation.message).toBe('Password must contain at least one uppercase letter');
    });

    it('should reject passwords without numbers', () => {
      const { result } = renderHook(() => useAuth());
      
      const password = 'Password!';
      const validation = result.current.validatePassword(password);
      
      expect(validation.isValid).toBe(false);
      expect(validation.message).toBe('Password must contain at least one number');
    });

    it('should reject passwords without special characters', () => {
      const { result } = renderHook(() => useAuth());
      
      const password = 'Password123';
      const validation = result.current.validatePassword(password);
      
      expect(validation.isValid).toBe(false);
      expect(validation.message).toBe('Password must contain at least one special character (@$!%*?&)');
    });
  });

  describe('Sign Up', () => {
    it('should successfully sign up with valid credentials', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockAuthData = { user: mockUser, session: null };

      (mockSupabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: mockAuthData,
        error: null,
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.signUp(
          'test@example.com',
          'StrongPass123!',
          'Test User'
        );
        
        expect(response.data).toEqual(mockAuthData);
        expect(response.error).toBe(null);
      });

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'StrongPass123!',
        options: {
          data: {
            name: 'Test User',
          },
        },
      });
    });

    it('should reject sign up with invalid email', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.signUp(
          'invalid-email',
          'StrongPass123!',
          'Test User'
        );
        
        expect(response.data).toBe(null);
        expect(response.error?.message).toBe('Please enter a valid email address');
      });

      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
    });

    it('should reject sign up with weak password', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.signUp(
          'test@example.com',
          'weak',
          'Test User'
        );
        
        expect(response.data).toBe(null);
        expect(response.error?.message).toBe('Password must be at least 8 characters long');
      });

      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
    });

    it('should reject sign up with short name', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.signUp(
          'test@example.com',
          'StrongPass123!',
          'A'
        );
        
        expect(response.data).toBe(null);
        expect(response.error?.message).toBe('Name must be at least 2 characters long');
      });

      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
    });

    it('should sanitize name input', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockAuthData = { user: mockUser, session: null };

      (mockSupabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: mockAuthData,
        error: null,
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp(
          'test@example.com',
          'StrongPass123!',
          '  Test<script>alert(\"xss\")</script>User  '
        );
      });

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'StrongPass123!',
        options: {
          data: {
            name: 'TestscriptalertxssscriptUser',
          },
        },
      });
    });

    it('should handle sign up errors from Supabase', async () => {
      const mockError = { message: 'User already registered' };
      (mockSupabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.signUp(
          'test@example.com',
          'StrongPass123!',
          'Test User'
        );
        
        expect(response.data).toBe(null);
        expect(response.error).toEqual(mockError);
      });
    });
  });

  describe('Sign In', () => {
    it('should successfully sign in with valid credentials', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockSession = { user: mockUser, access_token: 'token' };
      const mockAuthData = { user: mockUser, session: mockSession };

      (mockSupabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: mockAuthData,
        error: null,
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.signIn(
          'test@example.com',
          'StrongPass123!'
        );
        
        expect(response.data).toEqual(mockAuthData);
        expect(response.error).toBe(null);
      });

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'StrongPass123!',
      });
    });

    it('should reject sign in with invalid email', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.signIn(
          'invalid-email',
          'password'
        );
        
        expect(response.data).toBe(null);
        expect(response.error?.message).toBe('Please enter a valid email address');
      });

      expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });

    it('should reject sign in with empty password', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.signIn(
          'test@example.com',
          ''
        );
        
        expect(response.data).toBe(null);
        expect(response.error?.message).toBe('Password is required');
      });

      expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });

    it('should handle invalid credentials error', async () => {
      const mockError = { message: 'Invalid login credentials' };
      (mockSupabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.signIn(
          'test@example.com',
          'wrongpassword'
        );
        
        expect(response.data).toBe(null);
        expect(response.error?.message).toBe('Invalid email or password');
      });
    });

    it('should sanitize email input', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockSession = { user: mockUser, access_token: 'token' };
      const mockAuthData = { user: mockUser, session: mockSession };

      (mockSupabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: mockAuthData,
        error: null,
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn(
          '  TEST@EXAMPLE.COM  ',
          'password'
        );
      });

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
    });
  });

  describe('Password Reset', () => {
    it('should successfully send password reset email', async () => {
      (mockSupabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
        data: {},
        error: null,
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.resetPassword('test@example.com');
        
        expect(response.data).toEqual({});
        expect(response.error).toBe(null);
      });

      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        { redirectTo: 'your-app://reset-password' }
      );
    });

    it('should reject password reset with invalid email', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.resetPassword('invalid-email');
        
        expect(response.data).toBe(null);
        expect(response.error?.message).toBe('Please enter a valid email address');
      });

      expect(mockSupabase.auth.resetPasswordForEmail).not.toHaveBeenCalled();
    });
  });

  describe('Security Features', () => {
    it('should check for security threats periodically', async () => {
      jest.spyOn(Alert, 'alert');
      
      const oldSession = {
        user: { 
          id: '123', 
          email: 'test@example.com',
          last_sign_in_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() // 25 hours ago
        },
        access_token: 'token',
      };

      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: oldSession },
        error: null,
      });

      renderHook(() => useAuth());

      // Fast-forward time to trigger security check
      act(() => {
        jest.advanceTimersByTime(60 * 60 * 1000); // 1 hour
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Security Check',
          'For your security, please sign in again.',
          expect.any(Array)
        );
      });
    });

    it('should not trigger security alert for recent sessions', async () => {
      jest.spyOn(Alert, 'alert');
      
      const recentSession = {
        user: { 
          id: '123', 
          email: 'test@example.com',
          last_sign_in_at: new Date().toISOString() // Current time
        },
        access_token: 'token',
      };

      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: recentSession },
        error: null,
      });

      renderHook(() => useAuth());

      // Fast-forward time to trigger security check
      act(() => {
        jest.advanceTimersByTime(60 * 60 * 1000); // 1 hour
      });

      await waitFor(() => {
        expect(Alert.alert).not.toHaveBeenCalled();
      });
    });
  });

  describe('Auth State Changes', () => {
    it('should listen to auth state changes', () => {
      const mockUnsubscribe = jest.fn();
      const mockSubscription = { unsubscribe: mockUnsubscribe };
      
      (mockSupabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: mockSubscription },
      });

      const { unmount } = renderHook(() => useAuth());

      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled();

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should update state when auth changes', async () => {
      let authChangeCallback: (event: string, session: any) => void;
      
      (mockSupabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback: any) => {
        authChangeCallback = callback;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      const { result } = renderHook(() => useAuth());

      const newSession = {
        user: { id: '456', email: 'new@example.com' },
        access_token: 'new-token',
      };

      act(() => {
        authChangeCallback('SIGNED_IN', newSession);
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(newSession.user);
        expect(result.current.session).toEqual(newSession);
        expect(result.current.loading).toBe(false);
        expect(result.current.initialized).toBe(true);
      });
    });
  });
});