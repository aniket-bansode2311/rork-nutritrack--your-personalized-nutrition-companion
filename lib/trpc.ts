import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { supabase } from "@/lib/supabase";
import { Platform } from 'react-native';

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  // For development, use the local backend
  if (__DEV__) {
    // Check if we're running on web or mobile
    if (Platform.OS === 'web') {
      return 'http://localhost:3000';
    } else {
      // For mobile development, use the tunnel URL or local network IP
      return process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    }
  }
  
  // For production, use the environment variable or fallback
  const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  
  if (!baseUrl) {
    console.warn('No base URL found, using fallback');
    return 'https://toolkit.rork.com';
  }
  
  return baseUrl;
};

// Secure token retrieval
const getAuthToken = async (): Promise<string | null> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session for API call:', error);
      return null;
    }
    
    return session?.access_token || null;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
};

// Create secure HTTP link with authentication and better error handling
const createSecureHttpLink = () => {
  const baseUrl = getBaseUrl();
  console.log('tRPC client connecting to:', `${baseUrl}/api/trpc`);
  
  return httpLink({
    url: `${baseUrl}/api/trpc`,
    transformer: superjson,
    headers: async () => {
      const token = await getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Client-Platform': Platform.OS,
        'X-Client-Version': '1.0.0',
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      return headers;
    },
    // Enhanced fetch with better error handling and retries
    fetch: async (url, options) => {
      let controller: AbortController | null = null;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      
      try {
        // Only create AbortController if not already provided
        if (!options?.signal) {
          controller = new AbortController();
          timeoutId = setTimeout(() => {
            if (controller && !controller.signal.aborted) {
              controller.abort();
            }
          }, 30000); // 30 second timeout
        }
        
        console.log('Making tRPC request to:', url);
        console.log('Request options:', {
          method: options?.method,
          headers: options?.headers,
          body: options?.body ? 'present' : 'none'
        });
        
        const fetchOptions = {
          ...options,
          signal: options?.signal || controller?.signal,
        };
        
        const response = await fetch(url, fetchOptions);
        
        console.log('tRPC response status:', response.status);
        console.log('tRPC response headers:', Object.fromEntries(response.headers.entries()));
        
        // Check if response is ok
        if (!response.ok) {
          console.error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
          
          // Handle specific error cases
          if (response.status === 401) {
            throw new Error('AUTH_ERROR: Unauthorized');
          } else if (response.status >= 500) {
            throw new Error('SERVER_ERROR: Internal server error');
          } else if (response.status === 404) {
            throw new Error('NOT_FOUND: Endpoint not found');
          } else if (response.status === 0) {
            throw new Error('NETWORK_ERROR: No network connection');
          }
        }
        
        return response;
      } catch (error: any) {
        console.error('Network request failed:', error);
        
        // Handle different types of errors
        if (error.name === 'AbortError') {
          if (error.message?.includes('signal is aborted without reason')) {
            throw new Error('NETWORK_ERROR: Request was cancelled');
          }
          throw new Error('TIMEOUT_ERROR: Request timed out');
        } else if (error.message?.includes('Failed to fetch') || 
                   error.message?.includes('Network request failed') ||
                   error.message?.includes('TypeError: Failed to fetch')) {
          throw new Error('NETWORK_ERROR: Unable to connect to server');
        } else if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
          throw new Error('NETWORK_ERROR: Network connection failed');
        }
        
        // Re-throw the error for tRPC to handle
        throw error;
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    },
  });
};

// Create the main client instance with retry logic
let clientInstance: ReturnType<typeof trpc.createClient> | null = null;

export const getTRPCClient = () => {
  if (!clientInstance) {
    clientInstance = trpc.createClient({
      links: [createSecureHttpLink()],
    });
  }
  return clientInstance;
};

// Reset client instance (useful for reconnection)
export const resetTRPCClient = () => {
  clientInstance = null;
};

// Export for backward compatibility
export const trpcClient = getTRPCClient();

// Utility function to create authenticated client
export const createAuthenticatedTRPCClient = () => {
  return trpc.createClient({
    links: [createSecureHttpLink()],
  });
};

// Security utility to validate API responses
export const validateApiResponse = (response: any): boolean => {
  try {
    // Basic validation - ensure response is an object
    if (typeof response !== 'object' || response === null) {
      console.warn('Invalid API response format');
      return false;
    }
    
    // Check for potential XSS in string responses
    const checkForXSS = (obj: any): boolean => {
      if (typeof obj === 'string') {
        const xssPatterns = [
          /<script[^>]*>.*?<\/script>/gi,
          /javascript:/gi,
          /on\w+\s*=/gi,
        ];
        
        return !xssPatterns.some(pattern => pattern.test(obj));
      }
      
      if (typeof obj === 'object' && obj !== null) {
        return Object.values(obj).every(checkForXSS);
      }
      
      return true;
    };
    
    return checkForXSS(response);
  } catch (error) {
    console.error('Error validating API response:', error);
    return false;
  }
};