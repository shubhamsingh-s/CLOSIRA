import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../theme/theme';

interface StatusBadgeProps {
  status: 'new' | 'qualified' | 'escalated' | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStyle = () => {
    switch (status.toLowerCase()) {
      case 'new':
        return {
          bg: 'rgba(59, 130, 246, 0.1)',
          color: Theme.colors.info,
          borderColor: 'rgba(59, 130, 246, 0.3)',
          label: 'New',
        };
      case 'qualified':
        return {
          bg: 'rgba(16, 185, 129, 0.1)',
          color: Theme.colors.success,
          borderColor: 'rgba(16, 185, 129, 0.3)',
          label: 'Qualified',
        };
      case 'escalated':
        return {
          bg: 'rgba(239, 68, 68, 0.1)',
          color: Theme.colors.danger,
          borderColor: 'rgba(239, 68, 68, 0.3)',
          label: 'Escalated',
        };
      default:
        return {
          bg: 'rgba(148, 163, 184, 0.1)',
          color: Theme.colors.textSecondary,
          borderColor: 'rgba(148, 163, 184, 0.3)',
          label: status,
        };
    }
  };

  const config = getStyle();

  return (
    <View style={[styles.badge, { backgroundColor: config.bg, borderColor: config.borderColor }]}>
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs - 2,
    borderRadius: 99,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    ...Theme.typography.badge,
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
