import { Stack } from 'expo-router';

import { headerTitle, stackHeader } from '@/constants/navigation';

export default function ToysLayout() {
  return (
    <Stack screenOptions={stackHeader}>
      <Stack.Screen name="index" options={{ title: headerTitle('Toys') }} />
      <Stack.Screen name="add" options={{ title: headerTitle('Add toys') }} />
      <Stack.Screen name="toy" options={{ title: headerTitle('Edit toy') }} />
    </Stack>
  );
}
