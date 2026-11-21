import { Colors, Fonts, Palette } from '@/constants/theme';

/** Header styling for every stack screen: yellow bar, black back arrow, Fredoka title. */
export const stackHeader = {
  headerShadowVisible: false,
  headerStyle: { backgroundColor: Colors.light.background },
  headerTintColor: Palette.ink,
  headerTitleStyle: { fontFamily: Fonts.display, fontSize: 22, color: Colors.light.text },
} as const;

/** Header titles are shown in capitals, like every other heading. */
export const headerTitle = (title: string) => title.toUpperCase();
