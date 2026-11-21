import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { brutal, Palette, Spacing } from '@/constants/theme';

type SwitchFieldProps = {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

/** A label with an outlined on/off toggle: green when on. */
export function SwitchField({ label, hint, value, onChange }: SwitchFieldProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={styles.row}>
      <View style={styles.text}>
        <ThemedText>{label}</ThemedText>
        {hint && (
          <ThemedText type="small" themeColor="textSecondary">
            {hint}
          </ThemedText>
        )}
      </View>
      <View
        style={[
          styles.track,
          brutal({ radius: 16, shadow: 2, border: 2.5 }),
          { backgroundColor: value ? Palette.green : Palette.white, alignItems: value ? 'flex-end' : 'flex-start' },
        ]}>
        <View style={styles.knob} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  text: {
    flex: 1,
  },
  track: {
    width: 56,
    height: 34,
    padding: 3,
    justifyContent: 'center',
  },
  knob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: Palette.ink,
    backgroundColor: Palette.white,
  },
});
