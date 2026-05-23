import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Theme } from '../theme/theme';
import { Header } from '../components/Header';
import { ChannelBadge } from '../components/ChannelBadge';
import { api } from '../utils/api';

export const EscalationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [escalations, setEscalations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const fetchEscalations = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    const data = await api.getEnquiries();
    // Filter escalated cases from live database
    const escalatedList = data.filter((e: any) => e.status === 'escalated');
    
    // Map data to expected escalation structure, adding reasons
    const resolvedEscalations = escalatedList.map((item: any) => {
      // Simulate reasons based on matched details or generic auto-escalate
      return {
        id: `esc_${item.id}`,
        enquiry_id: item.id,
        customer_name: item.customer_name,
        channel: item.channel,
        reason: item.message.toLowerCase().includes('charge') || item.message.toLowerCase().includes('billing')
          ? "Billing discrepancy: Charged incorrect rate."
          : item.message.toLowerCase().includes('login') || item.message.toLowerCase().includes('credential')
          ? "Urgent login blocker: Customer dashboard error 500."
          : "Auto-escalated: No matching SOP rules found.",
        urgency: item.message.toLowerCase().includes('urgent') || item.message.toLowerCase().includes('charge') ? "high" : "medium",
        created_at: item.updated_at || item.created_at
      };
    });

    setEscalations(resolvedEscalations);
    setLoading(false);
  };

  useEffect(() => {
    fetchEscalations();
    
    const unsubscribe = navigation.addListener('focus', () => {
      fetchEscalations(false);
    });
    return unsubscribe;
  }, [navigation]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEscalations(false);
    setRefreshing(false);
  };

  const handleResolve = async (enquiryId: string, customer: string) => {
    Alert.alert(
      "Resolve Escalation",
      `Are you sure you want to resolve this escalation for ${customer}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: async () => {
            const result = await api.resolveEscalation(enquiryId);
            if (result && result.status) {
              Alert.alert("Success", "Escalation resolved and customer notified.");
              fetchEscalations(false);
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

  const renderItem = ({ item }: { item: any }) => {
    const initials = getInitials(item.customer_name);
    const hasSLABreach = item.urgency === 'high';

    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('ConversationDetail', { id: item.enquiry_id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatarRow}>
            <View style={[styles.avatarCircle, { backgroundColor: item.urgency === 'high' ? Theme.colors.danger : Theme.colors.warning }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.nameContainer}>
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
                    {item.urgency}
                  </Text>
                </View>
              </View>
              <Text style={styles.timeText}>{formatDate(item.created_at)}</Text>
            </View>
          </View>
        </View>

        {hasSLABreach && (
          <View style={styles.slaWarning}>
            <Feather name="alert-triangle" size={14} color={Theme.colors.danger} />
            <Text style={styles.slaWarningText}>SLA Breach warning: Response overdue by 15m</Text>
          </View>
        )}

        <Text style={styles.reasonLabel}>Escalation Reason:</Text>
        <Text style={styles.reasonText}>{item.reason}</Text>

        <View style={styles.footer}>
          <ChannelBadge channel={item.channel} />
          
          <TouchableOpacity 
            style={styles.resolveButton}
            onPress={() => handleResolve(item.enquiry_id, item.customer_name)}
          >
            <Feather name="check" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.resolveButtonText}>Resolve Case</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Human Escalations" subtitle="Address requests flagged for manual intervention" />
      
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : (
        <View style={styles.contentWrapper}>
          <FlatList
            data={escalations}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Theme.colors.primaryLight} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIconCircle}>
                  <Feather name="check" size={32} color={Theme.colors.success} />
                </View>
                <Text style={styles.emptyTitle}>Inbox Clear!</Text>
                <Text style={styles.emptySubtitle}>No open human escalations pending review.</Text>
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerName: {
    ...Theme.typography.titleMedium,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: Theme.spacing.sm,
  },
  urgencyBadge: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeHigh: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  badgeMedium: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  urgencyText: {
    ...Theme.typography.caption,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  slaWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: Theme.spacing.md,
  },
  slaWarningText: {
    ...Theme.typography.caption,
    color: Theme.colors.danger,
    marginLeft: 6,
    fontWeight: '600',
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
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    ...Theme.shadows.sm,
  },
  resolveButtonText: {
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
