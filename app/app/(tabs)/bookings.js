import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api } from '../../services/api';
import { StatusBadge, EmptyState, LoadingScreen } from '../../components/UI';
import { COLORS } from '../../constants/theme';
import { formatMoney } from '../../utils/currency';

export default function LandlordBookingsScreen() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setBookings(await api.getLandlordBookings());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  function handleApprove(booking) {
    Alert.alert(
      'Approve booking',
      `Approve ${booking.applicant?.name} for ${booking.room?.roomNumber} at ${booking.room?.property?.name}? They will become a tenant automatically.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await api.approveBooking(booking.id);
              Alert.alert('Approved', 'Applicant is now a tenant.');
              loadData();
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  }

  function handleReject(booking) {
    Alert.alert('Reject booking', `Decline ${booking.applicant?.name}'s request?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive',
        onPress: async () => {
          await api.rejectBooking(booking.id);
          loadData();
        },
      },
    ]);
  }

  if (loading) return <LoadingScreen />;

  const pending = bookings.filter((b) => b.status === 'pending');

  return (
    <View style={styles.container}>
      {pending.length > 0 && (
        <Text style={styles.banner}>{pending.length} pending request(s) need your review</Text>
      )}
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />
        }
        ListEmptyComponent={<EmptyState message="No booking requests yet" icon="📋" />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>{item.applicant?.name}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.detail}>
              {item.room?.roomNumber} at {item.room?.property?.name}
            </Text>
            <Text style={styles.rent}>{formatMoney(item.room?.rentAmount)}/month</Text>
            <Text style={styles.contact}>{item.applicant?.email} • {item.applicant?.phone}</Text>
            {item.message ? <Text style={styles.message}>"{item.message}"</Text> : null}
            {item.status === 'pending' && (
              <View style={styles.actions}>
                <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item)}>
                  <Text style={styles.approveText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item)}>
                  <Text style={styles.rejectText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  banner: {
    backgroundColor: '#fef3c7', padding: 12, borderRadius: 8,
    marginBottom: 12, fontSize: 14, fontWeight: '600', color: '#92400e',
  },
  card: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 10, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 17, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 8 },
  detail: { fontSize: 15, color: COLORS.text },
  rent: { fontSize: 14, color: COLORS.secondary, fontWeight: '600', marginTop: 4 },
  contact: { fontSize: 13, color: COLORS.textLight, marginTop: 6 },
  message: { fontSize: 13, color: COLORS.text, fontStyle: 'italic', marginTop: 8 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  approveBtn: {
    flex: 1, backgroundColor: COLORS.secondary, padding: 12, borderRadius: 8, alignItems: 'center',
  },
  approveText: { color: COLORS.white, fontWeight: '600' },
  rejectBtn: {
    flex: 1, backgroundColor: '#fee2e2', padding: 12, borderRadius: 8, alignItems: 'center',
  },
  rejectText: { color: COLORS.danger, fontWeight: '600' },
});
