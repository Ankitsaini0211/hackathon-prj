// src/client/hooks/usePuzzle.ts

import { useState, useEffect } from "react";
import { Puzzle, getTodayPuzzle, getFallbackPuzzle } from "../../shared/puzzle";
import { CheckAnswerResponse, LeaderboardEntry } from "../../shared/types/api";

export function usePuzzle() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [loading, setLoading] = useState(true);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userStreak, setUserStreak] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const data = await getTodayPuzzle();
        setPuzzle(data);
      } catch (err) {
        console.error("Failed to fetch puzzle:", err);
        setPuzzle(getFallbackPuzzle());
        setError("Failed to load live puzzle, using fallback.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/leaderboard");
        const data: LeaderboardEntry[] = await response.json();
        setLeaderboard(data);
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      }
    })();
  }, []);

  const submitAnswer = async (guess: string) => {
    if (!puzzle) return;

    try {
      const response = await fetch("/checkAnswer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guess }),
      });
      const data: CheckAnswerResponse = await response.json();
      setIsCorrect(data.correct);
      setAnswered(true);

      if (data.correct) {
        setUserStreak((prev) => prev + 1);
        const leaderboardResponse = await fetch("/leaderboard");
        const leaderboardData: LeaderboardEntry[] = await leaderboardResponse.json();
        setLeaderboard(leaderboardData);
      } else {
        setUserStreak(0); // Reset streak on wrong answer
      }
    } catch (err) {
      console.error("Failed to check answer:", err);
      setError("Error checking answer, please try again.");
    }
  };

  const resetPuzzle = () => {
    setAnswered(false);
    setIsCorrect(false);
    setError(null);
  };

  return { puzzle, loading, error, answered, isCorrect, submitAnswer, resetPuzzle, leaderboard, userStreak };
}
