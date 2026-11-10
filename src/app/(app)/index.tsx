import { Share, StyleSheet } from 'react-native';

import { FormScreen } from '@/components/form-screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

function formatCode(code: string) {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

export default function HomeScreen() {
  const { session, household, signOut } = useAuth();
  if (!household) return null;

  const code = formatCode(household.invite_code);

  return (
    <FormScreen title={household.name} intro={`Signed in as ${session?.user.email ?? ''}`}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="smallBold">Invite code</ThemedText>
        <ThemedText type="subtitle" selectable accessibilityLabel={code.split('').join(' ')}>
          {code}
        </ThemedText>
        <ThemedText themeColor="textSecondary">
          Your partner signs in, then enters this code to join.
        </ThemedText>
        <Button
          title="Share code"
          onPress={() =>
            Share.share({ message: `Join our household in the toy ideas app with code ${code}` })
          }
        />
      </ThemedView>
      <Button title="Sign out" variant="secondary" onPress={signOut} />
      <ThemedView style={{ height: BottomTabInset }} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Spacing.four,
  },
});
