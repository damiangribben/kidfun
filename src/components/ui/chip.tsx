import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { brutal, Fonts, Palette, Spacing } from '@/constants/theme';

type ChipProps = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  selected: boolean;
};

const SHADOW = 3;

/** One outlined chip: yellow when selected, white otherwise. Shared by the chip groups. */
export function Chip({ label, selected, ...rest }: ChipProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.chip,
        brutal({ radius: 10, shadow: SHADOW, border: 2.5 }),
        { backgroundColor: selected ? Palette.yellow : Palette.white },
        pressed && styles.pressed,
      ]}
      {...rest}>
      <ThemedText style={[styles.label, { color: Palette.ink }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three - 2,
  },
  label: {
    fontFamily: Fonts.display,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pressed: {
    transform: [{ translateX: SHADOW }, { translateY: SHADOW }],
    boxShadow: [],
  },
});
