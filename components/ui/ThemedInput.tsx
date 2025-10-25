/**
 * Centralized Input Component
 * Dynamic input component with theme support
 */

import { Theme, useTheme } from '@/hooks/useTheme';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

type InputVariant = 'default' | 'outlined' | 'filled' | 'underlined';
type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: InputVariant;
  size?: InputSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  required?: boolean;
  showRequiredIndicator?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  variant = 'outlined',
  size = 'md',
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  labelStyle,
  required = false,
  showRequiredIndicator = true,
  value,
  onFocus,
  onBlur,
  editable = true,
  ...textInputProps
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const styles = createStyles(theme);

  const hasError = !!error;
  const hasValue = !!value;

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const getVariantStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderWidth: 1,
    };

    if (hasError) {
      return {
        ...baseStyle,
        borderColor: theme.colors.error,
        backgroundColor: variant === 'filled' ? `${theme.colors.error}10` : 'transparent',
      };
    }

    if (isFocused) {
      switch (variant) {
        case 'outlined':
          return {
            ...baseStyle,
            borderColor: theme.colors.primary,
            backgroundColor: 'transparent',
          };
        case 'filled':
          return {
            ...baseStyle,
            borderColor: theme.colors.primary,
            backgroundColor: theme.colors.surfaceSecondary,
          };
        case 'underlined':
          return {
            borderBottomWidth: 2,
            borderTopWidth: 0,
            borderLeftWidth: 0,
            borderRightWidth: 0,
            borderColor: theme.colors.primary,
            backgroundColor: 'transparent',
          };
        default:
          return {
            ...baseStyle,
            borderColor: theme.colors.primary,
            backgroundColor: 'transparent',
          };
      }
    }

    switch (variant) {
      case 'outlined':
        return {
          ...baseStyle,
          borderColor: theme.colors.border,
          backgroundColor: 'transparent',
        };
      case 'filled':
        return {
          ...baseStyle,
          borderColor: 'transparent',
          backgroundColor: theme.colors.surfaceSecondary,
        };
      case 'underlined':
        return {
          borderBottomWidth: 1,
          borderTopWidth: 0,
          borderLeftWidth: 0,
          borderRightWidth: 0,
          borderColor: theme.colors.border,
          backgroundColor: 'transparent',
        };
      default:
        return {
          ...baseStyle,
          borderColor: theme.colors.border,
          backgroundColor: 'transparent',
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; input: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: {
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
            minHeight: 36,
          },
          input: {
            fontSize: theme.typography.fontSizes.sm,
            lineHeight: theme.typography.lineHeights.sm,
            minHeight: 36,

          },
        };
      case 'lg':
        return {
          container: {
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.base,
            minHeight: 56,
          },
          input: {
            fontSize: theme.typography.fontSizes.lg,
            lineHeight: theme.typography.lineHeights.lg,
            minHeight: 56,
          },
        };
      default:
        return {
          container: {
            paddingHorizontal: theme.spacing.base,
            paddingVertical: theme.spacing.md,
            minHeight: 44,
          },
          input: {
            fontSize: theme.typography.fontSizes.base,
            lineHeight: theme.typography.lineHeights.base,
            minHeight: 44,
          },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const inputContainerStyle: ViewStyle = {
    ...styles.inputContainer,
    ...variantStyles,
    ...sizeStyles.container,
    opacity: editable ? 1 : 0.6,
  };

  const textInputStyle: TextStyle = {
    ...styles.input,
    ...sizeStyles.input,
    color: theme.colors.text,
    paddingRight: rightIcon ? 40 : 0, // Add padding when right icon is present
    ...(Array.isArray(inputStyle) ? StyleSheet.flatten(inputStyle) : inputStyle || {}),
  };

  return (
    <View style={[styles.container, Array.isArray(containerStyle) ? StyleSheet.flatten(containerStyle) : containerStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, Array.isArray(labelStyle) ? StyleSheet.flatten(labelStyle) : labelStyle]}>
            {label}
            {required && showRequiredIndicator && (
              <Text style={styles.required}> *</Text>
            )}
          </Text>
        </View>
      )}
      
      <View style={inputContainerStyle}>
        {leftIcon && (
          <View style={styles.leftIcon}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={textInputStyle}
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={theme.colors.textTertiary}
          editable={editable}
          {...textInputProps}
        />
        
        {rightIcon && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      
      {(error || helperText) && (
        <View style={styles.helperContainer}>
          <Text style={[
            styles.helperText,
            hasError && styles.errorText
          ]}>
            {error || helperText}
          </Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    marginVertical: theme.spacing.xs,
  },
  labelContainer: {
    marginBottom: theme.spacing.xs,
  },
  label: {
    fontSize: theme.typography.fontSizes.sm,
    fontFamily: theme.typography.fontFamilies.medium,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.text,
  },
  required: {
    color: theme.colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    position: 'relative', // Enable absolute positioning for right icon
  },
  input: {
    flex: 1,
    fontFamily: theme.typography.fontFamilies.regular,
    fontWeight: theme.typography.fontWeights.normal,
  },
  leftIcon: {
    marginRight: theme.spacing.sm,
  },
  rightIcon: {
    position: 'absolute',
    right: theme.spacing.md,
    top: 0,
    bottom: 0,
    padding: theme.spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  helperContainer: {
    marginTop: theme.spacing.xs,
  },
  helperText: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.textSecondary,
  },
  errorText: {
    color: theme.colors.error,
  },
});

export default Input;