import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Theme } from '../theme/theme';
import { Header } from '../components/Header';
import mockData from '../mock/mockData.json';

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const enquiries = mockData.enquiries;
  const escalations = mockData.escalations;
  const followups = mockData.followups;

  // Derive stats
  const totalLeads = enquiries.length;
  const openEscalations = escalations.length;
  const followupsDue = followups.filter(f => f.status === 'pending').length;
  const missedEnquiries = enquiries.filter(e => e.status === 'new').length;

  const handleSimulateNewEnquiry = () => {
    Alert.alert(
      "Simulate Enquiry",
      "Would you like to simulate a new Whatsapp enquiry matching the Booking SOP?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: () => {
            Alert.alert("Success", "New Whatsapp Enquiry 'enq_008' created and SOP matched!");
          } 
        }
      ]
    );
  };

  const recentActivities = [
    { id: '1', title: 'New Whatsapp Lead', detail: 'John Doe requested premium tier pricing.', time: '5m ago', type: 'sop_match' },
    { id: '2', title: 'Escalation Triggered', detail: 'Sarah M. escalated due to billing difference.', time: '20m ago', type: 'escalation' },
    { id: '3', title: 'Follow-up Scheduled', detail: 'Follow-up created for Alice Cooper.', time: '1h ago', type: 'followup' },
    { id: '4', title: 'Call Enquiry Auto-Escalated', detail: 'Liam Neeson message had no matching SOP.', time: '2h ago', type: 'escalation' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Header title="Closira Workspace" subtitle="AI communication assistant for SMBs" />

      {/* Grid of Stats Cards */}
      <View style={styles.statsGrid}>
        <TouchableOpacity 
          style={[styles.statCard, styles.cardBlue]}
          onPress={() => navigation.navigate('Leads')}
          activeOpacity={0.8}
        >
          <Text style={styles.statNumber}>{totalLeads}</Text>
          <Text style={styles.statLabel}>Total Leads</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.statCard, styles.cardRed]}
          onPress={() => navigation.navigate('Escalations')}
          activeOpacity={0.8}
        >
          <Text style={styles.statNumber}>{openEscalations}</Text>
          <Text style={styles.statLabel}>Open Escalations</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.statCard, styles.cardAmber]}
          onPress={() => navigation.navigate('Follow-ups')}
          activeOpacity={0.8}
        >
          <Text style={styles.statNumber}>{followupsDue}</Text>
          <Text style={styles.statLabel}>Follow-ups Due</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.statCard, styles.cardGreen]}
          onPress={() => navigation.navigate('Leads')}
          activeOpacity={0.8}
        >
          <Text style={styles.statNumber}>{missedEnquiries}</Text>
          <Text style={styles.statLabel}>New/Unprocessed</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Action Buttons */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleSimulateNewEnquiry}>
          <Text style={styles.actionButtonText}>Simulate Inbound Enquiry</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.actionSecondary]} 
          onPress={() => Alert.alert("Export Logs", "Exporting system events to CSV...")}
        >
          <Text style={[styles.actionButtonText, styles.actionSecondaryText]}>Export Event Logs</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Activity Log */}
      <Text style={styles.sectionTitle}>Recent Activities</Text>
      <View style={styles.activityFeed}>
        {recentActivities.map((activity) => (
          <View key={activity.id} style={styles.activityItem}>
            <View style={[
              styles.activityDot, 
              activity.type === 'escalation' ? styles.dotRed : 
              activity.type === 'followup' ? styles.dotAmber : styles.dotGreen
            ]} />
            <View style={styles.activityContent}>
              <View style={styles.activityHeader}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
              <Text style={styles.activityDetail}>{activity.detail}</Text>
            </View>
          </View>
        ))}
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: Theme.spacing.lg,
  },
  statCard: {
    width: '48%',
    backgroundColor: Theme.colors.card,
    borderRadius: 12,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  cardBlue: {
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.info,
  },
  cardRed: {
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.danger,
  },
  cardAmber: {
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.warning,
  },
  cardGreen: {
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.success,
  },
  statNumber: {
    ...Theme.typography.titleLarge,
    fontSize: 28,
  },
  statLabel: {
    ...Theme.typography.bodyMedium,
    marginTop: Theme.spacing.xs - 2,
  },
  sectionTitle: {
    ...Theme.typography.titleMedium,
    paddingHorizontal: Theme.spacing.lg,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
    padding: Theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: Theme.spacing.sm,
    ...Theme.shadows.sm,
  },
  actionSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginRight: 0,
    marginLeft: Theme.spacing.sm,
  },
  actionButtonText: {
    ...Theme.typography.bodyLarge,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionSecondaryText: {
    color: Theme.colors.textPrimary,
  },
  activityFeed: {
    backgroundColor: Theme.colors.card,
    marginHorizontal: Theme.spacing.lg,
    borderRadius: 12,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: Theme.spacing.md,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
    marginRight: Theme.spacing.md,
  },
  dotRed: {
    backgroundColor: Theme.colors.danger,
  },
  dotAmber: {
    backgroundColor: Theme.colors.warning,
  },
  dotGreen: {
    backgroundColor: Theme.colors.success,
  },
  activityContent: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.5)',
    paddingBottom: Theme.spacing.sm,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activityTitle: {
    ...Theme.typography.bodyLarge,
    fontSize: 14,
    fontWeight: '600',
  },
  activityTime: {
    ...Theme.typography.caption,
  },
  activityDetail: {
    ...Theme.typography.bodyMedium,
    fontSize: 13,
    marginTop: Theme.spacing.xs - 2,
  },
});
