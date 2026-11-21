import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { brutal, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/lib/dates';

type DateFieldProps = {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  /** Where the picker opens when no date is set yet. */
  initialDate: Date;
  maximumDate?: Date;
};

export function DateField({ label, value, onChange, initialDate, maximumDate }: DateFieldProps) {
  const theme = useTheme();

  function openAndroidPicker() {
    DateTimePickerAndroid.open({
      value: value ?? initialDate,
      mode: 'date',
      maximumDate,
      onValueChange: (_event, date) => onChange(date),
    });
  }

  const showInlineIosPicker = Platform.OS === 'ios' && value !== null;

  return (
    <View style={styles.wrapper}>
      <ThemedText type="smallBold">{label}</ThemedText>
      {showInlineIosPicker ? (
        <DateTimePicker
          value={value}
          mode="date"
          display="compact"
          maximumDate={maximumDate}
          onValueChange={(_event, date) => onChange(date)}
          style={styles.iosPicker}
        />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${value ? formatDate(value) : 'not set'}`}
          onPress={Platform.OS === 'ios' ? () => onChange(initialDate) : openAndroidPicker}
          style={[styles.input, brutal({ radius: 10, shadow: 3 }), { backgroundColor: theme.backgroundElement }]}>
          <ThemedText themeColor={value ? 'text' : 'textSecondary'}>
            {value ? formatDate(value) : 'Choose a date'}
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.two,
  },
  input: {
    minHeight: 52,
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
  },
  iosPicker: {
    alignSelf: 'flex-start',
  },
});
