import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/theme';
import { validateProfile, trim } from '../../utils/validation';
import { ChangePasswordModal } from '../../components/ChangePasswordModal';

export default function SeekerProfileScreen() {
  const { user, logout, updateProfile, changePassword } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '', phone: user?.phone || '',
  });
  const [loading, setLoading] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);

  async function handleSave() {
    const error = validateProfile(form);
    if (error) {
      Alert.alert('Error', error);
      return;
    }
    setLoading(true);
    try {
      await updateProfile({
        name: trim(form.name),
        email: trim(form.email),
        phone: trim(form.phone) || null,
      });
      Alert.alert('Success', 'Profile updated');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); router.replace('/login'); } },
    ]);
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{user?.name?.charAt(0)}</Text></View>
        <Text style={styles.role}>Renter Account</Text>
      </View>

      {['name', 'email', 'phone'].map((field) => (
        <View key={field}>
          <Text style={styles.label}>{field.charAt(0).toUpperCase() + field.slice(1)}</Text>
          <TextInput
            style={styles.input}
            value={form[field]}
            onChangeText={(v) => setForm((p) => ({ ...p, [field]: v }))}
            keyboardType={field === 'email' ? 'email-address' : field === 'phone' ? 'phone-pad' : 'default'}
            autoCapitalize={field === 'email' ? 'none' : 'words'}
          />
        </View>
      ))}

      <TouchableOpacity style={styles.changePasswordButton} onPress={() => setPasswordModalVisible(true)}>
        <Ionicons name="key-outline" size={20} color={COLORS.primary} />
        <Text style={styles.changePasswordText}>Change Password</Text>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
        <Text style={styles.saveText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <ChangePasswordModal
        visible={passwordModalVisible}
        onClose={() => setPasswordModalVisible(false)}
        onChangePassword={changePassword}
        accentColor={COLORS.primary}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
  header: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  avatarText: { color: COLORS.white, fontSize: 28, fontWeight: '700' },
  role: { fontSize: 14, color: COLORS.textLight },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 14, fontSize: 16, backgroundColor: COLORS.card },
  changePasswordButton: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, padding: 16, marginTop: 20,
  },
  changePasswordText: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text },
  saveButton: { backgroundColor: COLORS.primary, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 16 },
  saveText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  logoutButton: { alignItems: 'center', padding: 16, marginTop: 12, marginBottom: 40 },
  logoutText: { color: COLORS.danger, fontSize: 16, fontWeight: '600' },
});
