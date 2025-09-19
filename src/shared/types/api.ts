// src/shared/types/api.ts

export interface Puzzle {
  question: string;
  options: string[];
  answer: string;
}

export interface CheckAnswerRequest {
  guess: string;
}

export interface CheckAnswerResponse {
  correct: boolean;
  message: string;
  answer?: string; // Included when correct
}

export interface LeaderboardEntry {
  userId: string;
  score: number;
  streak: number;
}
