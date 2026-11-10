import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

type FormScreenProps = {
  title: string;
  intro?: string;
  children: ReactNode;
};

/** A scrollable, keyboard-aware screen with a title, for short forms. */
export function FormScreen({ title, intro, children }: FormScreenProps) {
  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <KeyboardAvoidingView
          style={styles.fill}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled">
            <ThemedText type="subtitle">{title}</ThemedText>
            {intro && <ThemedText themeColor="textSecondary">{intro}</ThemedText>}
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

/** Shows an error message in a consistent style, or nothing. */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <ThemedText accessibilityRole="alert" style={styles.error}>
      {message}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: Spacing.four,
    padding: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  error: {
    color: '#D93025',
  },
});
