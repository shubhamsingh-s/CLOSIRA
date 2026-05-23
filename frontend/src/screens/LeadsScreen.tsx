import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, Pressable, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Theme } from '../theme/theme';
import { Header } from '../components/Header';
import { ChannelBadge } from '../components/ChannelBadge';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../utils/api';

export const LeadsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [channel, setChannel] = useState<'whatsapp' | 'email' | 'call'>('whatsapp');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchLeads = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    const data = await api.getEnquiries();
    setEnquiries(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
    
    // Refresh leads when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      fetchLeads(false);
    });
    return unsubscribe;
  }, [navigation]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLeads(false);
    setRefreshing(false);
  };

  const handleCreateLead = async () => {
    if (!customerName.trim() || !message.trim()) {
      Alert.alert("Validation Error", "Please fill in all the fields.");
      return;
    }

    setSubmitting(true);
    const result = await api.createEnquiry(customerName, channel, message);
    setSubmitting(false);

    if (result && result.enquiry_id) {
      Alert.alert(
        "Lead Created", 
        "The enquiry was queued successfully. The background worker is triaging it now.",
        [{ text: "OK", onPress: () => {
          setModalVisible(false);
          setCustomerName('');
          setMessage('');
          setChannel('whatsapp');
          fetchLeads(false);
        }}]
      );
    } else {
      Alert.alert("Error", "Could not create lead. Please check backend server connection.");
    }
  };

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

  const renderItem = ({ item }: { item: any }) => {
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
      
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : (
        <View style={styles.contentWrapper}>
          <FlatList
            data={enquiries}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={Theme.colors.primaryLight}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No enquiries logged today.</Text>
              </View>
            }
          />
        </View>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Create Lead Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable 
          style={styles.modalBackdrop}
          onPress={() => setModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Inbound Lead</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={20} color={Theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Customer Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Sarah Connor"
              placeholderTextColor="#64748B"
              value={customerName}
              onChangeText={setCustomerName}
            />

            <Text style={styles.inputLabel}>Select Channel</Text>
            <View style={styles.channelPicker}>
              {(['whatsapp', 'email', 'call'] as const).map((ch) => (
                <TouchableOpacity
                  key={ch}
                  style={[
                    styles.channelOption,
                    channel === ch && styles.channelOptionActive,
                    channel === ch && ch === 'whatsapp' && { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: Theme.colors.success },
                    channel === ch && ch === 'email' && { backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: Theme.colors.info },
                    channel === ch && ch === 'call' && { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: Theme.colors.warning }
                  ]}
                  onPress={() => setChannel(ch)}
                >
                  <Text style={[
                    styles.channelText,
                    channel === ch && { fontWeight: '700' },
                    channel === ch && ch === 'whatsapp' && { color: Theme.colors.success },
                    channel === ch && ch === 'email' && { color: Theme.colors.info },
                    channel === ch && ch === 'call' && { color: Theme.colors.warning }
                  ]}>
                    {ch.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Inbound Message</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter message text... (keywords like 'pricing', 'booking', 'refund' trigger SOPs)"
              placeholderTextColor="#64748B"
              multiline={true}
              numberOfLines={4}
              value={message}
              onChangeText={setMessage}
            />

            <TouchableOpacity 
              style={styles.submitBtn} 
              onPress={handleCreateLead}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Create Inbound Enquiry</Text>
              )}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
    paddingBottom: Theme.spacing.xxl + 40,
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: Theme.colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.md,
    zIndex: 99,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: Theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: Theme.spacing.xl,
    ...Theme.shadows.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.3)',
    paddingBottom: Theme.spacing.md,
  },
  modalTitle: {
    ...Theme.typography.titleMedium,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  inputLabel: {
    ...Theme.typography.caption,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: Theme.spacing.xs,
  },
  input: {
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 8,
    padding: Theme.spacing.md,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: Theme.spacing.lg,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  channelPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.lg,
  },
  channelOption: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    borderRadius: 8,
    paddingVertical: Theme.spacing.md - 2,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  channelOptionActive: {
    borderWidth: 1.5,
  },
  channelText: {
    ...Theme.typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  submitBtn: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 8,
    paddingVertical: Theme.spacing.md,
    alignItems: 'center',
    ...Theme.shadows.sm,
  },
  submitBtnText: {
    ...Theme.typography.bodyLarge,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
