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
- **Session 4** — lobby flow UI. Full three-screen flow: Lobby → WaitingRoom → GameScreen placeholder. Routing via React state in `App.jsx` (no router). Google Fonts (Fredoka One + Nunito), phone-frame layout, pastel backdrop decorations, card fan. `useRoomSession` hook (single realtime channel handles both `rooms` + `players` changes). Host can start game; all clients auto-navigate when `rooms.status` flips to `playing`. Two-client tested in browser.
- **Session 5** — full game table screen. `round.js` orchestration layer on top of `engine.js` (turn order, action targeting, round/game end). `useGame` hook wires Supabase realtime to round functions. `GameBoard` with leaderboard, other-player rows, and local `MyHand`. Card components with Framer Motion spring animations and adaptive overlap layout (`useAdaptiveLayout`). Action card targeting via `TargetPickerModal`. `BustModal` (animated overlay) and `SecondChanceModal` (auto-dismiss). Bust UX: busting card shown in hand with persistent red glow, pre-bust snapshot preserved, 350 ms shake before modal. Deferred round-end flow for last-active-player bust so the modal always appears before the round resets.

## Current state
- Engine module complete and tested — pure functions, no React/Supabase dependencies, fully immutable (56 Jest tests passing).
- Supabase schema applied and working against a live project. `.env.local` populated, anonymous sign-in enabled.
- Full lobby flow live and tested in the browser (two-client verified).
- Full game screen live: Hit/Stay, turn rotation, scoring, leaderboard, bust + second-chance modals, action cards with targeting.
- **Next: Session 6 — game-end screen polish, action card visual polish, sound/haptics (TBD).**

## Key files
- `src/game/engine.js` — pure game logic (deck, scoring, card application, win conditions)
- `src/game/engine.test.js` — Jest unit tests (56 passing)
- `src/game/round.js` — multiplayer orchestration: turn order, `hitDeferred`/`flushPostDraw`/`wouldEndRound`, action targeting, round-end/game-end
- `src/game/supabase.js` — room lifecycle + realtime subscription helpers (`createRoom`, `joinRoom`, `getGameState`, `updateGameState`, `subscribeToRoom`)
- `src/lib/supabase.js` — Supabase client singleton (reads VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY)
- `src/hooks/useRoomSession.js` — single-channel realtime hook returning `{ room, players, loading, error }`
- `src/hooks/useGame.js` — game action hook: `hit` (with deferred-bust logic), `stay`, `selectTarget`, `cancelPending`, `flushPendingRoundEnd`; exposes `{ gameState, pending, pendingRoundEnd, error }`
- `src/hooks/useAdaptiveLayout.js` — ResizeObserver hook that computes absolute x-positions for overlapping card fans
- `src/hooks/useCurrentUserId.js` — returns the current anonymous Supabase user id
- `src/App.jsx` — screen state machine: `lobby → waiting → game`; wraps all screens in `ErrorBoundary`
- `src/components/lobby/Lobby.jsx` — name input, create / join room, card fan decoration
- `src/components/lobby/WaitingRoom.jsx` — room code + copy, live player list, tip box, host start / guest wait
- `src/components/lobby/CardFan.jsx` — 5-card fanned decoration
- `src/components/game/GameBoard.jsx` — top-level game screen: header, other-player panel, leaderboard panel, MyHand, modals
- `src/components/game/MyHand.jsx` — local player's hand with Hit/Stay buttons, bust state, busting-card red glow, shake animation
- `src/components/game/Card.jsx` — NumberCard / ModifierCard / ActionCard; `glow` prop accepts `false`, truthy (blue), or `'red'`
- `src/components/game/OtherPlayerRow.jsx` — compact row showing another player's status, card count, score
- `src/components/game/LeaderboardRow.jsx` — rank + name + total score row
- `src/components/game/BustModal.jsx` — full-screen animated bust overlay with card shake + Continue button
- `src/components/game/SecondChanceModal.jsx` — auto-dismiss (2 s) second-chance save notification
- `src/components/game/TargetPickerModal.jsx` — action-card target selection (freeze / flip-three / reassign second chance)
- `src/components/ui/PhoneFrame.jsx` — phone-shaped container with backdrop
- `src/components/ui/Backdrop.jsx` — pastel circles, confetti, sparkles, SVG swirls
- `src/components/ui/Logo.jsx` — "Flip 7" logotype with dual text-shadow
- `src/components/ui/ErrorBoundary.jsx` — catches render errors, shows them on-screen
- `supabase/migrations/20260422000000_initial_schema.sql` — tables, RLS policies, RPCs, realtime publication
- `jest.config.js` — Jest config, native ESM
- `vite.config.js` — React + Tailwind plugins
- `.env.local` — Supabase URL + anon key (gitignored)

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
