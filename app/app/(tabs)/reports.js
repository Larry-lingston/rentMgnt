import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { api } from '../../services/api';
import { COLORS } from '../../constants/theme';
import { formatMoney } from '../../utils/currency';

const REPORT_TYPES = [
  { key: 'monthly', title: 'Monthly Collection', icon: '💰', endpoint: 'getMonthlyCollection' },
  { key: 'outstanding', title: 'Outstanding Balances', icon: '⚠️', endpoint: 'getOutstandingReport' },
  { key: 'occupancy', title: 'Property Occupancy', icon: '🏢', endpoint: 'getOccupancyReport' },
  { key: 'tenants', title: 'Tenant Report', icon: '👥', endpoint: 'getTenantReport' },
];

export default function ReportsScreen() {
  const [report, setReport] = useState(null);
  const [reportType, setReportType] = useState(null);
  const [loading, setLoading] = useState(false);

  async function generateReport(type) {
    setLoading(true);
    setReportType(type);
    try {
      const data = await api[type.endpoint]();
      setReport(data);
    } catch (err) {
      Alert.alert('Report failed', err.message || 'Could not generate report');
    } finally {
      setLoading(false);
    }
  }

  function renderReportContent() {
    if (!report) return null;

    if (reportType?.key === 'monthly') {
      return (
        <View>
          <Text style={styles.reportTitle}>
            {report.period?.month}/{report.period?.year} Collection
          </Text>
          <Text style={styles.reportTotal}>Total: {formatMoney(report.totalCollected)}</Text>
          <Text style={styles.reportCount}>{report.paymentCount} payments</Text>
          {report.payments?.map((p) => (
            <View key={p.id} style={styles.reportItem}>
              <Text style={styles.itemName}>{p.tenant?.name}</Text>
              <Text style={styles.itemAmount}>{formatMoney(p.amount)}</Text>
            </View>
          ))}
        </View>
      );
    }

    if (reportType?.key === 'outstanding') {
      return (
        <View>
          <Text style={styles.reportTitle}>Outstanding Balances</Text>
          <Text style={[styles.reportTotal, { color: COLORS.danger }]}>
            Total: {formatMoney(report.totalOutstanding)}
          </Text>
          {report.balances?.map((b) => (
            <View key={b.tenantId} style={styles.reportItem}>
              <View>
                <Text style={styles.itemName}>{b.tenantName}</Text>
                <Text style={styles.itemDetail}>{b.property} - {b.room}</Text>
              </View>
              <Text style={[styles.itemAmount, { color: COLORS.danger }]}>{formatMoney(b.outstanding)}</Text>
            </View>
          ))}
        </View>
      );
    }

    if (reportType?.key === 'occupancy') {
      return (
        <View>
          <Text style={styles.reportTitle}>Occupancy Report</Text>
          {report.map((p) => (
            <View key={p.propertyId} style={styles.occupancyCard}>
              <Text style={styles.itemName}>{p.propertyName}</Text>
              <Text style={styles.itemDetail}>{p.occupied}/{p.totalRooms} occupied ({p.occupancyRate}%)</Text>
            </View>
          ))}
        </View>
      );
    }

    if (reportType?.key === 'tenants') {
      return (
        <View>
          <Text style={styles.reportTitle}>Tenant Report ({report.length})</Text>
          {report.map((t) => (
            <View key={t.id} style={styles.reportItem}>
              <View>
                <Text style={styles.itemName}>{t.name}</Text>
                <Text style={styles.itemDetail}>{t.property} - {t.room}</Text>
              </View>
              <Text style={styles.itemDetail}>{t.totalPayments} payments</Text>
            </View>
          ))}
        </View>
      );
    }

    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Generate Reports</Text>
      <View style={styles.grid}>
        {REPORT_TYPES.map((type) => (
          <TouchableOpacity
            key={type.key}
            style={[styles.reportButton, reportType?.key === type.key && styles.activeButton]}
            onPress={() => generateReport(type)}
          >
            <Text style={styles.reportIcon}>{type.icon}</Text>
            <Text style={styles.reportButtonText}>{type.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />}

      {report && !loading && (
        <View style={styles.reportContainer}>{renderReportContent()}</View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  heading: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  reportButton: {
    backgroundColor: COLORS.card, borderRadius: 12, padding: 16,
    width: '47%', alignItems: 'center', elevation: 2,
  },
  activeButton: { borderWidth: 2, borderColor: COLORS.primary },
  reportIcon: { fontSize: 28, marginBottom: 8 },
  reportButtonText: { fontSize: 13, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
  reportContainer: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginTop: 20, marginBottom: 40 },
  reportTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  reportTotal: { fontSize: 24, fontWeight: '700', color: COLORS.secondary, marginBottom: 4 },
  reportCount: { fontSize: 14, color: COLORS.textLight, marginBottom: 16 },
  reportItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  itemName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  itemDetail: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  itemAmount: { fontSize: 16, fontWeight: '700', color: COLORS.secondary },
  occupancyCard: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
});
