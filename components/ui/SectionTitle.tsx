import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight } from '@/constants/theme';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
}

export default function SectionTitle({
  title,
  subtitle,
  actionLabel,
  onAction,
  icon,
  color = Colors.textPrimary,
}: SectionTitleProps) {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        {icon && (
          <Ionicons name={icon} size={20} color={color} style={styles.icon} />
        )}
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color }]}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[styles.actionLabel, { color: Colors.primary }]}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actionLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
});
