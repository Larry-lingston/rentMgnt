import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/theme';
import { getHomeRoute } from '../utils/roles';

export default function SplashScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        router.replace(user ? getHomeRoute(user.role) : '/login');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loading, user]);

  return (
    <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Ionicons name="home" size={48} color={COLORS.white} />
        </View>
      <Text style={styles.title}>Rent Manager</Text>
      <Text style={styles.subtitle}>Mobile Rent Management System</Text>
      <ActivityIndicator size="large" color={COLORS.white} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: { fontSize: 48 },
  title: { fontSize: 32, fontWeight: '700', color: COLORS.white, marginBottom: 8 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 40 },
  loader: { marginTop: 20 },
});
