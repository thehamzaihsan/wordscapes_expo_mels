import { Alert, Linking } from 'react-native';
// For Base64 encoding in React Native
import { encode as base64Encode } from 'base-64';

// PayPal configuration
const PAYPAL_CONFIG = {
  // For production, use: https://api.paypal.com
  // For sandbox, use: https://api.sandbox.paypal.com
  baseURL: __DEV__ ? 'https://api.sandbox.paypal.com' : 'https://api.paypal.com',
  clientId: __DEV__ 
    ? 'YOUR_SANDBOX_CLIENT_ID' // Replace with your sandbox client ID
    : 'YOUR_PRODUCTION_CLIENT_ID', // Replace with your production client ID
  clientSecret: __DEV__
    ? 'YOUR_SANDBOX_CLIENT_SECRET' // Replace with your sandbox client secret
    : 'YOUR_PRODUCTION_CLIENT_SECRET', // Replace with your production client secret
};

// PayPal API interfaces
export interface PayPalAccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface PayPalOrderRequest {
  intent: 'CAPTURE';
  purchase_units: Array<{
    amount: {
      currency_code: 'USD';
      value: string;
    };
    description?: string;
  }>;
  application_context: {
    brand_name: string;
    shipping_preference: 'NO_SHIPPING';
    user_action: 'PAY_NOW';
    return_url: string;
    cancel_url: string;
  };
}

export interface PayPalOrder {
  id: string;
  status: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export interface PayPalCaptureResponse {
  id: string;
  status: 'COMPLETED' | 'PENDING' | 'DECLINED';
  purchase_units: Array<{
    payments: {
      captures: Array<{
        id: string;
        status: string;
        amount: {
          currency_code: string;
          value: string;
        };
      }>;
    };
  }>;
}

/**
 * PayPal Service Class for handling payments
 */
export class PayPalService {
  private static accessToken: string | null = null;
  private static tokenExpiry: number = 0;

  /**
   * Get PayPal access token
   */
  private static async getAccessToken(): Promise<string> {
    // Check if token is still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const auth = base64Encode(`${PAYPAL_CONFIG.clientId}:${PAYPAL_CONFIG.clientSecret}`);
      
      const response = await fetch(`${PAYPAL_CONFIG.baseURL}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Language': 'en_US',
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      const data: PayPalAccessToken = await response.json();
      
      if (!response.ok) {
        throw new Error(`PayPal auth failed: ${data}`);
      }

      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 minute early
      
      return this.accessToken;
    } catch (error) {
      console.error('PayPal authentication failed:', error);
      throw new Error('Failed to authenticate with PayPal');
    }
  }

  /**
   * Create a PayPal order
   */
  static async createOrder(amount: number, description: string): Promise<PayPalOrder> {
    try {
      const accessToken = await this.getAccessToken();
      
      const orderRequest: PayPalOrderRequest = {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: amount.toFixed(2),
          },
          description: description,
        }],
        application_context: {
          brand_name: 'Wordscapes',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
          return_url: 'wordscapes://payment/success',
          cancel_url: 'wordscapes://payment/cancel',
        },
      };

      const response = await fetch(`${PAYPAL_CONFIG.baseURL}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'PayPal-Request-Id': `wordscapes-${Date.now()}`,
        },
        body: JSON.stringify(orderRequest),
      });

      const order: PayPalOrder = await response.json();
      
      if (!response.ok) {
        throw new Error(`PayPal order creation failed: ${JSON.stringify(order)}`);
      }

