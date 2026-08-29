import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { EmptyState, LoadingScreen } from '../../components/UI';
import { COLORS } from '../../constants/theme';
import { formatMoney } from '../../utils/currency';

export default function PaymentsScreen() {
  const [payments, setPayments] = useState([]);
  const [outstanding, setOutstanding] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('history');
  const router = useRouter();

  const loadData = async () => {
    try {
      const [paymentsData, outstandingData] = await Promise.all([
        api.getPayments(),
        api.getOutstanding(),
      ]);
      setPayments(paymentsData);
      setOutstanding(outstandingData);
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
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={() => router.push('/payment-form')}>
        <Ionicons name="add-circle" size={22} color={COLORS.white} />
        <Text style={styles.addButtonText}>Record Payment</Text>
      </TouchableOpacity>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'history' && styles.activeTab]}
          onPress={() => setTab('history')}
        >
          <Text style={[styles.tabText, tab === 'history' && styles.activeTabText]}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'outstanding' && styles.activeTab]}
          onPress={() => setTab('outstanding')}
        >
          <Text style={[styles.tabText, tab === 'outstanding' && styles.activeTabText]}>
            Outstanding ({outstanding.length})
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'history' ? (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
          ListEmptyComponent={<EmptyState message="No payments recorded" icon="💳" />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View>
                  <Text style={styles.name}>{item.tenant?.name}</Text>
                  <Text style={styles.detail}>{item.receiptNumber}</Text>
                  <Text style={styles.date}>{new Date(item.paymentDate).toLocaleDateString()}</Text>
                </View>
                <View style={styles.right}>
                  <Text style={styles.amount}>{formatMoney(item.amount)}</Text>
                  <Text style={styles.method}>{item.method}</Text>
                </View>
              </View>
            </View>
          )}
        />
      ) : (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}>
          {outstanding.length === 0 ? (
            <EmptyState message="All rents are paid!" icon="✅" />
          ) : (
            outstanding.map((item) => (
              <View key={item.tenantId} style={styles.card}>
                <Text style={styles.name}>{item.tenantName}</Text>
                <Text style={styles.detail}>{item.roomNumber}</Text>
                <View style={styles.outstandingRow}>
                  <Text style={styles.detail}>Rent: {formatMoney(item.monthlyRent)}</Text>
                  <Text style={styles.detail}>Paid: {formatMoney(item.paidThisMonth)}</Text>
                  <Text style={styles.outstandingAmount}>Due: {formatMoney(item.outstanding)}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  addButton: {
    backgroundColor: COLORS.secondary, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', padding: 14, borderRadius: 10, marginBottom: 16,
  },
  addButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '600', marginLeft: 8 },
  tabs: { flexDirection: 'row', marginBottom: 16, backgroundColor: COLORS.card, borderRadius: 10, padding: 4 },
  tab: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 14, color: COLORS.textLight, fontWeight: '500' },
  activeTabText: { color: COLORS.white },
  card: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 10, elevation: 2 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  detail: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  date: { fontSize: 12, color: COLORS.textLight, marginTop: 4 },
  right: { alignItems: 'flex-end' },
  amount: { fontSize: 18, fontWeight: '700', color: COLORS.secondary },
  method: { fontSize: 12, color: COLORS.textLight, marginTop: 4, textTransform: 'capitalize' },
  outstandingRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  outstandingAmount: { fontSize: 14, fontWeight: '700', color: COLORS.danger },
});
