# API Setup Guide

This guide will help you set up the LogMeal and Edamam API integrations for the nutrition tracking app.

## Quick Setup

### 1. Get API Keys

#### LogMeal API
1. Go to [LogMeal Developer Portal](https://logmeal.es/developers/)
2. Sign up for an account
3. Create a new application
4. Copy your API key

#### Edamam API
1. Go to [Edamam Developer Portal](https://developer.edamam.com/)
2. Sign up for an account
3. Subscribe to the "Food Database API"
4. Copy your App ID and App Key

### 2. Configure Environment Variables

Add these to your `.env` file:

```bash
# LogMeal API
LOGMEAL_API_KEY=your_logmeal_api_key_here

# Edamam API
EDAMAM_APP_ID=your_edamam_app_id_here
EDAMAM_APP_KEY=your_edamam_app_key_here
```

### 3. Test the Integration

The app will automatically detect if APIs are configured and fall back gracefully if they're not available.

To test:
1. Take a photo of food (uses LogMeal API + fallback AI)
2. Scan a barcode (uses Edamam API)
3. Search for food by text (uses Edamam API)

## Features Available

✅ **Food Image Recognition** - AI-powered food identification and nutrition analysis  
✅ **Barcode Scanning** - Comprehensive product database lookup  
✅ **Text Search** - Natural language food search  
✅ **Automatic Fallbacks** - Graceful degradation when APIs are unavailable  
✅ **Error Handling** - User-friendly error messages  
✅ **Security** - Secure API key management  

## API Limits

### Free Tiers
- **LogMeal**: 100 requests/month
- **Edamam**: 100 requests/month

### Rate Limits
- **LogMeal**: 10 requests/minute
- **Edamam**: 5 requests/minute

## Troubleshooting

### Common Issues

**"API key not configured"**
- Check your `.env` file has the correct variable names
- Restart your development server after adding keys

**"Network request failed"**
- Check your internet connection
- Verify API keys are valid and active

**"Rate limit exceeded"**
- Wait a few minutes before trying again
- Consider upgrading to a paid plan for higher limits

### Debug Mode

Set `DEBUG=food-recognition` in your environment to see detailed API logs.

## Support

- Check the [full API integration guide](./api-integration-guide.md) for detailed documentation
- Contact API providers for technical support with their services
- File issues in the project repository for app-specific problems

## Next Steps

1. **Test with real data** - Try scanning various foods and barcodes
2. **Monitor usage** - Keep track of API calls to avoid hitting limits
3. **Consider paid plans** - Upgrade when you need higher limits
4. **Implement caching** - The app already includes smart caching to reduce API calls

The integration is designed to work seamlessly whether you have API keys configured or not, so you can start using the app immediately and add API keys when ready.