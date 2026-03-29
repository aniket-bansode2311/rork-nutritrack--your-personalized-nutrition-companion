#!/usr/bin/env node

import { serve } from '@hono/node-server';
import app from './backend/hono.js';

const port = process.env.PORT || 3000;

console.log(`Starting server on port ${port}...`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

serve({
  fetch: app.fetch,
  port: Number(port),
}, (info) => {
  console.log(`🚀 Server is running on http://localhost:${info.port}`);
  console.log(`📡 tRPC endpoint: http://localhost:${info.port}/api/trpc`);
  console.log(`🏥 Health check: http://localhost:${info.port}/api`);
});