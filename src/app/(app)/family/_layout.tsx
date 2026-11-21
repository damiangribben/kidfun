import { Stack } from 'expo-router';

import { headerTitle, stackHeader } from '@/constants/navigation';

export default function FamilyLayout() {
  return (
    <Stack screenOptions={stackHeader}>
      <Stack.Screen name="index" options={{ title: headerTitle('Family') }} />
      <Stack.Screen name="child" />
      <Stack.Screen name="place" />
    </Stack>
  );
}
