# Flip 7 — multiplayer card game

## Stack
- React 19 + Vite 8
- Tailwind CSS v4 (via `@tailwindcss/vite` plugin)
- Supabase JS client (`@supabase/supabase-js`) — anonymous auth for per-client JWTs
- Jest for unit tests (native ESM via `--experimental-vm-modules`)
- Vercel for deployment (planned)

## Completed
- **Session 1** — project scaffolding. Vite + React set up, Tailwind CSS v4 wired into vite.config.js, Supabase client installed, folder structure created (`components/{ui,game,lobby}`, `game/`, `hooks/`, `lib/`).
- **Session 2** — pure game engine. All logic in `src/game/engine.js`: deck building, shuffle (seedable), draw-with-reshuffle, number/modifier/action card application, Second Chance handling, Stay/Freeze banking, scoring (sum → ×2 → flat → Flip 7 bonus), win conditions. 56 passing Jest tests in `src/game/engine.test.js`.
- **Session 3** — Supabase schema + client module. Migration at `supabase/migrations/20260422000000_initial_schema.sql` defines two tables (`rooms`, `players`), RLS policies, two `SECURITY DEFINER` RPCs (`create_room`, `join_room`), and enables Realtime. Client wrapper at `src/game/supabase.js` exports `createRoom`, `joinRoom`, `getGameState`, `updateGameState`, and `subscribeToRoom`. Auth via anonymous JWTs (`signInAnonymously`) — requires enabling anonymous sign-in in Supabase dashboard.

## Current state
- Engine module complete and tested — pure functions, no React/Supabase dependencies, fully immutable.
- Supabase schema designed and written to a migration file, but **not yet applied** — no real Supabase project linked yet, `.env.local` still empty, anonymous sign-in provider not yet enabled in dashboard.
- Supabase client module exists but untested against a live project.
- No UI: `src/App.jsx` is a one-line placeholder.
- Hooks folder has empty stub files (`useGame.js`, `usePlayers.js`, `useRoom.js`).
- **Next: Session 4 — provision the Supabase project, apply the migration, and wire hooks + UI for the lobby flow (create room / join room / render roster).**

## Key files
- `src/game/engine.js` — pure game logic (deck, scoring, card application, win conditions)
- `src/game/engine.test.js` — Jest unit tests (56 passing)
- `src/game/supabase.js` — room lifecycle + realtime subscription helpers (uses `createRoom`/`joinRoom` RPCs)
- `src/lib/supabase.js` — Supabase client singleton, needs env vars
- `supabase/migrations/20260422000000_initial_schema.sql` — tables, RLS policies, RPCs, realtime publication
- `src/App.jsx` — placeholder React entry
- `jest.config.js` — Jest config, empty `transform` for native ESM
- `vite.config.js` — React + Tailwind plugins registered
- `.env.local` — Supabase URL + anon key (empty, gitignored)

## Data model
- `rooms(id, code, host_id, status, game_state jsonb, created_at, updated_at)` — one row per game room. `game_state` holds the whole serialized engine state (deck, discard, per-player round state, current turn, etc.). `status` ∈ {`lobby`, `playing`, `finished`}. `code` is a 4-char uppercase alphanumeric, unique.
- `players(id, room_id, user_id, name, seat, joined_at)` — membership. Unique on `(room_id, user_id)` and `(room_id, seat)`. `user_id` FKs `auth.users` (the anonymous user).
- Cross-round `totalScore` lives inside `rooms.game_state` jsonb alongside round state — `players` is membership-only.

## Auth + RLS summary
- Every client does `supabase.auth.signInAnonymously()` on first visit → gets a JWT with a stable `auth.uid()`.
- `rooms`: members SELECT/UPDATE (via `is_room_member(id)`), authenticated users INSERT only rooms they host.
- `players`: members SELECT/UPDATE within their room, users INSERT/DELETE only their own row.
- `create_room(p_name, p_code)` and `join_room(p_code, p_name)` are `SECURITY DEFINER` RPCs — `join_room` can look up a room by code without the caller being a member yet.
- Realtime publication includes both tables; subscribe via `subscribeToRoom(roomId, { onRoomChange, onPlayersChange })`.

## Game rules summary
94-card deck: 79 number cards (N copies of N for 1–12, plus one 0), 6 modifier cards (+2/+4/+6/+8/+10/×2, one each), 9 action cards (3× Freeze, 3× Flip Three, 3× Second Chance). First to 200 points wins. Round ends on Flip 7 (7 unique number cards, +15 bonus) or when no active players remain. Busting = drawing a duplicate number card → 0 for that round. Second Chance discards one duplicate before busting. Scoring order matters: sum the numbers, then ×2 if held, then add flat modifiers, then +15 if Flip 7.

## Commands
- `npm run dev` — start dev server (http://localhost:5173)
- `npm run build` — production build into `dist/`
- `npm test` — run Jest tests
- `npm run lint` — ESLint
