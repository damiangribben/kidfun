import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Rating } from '@/lib/ideas';

type ThumbsProps = {
  myRating: number;
  score: number;
  onRate: (rating: Rating) => void;
  disabled?: boolean;
};

/** Thumbs up/down for a saved idea. Tapping your current choice again clears it. */
export function Thumbs({ myRating, score, onRate, disabled }: ThumbsProps) {
  const theme = useTheme();

  function thumb(value: 1 | -1, emoji: string, label: string) {
    const selected = myRating === value;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected, disabled }}
        disabled={disabled}
        onPress={() => onRate(selected ? 0 : value)}
        style={[
          styles.thumb,
          { backgroundColor: selected ? theme.text : theme.backgroundSelected },
          disabled && styles.dimmed,
        ]}>
        <ThemedText style={styles.emoji}>{emoji}</ThemedText>
      </Pressable>
    );
  }

  return (
    <View style={styles.row}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
        Played it?
      </ThemedText>
      {thumb(1, '👍', 'Thumbs up')}
      {thumb(-1, '👎', 'Thumbs down')}
      <ThemedText type="small" themeColor="textSecondary" accessibilityLabel={`Score ${score}`}>
        {score > 0 ? `+${score}` : score}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  label: {
    flex: 1,
  },
  thumb: {
    width: 48,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 20,
  },
  dimmed: {
    opacity: 0.5,
  },
});
