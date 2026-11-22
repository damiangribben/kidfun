import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FormError, FormScreen } from '@/components/form-screen';
import { GuestChildren } from '@/components/guest-children';
import { PhotoCollector } from '@/components/photo-collector';
import { PlayLocationPicker } from '@/components/play-location-picker';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChipGroup } from '@/components/ui/chip-group';
import { MultiChipGroup } from '@/components/ui/multi-chip-group';
import { SegmentedTabs } from '@/components/ui/segmented-tabs';
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
import {
  generateIdeas,
  matchIdeas,
  type GuestChild,
  type IdeaRequest,
  type Setting,
} from '@/lib/ideas';
import type { PreparedPhoto } from '@/lib/photos';
import { addToys, listToys, spotToys, type SpottedToy, type Toy } from '@/lib/toys';

const MAX_TOYS = 60;
const ALL_PLACES = 'all';

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
  const [setting, setSetting] = useState<Setting>('indoors');
  const [childIds, setChildIds] = useState<string[] | null>(null);
  const [parentIds, setParentIds] = useState<string[] | null>(null);
  // Friends playing today only; kept in memory, never saved.
  const [guests, setGuests] = useState<GuestChild[]>([]);
  // Which place's toys are listed. Only filters the list; picks carry across places.
  const [toyPlace, setToyPlace] = useState<string | null>(null);
  const [toyIds, setToyIds] = useState<string[]>([]);
  const [situation, setSituation] = useState('');
  // "No toys" ignores any toy selection, so ideas need no toys at all.
  const [noToys, setNoToys] = useState(false);
  const [snapping, setSnapping] = useState(false);
  const [spotted, setSpotted] = useState<{
    matched: number;
    newToys: SpottedToy[];
  } | null>(null);
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

  // Reload on focus so new children, toys and places show up straight away.
  useFocusEffect(
    useCallback(() => {
      load()
        .then(() => setError(null))
        .catch((e) => setError(errorMessage(e)));
    }, [load]),
  );

  // Sensible defaults until the parent changes them: all children, just me, Home's toys.
  const chosenChildren = childIds ?? data?.children.map((c) => c.id) ?? [];
  const chosenParents = parentIds ?? (myUserId ? [myUserId] : []);
  const homeId = data?.places.find((p) => p.name === 'Home')?.id ?? data?.places[0]?.id ?? null;
  const currentToyPlace = toyPlace ?? homeId ?? ALL_PLACES;
  const placeFilterId = currentToyPlace === ALL_PLACES ? null : currentToyPlace;
  const shownToys = data?.toys.filter((t) => !placeFilterId || t.place_id === placeFilterId) ?? [];
  const chosenToys = toyIds.filter((id) => data?.toys.some((t) => t.id === id));
  const chosenElsewhere = chosenToys.filter((id) => !shownToys.some((t) => t.id === id)).length;
  const allShownChosen = shownToys.length > 0 && shownToys.every((t) => chosenToys.includes(t.id));

  function selectToys(ids: string[]) {
    setToyIds([...new Set(ids)].slice(0, MAX_TOYS));
  }

  function toggleShown() {
    const shownIds = shownToys.map((t) => t.id);
    selectToys(
      allShownChosen
        ? chosenToys.filter((id) => !shownIds.includes(id))
        : [...chosenToys, ...shownIds],
    );
  }

  async function matchPhotos(photos: PreparedPhoto[]) {
    setBusy('photo');
    setError(null);
    setSpotted(null);
    try {
      const found = await spotToys(
        photos.map((p) => p.base64),
        placeFilterId,
      );
      const matchedIds = found.flatMap((t) => (t.existing_toy_id ? [t.existing_toy_id] : []));
      selectToys([...chosenToys, ...matchedIds]);
      setSpotted({
        matched: matchedIds.length,
        newToys: found.filter((t) => !t.existing_toy_id),
      });
      setSnapping(false);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  // New toys from a photo go to the place being shown, or Home when showing all places.
  const newToyPlaceId = placeFilterId ?? homeId;
  const newToyPlaceName = data?.places.find((p) => p.id === newToyPlaceId)?.name;

  async function addSpottedToys() {
    if (!spotted || !newToyPlaceId) return;
    setBusy('adding');
    setError(null);
    try {
      const newIds = await addToys(
        spotted.newToys.map((t) => ({
          name: t.name,
          category: t.category,
          small_parts: t.small_parts,
          place_id: newToyPlaceId,
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

  // Library first: show earlier ideas for these toys and this setting if there
  // are any, otherwise ask Claude for new ones straight away.
  async function getIdeas() {
    setBusy('ideas');
    setError(null);
    const sentToys = noToys ? [] : chosenToys;
    try {
      const request: IdeaRequest = {
        setting,
        childIds: chosenChildren,
        guests,
        parentIds: chosenParents,
        toyIds: sentToys,
        situation: situation.trim() || undefined,
      };
      const libraryIds = await matchIdeas(sentToys, chosenChildren, setting);
      // Library ideas have no part for visiting friends, so ask for new ones too.
      const newIds =
        libraryIds.length === 0 || guests.length > 0 ? await generateIdeas(request) : [];
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
      <FormScreen
        title="Let's play"
        intro="First, add your children so ideas can give each of them a role.">
        <Button title="Add children" onPress={() => router.push('/family/child')} />
      </FormScreen>
    );
  }

  return (
    <FormScreen
      title="Let's play"
      intro="Pick where you are, who's playing and any toys you have, and Claude will come up with a few ideas.">
      {!data && !error && <ThemedText themeColor="textSecondary">Loading…</ThemedText>}
      {data && (
        <>
          <PlayLocationPicker value={setting} onChange={setSetting} />

          <View style={styles.section}>
            <MultiChipGroup
              label="Who's playing?"
              options={[
                ...data.children.map((c) => ({ value: c.id, label: c.name })),
                ...data.parents.map((p) => ({
                  value: p.userId,
                  label: parentLabel(p, myUserId),
                })),
              ]}
              values={[...chosenChildren, ...chosenParents]}
              onChange={(values) => {
                setChildIds(values.filter((v) => data.children.some((c) => c.id === v)));
                setParentIds(values.filter((v) => data.parents.some((p) => p.userId === v)));
              }}
            />
            <GuestChildren guests={guests} onChange={setGuests} />
          </View>

          {data.toys.length === 0 ? (
            <View style={styles.section}>
              <ThemedText type="smallBold">Which toys?</ThemedText>
              <ThemedText themeColor="textSecondary">No toys yet.</ThemedText>
              <Button
                title="Add toys"
                variant="secondary"
                onPress={() => router.push('/toys/add')}
              />
            </View>
          ) : (
            <View style={styles.section}>
              <ThemedText type="smallBold">Which toys?</ThemedText>
              <SegmentedTabs
                options={[
                  { value: 'with', label: 'With toys' },
                  { value: 'none', label: 'No toys' },
                ]}
                value={noToys ? 'none' : 'with'}
                onChange={(v) => {
                  setNoToys(v === 'none');
                  setSnapping(false);
                  setSpotted(null);
                }}
                disabled={busy !== null}
              />
              {noToys ? (
                <ThemedText type="small" themeColor="textSecondary">
                  You&apos;ll get games that need no toys at all, to suit where you are.
                </ThemedText>
              ) : (
                <>
                  <View style={styles.row}>
                    <View style={styles.flex}>
                      <Button
                        title={allShownChosen ? 'Clear' : 'Select all'}
                        variant="secondary"
                        onPress={toggleShown}
                        disabled={busy !== null || shownToys.length === 0}
                      />
                    </View>
                    <View style={styles.flex}>
                      <Button
                        title="Snap what's out"
                        variant="secondary"
                        onPress={() => {
                          setSpotted(null);
                          setSnapping(true);
                        }}
                        disabled={busy !== null || snapping}
                      />
                    </View>
                  </View>

                  {snapping && (
                    <Card style={styles.card}>
                      <ThemedText>
                        Photograph the toys you have with you, then Claude will select them.
                      </ThemedText>
                      <PhotoCollector
                        submitLabel={(n) =>
                          n === 1 ? 'Select toys in this photo' : `Select toys in ${n} photos`
                        }
                        busyLabel="Looking for toys…"
                        busy={busy === 'photo'}
                        onSubmit={matchPhotos}
                        onCancel={() => setSnapping(false)}
                      />
                    </Card>
                  )}

                  {spotted && (
                    <Card style={styles.card}>
                      <ThemedText>
                        {spotted.matched === 0
                          ? 'None of those are in your toys yet.'
                          : `Selected ${spotted.matched} ${spotted.matched === 1 ? 'toy' : 'toys'} from your photos.`}
                      </ThemedText>
                      {spotted.newToys.length > 0 && (
                        <>
                          <ThemedText type="small" themeColor="textSecondary">
                            Also spotted: {spotted.newToys.map((t) => t.name).join(', ')}
                          </ThemedText>
                          <Button
                            title={`Add these to ${newToyPlaceName ?? 'your toys'} and select them`}
                            onPress={addSpottedToys}
                            busy={busy === 'adding'}
                            disabled={busy !== null && busy !== 'adding'}
                          />
                        </>
                      )}
                      <Button
                        title="Dismiss"
                        variant="secondary"
                        onPress={() => setSpotted(null)}
                      />
                    </Card>
                  )}

                  {data.places.length > 1 && (
                    <ChipGroup
                      label="Toys from"
                      options={[
                        ...data.places.map((p) => ({
                          value: p.id,
                          label: p.name,
                        })),
                        { value: ALL_PLACES, label: 'All places' },
                      ]}
                      value={currentToyPlace}
                      onChange={(id) => {
                        setToyPlace(id);
                        setSpotted(null);
                      }}
                    />
                  )}

                  {shownToys.length === 0 ? (
                    <ThemedText themeColor="textSecondary">No toys kept here yet.</ThemedText>
                  ) : (
                    <MultiChipGroup
                      options={shownToys.map((t) => ({
                        value: t.id,
                        label: t.name,
                      }))}
                      values={chosenToys.filter((id) => shownToys.some((t) => t.id === id))}
                      onChange={(values) =>
                        selectToys([
                          ...chosenToys.filter((id) => !shownToys.some((t) => t.id === id)),
                          ...values,
                        ])
                      }
                    />
                  )}

                  <ThemedText type="small" themeColor="textSecondary">
                    {chosenToys.length === 0
                      ? 'Pick a few toys, or choose No toys above for games that need none.'
                      : `${chosenToys.length} ${chosenToys.length === 1 ? 'toy' : 'toys'} selected${
                          chosenElsewhere > 0
                            ? `, including ${chosenElsewhere} from other places`
                            : ''
                        }. Each idea uses a few of them.`}
                  </ThemedText>
                </>
              )}
            </View>
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
        disabled={!data || busy !== null || chosenChildren.length + guests.length === 0}
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
  },
});
