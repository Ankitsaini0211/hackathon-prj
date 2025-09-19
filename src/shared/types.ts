export type Direction = 'north' | 'south' | 'east' | 'west';

export type PlayerAction =
  | { type: 'move'; direction: Direction }
  | { type: 'attack' }
  | { type: 'inspect' };

export type TileType = 'wall' | 'floor' | 'door' | 'entrance' | 'exit';

export type DungeonTile = {
  x: number;
  y: number;
  type: TileType;
};

export type RoomEvent = {
  id: string;
  description: string;
  monster?: Monster;
  loot?: string[];
};

export type Monster = {
  id: string;
  name: string;
  hp: number;
  attack: number;
  defense: number;
  spriteKey: string;
};

export type DungeonLevel = {
  levelNumber: number;
  width: number;
  height: number;
  tiles: DungeonTile[];
  start: { x: number; y: number };
  exit: { x: number; y: number };
};

export type PlayerState = {
  userId: string;
  username: string;
  position: { x: number; y: number };
  hp: number;
  score: number;
  lastActionAt: number;
};

export type GameState = {
  subredditName: string;
  currentLevel: DungeonLevel;
  currentRoomEvent?: RoomEvent;
  players: Record<string, PlayerState>; // key: userId
  currentPostId?: string;
  weekNumberUtc: number;
  updatedAt: number;
};

export type MoveRequest = {
  action: PlayerAction;
};

export type MoveResponse = {
  ok: boolean;
  message: string;
  state?: GameState;
};

export type LeaderboardEntry = {
  userId: string;
  username: string;
  score: number;
};

export type LeaderboardResponse = {
  ok: boolean;
  top: LeaderboardEntry[];
};

export type GenerateRoomRequest = {
  prompt: string;
  imageUrl?: string;
};

export type GenerateRoomResponse = {
  ok: boolean;
  event: RoomEvent;
};

export type ApiError = {
  ok: false;
  message: string;
};

export type Nullable<T> = T | null | undefined;

