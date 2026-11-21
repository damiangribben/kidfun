import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, Palette, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'title'
    | 'small'
    | 'smallBold'
    | 'subtitle'
    | 'cardTitle'
    | 'link'
    | 'linkPrimary'
    | 'code';
  themeColor?: ThemeColor;
};

/**
 * Headings and labels (title, subtitle, cardTitle, smallBold) use Fredoka in
 * capitals; everything else uses Lexend.
 */
export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return <Text style={[{ color: theme[themeColor ?? 'text'] }, styles[type], style]} {...rest} />;
}

const display = {
  fontFamily: Fonts.display,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
} as const;

const styles = StyleSheet.create({
  small: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  smallBold: {
    ...display,
    fontSize: 15,
    lineHeight: 20,
    color: Palette.ink,
  },
  default: {
    fontFamily: Fonts.body,
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    ...display,
    fontSize: 40,
    lineHeight: 46,
  },
  subtitle: {
    ...display,
    fontSize: 34,
    lineHeight: 40,
  },
  cardTitle: {
    ...display,
    fontSize: 18,
    lineHeight: 24,
  },
  link: {
    fontFamily: Fonts.body,
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    fontFamily: Fonts.bodyMedium,
    lineHeight: 30,
    fontSize: 14,
    color: Palette.blue,
  },
  code: {
    fontFamily: Fonts.mono,
    fontSize: 12,
  },
});
