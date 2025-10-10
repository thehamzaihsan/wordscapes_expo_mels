# PayPal Integration Setup Guide

This guide will help you set up PayPal payments in your Wordscapes app.

## Prerequisites

1. PayPal Developer Account
2. PayPal App credentials (Client ID and Secret)

## Step 1: Create PayPal App

1. Go to [PayPal Developer](https://developer.paypal.com/)
2. Log in with your PayPal account
3. Navigate to "My Apps & Credentials"
4. Click "Create App"
5. Fill in the app details:
   - App Name: "Wordscapes Mobile App"
   - Merchant: Select your merchant account
   - Features: Check "Accept Payments"
6. Click "Create App"

## Step 2: Configure App Settings

1. In your app settings, add these Return URLs:
   - Return URL: `wordscapes://payment/success`
   - Cancel URL: `wordscapes://payment/cancel`

2. Note down your:
   - Client ID (for both Sandbox and Live)
   - Client Secret (for both Sandbox and Live)

## Step 3: Update App Configuration

1. Open `/lib/paypal.ts`
2. Replace the placeholder values:

```typescript
const PAYPAL_CONFIG = {
  baseURL: __DEV__ ? 'https://api.sandbox.paypal.com' : 'https://api.paypal.com',
  clientId: __DEV__ 
    ? 'YOUR_SANDBOX_CLIENT_ID_HERE'     // Replace with your sandbox client ID
    : 'YOUR_PRODUCTION_CLIENT_ID_HERE', // Replace with your production client ID
  clientSecret: __DEV__
    ? 'YOUR_SANDBOX_CLIENT_SECRET_HERE'     // Replace with your sandbox client secret
    : 'YOUR_PRODUCTION_CLIENT_SECRET_HERE', // Replace with your production client secret
};
```

## Step 4: Install Dependencies

Run the following command to install required dependencies:

```bash
npm install base-64
```

Or if using yarn:

```bash
yarn add base-64
```

## Step 5: Test the Integration

1. Start your app in development mode
2. Navigate to the Shop page
3. Try purchasing gems with the PayPal integration
4. For testing, use PayPal sandbox test accounts

### PayPal Sandbox Test Accounts

You can create test accounts in your PayPal Developer dashboard:
- Go to "Sandbox" > "Accounts"
- Create test buyer and seller accounts
- Use these for testing purchases

## Step 6: Production Deployment

1. Switch to Live credentials in your PayPal config
2. Update the base URL to production PayPal API
3. Test thoroughly before releasing

## Security Notes

1. **Never commit your PayPal credentials to version control**
2. Use environment variables for production:
   ```typescript
   clientId: process.env.PAYPAL_CLIENT_ID
   clientSecret: process.env.PAYPAL_CLIENT_SECRET
   ```
3. Consider using a backend service for sensitive operations
4. Implement proper error handling and logging

## Troubleshooting

### Common Issues:

1. **"PayPal configuration not properly set up"**
   - Check that you've replaced all placeholder values
   - Ensure credentials are correct

2. **Deep linking not working**
   - Verify the app scheme in `app.json` is set to "wordscapes"
   - Test deep linking manually: `adb shell am start -W -a android.intent.action.VIEW -d "wordscapes://payment/success?token=test" com.hexadevs.word`

3. **Payment creation fails**
   - Check your PayPal app settings
   - Verify return URLs are configured correctly
   - Check network connectivity

4. **Base64 encoding issues**
   - Ensure `base-64` package is installed
   - Import should be: `import { encode as base64Encode } from 'base-64';`

## Features Implemented

✅ **Gem Purchases**: Users can buy gem packages via PayPal
✅ **Payment Processing**: Full PayPal checkout flow
✅ **Progress Updates**: Gems are automatically added to user accounts
✅ **Error Handling**: Comprehensive error handling and user feedback
✅ **Payment Modal**: Beautiful UI for payment status
✅ **Deep Linking**: Handles PayPal callback URLs
✅ **Validation**: Purchase and payment validation
✅ **Restore Purchases**: Placeholder for purchase restoration

🚧 **Subscriptions**: Basic structure in place, needs full implementation
🚧 **Purchase History**: Service structure ready for implementation
🚧 **Analytics**: Can be added for tracking purchases

## Next Steps

1. Set up your PayPal developer account
2. Configure the credentials
3. Test the integration thoroughly
4. Implement analytics if needed
5. Add subscription handling if required
6. Deploy to production

For support, refer to the [PayPal Developer Documentation](https://developer.paypal.com/docs/).