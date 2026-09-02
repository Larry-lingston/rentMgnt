import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput, Alert, Modal,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { EmptyState, LoadingScreen } from '../../components/UI';
import { COLORS } from '../../constants/theme';
import { validateStaffForm, trim } from '../../utils/validation';
import { PasswordInput } from '../../components/PasswordInput';

export default function StaffManagementScreen() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ name: '', username: '', email: '', phone: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setStaff(await api.getStaffMembers());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  async function handleCreate() {
    const error = validateStaffForm(form);
    if (error) {
      Alert.alert('Error', error);
      return;
    }
    setSubmitting(true);
    try {
      await api.createStaffMember({
        name: trim(form.name),
        username: trim(form.username),
        email: trim(form.email),
        phone: trim(form.phone) || undefined,
        password: form.password,
      });
      setModalVisible(false);
      setForm({ name: '', username: '', email: '', phone: '', password: '' });
      loadData();
      Alert.alert('Success', 'Maintenance crew member added');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Ionicons name="person-add" size={22} color={COLORS.white} />
        <Text style={styles.addButtonText}>Add Crew Member</Text>
      </TouchableOpacity>

      <FlatList
        data={staff}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        ListEmptyComponent={<EmptyState message="No maintenance crew yet" icon="👷" />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.detail}>@{item.username} • {item.email}</Text>
            {item.phone && <Text style={styles.detail}>{item.phone}</Text>}
          </View>
        )}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Maintenance Crew</Text>
            {['name', 'username', 'email', 'phone', 'password'].map((field) => (
              <View key={field}>
                <Text style={styles.label}>{field.charAt(0).toUpperCase() + field.slice(1)}</Text>
                {field === 'password' ? (
                  <PasswordInput
                    value={form[field]}
                    onChangeText={(v) => setForm((p) => ({ ...p, [field]: v }))}
                    placeholder="Enter password"
                  />
                ) : (
                  <TextInput
                    style={styles.input}
                    value={form[field]}
                    onChangeText={(v) => setForm((p) => ({ ...p, [field]: v }))}
                    autoCapitalize={field === 'email' || field === 'username' ? 'none' : 'words'}
                  />
                )}
              </View>
            ))}
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={submitting}>
                <Text style={styles.submitText}>{submitting ? 'Adding...' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  addButton: {
    backgroundColor: '#3182ce', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', padding: 14, borderRadius: 10, marginBottom: 16,
  },
  addButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '600', marginLeft: 8 },
  card: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 10 },
  name: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  detail: { fontSize: 13, color: COLORS.textLight, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: COLORS.card, borderRadius: 16, padding: 20, maxHeight: '85%' },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 8, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, backgroundColor: COLORS.background },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 16, alignItems: 'center' },
  cancelText: { color: COLORS.textLight },
  submitBtn: { backgroundColor: '#3182ce', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  submitText: { color: COLORS.white, fontWeight: '600' },
});
