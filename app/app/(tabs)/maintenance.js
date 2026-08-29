import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { StatusBadge, EmptyState, LoadingScreen } from '../../components/UI';
import { COLORS } from '../../constants/theme';

const STATUSES = ['pending', 'cancelled', 'completed'];

export default function MaintenanceScreen() {
  const [requests, setRequests] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadData = async () => {
    try {
      const [requestsData, staffData] = await Promise.all([
        api.getMaintenanceRequests(),
        api.getStaffMembers(),
      ]);
      setRequests(requestsData);
      setStaff(staffData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  function updateStatus(id, currentStatus) {
    const currentIdx = STATUSES.indexOf(currentStatus);
    const nextStatus = STATUSES[(currentIdx + 1) % STATUSES.length];
    Alert.alert('Update Status', `Change to "${nextStatus.replace('_', ' ')}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Update',
        onPress: async () => {
          await api.updateMaintenanceStatus(id, nextStatus);
          loadData();
        },
      },
    ]);
  }

  function assignStaff(request) {
    if (staff.length === 0) {
      Alert.alert('No Staff', 'Add maintenance crew from the Staff screen in More menu.');
      return;
    }
    Alert.alert(
      'Assign to Staff',
      `Assign "${request.title}" to:`,
      [
        ...staff.map((member) => ({
          text: member.name,
          onPress: async () => {
            await api.assignMaintenance(request.id, member.id);
            loadData();
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }

  function handlePress(item) {
    Alert.alert(item.title, 'Choose an action', [
      { text: 'Assign Staff', onPress: () => assignStaff(item) },
      { text: 'Update Status', onPress: () => updateStatus(item.id, item.status) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={() => router.push('/maintenance-form')}>
        <Ionicons name="add" size={22} color={COLORS.white} />
        <Text style={styles.addButtonText}>Submit Request</Text>
      </TouchableOpacity>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        ListEmptyComponent={<EmptyState message="No maintenance requests" icon="🔧" />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => handlePress(item)}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>{item.title}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
            <Text style={styles.meta}>
              {item.property?.name} {item.tenant ? `• ${item.tenant.name}` : ''}
            </Text>
            <Text style={styles.meta}>
              By: {item.requestedBy} • {item.assignmentMode === 'open' ? 'FCFS' : 'Selected'}
              {' • '}Staff: {item.assignedTo?.name || 'Unassigned'}
            </Text>
            <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  addButton: {
    backgroundColor: COLORS.accent, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', padding: 14, borderRadius: 10, marginBottom: 16,
  },
  addButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '600', marginLeft: 8 },
  card: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 8 },
  description: { fontSize: 14, color: COLORS.textLight },
  meta: { fontSize: 13, color: COLORS.textLight, marginTop: 6, textTransform: 'capitalize' },
  date: { fontSize: 12, color: COLORS.textLight, marginTop: 4 },
});
