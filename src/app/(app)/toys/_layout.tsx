import { Stack } from 'expo-router';

export default function ToysLayout() {
  return (
    <Stack screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen name="index" options={{ title: 'Toys' }} />
      <Stack.Screen name="add" options={{ title: 'Add toys' }} />
      <Stack.Screen name="toy" options={{ title: 'Edit toy' }} />
    </Stack>
  );
}
