import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FormError, FormScreen } from '@/components/form-screen';
import { ThemedText } from '@/components/themed-text';
import { ListRow } from '@/components/ui/list-row';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { errorMessage } from '@/lib/family';
import { listIdeas, type Idea } from '@/lib/ideas';

function subtitle(idea: Idea) {
  const score = idea.score > 0 ? `👍 +${idea.score}` : idea.score < 0 ? `👎 ${idea.score}` : null;
  return [score, (idea.content.toys.length ? idea.content.toys.map((t) => t.name).join(' · ') : 'No toys needed')].filter(Boolean).join('  ·  ');
}

/** Every idea you've had, best rated first. */
export default function LibraryScreen() {
  const [ideas, setIdeas] = useState<Idea[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      listIdeas()
        .then((loaded) => {
          if (!active) return;
          setIdeas(loaded);
          setError(null);
        })
        .catch((e) => active && setError(errorMessage(e)));
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <FormScreen title="Library" intro="Every idea you've had, best rated first.">
      <FormError message={error} />
      {!ideas && !error && <ThemedText themeColor="textSecondary">Loading…</ThemedText>}
      {ideas?.length === 0 && (
        <ThemedText themeColor="textSecondary">
          No ideas yet. Get some on the Play tab and they&apos;ll appear here.
        </ThemedText>
      )}
      <View style={styles.list}>
        {ideas?.map((idea) => (
          <ListRow
            key={idea.id}
            title={idea.name}
            subtitle={subtitle(idea)}
            onPress={() => router.push({ pathname: '/idea', params: { id: idea.id } })}
          />
        ))}
      </View>
      <View style={{ height: BottomTabInset }} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.two,
  },
});
