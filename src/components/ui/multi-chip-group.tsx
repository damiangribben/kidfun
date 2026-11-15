import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ChipOption = { value: string; label: string };

type MultiChipGroupProps = {
  label?: string;
  options: ChipOption[];
  values: string[];
  onChange: (values: string[]) => void;
};

/** Multiple-choice chips (tag-style) that wrap onto new lines. */
export function MultiChipGroup({ label, options, values, onChange }: MultiChipGroupProps) {
  const theme = useTheme();

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
            <Pressable
              key={option.value}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              onPress={() => toggle(option.value)}
              style={[
                styles.chip,
                { backgroundColor: selected ? theme.text : theme.backgroundElement },
              ]}>
              <ThemedText type="small" style={{ color: selected ? theme.background : theme.text }}>
                {selected ? `✓ ${option.label}` : option.label}
              </ThemedText>
            </Pressable>
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
    gap: Spacing.two,
  },
  chip: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: 18,
  },
});
