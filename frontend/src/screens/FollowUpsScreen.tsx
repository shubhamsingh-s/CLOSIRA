import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const renderItem = ({ item }: { item: typeof followups[0] }) => {
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
      <View style={styles.contentWrapper}>
        <FlatList
          data={followups}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
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
