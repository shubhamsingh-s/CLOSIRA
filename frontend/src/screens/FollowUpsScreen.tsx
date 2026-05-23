import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Theme } from '../theme/theme';
import { Header } from '../components/Header';
import { api } from '../utils/api';
import { safeAlert } from '../utils/alerts';

export const FollowUpsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [followups, setFollowups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFollowups = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    const data = await api.getFollowups();
    // Filter pending follow-ups
    const pendingList = data.filter((f: any) => f.status === 'pending');
    
    // Map with simulated customer names/previews if backend returns relational entities
    const resolvedFollowups = pendingList.map((item: any) => {
      return {
        id: item.id,
        enquiry_id: item.enquiry_id,
        customer_name: item.customer_name || "Valued Customer",
        delay_in_minutes: item.delay_in_minutes,
        message_preview: item.message_template || "Follow-up reminder checking back on customer request.",
        status: item.status,
        due_time: item.scheduled_for
      };
    });

    setFollowups(resolvedFollowups);
    setLoading(false);
  };

  useEffect(() => {
    fetchFollowups();

    const unsubscribe = navigation.addListener('focus', () => {
      fetchFollowups(false);
    });
    return unsubscribe;
  }, [navigation]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFollowups(false);
    setRefreshing(false);
  };

  const handleMarkAsDone = async (followupId: string, customer: string) => {
    safeAlert(
      "Complete Follow-up",
      `Mark this scheduled message for ${customer} as sent?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: async () => {
            const result = await api.completeFollowup(followupId);
            if (result && result.status) {
              safeAlert("Completed", "Follow-up message marked as dispatched.");
              fetchFollowups(false);
            }
          } 
        }
      ]
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderItem = ({ item }: { item: any }) => {
    const initials = getInitials(item.customer_name);

    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('ConversationDetail', { id: item.enquiry_id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatarRow}>
            <View style={[styles.avatarCircle, { backgroundColor: Theme.colors.primary }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.nameContainer}>
              <Text style={styles.customerName}>{item.customer_name}</Text>
              <View style={styles.dueContainer}>
                <Feather name="clock" size={12} color={Theme.colors.warning} style={{ marginRight: 4 }} />
                <Text style={styles.dueLabel}>Due At: </Text>
                <Text style={styles.dueTime}>{formatDate(item.due_time)}</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.previewLabel}>Message Preview:</Text>
        <Text style={styles.previewText} numberOfLines={3}>
          "{item.message_preview}"
        </Text>

        <View style={styles.footer}>
          <View style={styles.delayContainer}>
            <Text style={styles.delayText}>Scheduled {item.delay_in_minutes}m delay</Text>
          </View>

          <TouchableOpacity 
            style={styles.doneButton}
            onPress={() => handleMarkAsDone(item.id, item.customer_name)}
          >
            <Feather name="check" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.doneButtonText}>Mark as Sent</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Follow-up Tasks" subtitle="Send reminders and execute scheduled updates" />
      
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : (
        <View style={styles.contentWrapper}>
          <FlatList
            data={followups}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Theme.colors.primaryLight} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIconCircle}>
                  <Feather name="check-circle" size={32} color={Theme.colors.success} />
                </View>
                <Text style={styles.emptyTitle}>All caught up!</Text>
                <Text style={styles.emptySubtitle}>No pending follow-ups scheduled.</Text>
              </View>
            }
          />
        </View>
      )}
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  customerName: {
    ...Theme.typography.titleMedium,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dueLabel: {
    ...Theme.typography.caption,
    color: Theme.colors.textSecondary,
  },
  dueTime: {
    ...Theme.typography.caption,
    color: Theme.colors.warning,
    fontWeight: '600',
  },
  previewLabel: {
    ...Theme.typography.caption,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  previewText: {
    ...Theme.typography.bodyLarge,
    fontSize: 14,
    color: Theme.colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: Theme.spacing.lg,
    opacity: 0.9,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.5)',
    paddingTop: Theme.spacing.md,
  },
  delayContainer: {
    backgroundColor: 'rgba(51, 65, 85, 0.4)',
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  delayText: {
    ...Theme.typography.caption,
    fontSize: 11,
    color: Theme.colors.textSecondary,
  },
  doneButton: {
    backgroundColor: Theme.colors.success,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm - 2,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    ...Theme.shadows.sm,
  },
  doneButtonText: {
    ...Theme.typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.xxl * 2,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.lg,
  },
  emptyTitle: {
    ...Theme.typography.titleMedium,
    fontSize: 18,
    color: Theme.colors.success,
    marginBottom: Theme.spacing.xs,
    fontWeight: '700',
  },
  emptySubtitle: {
    ...Theme.typography.bodyMedium,
    color: Theme.colors.textSecondary,
  },
});
