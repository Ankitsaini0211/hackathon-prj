import { Devvit, Context, MenuItemOnPressEvent, SchedulerRunEvent } from '@devvit/public-api';
import { Direction, GameState, LeaderboardEntry, LeaderboardResponse, MoveRequest, MoveResponse } from '../shared/types';
import { generateRoomEvent } from '../shared/aiService';

const KV_KEYS = {
  state: (sub: string) => `state:${sub}`,
  leaderboard: (sub: string) => `leaderboard:${sub}`,
};

function getCurrentWeekNumberUtc(): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.floor(Date.now() / msPerWeek);
}

async function getOrInitState(ctx: Context, subredditName: string): Promise<GameState> {
  const stored = await ctx.kv.get<GameState>(KV_KEYS.state(subredditName));
  if (stored) return stored;
  const initial: GameState = {
    subredditName,
    currentLevel: createLevel(1),
    players: {},
    weekNumberUtc: getCurrentWeekNumberUtc(),
    updatedAt: Date.now(),
  };
  await ctx.kv.set(KV_KEYS.state(subredditName), initial);
  return initial;
}

function createLevel(levelNumber: number) {
  const width = 9;
  const height = 9;
  const tiles = [] as { x: number; y: number; type: 'wall' | 'floor' | 'door' | 'entrance' | 'exit' }[];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const isBorder = x === 0 || y === 0 || x === width - 1 || y === height - 1;
      tiles.push({ x, y, type: isBorder ? 'wall' : 'floor' });
    }
  }
  tiles.find((t) => t.x === 1 && t.y === 1)!.type = 'entrance';
  tiles.find((t) => t.x === width - 2 && t.y === height - 2)!.type = 'exit';
  return { levelNumber, width, height, tiles, start: { x: 1, y: 1 }, exit: { x: width - 2, y: height - 2 } };
}

async function saveState(ctx: Context, state: GameState): Promise<void> {
  state.updatedAt = Date.now();
  await ctx.kv.set(KV_KEYS.state(state.subredditName), state);
}

function clampPosition(x: number, y: number, state: GameState): { x: number; y: number } {
  const { width, height, tiles } = state.currentLevel;
  const nx = Math.max(0, Math.min(width - 1, x));
  const ny = Math.max(0, Math.min(height - 1, y));
  const tile = tiles.find((t) => t.x === nx && t.y === ny);
  if (!tile || tile.type === 'wall') return { x: nx, y: ny - 1 >= 0 ? ny - 1 : ny };
  return { x: nx, y: ny };
}

async function ensurePlayer(ctx: Context, state: GameState, userId: string, username: string) {
  if (!state.players[userId]) {
    state.players[userId] = {
      userId,
      username,
      position: { x: state.currentLevel.start.x, y: state.currentLevel.start.y },
      hp: 100,
      score: 0,
      lastActionAt: 0,
    };
    await saveState(ctx, state);
  }
}

async function addScore(ctx: Context, subredditName: string, userId: string, username: string, delta: number) {
  const key = KV_KEYS.leaderboard(subredditName);
  const leaderboard = (await ctx.kv.get<Record<string, LeaderboardEntry>>(key)) ?? {};
  const prev = leaderboard[userId] ?? { userId, username, score: 0 };
  leaderboard[userId] = { userId, username, score: prev.score + delta };
  await ctx.kv.set(key, leaderboard);
}

Devvit.addCustomPostType({
  name: 'DungeonCrawler',
  description: 'AI-Enhanced Collaborative Dungeon Crawler',
  render: async (ctx) => {
    const subreddit = await ctx.reddit.getSubredditById(ctx.subredditId!);
    const subredditName = subreddit?.name ?? 'unknown';
    const state = await getOrInitState(ctx, subredditName);
    return (
      <vstack padding="small" gap="small">
        <hstack>
          <image url="https://www.redditstatic.com/shreddit/assets/snoo.png" width="32px" height="32px" />
          <spacer size="small" />
          <text weight="bold">AI Dungeon - Level {state.currentLevel.levelNumber}</text>
        </hstack>
        <text size="small">Use comments with commands like !move north or !attack. Top-voted decides.</text>
        <button onPress={async (_ev, c) => {
          const sub = await c.reddit.getSubredditById(c.subredditId!);
          const name = sub?.name ?? 'unknown';
          const s = await getOrInitState(c, name);
          const gen = await generateRoomEvent({ prompt: 'A spark of adventure' });
          s.currentRoomEvent = gen.event;
          await saveState(c, s);
          await c.ui.showToast('New room event generated!');
        }}>Generate Room</button>
        {state.currentRoomEvent ? (
          <vstack>
            <text>{state.currentRoomEvent.description}</text>
          </vstack>
        ) : (
          <text size="small" color="muted">No current event. Tap Generate Room.</text>
        )}
        <spacer size="small" />
        <text size="small">Built for Reddit Devvit Hackathon 2025 ❤️</text>
      </vstack>
    );
  },
});

