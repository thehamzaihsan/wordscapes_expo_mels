/**
 * Centralized Modal Component
 * Dynamic modal component with theme support
 */

import React from 'react';
import {
  Modal as RNModal,
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  ViewStyle,
  ModalProps as RNModalProps,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme, Theme } from '@/hooks/useTheme';
import ThemedText from './ThemedText';
import ThemedButton from './ThemedButton';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type ModalSize = 'small' | 'medium' | 'large' | 'fullscreen';
type ModalPosition = 'center' | 'bottom' | 'top';

interface ModalProps extends Omit<RNModalProps, 'children'> {
  children: React.ReactNode;
  isVisible: boolean;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
  size?: ModalSize;
  position?: ModalPosition;
  showCloseButton?: boolean;
  closeOnBackdropPress?: boolean;
  closeOnBackButtonPress?: boolean;
  backdrop?: 'blur' | 'solid' | 'transparent';
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  scrollable?: boolean;
  keyboardAvoidingView?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  children,
  isVisible,
  onClose,
  title,
  subtitle,
  size = 'medium',
  position = 'center',
  showCloseButton = false,
  closeOnBackdropPress = true,
  closeOnBackButtonPress = true,
  backdrop = 'blur',
  style,
  contentStyle,
  scrollable = false,
  keyboardAvoidingView = true,
  ...modalProps
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'small':
        return {
          width: Math.min(screenWidth * 0.8, 400),
          maxHeight: screenHeight * 0.6,
        };
      case 'medium':
        return {
          width: Math.min(screenWidth * 0.9, 500),
          maxHeight: screenHeight * 0.8,
        };
      case 'large':
        return {
          width: Math.min(screenWidth * 0.95, 600),
          maxHeight: screenHeight * 0.9,
        };
      case 'fullscreen':
        return {
          width: screenWidth,
          height: screenHeight,
        };
      default:
        return {
          width: Math.min(screenWidth * 0.9, 500),
          maxHeight: screenHeight * 0.8,
        };
    }
  };

  const getPositionStyles = (): ViewStyle => {
    const sizeStyles = getSizeStyles();
    
    switch (position) {
      case 'top':
        return {
          justifyContent: 'flex-start',
          paddingTop: 50,
        };
      case 'bottom':
        return {
          justifyContent: 'flex-end',
          paddingBottom: 50,
        };
      case 'center':
      default:
        return {
          justifyContent: 'center',
          alignItems: 'center',
        };
    }
  };

  const handleBackdropPress = () => {
    if (closeOnBackdropPress && onClose) {
      onClose();
    }
  };

  const renderBackdrop = () => {
    switch (backdrop) {
      case 'blur':
        return (
          <BlurView intensity={50} style={styles.backdrop}>
            <TouchableWithoutFeedback onPress={handleBackdropPress}>
              <View style={styles.backdropTouchable} />
            </TouchableWithoutFeedback>
          </BlurView>
        );
      case 'solid':
        return (
          <TouchableWithoutFeedback onPress={handleBackdropPress}>
            <View style={[styles.backdrop, styles.solidBackdrop]} />
          </TouchableWithoutFeedback>
        );
      case 'transparent':
        return (
          <TouchableWithoutFeedback onPress={handleBackdropPress}>
            <View style={[styles.backdrop, styles.transparentBackdrop]} />
          </TouchableWithoutFeedback>
        );
      default:
        return null;
    }
  };

  const renderContent = () => {
    const sizeStyles = getSizeStyles();
    const modalContentStyle = StyleSheet.flatten([
      styles.modalContent,
      sizeStyles,
      size === 'fullscreen' && styles.fullscreenContent,
      contentStyle,
    ]);

    const content = (
      <>
        {(title || subtitle || showCloseButton) && (
          <View style={styles.header}>
            <View style={styles.headerText}>
              {title && (
                <ThemedText variant="heading3" weight="semibold">
                  {title}
                </ThemedText>
              )}
              {subtitle && (
                <ThemedText variant="body2" color="textSecondary" style={styles.subtitle}>
                  {subtitle}
                </ThemedText>
              )}
            </View>
            {showCloseButton && onClose && (
              <ThemedButton
                title="✕"
                variant="ghost"
                size="sm"
                onPress={onClose}
                style={styles.closeButton}
              />
            )}
          </View>
        )}
        
        <View style={styles.body}>
          {children}
        </View>
      </>
    );

    return (
      <View style={modalContentStyle}>
        {scrollable ? (
          <ScrollView 
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </View>
    );
  };

  const positionStyles = getPositionStyles();

  return (
    <RNModal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={closeOnBackButtonPress ? onClose : undefined}
      {...modalProps}
    >
      <View style={[styles.container, positionStyles, style]}>
        {renderBackdrop()}
        {keyboardAvoidingView ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            {renderContent()}
          </KeyboardAvoidingView>
        ) : (
          renderContent()
        )}
      </View>
    </RNModal>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backdropTouchable: {
    flex: 1,
  },
  solidBackdrop: {
    backgroundColor: theme.colors.overlay,
  },
  transparentBackdrop: {
    backgroundColor: 'transparent',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    ...theme.shadows.xl,
    overflow: 'hidden',
  },
  fullscreenContent: {
    borderRadius: 0,
    margin: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSecondary,
  },
  headerText: {
    flex: 1,
  },
  subtitle: {
    marginTop: theme.spacing.xs,
  },
  closeButton: {
    marginLeft: theme.spacing.md,
    minWidth: 32,
  },
  body: {
    padding: theme.spacing.lg,
  },
});

export default Modal;