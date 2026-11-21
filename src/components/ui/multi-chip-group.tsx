import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Chip } from '@/components/ui/chip';
import { Spacing } from '@/constants/theme';

type ChipOption = { value: string; label: string };

type MultiChipGroupProps = {
  label?: string;
  options: ChipOption[];
  values: string[];
  onChange: (values: string[]) => void;
};

/** Multiple-choice chips (tag-style) that wrap onto new lines. */
export function MultiChipGroup({ label, options, values, onChange }: MultiChipGroupProps) {
  function toggle(value: string) {
    onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);
  }

  return (
    <View style={styles.wrapper}>
      {label && <ThemedText type="smallBold">{label}</ThemedText>}
      <View accessibilityLabel={label} style={styles.chips}>
        {options.map((option) => {
          const selected = values.includes(option.value);
          return (
            <Chip
              key={option.value}
              label={selected ? `✓ ${option.label}` : option.label}
              selected={selected}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              onPress={() => toggle(option.value)}
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
