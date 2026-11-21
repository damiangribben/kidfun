import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { FormError } from '@/components/form-screen';
import { ScrollScreen } from '@/components/scroll-screen';
import { Button } from '@/components/ui/button';
import { ChipGroup } from '@/components/ui/chip-group';
import { SwitchField } from '@/components/ui/switch-field';
import { TextField } from '@/components/ui/text-field';
import { errorMessage, listPlaces, type Place } from '@/lib/family';
import { deleteToy, getToy, saveToy, TOY_CATEGORIES, type ToyCategory } from '@/lib/toys';

export default function ToyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [places, setPlaces] = useState<Place[]>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ToyCategory>('other');
  const [placeId, setPlaceId] = useState('');
  const [locationHint, setLocationHint] = useState('');
  const [smallParts, setSmallParts] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getToy(id), listPlaces()])
      .then(([toy, loadedPlaces]) => {
        setPlaces(loadedPlaces);
        setName(toy.name);
        setCategory(
          TOY_CATEGORIES.find((c) => c.value === toy.category)?.value ?? 'other',
        );
        setPlaceId(toy.place_id);
        setLocationHint(toy.location_hint ?? '');
        setSmallParts(toy.small_parts);
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [id]);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await saveToy(id, {
        name: name.trim(),
        category,
        place_id: placeId,
        location_hint: locationHint.trim() || null,
        small_parts: smallParts,
      });
      router.back();
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  function confirmDelete() {
    Alert.alert(`Remove ${name}?`, 'It will also be untagged from any ideas in your library.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await deleteToy(id);
            router.back();
          } catch (e) {
            setError(errorMessage(e));
            setBusy(false);
          }
        },
      },
    ]);
  }

  return (
    <ScrollScreen loading={loading}>
      <TextField label="Name" value={name} onChangeText={setName} maxLength={80} />
      <ChipGroup label="Category" options={TOY_CATEGORIES} value={category} onChange={setCategory} />
      <ChipGroup
        label="Where it's kept"
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
      <SwitchField
        label="Small parts"
        hint="Pieces small enough to choke an under-3"
        value={smallParts}
        onChange={setSmallParts}
      />
      <FormError message={error} />
      <Button title="Save" onPress={save} busy={busy} disabled={name.trim().length === 0} />
      <Button title="Remove toy" variant="danger" onPress={confirmDelete} disabled={busy} />
    </ScrollScreen>
  );
}
