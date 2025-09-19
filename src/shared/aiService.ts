import { GenerateRoomRequest, GenerateRoomResponse, Monster, RoomEvent } from './types';

// Lightweight, offline-friendly AI stub. No external API calls.
export async function generateRoomEvent(req: GenerateRoomRequest): Promise<GenerateRoomResponse> {
  // Deterministic pseudo-random generation based on prompt
  const seed = hashString(req.prompt + '|' + (req.imageUrl ?? ''));
  const monster: Monster | undefined = seed % 2 === 0 ? createMonster(seed) : undefined;
  const event: RoomEvent = {
    id: `evt_${seed.toString(36)}`,
    description: buildDescription(req.prompt, monster, seed),
    monster,
    loot: seed % 3 === 0 ? ['Ancient Coin', 'Healing Herb'] : seed % 5 === 0 ? ['Sapphire Shard'] : undefined,
  };
  return { ok: true, event };
}

function createMonster(seed: number): Monster {
  const names = ['Cinder Drake', 'Gloom Troll', 'Frost Wraith', 'Mire Slime', 'Arcane Sentinel'];
  const name = names[seed % names.length];
  return {
    id: `mon_${(seed * 7919).toString(36)}`,
    name,
    hp: 30 + (seed % 40),
    attack: 5 + (seed % 10),
    defense: 2 + (seed % 6),
    spriteKey: ['dragon', 'troll', 'wraith', 'slime', 'sentinel'][seed % 5],
  };
}

function buildDescription(prompt: string, monster: Monster | undefined, seed: number): string {
  const base = `You enter a chamber. ${prompt.trim() || 'Dust dances in the torchlight.'}`;
  if (monster) {
    return `${base} A ${monster.name} watches quietly. HP ${monster.hp}.`;
  }
  const details = [
    'A glowing orb hums with latent power.',
    'Ancient runes shimmer along the walls.',
    'A cold breeze hints at hidden passages.',
    'Footprints crisscross the dust.',
  ];
  return `${base} ${details[seed % details.length]}`;
}

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return Math.abs(h) >>> 0;
}

