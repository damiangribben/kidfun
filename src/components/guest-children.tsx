import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { ChipGroup } from '@/components/ui/chip-group';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { guestLabel, type GuestChild } from '@/lib/ideas';

const MAX_GUESTS = 6;

const GENDERS = [
  { value: 'boy', label: 'Boy' },
  { value: 'girl', label: 'Girl' },
  { value: 'unspecified', label: "Don't say" },
] as const;

const AGES = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));

type GuestChildrenProps = {
  guests: GuestChild[];
  onChange: (guests: GuestChild[]) => void;
};

/** Friends playing today: added on the spot, removable, never saved. */
export function GuestChildren({ guests, onChange }: GuestChildrenProps) {
  const theme = useTheme();
  const [adding, setAdding] = useState(false);
  const [gender, setGender] = useState<GuestChild['gender']>('unspecified');
  const [age, setAge] = useState<string | null>(null);

  function add() {
    if (!age) return;
    onChange([...guests, { gender, age: Number(age) }]);
    setAdding(false);
    setGender('unspecified');
    setAge(null);
  }

  return (
    <View style={styles.wrapper}>
      {guests.length > 0 && (
        <View style={styles.chips}>
          {guests.map((guest, i) => (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${guestLabel(guest)}`}
              onPress={() => onChange(guests.filter((_, j) => j !== i))}
              style={[styles.chip, { backgroundColor: theme.text }]}>
              <ThemedText type="small" style={{ color: theme.background }}>
                {guestLabel(guest)} ×
              </ThemedText>
            </Pressable>
          ))}
        </View>
      )}

      {adding ? (
        <ThemedView type="backgroundElement" style={styles.card}>
          <ChipGroup label="Friend is a" options={GENDERS} value={gender} onChange={setGender} />
          <ChipGroup label="Age" options={AGES} value={age ?? ''} onChange={setAge} />
          <View style={styles.row}>
            <View style={styles.flex}>
              <Button title="Cancel" variant="secondary" onPress={() => setAdding(false)} />
            </View>
            <View style={styles.flex}>
              <Button title="Add friend" onPress={add} disabled={!age} />
            </View>
          </View>
        </ThemedView>
      ) : (
        guests.length < MAX_GUESTS && (
          <Button title="+ Add a friend" variant="secondary" onPress={() => setAdding(true)} />
        )
      )}
      {guests.length > 0 && !adding && (
        <ThemedText type="small" themeColor="textSecondary">
          Friends are just for today and aren&apos;t saved. Tap one to remove them.
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.two,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: 18,
  },
  card: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
});
