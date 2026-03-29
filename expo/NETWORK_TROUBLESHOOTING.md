# Network Error Troubleshooting Guide

## Common Network Errors and Solutions

### Error: "HTTP error! status: 404, statusText:"
**Cause**: The backend server is not running or the API endpoint is incorrect.

**Solutions**:
1. **Start the backend server**:
   ```bash
   node server.js
   # or
   npm run dev-server
   ```

2. **Check if server is running**:
   - Open http://localhost:3000/api in your browser
   - You should see: `{"status":"ok","message":"API is running"}`

3. **Verify tRPC endpoint**:
   - Open http://localhost:3000/api/trpc
   - You should see: `{"status":"ok","message":"tRPC endpoint is available"}`

### Error: "Network request failed: [Error: NOT_FOUND: Endpoint not found]"
**Cause**: The tRPC router is not properly configured or the endpoint path is wrong.

**Solutions**:
1. **Check the API base URL configuration**:
   - In development: Should be `http://localhost:3000`
   - In production: Should be your deployed API URL

2. **Verify environment variables**:
   ```bash
   # .env file should contain:
   EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
   ```

3. **Check backend server logs** for any startup errors

### Error: "Network request failed: TypeError: Failed to fetch"
**Cause**: Network connectivity issues or CORS problems.

**Solutions**:
1. **Check network connectivity**:
   - Ensure you're connected to the internet
   - Try accessing other websites

2. **CORS Configuration**:
   - The backend should allow requests from your app's origin
   - Check browser console for CORS errors

3. **Firewall/Security Software**:
   - Temporarily disable firewall to test
   - Check if antivirus is blocking the connection

## Development Setup Checklist

### Backend Server
- [ ] Backend server is running on port 3000
- [ ] Health check endpoint responds: `GET http://localhost:3000/api`
- [ ] tRPC endpoint responds: `GET http://localhost:3000/api/trpc`
- [ ] No errors in server console logs

### Frontend Configuration
- [ ] Environment variables are set correctly
- [ ] API base URL points to the correct server
- [ ] tRPC client is properly configured
- [ ] No TypeScript compilation errors

### Network
- [ ] Internet connection is working
- [ ] No firewall blocking localhost:3000
- [ ] Browser allows localhost connections
- [ ] No proxy interfering with requests

## Testing Network Connection

Use the Network Debugger component in the app:
1. Open the app
2. If you see network errors, the Network Debugger will appear
3. Click "Test Connection" to diagnose the issue
4. Follow the troubleshooting steps provided

## Manual Testing

### Test Backend Directly
```bash
# Test health endpoint
curl http://localhost:3000/api

# Test tRPC endpoint
curl http://localhost:3000/api/trpc
```

### Test from Browser Console
```javascript
// Test fetch to backend
fetch('http://localhost:3000/api')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

## Common Development Issues

### Port Already in Use
If port 3000 is already in use:
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process (replace PID with actual process ID)
kill -9 PID

# Or use a different port
PORT=3001 node server.js
```

### Environment Variables Not Loading
- Restart the development server after changing .env
- Check that .env file is in the project root
- Verify variable names start with `EXPO_PUBLIC_`

### TypeScript Errors
- Run `npx tsc --noEmit` to check for TypeScript errors
- Fix any type errors before testing network connections

## Getting Help

If you're still experiencing issues:
1. Check the browser console for detailed error messages
2. Check the server console for backend errors
3. Use the Network Debugger component for automated testing
4. Verify all environment variables are set correctly
5. Ensure both frontend and backend are running simultaneously