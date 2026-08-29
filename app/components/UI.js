import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOW, RADIUS } from '../constants/theme';

export function StatCard({ title, value, subtitle, color = COLORS.primary, iconName }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }, SHADOW.sm]}>
      {iconName && (
        <View style={[styles.statIconWrap, { backgroundColor: color + '18' }]}>
          <Ionicons name={iconName} size={20} color={color} />
        </View>
      )}
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );
}

export function EmptyState({ message, iconName = 'file-tray-outline', icon }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIconWrap}>
        {icon ? (
          <Text style={styles.emptyEmoji}>{icon}</Text>
        ) : (
          <Ionicons name={iconName} size={40} color={COLORS.textLight} />
        )}
      </View>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

export function StatusBadge({ status }) {
  const colors = {
    pending: '#fef3c7',
    in_progress: '#dbeafe',
    completed: '#d1fae5',
    cancelled: '#fee2e2',
    approved: '#d1fae5',
    rejected: '#fee2e2',
    occupied: '#d1fae5',
    vacant: '#f3f4f6',
    rent_due: '#fee2e2',
    rent_upcoming: '#fef3c7',
  };
  const textColors = {
    pending: '#92400e',
    in_progress: '#1e40af',
    completed: '#065f46',
    cancelled: '#991b1b',
    approved: '#065f46',
    rejected: '#991b1b',
    occupied: '#065f46',
    vacant: '#4b5563',
    rent_due: '#991b1b',
    rent_upcoming: '#92400e',
  };

  return (
    <View style={[styles.badge, { backgroundColor: colors[status] || '#f3f4f6' }]}>
      <Text style={[styles.badgeText, { color: textColors[status] || '#4b5563' }]}>
        {status?.replace(/_/g, ' ')}
      </Text>
    </View>
  );
}

export function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

export function SectionHeader({ title, iconName }) {
  return (
    <View style={styles.sectionHeader}>
      {iconName && <Ionicons name={iconName} size={20} color={COLORS.primary} style={{ marginRight: 8 }} />}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export function Card({ children, style }) {
  return <View style={[styles.card, SHADOW.sm, style]}>{children}</View>;
}

export const NOTIFICATION_ICONS = {
  rent_due: { name: 'alert-circle', color: COLORS.danger },
  rent_upcoming: { name: 'time', color: COLORS.warning },
  late_payment: { name: 'warning', color: COLORS.danger },
  lease_expiry: { name: 'calendar', color: COLORS.accent },
  maintenance: { name: 'construct', color: '#3182ce' },
  booking: { name: 'calendar-outline', color: COLORS.primary },
};

const styles = StyleSheet.create({
  statCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    flex: 1,
    minWidth: '45%',
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statTitle: { fontSize: 13, color: COLORS.textLight, fontWeight: '500' },
  statValue: { fontSize: 22, fontWeight: '700', marginTop: 2 },
  statSubtitle: { fontSize: 12, color: COLORS.textLight, marginTop: 4 },
  empty: { alignItems: 'center', padding: 48 },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyEmoji: { fontSize: 32 },
  emptyText: { fontSize: 15, color: COLORS.textLight, textAlign: 'center', lineHeight: 22 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 15, color: COLORS.textLight },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: 16,
    marginBottom: 10,
  },
});
