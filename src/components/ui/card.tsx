import { StyleSheet, View, type ViewProps } from 'react-native';

import { brutal, Palette, Spacing } from '@/constants/theme';

/** A white outlined panel with a hard shadow, for grouping related content. */
export function Card({ style, ...rest }: ViewProps) {
  return <View style={[styles.card, brutal({ radius: 18 }), style]} {...rest} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.white,
    padding: Spacing.three,
    gap: Spacing.three,
  },
});
