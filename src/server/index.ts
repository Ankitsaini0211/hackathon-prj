// src/server/index.ts

import { Devvit, Context } from "@devvit/public-api";
import { getTodayPuzzle } from "../shared/puzzle";
import { CheckAnswerRequest, CheckAnswerResponse, LeaderboardEntry } from "../shared/types/api";

Devvit.configure({
  http: true,
  redditAPI: true,
});

Devvit.addCustomPostType({
  name: "DailyPuzzleGame",
  description: "A daily trivia game for Reddit",
  render: () => <block />, // Rendered by PuzzleGame.ts
});

// Auto-create daily puzzle post
Devvit.addTrigger({
  event: "AppInstall",
  async onEvent(_event, context: Context) {
    try {
      const subreddit = await context.reddit.getSubredditById(context.subredditId);
      await context.reddit.submitPost({
        subredditName: subreddit.name,
        title: "Daily Reddit Trivia - " + new Date().toLocaleDateString(),
        content: <block height="tall"><PuzzleGame /></block>,
      });
    } catch (error) {
      console.error("Error creating post on app install:", error);
    }
  },
});

Devvit.addTrigger({
  event: "MenuAction",
  actionId: "create-puzzle-post",
  async onEvent(_event, context: Context) {
    try {
      const subreddit = await context.reddit.getSubredditById(context.subredditId);
      const post = await context.reddit.submitPost({
        subredditName: subreddit.name,
        title: "Daily Reddit Trivia - " + new Date().toLocaleDateString(),
        content: <block height="tall"><PuzzleGame /></block>,
      });
      return { navigateTo: `https://reddit.com/r/${subreddit.name}/comments/${post.id}` };
    } catch (error) {
      console.error("Error creating post from menu:", error);
      throw new Error("Failed to create post");
    }
  },
});

Devvit.addMenuItem({
  location: "subreddit",
  label: "Create Daily Trivia Post",
  actionId: "create-puzzle-post",
});

Devvit.addEndpoint({
  name: "checkAnswer",
  method: "POST",
  onRequest: async (req, context) => {
    const body = req.body as CheckAnswerRequest;
    const puzzle = await getTodayPuzzle();

    if (!body?.guess) {
      return {
        correct: false,
        message: "No guess provided.",
      } as CheckAnswerResponse;
    }

    const guess = body.guess.trim().toLowerCase();
    const correct = guess === puzzle.answer.toLowerCase();

    if (context.userId) {
      const key = `score:${context.userId}`;
      if (correct) {
        await context.kv.incr(key, 1);
        await context.kv.incr(`${key}:streak`, 1);
      } else {
        await context.kv.set(`${key}:streak`, 0);
      }
    }

    return correct
      ? {
          correct: true,
          message: "🎉 Correct! You're a trivia master!",
          answer: puzzle.answer,
        }
      : {
          correct: false,
          message: "❌ Nope, try again!",
        };
  },
});

Devvit.addEndpoint({
  name: "leaderboard",
  method: "GET",
  onRequest: async (_req, context) => {
    const scores = await context.kv.getAll();
    const leaderboard: LeaderboardEntry[] = Object.entries(scores)
      .filter(([key]) => key.startsWith("score:") && !key.endsWith(":streak"))
      .map(([key, score]) => ({
        userId: key.replace("score:", ""),
        score: Number(score),
        streak: Number(scores[`${key}:streak`] || 0),
      }))
      .sort((a, b) => b.score - a.score || b.streak - a.streak)
      .slice(0, 5);

    return leaderboard;
  },
});

export default Devvit;
