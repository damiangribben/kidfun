import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { brutal, Fonts, Palette, Spacing } from '@/constants/theme';

type ButtonProps = {
  title: string;
  onPress: () => void;
  /** danger is red and only for destructive actions, such as deleting. */
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  busy?: boolean;
};

const SHADOW = 4;

/** A chunky outlined button that presses down into its shadow when tapped. */
export function Button({ title, onPress, variant = 'primary', disabled, busy }: ButtonProps) {
  const inactive = disabled || busy;
  const backgroundColor = { primary: Palette.blue, secondary: Palette.white, danger: Palette.red }[variant];
  const textColor = variant === 'secondary' ? Palette.blue : Palette.white;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        brutal({ shadow: SHADOW }),
        { backgroundColor },
        pressed && styles.pressed,
        inactive && styles.dimmed,
      ]}>
      {busy ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <ThemedText style={[styles.label, { color: textColor }]}>{title}</ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: Fonts.display,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  pressed: {
    transform: [{ translateX: SHADOW }, { translateY: SHADOW }],
    boxShadow: [],
  },
  dimmed: {
    opacity: 0.5,
  },
});
