import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { brutal, Fonts, Palette, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TextFieldProps = TextInputProps & {
  label: string;
};

export function TextField({ label, style, ...rest }: TextFieldProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrapper}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, brutal({ radius: 10, shadow: 3 }), { color: theme.text }, style]}
        {...rest}
      />
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
    fontFamily: Fonts.body,
    fontSize: 16,
    backgroundColor: Palette.white,
  },
});