      return order;
    } catch (error) {
      console.error('PayPal order creation failed:', error);
      throw new Error('Failed to create PayPal order');
    }
  }

  /**
   * Capture a PayPal order after payment approval
   */
  static async captureOrder(orderId: string): Promise<PayPalCaptureResponse> {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(`${PAYPAL_CONFIG.baseURL}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const captureData: PayPalCaptureResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(`PayPal capture failed: ${JSON.stringify(captureData)}`);
      }

      return captureData;
    } catch (error) {
      console.error('PayPal capture failed:', error);
      throw new Error('Failed to capture PayPal payment');
    }
  }

  /**
   * Open PayPal payment URL in browser
   */
  static async openPayPalPayment(order: PayPalOrder): Promise<void> {
    const approvalUrl = order.links.find(link => link.rel === 'approve')?.href;
    
    if (!approvalUrl) {
      throw new Error('PayPal approval URL not found');
    }

    try {
      const canOpen = await Linking.canOpenURL(approvalUrl);
      if (canOpen) {
        await Linking.openURL(approvalUrl);
      } else {
        throw new Error('Cannot open PayPal payment URL');
      }
    } catch (error) {
      console.error('Failed to open PayPal URL:', error);
      throw new Error('Failed to open PayPal payment page');
    }
  }

  /**
   * Handle deep link from PayPal
   */
  static parsePayPalCallback(url: string): { success: boolean; orderId?: string; error?: string } {
    try {
      // Simple URL parsing for React Native compatibility
      if (url.includes('payment/success')) {
        // Extract token parameter
        const tokenMatch = url.match(/[?&]token=([^&]+)/);
        const orderId = tokenMatch ? tokenMatch[1] : undefined;
        return { success: true, orderId };
      } else if (url.includes('payment/cancel')) {
        return { success: false, error: 'Payment cancelled by user' };
      } else {
        return { success: false, error: 'Unknown payment status' };
      }
    } catch (error) {
      return { success: false, error: 'Invalid callback URL' };
    }
  }

  /**
   * Process complete purchase flow
   */
  static async processPurchase(
    amount: number, 
    description: string,
    onSuccess: (captureData: PayPalCaptureResponse) => void,
    onError: (error: string) => void,
    onCancel: () => void
  ): Promise<void> {
    try {
      // Create order
      const order = await this.createOrder(amount, description);
      
      // Open PayPal payment page
      await this.openPayPalPayment(order);
      
      // Set up deep link handler
      const handleDeepLink = async (event: { url: string }) => {
        const result = this.parsePayPalCallback(event.url);
        
        if (result.success && result.orderId) {
          try {
            const captureData = await this.captureOrder(result.orderId);
            if (captureData.status === 'COMPLETED') {
              onSuccess(captureData);
            } else {
              onError('Payment not completed');
            }
          } catch (error) {
            onError('Failed to complete payment');
          }
        } else if (!result.success) {
          if (result.error?.includes('cancel')) {
            onCancel();
          } else {
            onError(result.error || 'Payment failed');
          }
        }
        
        // Remove listener
        Linking.removeEventListener('url', handleDeepLink);
      };
      
      // Listen for deep link callback
      Linking.addEventListener('url', handleDeepLink);
      
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Payment failed');
    }
  }
}

/**
 * Utility functions for PayPal integration
 */
export const PayPalUtils = {
  /**
   * Validate PayPal configuration
   */
  validateConfig(): boolean {
    const isValid = !!(
      PAYPAL_CONFIG.clientId && 
      PAYPAL_CONFIG.clientSecret && 
      !PAYPAL_CONFIG.clientId.includes('YOUR_') &&
      !PAYPAL_CONFIG.clientSecret.includes('YOUR_') &&
      PAYPAL_CONFIG.clientId.length > 10 &&
      PAYPAL_CONFIG.clientSecret.length > 10
    );

    if (!isValid) {
      console.warn('PayPal configuration is not properly set up. Please check PAYPAL_SETUP.md for instructions.');
    }

    return isValid;
  },

  /**
   * Format amount for PayPal (ensure 2 decimal places)
   */
  formatAmount(amount: number): string {
    return amount.toFixed(2);
  },

  /**
   * Generate description for purchase
   */
  generateDescription(itemName: string, gems: number): string {
    return `${itemName} - ${gems.toLocaleString()} Gems`;
  },
};

export default PayPalService;