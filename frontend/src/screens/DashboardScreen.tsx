import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated, TouchableWithoutFeedback, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Theme } from '../theme/theme';
import { Header } from '../components/Header';
import mockData from '../mock/mockData.json';

// Reusable spring-animated card wrapper
const AnimatedCard: React.FC<{ children: React.ReactNode; onPress: () => void; style: any }> = ({ children, onPress, style }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 150,
      friction: 12,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 150,
      friction: 12,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

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

      {/* Main Responsive Grid Container */}
      <View style={styles.dashboardContainer}>
        
        {/* Grid of Stats Cards */}
        <View style={styles.statsGrid}>
          
          <AnimatedCard 
            style={[styles.statCard, styles.cardBlue]}
            onPress={() => navigation.navigate('Leads')}
          >
            <LinearGradient
              colors={['rgba(59, 130, 246, 0.15)', 'rgba(30, 41, 59, 0)']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <View style={styles.cardHeader}>
              <Feather name="users" size={18} color={Theme.colors.info} />
              <Text style={styles.statLabel}>Total Leads</Text>
            </View>
            <Text style={styles.statNumber}>{totalLeads}</Text>
          </AnimatedCard>

          <AnimatedCard 
            style={[styles.statCard, styles.cardRed]}
            onPress={() => navigation.navigate('Escalations')}
          >
            <LinearGradient
              colors={['rgba(239, 68, 68, 0.15)', 'rgba(30, 41, 59, 0)']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <View style={styles.cardHeader}>
              <Feather name="alert-triangle" size={18} color={Theme.colors.danger} />
              <Text style={styles.statLabel}>Open Escalations</Text>
            </View>
            <Text style={styles.statNumber}>{openEscalations}</Text>
            {openEscalations > 0 && <View style={styles.redDotBadge} />}
          </AnimatedCard>

          <AnimatedCard 
            style={[styles.statCard, styles.cardAmber]}
            onPress={() => navigation.navigate('Follow-ups')}
          >
            <LinearGradient
              colors={['rgba(245, 158, 11, 0.15)', 'rgba(30, 41, 59, 0)']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <View style={styles.cardHeader}>
              <Feather name="clock" size={18} color={Theme.colors.warning} />
              <Text style={styles.statLabel}>Follow-ups Due</Text>
            </View>
            <Text style={styles.statNumber}>{followupsDue}</Text>
          </AnimatedCard>

          <AnimatedCard 
            style={[styles.statCard, styles.cardGreen]}
            onPress={() => navigation.navigate('Leads')}
          >
            <LinearGradient
              colors={['rgba(16, 185, 129, 0.15)', 'rgba(30, 41, 59, 0)']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <View style={styles.cardHeader}>
              <Feather name="message-square" size={18} color={Theme.colors.success} />
              <Text style={styles.statLabel}>Unprocessed</Text>
            </View>
            <Text style={styles.statNumber}>{missedEnquiries}</Text>
          </AnimatedCard>
          
        </View>

        {/* Quick Action Buttons */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleSimulateNewEnquiry} activeOpacity={0.8}>
            <Feather name="plus-circle" size={16} color="#FFFFFF" style={styles.actionIcon} />
            <Text style={styles.actionButtonText}>Simulate Inbound</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.actionSecondary]} 
            onPress={() => Alert.alert("Export Logs", "Exporting system events to CSV...")}
            activeOpacity={0.8}
          >
            <Feather name="download" size={16} color={Theme.colors.textPrimary} style={styles.actionIcon} />
            <Text style={[styles.actionButtonText, styles.actionSecondaryText]}>Export Event Logs</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity Log */}
        <Text style={styles.sectionTitle}>Recent Activities</Text>
        <View style={styles.activityFeed}>
          {recentActivities.map((activity) => (
            <View key={activity.id} style={[
              styles.activityItemCard,
              activity.type === 'escalation' ? styles.borderRed : 
              activity.type === 'followup' ? styles.borderAmber : styles.borderGreen
            ]}>
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
  dashboardContainer: {
    width: '100%',
    maxWidth: 1400,
    alignSelf: 'center',
    paddingHorizontal: Theme.spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: Theme.spacing.lg,
  },
  statCard: {
    width: '48%',
    backgroundColor: Theme.colors.card,
    borderRadius: 14,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.4)',
    position: 'relative',
    overflow: 'hidden',
  },
  cardBlue: {
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.info,
  },
  cardRed: {
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.danger,
  },
  cardAmber: {
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.warning,
  },
  cardGreen: {
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.success,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  statNumber: {
    ...Theme.typography.titleLarge,
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    ...Theme.typography.bodyMedium,
    marginLeft: Theme.spacing.sm,
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    opacity: 0.8,
  },
  redDotBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.danger,
  },
  sectionTitle: {
    ...Theme.typography.titleMedium,
    fontSize: 18,
    fontWeight: '700',
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    color: Theme.colors.textPrimary,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.lg,
    maxWidth: 500,
    width: '100%',
    alignSelf: Platform.OS === 'web' ? 'flex-start' : 'center',
  },
  actionButton: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.md,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.sm,
    ...Theme.shadows.sm,
  },
  actionSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    marginRight: 0,
    marginLeft: Theme.spacing.sm,
  },
  actionIcon: {
    marginRight: Theme.spacing.sm,
  },
  actionButtonText: {
    ...Theme.typography.bodyLarge,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionSecondaryText: {
    color: Theme.colors.textPrimary,
  },
  activityFeed: {
    width: '100%',
  },
  activityItemCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: 12,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.4)',
    ...Theme.shadows.sm,
  },
  borderRed: {
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.danger,
  },
  borderAmber: {
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.warning,
  },
  borderGreen: {
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.success,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  activityTitle: {
    ...Theme.typography.bodyLarge,
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  activityTime: {
    ...Theme.typography.caption,
    fontSize: 11,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  activityDetail: {
    ...Theme.typography.bodyMedium,
    fontSize: 13,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
  },
});
