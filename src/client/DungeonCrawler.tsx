import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { useDungeon } from './hooks/useDungeon';
import { Direction } from '../shared/types';

const TILE_SIZE = 24;

export function DungeonCrawler(): JSX.Element {
  const { leaderboard, loading, error, submitAction } = useDungeon('');
  const phaserRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (gameRef.current || !phaserRef.current) return;
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 9 * TILE_SIZE,
      height: 9 * TILE_SIZE,
      parent: phaserRef.current,
      scene: [
        class MainScene extends Phaser.Scene {
          player!: Phaser.GameObjects.Rectangle;
          create() {
            this.cameras.main.setBackgroundColor('#111');
            for (let y = 0; y < 9; y += 1) {
              for (let x = 0; x < 9; x += 1) {
                const color = x === 0 || y === 0 || x === 8 || y === 8 ? 0x333333 : 0x1f2937;
                this.add.rectangle(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE - 2, TILE_SIZE - 2, color).setStrokeStyle(1, 0x4b5563);
              }
            }
            this.player = this.add.rectangle(TILE_SIZE * 1.5, TILE_SIZE * 1.5, TILE_SIZE - 6, TILE_SIZE - 6, 0xf97316).setStrokeStyle(2, 0xfb923c);
          }
        },
      ],
    };
    gameRef.current = new Phaser.Game(config);
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  const move = async (direction: Direction) => {
    await submitAction({ type: 'move', direction });
  };

  const attack = async () => submitAction({ type: 'attack' });
  const inspect = async () => submitAction({ type: 'inspect' });

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-4 gap-4">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-orange-400">AI-Enhanced Collaborative Dungeon Crawler</h1>
        <p className="text-sm text-gray-300">Vote in Reddit comments or use buttons below. Most upvoted wins.</p>
      </div>

      <div ref={phaserRef} className="rounded-lg shadow-lg ring-1 ring-gray-700" aria-label="Dungeon map" />

      <div className="grid grid-cols-3 gap-2" role="group" aria-label="Move controls">
        <button className="px-3 py-2 bg-gray-800 rounded hover:bg-gray-700" onClick={() => move('north')} aria-label="Move north">⬆️</button>
        <button className="px-3 py-2 bg-gray-800 rounded hover:bg-gray-700" onClick={inspect} aria-label="Inspect">🔎</button>
        <button className="px-3 py-2 bg-gray-800 rounded hover:bg-gray-700" onClick={() => move('south')} aria-label="Move south">⬇️</button>
        <button className="px-3 py-2 bg-gray-800 rounded hover:bg-gray-700" onClick={() => move('west')} aria-label="Move west">⬅️</button>
        <button className="px-3 py-2 bg-orange-600 rounded hover:bg-orange-500 font-bold" onClick={attack} aria-label="Attack">⚔️ Attack</button>
        <button className="px-3 py-2 bg-gray-800 rounded hover:bg-gray-700" onClick={() => move('east')} aria-label="Move east">➡️</button>
      </div>

      <div className="w-full max-w-md">
        <h2 className="text-lg font-bold text-orange-300">Leaderboard</h2>
        <ul className="mt-2 space-y-1">
          {leaderboard.map((e) => (
            <li key={e.userId} className="flex justify-between bg-gray-900 rounded px-3 py-2">
              <span className="truncate">u/{e.username}</span>
              <span className="font-mono">{e.score}</span>
            </li>
          ))}
          {leaderboard.length === 0 && <li className="text-sm text-gray-400">No heroes yet. Make a move!</li>}
        </ul>
      </div>

      {loading && <div className="text-sm text-gray-400 animate-pulse">Processing...</div>}
      {error && <div className="text-sm text-red-400" role="alert">{error}</div>}

      <footer className="pt-4 text-xs text-gray-400">Built for Reddit Devvit Hackathon 2025 ❤️</footer>
    </div>
  );
}

export default DungeonCrawler;

