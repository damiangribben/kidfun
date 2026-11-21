import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Chip } from '@/components/ui/chip';
import { Spacing } from '@/constants/theme';

type ChipOption<T extends string> = { value: T; label: string };

type ChipGroupProps<T extends string> = {
  label?: string;
  options: readonly ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

/** Single-choice chips that wrap onto new lines. */
export function ChipGroup<T extends string>({ label, options, value, onChange }: ChipGroupProps<T>) {
  return (
    <View style={styles.wrapper}>
      {label && <ThemedText type="smallBold">{label}</ThemedText>}
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.chips}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Chip
              key={option.value}
              label={option.label}
              selected={selected}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => onChange(option.value)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.two,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two + 2,
  },
});
