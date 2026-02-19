import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/theme';

interface ChecklistItemProps {
  title: string;
  description?: string;
  checked: boolean;
  onToggle: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
}

export default function ChecklistItem({
  title,
  description,
  checked,
  onToggle,
  icon,
  color = Colors.primary,
}: ChecklistItemProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onToggle}
      style={[styles.container, checked && { backgroundColor: color + '08' }]}
    >
      <View style={[styles.checkbox, checked && { backgroundColor: color, borderColor: color }]}>
        {checked && <Ionicons name="checkmark" size={16} color={Colors.white} />}
      </View>
      {icon && (
        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
      )}
      <View style={styles.textContainer}>
        <Text style={[styles.title, checked && styles.checkedTitle]}>{title}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  checkedTitle: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
