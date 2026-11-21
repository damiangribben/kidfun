import { Fredoka_600SemiBold } from '@expo-google-fonts/fredoka';
import {
  Lexend_400Regular,
  Lexend_500Medium,
  Lexend_600SemiBold,
  useFonts,
} from '@expo-google-fonts/lexend';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Colors, Palette } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/lib/auth';

SplashScreen.preventAutoHideAsync();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.light.background,
    card: Colors.light.background,
    text: Colors.light.text,
    primary: Palette.blue,
    border: Palette.ink,
  },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Fredoka_600SemiBold,
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
  });

  return (
    <ThemeProvider value={navigationTheme}>
      <AuthProvider>
        <RootNavigator fontsReady={fontsLoaded || !!fontError} />
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootNavigator({ fontsReady }: { fontsReady: boolean }) {
  const { loading, session, household } = useAuth();

  // Keep the native splash up until the fonts are in, so text never flashes in the wrong font.
  if (!fontsReady) return null;

  return (
    <>
      {/* The overlay hides the native splash, so wait until we know where to send the parent. */}
      {!loading && <AnimatedSplashOverlay />}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
        <Stack.Protected guard={!!session && !household}>
          <Stack.Screen name="household" />
        </Stack.Protected>
        <Stack.Protected guard={!!session && !!household}>
          <Stack.Screen name="(app)" />
          <Stack.Screen name="ideas" />
          <Stack.Screen name="idea" />
        </Stack.Protected>
      </Stack>
    </>
  );
}
