import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PasswordInput } from './PasswordInput';
import { COLORS, RADIUS } from '../constants/theme';
import { validatePasswordChange } from '../utils/validation';

export function ChangePasswordModal({ visible, onClose, onChangePassword, accentColor = COLORS.primary }) {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleClose() {
    setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    onClose();
  }

  async function handleSubmit() {
    const error = validatePasswordChange(form);
    if (error) {
      Alert.alert('Error', error);
      return;
    }

    setLoading(true);
    try {
      await onChangePassword(form.currentPassword, form.newPassword);
      Alert.alert('Success', 'Your password has been changed.');
      handleClose();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={[styles.iconWrap, { backgroundColor: accentColor + '18' }]}>
                <Ionicons name="key-outline" size={24} color={accentColor} />
              </View>
              <Text style={styles.title}>Change Password</Text>
              <Text style={styles.subtitle}>Enter your current password, then choose a new one.</Text>
            </View>

            <Text style={styles.label}>Current password *</Text>
            <PasswordInput
              value={form.currentPassword}
              onChangeText={(v) => updateField('currentPassword', v)}
              placeholder="Enter current password"
            />

            <Text style={styles.label}>New password *</Text>
            <PasswordInput
              value={form.newPassword}
              onChangeText={(v) => updateField('newPassword', v)}
              placeholder="At least 6 characters"
            />

            <Text style={styles.label}>Confirm new password *</Text>
            <PasswordInput
              value={form.confirmPassword}
              onChangeText={(v) => updateField('confirmPassword', v)}
              placeholder="Re-enter new password"
            />

            <View style={styles.actions}>
              <TouchableOpacity onPress={handleClose} disabled={loading}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: accentColor }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={styles.submitText}>{loading ? 'Saving...' : 'Update Password'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  scroll: { flexGrow: 1, justifyContent: 'center' },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: 20,
  },
  header: { alignItems: 'center', marginBottom: 8 },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  subtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 8,
    lineHeight: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
    marginTop: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 16,
    marginTop: 24,
  },
  cancelText: { color: COLORS.textLight, fontSize: 15 },
  submitButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  submitText: { color: COLORS.white, fontWeight: '600', fontSize: 15 },
});
