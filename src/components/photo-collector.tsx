import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { FormError } from '@/components/form-screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage } from '@/lib/family';
import { MAX_PHOTOS, pickPhotos, type PreparedPhoto } from '@/lib/photos';

type PhotoCollectorProps = {
  /** Button text for sending, given the number of photos. */
  submitLabel: (count: number) => string;
  /** Shown on the submit button while the photos are being looked at. */
  busyLabel: string;
  busy: boolean;
  onSubmit: (photos: PreparedPhoto[]) => void;
  onCancel?: () => void;
};

/**
 * Builds up a small batch of photos (taken one by one, or several chosen from the
 * gallery), shows them as thumbnails that can be removed, then sends them together.
 */
export function PhotoCollector({ submitLabel, busyLabel, busy, onSubmit, onCancel }: PhotoCollectorProps) {
  const theme = useTheme();
  const [photos, setPhotos] = useState<PreparedPhoto[]>([]);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const room = MAX_PHOTOS - photos.length;
  const locked = busy || adding;

  async function add(source: 'camera' | 'library') {
    setAdding(true);
    setError(null);
    try {
      const picked = await pickPhotos(source, room);
      setPhotos((current) => [...current, ...picked].slice(0, MAX_PHOTOS));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setAdding(false);
    }
  }

  return (
    <View style={styles.wrapper}>
      {photos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
          {photos.map((photo, i) => (
            <View key={photo.uri}>
              <Image
                source={{ uri: photo.uri }}
                style={styles.thumb}
                contentFit="cover"
                accessibilityLabel={`Photo ${i + 1}`}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove photo ${i + 1}`}
                onPress={() => setPhotos((current) => current.filter((p) => p.uri !== photo.uri))}
                disabled={locked}
                hitSlop={8}
                style={[styles.remove, { backgroundColor: theme.text }]}>
                <ThemedText type="smallBold" style={{ color: theme.background }}>
                  ×
                </ThemedText>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      <ThemedText type="small" themeColor="textSecondary">
        {photos.length === 0
          ? `Take or choose up to ${MAX_PHOTOS} photos, e.g. each shelf or box.`
          : room > 0
          ? `${photos.length} of ${MAX_PHOTOS} photos. Add more or send them.`
          : `That's the maximum of ${MAX_PHOTOS} photos.`}
      </ThemedText>

      <View style={styles.row}>
        <View style={styles.flex}>
          <Button
            title={photos.length === 0 ? 'Take a photo' : 'Take another'}
            variant={photos.length === 0 ? 'primary' : 'secondary'}
            onPress={() => add('camera')}
            disabled={locked || room === 0}
          />
        </View>
        <View style={styles.flex}>
          <Button
            title="From gallery"
            variant="secondary"
            onPress={() => add('library')}
            disabled={locked || room === 0}
          />
        </View>
      </View>

      <FormError message={error} />
      {photos.length > 0 && (
        <Button
          title={busy ? busyLabel : submitLabel(photos.length)}
          onPress={() => onSubmit(photos)}
          busy={busy}
          disabled={adding}
        />
      )}
      {onCancel && <Button title="Cancel" variant="secondary" onPress={onCancel} disabled={busy} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.two,
  },
  thumbs: {
    gap: Spacing.two,
    paddingTop: Spacing.two,
    paddingRight: Spacing.two,
  },
  thumb: {
    width: 88,
    height: 88,
    borderRadius: Spacing.two,
  },
  remove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
});
