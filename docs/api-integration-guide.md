# Third-Party API Integration Guide

This document provides comprehensive information about the LogMeal and Edamam API integrations for food recognition and barcode scanning functionality.

## Overview

The nutrition tracking app integrates with two powerful third-party APIs:

1. **LogMeal API** - AI-powered food image recognition and portion sizing
2. **Edamam Nutrition Analysis API** - Barcode scanning and comprehensive nutritional data lookup

## API Configuration

### Environment Variables

Add the following environment variables to your `.env` file:

```bash
# LogMeal API Configuration
LOGMEAL_API_KEY=your_logmeal_api_key_here

# Edamam API Configuration  
EDAMAM_APP_ID=your_edamam_app_id_here
EDAMAM_APP_KEY=your_edamam_app_key_here
```

### Getting API Keys

#### LogMeal API
1. Visit [LogMeal Developer Portal](https://logmeal.es/developers/)
2. Sign up for a developer account
3. Create a new application
4. Copy your API key to the `.env` file

#### Edamam API
1. Visit [Edamam Developer Portal](https://developer.edamam.com/)
2. Sign up for a developer account
3. Subscribe to the "Food Database API"
4. Copy your App ID and App Key to the `.env` file

## Features

### Food Image Recognition (LogMeal API)

- **AI-powered food identification** from photos
- **Automatic portion size estimation** based on visual analysis
- **Comprehensive nutritional analysis** including calories, macros, and micronutrients
- **Confidence scoring** for recognition accuracy
- **Fallback to general AI** when LogMeal API is unavailable

#### Usage Example:
```typescript
import { LogMealAPI } from '@/lib/api/logmeal';

const analyzeFood = async (imageBase64: string) => {
  try {
    const result = await LogMealAPI.analyzeFood(imageBase64);
    console.log('Recognized food:', result);
  } catch (error) {
    console.error('Recognition failed:', error);
  }
};
```

### Barcode Scanning (Edamam API)

- **UPC/EAN barcode scanning** using device camera
- **Comprehensive product database** with nutritional information
- **Multiple serving size options** for accurate tracking
- **Ingredient lists** and allergen information
- **Brand and product details** for better identification

#### Usage Example:
```typescript
import { EdamamAPI } from '@/lib/api/edamam';

const scanBarcode = async (barcode: string) => {
  try {
    const product = await EdamamAPI.searchByBarcode(barcode);
    if (product) {
      console.log('Product found:', product);
    } else {
      console.log('Product not found');
    }
  } catch (error) {
    console.error('Barcode lookup failed:', error);
  }
};
```

### Text-based Food Search (Edamam API)

- **Natural language food search** (e.g., "grilled chicken breast")
- **Multiple result options** with nutritional data
- **Brand filtering** and product variations
- **Serving size calculations** for accurate logging

#### Usage Example:
```typescript
import { EdamamAPI } from '@/lib/api/edamam';

const searchFood = async (query: string) => {
  try {
    const results = await EdamamAPI.searchByText(query, 10);
    console.log('Search results:', results);
  } catch (error) {
    console.error('Search failed:', error);
  }
};
```

## Unified Service

The `FoodRecognitionService` provides a unified interface that combines both APIs with robust error handling and fallback mechanisms:

```typescript
import { FoodRecognitionService } from '@/lib/api/food-recognition';

// Analyze food image with automatic fallback
const foodData = await FoodRecognitionService.analyzeFoodImage(base64Image);

// Search by barcode
const product = await FoodRecognitionService.searchByBarcode('1234567890123');

// Search by text
const results = await FoodRecognitionService.searchFoodByText('apple');

// Check API status
const status = await FoodRecognitionService.getAPIStatus();
```

## Error Handling

### Robust Error Management

The integration includes comprehensive error handling:

- **Network connectivity issues** - Automatic retry with exponential backoff
- **API rate limiting** - Graceful degradation and user-friendly messages
- **Invalid API keys** - Clear configuration error messages
- **Service unavailability** - Fallback to alternative methods
- **Data validation** - Input sanitization and output validation

### Error Types and Responses

```typescript
// API Configuration Errors
"API configuration error. Please check your settings."

// Network Errors  
"Network error. Please check your internet connection and try again."

// Rate Limiting
"Too many requests. Please wait a moment and try again."

// No Results Found
"No results found. Try a different search or add the item manually."

// Timeout Errors
"Request timed out. Please try again."
```

## Security Considerations

### API Key Management

- **Environment variables** - API keys are stored securely in environment variables
- **No hardcoding** - Keys are never committed to version control
- **Runtime validation** - Keys are validated before making API calls
- **Secure headers** - All requests include security headers

### Data Privacy

- **Input sanitization** - All user inputs are sanitized before API calls
- **Output validation** - API responses are validated and sanitized
- **No data retention** - Images and search queries are not stored by the APIs
- **HTTPS only** - All API communications use encrypted connections

### Rate Limiting

- **Request throttling** - Built-in rate limiting to prevent API abuse
- **Caching strategies** - Intelligent caching to reduce API calls
- **Batch processing** - Efficient batch operations for multiple items

## Performance Optimization

### Caching Strategy

- **Image analysis results** cached for 1 hour
- **Barcode lookups** cached for 24 hours  
- **Text search results** cached for 30 minutes
- **API status checks** cached for 5 minutes

### Request Optimization

- **Image compression** - Images are optimized before sending to APIs
- **Batch requests** - Multiple items processed efficiently
- **Parallel processing** - Non-dependent requests made concurrently
- **Timeout management** - Reasonable timeouts to prevent hanging requests

## Testing and Development

### API Status Monitoring

```typescript
// Check which APIs are available
const config = FoodRecognitionService.validateConfiguration();
console.log('LogMeal available:', config.logMeal);
console.log('Edamam available:', config.edamam);

// Get real-time API status
const status = await FoodRecognitionService.getAPIStatus();
console.log('API Status:', status);
```

### Mock Data Fallbacks

When APIs are unavailable or during development:

- **LogMeal fallback** - Uses general AI API for food recognition
- **Edamam fallback** - Returns sample product data for testing
- **Offline mode** - Graceful degradation when network is unavailable

## Troubleshooting

### Common Issues

1. **"API key not configured"**
   - Check that environment variables are set correctly
   - Verify API keys are valid and active

2. **"Network request failed"**
   - Check internet connectivity
   - Verify API endpoints are accessible
   - Check for firewall or proxy issues

3. **"Rate limit exceeded"**
   - Wait before making additional requests
   - Implement request queuing for high-volume usage

4. **"Product not found"**
   - Try different barcode scanning angles
   - Verify barcode is readable and not damaged
   - Check if product is in the API database

5. **"Food recognition failed"**
   - Ensure image is clear and well-lit
   - Try different angles or closer shots
   - Verify food is clearly visible in the image

### Debug Mode

Enable detailed logging by setting:

```bash
DEBUG=food-recognition
```

This will provide detailed logs of API requests, responses, and error details.

## API Limits and Pricing

### LogMeal API
- **Free tier**: 100 requests/month
- **Paid plans**: Starting at $29/month for 1,000 requests
- **Rate limit**: 10 requests/minute

### Edamam API
- **Free tier**: 100 requests/month  
- **Paid plans**: Starting at $49/month for 10,000 requests
- **Rate limit**: 5 requests/minute

## Best Practices

1. **Cache aggressively** - Reduce API calls by caching results
2. **Validate inputs** - Always sanitize user inputs before API calls
3. **Handle errors gracefully** - Provide meaningful error messages to users
4. **Monitor usage** - Track API usage to avoid unexpected charges
5. **Implement fallbacks** - Always have backup options when APIs fail
6. **Optimize images** - Compress images before sending to reduce bandwidth
7. **Batch operations** - Process multiple items efficiently when possible

## Support and Resources

- **LogMeal Documentation**: https://logmeal.es/developers/docs/
- **Edamam Documentation**: https://developer.edamam.com/food-database-api-docs
- **Support Email**: Contact your API provider for technical support
- **Community Forums**: Join developer communities for tips and troubleshooting

## Changelog

### v1.0.0 (Current)
- Initial integration with LogMeal API
- Initial integration with Edamam API  
- Unified FoodRecognitionService
- Comprehensive error handling
- Security implementations
- Performance optimizations