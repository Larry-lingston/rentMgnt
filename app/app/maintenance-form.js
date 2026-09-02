import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../services/api';
import { COLORS } from '../constants/theme';
import { isRequired, trim } from '../utils/validation';

const PRIORITIES = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
];

export default function MaintenanceFormScreen() {
  const router = useRouter();
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [crew, setCrew] = useState([]);
  const [crewSearch, setCrewSearch] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', propertyId: '', tenantId: '',
    priority: 'medium', assignmentMode: 'open', assignedToId: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getProperties().then(setProperties);
    api.getTenants().then(setTenants);
    api.getStaffMembers().then(setCrew);
  }, []);

  async function searchCrew(query) {
    setCrewSearch(query);
    setCrew(await api.getStaffMembers(query));
  }

  async function handleSubmit() {
    if (!isRequired(form.title) || !isRequired(form.description) || !form.propertyId) {
      Alert.alert('Error', 'Title, description, and property are required');
      return;
    }
    if (form.assignmentMode === 'selected' && !form.assignedToId) {
      Alert.alert('Error', 'Select a crew member');
      return;
    }
    setLoading(true);
    try {
      await api.createMaintenanceRequest({
        title: trim(form.title),
        description: trim(form.description),
        propertyId: form.propertyId,
        tenantId: form.tenantId || null,
        priority: form.priority,
        assignmentMode: form.assignmentMode,
        assignedToId: form.assignmentMode === 'selected' ? form.assignedToId : null,
      });
      router.back();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={form.title} onChangeText={(v) => setForm((p) => ({ ...p, title: v }))} />

      <Text style={styles.label}>Description</Text>
      <TextInput style={[styles.input, { height: 100 }]} value={form.description} onChangeText={(v) => setForm((p) => ({ ...p, description: v }))} multiline />

      <Text style={styles.label}>Property</Text>
      {properties.map((p) => (
        <TouchableOpacity key={p.id} style={[styles.option, form.propertyId === p.id && styles.optionActive]} onPress={() => setForm((prev) => ({ ...prev, propertyId: p.id }))}>
          <Text style={styles.optionText}>{p.name}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.label}>Tenant (optional)</Text>
      <TouchableOpacity
        style={[styles.option, !form.tenantId && styles.optionActive]}
        onPress={() => setForm((prev) => ({ ...prev, tenantId: '' }))}
      >
        <Text style={styles.optionText}>None</Text>
      </TouchableOpacity>
      {tenants.map((t) => (
        <TouchableOpacity key={t.id} style={[styles.option, form.tenantId === t.id && styles.optionActive]} onPress={() => setForm((prev) => ({ ...prev, tenantId: t.id }))}>
          <Text style={styles.optionText}>{t.name}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.label}>Priority</Text>
      <View style={styles.modeRow}>
        {PRIORITIES.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[styles.modeChip, form.priority === p.id && styles.modeActive]}
            onPress={() => setForm((prev) => ({ ...prev, priority: p.id }))}
          >
            <Text style={styles.modeText}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Crew assignment</Text>
      <View style={styles.modeRow}>
        <TouchableOpacity style={[styles.modeChip, form.assignmentMode === 'open' && styles.modeActive]} onPress={() => setForm((p) => ({ ...p, assignmentMode: 'open', assignedToId: '' }))}>
          <Text style={styles.modeText}>FCFS (Open pool)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.modeChip, form.assignmentMode === 'selected' && styles.modeActive]} onPress={() => setForm((p) => ({ ...p, assignmentMode: 'selected' }))}>
          <Text style={styles.modeText}>Choose crew</Text>
        </TouchableOpacity>
      </View>

      {form.assignmentMode === 'selected' && (
        <>
          <TextInput style={styles.input} value={crewSearch} onChangeText={searchCrew} placeholder="Search crew..." />
          {crew.map((m) => (
            <TouchableOpacity key={m.id} style={[styles.option, form.assignedToId === m.id && styles.optionActive]} onPress={() => setForm((p) => ({ ...p, assignedToId: m.id }))}>
              <Text style={styles.optionText}>{m.name}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Submitting...' : 'Submit Request'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginTop: 12 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 14, fontSize: 16, backgroundColor: COLORS.card },
  option: { backgroundColor: COLORS.card, borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  optionActive: { borderColor: COLORS.primary, backgroundColor: '#ebf4ff' },
  optionText: { fontSize: 15, color: COLORS.text },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeChip: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  modeActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  modeText: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  button: { backgroundColor: COLORS.accent, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 24, marginBottom: 40 },
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
});
