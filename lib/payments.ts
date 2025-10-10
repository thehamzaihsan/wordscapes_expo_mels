import { Alert } from 'react-native';
import { PayPalService, PayPalCaptureResponse } from './paypal';
import { loadGuestProgress, saveGuestProgress, type GuestProgressPayload } from '../hooks/guest-progress';
import economy from '../constants/economy.json';

export interface PurchaseItem {
  id: string;
  name: string;
  gems: number;
  price: number;
  type: 'gems' | 'subscription';
}

export interface PurchaseResult {
  success: boolean;
  transactionId?: string;
  gemsAdded?: number;
  error?: string;
}

/**
 * Payment processing service that handles purchases and updates user progress
 */
export class PaymentService {
  /**
   * Process gem purchase using PayPal
   */
  static async purchaseGems(
    item: PurchaseItem,
    onProgress: (message: string) => void,
    onComplete: (result: PurchaseResult) => void
  ): Promise<void> {
    try {
      // Validate configuration
      if (!PayPalService.validateConfig?.()) {
        onComplete({
          success: false,
          error: 'PayPal configuration not properly set up. Please contact support.',
        });
        return;
      }

      onProgress('Initializing payment...');

      // Create description for PayPal
      const description = `${item.name} - ${item.gems.toLocaleString()} Gems`;

      // Process PayPal payment
      await PayPalService.processPurchase(
        item.price,
        description,
        // On Success
        async (captureData: PayPalCaptureResponse) => {
          onProgress('Payment successful, adding gems...');
          const result = await this.addGemsToAccount(item, captureData.id);
          onComplete(result);
        },
        // On Error
        (error: string) => {
          onComplete({
            success: false,
            error: `Payment failed: ${error}`,
          });
        },
        // On Cancel
        () => {
          onComplete({
            success: false,
            error: 'Payment was cancelled',
          });
        }
      );
    } catch (error) {
      console.error('Purchase failed:', error);
      onComplete({
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      });
    }
  }

  /**
   * Add purchased gems to user account
   */
  private static async addGemsToAccount(
    item: PurchaseItem,
    transactionId: string
  ): Promise<PurchaseResult> {
    try {
      // Load current progress
      let progress = await loadGuestProgress();
      
      if (!progress) {
        // If no progress exists, create initial progress
        const { buildInitialProgress } = await import('../hooks/guest-progress');
        const levelsData = await import('../constants/levels.json');
        progress = buildInitialProgress(levelsData.default);
      }

      // Add gems to account
      const originalGems = progress.meta.gems;
      progress.meta.gems += item.gems;
      progress.updatedAt = new Date().toISOString();

      // Save updated progress
      await saveGuestProgress(progress);

      // Log purchase for tracking (you can extend this for analytics)
      console.log(`Purchase completed: ${item.name}, Transaction: ${transactionId}, Gems added: ${item.gems}`);

      return {
        success: true,
        transactionId,
        gemsAdded: item.gems,
      };
    } catch (error) {
      console.error('Failed to add gems to account:', error);
      return {
        success: false,
        error: 'Payment processed but gems could not be added. Please contact support.',
      };
    }
  }

  /**
   * Restore purchases (for testing or account recovery)
   */
  static async restorePurchases(): Promise<{ success: boolean; message: string }> {
    try {
      // In a real app, you would query PayPal or your backend for transaction history
      // For now, we'll just provide a placeholder
      Alert.alert(
        'Restore Purchases',
        'Purchase restoration is not yet implemented. Please contact support if you have missing purchases.',
        [{ text: 'OK' }]
      );
      
      return {
        success: true,
        message: 'Restore purchases initiated',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to restore purchases',
      };
    }
  }

  /**
   * Validate purchase before processing
   */
  static validatePurchase(item: PurchaseItem): { valid: boolean; error?: string } {
    // Check if item has required properties
    if (!item.id || !item.name || !item.gems || !item.price) {
      return { valid: false, error: 'Invalid purchase item' };
    }

    // Check if gems amount is reasonable
    if (item.gems <= 0 || item.gems > 100000) {
      return { valid: false, error: 'Invalid gems amount' };
    }

    // Check if price is reasonable
    if (item.price <= 0 || item.price > 1000) {
      return { valid: false, error: 'Invalid price amount' };
    }

    return { valid: true };
  }

  /**
   * Get purchase history (placeholder for future implementation)
   */
  static async getPurchaseHistory(): Promise<Array<{
    id: string;
    date: string;
    item: string;
    amount: number;
    status: string;
  }>> {
    // In a real app, you would fetch this from your backend
    return [];
  }

  /**
   * Handle subscription purchases (placeholder for future implementation)
   */
  static async purchaseSubscription(
    subscriptionItem: PurchaseItem,
    onProgress: (message: string) => void,
    onComplete: (result: PurchaseResult) => void
  ): Promise<void> {
    try {
      onProgress('Subscription purchases coming soon...');
      
      // For now, show a placeholder message
      Alert.alert(
        'Subscription',
        'Subscription purchases will be available in a future update!',
        [{ text: 'OK' }]
      );
      
      onComplete({
        success: false,
        error: 'Subscription purchases not yet available',
      });
    } catch (error) {
      onComplete({
        success: false,
        error: 'Subscription purchase failed',
      });
    }
  }
}

export default PaymentService;