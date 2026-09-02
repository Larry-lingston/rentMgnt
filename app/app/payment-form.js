import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../services/api';
import { COLORS } from '../constants/theme';
import { formatMoney } from '../utils/currency';
import { isRequired, isPositiveAmount } from '../utils/validation';

const METHODS = ['cash', 'bank_transfer', 'check', 'mobile_money'];

export default function PaymentFormScreen() {
  const router = useRouter();
  const [tenants, setTenants] = useState([]);
  const [form, setForm] = useState({ tenantId: '', amount: '', method: 'cash', notes: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getTenants().then(setTenants);
  }, []);

  async function handleSubmit() {
    if (!form.tenantId) {
      Alert.alert('Error', 'Select a tenant');
      return;
    }
    if (!isRequired(form.amount) || !isPositiveAmount(form.amount)) {
      Alert.alert('Error', 'Enter a valid amount greater than 0');
      return;
    }
    setLoading(true);
    try {
      const payment = await api.recordPayment({
        ...form,
        amount: parseFloat(form.amount),
      });
      Alert.alert(
        'Payment Recorded',
        `Receipt: ${payment.receiptNumber}\nAmount: ${formatMoney(payment.amount)}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Select Tenant *</Text>
      {tenants.length === 0 ? (
        <Text style={styles.emptyHint}>No tenants available. Add a tenant first.</Text>
      ) : null}
      {tenants.map((t) => (
        <TouchableOpacity
          key={t.id}
          style={[styles.tenantOption, form.tenantId === t.id && styles.tenantActive]}
          onPress={() => setForm((prev) => ({ ...prev, tenantId: t.id }))}
        >
          <Text style={[styles.tenantName, form.tenantId === t.id && styles.tenantNameActive]}>{t.name}</Text>
          <Text style={styles.tenantDetail}>
            {t.room ? `${t.room.property?.name} - ${t.room.roomNumber}` : 'Unassigned'}
          </Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.label}>Amount (₵)</Text>
      <TextInput
        style={styles.input}
        value={form.amount}
        onChangeText={(v) => setForm((prev) => ({ ...prev, amount: v }))}
        keyboardType="decimal-pad"
        placeholder="0.00"
      />

      <Text style={styles.label}>Payment Method</Text>
      <View style={styles.methodRow}>
        {METHODS.map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.methodChip, form.method === m && styles.methodActive]}
            onPress={() => setForm((prev) => ({ ...prev, method: m }))}
          >
            <Text style={[styles.methodText, form.method === m && styles.methodTextActive]}>
              {m.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput
        style={styles.input}
        value={form.notes}
        onChangeText={(v) => setForm((prev) => ({ ...prev, notes: v }))}
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Recording...' : 'Record Payment'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginTop: 12 },
  tenantOption: {
    backgroundColor: COLORS.card, borderRadius: 10, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  tenantActive: { borderColor: COLORS.primary, backgroundColor: '#ebf4ff' },
  tenantName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  tenantNameActive: { color: COLORS.primary },
  tenantDetail: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 14, fontSize: 16, backgroundColor: COLORS.card },
  methodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  methodChip: {
    backgroundColor: COLORS.card, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  methodActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  methodText: { fontSize: 13, color: COLORS.text, textTransform: 'capitalize' },
  methodTextActive: { color: COLORS.white },
  button: { backgroundColor: COLORS.secondary, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 24, marginBottom: 40 },
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  emptyHint: { fontSize: 13, color: COLORS.textLight, marginBottom: 8 },
});
