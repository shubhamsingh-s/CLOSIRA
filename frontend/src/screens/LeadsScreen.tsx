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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#6366F1', '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#EC4899'];
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    return colors[sum % colors.length];
  };

  const renderItem = ({ item }: { item: typeof enquiries[0] }) => {
    const initials = getInitials(item.customer_name);
    const avatarBg = getAvatarColor(item.customer_name);
    const isUnread = item.status === 'new';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('ConversationDetail', { id: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatarRow}>
            {/* Initials Avatar */}
            <View style={[styles.avatarCircle, { backgroundColor: avatarBg }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.nameContainer}>
              <View style={styles.nameRow}>
                <Text style={styles.customerName}>{item.customer_name}</Text>
                {isUnread && <View style={styles.unreadBadge} />}
              </View>
              <Text style={styles.timeText}>{formatDate(item.created_at)}</Text>
            </View>
          </View>
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
  };

  return (
    <View style={styles.container}>
      <Header title="Enquiries & Leads" subtitle="Triage communications and view SOP outcomes" />
      <View style={styles.contentWrapper}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 1400,
    alignSelf: 'center',
  },
  listContent: {
    padding: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xxl,
  },
  card: {
    backgroundColor: Theme.colors.card,
    borderRadius: 14,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.4)',
    ...Theme.shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  nameContainer: {
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerName: {
    ...Theme.typography.titleMedium,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.info,
    marginLeft: Theme.spacing.sm,
  },
  timeText: {
    ...Theme.typography.caption,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  messageSnippet: {
    ...Theme.typography.bodyMedium,
    color: Theme.colors.textPrimary,
    opacity: 0.8,
    marginBottom: Theme.spacing.md,
    lineHeight: 20,
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
