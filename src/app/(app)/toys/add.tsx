import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { FormError } from '@/components/form-screen';
import { PhotoCollector } from '@/components/photo-collector';
import { ScrollScreen } from '@/components/scroll-screen';
import { ThemedText } from '@/components/themed-text';
import { ToyReview } from '@/components/toy-review';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Palette, Spacing } from '@/constants/theme';
import { errorMessage, listPlaces, type Place } from '@/lib/family';
import type { PreparedPhoto } from '@/lib/photos';
import {
  detectToysInPhotos,
  listToys,
  parseToyList,
  type DetectedToy,
  type Toy,
} from '@/lib/toys';

type Busy = 'list' | 'photos' | null;

export default function AddToysScreen() {
  const { placeId } = useLocalSearchParams<{ placeId?: string }>();
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [existingToys, setExistingToys] = useState<Toy[]>([]);
  const [text, setText] = useState('');
  const [photoUris, setPhotoUris] = useState<string[]>([]);
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
      setPhotoUris([]);
      setDetected(await parseToyList(text));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function findToysInPhotos(photos: PreparedPhoto[]) {
    setBusy('photos');
    setError(null);
    try {
      const found = await detectToysInPhotos(photos.map((p) => p.base64));
      setPhotoUris(photos.map((p) => p.uri));
      setDetected(found);
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
        {photoUris.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photos}>
            {photoUris.map((uri, i) => (
              <Image
                key={uri}
                source={{ uri }}
                style={photoUris.length === 1 ? styles.singlePhoto : styles.photo}
                contentFit="cover"
                accessibilityLabel={`Photo ${i + 1}`}
              />
            ))}
          </ScrollView>
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

  return (
    <ScrollScreen loading={!error && places === null}>
      <View style={styles.section}>
        <ThemedText type="smallBold">From photos</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Snap shelves, toy boxes or cupboards and Claude will pick out the toys.
        </ThemedText>
        <PhotoCollector
          submitLabel={(n) => (n === 1 ? 'Find toys in this photo' : `Find toys in ${n} photos`)}
          busyLabel="Looking for toys…"
          busy={busy === 'photos'}
          onSubmit={findToysInPhotos}
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
          disabled={!initialPlaceId || busy !== null || text.trim().length === 0}
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
  photos: {
    gap: Spacing.two,
  },
  photo: {
    width: 200,
    height: 150,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: Palette.ink,
  },
  singlePhoto: {
    width: 320,
    height: 240,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: Palette.ink,
  },
});
