import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { EmptyState, LoadingScreen, NOTIFICATION_ICONS } from './UI';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';

export function NotificationsList({ showGenerate = false }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setNotifications(await api.getNotifications());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  async function handleGenerate() {
    if (showGenerate) {
      await api.generateNotifications();
    }
    loadData();
  }

  async function markRead(id) {
    await api.markNotificationRead(id);
    loadData();
  }

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      {showGenerate && (
        <TouchableOpacity style={styles.generateButton} onPress={handleGenerate}>
          <Ionicons name="refresh" size={20} color={COLORS.white} />
          <Text style={styles.generateText}>Refresh reminders</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />
        }
        ListEmptyComponent={
          <EmptyState message="No notifications yet" iconName="notifications-outline" />
        }
        renderItem={({ item }) => {
          const icon = NOTIFICATION_ICONS[item.type] || { name: 'notifications', color: COLORS.primary };
          return (
            <TouchableOpacity
              style={[styles.card, SHADOW.sm, !item.read && styles.unread]}
              onPress={() => !item.read && markRead(item.id)}
              activeOpacity={0.85}
            >
              <View style={[styles.iconWrap, { backgroundColor: icon.color + '18' }]}>
                <Ionicons name={icon.name} size={24} color={icon.color} />
              </View>
              <View style={styles.content}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
              </View>
              {!item.read && <View style={styles.dot} />}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  generateButton: {
    backgroundColor: COLORS.primary, padding: 14, borderRadius: RADIUS.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16,
  },
  generateText: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
  card: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'flex-start',
  },
  unread: { borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  iconWrap: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  message: { fontSize: 14, color: COLORS.textLight, marginTop: 4, lineHeight: 20 },
  date: { fontSize: 11, color: COLORS.textLight, marginTop: 8 },
  dot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginTop: 4,
  },
});
