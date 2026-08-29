import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api } from '../../services/api';
import { StatusBadge, EmptyState, LoadingScreen } from '../../components/UI';
import { COLORS } from '../../constants/theme';
import { formatMoney } from '../../utils/currency';

export default function SeekerRequestsScreen() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setBookings(await api.getMyBookings());
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
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />
        }
        ListEmptyComponent={
          <EmptyState message="No booking requests yet. Browse rooms to get started!" iconName="document-text-outline" />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>{item.room?.property?.name}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.room}>{item.room?.roomNumber} — {formatMoney(item.room?.rentAmount, { decimals: 0 })}/mo</Text>
            <Text style={styles.meta}>
              Submitted {new Date(item.createdAt).toLocaleDateString()}
            </Text>
            {item.status === 'approved' && (
              <Text style={styles.approved}>You are now a tenant! Log out and log back in to access your tenant portal.</Text>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  card: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 10, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 8 },
  room: { fontSize: 14, color: COLORS.text },
  meta: { fontSize: 12, color: COLORS.textLight, marginTop: 6 },
  approved: { fontSize: 13, color: COLORS.secondary, fontWeight: '600', marginTop: 10 },
});
