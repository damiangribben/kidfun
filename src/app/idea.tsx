import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { FormError } from '@/components/form-screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { errorMessage } from '@/lib/family';
import { Thumbs } from '@/components/thumbs';
import { getIdea, rateIdea, type Idea, type Rating } from '@/lib/ideas';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">{title}</ThemedText>
      {children}
    </View>
  );
}

export default function IdeaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getIdea(id)
      .then(setIdea)
      .catch((e) => setError(errorMessage(e)));
  }, [id]);

  async function rate(rating: Rating) {
    if (!idea) return;
    setBusy(true);
    setError(null);
    try {
      setIdea(await rateIdea(idea, rating));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ThemedView style={styles.fill}>
      <Stack.Screen options={{ headerShown: true, title: 'Play idea', headerShadowVisible: false }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        {!idea && !error && <ThemedText themeColor="textSecondary">Loading…</ThemedText>}
        {idea && (
          <>
            <View style={styles.section}>
              <ThemedText type="subtitle">{idea.name}</ThemedText>
              <ThemedText style={styles.pitch}>“{idea.pitch}”</ThemedText>
            </View>

            <Thumbs myRating={idea.myRating} score={idea.score} onRate={rate} disabled={busy} />

            {idea.supervise_closely && (
              <ThemedView type="backgroundSelected" style={styles.banner}>
                <ThemedText type="smallBold">Supervise closely</ThemedText>
                <ThemedText type="small">
                  Some of these toys have small parts and a child under 3 is playing.
                </ThemedText>
              </ThemedView>
            )}

            <Section title="You'll need">
              {idea.content.toys.map((toy) => (
                <ThemedText key={toy.toy_id}>
                  • {toy.name}
                  {toy.location_hint ? (
                    <ThemedText themeColor="textSecondary"> ({toy.location_hint})</ThemedText>
                  ) : null}
                </ThemedText>
              ))}
            </Section>

            {idea.content.setup.length > 0 && (
              <Section title="Setting up">
                {idea.content.setup.map((step, i) => (
                  <ThemedText key={i}>
                    {i + 1}. {step}
                  </ThemedText>
                ))}
              </Section>
            )}

            {idea.content.child_roles.map((role) => (
              <Section key={role.child_id} title={role.name}>
                <ThemedText>{role.role}</ThemedText>
              </Section>
            ))}

            {idea.content.parent_role ? (
              <Section title="Your part">
                <ThemedText>{idea.content.parent_role}</ThemedText>
              </Section>
            ) : null}
          </>
        )}
        <FormError message={error} />
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
    gap: Spacing.two,
  },
  pitch: {
    fontSize: 20,
    lineHeight: 28,
  },
  banner: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
});
