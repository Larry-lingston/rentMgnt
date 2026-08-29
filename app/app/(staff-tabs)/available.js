import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { EmptyState, LoadingScreen } from '../../components/UI';
import { COLORS } from '../../constants/theme';

export default function StaffAvailableScreen() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadData = async () => {
    try {
      setJobs(await api.getStaffAvailableJobs());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  function claimJob(job) {
    Alert.alert('Claim Job', `Claim "${job.title}"? First come, first serve.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Claim',
        onPress: async () => {
          try {
            await api.claimStaffJob(job.id);
            Alert.alert('Claimed!', 'Job added to your tasks.');
            loadData();
          } catch (err) {
            Alert.alert('Too late', err.message);
            loadData();
          }
        },
      },
    ]);
  }

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>Open jobs from your landlord — tap to claim (FCFS)</Text>
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        ListEmptyComponent={<EmptyState message="No open jobs right now" icon="✨" />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
            <Text style={styles.meta}>{item.property?.name} {item.tenant ? `• ${item.tenant.name}` : ''}</Text>
            <View style={styles.actions}>
              {item.property?.id && (
                <TouchableOpacity
                  style={styles.mapBtn}
                  onPress={() => router.push({ pathname: '/map', params: { propertyId: item.property.id } })}
                >
                  <Ionicons name="location-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.mapBtnText}>Map</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.claimBtn} onPress={() => claimJob(item)}>
                <Text style={styles.claim}>Claim job →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  hint: { fontSize: 13, color: COLORS.textLight, marginBottom: 12 },
  card: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#3182ce' },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  description: { fontSize: 14, color: COLORS.textLight, marginTop: 6 },
  meta: { fontSize: 13, color: COLORS.textLight, marginTop: 8 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  mapBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mapBtnText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  claimBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  claim: { fontSize: 13, color: '#3182ce', fontWeight: '600' },
});
