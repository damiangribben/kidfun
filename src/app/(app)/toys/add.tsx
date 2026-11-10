import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { FormError } from '@/components/form-screen';
import { ScrollScreen } from '@/components/scroll-screen';
import { ThemedText } from '@/components/themed-text';
import { ToyReview } from '@/components/toy-review';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { errorMessage, listPlaces, type Place } from '@/lib/family';
import { listToys, parseToyList, type DetectedToy, type Toy } from '@/lib/toys';

export default function AddToysScreen() {
  const { placeId } = useLocalSearchParams<{ placeId?: string }>();
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [existingToys, setExistingToys] = useState<Toy[]>([]);
  const [text, setText] = useState('');
  const [detected, setDetected] = useState<DetectedToy[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listPlaces(), listToys()])
      .then(([loadedPlaces, loadedToys]) => {
        setPlaces(loadedPlaces);
        setExistingToys(loadedToys);
      })
      .catch((e) => setError(errorMessage(e)));
  }, []);

  async function findToys() {
    setBusy(true);
    setError(null);
    try {
      setDetected(await parseToyList(text));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const initialPlaceId =
    places?.find((p) => p.id === placeId)?.id ??
    places?.find((p) => p.name === 'Home')?.id ??
    places?.[0]?.id;

  if (detected && places && initialPlaceId) {
    return (
      <ScrollScreen>
        <ToyReview
          detected={detected}
          places={places}
          initialPlaceId={initialPlaceId}
          existingToys={existingToys}
          onSaved={() => router.back()}
          onBack={() => setDetected(null)}
        />
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen loading={!error && places === null}>
      <TextField
        label="Your toys"
        value={text}
        onChangeText={setText}
        placeholder="e.g. Magna-Tiles, Duplo farm, wooden train set, Orchard Toys shopping list game"
        multiline
        maxLength={4000}
        style={styles.multiline}
      />
      <ThemedText type="small" themeColor="textSecondary">
        Type them in any format, or tap the microphone on your keyboard and say them out loud.
        You&apos;ll check them before anything is saved.
      </ThemedText>
      <FormError message={error} />
      <Button
        title={busy ? 'Finding toys…' : 'Find toys'}
        onPress={findToys}
        busy={busy}
        disabled={text.trim().length === 0 || !initialPlaceId}
      />
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  multiline: {
    minHeight: 160,
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
});
