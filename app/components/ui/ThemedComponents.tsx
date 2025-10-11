/**
 * Enhanced Themed Components
 * Centralized, consistent UI components with proper theming
 */

import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator,
  ViewStyle, 
  TextStyle 
} from 'react-native';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';

// Enhanced Button Component with proper primary/secondary variants
interface EnhancedButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const EnhancedButton: React.FC<EnhancedButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
}) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createButtonStyles);

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          container: [
            styles.baseContainer,
            styles.primaryContainer,
            disabled && styles.disabledContainer,
          ],
          text: [
            styles.baseText,
            styles.primaryText,
            disabled && styles.disabledText,
          ],
        };
      case 'secondary':
        return {
          container: [
            styles.baseContainer,
            styles.secondaryContainer,
            disabled && styles.disabledContainer,
          ],
          text: [
            styles.baseText,
            styles.secondaryText,
            disabled && styles.disabledText,
          ],
        };
      case 'ghost':
        return {
          container: [
            styles.baseContainer,
            styles.ghostContainer,
          ],
          text: [
            styles.baseText,
            styles.ghostText,
            disabled && styles.disabledText,
          ],
        };
      case 'outline':
        return {
          container: [
            styles.baseContainer,
            styles.outlineContainer,
            disabled && styles.disabledContainer,
          ],
          text: [
            styles.baseText,
            styles.outlineText,
            disabled && styles.disabledText,
          ],
        };
      default:
        return {
          container: [styles.baseContainer, styles.primaryContainer],
          text: [styles.baseText, styles.primaryText],
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          container: styles.smContainer,
          text: styles.smText,
        };
      case 'lg':
        return {
          container: styles.lgContainer,
          text: styles.lgText,
        };
      case 'xl':
        return {
          container: styles.xlContainer,
          text: styles.xlText,
        };
      default:
        return {
          container: styles.mdContainer,
          text: styles.mdText,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      style={[
        ...variantStyles.container,
        sizeStyles.container,
        fullWidth && styles.fullWidth,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
    >
      <View style={styles.contentContainer}>
        {isLoading ? (
          <ActivityIndicator 
            color={variant === 'primary' ? theme.colors.textInverse : theme.colors.primary} 
            size="small" 
          />
        ) : (
          <>
            {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
            <Text style={[...variantStyles.text, sizeStyles.text, textStyle]}>
              {title}
            </Text>
            {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Enhanced Card Component with proper padding
interface EnhancedCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
}

export const EnhancedCard: React.FC<EnhancedCardProps> = ({
  children,
  variant = 'elevated',
  padding = 'lg',
  style,
}) => {
  const styles = useThemedStyles(createCardStyles);

  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return styles.elevatedCard;
      case 'outlined':
        return styles.outlinedCard;
      default:
        return styles.defaultCard;
    }
  };

  const getPaddingStyles = () => {
    switch (padding) {
      case 'none':
        return {};
      case 'sm':
        return styles.smPadding;
      case 'md':
        return styles.mdPadding;
      case 'lg':
        return styles.lgPadding;
      case 'xl':
        return styles.xlPadding;
      default:
        return styles.lgPadding;
    }
  };

  return (
    <View style={[
      styles.baseCard,
      getVariantStyles(),
      getPaddingStyles(),
      style,
    ]}>
      {children}
    </View>
  );
};

// Enhanced Text Component
interface EnhancedTextProps {
  children: React.ReactNode;
  variant?: 'heading1' | 'heading2' | 'heading3' | 'heading4' | 'body1' | 'body2' | 'caption';
  color?: 'text' | 'textSecondary' | 'textInverse' | 'primary' | 'success' | 'error' | 'warning';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
  style?: TextStyle;
}

export const EnhancedText: React.FC<EnhancedTextProps> = ({
  children,
  variant = 'body1',
  color = 'text',
  weight,
  align = 'left',
  style,
}) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createTextStyles);

  const getVariantStyles = () => {
    switch (variant) {
      case 'heading1':
        return styles.heading1;
      case 'heading2':
        return styles.heading2;
      case 'heading3':
        return styles.heading3;
      case 'heading4':
        return styles.heading4;
      case 'body1':
        return styles.body1;
      case 'body2':
        return styles.body2;
      case 'caption':
        return styles.caption;
      default:
        return styles.body1;
    }
  };

  const getColorStyles = () => {
    switch (color) {
      case 'text':
        return { color: theme.colors.text };
      case 'textSecondary':
        return { color: theme.colors.textSecondary };
      case 'textInverse':
        return { color: theme.colors.textInverse };
      case 'primary':
        return { color: theme.colors.primary };
      case 'success':
        return { color: theme.colors.success };
      case 'error':
        return { color: theme.colors.error };
      case 'warning':
        return { color: theme.colors.warning };
      default:
        return { color: theme.colors.text };
    }
  };

  const getWeightStyles = () => {
    if (!weight) return {};
    return {
      fontWeight: theme.typography.fontWeights[weight],
      fontFamily: weight === 'bold' || weight === 'semibold' 
        ? theme.typography.fontFamilies.bold 
        : weight === 'medium'
        ? theme.typography.fontFamilies.medium
        : theme.typography.fontFamilies.regular,
    };
  };

  return (
    <Text style={[
      getVariantStyles(),
      getColorStyles(),
      getWeightStyles(),
      { textAlign: align },
      style,
    ]}>
      {children}
    </Text>
  );
};

// Button Styles
const createButtonStyles = (theme: any) => ({
  baseContainer: {
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
  },
  primaryContainer: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  secondaryContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(10px)' as any,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  ghostContainer: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  disabledContainer: {
    backgroundColor: theme.colors.border,
    borderColor: theme.colors.border,
    opacity: 0.6,
  },
  contentContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  leftIcon: {
    marginRight: theme.spacing.sm,
  },
  rightIcon: {
    marginLeft: theme.spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
  // Size variants
  smContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 36,
  },
  mdContainer: {
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    minHeight: 44,
  },
  lgContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.base,
    minHeight: 52,
  },
  xlContainer: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    minHeight: 60,
  },
  // Text styles
  baseText: {
    fontFamily: theme.typography.fontFamilies.medium,
    fontWeight: theme.typography.fontWeights.semibold as any,
    textAlign: 'center' as const,
  },
  primaryText: {
    color: theme.colors.textInverse,
  },
  secondaryText: {
    color: theme.colors.text,
  },
  ghostText: {
    color: theme.colors.primary,
  },
  outlineText: {
    color: theme.colors.primary,
  },
  disabledText: {
    color: theme.colors.textTertiary,
  },
  smText: {
    fontSize: theme.typography.fontSizes.sm,
    lineHeight: theme.typography.lineHeights.sm,
  },
  mdText: {
    fontSize: theme.typography.fontSizes.base,
    lineHeight: theme.typography.lineHeights.base,
  },
  lgText: {
    fontSize: theme.typography.fontSizes.lg,
    lineHeight: theme.typography.lineHeights.lg,
  },
  xlText: {
    fontSize: theme.typography.fontSizes.xl,
    lineHeight: theme.typography.lineHeights.xl,
  },
});

