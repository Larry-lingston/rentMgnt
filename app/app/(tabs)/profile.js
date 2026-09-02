import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/theme';
import { validateProfile, trim } from '../../utils/validation';

export default function ProfileScreen() {
  const { user, updateProfile, logout } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    const error = validateProfile(form);
    if (error) {
      Alert.alert('Error', error);
      return;
    }
    setLoading(true);
    try {
      const data = {
        name: trim(form.name),
        email: trim(form.email),
        phone: trim(form.phone) || null,
      };
      if (form.password) data.password = form.password;
      await updateProfile(data);
      Alert.alert('Success', 'Profile updated successfully');
      setForm((prev) => ({ ...prev, password: '' }));
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => { await logout(); router.replace('/login'); },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0)}</Text>
        </View>
        <Text style={styles.username}>@{user?.username}</Text>
      </View>

      {['name', 'email', 'phone', 'password'].map((field) => (
        <View key={field}>
          <Text style={styles.label}>
            {field === 'password' ? 'New Password (optional)' : field.charAt(0).toUpperCase() + field.slice(1)}
          </Text>
          <TextInput
            style={styles.input}
            value={form[field]}
            onChangeText={(v) => setForm((prev) => ({ ...prev, [field]: v }))}
            secureTextEntry={field === 'password'}
            keyboardType={field === 'email' ? 'email-address' : field === 'phone' ? 'phone-pad' : 'default'}
          />
        </View>
      ))}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
        <Text style={styles.saveText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  header: { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: COLORS.white, fontSize: 32, fontWeight: '700' },
  username: { fontSize: 16, color: COLORS.textLight, marginTop: 8 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    padding: 14, fontSize: 16, backgroundColor: COLORS.card,
  },
  saveButton: {
    backgroundColor: COLORS.primary, borderRadius: 10, padding: 16,
    alignItems: 'center', marginTop: 24,
  },
  saveText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  logoutButton: {
    borderWidth: 1, borderColor: COLORS.danger, borderRadius: 10, padding: 16,
    alignItems: 'center', marginTop: 16, marginBottom: 40,
  },
  logoutText: { color: COLORS.danger, fontSize: 16, fontWeight: '600' },
});
