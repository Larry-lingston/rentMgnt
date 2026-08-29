import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../services/api';
import { COLORS } from '../constants/theme';
import { getParam } from '../utils/params';

export default function TenantFormScreen() {
  const params = useLocalSearchParams();
  const id = getParam(params.id);
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '', leaseStart: '', leaseEnd: '', roomId: '' });
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getProperties().then((properties) => {
      const allRooms = properties.flatMap((p) =>
        p.rooms.map((r) => ({ ...r, propertyName: p.name }))
      );
      setRooms(allRooms);
    });

    if (id) {
      api.getTenant(id).then((t) => {
        setForm({
          name: t.name,
          email: t.email || '',
          phone: t.phone,
          leaseStart: t.leaseStart ? t.leaseStart.split('T')[0] : '',
          leaseEnd: t.leaseEnd ? t.leaseEnd.split('T')[0] : '',
          roomId: t.roomId || '',
        });
      });
    }
  }, [id]);

  const availableRooms = rooms.filter(
    (room) => room.status === 'vacant' || room.id === form.roomId
  );

  async function handleSubmit() {
    if (!form.name || !form.phone) {
      Alert.alert('Error', 'Name and phone are required');
      return;
    }
    setLoading(true);
    try {
      const data = { ...form, roomId: form.roomId || null };
      if (id) {
        await api.updateTenant(id, data);
      } else {
        await api.createTenant(data);
      }
      router.back();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      {['name', 'email', 'phone'].map((field) => (
        <View key={field}>
          <Text style={styles.label}>{field.charAt(0).toUpperCase() + field.slice(1)}</Text>
          <TextInput
            style={styles.input}
            value={form[field]}
            onChangeText={(v) => setForm((prev) => ({ ...prev, [field]: v }))}
            keyboardType={field === 'email' ? 'email-address' : field === 'phone' ? 'phone-pad' : 'default'}
          />
        </View>
      ))}

      <Text style={styles.label}>Assign Room</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roomList}>
        <TouchableOpacity
          style={[styles.roomChip, !form.roomId && styles.roomChipActive]}
          onPress={() => setForm((prev) => ({ ...prev, roomId: '' }))}
        >
          <Text style={styles.roomChipText}>None</Text>
        </TouchableOpacity>
        {availableRooms.map((room) => (
          <TouchableOpacity
            key={room.id}
            style={[styles.roomChip, form.roomId === room.id && styles.roomChipActive]}
            onPress={() => setForm((prev) => ({ ...prev, roomId: room.id }))}
          >
            <Text style={[styles.roomChipText, form.roomId === room.id && styles.roomChipTextActive]}>
              {room.propertyName} - {room.roomNumber}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Saving...' : id ? 'Update Tenant' : 'Add Tenant'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 14, fontSize: 16, backgroundColor: COLORS.card },
  roomList: { marginTop: 8, marginBottom: 8 },
  roomChip: {
    backgroundColor: COLORS.card, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    marginRight: 8, borderWidth: 1, borderColor: COLORS.border,
  },
  roomChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roomChipText: { fontSize: 13, color: COLORS.text },
  roomChipTextActive: { color: COLORS.white },
  button: { backgroundColor: COLORS.primary, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 24, marginBottom: 40 },
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
});
