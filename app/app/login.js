import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { useRouter, Link, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';
import { getHomeRoute } from '../utils/roles';
import { getParam } from '../utils/params';
import { isRequired, isEmail } from '../utils/validation';

export default function LoginScreen() {
  const params = useLocalSearchParams();
  const returnRoomId = getParam(params.roomId);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleLogin() {
    if (!isRequired(username) || !isRequired(password)) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }
    setLoading(true);
    try {
      const userData = await login(username.trim(), password);
      if (returnRoomId && userData.role === 'seeker') {
        router.replace({ pathname: '/room-detail', params: { id: returnRoomId } });
      } else {
        router.replace(getHomeRoute(userData.role));
      }
    } catch (err) {
      Alert.alert('Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!isRequired(resetEmail)) {
      Alert.alert('Error', 'Enter your email address');
      return;
    }
    if (!isEmail(resetEmail)) {
      Alert.alert('Error', 'Enter a valid email address');
      return;
    }
    setResetLoading(true);
    try {
      const result = await api.forgotPassword(resetEmail.trim());
      Alert.alert('Password Reset', result.message);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Ionicons name="home" size={40} color={COLORS.white} />
          </View>
          <Text style={styles.title}>Rent Manager</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        <View style={[styles.form, SHADOW.md]}>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.inputWithIcon}
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              placeholderTextColor={COLORS.textLight}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.inputWithIcon}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={COLORS.textLight}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            <Ionicons name="log-in-outline" size={22} color={COLORS.white} />
            <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.browseButton} onPress={() => router.push('/browse')}>
            <Ionicons name="search" size={18} color={COLORS.secondary} />
            <Text style={styles.browseText}>Browse available rooms</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Forgot password?</Text>
          <TextInput
            style={styles.input}
            value={resetEmail}
            onChangeText={setResetEmail}
            placeholder="Enter your email"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TouchableOpacity style={styles.forgotButton} onPress={handleForgotPassword} disabled={resetLoading}>
            <Text style={styles.linkText}>{resetLoading ? 'Sending...' : 'Send reset link'}</Text>
          </TouchableOpacity>

          <Link href="/register" asChild>
            <TouchableOpacity style={styles.linkButton}>
              <Text style={styles.linkText}>Don't have an account? Register (landlord, tenant, crew & more)</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  subtitle: { fontSize: 15, color: COLORS.textLight, marginTop: 4 },
  form: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: 24 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.md, marginTop: 12, backgroundColor: COLORS.background,
  },
  inputIcon: { marginLeft: 14 },
  inputWithIcon: { flex: 1, padding: 14, fontSize: 16, color: COLORS.text },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 16 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 14, fontSize: 16, backgroundColor: COLORS.background },
  button: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20,
  },
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  browseButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 14, padding: 12, borderWidth: 1, borderColor: COLORS.secondary, borderRadius: RADIUS.md,
  },
  browseText: { color: COLORS.secondary, fontSize: 15, fontWeight: '600' },
  linkButton: { alignItems: 'center', marginTop: 16 },
  forgotButton: { alignItems: 'center', marginTop: 8 },
  linkText: { color: COLORS.primaryLight, fontSize: 14 },
});
