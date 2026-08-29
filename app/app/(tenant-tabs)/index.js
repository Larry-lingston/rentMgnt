import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { StatCard, LoadingScreen, SectionHeader, Card } from '../../components/UI';
import { COLORS, RADIUS, SHADOW } from '../../constants/theme';
import { formatMoney } from '../../utils/currency';

export default function TenantHomeScreen() {
  const [data, setData] = useState(null);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadData = async () => {
    try {
      const [dashboard, unreadData] = await Promise.all([
        api.getTenantDashboard(),
        api.getUnreadNotificationCount().catch(() => ({ count: 0 })),
      ]);
      setData(dashboard);
      setUnread(unreadData.count || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  if (loading) return <LoadingScreen />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
    >
      <View style={[styles.welcome, SHADOW.sm]}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={28} color={COLORS.white} />
        </View>
        <View style={styles.welcomeText}>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.name}>{data?.tenant?.name}</Text>
          <Text style={styles.unit}>
            {data?.tenant?.room
              ? `${data.tenant.room.property?.name} · ${data.tenant.room.roomNumber}`
              : 'No unit assigned yet'}
          </Text>
        </View>
      </View>

      {unread > 0 && (
        <TouchableOpacity
          style={[styles.alertBanner, SHADOW.sm]}
          onPress={() => router.push('/(tenant-tabs)/notifications')}
        >
          <Ionicons name="notifications" size={22} color={COLORS.warning} />
          <Text style={styles.alertText}>{unread} rent alert{unread > 1 ? 's' : ''} — tap to view</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
        </TouchableOpacity>
      )}

      {data?.tenant?.room?.property && (
        <TouchableOpacity
          style={[styles.mapButton, SHADOW.sm]}
          onPress={() => router.push({
            pathname: '/map',
            params: { propertyId: data.tenant.room.property.id },
          })}
        >
          <Ionicons name="map" size={20} color={COLORS.white} />
          <Text style={styles.mapButtonText}>View Property on Map</Text>
        </TouchableOpacity>
      )}

      <View style={styles.grid}>
        <StatCard title="Monthly Rent" value={formatMoney(data?.monthlyRent || 0)} iconName="home" color={COLORS.primary} />
        <StatCard title="Paid" value={formatMoney(data?.paidThisMonth || 0)} iconName="checkmark-circle" color={COLORS.secondary} />
        <StatCard title="Outstanding" value={formatMoney(data?.outstanding || 0)} iconName="alert-circle" color={COLORS.danger} />
      </View>

      <SectionHeader title="Recent Payments" iconName="card-outline" />
      {data?.recentPayments?.length === 0 ? (
        <Text style={styles.empty}>No payments yet</Text>
      ) : (
        data?.recentPayments?.map((p) => (
          <Card key={p.id} style={styles.listCard}>
            <Ionicons name="receipt-outline" size={22} color={COLORS.primary} />
            <View style={styles.listBody}>
              <Text style={styles.cardTitle}>{p.receiptNumber}</Text>
              <Text style={styles.cardMeta}>{new Date(p.paymentDate).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.amount}>{formatMoney(p.amount)}</Text>
          </Card>
        ))
      )}

      <SectionHeader title="Maintenance" iconName="construct-outline" />
      {data?.recentMaintenance?.length === 0 ? (
        <Text style={styles.empty}>No requests yet</Text>
      ) : (
        data?.recentMaintenance?.map((r) => (
          <Card key={r.id} style={styles.listCard}>
            <Ionicons name="hammer-outline" size={22} color={COLORS.accent} />
            <View style={styles.listBody}>
              <Text style={styles.cardTitle}>{r.title}</Text>
              <Text style={styles.cardMeta}>{r.status.replace('_', ' ')} · {r.assignedTo?.name || 'Unassigned'}</Text>
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  welcome: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg, padding: 18, marginBottom: 16,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  welcomeText: { flex: 1 },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  name: { fontSize: 20, fontWeight: '700', color: COLORS.white, marginTop: 2 },
  unit: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fffbeb', padding: 14, borderRadius: RADIUS.md, marginBottom: 12,
    borderWidth: 1, borderColor: '#fde68a',
  },
  alertText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#92400e' },
  mapButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.secondary, padding: 14, borderRadius: RADIUS.md, marginBottom: 16,
  },
  mapButtonText: { color: COLORS.white, fontSize: 15, fontWeight: '600', marginLeft: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  empty: { color: COLORS.textLight, marginBottom: 12, paddingLeft: 4 },
  listCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  listBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  cardMeta: { fontSize: 13, color: COLORS.textLight, marginTop: 4, textTransform: 'capitalize' },
  amount: { fontSize: 16, fontWeight: '700', color: COLORS.secondary },
});
