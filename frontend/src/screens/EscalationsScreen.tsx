import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Theme } from '../theme/theme';
import { Header } from '../components/Header';
import { ChannelBadge } from '../components/ChannelBadge';
import mockData from '../mock/mockData.json';

export const EscalationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [escalations, setEscalations] = useState(mockData.escalations);

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handleResolve = (escId: string, customer: string) => {
    Alert.alert(
      "Resolve Escalation",
      `Are you sure you want to resolve this escalation for ${customer}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: () => {
            setEscalations(prev => prev.filter(item => item.id !== escId));
            Alert.alert("Success", "Escalation resolved and customer notified.");
          } 
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: typeof escalations[0] }) => (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ConversationDetail', { id: item.enquiry_id })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.customerName}>{item.customer_name}</Text>
          <View style={[
            styles.urgencyBadge, 
            item.urgency === 'high' ? styles.badgeHigh : styles.badgeMedium
          ]}>
            <Text style={[
              styles.urgencyText, 
              item.urgency === 'high' ? styles.textHigh : styles.textMedium
            ]}>
              {item.urgency} Priority
            </Text>
          </View>
        </View>
        <Text style={styles.timeText}>{formatDate(item.created_at)}</Text>
      </View>

      <Text style={styles.reasonLabel}>Escalation Reason:</Text>
      <Text style={styles.reasonText}>{item.reason}</Text>

      <View style={styles.footer}>
        <ChannelBadge channel={item.channel} />
        
        <TouchableOpacity 
          style={styles.resolveButton}
          onPress={() => handleResolve(item.id, item.customer_name)}
        >
          <Text style={styles.resolveButtonText}>Resolve Case</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header title="Human Escalations" subtitle="Address requests flagged for manual intervention" />
      <FlatList
        data={escalations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Inbox Clear!</Text>
            <Text style={styles.emptySubtitle}>No open human escalations pending review.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  listContent: {
    padding: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xxl,
  },
  card: {
    backgroundColor: Theme.colors.card,
    borderRadius: 12,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.md,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  customerName: {
    ...Theme.typography.titleMedium,
    fontSize: 16,
    marginRight: Theme.spacing.sm,
  },
  urgencyBadge: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeHigh: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  badgeMedium: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  urgencyText: {
    ...Theme.typography.caption,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  textHigh: {
    color: Theme.colors.danger,
  },
  textMedium: {
    color: Theme.colors.warning,
  },
  timeText: {
    ...Theme.typography.caption,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  reasonLabel: {
    ...Theme.typography.caption,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  reasonText: {
    ...Theme.typography.bodyLarge,
    fontSize: 14,
    color: Theme.colors.textPrimary,
    lineHeight: 20,
    marginBottom: Theme.spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.5)',
    paddingTop: Theme.spacing.md,
  },
  resolveButton: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm - 2,
    borderRadius: 6,
    ...Theme.shadows.sm,
  },
  resolveButtonText: {
    ...Theme.typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.xxl * 2,
  },
  emptyTitle: {
    ...Theme.typography.titleMedium,
    fontSize: 18,
    color: Theme.colors.success,
    marginBottom: Theme.spacing.xs,
  },
  emptySubtitle: {
    ...Theme.typography.bodyMedium,
    color: Theme.colors.textSecondary,
  },
});
