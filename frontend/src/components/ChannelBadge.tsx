import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../theme/theme';

interface ChannelBadgeProps {
  channel: 'whatsapp' | 'email' | 'call' | string;
}

export const ChannelBadge: React.FC<ChannelBadgeProps> = ({ channel }) => {
  const getStyle = () => {
    switch (channel.toLowerCase()) {
      case 'whatsapp':
        return {
          bg: 'rgba(16, 185, 129, 0.15)', // transparent success emerald
          color: Theme.colors.success,
          label: 'WhatsApp',
        };
      case 'email':
        return {
          bg: 'rgba(59, 130, 246, 0.15)', // transparent info blue
          color: Theme.colors.info,
          label: 'Email',
        };
      case 'call':
        return {
          bg: 'rgba(245, 158, 11, 0.15)', // transparent warning amber
          color: Theme.colors.warning,
          label: 'Call',
        };
      default:
        return {
          bg: '#334155',
          color: Theme.colors.textSecondary,
          label: channel,
        };
    }
  };

  const config = getStyle();

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs - 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    ...Theme.typography.badge,
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
