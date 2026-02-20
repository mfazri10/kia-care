import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, FontSize, FontWeight } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  color?: string;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  color,
}: ButtonProps) {
  const buttonColor = color || Colors.primary;

  const getButtonStyle = (): ViewStyle[] => {
    const base: ViewStyle[] = [styles.base, sizeStyles[size]];

    switch (variant) {
      case 'primary':
        base.push({ backgroundColor: buttonColor });
        break;
      case 'secondary':
        base.push({ backgroundColor: `${buttonColor}15` });
        break;
      case 'outline':
        base.push({ backgroundColor: 'transparent', borderWidth: 1.5, borderColor: buttonColor });
        break;
      case 'ghost':
        base.push({ backgroundColor: 'transparent' });
        break;
      case 'danger':
        base.push({ backgroundColor: Colors.danger });
        break;
    }

    if (disabled || loading) {
      base.push({ opacity: 0.5 });
    }
    if (fullWidth) {
      base.push({ width: '100%' });
    }

    return base;
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
      case 'danger':
        return Colors.white;
      case 'secondary':
      case 'outline':
      case 'ghost':
        return buttonColor;
      default:
        return Colors.white;
    }
  };

  const textColor = getTextColor();
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 18;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled || loading}
      style={[...getButtonStyle(), style]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={iconSize} color={textColor} style={{ marginRight: Spacing.sm }} />
          )}
          <Text style={[styles.text, textSizeStyles[size], { color: textColor }, textStyle]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={iconSize} color={textColor} style={{ marginLeft: Spacing.sm }} />
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  text: {
    fontWeight: FontWeight.semibold,
  },
});

const sizeStyles: Record<string, ViewStyle> = {
  sm: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm },
  md: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.md },
  lg: { paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.lg, height: 56, borderRadius: BorderRadius.lg },
};

const textSizeStyles: Record<string, TextStyle> = {
  sm: { fontSize: FontSize.sm },
  md: { fontSize: FontSize.md },
  lg: { fontSize: FontSize.lg },
};
