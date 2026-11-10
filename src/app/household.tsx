import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FormError, FormScreen } from '@/components/form-screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { SegmentedTabs } from '@/components/ui/segmented-tabs';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function HouseholdScreen() {
  const { setHousehold, signOut } = useAuth();
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [name, setName] = useState('Our household');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'create' | 'join' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: 'create' | 'join') {
    setBusy(action);
    setError(null);
    const { data, error } =
      action === 'create'
        ? await supabase.rpc('create_household', { household_name: name.trim() })
        : await supabase.rpc('join_household', { code });
    setBusy(null);
    if (error) {
      setError(error.message);
      return;
    }
    setHousehold({ id: data.id, name: data.name, invite_code: data.invite_code });
  }

  return (
    <FormScreen
      title="Your household"
      intro="Toys, children and play ideas are shared by everyone in a household.">
      <SegmentedTabs
        options={[
          { value: 'create', label: 'Create new' },
          { value: 'join', label: 'Join with code' },
        ]}
        value={tab}
        onChange={(next) => {
          setTab(next);
          setError(null);
        }}
        disabled={busy !== null}
      />

      {tab === 'create' ? (
        <View style={styles.section}>
          <ThemedText themeColor="textSecondary">
            Start a household, then share its invite code with your partner.
          </ThemedText>
          <TextField label="Household name" value={name} onChangeText={setName} maxLength={60} />
          <Button
            title="Create household"
            onPress={() => run('create')}
            busy={busy === 'create'}
            disabled={busy !== null || name.trim().length === 0}
          />
        </View>
      ) : (
        <View style={styles.section}>
          <ThemedText themeColor="textSecondary">
            Enter the code shown on your partner&apos;s home screen.
          </ThemedText>
          <TextField
            label="Invite code"
            value={code}
            onChangeText={setCode}
            placeholder="ABCD-2345"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={12}
          />
          <Button
            title="Join household"
            onPress={() => run('join')}
            busy={busy === 'join'}
            disabled={busy !== null || code.replace(/[^A-Za-z0-9]/g, '').length !== 8}
          />
        </View>
      )}

      <FormError message={error} />
      <Button title="Sign out" variant="secondary" onPress={signOut} disabled={busy !== null} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.three,
  },
});
