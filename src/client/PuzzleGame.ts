// src/client/PuzzleGame.ts

import { VStack, Text, Button, HStack, Image } from "@devvit/public-api";
import { usePuzzle } from "./hooks/usePuzzle";

export function PuzzleGame() {
  const { puzzle, loading, error, answered, isCorrect, submitAnswer, resetPuzzle, leaderboard, userStreak } = usePuzzle();

  if (loading) {
    return (
      <VStack alignment="center middle" padding="medium" backgroundColor="#f5f5f5">
        <Image src="snoo.png" width={100} height={100} animation="spin" />
        <Text size="large" weight="bold">Loading puzzle...</Text>
        <Text size="medium" color="gray">Fetching today's trivia...</Text>
      </VStack>
    );
  }

  if (!puzzle || error) {
    return (
      <VStack alignment="center middle" padding="medium" backgroundColor="#f5f5f5">
        <Image src="snoo.png" width={100} height={100} />
        <Text size="large" weight="bold">No puzzle available.</Text>
        <Text size="medium" color="red">{error || "Come back tomorrow for a new challenge!"}</Text>
      </VStack>
    );
  }

  return (
    <VStack alignment="center middle" gap="medium" padding="medium" backgroundColor="#f5f5f5">
      <Image src="snoo.png" width={120} height={120} />
      <Text size="xlarge" weight="bold" color="#d93900">
        🧩 Daily Reddit Trivia
      </Text>
      <Text size="medium" weight="regular" alignment="center">
        {puzzle.question}
      </Text>

      {!answered ? (
        <VStack gap="small" width="100%">
          {puzzle.options.map((opt) => (
            <Button
              key={opt}
              onPress={() => submitAnswer(opt)}
              appearance="primary"
              disabled={answered}
              size="large"
            >
              {opt}
            </Button>
          ))}
        </VStack>
      ) : (
        <VStack gap="small" alignment="center middle">
          <Text
            size="large"
            weight="bold"
            color={isCorrect ? "green" : "red"}
            animation={isCorrect ? "bounce" : "shake"}
          >
            {isCorrect ? `🎉 Correct! Streak: ${userStreak}` : "❌ Wrong, try again!"}
          </Text>
          <Button onPress={resetPuzzle} appearance="secondary" size="medium">
            Try Another Puzzle
          </Button>
        </VStack>
      )}

      {leaderboard.length > 0 && (
        <VStack gap="small" width="100%" marginTop="medium">
          <Text size="medium" weight="bold" color="#d93900">
            🏆 Top Players
          </Text>
          {leaderboard.map((entry, idx) => (
            <HStack key={idx} gap="small">
              <Text size="small">{idx + 1}. u/{entry.userId}</Text>
              <Text size="small" color="#d93900">{entry.score} points (Streak: {entry.streak})</Text>
            </HStack>
          ))}
        </VStack>
      )}

      <Text size="small" color="gray" marginTop="medium">
        Built for Reddit Devvit Hackathon 2025 ❤️
      </Text>
    </VStack>
  );
}
