import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameState, LeaderboardEntry, MoveRequest, PlayerAction } from '../../shared/types';

type UseDungeonState = {
  state: GameState | null;
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  submitAction: (action: PlayerAction) => Promise<void>;
  refresh: () => Promise<void>;
};

export function useDungeon(baseUrl = ''): UseDungeonState {
  const [state, setState] = useState<GameState | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch(`${baseUrl}/api/leaderboard`, { method: 'GET' });
      const data = (await res.json()) as { ok: boolean; top: LeaderboardEntry[] };
      if (data.ok) setLeaderboard(data.top);
    } catch (e) {
      // ignore leaderboard errors
    }
  }, [baseUrl]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchLeaderboard();
    } catch (e) {
      setError('Failed to refresh');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [fetchLeaderboard]);

  const submitAction = useCallback(async (action: PlayerAction) => {
    setLoading(true);
    setError(null);
    try {
      const body: MoveRequest = { action };
      const res = await fetch(`${baseUrl}/api/move`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { ok: boolean; message: string; state?: GameState };
      if (!data.ok) throw new Error(data.message);
      if (data.state) setState(data.state);
      await fetchLeaderboard();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [baseUrl, fetchLeaderboard]);

  useEffect(() => {
    mounted.current = true;
    refresh();
    const id = setInterval(refresh, 15000);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [refresh]);

  return useMemo(() => ({ state, leaderboard, loading, error, submitAction, refresh }), [state, leaderboard, loading, error, submitAction, refresh]);
}

