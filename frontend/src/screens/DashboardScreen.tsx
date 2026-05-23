import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, TouchableWithoutFeedback, Platform, RefreshControl, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Theme } from '../theme/theme';
import { Header } from '../components/Header';
import { api } from '../utils/api';
import { safeAlert } from '../utils/alerts';

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
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [followups, setFollowups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const fetchStats = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    const [enqData, folData] = await Promise.all([
      api.getEnquiries(),
      api.getFollowups()
    ]);
    setEnquiries(enqData);
    setFollowups(folData);
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
    
    // Refresh stats when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      fetchStats(false);
    });
    return unsubscribe;
  }, [navigation]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats(false);
    setRefreshing(false);
  };

  // Derive stats dynamically
  const totalLeads = enquiries.length;
  const openEscalations = enquiries.filter(e => e.status === 'escalated').length;
  const followupsDue = followups.filter(f => f.status === 'pending').length;
  const missedEnquiries = enquiries.filter(e => e.status === 'new').length;

  const handleSimulateNewEnquiry = () => {
    const simulationTemplates = [
      { name: "John Wick", channel: "whatsapp", message: "Hi! How much does your team package cost? I want a price quote." },
      { name: "Sarah Connor", channel: "email", message: "I want to schedule and book an appointment for tomorrow slot." },
      { name: "Neo", channel: "call", message: "Can I cancel my slot and request a refund? Customer ID 404." },
      { name: "Tony Stark", channel: "whatsapp", message: "Urgently need emergency help with database credentials. Urgent!" },
      { name: "Bruce Wayne", channel: "call", message: "Do you have parking spots in the downtown branch?" } // Auto-escalated (No SOP matched)
    ];

    const randomTemplate = simulationTemplates[Math.floor(Math.random() * simulationTemplates.length)];

    safeAlert(
      "Simulate Inbound Lead",
      `Simulate inbound ${randomTemplate.channel} enquiry from ${randomTemplate.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: async () => {
            setSimulating(true);
            const result = await api.createEnquiry(randomTemplate.name, randomTemplate.channel, randomTemplate.message);
            setSimulating(false);
            
            if (result && result.enquiry_id) {
              safeAlert(
                "Lead Generated", 
                `New lead queued. Message: "${randomTemplate.message.substring(0, 40)}..."`,
                [{ text: "View Leads", onPress: () => {
                  fetchStats(false);
                  navigation.navigate('Leads');
                }}]
              );
            }
          } 
        }
      ]
    );
  };

  const recentActivities = [
    { id: '1', title: 'Lead Ingested', detail: 'New query scheduled for automatic keyword SOP analysis.', time: 'Just now', type: 'sop_match' },
    { id: '2', title: 'SOP Triage Completed', detail: 'Matching keywords mapped to suggested template response.', time: '10m ago', type: 'sop_match' },
    { id: '3', title: 'Escalation Alert', detail: 'No keywords matched. Triage auto-escalated to manager review.', time: '30m ago', type: 'escalation' },
    { id: '4', title: 'Follow-up Sent', detail: 'Scheduled follow-up reminder dispatched.', time: '1h ago', type: 'followup' },
  ];

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Theme.colors.primaryLight} />
      }
    >
      <Header title="Closira Workspace" subtitle="AI communication assistant for SMBs" />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginTop: 40 }} />
        </View>
      ) : (
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
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleSimulateNewEnquiry} 
              activeOpacity={0.8}
              disabled={simulating}
            >
              {simulating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="plus-circle" size={16} color="#FFFFFF" style={styles.actionIcon} />
                  <Text style={styles.actionButtonText}>Simulate Inbound</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.actionSecondary]} 
              onPress={() => safeAlert("Export Logs", "Exporting system events to CSV...")}
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
      )}
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
