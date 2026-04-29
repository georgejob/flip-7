import { supabase } from '../lib/supabase.js';

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_CODE_LEN = 4;
const MAX_CODE_ATTEMPTS = 8;

function generateRoomCode() {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LEN; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

async function ensureSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session;
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.session;
}

export async function createRoom(playerName) {
  await ensureSession();
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const code = generateRoomCode();
    const { data, error } = await supabase.rpc('create_room', {
      p_name: playerName,
      p_code: code,
    });
    if (!error) return { roomId: data, code };
    if (error.code !== '23505') throw error;
  }
  throw new Error('could not allocate a unique room code');
}

export async function joinRoom(code, playerName) {
  await ensureSession();
  const { data, error } = await supabase.rpc('join_room', {
    p_code: code.toUpperCase(),
    p_name: playerName,
  });
  if (error) throw error;
  return { roomId: data };
}

export async function getGameState(roomId) {
  const [roomRes, playersRes] = await Promise.all([
    supabase.from('rooms').select('*').eq('id', roomId).single(),
    supabase.from('players').select('*').eq('room_id', roomId).order('seat', { ascending: true }),
  ]);
  if (roomRes.error) throw roomRes.error;
  if (playersRes.error) throw playersRes.error;
  return { room: roomRes.data, players: playersRes.data };
}

export async function updateGameState(roomId, gameState, { status } = {}) {
  const patch = { game_state: gameState };
  if (status) patch.status = status;
  const { error } = await supabase.from('rooms').update(patch).eq('id', roomId);
  if (error) throw error;
}

export function subscribeToRoom(roomId, { onRoomChange, onPlayersChange } = {}) {
  const channel = supabase
    .channel(`room:${roomId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
      (payload) => onRoomChange?.(payload),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` },
      (payload) => onPlayersChange?.(payload),
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}
