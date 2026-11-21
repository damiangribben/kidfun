import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { brutal, Fonts, Palette, Spacing } from '@/constants/theme';
import type { Rating } from '@/lib/ideas';

type ThumbsProps = {
  myRating: number;
  score: number;
  onRate: (rating: Rating) => void;
  disabled?: boolean;
};

/** Thumbs up/down for an idea: green or red when chosen. Tapping your choice again clears it. */
export function Thumbs({ myRating, score, onRate, disabled }: ThumbsProps) {
  function thumb(value: 1 | -1, emoji: string, label: string, colour: string) {
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
          brutal({ radius: 12, shadow: 3, border: 2.5 }),
          { backgroundColor: selected ? colour : Palette.white },
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
      {thumb(1, '👍', 'Thumbs up', Palette.green)}
      {thumb(-1, '👎', 'Thumbs down', Palette.red)}
      <ThemedText style={styles.score} accessibilityLabel={`Score ${score}`}>
        {score > 0 ? `+${score}` : score}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
  },
  label: {
    flex: 1,
  },
  thumb: {
    width: 52,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 20,
    lineHeight: 26,
  },
  score: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    minWidth: 20,
  },
  dimmed: {
    opacity: 0.5,
  },
});
