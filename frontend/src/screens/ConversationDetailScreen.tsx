import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Theme } from '../theme/theme';
import { ChannelBadge } from '../components/ChannelBadge';
import { StatusBadge } from '../components/StatusBadge';
import mockData from '../mock/mockData.json';

export const ConversationDetailScreen: React.FC<{ route: any, navigation: any }> = ({ route, navigation }) => {
  const { id } = route.params;

  // Retrieve mock database history
  const histories = mockData.histories as Record<string, typeof mockData.histories['enq_001']>;
  const data = histories[id];

  if (!data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Conversation not found.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { enquiry, sop_matches, followups, events } = data;

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handleCopySuggested = (response: string) => {
    Alert.alert("Response Copied", "Suggested SOP response has been copied to your clipboard.");
  };

  // Build synthetic AI summary based on status and channel
  const getAISummary = () => {
    if (enquiry.status === 'escalated') {
      return `Customer is expressing dissatisfaction or reporting a blocker that requires manual agent intervention. Status has been escalated.`;
    }
    if (sop_matches.length > 0) {
      return `Customer message matches '${sop_matches[0].sop_label}' keywords. A suggested response has been formulated automatically.`;
    }
    return `New incoming message from ${enquiry.customer_name} via ${enquiry.channel}. Initial keyword matching is underway.`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.detailContainer}>
        
        {/* Header Info */}
        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <Text style={styles.customerName}>{enquiry.customer_name}</Text>
            <StatusBadge status={enquiry.status} />
          </View>
          <View style={[styles.metaRow, { marginTop: Theme.spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(51,65,85,0.3)', paddingTop: Theme.spacing.sm }]}>
            <ChannelBadge channel={enquiry.channel} />
            <Text style={styles.timeLabel}>Received: {formatDate(enquiry.created_at)}</Text>
          </View>
        </View>

        {/* Message Thread Box */}
        <Text style={styles.sectionTitle}>Inbound Message</Text>
        <View style={styles.chatBubbleContainer}>
          <View style={styles.customerBubble}>
            <Text style={styles.bubbleText}>{enquiry.message}</Text>
          </View>
        </View>

        {/* AI Summary Card */}
        <Text style={styles.sectionTitle}>AI Synthesized Summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.aiBadge}>
            <Feather name="cpu" size={12} color={Theme.colors.info} style={{ marginRight: 4 }} />
            <Text style={styles.aiBadgeText}>AI INSIGHT</Text>
          </View>
          <Text style={styles.summaryText}>{getAISummary()}</Text>
        </View>

        {/* SOP Matching Outcomes */}
        <Text style={styles.sectionTitle}>SOP Match Result</Text>
        {sop_matches.length > 0 ? (
          <View style={styles.sopCard}>
            <View style={styles.sopHeader}>
              <View style={styles.sopBadgeRow}>
                <Feather name="check-circle" size={14} color={Theme.colors.success} style={{ marginRight: 6 }} />
                <Text style={styles.sopLabelBadge}>{sop_matches[0].sop_label}</Text>
              </View>
              <Text style={styles.sopKeywordText}>
                Matched: {sop_matches[0].matched_keywords?.join(', ')}
              </Text>
            </View>
            <Text style={styles.sopResponseTitle}>Suggested Response Template:</Text>
            <Text style={styles.sopResponseText}>"{sop_matches[0].suggested_response}"</Text>
            
            <TouchableOpacity 
              style={styles.copyButton} 
              onPress={() => handleCopySuggested(sop_matches[0].suggested_response)}
              activeOpacity={0.8}
            >
              <Feather name="copy" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.copyButtonText}>Copy Template</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.sopCard, styles.sopEmpty]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Feather name="alert-triangle" size={16} color={Theme.colors.danger} style={{ marginRight: 6 }} />
              <Text style={styles.sopEmptyText}>No matching SOP keywords found.</Text>
            </View>
            <Text style={styles.sopEmptySub}>This enquiry was auto-escalated to the human support queue.</Text>
          </View>
        )}

        {/* Chronological Status Timeline */}
        <Text style={styles.sectionTitle}>Event Audit Timeline</Text>
        <View style={styles.timelineCard}>
          {events.map((evt, idx) => {
            let eventTitle = evt.event_type.replace('_', ' ');
            let details = '';
            let iconName = 'circle';
            let iconColor = Theme.colors.border;
            
            if (evt.event_type === 'enquiry_created') {
              details = `Enquiry ingested from channel: ${evt.payload?.channel || 'unknown'}`;
              iconName = 'message-square';
              iconColor = Theme.colors.info;
            } else if (evt.event_type === 'sop_matched') {
              details = `SOP '${evt.payload?.sop_label}' matched successfully.`;
              iconName = 'check-circle';
              iconColor = Theme.colors.success;
            } else if (evt.event_type === 'escalation_triggered') {
              details = `Escalated: ${evt.payload?.reason || 'No reason supplied'}`;
              iconName = 'alert-triangle';
              iconColor = Theme.colors.danger;
            } else if (evt.event_type === 'followup_created') {
              details = `Follow-up set to delay: ${evt.payload?.delay_in_minutes}m`;
              iconName = 'clock';
              iconColor = Theme.colors.warning;
            } else if (evt.event_type === 'task_processed') {
              details = `Background processing worker completed.`;
              iconName = 'cpu';
              iconColor = Theme.colors.primaryLight;
            }

            return (
              <View key={evt.id} style={styles.timelineItem}>
                <View style={styles.timelineIndicator}>
                  <View style={[styles.timelineDotCircle, { borderColor: iconColor }]}>
                    <Feather name={iconName as any} size={10} color={iconColor} />
                  </View>
                  {idx < events.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Text style={styles.timelineTitle}>{eventTitle}</Text>
                    <Text style={styles.timelineTime}>{new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                  {details ? <Text style={styles.timelineDetail}>{details}</Text> : null}
                </View>
              </View>
            );
          })}
        </View>

      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    paddingBottom: Theme.spacing.xxl,
  },
  detailContainer: {
    width: '100%',
    maxWidth: 1400,
    alignSelf: 'center',
    padding: Theme.spacing.lg,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  errorText: {
    ...Theme.typography.bodyLarge,
    color: Theme.colors.danger,
    marginBottom: Theme.spacing.md,
  },
  backBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  metaCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: 12,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.4)',
    ...Theme.shadows.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerName: {
    ...Theme.typography.titleLarge,
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timeLabel: {
    ...Theme.typography.caption,
  },
  sectionTitle: {
    ...Theme.typography.titleMedium,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.sm,
    fontWeight: '700',
  },
  chatBubbleContainer: {
    marginBottom: Theme.spacing.md,
  },
  customerBubble: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)', 
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderRadius: 14,
    borderTopLeftRadius: 2,
    padding: Theme.spacing.lg,
    maxWidth: '90%',
  },
  bubbleText: {
    ...Theme.typography.bodyLarge,
    fontSize: 15,
    lineHeight: 22,
    color: '#F8FAFC',
  },
  summaryCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: 10,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.4)',
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.info,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  aiBadgeText: {
    ...Theme.typography.caption,
    fontSize: 9,
    fontWeight: '800',
    color: Theme.colors.info,
    letterSpacing: 0.5,
  },
  summaryText: {
    ...Theme.typography.bodyMedium,
    color: Theme.colors.textPrimary,
    lineHeight: 20,
  },
  sopCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: 12,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.4)',
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.success,
  },
  sopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
    flexWrap: 'wrap',
  },
  sopBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sopLabelBadge: {
    color: Theme.colors.success,
    fontWeight: '700',
    fontSize: 13,
  },
  sopKeywordText: {
    ...Theme.typography.caption,
    fontStyle: 'italic',
  },
  sopResponseTitle: {
    ...Theme.typography.caption,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  sopResponseText: {
    ...Theme.typography.bodyLarge,
    fontSize: 14,
    color: Theme.colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    padding: Theme.spacing.md,
    borderRadius: 8,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.2)',
  },
  copyButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.md,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.sm,
  },
  copyButtonText: {
    ...Theme.typography.bodyLarge,
    fontWeight: '700',
    color: '#FFFFFF',
    fontSize: 14,
  },
  sopEmpty: {
    borderLeftColor: Theme.colors.danger,
    padding: Theme.spacing.lg,
  },
  sopEmptyText: {
    ...Theme.typography.bodyLarge,
    fontWeight: '700',
    color: Theme.colors.danger,
  },
  sopEmptySub: {
    ...Theme.typography.bodyMedium,
    marginTop: 4,
    color: Theme.colors.textSecondary,
  },
  timelineCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: 12,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.4)',
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 65,
  },
  timelineIndicator: {
    alignItems: 'center',
    marginRight: Theme.spacing.md,
  },
  timelineDotCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.card,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: Theme.spacing.md,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timelineTitle: {
    ...Theme.typography.bodyLarge,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  timelineTime: {
    ...Theme.typography.caption,
    fontSize: 11,
  },
  timelineDetail: {
    ...Theme.typography.bodyMedium,
    fontSize: 13,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
  },
});
