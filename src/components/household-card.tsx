import { useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';

import { FormError } from '@/components/form-screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { errorMessage, setMyDisplayName, type Parent } from '@/lib/family';

function formatCode(code: string) {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/** Household name, invite code, the parent's own name and sign out. */
export function HouseholdCard({ parents }: { parents: Parent[] }) {
  const { session, household, signOut } = useAuth();
  const myUserId = session?.user.id;
  const [justSaved, setJustSaved] = useState<string | null>(null);
  const savedName = justSaved ?? parents.find((p) => p.userId === myUserId)?.displayName ?? '';
  // Null until the parent edits the field, so it shows the saved name once it loads.
  const [draft, setDraft] = useState<string | null>(null);
  const name = draft ?? savedName;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!household || !myUserId) return null;
  const code = formatCode(household.invite_code);
  const partnerJoined = parents.length > 1;

  async function saveName() {
    if (!myUserId) return;
    setBusy(true);
    setError(null);
    try {
      await setMyDisplayName(myUserId, name.trim());
      setJustSaved(name.trim());
      setDraft(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">{household.name}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Signed in as {session?.user.email}
      </ThemedText>

      <View style={styles.nameRow}>
        <View style={styles.flex}>
          <TextField
            label="Your name"
            value={name}
            onChangeText={setDraft}
            placeholder="e.g. Dad"
            maxLength={40}
            autoCapitalize="words"
          />
        </View>
        {name.trim() !== savedName && (
          <Button title="Save" onPress={saveName} busy={busy} variant="secondary" />
        )}
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        Play ideas use this when they give you a part.
      </ThemedText>

      {!partnerJoined && (
        <Card style={styles.card}>
          <ThemedText type="smallBold">Invite code</ThemedText>
          <ThemedText type="subtitle" selectable accessibilityLabel={code.split('').join(' ')}>
            {code}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Your partner signs in, then enters this code to join.
          </ThemedText>
          <Button
            title="Share code"
            variant="secondary"
            onPress={() =>
              Share.share({ message: `Join our household in Kidfun with code ${code}` })
            }
          />
        </Card>
      )}

      <FormError message={error} />
      <Button title="Sign out" variant="secondary" onPress={signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
  card: {
    gap: Spacing.two,
  },
});
