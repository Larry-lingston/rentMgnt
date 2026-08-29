import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { StatusBadge, EmptyState, LoadingScreen } from '../../components/UI';
import { COLORS } from '../../constants/theme';

const STATUSES = [
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function StaffTasksScreen() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadData = async () => {
    try {
      setTasks(await api.getStaffTasks());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  function updateStatus(task) {
    Alert.alert(
      'Update Status',
      `Set "${task.title}" to:`,
      [
        ...STATUSES.map((s) => ({
          text: s.label,
          onPress: async () => {
            await api.updateStaffTaskStatus(task.id, s.key);
            loadData();
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        ListEmptyComponent={<EmptyState message="No assigned tasks — check Open Jobs" icon="🔧" />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => updateStatus(item)}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>{item.title}</Text>
              <View style={styles.headerActions}>
                {item.property?.id && (
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: '/map', params: { propertyId: item.property.id } })}
                    style={styles.mapIcon}
                  >
                    <Ionicons name="location-outline" size={22} color={COLORS.primary} />
                  </TouchableOpacity>
                )}
                <StatusBadge status={item.status === 'in_progress' ? 'pending' : item.status} />
              </View>
            </View>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.meta}>{item.property?.name} {item.tenant ? `• ${item.tenant.name}` : ''}</Text>
            <Text style={styles.hint}>Tap to set status</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  card: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  mapIcon: { marginRight: 8 },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 8 },
  description: { fontSize: 14, color: COLORS.textLight },
  meta: { fontSize: 13, color: COLORS.textLight, marginTop: 8 },
  hint: { fontSize: 12, color: '#3182ce', marginTop: 8, fontStyle: 'italic' },
});