// Card Styles
const createCardStyles = (theme: any) => ({
  baseCard: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden' as const,
  },
  defaultCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  elevatedCard: {
    backgroundColor: theme.colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  outlinedCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  // Padding variants
  smPadding: {
    padding: theme.spacing.sm,
  },
  mdPadding: {
    padding: theme.spacing.base,
  },
  lgPadding: {
    padding: theme.spacing.lg,
  },
  xlPadding: {
    padding: theme.spacing.xl,
  },
});

// Text Styles
const createTextStyles = (theme: any) => ({
  heading1: {
    fontSize: theme.typography.fontSizes.xl5,
    lineHeight: theme.typography.lineHeights.xl5,
    fontWeight: theme.typography.fontWeights.bold as any,
    fontFamily: theme.typography.fontFamilies.bold,
  },
  heading2: {
    fontSize: theme.typography.fontSizes.xl4,
    lineHeight: theme.typography.lineHeights.xl4,
    fontWeight: theme.typography.fontWeights.semibold as any,
    fontFamily: theme.typography.fontFamilies.bold,
  },
  heading3: {
    fontSize: theme.typography.fontSizes.xl3,
    lineHeight: theme.typography.lineHeights.xl3,
    fontWeight: theme.typography.fontWeights.semibold as any,
    fontFamily: theme.typography.fontFamilies.medium,
  },
  heading4: {
    fontSize: theme.typography.fontSizes.xl2,
    lineHeight: theme.typography.lineHeights.xl2,
    fontWeight: theme.typography.fontWeights.semibold as any,
    fontFamily: theme.typography.fontFamilies.medium,
  },
  body1: {
    fontSize: theme.typography.fontSizes.base,
    lineHeight: theme.typography.lineHeights.base,
    fontWeight: theme.typography.fontWeights.normal as any,
    fontFamily: theme.typography.fontFamilies.regular,
  },
  body2: {
    fontSize: theme.typography.fontSizes.sm,
    lineHeight: theme.typography.lineHeights.sm,
    fontWeight: theme.typography.fontWeights.normal as any,
    fontFamily: theme.typography.fontFamilies.regular,
  },
  caption: {
    fontSize: theme.typography.fontSizes.xs,
    lineHeight: theme.typography.lineHeights.xs,
    fontWeight: theme.typography.fontWeights.normal as any,
    fontFamily: theme.typography.fontFamilies.regular,
  },
});

// Default export for the component (fixes the missing default export warning)
export default {
  EnhancedButton,
  EnhancedCard,
  EnhancedText,
};