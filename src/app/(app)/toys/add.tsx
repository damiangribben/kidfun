import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FormError } from '@/components/form-screen';
import { ScrollScreen } from '@/components/scroll-screen';
import { ThemedText } from '@/components/themed-text';
import { ToyReview } from '@/components/toy-review';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { errorMessage, listPlaces, type Place } from '@/lib/family';
import { pickPhoto } from '@/lib/photos';
import {
  detectToysInPhoto,
  listToys,
  parseToyList,
  type DetectedToy,
  type Toy,
} from '@/lib/toys';

type Busy = 'list' | 'camera' | 'library' | null;

export default function AddToysScreen() {
  const { placeId } = useLocalSearchParams<{ placeId?: string }>();
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [existingToys, setExistingToys] = useState<Toy[]>([]);
  const [text, setText] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [detected, setDetected] = useState<DetectedToy[] | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listPlaces(), listToys()])
      .then(([loadedPlaces, loadedToys]) => {
        setPlaces(loadedPlaces);
        setExistingToys(loadedToys);
      })
      .catch((e) => setError(errorMessage(e)));
  }, []);

  async function findToysInList() {
    setBusy('list');
    setError(null);
    try {
      setPhotoUri(null);
      setDetected(await parseToyList(text));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function findToysInPhoto(source: 'camera' | 'library') {
    setBusy(source);
    setError(null);
    try {
      const photo = await pickPhoto(source);
      if (!photo) return;
      setPhotoUri(photo.uri);
      setDetected(await detectToysInPhoto(photo.base64));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  const initialPlaceId =
    places?.find((p) => p.id === placeId)?.id ??
    places?.find((p) => p.name === 'Home')?.id ??
    places?.[0]?.id;

  if (detected && places && initialPlaceId) {
    return (
      <ScrollScreen>
        {photoUri && (
          <Image
            source={{ uri: photoUri }}
            style={styles.photo}
            contentFit="cover"
            accessibilityLabel="The photo you took"
          />
        )}
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

  const ready = Boolean(initialPlaceId) && busy === null;

  return (
    <ScrollScreen loading={!error && places === null}>
      <View style={styles.section}>
        <ThemedText type="smallBold">From a photo</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Snap a shelf, toy box or cupboard and Claude will pick out the toys.
        </ThemedText>
        <Button
          title={busy === 'camera' ? 'Looking for toys…' : 'Take a photo'}
          onPress={() => findToysInPhoto('camera')}
          busy={busy === 'camera'}
          disabled={!ready}
        />
        <Button
          title={busy === 'library' ? 'Looking for toys…' : 'Choose a photo'}
          variant="secondary"
          onPress={() => findToysInPhoto('library')}
          busy={busy === 'library'}
          disabled={!ready}
        />
      </View>

      <View style={styles.section}>
        <ThemedText type="smallBold">From a list</ThemedText>
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
        </ThemedText>
        <Button
          title={busy === 'list' ? 'Finding toys…' : 'Find toys'}
          variant="secondary"
          onPress={findToysInList}
          busy={busy === 'list'}
          disabled={!ready || text.trim().length === 0}
        />
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        You&apos;ll check the toys before anything is saved.
      </ThemedText>
      <FormError message={error} />
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  multiline: {
    minHeight: 120,
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: Spacing.three,
  },
});
