import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api } from '../../services/api';
import { EmptyState, LoadingScreen } from '../../components/UI';
import { COLORS } from '../../constants/theme';
import { formatMoney } from '../../utils/currency';

export default function TenantPaymentsScreen() {
  const [payments, setPayments] = useState([]);
  const [outstanding, setOutstanding] = useState(0);
  const [monthlyRent, setMonthlyRent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [paying, setPaying] = useState(false);

  const loadData = async () => {
    try {
      const [paymentsData, dashboard] = await Promise.all([
        api.getTenantPayments(),
        api.getTenantDashboard(),
      ]);
      setPayments(paymentsData);
      setOutstanding(dashboard.outstanding);
      setMonthlyRent(dashboard.monthlyRent);
      setPayAmount(String(dashboard.outstanding || ''));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  async function viewReceipt(id) {
    try {
      const receipt = await api.getTenantReceipt(id);
      Alert.alert(
        'Payment Receipt',
        `Receipt: ${receipt.receiptNumber}\nTransaction: ${receipt.transactionRef || 'N/A'}\nAmount: ${formatMoney(receipt.amount)}\nMethod: ${receipt.method}\nDate: ${new Date(receipt.paymentDate).toLocaleDateString()}`,
        [{ text: 'OK' }]
      );
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  async function handlePay() {
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }
    setPaying(true);
    try {
      const result = await api.payRent(amount, 'app_card');
      setPayModal(false);
      Alert.alert(
        'Payment Successful',
        `${formatMoney(amount)} paid successfully.\nReceipt: ${result.payment.receiptNumber}\n\n(Simulated in-app payment)`,
        [{ text: 'OK', onPress: loadData }]
      );
    } catch (err) {
      Alert.alert('Payment Failed', err.message);
    } finally {
      setPaying(false);
    }
  }

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <View>
          <Text style={styles.summaryLabel}>Monthly Rent</Text>
          <Text style={styles.summaryValue}>{formatMoney(monthlyRent)}</Text>
        </View>
        <View>
          <Text style={styles.summaryLabel}>Outstanding</Text>
          <Text style={[styles.summaryValue, { color: COLORS.danger }]}>{formatMoney(outstanding)}</Text>
        </View>
      </View>

      {outstanding > 0 && (
        <TouchableOpacity style={styles.payButton} onPress={() => setPayModal(true)}>
          <Text style={styles.payButtonText}>Pay Rent In App</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={payments}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        ListEmptyComponent={<EmptyState message="No payment history" icon="💳" />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => viewReceipt(item.id)}>
            <View>
              <Text style={styles.receipt}>{item.receiptNumber}</Text>
              <Text style={styles.date}>{new Date(item.paymentDate).toLocaleDateString()}</Text>
              <Text style={styles.method}>{item.method.replace('_', ' ')}</Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.amount}>{formatMoney(item.amount)}</Text>
              <Text style={styles.download}>View Receipt</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <Modal visible={payModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Pay Rent</Text>
            <Text style={styles.modalSub}>Simulated in-app payment</Text>
            <Text style={styles.label}>Amount (₵)</Text>
            <TextInput
              style={styles.input}
              value={payAmount}
              onChangeText={setPayAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />
            <View style={styles.cardPreview}>
              <Text style={styles.cardText}>💳 •••• •••• •••• 4242</Text>
              <Text style={styles.cardHint}>Demo card — no real charge</Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setPayModal(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handlePay} disabled={paying}>
                {paying ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>Pay Now</Text>}
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
  summary: {
    flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.card,
    borderRadius: 12, padding: 16, marginBottom: 12,
  },
  summaryLabel: { fontSize: 13, color: COLORS.textLight },
  summaryValue: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginTop: 4 },
  payButton: {
    backgroundColor: COLORS.secondary, padding: 16, borderRadius: 12,
    alignItems: 'center', marginBottom: 16,
  },
  payButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  card: {
    backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  receipt: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  date: { fontSize: 13, color: COLORS.textLight, marginTop: 4 },
  method: { fontSize: 12, color: COLORS.textLight, marginTop: 2, textTransform: 'capitalize' },
  right: { alignItems: 'flex-end' },
  amount: { fontSize: 18, fontWeight: '700', color: COLORS.secondary },
  download: { fontSize: 12, color: COLORS.primaryLight, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: COLORS.card, borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  modalSub: { fontSize: 13, color: COLORS.textLight, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 8, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 14, backgroundColor: COLORS.background },
  cardPreview: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, marginTop: 16 },
  cardText: { color: COLORS.white, fontSize: 16 },
  cardHint: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, gap: 16, alignItems: 'center' },
  cancelText: { color: COLORS.textLight },
  confirmBtn: { backgroundColor: COLORS.secondary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, minWidth: 100, alignItems: 'center' },
  confirmText: { color: COLORS.white, fontWeight: '700' },
});
