// src/shared/puzzle.ts

import { Puzzle } from "./types/api";

export { Puzzle } from "./types/api";

export async function getTodayPuzzle(): Promise<Puzzle> {
  try {
    const dateKey = new Date().toISOString().split("T")[0]; // e.g., "2025-09-19"
    const cachedPuzzle = await import("@devvit/web/context").then((ctx) => ctx.kv.get(`puzzle:${dateKey}`));
    if (cachedPuzzle) {
      return cachedPuzzle as Puzzle;
    }

    const puzzle = await fetchLivePuzzle();
    await import("@devvit/web/context").then((ctx) => ctx.kv.set(`puzzle:${dateKey}`, puzzle, { ttl: "24h" }));
    return puzzle;
  } catch (err) {
    console.error("API fetch failed, using fallback:", err);
    return getFallbackPuzzle();
  }
}

export function getFallbackPuzzle(): Puzzle {
  return {
    question: "What is the mascot of Reddit?",
    options: ["Snoo", "Alien", "Bot", "Meme"],
    answer: "Snoo",
  };
}

async function fetchLivePuzzle(): Promise<Puzzle> {
  const response = await fetch("https://opentdb.com/api.php?amount=1&type=multiple");
  const data = await response.json();

  if (!data || !data.results || data.results.length === 0) {
    throw new Error("No puzzle returned from API");
  }

  const puzzle = data.results[0];
  const options = [...puzzle.incorrect_answers, puzzle.correct_answer].sort(() => Math.random() - 0.5);

  return {
    question: decodeHtml(puzzle.question),
    options: options.map((opt: string) => decodeHtml(opt)),
    answer: decodeHtml(puzzle.correct_answer),
  };
}

function decodeHtml(text: string): string {
  const txt = typeof document !== "undefined" ? document.createElement("textarea") : null;
  if (txt) {
    txt.innerHTML = text;
    return txt.value;
  }
  return text.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, "&");
}
