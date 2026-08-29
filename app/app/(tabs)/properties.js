import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { StatusBadge, EmptyState, LoadingScreen } from '../../components/UI';
import { RoomImage } from '../../components/RoomImage';
import { COLORS, SHADOW, RADIUS } from '../../constants/theme';

export default function PropertiesScreen() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadData = async () => {
    try {
      const data = await api.getProperties();
      setProperties(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  function handleDelete(id, name) {
    Alert.alert('Delete Property', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await api.deleteProperty(id);
          loadData();
        },
      },
    ]);
  }

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.mapButton}
        onPress={() => router.push('/map')}
      >
        <Ionicons name="map-outline" size={22} color={COLORS.white} />
        <Text style={styles.mapButtonText}>View All on Map</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/property-form')}
      >
        <Ionicons name="add" size={24} color={COLORS.white} />
        <Text style={styles.addButtonText}>Add Property</Text>
      </TouchableOpacity>

      <FlatList
        data={properties}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        ListEmptyComponent={<EmptyState message="No properties yet. Add your first property!" iconName="business-outline" />}
        renderItem={({ item }) => (
          <View style={[styles.card, SHADOW.sm]}>
            <RoomImage room={{ imageUrl: item.imageUrl, property: item }} style={styles.thumb} imageStyle={styles.thumb} />
            <View style={styles.cardBody}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => router.push({ pathname: '/map', params: { propertyId: item.id } })}>
                    <Ionicons name="location-outline" size={22} color={COLORS.secondary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => router.push({ pathname: '/property-form', params: { id: item.id } })}>
                    <Ionicons name="create-outline" size={22} color={COLORS.primaryLight} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={{ marginLeft: 12 }}>
                    <Ionicons name="trash-outline" size={22} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.address}>{item.address}</Text>
              <View style={styles.stats}>
                <Text style={styles.stat}>Rooms: {item._count?.rooms || item.totalRooms}</Text>
                <Text style={[styles.stat, { color: COLORS.secondary }]}>Occupied: {item.occupiedRooms}</Text>
                <Text style={styles.stat}>Vacant: {item.vacantRooms}</Text>
              </View>
              <StatusBadge status={item.type} />
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  mapButton: {
    backgroundColor: COLORS.secondary, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', padding: 14, borderRadius: 10, marginBottom: 12,
  },
  mapButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '600', marginLeft: 8 },
  addButton: {
    backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', padding: 14, borderRadius: 10, marginBottom: 16,
  },
  addButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '600', marginLeft: 8 },
  card: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, marginBottom: 12, overflow: 'hidden' },
  thumb: { width: '100%', height: 140 },
  cardBody: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, flex: 1 },
  actions: { flexDirection: 'row' },
  address: { fontSize: 14, color: COLORS.textLight, marginTop: 4 },
  stats: { flexDirection: 'row', gap: 16, marginTop: 12, marginBottom: 8 },
  stat: { fontSize: 13, color: COLORS.text },
});
