/**
 * Centralized Button Component
 * Dynamic button component with theme support
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme, Theme } from '@/hooks/useTheme';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  rounded?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  rounded = false,
  disabled,
  style,
  textStyle,
  ...touchableProps
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: disabled ? theme.colors.border : theme.colors.primary,
            borderColor: disabled ? theme.colors.border : theme.colors.primary,
            ...theme.shadows.base,
          },
          text: { color: theme.colors.textInverse },
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: disabled 
              ? 'rgba(255, 255, 255, 0.05)' 
              : 'rgba(255, 255, 255, 0.15)',
            borderColor: disabled 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'rgba(255, 255, 255, 0.3)',
            borderWidth: 1,
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 4,
          },
          text: { color: theme.colors.text },
        };
      case 'success':
        return {
          container: {
            backgroundColor: disabled ? theme.colors.border : theme.colors.success,
            borderColor: disabled ? theme.colors.border : theme.colors.success,
            ...theme.shadows.base,
          },
          text: { color: theme.colors.textInverse },
        };
      case 'error':
        return {
          container: {
            backgroundColor: disabled ? theme.colors.border : theme.colors.error,
            borderColor: disabled ? theme.colors.border : theme.colors.error,
            ...theme.shadows.base,
          },
          text: { color: theme.colors.textInverse },
        };
      case 'warning':
        return {
          container: {
            backgroundColor: disabled ? theme.colors.border : theme.colors.warning,
            borderColor: disabled ? theme.colors.border : theme.colors.warning,
            ...theme.shadows.base,
          },
          text: { color: theme.colors.textInverse },
        };
      case 'info':
        return {
          container: {
            backgroundColor: disabled ? theme.colors.border : theme.colors.info,
            borderColor: disabled ? theme.colors.border : theme.colors.info,
            ...theme.shadows.base,
          },
          text: { color: theme.colors.textInverse },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderColor: disabled ? theme.colors.border : theme.colors.primary,
            borderWidth: 2,
          },
          text: { color: disabled ? theme.colors.textTertiary : theme.colors.primary },
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
            borderColor: 'transparent',
          },
          text: { color: disabled ? theme.colors.textTertiary : theme.colors.primary },
        };
      default:
        return {
          container: {
            backgroundColor: disabled ? theme.colors.border : theme.colors.primary,
            borderColor: disabled ? theme.colors.border : theme.colors.primary,
          },
          text: { color: theme.colors.textInverse },
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: {
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
            minHeight: 36,
          },
          text: {
            fontSize: theme.typography.fontSizes.sm,
            lineHeight: theme.typography.lineHeights.sm,
          },
        };
      case 'md':
        return {
          container: {
            paddingHorizontal: theme.spacing.base,
            paddingVertical: theme.spacing.md,
            minHeight: 44,
          },
          text: {
            fontSize: theme.typography.fontSizes.base,
            lineHeight: theme.typography.lineHeights.base,
          },
        };
      case 'lg':
        return {
          container: {
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.base,
            minHeight: 52,
          },
          text: {
            fontSize: theme.typography.fontSizes.lg,
            lineHeight: theme.typography.lineHeights.lg,
          },
        };
      case 'xl':
        return {
          container: {
            paddingHorizontal: theme.spacing.xl,
            paddingVertical: theme.spacing.lg,
            minHeight: 60,
          },
          text: {
            fontSize: theme.typography.fontSizes.xl,
            lineHeight: theme.typography.lineHeights.xl,
          },
        };
      default:
        return {
          container: {
            paddingHorizontal: theme.spacing.base,
            paddingVertical: theme.spacing.md,
            minHeight: 44,
          },
          text: {
            fontSize: theme.typography.fontSizes.base,
            lineHeight: theme.typography.lineHeights.base,
          },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const containerStyle: ViewStyle = {
    ...styles.container,
    ...variantStyles.container,
    ...sizeStyles.container,
    ...(fullWidth && styles.fullWidth),
    ...(rounded && { borderRadius: theme.borderRadius.full }),
    ...style,
  };

  const textStyleCombined: TextStyle = {
    ...styles.text,
    ...variantStyles.text,
    ...sizeStyles.text,
    ...textStyle,
  };

  return (
    <TouchableOpacity
      style={containerStyle}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      {...touchableProps}
    >
      <View style={styles.content}>
        {isLoading ? (
          <>
            <ActivityIndicator
              color={variantStyles.text.color}
              size="small"
              style={styles.loader}
            />
            {loadingText && (
              <Text style={textStyleCombined}>
                {loadingText}
              </Text>
            )}
          </>
        ) : (
          <>
            {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
            <Text style={textStyleCombined} numberOfLines={1}>
              {title}
            </Text>
            {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: theme.typography.fontFamilies.medium,
    fontWeight: theme.typography.fontWeights.semibold,
    textAlign: 'center',
  },
  leftIcon: {
    marginRight: theme.spacing.sm,
  },
  rightIcon: {
    marginLeft: theme.spacing.sm,
  },
  loader: {
    marginRight: theme.spacing.sm,
  },
});

export default Button;