import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FormError } from '@/components/form-screen';
import { ScrollScreen } from '@/components/scroll-screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { ChipGroup } from '@/components/ui/chip-group';
import { ListRow } from '@/components/ui/list-row';
import { Spacing } from '@/constants/theme';
import { errorMessage, listPlaces, type Place } from '@/lib/family';
import { categoryLabel, listToys, type Toy } from '@/lib/toys';

const ALL = 'all';

function toySubtitle(toy: Toy, showPlace: boolean) {
  return [
    categoryLabel(toy.category),
    showPlace ? toy.places?.name : null,
    toy.location_hint,
    toy.small_parts ? 'Small parts' : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

export default function ToysScreen() {
  const [toys, setToys] = useState<Toy[] | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [placeFilter, setPlaceFilter] = useState<string>(ALL);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([listToys(), listPlaces()])
        .then(([loadedToys, loadedPlaces]) => {
          if (!active) return;
          setToys(loadedToys);
          setPlaces(loadedPlaces);
          setError(null);
        })
        .catch((e) => active && setError(errorMessage(e)));
      return () => {
        active = false;
      };
    }, []),
  );

  const shown = toys?.filter((t) => placeFilter === ALL || t.place_id === placeFilter) ?? [];

  return (
    <ScrollScreen loading={!error && toys === null}>
      <FormError message={error} />
      <Button
        title="Add toys"
        onPress={() =>
          router.push({
            pathname: '/toys/add',
            params: placeFilter === ALL ? {} : { placeId: placeFilter },
          })
        }
      />

      {places.length > 1 && (
        <ChipGroup
          options={[
            { value: ALL, label: 'All places' },
            ...places.map((p) => ({ value: p.id, label: p.name })),
          ]}
          value={placeFilter}
          onChange={setPlaceFilter}
        />
      )}

      <View style={styles.list}>
        {toys?.length === 0 && (
          <ThemedText themeColor="textSecondary">
            No toys yet. Tap &quot;Add toys&quot; and type or dictate a quick list to get started.
          </ThemedText>
        )}
        {toys && toys.length > 0 && shown.length === 0 && (
          <ThemedText themeColor="textSecondary">No toys at this place yet.</ThemedText>
        )}
        {shown.map((toy) => (
          <ListRow
            key={toy.id}
            title={toy.name}
            subtitle={toySubtitle(toy, placeFilter === ALL && places.length > 1)}
            onPress={() => router.push({ pathname: '/toys/toy', params: { id: toy.id } })}
          />
        ))}
      </View>
      {shown.length > 0 && (
        <ThemedText type="small" themeColor="textSecondary">
          {shown.length === 1 ? '1 toy' : `${shown.length} toys`}
        </ThemedText>
      )}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.two,
  },
});
