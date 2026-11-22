import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { FormError } from '@/components/form-screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { ChipGroup } from '@/components/ui/chip-group';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { errorMessage } from '@/lib/family';
import {
  addPlayLocation,
  customSetting,
  deletePlayLocation,
  listPlayLocations,
  SETTINGS,
  type PlayLocation,
  type Setting,
} from '@/lib/ideas';

type PlayLocationPickerProps = {
  value: Setting;
  onChange: (setting: Setting) => void;
};

/** "Where are you playing?": the built-in places plus the household's own, which can be added and removed. */
export function PlayLocationPicker({ value, onChange }: PlayLocationPickerProps) {
  const [locations, setLocations] = useState<PlayLocation[]>([]);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      listPlayLocations()
        .then((loaded) => active && setLocations(loaded))
        .catch((e) => active && setError(errorMessage(e)));
      return () => {
        active = false;
      };
    }, []),
  );

  async function add() {
    setBusy(true);
    setError(null);
    try {
      const location = await addPlayLocation(name);
      setLocations((current) => [...current, location].sort((a, b) => a.name.localeCompare(b.name)));
      onChange(customSetting(location));
      setName('');
      setEditing(false);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  function confirmRemove(location: PlayLocation) {
    Alert.alert(`Remove ${location.name}?`, 'Ideas you had there stay in your library.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setError(null);
          try {
            await deletePlayLocation(location.id);
            setLocations((current) => current.filter((l) => l.id !== location.id));
            if (value === customSetting(location)) onChange('indoors');
          } catch (e) {
            setError(errorMessage(e));
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.wrapper}>
      <ChipGroup
        label="Where are you playing?"
        options={[
          ...SETTINGS,
          ...locations.map((l) => ({ value: customSetting(l), label: l.name })),
        ]}
        value={value}
        onChange={onChange}
      />

      {editing ? (
        <Card>
          <TextField
            label="Somewhere else"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Beach, restaurant, train"
            maxLength={40}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={() => name.trim() && add()}
          />
          {locations.length > 0 && (
            <View style={styles.section}>
              <ThemedText type="small" themeColor="textSecondary">
                Your places. Tap one to remove it.
              </ThemedText>
              <View style={styles.chips}>
                {locations.map((l) => (
                  <Chip
                    key={l.id}
                    label={`${l.name} ×`}
                    selected={false}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${l.name}`}
                    onPress={() => confirmRemove(l)}
                  />
                ))}
              </View>
            </View>
          )}
          <FormError message={error} />
          <View style={styles.row}>
            <View style={styles.flex}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => {
                  setEditing(false);
                  setError(null);
                }}
                disabled={busy}
              />
            </View>
            <View style={styles.flex}>
              <Button title="Add" onPress={add} busy={busy} disabled={!name.trim()} />
            </View>
          </View>
        </Card>
      ) : (
        <>
          <FormError message={error} />
          <Button title="+ Somewhere else" variant="secondary" onPress={() => setEditing(true)} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.three,
  },
  section: {
    gap: Spacing.two,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two + 2,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
});