Devvit.addMenuItem({
  label: 'Start New Dungeon Level',
  location: 'subreddit',
  onPress: async (event: MenuItemOnPressEvent, ctx) => {
    const subreddit = await ctx.reddit.getSubredditById(event.subredditId!);
    if (!subreddit) throw new Error('Subreddit not found');
    const state = await getOrInitState(ctx, subreddit.name);
    state.currentLevel = createLevel(state.currentLevel.levelNumber + 1);
    state.currentRoomEvent = undefined;
    await saveState(ctx, state);
    await ctx.ui.showToast(`Started Level ${state.currentLevel.levelNumber}`);
  },
});

Devvit.addTrigger({
  event: 'AppInstall',
  onEvent: async (_event, ctx) => {
    const subreddit = ctx.subredditName;
    if (!subreddit) return;
    await getOrInitState(ctx, subreddit);
  },
});

Devvit.addScheduler({
  name: 'daily-dungeon-post',
  onRun: async (_event: SchedulerRunEvent, ctx) => {
    const subredditName = ctx.subredditName;
    if (!subredditName) return;
    const state = await getOrInitState(ctx, subredditName);
    const post = await ctx.reddit.submitPost({
      subredditName,
      title: `Daily Dungeon - Level ${state.currentLevel.levelNumber}`,
      preview: { text: 'Vote on the next move in the comments! Use !move north/south/east/west or !attack.' },
    });
    state.currentPostId = post.id;
    await saveState(ctx, state);
  },
});

Devvit.addHttpHandler(async (req, ctx) => {
  const url = new URL(req.url);
  const path = url.pathname;
  const subredditName = ctx.subredditName ?? 'unknown';

  if (req.method === 'GET' && path === '/api/leaderboard') {
    const leaderboard = (await ctx.kv.get<Record<string, LeaderboardEntry>>(KV_KEYS.leaderboard(subredditName))) ?? {};
    const top = Object.values(leaderboard)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    const body: LeaderboardResponse = { ok: true, top };
    return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
  }

  if (req.method === 'POST' && path === '/api/move') {
    const user = ctx.user;
    if (!user) return jsonError('Not authenticated', 401);
    const body = (await req.json()) as MoveRequest;
    const subreddit = ctx.subredditName;
    if (!subreddit) return jsonError('Missing subreddit', 400);
    const state = await getOrInitState(ctx, subreddit);
    await ensurePlayer(ctx, state, user.id, user.username ?? 'player');
    const player = state.players[user.id];
    let message = 'Action processed';
    if (body.action.type === 'move') {
      const dir: Direction = body.action.direction;
      const dx = dir === 'east' ? 1 : dir === 'west' ? -1 : 0;
      const dy = dir === 'south' ? 1 : dir === 'north' ? -1 : 0;
      const next = clampPosition(player.position.x + dx, player.position.y + dy, state);
      player.position = next;
      await addScore(ctx, subreddit, user.id, user.username ?? 'player', 1);
      message = `Moved ${dir}`;
    } else if (body.action.type === 'attack') {
      await addScore(ctx, subreddit, user.id, user.username ?? 'player', 3);
      message = 'You swing your weapon!';
    } else if (body.action.type === 'inspect') {
      message = state.currentRoomEvent?.description ?? 'Nothing of note.';
    }
    await saveState(ctx, state);
    const res: MoveResponse = { ok: true, message, state };
    return new Response(JSON.stringify(res), { status: 200, headers: { 'content-type': 'application/json' } });
  }

  return new Response('Not Found', { status: 404 });
});

function jsonError(message: string, status = 400): Response {
  return new Response(JSON.stringify({ ok: false, message }), { status, headers: { 'content-type': 'application/json' } });
}

export default Devvit;

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
