import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Theme } from '../theme/theme';
import { Header } from '../components/Header';
import mockData from '../mock/mockData.json';

export const FollowUpsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [followups, setFollowups] = useState(mockData.followups);

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handleMarkAsDone = (followupId: string, customer: string) => {
    Alert.alert(
      "Complete Follow-up",
      `Mark this scheduled message for ${customer} as sent?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: () => {
            setFollowups(prev => prev.filter(item => item.id !== followupId));
            Alert.alert("Completed", "Follow-up message dispatched successfully.");
          } 
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: typeof followups[0] }) => (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ConversationDetail', { id: item.enquiry_id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.customerName}>{item.customer_name}</Text>
        <View style={styles.dueContainer}>
          <Text style={styles.dueLabel}>Due At: </Text>
          <Text style={styles.dueTime}>{formatDate(item.due_time)}</Text>
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
          <Text style={styles.doneButtonText}>Mark as Sent</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header title="Follow-up Tasks" subtitle="Send reminders and execute scheduled updates" />
      <FlatList
        data={followups}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySubtitle}>No pending follow-ups scheduled.</Text>
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
    marginBottom: Theme.spacing.md,
  },
  customerName: {
    ...Theme.typography.titleMedium,
    fontSize: 16,
  },
  dueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    borderRadius: 6,
    ...Theme.shadows.sm,
  },
  doneButtonText: {
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
