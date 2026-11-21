import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { brutal, Fonts, Palette, Spacing } from '@/constants/theme';

type ListRowProps = {
  title: string;
  subtitle?: string;
  onPress: () => void;
};

const SHADOW = 4;

export function ListRow({ title, subtitle, onPress }: ListRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      onPress={onPress}
      style={({ pressed }) => [styles.row, brutal({ radius: 14, shadow: SHADOW }), pressed && styles.pressed]}>
      <View style={styles.text}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        {subtitle && (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        )}
      </View>
      <ThemedText style={styles.chevron} importantForAccessibility="no">
        ›
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingLeft: Spacing.three + 4,
    paddingRight: Spacing.three,
    paddingVertical: Spacing.two + 4,
    backgroundColor: Palette.white,
  },
  pressed: {
    transform: [{ translateX: SHADOW }, { translateY: SHADOW }],
    boxShadow: [],
  },
  text: {
    flex: 1,
    gap: Spacing.half,
  },
  title: {
    fontFamily: Fonts.bodyBold,
    fontSize: 17,
  },
  chevron: {
    fontFamily: Fonts.bodyBold,
    fontSize: 26,
    lineHeight: 28,
    color: Palette.ink,
  },
});
