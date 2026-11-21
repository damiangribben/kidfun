import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { brutal, Fonts, Palette, Spacing } from '@/constants/theme';

type Option<T extends string> = { value: T; label: string };

type SegmentedTabsProps<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
};

/** An outlined switch between a few in-screen tabs; the selected one is a blue block. */
export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: SegmentedTabsProps<T>) {
  return (
    <View accessibilityRole="tablist" style={[styles.track, brutal({ radius: 16 })]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            onPress={() => onChange(option.value)}
            style={[styles.tab, selected && [styles.selected, brutal({ radius: 10, shadow: 2, border: 2.5 })]]}>
            <ThemedText
              style={[styles.label, { color: selected ? Palette.white : '#5B6478' }]}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: Spacing.one + 2,
    gap: Spacing.one,
    backgroundColor: Palette.white,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: Palette.blue,
  },
  label: {
    fontFamily: Fonts.display,
    fontSize: 15,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
