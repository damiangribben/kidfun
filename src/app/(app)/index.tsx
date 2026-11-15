import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FormError, FormScreen } from '@/components/form-screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { ChipGroup } from '@/components/ui/chip-group';
import { MultiChipGroup } from '@/components/ui/multi-chip-group';
import { TextField } from '@/components/ui/text-field';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import {
  errorMessage,
  listChildren,
  listParents,
  listPlaces,
  parentLabel,
  type Child,
  type Parent,
  type Place,
} from '@/lib/family';
import { generateIdeas, matchSavedIdeas, type IdeaRequest } from '@/lib/ideas';
import { pickPhoto } from '@/lib/photos';
import { addToys, listToys, spotToysAtPlace, type SpottedToy, type Toy } from '@/lib/toys';

const MAX_TOYS = 60;

type Data = {
  children: Child[];
  parents: Parent[];
  places: Place[];
  toys: Toy[];
};

type Busy = 'ideas' | 'photo' | 'adding' | null;

export default function PlayScreen() {
  const { session } = useAuth();
  const myUserId = session?.user.id;
  const [data, setData] = useState<Data | null>(null);
  const [childIds, setChildIds] = useState<string[] | null>(null);
  const [parentIds, setParentIds] = useState<string[] | null>(null);
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [toyIds, setToyIds] = useState<string[]>([]);
  const [situation, setSituation] = useState('');
  const [spotted, setSpotted] = useState<{ matched: number; newToys: SpottedToy[] } | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [children, parents, places, toys] = await Promise.all([
      listChildren(),
      listParents(),
      listPlaces(),
      listToys(),
    ]);
    setData({ children, parents, places, toys });
  }, []);

  // Reload on focus so new children, toys, places and saved ideas show up straight away.
  useFocusEffect(
    useCallback(() => {
      load()
        .then(() => setError(null))
        .catch((e) => setError(errorMessage(e)));
    }, [load]),
  );

  // Sensible defaults until the parent changes them: all children, just me, at Home.
  const chosenChildren = childIds ?? data?.children.map((c) => c.id) ?? [];
  const chosenParents = parentIds ?? (myUserId ? [myUserId] : []);
  const currentPlaceId =
    placeId ?? data?.places.find((p) => p.name === 'Home')?.id ?? data?.places[0]?.id ?? null;
  const toysHere = data?.toys.filter((t) => t.place_id === currentPlaceId) ?? [];
  const chosenToys = toyIds.filter((id) => toysHere.some((t) => t.id === id));
  const allChosen = toysHere.length > 0 && chosenToys.length === Math.min(toysHere.length, MAX_TOYS);

  function selectToys(ids: string[]) {
    setToyIds([...new Set(ids)].slice(0, MAX_TOYS));
  }

  async function snapWhatsOut() {
    if (!currentPlaceId) return;
    setBusy('photo');
    setError(null);
    setSpotted(null);
    try {
      const photo = await pickPhoto('camera');
      if (!photo) return;
      const found = await spotToysAtPlace(photo.base64, currentPlaceId);
      const matchedIds = found.flatMap((t) => (t.existing_toy_id ? [t.existing_toy_id] : []));
      selectToys([...chosenToys, ...matchedIds]);
      setSpotted({ matched: matchedIds.length, newToys: found.filter((t) => !t.existing_toy_id) });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function addSpottedToys() {
    if (!spotted || !currentPlaceId) return;
    setBusy('adding');
    setError(null);
    try {
      const newIds = await addToys(
        spotted.newToys.map((t) => ({
          name: t.name,
          category: t.category,
          small_parts: t.small_parts,
          place_id: currentPlaceId,
        })),
      );
      await load();
      selectToys([...chosenToys, ...newIds]);
      setSpotted(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  // Library first: show saved ideas for these toys if there are any,
  // otherwise ask Claude for new ones straight away.
  async function getIdeas() {
    setBusy('ideas');
    setError(null);
    try {
      const request: IdeaRequest = {
        childIds: chosenChildren,
        parentIds: chosenParents,
        toyIds: chosenToys,
        situation: situation.trim() || undefined,
      };
      const libraryIds = await matchSavedIdeas(chosenToys, chosenChildren);
      const newIds = libraryIds.length === 0 ? await generateIdeas(request) : [];
      router.push({
        pathname: '/ideas',
        params: {
          libraryIds: libraryIds.join(','),
          newIds: newIds.join(','),
          request: JSON.stringify(request),
        },
      });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  if (data && data.children.length === 0) {
    return (
      <FormScreen title="Let's play" intro="First, add your children so ideas can give each of them a role.">
        <Button title="Add children" onPress={() => router.push('/family/child')} />
      </FormScreen>
    );
  }

  return (
    <FormScreen
      title="Let's play"
      intro="Pick who's playing and some toys, and Claude will come up with a few ideas.">
      {!data && !error && <ThemedText themeColor="textSecondary">Loading…</ThemedText>}
      {data && (
        <>
          <MultiChipGroup
            label="Who's playing?"
            options={[
              ...data.children.map((c) => ({ value: c.id, label: c.name })),
              ...data.parents.map((p) => ({ value: p.userId, label: parentLabel(p, myUserId) })),
            ]}
            values={[...chosenChildren, ...chosenParents]}
            onChange={(values) => {
              setChildIds(values.filter((v) => data.children.some((c) => c.id === v)));
              setParentIds(values.filter((v) => data.parents.some((p) => p.userId === v)));
            }}
          />

          {data.places.length > 1 && (
            <ChipGroup
              label="Where are you?"
              options={data.places.map((p) => ({ value: p.id, label: p.name }))}
              value={currentPlaceId ?? ''}
              onChange={(id) => {
                setPlaceId(id);
                setSpotted(null);
              }}
            />
          )}

          {toysHere.length === 0 ? (
            <View style={styles.section}>
              <ThemedText themeColor="textSecondary">No toys here yet.</ThemedText>
              <Button title="Add toys" variant="secondary" onPress={() => router.push('/toys/add')} />
            </View>
          ) : (
            <View style={styles.section}>
              <ThemedText type="smallBold">Which toys?</ThemedText>
              <View style={styles.row}>
                <View style={styles.flex}>
                  <Button
                    title={allChosen ? 'Clear' : 'Select all'}
                    variant="secondary"
                    onPress={() => selectToys(allChosen ? [] : toysHere.map((t) => t.id))}
                    disabled={busy !== null}
                  />
                </View>
                <View style={styles.flex}>
                  <Button
                    title={busy === 'photo' ? 'Looking…' : "Snap what's out"}
                    variant="secondary"
                    onPress={snapWhatsOut}
                    busy={busy === 'photo'}
                    disabled={busy !== null}
                  />
                </View>
              </View>
              <MultiChipGroup
                options={toysHere.map((t) => ({ value: t.id, label: t.name }))}
                values={chosenToys}
                onChange={selectToys}
              />
              <ThemedText type="small" themeColor="textSecondary">
                Each idea uses a few of the toys you pick, so select all to explore everything.
              </ThemedText>
            </View>
          )}

          {spotted && (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText>
                {spotted.matched === 0
                  ? 'None of those are in your inventory here yet.'
                  : `Selected ${spotted.matched} ${spotted.matched === 1 ? 'toy' : 'toys'} from your photo.`}
              </ThemedText>
              {spotted.newToys.length > 0 && (
                <>
                  <ThemedText type="small" themeColor="textSecondary">
                    Also spotted: {spotted.newToys.map((t) => t.name).join(', ')}
                  </ThemedText>
                  <Button
                    title="Add these to your toys and select them"
                    onPress={addSpottedToys}
                    busy={busy === 'adding'}
                    disabled={busy !== null && busy !== 'adding'}
                  />
                </>
              )}
              <Button title="Dismiss" variant="secondary" onPress={() => setSpotted(null)} />
            </ThemedView>
          )}

          <TextField
            label="Anything else? (optional)"
            value={situation}
            onChangeText={setSituation}
            placeholder="e.g. rainy afternoon, they're a bit tired"
            multiline
            maxLength={1000}
          />
        </>
      )}

      <FormError message={error} />
      <Button
        title={busy === 'ideas' ? 'Thinking up ideas…' : 'Get ideas'}
        onPress={getIdeas}
        busy={busy === 'ideas'}
        disabled={!data || busy !== null || chosenChildren.length === 0 || chosenToys.length === 0}
      />

      <View style={{ height: BottomTabInset }} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
  card: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
});
