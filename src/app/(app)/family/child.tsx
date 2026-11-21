import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

import { FormError } from '@/components/form-screen';
import { ScrollScreen } from '@/components/scroll-screen';
import { headerTitle } from '@/constants/navigation';
import { Button } from '@/components/ui/button';
import { DateField } from '@/components/ui/date-field';
import { TextField } from '@/components/ui/text-field';
import { parseDate, toDateString } from '@/lib/dates';
import { deleteChild, errorMessage, getChild, saveChild } from '@/lib/family';

function yearsAgo(years: number) {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date;
}

export default function ChildScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [loading, setLoading] = useState(Boolean(id));
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [favourites, setFavourites] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getChild(id)
      .then((child) => {
        setName(child.name);
        setBirthDate(parseDate(child.birth_date));
        setFavourites(child.favourites ?? '');
        setNotes(child.notes ?? '');
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [id]);

  async function save() {
    if (!birthDate) return;
    setBusy(true);
    setError(null);
    try {
      await saveChild(id, {
        name: name.trim(),
        birth_date: toDateString(birthDate),
        favourites: favourites.trim() || null,
        notes: notes.trim() || null,
      });
      router.back();
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  function confirmDelete() {
    if (!id) return;
    Alert.alert(`Remove ${name}?`, 'Ideas stay in the library.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await deleteChild(id);
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
      <Stack.Screen options={{ title: headerTitle(id ? 'Edit child' : 'Add child') }} />
      <TextField
        label="Name"
        value={name}
        onChangeText={setName}
        maxLength={40}
        autoCapitalize="words"
      />
      <DateField
        label="Date of birth"
        value={birthDate}
        onChange={setBirthDate}
        initialDate={yearsAgo(3)}
        maximumDate={new Date()}
      />
      <TextField
        label="Favourites (optional)"
        value={favourites}
        onChangeText={setFavourites}
        placeholder="e.g. Magna-Tiles, drawing, dinosaurs"
        multiline
        maxLength={500}
        style={styles.multiline}
      />
      <TextField
        label="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        placeholder="e.g. loves being in charge, gets frustrated with fiddly bits"
        multiline
        maxLength={1000}
        style={styles.multiline}
      />
      <FormError message={error} />
      <Button
        title="Save"
        onPress={save}
        busy={busy}
        disabled={name.trim().length === 0 || !birthDate}
      />
      {id && <Button title="Remove child" variant="secondary" onPress={confirmDelete} disabled={busy} />}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  multiline: {
    minHeight: 96,
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
});
