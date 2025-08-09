import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { supabase } from "@/lib/supabase";
import { Platform } from 'react-native';

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  
  if (!baseUrl) {
    console.warn('No base URL found, using fallback');
    return 'https://toolkit.rork.com'; // Fallback URL
  }
  
  // Ensure HTTPS in production
  if (!__DEV__ && !baseUrl.startsWith('https://')) {
    console.warn('API base URL should use HTTPS in production, using fallback');
    return 'https://toolkit.rork.com'; // Fallback to secure URL
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

// Create secure HTTP link with authentication
const createSecureHttpLink = () => {
  return httpLink({
    url: `${getBaseUrl()}/api/trpc`,
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
    // Add request timeout and error handling
    fetch: async (url, options) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        
        // Check if response is ok
        if (!response.ok) {
          console.error(`HTTP error! status: ${response.status}`);
          // Don't throw here, let tRPC handle the error
        }
        
        return response;
      } catch (error) {
        console.error('Network request failed:', error);
        // Re-throw to let tRPC handle it
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    },
  });
};

// Create the main client instance
let clientInstance: ReturnType<typeof trpc.createClient> | null = null;

export const getTRPCClient = () => {
  if (!clientInstance) {
    clientInstance = trpc.createClient({
      links: [createSecureHttpLink()],
    });
  }
  return clientInstance;
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