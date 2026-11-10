import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { FormError } from '@/components/form-screen';
import { ScrollScreen } from '@/components/scroll-screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { deletePlace, errorMessage, getPlace, savePlace } from '@/lib/family';

export default function PlaceScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [loading, setLoading] = useState(Boolean(id));
  const [name, setName] = useState('');
  const [toyCount, setToyCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getPlace(id)
      .then((place) => {
        setName(place.name);
        setToyCount(place.toyCount);
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [id]);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await savePlace(id, name.trim());
      router.back();
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  function confirmDelete() {
    if (!id) return;
    Alert.alert(`Delete ${name}?`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await deletePlace(id);
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
      <Stack.Screen options={{ title: id ? 'Edit place' : 'Add place' }} />
      <TextField
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Granny's house"
        maxLength={40}
        autoCapitalize="words"
      />
      {id && (
        <ThemedText themeColor="textSecondary">
          {toyCount === 1 ? '1 toy is kept here.' : `${toyCount} toys are kept here.`}
        </ThemedText>
      )}
      <FormError message={error} />
      <Button title="Save" onPress={save} busy={busy} disabled={name.trim().length === 0} />
      {id && <Button title="Delete place" variant="secondary" onPress={confirmDelete} disabled={busy} />}
    </ScrollScreen>
  );
}
