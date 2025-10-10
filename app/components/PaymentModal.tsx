import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  item: {
    name: string;
    gems: number;
    price: string;
  } | null;
  status: 'idle' | 'processing' | 'success' | 'error';
  message: string;
  onRetry?: () => void;
}

export default function PaymentModal({
  visible,
  onClose,
  item,
  status,
  message,
  onRetry,
}: PaymentModalProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return '#8b5cf6';
      case 'success':
        return '#10b981';
      case 'error':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <ActivityIndicator size="large" color="#fff" />;
      case 'success':
        return <Text style={styles.statusIcon}>✅</Text>;
      case 'error':
        return <Text style={styles.statusIcon}>❌</Text>;
      default:
        return null;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'processing':
        return 'Processing Payment';
      case 'success':
        return 'Payment Successful!';
      case 'error':
        return 'Payment Failed';
      default:
        return 'Payment';
    }
  };

  if (!visible || !item) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={status !== 'processing' ? onClose : undefined}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{getStatusTitle()}</Text>
            {status !== 'processing' && (
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Status Icon */}
            <View style={[styles.statusContainer, { backgroundColor: getStatusColor() }]}>
              {getStatusIcon()}
            </View>

            {/* Item Info */}
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <View style={styles.itemDetails}>
                <Text style={styles.gemsText}>💎 {item.gems.toLocaleString()} Gems</Text>
                <Text style={styles.priceText}>{item.price}</Text>
              </View>
            </View>

            {/* Status Message */}
            <Text style={styles.message}>{message}</Text>

            {/* Actions */}
            <View style={styles.actions}>
              {status === 'error' && onRetry && (
                <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
                  <LinearGradient
                    colors={['#8b5cf6', '#7c3aed']}
                    style={styles.gradientButton}
                  >
                    <Text style={styles.buttonText}>Try Again</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {status === 'success' && (
                <TouchableOpacity onPress={onClose} style={styles.successButton}>
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    style={styles.gradientButton}
                  >
                    <Text style={styles.buttonText}>Continue</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {status !== 'processing' && (
                <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                  <Text style={styles.cancelText}>Close</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#1f2937',
    borderRadius: 20,
    width: width * 0.9,
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#374151',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  statusContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusIcon: {
    fontSize: 32,
  },
  itemInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  itemName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gemsText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
  },
  priceText: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    color: '#d1d5db',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  retryButton: {
    width: '100%',
  },
  successButton: {
    width: '100%',
  },
  gradientButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '600',
  },
});