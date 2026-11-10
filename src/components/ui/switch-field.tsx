import { StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type SwitchFieldProps = {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

export function SwitchField({ label, hint, value, onChange }: SwitchFieldProps) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <ThemedText>{label}</ThemedText>
        {hint && (
          <ThemedText type="small" themeColor="textSecondary">
            {hint}
          </ThemedText>
        )}
      </View>
      <Switch accessibilityLabel={label} value={value} onValueChange={onChange} />
    </View>
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
});
