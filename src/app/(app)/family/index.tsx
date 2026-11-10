import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FormError } from '@/components/form-screen';
import { ScrollScreen } from '@/components/scroll-screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { ListRow } from '@/components/ui/list-row';
import { Spacing } from '@/constants/theme';
import { ageLabel, parseDate } from '@/lib/dates';
import { errorMessage, listChildren, listPlaces, type Child, type Place } from '@/lib/family';

export default function FamilyScreen() {
  const [children, setChildren] = useState<Child[] | null>(null);
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reload whenever the screen comes back into view, e.g. after saving an edit.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([listChildren(), listPlaces()])
        .then(([loadedChildren, loadedPlaces]) => {
          if (!active) return;
          setChildren(loadedChildren);
          setPlaces(loadedPlaces);
          setError(null);
        })
        .catch((e) => active && setError(errorMessage(e)));
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <ScrollScreen loading={!error && (children === null || places === null)}>
      <FormError message={error} />

      <View style={styles.section}>
        <ThemedText type="smallBold">Children</ThemedText>
        {children?.length === 0 && (
          <ThemedText themeColor="textSecondary">
            Add your children so ideas can give each of them a role.
          </ThemedText>
        )}
        {children?.map((child) => (
          <ListRow
            key={child.id}
            title={child.name}
            subtitle={ageLabel(parseDate(child.birth_date))}
            onPress={() => router.push({ pathname: '/family/child', params: { id: child.id } })}
          />
        ))}
        <Button title="Add child" variant="secondary" onPress={() => router.push('/family/child')} />
      </View>

      <View style={styles.section}>
        <ThemedText type="smallBold">Places</ThemedText>
        <ThemedText themeColor="textSecondary">
          Where your toys live, like home or grandparents&apos;.
        </ThemedText>
        {places?.map((place) => (
          <ListRow
            key={place.id}
            title={place.name}
            subtitle={place.toyCount === 1 ? '1 toy' : `${place.toyCount} toys`}
            onPress={() => router.push({ pathname: '/family/place', params: { id: place.id } })}
          />
        ))}
        <Button title="Add place" variant="secondary" onPress={() => router.push('/family/place')} />
      </View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
});
