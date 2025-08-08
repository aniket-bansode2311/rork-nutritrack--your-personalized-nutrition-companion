import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { supabase } from "../../lib/supabase";

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Security utilities
const getClientIP = (req: Request): string => {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  
  return cfConnectingIP || realIP || forwarded?.split(',')[0] || 'unknown';
};

const isRateLimited = (ip: string, limit: number = 100, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const key = `rate_limit:${ip}`;
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }
  
  if (record.count >= limit) {
    return true;
  }
  
  record.count++;
  return false;
};

const validateAuthToken = async (token: string) => {
  try {
    // Validate token format
    if (!token || typeof token !== 'string' || token.length < 10) {
      throw new Error('Invalid token format');
    }
    
    // Get user from token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      console.error('Token validation error:', error.message);
      return null;
    }
    
    if (!user) {
      console.warn('No user found for token');
      return null;
    }
    
    // Additional security checks can be added here
    // For example, check user metadata for ban status
    if (user.user_metadata?.banned_until && new Date(user.user_metadata.banned_until) > new Date()) {
      console.warn('User is banned:', user.id);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error validating auth token:', error);
    return null;
  }
};

// Context creation function
export const createContext = async (opts: FetchCreateContextFnOptions) => {
  const clientIP = getClientIP(opts.req);
  
  // Rate limiting check
  if (isRateLimited(clientIP)) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests. Please try again later.',
    });
  }
  
  // Security headers validation
  const userAgent = opts.req.headers.get('user-agent');
  const origin = opts.req.headers.get('origin');
  
  // Log suspicious requests
  if (!userAgent || userAgent.length < 10) {
    console.warn('Suspicious request without proper user agent:', { ip: clientIP, userAgent });
  }
  
  // Get and validate authorization header
  const authorization = opts.req.headers.get('authorization');
  let user = null;
  
  if (authorization) {
    try {
      // Validate authorization header format
      if (!authorization.startsWith('Bearer ')) {
        console.warn('Invalid authorization header format:', { ip: clientIP });
      } else {
        const token = authorization.replace('Bearer ', '');
        user = await validateAuthToken(token);
      }
    } catch (error) {
      console.error('Error processing authorization:', error);
    }
  }

  return {
    req: opts.req,
    user,
    supabase,
    clientIP,
    userAgent,
    origin,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

// Security middleware for input validation
export const validateInput = (schema: any) => {
  return t.procedure.input(schema).use(async ({ input, ctx, next }) => {
    // Log input validation for audit
    if (ctx.user) {
      console.log('Input validation:', {
        userId: ctx.user.id,
        inputType: typeof input,
        timestamp: new Date().toISOString(),
      });
    }
    
    return next({ input });
  });
};

// Cleanup rate limit store periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

// Initialize tRPC
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// Enhanced protected procedure with additional security checks
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    // Log unauthorized access attempts
    console.warn('Unauthorized access attempt:', {
      ip: ctx.clientIP,
      userAgent: ctx.userAgent,
      timestamp: new Date().toISOString(),
    });
    
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required. Please sign in to access this resource.',
    });
  }
  
  // Additional security validations
  if (!ctx.user.email_confirmed_at) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Please verify your email address to access this resource.',
    });
  }
  
  // Check if user account is active
  if (ctx.user.user_metadata?.banned_until && new Date(ctx.user.user_metadata.banned_until) > new Date()) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Your account has been temporarily suspended.',
    });
  }
  
  // Log successful authenticated requests (for audit trail)
  console.log('Authenticated request:', {
    userId: ctx.user.id,
    email: ctx.user.email,
    ip: ctx.clientIP,
    timestamp: new Date().toISOString(),
  });
  
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// Admin-only procedure for sensitive operations
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  // Check if user has admin role (you'll need to implement role system)
  const isAdmin = ctx.user.user_metadata?.role === 'admin' || 
                  ctx.user.app_metadata?.role === 'admin';
  
  if (!isAdmin) {
    console.warn('Admin access attempt by non-admin user:', {
      userId: ctx.user.id,
      email: ctx.user.email,
      ip: ctx.clientIP,
      timestamp: new Date().toISOString(),
    });
    
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Administrator privileges required.',
    });
  }
  
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});