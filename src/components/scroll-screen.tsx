import type { ReactNode } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

type ScrollScreenProps = {
  children: ReactNode;
  /** Shows a spinner instead of the content. */
  loading?: boolean;
};

/** A scrolling screen for pages inside a tab's stack (the stack header handles the top inset). */
export function ScrollScreen({ children, loading }: ScrollScreenProps) {
  return (
    <ThemedView style={styles.fill}>
      {loading ? (
        <ActivityIndicator style={styles.fill} />
      ) : (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}>
          {children}
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  content: {
    gap: Spacing.four,
    padding: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
});
