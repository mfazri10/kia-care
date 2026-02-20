import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  subtitle?: string;
  style?: ViewStyle;
  disabled?: boolean;
  compact?: boolean;
}

export default function PrimaryButton({
  title,
  onPress,
  icon,
  color = Colors.primary,
  subtitle,
  style,
  disabled = false,
  compact = false,
}: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      style={[
        compact ? styles.compactContainer : styles.container,
        { backgroundColor: color + '12', borderColor: color + '30' },
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      {icon && (
        <View style={[compact ? styles.compactIconContainer : styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={compact ? 18 : 22} color={color} />
        </View>
      )}
      <View style={styles.textContainer}>
        <Text style={[compact ? styles.compactTitle : styles.title, { color }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={16} color={color + '80'} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    ...Shadow.sm,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  compactIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  compactTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  disabled: {
    opacity: 0.5,
  },
});
