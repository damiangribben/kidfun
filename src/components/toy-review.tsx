import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { FormError } from '@/components/form-screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChipGroup } from '@/components/ui/chip-group';
import { SwitchField } from '@/components/ui/switch-field';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import type { Place } from '@/lib/family';
import { addToys, TOY_CATEGORIES, type DetectedToy, type Toy } from '@/lib/toys';

type ToyReviewProps = {
  detected: DetectedToy[];
  places: Place[];
  initialPlaceId: string;
  /** Used to flag toys that look like ones already in the inventory. */
  existingToys: Toy[];
  onSaved: () => void;
  onBack: () => void;
};

type Draft = DetectedToy & { key: number };

/** Lets the parent check and tidy up toys Claude found, then save them to a place. */
export function ToyReview({
  detected,
  places,
  initialPlaceId,
  existingToys,
  onSaved,
  onBack,
}: ToyReviewProps) {
  const [drafts, setDrafts] = useState<Draft[]>(() =>
    detected.map((toy, key) => ({ ...toy, key })),
  );
  const [placeId, setPlaceId] = useState(initialPlaceId);
  const [locationHint, setLocationHint] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existingNames = new Set(
    existingToys.filter((t) => t.place_id === placeId).map((t) => t.name.trim().toLowerCase()),
  );
  const valid = drafts.filter((d) => d.name.trim().length > 0);

  function update(key: number, changes: Partial<DetectedToy>) {
    setDrafts((current) => current.map((d) => (d.key === key ? { ...d, ...changes } : d)));
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await addToys(
        valid.map((d) => ({
          name: d.name.trim(),
          category: d.category,
          small_parts: d.small_parts,
          place_id: placeId,
          location_hint: locationHint.trim() || null,
        })),
      );
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t save the toys. Please try again.');
      setBusy(false);
    }
  }

  return (
    <>
      <ThemedText themeColor="textSecondary">
        {detected.length === 0
          ? 'Claude didn’t find any toys in that. Go back and try again.'
          : 'Check these over, fix anything that’s wrong and remove any you don’t want.'}
      </ThemedText>

      {drafts.map((draft) => (
        <Card key={draft.key} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.flex}>
              <TextField
                label="Name"
                value={draft.name}
                onChangeText={(name) => update(draft.key, { name })}
                maxLength={80}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove ${draft.name}`}
              onPress={() => setDrafts((current) => current.filter((d) => d.key !== draft.key))}
              hitSlop={8}
              style={styles.remove}>
              <ThemedText themeColor="textSecondary">Remove</ThemedText>
            </Pressable>
          </View>
          {existingNames.has(draft.name.trim().toLowerCase()) && (
            <ThemedText type="small" themeColor="textSecondary">
              Already in your inventory at this place.
            </ThemedText>
          )}
          <ChipGroup
            label="Category"
            options={TOY_CATEGORIES}
            value={draft.category}
            onChange={(category) => update(draft.key, { category })}
          />
          <SwitchField
            label="Small parts"
            hint="Pieces small enough to choke an under-3"
            value={draft.small_parts}
            onChange={(small_parts) => update(draft.key, { small_parts })}
          />
        </Card>
      ))}

      {drafts.length > 0 && (
        <>
          <ChipGroup
            label="Where are they kept?"
            options={places.map((p) => ({ value: p.id, label: p.name }))}
            value={placeId}
            onChange={setPlaceId}
          />
          <TextField
            label="Usually found (optional)"
            value={locationHint}
            onChangeText={setLocationHint}
            placeholder="e.g. playroom cupboard"
            maxLength={80}
          />
        </>
      )}

      <FormError message={error} />
      {valid.length > 0 && (
        <Button
          title={valid.length === 1 ? 'Save 1 toy' : `Save ${valid.length} toys`}
          onPress={save}
          busy={busy}
        />
      )}
      <Button title="Back to the list" variant="secondary" onPress={onBack} disabled={busy} />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.three,
  },
  flex: {
    flex: 1,
  },
  remove: {
    minHeight: 48,
    justifyContent: 'center',
  },
});
