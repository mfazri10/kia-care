import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, FontWeight } from '@/constants/theme';

interface ProgressBarProps {
  progress: number; // 0-1
  color?: string;
  backgroundColor?: string;
  height?: number;
  showLabel?: boolean;
  label?: string;
}

export default function ProgressBar({
  progress,
  color = Colors.primary,
  backgroundColor = Colors.surfaceSecondary,
  height = 8,
  showLabel = false,
  label,
}: ProgressBarProps) {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const percentage = Math.round(clampedProgress * 100);

  return (
    <View>
      {showLabel && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label || ''}</Text>
          <Text style={[styles.percentage, { color }]}>{percentage}%</Text>
        </View>
      )}
      <View style={[styles.track, { height, backgroundColor, borderRadius: height / 2 }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${percentage}%`,
              height,
              backgroundColor: color,
              borderRadius: height / 2,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  percentage: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  track: {
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
