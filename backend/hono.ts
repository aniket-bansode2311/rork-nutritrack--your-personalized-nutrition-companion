import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

// app will be mounted at /api
const app = new Hono();

// Enhanced CORS configuration
app.use("*", cors({
  origin: (origin) => {
    // Allow all origins in development
    if (process.env.NODE_ENV === 'development') {
      return origin || undefined;
    }
    
    // In production, be more restrictive
    const allowedOrigins = [
      'https://toolkit.rork.com',
      'http://localhost:3000',
      'http://localhost:8081',
      'exp://localhost:8081',
    ];
    
    return allowedOrigins.includes(origin || '') ? origin : undefined;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Client-Platform', 'X-Client-Version'],
  credentials: true,
}));

// Add request logging middleware
app.use('*', async (c, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.url}`);
  
  await next();
  
  const end = Date.now();
  console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.url} - ${c.res.status} (${end - start}ms)`);
});

// Mount tRPC router at /trpc
app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/trpc",
    router: appRouter,
    createContext,
    onError: ({ error, path, type, ctx }) => {
      console.error(`tRPC Error on ${path} (${type}):`, error);
      console.error('Context:', {
        user: ctx?.user?.id || 'anonymous',
        ip: ctx?.clientIP,
        userAgent: ctx?.userAgent,
      });
    },
  })
);

// Simple health check endpoint
app.get("/", (c) => {
  return c.json({ 
    status: "ok", 
    message: "API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// Health check for tRPC specifically
app.get("/trpc", (c) => {
  return c.json({ 
    status: "ok", 
    message: "tRPC endpoint is available",
    endpoint: "/trpc",
    timestamp: new Date().toISOString()
  });
});

// Catch-all for debugging
app.all('*', (c) => {
  console.log(`Unhandled request: ${c.req.method} ${c.req.url}`);
  return c.json({ 
    error: 'Not Found',
    method: c.req.method,
    url: c.req.url,
    availableEndpoints: [
      'GET /',
      'GET /trpc',
      'POST /trpc/*',
    ]
  }, 404);
});

export default app;