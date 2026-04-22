# Flip 7 — multiplayer card game

## Stack
- React 19 + Vite 8
- Tailwind CSS v4 (via `@tailwindcss/vite` plugin)
- Supabase JS client (`@supabase/supabase-js`)
- Jest for unit tests (native ESM via `--experimental-vm-modules`)
- Vercel for deployment (planned)

## Completed
- **Session 1** — project scaffolding. Vite + React set up, Tailwind CSS v4 wired into vite.config.js, Supabase client installed, folder structure created (`components/{ui,game,lobby}`, `game/`, `hooks/`, `lib/`).
- **Session 2** — pure game engine. All logic in `src/game/engine.js`: deck building, shuffle (seedable), draw-with-reshuffle, number/modifier/action card application, Second Chance handling, Stay/Freeze banking, scoring (sum → ×2 → flat → Flip 7 bonus), win conditions. 56 passing Jest tests in `src/game/engine.test.js`.

## Current state
- Engine module complete and tested — pure functions, no React/Supabase dependencies, fully immutable.
- Supabase client exists at `src/lib/supabase.js` but `.env.local` still has empty `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — no real Supabase project linked yet.
- No Supabase schema: tables, RLS policies, realtime channels all TODO.
- No UI: `src/App.jsx` is a one-line placeholder.
- Hooks folder has empty stub files (`useGame.js`, `usePlayers.js`, `useRoom.js`).
- **Next: Session 3 — Supabase schema design.**

## Key files
- `src/game/engine.js` — pure game logic (deck, scoring, card application, win conditions)
- `src/game/engine.test.js` — Jest unit tests (56 passing)
- `src/lib/supabase.js` — client singleton, needs env vars
- `src/App.jsx` — placeholder React entry
- `jest.config.js` — Jest config, empty `transform` for native ESM
- `vite.config.js` — React + Tailwind plugins registered
- `.env.local` — Supabase URL + anon key (empty, gitignored)

## Game rules summary
94-card deck: 79 number cards (N copies of N for 1–12, plus one 0), 6 modifier cards (+2/+4/+6/+8/+10/×2, one each), 9 action cards (3× Freeze, 3× Flip Three, 3× Second Chance). First to 200 points wins. Round ends on Flip 7 (7 unique number cards, +15 bonus) or when no active players remain. Busting = drawing a duplicate number card → 0 for that round. Second Chance discards one duplicate before busting. Scoring order matters: sum the numbers, then ×2 if held, then add flat modifiers, then +15 if Flip 7.

## Commands
- `npm run dev` — start dev server (http://localhost:5173)
- `npm run build` — production build into `dist/`
- `npm test` — run Jest tests
- `npm run lint` — ESLint
