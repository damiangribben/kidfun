import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Thumbs } from '@/components/thumbs';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/card';
import type { Idea, Rating } from '@/lib/ideas';

type IdeaCardProps = {
  idea: Idea;
  onOpen: () => void;
  onRate: (rating: Rating) => void;
  busy?: boolean;
  /** Toys the idea needs that weren't picked this time. */
  missingToys?: string[];
};

/** A compact idea with its pitch and toys, thumbs, and a button to open it. */
export function IdeaCard({ idea, onOpen, onRate, busy, missingToys }: IdeaCardProps) {

  return (
    <Card style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityHint="Opens the full idea"
        onPress={onOpen}
        style={({ pressed }) => [styles.body, pressed && styles.pressed]}>
        <ThemedText type="cardTitle">
          {idea.name}
        </ThemedText>
        <ThemedText>{idea.pitch}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {idea.content.toys.map((t) => t.name).join(' · ')}
        </ThemedText>
        {missingToys && missingToys.length > 0 && (
          <ThemedText type="small" themeColor="textSecondary">
            Also needs: {missingToys.join(', ')}
          </ThemedText>
        )}
        {idea.supervise_closely && (
          <ThemedText type="small" themeColor="textSecondary">
            Supervise closely: small parts
          </ThemedText>
        )}
      </Pressable>
      <Thumbs myRating={idea.myRating} score={idea.score} onRate={onRate} disabled={busy} />
      <Button title="View the full idea" onPress={onOpen} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
  },
  body: {
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
