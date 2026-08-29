import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/theme';

const MENU_ITEMS = [
  { title: 'Booking Requests', subtitle: 'Approve room applicants', icon: 'calendar', route: 'bookings', color: '#805ad5' },
  { title: 'Maintenance', subtitle: 'Submit & track requests', icon: 'construct', route: 'maintenance', color: '#ed8936' },
  { title: 'Maintenance Crew', subtitle: 'Manage staff members', icon: 'hammer', route: 'staff', color: '#3182ce' },
  { title: 'Reports', subtitle: 'Generate rent reports', icon: 'bar-chart', route: 'reports', color: '#3182ce' },
  { title: 'Notifications', subtitle: 'Alerts & reminders', icon: 'notifications', route: 'notifications', color: '#d69e2e' },
  { title: 'Profile', subtitle: 'Account settings', icon: 'person', route: 'profile', color: '#38a169' },
];

export default function MoreScreen() {
  const router = useRouter();
  const { logout, user } = useAuth();

  function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
        </View>
        <View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>
      </View>

      {MENU_ITEMS.map((item) => (
        <TouchableOpacity
          key={item.route}
          style={styles.menuItem}
          onPress={() => router.push(`/(tabs)/${item.route}`)}
        >
          <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
            <Ionicons name={item.icon} size={24} color={item.color} />
          </View>
          <View style={styles.menuText}>
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color={COLORS.danger} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  userCard: {
    backgroundColor: COLORS.primary, borderRadius: 16, padding: 20,
    flexDirection: 'row', alignItems: 'center', marginBottom: 24,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  avatarText: { color: COLORS.white, fontSize: 24, fontWeight: '700' },
  userName: { color: COLORS.white, fontSize: 20, fontWeight: '700' },
  userEmail: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 2 },
  menuItem: {
    backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', elevation: 1,
  },
  menuIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuText: { flex: 1, marginLeft: 14 },
  menuTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  menuSubtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 16, marginTop: 20, marginBottom: 40,
  },
  logoutText: { color: COLORS.danger, fontSize: 16, fontWeight: '600', marginLeft: 8 },
});
