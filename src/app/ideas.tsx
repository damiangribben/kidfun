import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { FormError } from '@/components/form-screen';
import { IdeaCard } from '@/components/idea-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { errorMessage } from '@/lib/family';
import {
  generateIdeas,
  getIdeas,
  rateIdea,
  type Idea,
  type IdeaRequest,
  type Rating,
} from '@/lib/ideas';

function splitIds(value: string | undefined) {
  return value ? value.split(',').filter(Boolean) : [];
}

/**
 * Ideas for one request: matching ideas from the library first,
 * then any new ones from Claude, with "Something new" always available.
 */
export default function IdeasScreen() {
  const params = useLocalSearchParams<{ libraryIds?: string; newIds?: string; request: string }>();
  const [request] = useState<IdeaRequest>(() => JSON.parse(params.request));
  const [libraryIds] = useState(() => splitIds(params.libraryIds));
  const [newIds, setNewIds] = useState(() => splitIds(params.newIds));
  const [ideas, setIdeas] = useState<Map<string, Idea> | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reload on focus so changes made on the full idea show here too.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getIdeas([...libraryIds, ...newIds])
        .then((loaded) => active && setIdeas(new Map(loaded.map((i) => [i.id, i]))))
        .catch((e) => active && setError(errorMessage(e)));
      return () => {
        active = false;
      };
    }, [libraryIds, newIds]),
  );

  async function update(idea: Idea, change: () => Promise<Idea>) {
    setBusyId(idea.id);
    setError(null);
    try {
      const updated = await change();
      setIdeas((current) => new Map(current).set(updated.id, updated));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusyId(null);
    }
  }

  const rate = (idea: Idea, rating: Rating) => update(idea, () => rateIdea(idea, rating));

  async function somethingNew() {
    setGenerating(true);
    setError(null);
    try {
      const ids = await generateIdeas(request);
      setNewIds((current) => [...current, ...ids]);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setGenerating(false);
    }
  }

  function card(id: string) {
    const idea = ideas?.get(id);
    if (!idea) return null;
    const missing = idea.content.toys
      .filter((t) => !request.toyIds.includes(t.toy_id))
      .map((t) => t.name);
    return (
      <IdeaCard
        key={id}
        idea={idea}
        onOpen={() => router.push({ pathname: '/idea', params: { id } })}
        onRate={(rating) => rate(idea, rating)}
        busy={busyId === id}
        missingToys={missing}
      />
    );
  }

  return (
    <ThemedView style={styles.fill}>
      <Stack.Screen options={{ headerShown: true, title: 'Ideas', headerShadowVisible: false }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        {!ideas && !error && <ThemedText themeColor="textSecondary">Loading…</ThemedText>}

        {ideas && libraryIds.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="smallBold">From your library</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Ideas you&apos;ve had before with these toys, best rated first.
            </ThemedText>
            {libraryIds.map(card)}
          </View>
        )}

        {ideas && newIds.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="smallBold">New ideas</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Added to your library. Rate them after you play so the best ones come up first.
            </ThemedText>
            {newIds.map(card)}
          </View>
        )}

        <FormError message={error} />
        {ideas && (
          <Button
            title={generating ? 'Thinking up new ideas…' : 'Something new'}
            variant={newIds.length === 0 ? 'primary' : 'secondary'}
            onPress={somethingNew}
            busy={generating}
          />
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  content: {
    gap: Spacing.four,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  section: {
    gap: Spacing.three,
  },
});
