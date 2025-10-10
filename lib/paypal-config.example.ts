// Example PayPal Configuration
// Copy this to your actual paypal.ts file and replace with your credentials

export const PAYPAL_CONFIG_EXAMPLE = {
  // PayPal API Base URLs
  baseURL: __DEV__ 
    ? 'https://api.sandbox.paypal.com'  // Sandbox for development
    : 'https://api.paypal.com',         // Live for production

  // Your PayPal App Client ID
  clientId: __DEV__ 
    ? 'AeA1QIjRiVqb7o6H4VdBJBCqpKkCpqT0gNV_nH5BwYnMOFH_Fh4qKvNFjF-qOPlFT6BJ7qUlKGhvBsC2'  // Example sandbox ID
    : 'AZaXZBOXpBbQWHKGtR5u6l7D_7WzPpqeV-M_Rt7l1Lm6H4pB0X9cN3qA-TrZ2PlO8yUvM5DhNwF6GxE4',  // Example live ID

  // Your PayPal App Client Secret
  clientSecret: __DEV__
    ? 'EL4tVYqRrV_tL9MpP9fCkKvBnQ5pHjG8Q2W4rT6vN1mK8pL3fD7sH5jR2cF9wXzQ3eT1yU6rE8wQ5sD9'  // Example sandbox secret
    : 'EF3rF6bG9nV_lK8MqL2dCjJuAm4qGhE7P1T5sH4uN8mJ6fD2sH7kR3cF9wYzP5eS1yT4rF8wR6sE3qL7',  // Example live secret

  // App Configuration
  appName: 'Wordscapes',
  returnUrl: 'wordscapes://payment/success',
  cancelUrl: 'wordscapes://payment/cancel',

  // Currency settings
  currency: 'USD',
  
  // Request settings
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
};

// Environment Variables Example (Recommended for production)
export const PAYPAL_CONFIG_ENV_EXAMPLE = {
  baseURL: __DEV__ 
    ? 'https://api.sandbox.paypal.com' 
    : 'https://api.paypal.com',
    
  clientId: __DEV__ 
    ? process.env.EXPO_PUBLIC_PAYPAL_SANDBOX_CLIENT_ID
    : process.env.EXPO_PUBLIC_PAYPAL_LIVE_CLIENT_ID,
    
  clientSecret: __DEV__
    ? process.env.PAYPAL_SANDBOX_CLIENT_SECRET  // Don't expose secrets in public env vars
    : process.env.PAYPAL_LIVE_CLIENT_SECRET,
};

// For .env file:
/*
# Development PayPal Configuration
EXPO_PUBLIC_PAYPAL_SANDBOX_CLIENT_ID=your_sandbox_client_id_here
PAYPAL_SANDBOX_CLIENT_SECRET=your_sandbox_client_secret_here

# Production PayPal Configuration  
EXPO_PUBLIC_PAYPAL_LIVE_CLIENT_ID=your_live_client_id_here
PAYPAL_LIVE_CLIENT_SECRET=your_live_client_secret_here
*/