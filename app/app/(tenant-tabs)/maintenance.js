import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput, Alert, Modal, ScrollView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { StatusBadge, EmptyState, LoadingScreen } from '../../components/UI';
import { COLORS } from '../../constants/theme';

export default function TenantMaintenanceScreen() {
  const [requests, setRequests] = useState([]);
  const [crew, setCrew] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium', assignmentMode: 'open', assignedToId: '',
  });
  const [crewSearch, setCrewSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setRequests(await api.getTenantMaintenance());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  async function searchCrew(query) {
    setCrewSearch(query);
    try {
      setCrew(await api.searchCrew(query));
    } catch {
      setCrew([]);
    }
  }

  async function openModal() {
    setModalVisible(true);
    searchCrew('');
  }

  async function handleSubmit() {
    if (!form.title || !form.description) {
      Alert.alert('Error', 'Title and description are required');
      return;
    }
    if (form.assignmentMode === 'selected' && !form.assignedToId) {
      Alert.alert('Error', 'Please select a maintenance crew member');
      return;
    }
    setSubmitting(true);
    try {
      await api.submitTenantMaintenance(form);
      setModalVisible(false);
      setForm({ title: '', description: '', priority: 'medium', assignmentMode: 'open', assignedToId: '' });
      loadData();
      Alert.alert('Submitted', form.assignmentMode === 'open'
        ? 'Request posted — first available crew will claim it.'
        : 'Request sent to your selected crew member.');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={openModal}>
        <Ionicons name="add" size={22} color={COLORS.white} />
        <Text style={styles.addButtonText}>Submit Request</Text>
      </TouchableOpacity>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        ListEmptyComponent={<EmptyState message="No maintenance requests" icon="🔧" />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>{item.title}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.meta}>
              {item.assignmentMode === 'open' ? 'FCFS pool' : 'Selected crew'}
              {' • '}{item.assignedTo?.name || 'Awaiting crew'}
            </Text>
          </View>
        )}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Submit Maintenance Request</Text>

              <Text style={styles.label}>Title</Text>
              <TextInput style={styles.input} value={form.title} onChangeText={(v) => setForm((p) => ({ ...p, title: v }))} />

              <Text style={styles.label}>Description</Text>
              <TextInput style={[styles.input, { height: 80 }]} value={form.description} onChangeText={(v) => setForm((p) => ({ ...p, description: v }))} multiline />

              <Text style={styles.label}>How should crew be assigned?</Text>
              <View style={styles.modeRow}>
                <TouchableOpacity
                  style={[styles.modeChip, form.assignmentMode === 'open' && styles.modeActive]}
                  onPress={() => setForm((p) => ({ ...p, assignmentMode: 'open', assignedToId: '' }))}
                >
                  <Text style={styles.modeText}>First Available (FCFS)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeChip, form.assignmentMode === 'selected' && styles.modeActive]}
                  onPress={() => setForm((p) => ({ ...p, assignmentMode: 'selected' }))}
                >
                  <Text style={styles.modeText}>Choose Crew</Text>
                </TouchableOpacity>
              </View>

              {form.assignmentMode === 'selected' && (
                <>
                  <Text style={styles.label}>Search crew</Text>
                  <TextInput
                    style={styles.input}
                    value={crewSearch}
                    onChangeText={searchCrew}
                    placeholder="Search by name..."
                  />
                  {crew.map((member) => (
                    <TouchableOpacity
                      key={member.id}
                      style={[styles.crewOption, form.assignedToId === member.id && styles.crewActive]}
                      onPress={() => setForm((p) => ({ ...p, assignedToId: member.id }))}
                    >
                      <Text style={styles.crewName}>{member.name}</Text>
                      <Text style={styles.crewDetail}>{member.phone || member.email}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
                  <Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Submit'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
  meta: { fontSize: 13, color: COLORS.textLight, marginTop: 8, textTransform: 'capitalize' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalScroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: COLORS.card, borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 10, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, backgroundColor: COLORS.background },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeChip: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  modeActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  modeText: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  crewOption: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, marginTop: 8 },
  crewActive: { borderColor: COLORS.secondary, backgroundColor: '#e6ffed' },
  crewName: { fontWeight: '600' },
  crewDetail: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, gap: 16, alignItems: 'center' },
  cancelText: { color: COLORS.textLight },
  submitBtn: { backgroundColor: COLORS.secondary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  submitText: { color: COLORS.white, fontWeight: '600' },
});
