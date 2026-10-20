import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

export const colors = {
  bg: '#FFFFFF',
  text: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
  primary: '#F97316',
  primaryText: '#FFFFFF',
  danger: '#DC2626',
};

export function Screen({ children }: { children?: ReactNode }) {
  return <View style={styles.screen}>{children}</View>;
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Muted({ children }: { children: ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>;
}

export function Button(props: { title: string; onPress: () => void; disabled?: boolean; loading?: boolean; variant?: 'primary' | 'ghost' }) {
  const ghost = props.variant === 'ghost';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={props.onPress}
      disabled={props.disabled || props.loading}
      style={({ pressed }) => [
        styles.button,
        ghost && styles.buttonGhost,
        (pressed || props.disabled) && { opacity: 0.6 },
      ]}
    >
      {props.loading ? (
        <ActivityIndicator color={ghost ? colors.primary : colors.primaryText} />
      ) : (
        <Text style={[styles.buttonText, ghost && { color: colors.primary }]}>{props.title}</Text>
      )}
    </Pressable>
  );
}

export function Input(props: TextInputProps) {
  return <TextInput placeholderTextColor={colors.muted} {...props} style={[styles.input, props.style]} />;
}

export function Loading() {
  return (
    <View style={[styles.screen, { justifyContent: 'center' }]}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: 20, gap: 12 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  muted: { fontSize: 15, color: colors.muted },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary },
  buttonText: { color: colors.primaryText, fontSize: 16, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
});
