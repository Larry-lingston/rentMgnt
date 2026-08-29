import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { StatCard, LoadingScreen, SectionHeader, Card } from '../../components/UI';
import { COLORS, SHADOW } from '../../constants/theme';
import { formatMoney } from '../../utils/currency';

export default function DashboardScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const dashboard = await api.getDashboard();
      setData(dashboard);
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
      <View style={styles.grid}>
        <StatCard title="Properties" value={data?.totalProperties || 0} iconName="business" color={COLORS.primary} />
        <StatCard title="Tenants" value={data?.totalTenants || 0} iconName="people" color={COLORS.secondary} />
        <StatCard title="Occupied" value={data?.occupiedRooms || 0} iconName="checkmark-circle" color="#3182ce" />
        <StatCard title="Vacant" value={data?.vacantRooms || 0} iconName="home-outline" color={COLORS.textLight} />
      </View>

      <View style={styles.incomeRow}>
        <StatCard
          title="Monthly Income"
          value={formatMoney(data?.monthlyIncome || 0)}
          iconName="cash"
          color={COLORS.secondary}
        />
        <StatCard
          title="Outstanding"
          value={formatMoney(data?.outstandingPayments || 0)}
          iconName="alert-circle"
          color={COLORS.danger}
        />
      </View>

      <SectionHeader title="Recent Transactions" iconName="receipt-outline" />
      {data?.recentTransactions?.length === 0 ? (
        <Text style={styles.emptyText}>No recent transactions</Text>
      ) : (
        data?.recentTransactions?.map((payment) => (
          <Card key={payment.id} style={[styles.transactionCard, SHADOW.sm]}>
            <View style={styles.txIcon}>
              <Ionicons name="arrow-down-circle" size={28} color={COLORS.secondary} />
            </View>
            <View style={styles.txBody}>
              <Text style={styles.transactionName}>{payment.tenant?.name}</Text>
              <Text style={styles.transactionDetail}>
                {payment.tenant?.room?.property?.name} · {payment.tenant?.room?.roomNumber}
              </Text>
              <Text style={styles.transactionDate}>
                {new Date(payment.paymentDate).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.transactionAmount}>+{formatMoney(payment.amount)}</Text>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  incomeRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  emptyText: { color: COLORS.textLight, textAlign: 'center', padding: 20 },
  transactionCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  txIcon: { marginRight: 12 },
  txBody: { flex: 1 },
  transactionName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  transactionDetail: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  transactionDate: { fontSize: 12, color: COLORS.textLight, marginTop: 4 },
  transactionAmount: { fontSize: 17, fontWeight: '700', color: COLORS.secondary },
});
