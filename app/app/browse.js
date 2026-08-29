import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { EmptyState, LoadingScreen } from '../components/UI';
import { RoomImage } from '../components/RoomImage';
import { COLORS, SHADOW, RADIUS } from '../constants/theme';
import { formatMoney } from '../utils/currency';

export default function BrowseScreen() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadData = async () => {
    try {
      setListings(await api.getListings());
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
      <View style={styles.header}>
        <Ionicons name="search" size={22} color={COLORS.primary} />
        <Text style={styles.headerText}>Find your next home</Text>
      </View>

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />
        }
        ListEmptyComponent={
          <EmptyState message="No vacant rooms right now. Check back later!" iconName="home-outline" />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, SHADOW.md]}
            activeOpacity={0.9}
            onPress={() => router.push({ pathname: '/room-detail', params: { id: item.id } })}
          >
            <RoomImage room={item} style={styles.image} imageStyle={styles.image} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Available</Text>
            </View>
            <View style={styles.body}>
              <View style={styles.row}>
                <Text style={styles.title} numberOfLines={1}>{item.property?.name}</Text>
                <Text style={styles.rent}>{formatMoney(item.rentAmount, { decimals: 0 })}<Text style={styles.perMo}>/mo</Text></Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="bed-outline" size={16} color={COLORS.primary} />
                <Text style={styles.room}>{item.roomNumber}</Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={16} color={COLORS.textLight} />
                <Text style={styles.address} numberOfLines={1}>{item.property?.address}</Text>
              </View>
              <View style={styles.footer}>
                <View style={styles.landlordRow}>
                  <Ionicons name="person-circle-outline" size={18} color={COLORS.textLight} />
                  <Text style={styles.landlord}>{item.property?.user?.name}</Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={24} color={COLORS.primary} />
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4,
  },
  headerText: { fontSize: 17, fontWeight: '600', color: COLORS.text },
  list: { padding: 16, paddingTop: 8 },
  card: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg, marginBottom: 16, overflow: 'hidden',
  },
  image: { width: '100%', height: 180 },
  badge: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: COLORS.secondary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  badgeText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
  body: { padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 8 },
  rent: { fontSize: 20, fontWeight: '800', color: COLORS.secondary },
  perMo: { fontSize: 13, fontWeight: '500' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  room: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
  address: { fontSize: 13, color: COLORS.textLight, flex: 1 },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  landlordRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  landlord: { fontSize: 13, color: COLORS.textLight },
});
