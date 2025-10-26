/**
 * Centralized Card Component
 * Dynamic card component with theme support
 */

import { Theme, useTheme } from '@/hooks/useTheme';
import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewStyle,
} from 'react-native';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'flat' | 'glass' | 'glassStrong';
type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface BaseCardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  style?: ViewStyle;
  rounded?: boolean;
  shadow?: boolean;
}

interface TouchableCardProps extends BaseCardProps, Omit<TouchableOpacityProps, 'style'> {
  touchable: true;
}

interface NonTouchableCardProps extends BaseCardProps {
  touchable?: false;
}

type CardProps = TouchableCardProps | NonTouchableCardProps;

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  style,
  rounded = true,
  shadow = true,
  ...props
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: theme.colors.surface,
          borderColor: 'transparent',
          ...(shadow && theme.shadows.lg),
        };
      case 'outlined':
        return {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderWidth: 1,
          ...(shadow && theme.shadows.sm),
        };
      case 'flat':
        return {
          backgroundColor: theme.colors.surfaceSecondary,
          borderColor: 'transparent',
        };
      case 'glass':
        return {
          backgroundColor: theme.colors.glassmorphismBackground,
          borderColor: theme.colors.glassmorphismBorder,
          borderWidth: 1,
          ...theme.shadows.base,
        };
      case 'glassStrong':
        return {
          backgroundColor: theme.colors.glassmorphismBackgroundStrong,
          borderColor: theme.colors.glassmorphismBorderStrong,
          borderWidth: 1.5,
          ...theme.shadows.lg,
        };
      default:
        return {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderWidth: 1,
          ...(shadow && theme.shadows.base),
        };
    }
  };

  const getPaddingStyles = (): ViewStyle => {
    switch (padding) {
      case 'none':
        return {};
      case 'sm':
        return {
          padding: theme.spacing.sm,
        };
      case 'md':
        return {
          padding: theme.spacing.base,
        };
      case 'lg':
        return {
          padding: theme.spacing.lg,
        };
      case 'xl':
        return {
          padding: theme.spacing.xl,
        };
      default:
        return {
          padding: theme.spacing.base,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const paddingStyles = getPaddingStyles();

  const containerStyle: ViewStyle = {
    ...styles.container,
    ...variantStyles,
    ...paddingStyles,
    ...(rounded && { borderRadius: theme.borderRadius.xl3 }),
    ...(Array.isArray(style) ? StyleSheet.flatten(style) : style || {}),
  };

  if ('touchable' in props && props.touchable) {
    const { touchable, ...touchableProps } = props;
    return (
      <TouchableOpacity
        style={containerStyle}
        activeOpacity={0.9}
        {...touchableProps}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={containerStyle}>
      {children}
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
});

export default Card;