# Flip 7

Multiplayer push-your-luck card game. First player to 200 points wins. Flip exactly 7 unique number cards in a round for a 15-point bonus — but draw a duplicate and you bust.

## Stack

- **React 19 + Vite 8** — client app
- **Tailwind CSS v4** — utility styles
- **Supabase** — Postgres database, Row Level Security, anonymous auth, Realtime subscriptions
- **Jest** — unit tests for the game engine

## Getting started

```bash
npm install
```

Create `.env.local` in the project root:

```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Before running, make sure anonymous sign-in is enabled in your Supabase dashboard under Authentication → Providers, and apply the migration:

```bash
supabase db push
```

Then start the dev server:

```bash
npm run dev        # http://localhost:5173
```

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Preview the production build |
| `npm test` | Run Jest unit tests (56 passing) |
| `npm run lint` | ESLint |

## How to play (lobby flow)

1. Open the app and enter your name
2. **Host:** click "Create room" — you'll get a 4-character code
3. **Guests:** enter the code and click "Join"
4. Once everyone is in the waiting room, the host clicks "Start game"
5. All clients navigate to the game screen simultaneously

Supports 2–18 players per room.

## Project structure

```
src/
  game/
    engine.js          # Pure game logic — deck, scoring, win conditions
    engine.test.js     # 56 Jest unit tests
    supabase.js        # Room lifecycle + Realtime helpers
  hooks/
    useRoomSession.js  # Single-channel realtime hook (room + players)
    useGame.js         # Game state hook (stub, next session)
  components/
    lobby/
      Lobby.jsx        # Name input, create/join room, card fan
      WaitingRoom.jsx  # Room code, live player list, host start button
      CardFan.jsx      # Decorative 5-card fan
    game/
      GameScreen.jsx   # Placeholder (next session)
    ui/
      PhoneFrame.jsx   # Phone-shaped container
      Backdrop.jsx     # Pastel circles, confetti, sparkles, SVG swirls
      Logo.jsx         # "Flip 7" logotype
      ErrorBoundary.jsx
  lib/
    supabase.js        # Supabase client singleton
  App.jsx              # Screen state machine: lobby → waiting → game
supabase/
  migrations/
    20260422000000_initial_schema.sql  # Tables, RLS, RPCs, Realtime
```

## Data model

- `rooms(id, code, host_id, status, game_state jsonb, created_at, updated_at)` — one row per room; `status` ∈ `{lobby, playing, finished}`
- `players(id, room_id, user_id, name, seat, joined_at)` — room membership

Every browser session signs in anonymously (`supabase.auth.signInAnonymously()`) and gets a stable JWT used for RLS.
