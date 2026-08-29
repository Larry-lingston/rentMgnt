import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { api } from '../services/api';
import { LoadingScreen } from '../components/UI';
import { COLORS } from '../constants/theme';
import { getParam } from '../utils/params';
import { formatMoney } from '../utils/currency';

export default function TenantDetailScreen() {
  const params = useLocalSearchParams();
  const id = getParam(params.id);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTenant(id).then(setTenant).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingScreen />;
  if (!tenant) return <Text style={styles.error}>Tenant not found</Text>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{tenant.name.charAt(0)}</Text>
        </View>
        <Text style={styles.name}>{tenant.name}</Text>
        <Text style={styles.detail}>{tenant.phone}</Text>
        {tenant.email && <Text style={styles.detail}>{tenant.email}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Assignment</Text>
        <Text style={styles.info}>
          {tenant.room
            ? `${tenant.room.property?.name} - ${tenant.room.roomNumber}`
            : 'No room assigned'}
        </Text>
        {tenant.room && <Text style={styles.info}>Rent: {formatMoney(tenant.room.rentAmount)}/month</Text>}
      </View>

      {tenant.leaseStart && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lease</Text>
          <Text style={styles.info}>
            {new Date(tenant.leaseStart).toLocaleDateString()} - {tenant.leaseEnd ? new Date(tenant.leaseEnd).toLocaleDateString() : 'Ongoing'}
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment History ({tenant.payments?.length || 0})</Text>
        {tenant.payments?.length === 0 ? (
          <Text style={styles.empty}>No payments yet</Text>
        ) : (
          tenant.payments?.map((p) => (
            <View key={p.id} style={styles.paymentRow}>
              <View>
                <Text style={styles.receipt}>{p.receiptNumber}</Text>
                <Text style={styles.date}>{new Date(p.paymentDate).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.amount}>{formatMoney(p.amount)}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  error: { textAlign: 'center', marginTop: 40, color: COLORS.danger },
  header: { backgroundColor: COLORS.primary, padding: 24, alignItems: 'center' },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: COLORS.white, fontSize: 28, fontWeight: '700' },
  name: { color: COLORS.white, fontSize: 24, fontWeight: '700', marginTop: 12 },
  detail: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },
  section: { backgroundColor: COLORS.card, margin: 16, marginBottom: 0, borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  info: { fontSize: 14, color: COLORS.textLight, marginBottom: 4 },
  empty: { color: COLORS.textLight, fontStyle: 'italic' },
  paymentRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  receipt: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  date: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '700', color: COLORS.secondary },
});
