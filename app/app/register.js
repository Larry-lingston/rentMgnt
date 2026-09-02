import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { useRouter, Link, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { ACCOUNT_TYPES, accountTypeNeedsLandlord, getHomeRoute } from '../utils/roles';
import { COLORS } from '../constants/theme';
import { getParam } from '../utils/params';
import { isRequired, isEmail, isPassword, trim } from '../utils/validation';

const VALID_TYPES = ACCOUNT_TYPES.map((t) => t.id);

function resolveInitialType(param) {
  const value = getParam(param);
  return VALID_TYPES.includes(value) ? value : 'renter';
}

export default function RegisterScreen() {
  const params = useLocalSearchParams();
  const returnRoomId = getParam(params.roomId);
  const [accountType, setAccountType] = useState(() => resolveInitialType(params.accountType));
  const [form, setForm] = useState({
    username: '', email: '', name: '', phone: '', password: '', landlordUsername: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const needsLandlord = accountTypeNeedsLandlord(accountType);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleRegister() {
    if (!isRequired(form.username) || !isRequired(form.email) || !isRequired(form.name) || !isRequired(form.password)) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (!isEmail(form.email)) {
      Alert.alert('Error', 'Enter a valid email address');
      return;
    }
    if (!isPassword(form.password)) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (needsLandlord && !isRequired(form.landlordUsername)) {
      Alert.alert('Error', 'Enter your landlord\'s username');
      return;
    }

    setLoading(true);
    try {
      const userData = await register({
        username: trim(form.username),
        email: trim(form.email),
        name: trim(form.name),
        phone: trim(form.phone) || undefined,
        password: form.password,
        accountType,
        landlordUsername: trim(form.landlordUsername) || undefined,
      });
      if (returnRoomId && userData.role === 'seeker') {
        router.replace({ pathname: '/room-detail', params: { id: returnRoomId } });
      } else {
        router.replace(getHomeRoute(userData.role));
      }
    } catch (err) {
      Alert.alert('Registration Failed', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Choose your account type</Text>

        {ACCOUNT_TYPES.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[styles.typeCard, accountType === type.id && styles.typeCardActive]}
            onPress={() => setAccountType(type.id)}
          >
            <Text style={styles.typeIcon}>{type.icon}</Text>
            <View style={styles.typeContent}>
              <Text style={[styles.typeLabel, accountType === type.id && styles.typeLabelActive]}>
                {type.label}
              </Text>
              <Text style={styles.typeDesc}>{type.description}</Text>
            </View>
            <View style={[styles.radio, accountType === type.id && styles.radioActive]} />
          </TouchableOpacity>
        ))}

        {needsLandlord && (
          <View>
            <Text style={styles.label}>Landlord username</Text>
            <Text style={styles.hint}>Ask your landlord for their username (e.g. admin)</Text>
            <TextInput
              style={styles.input}
              value={form.landlordUsername}
              onChangeText={(v) => updateField('landlordUsername', v)}
              placeholder="Landlord username"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        )}

        {['username', 'email', 'name', 'phone', 'password'].map((field) => (
          <View key={field}>
            <Text style={styles.label}>
              {field.charAt(0).toUpperCase() + field.slice(1)}
              {field !== 'phone' ? ' *' : ''}
            </Text>
            <TextInput
              style={styles.input}
              value={form[field]}
              onChangeText={(v) => updateField(field, v)}
              placeholder={`Enter ${field}`}
              secureTextEntry={field === 'password'}
              autoCapitalize={field === 'email' || field === 'username' ? 'none' : 'words'}
              keyboardType={
                field === 'email' ? 'email-address' : field === 'phone' ? 'phone-pad' : 'default'
              }
            />
          </View>
        ))}

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Create account'}</Text>
        </TouchableOpacity>

        <Link href="/login" asChild>
          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkText}>Already have an account? Login</Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 24, paddingTop: 48, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.primary, textAlign: 'center' },
  subtitle: { fontSize: 15, color: COLORS.textLight, textAlign: 'center', marginTop: 6, marginBottom: 20 },
  typeCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card,
    borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 2, borderColor: COLORS.border,
  },
  typeCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
  typeIcon: { fontSize: 28, marginRight: 12 },
  typeContent: { flex: 1 },
  typeLabel: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  typeLabelActive: { color: COLORS.primary },
  typeDesc: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  radio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border,
  },
  radioActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  hint: { fontSize: 12, color: COLORS.textLight, marginBottom: 6 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 14,
    fontSize: 16, backgroundColor: COLORS.card,
  },
  button: {
    backgroundColor: COLORS.primary, borderRadius: 10, padding: 16,
    alignItems: 'center', marginTop: 24,
  },
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  linkButton: { alignItems: 'center', marginTop: 16 },
  linkText: { color: COLORS.primaryLight, fontSize: 14 },
});
