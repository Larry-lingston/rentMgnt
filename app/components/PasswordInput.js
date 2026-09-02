import { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../constants/theme';

export function PasswordInput({
  value,
  onChangeText,
  placeholder = 'Password',
  style,
  inputStyle,
  withIcon = false,
  ...rest
}) {
  const [visible, setVisible] = useState(false);

  const field = (
    <TextInput
      style={[withIcon ? styles.inputWithIcon : styles.input, inputStyle]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={COLORS.textLight}
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      {...rest}
    />
  );

  const toggle = (
    <TouchableOpacity
      style={withIcon ? styles.eyeInWrap : styles.eyeButton}
      onPress={() => setVisible((current) => !current)}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityLabel={visible ? 'Hide password' : 'Show password'}
    >
      <Ionicons
        name={visible ? 'eye-off-outline' : 'eye-outline'}
        size={20}
        color={COLORS.textLight}
      />
    </TouchableOpacity>
  );

  if (withIcon) {
    return (
      <View style={[styles.wrapWithIcon, style]}>
        <Ionicons name="lock-closed-outline" size={20} color={COLORS.textLight} style={styles.leftIcon} />
        {field}
        {toggle}
      </View>
    );
  }

  return (
    <View style={[styles.wrap, style]}>
      {field}
      {toggle}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.card,
  },
  wrapWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
  },
  leftIcon: { marginLeft: 14 },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  inputWithIcon: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  eyeButton: {
    paddingRight: 14,
    paddingLeft: 4,
  },
  eyeInWrap: {
    paddingRight: 14,
    paddingLeft: 4,
  },
});
