import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Theme } from '../theme/theme';
import { Header } from '../components/Header';
import { ChannelBadge } from '../components/ChannelBadge';
import { StatusBadge } from '../components/StatusBadge';
import mockData from '../mock/mockData.json';

export const LeadsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const enquiries = mockData.enquiries;

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderItem = ({ item }: { item: typeof enquiries[0] }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ConversationDetail', { id: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.customerName}>{item.customer_name}</Text>
        <Text style={styles.timeText}>{formatDate(item.created_at)}</Text>
      </View>
      
      <Text style={styles.messageSnippet} numberOfLines={2}>
        {item.message}
      </Text>

      <View style={styles.badgeRow}>
        <ChannelBadge channel={item.channel} />
        <View style={styles.spacer} />
        <StatusBadge status={item.status} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header title="Enquiries & Leads" subtitle="Triage communications and view SOP outcomes" />
      <FlatList
        data={enquiries}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No enquiries logged today.</Text>
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
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  customerName: {
    ...Theme.typography.titleMedium,
    fontSize: 16,
  },
  timeText: {
    ...Theme.typography.caption,
    color: Theme.colors.textSecondary,
  },
  messageSnippet: {
    ...Theme.typography.bodyMedium,
    color: Theme.colors.textPrimary,
    opacity: 0.8,
    marginBottom: Theme.spacing.md,
    lineHeight: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spacer: {
    width: Theme.spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.xxl,
  },
  emptyText: {
    ...Theme.typography.bodyMedium,
    color: Theme.colors.textSecondary,
  },
});
