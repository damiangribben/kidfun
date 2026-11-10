import { Stack } from 'expo-router';

export default function FamilyLayout() {
  return (
    <Stack screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen name="index" options={{ title: 'Family' }} />
      <Stack.Screen name="child" />
      <Stack.Screen name="place" />
    </Stack>
  );
}
