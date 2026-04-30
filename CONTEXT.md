# Flip 7 — multiplayer card game

## Stack
- React 19 + Vite 8
- Tailwind CSS v4 (via `@tailwindcss/vite` plugin)
- Supabase JS client (`@supabase/supabase-js`) — anonymous auth for per-client JWTs
- Framer Motion for card / modal / hand animations
- Jest for unit tests (native ESM via `--experimental-vm-modules`)
- Vercel for deployment (planned)

## Completed
- **Session 1** — project scaffolding. Vite + React set up, Tailwind CSS v4 wired into vite.config.js, Supabase client installed, folder structure created (`components/{ui,game,lobby}`, `game/`, `hooks/`, `lib/`).
- **Session 2** — pure game engine. All logic in `src/game/engine.js`: deck building, shuffle (seedable), draw-with-reshuffle, number/modifier/action card application, Second Chance handling, Stay/Freeze banking, scoring (sum → ×2 → flat → Flip 7 bonus), win conditions. 56 passing Jest tests in `src/game/engine.test.js`.
- **Session 3** — Supabase schema + client module. Migration at `supabase/migrations/20260422000000_initial_schema.sql` defines two tables (`rooms`, `players`), RLS policies, two `SECURITY DEFINER` RPCs (`create_room`, `join_room`), and enables Realtime. Client wrapper at `src/game/supabase.js` exports `createRoom`, `joinRoom`, `getGameState`, `updateGameState`, and `subscribeToRoom`. Auth via anonymous JWTs (`signInAnonymously`) — requires enabling anonymous sign-in in Supabase dashboard.
- **Session 4** — lobby flow UI. Full three-screen flow: Lobby → WaitingRoom → GameScreen placeholder. Routing via React state in `App.jsx` (no router). Google Fonts (Fredoka One + Nunito), phone-frame layout, pastel backdrop decorations, card fan. `useRoomSession` hook (single realtime channel handles both `rooms` + `players` changes). Host can start game; all clients auto-navigate when `rooms.status` flips to `playing`. Two-client tested in browser.
- **Session 5** — full game table screen. `round.js` orchestration layer on top of `engine.js` (turn order, action targeting, round/game end). `useGame` hook wires Supabase realtime to round functions. `GameBoard` with leaderboard, other-player rows, and local `MyHand`. Card components with Framer Motion spring animations and adaptive overlap layout (`useAdaptiveLayout`). Action card targeting via `TargetPickerModal`. `BustModal` (animated overlay) and `SecondChanceModal` (auto-dismiss). Bust UX: busting card shown in hand with persistent red glow, pre-bust snapshot preserved, 350 ms shake before modal. Deferred round-end flow for last-active-player bust so the modal always appears before the round resets.
- **Session 6** — Flip 7 UX, deck persistence, round-robin turn structure.
  - **Flip 7 UX**: `Flip7Modal` (full-screen overlay showing all 7 cards, animated score count-up, confetti burst via canvas `Confetti` component). `Flip7Toast` (non-blocking slide-in toast shown to other clients). Both fire via existing `lastDrawn` event system in `GameBoard`.
  - **Deck persistence**: discard pile only reshuffles back into the deck when the main deck is exhausted mid-draw. The deck persists across rounds; `buildDeck` / `shuffle` only run once at game start.
  - **Round-robin turn structure**: each player takes exactly one action per cycle (Hit draws one card then turn advances; Stay banks and advances). `game_state` now includes `phase: 'initialDeal' | 'play'` and `initialDealtIds: string[]`. At round start (`phase === 'initialDeal'`), each player's client auto-deals its own card via a `useEffect` in `useGame` (700 ms delay per card for animation); once every active player has been dealt, phase flips to `'play'`. `flushPostDraw` now advances the turn for all draw outcomes (Number ADDED/SAVED, Modifier, Action) not just bust. `selectTarget` for Freeze/FlipThree/reassign-Second-Chance always advances after resolving. Second Chance save correctly advances (saved player gets no bonus draw). Hit/Stay buttons hidden with a "dealing initial cards…" pill during the deal phase; top-bar turn text says "dealing to {name}…".
- **Session 7** — Freeze UX + responsive screen height + LAN dev access.
  - **Freeze UX**: `FreezeModal` (target-side full-screen overlay — distinguishes self-freeze vs targeted-by-other, animates banked-points count-up, indicates whether the round is ending). `FreezeToast` (non-blocking 2.5 s slide-in shown to the freezer when their target ≠ self). `game_state.lastFreeze: { targetId, fromPlayerId, pointsBanked, at }` mirrors the `lastDrawn` event pattern so modal/toast triggers de-dup against echoed Supabase updates. Round-end deferral extended: a self-freeze that ends the round writes the intermediate state and waits behind the modal — `round.selectTargetDeferred` resolves the freeze without advancing, `useGame.selectTarget` branches to the deferred path only for `kind === 'freeze'`. Hand container shows a single blue pulse (`freezeFlashKey`) when the local player gets frozen, plus a frozen-status snapshot is preserved (engine clears the hand on freeze). `wouldEndRound` simplified — any time `activePlayers.length === 0` ends the round, regardless of last-drawn result.
  - **Responsive screen height**: `.screen-container` switches to `100dvh` (with `100vh` fallback) and the html/body/#root chain locks `overflow: hidden` + `position: fixed` so the page doesn't scroll on mobile. Viewport meta gets `viewport-fit=cover`. PhoneFrame adapts its `paddingBottom` to `env(safe-area-inset-bottom)`. Media query `@media (max-height: 700px)` shrinks the scrollable other-players panel and progress section to fit on shorter screens.
  - **LAN dev access**: `vite.config.js` binds dev server to `0.0.0.0` so phones on the same Wi-Fi can hit the host machine for two-device testing.
- **Session 8** — adaptive "Your hand" sizing. New `useDynamicHandLayout(ref, count)` hook in `useAdaptiveLayout.js` does height-first card sizing — the local hand fills the available container height (capped at `MAX_CARD_WIDTH = 80`), then derives card width from a fixed 38/54 aspect ratio. Cards spread side-by-side when they fit and overlap (last card flush-right) when they don't. `Card.jsx` consumes a new `getCardDetailLevel(width)` (`full` ≥60, `medium` ≥44, `compact` ≥32, `minimal` <32) and progressively drops the bottom pip, suit symbol, and inner frame as cards shrink so they stay legible at any size. `MyHand` now renders cards at the dynamic `cardWidth × cardHeight` rather than fixed 38×54; the container `flex: 1` so the hand grows on tall screens and compresses on short ones.
- **Session 9** — number-card visual redesign. Per-value watercolor palette in `cardColors.js` (`CARD_COLORS[0..12]` — wash1/wash2/border/shadow/text/suit, all coordinated). `Card.jsx` `NumberCard` rebuilt: white card body with three blurred radial wash blobs in the value's hue, a dashed inner frame, pip badges in the corners showing the value, a small suit glyph in the upper-right, and a large `Fredoka One` center number. Pip dimensions (font, padding, border, radius) scale off the card width so they don't overflow at compact/minimal sizes. `MiniCard` updated to use the same wash palette so leaderboard / other-player hands match.
- **Session 10** — modifier-card visual redesign. New `ModifierCard.jsx` extracted from `Card.jsx`, owns the foil-style metallic look for `+2 / +4 / +6 / +8 / +10 / x2 / second`. Each type has its own `MODIFIER_COLORS` entry (multi-stop dark-to-bright gradient `grad`, sheen, frame, sparkles, glow, gradient text fill `numGrad`, frosted label strip). The card renders: dark gradient background, optional radial glow (x2 only), a 122° diagonal sheen plus a second cross-sheen on x2, an inner frame, suit glyph + tiny corner deco, three sparkle dots at staggered positions, an emoji icon, gradient-clipped Fredoka One value text, and a frosted bottom strip with the type label (`bonus / double / chance`). `Card.jsx` is now a dispatcher (number → `NumberCard`, plus/x2/secondChance → `ModifierCard`, freeze/flipThree → `ActionCard`); `modifierTypeFor(card)` maps engine cards to the color key. `MiniModifierCard.jsx` provides the matching mini-foil version using `miniA`/`miniB` from each color entry, used by `MiniCard` for other-player hands.
- **Session 11** — card draw animation on Hit. New `CardBack.jsx` (face-down card design — `#BAE6FD` body, `#7DD3FC` border, diagonal stripe pattern, centered `Fredoka One` "F7" logo at `#0EA5E9`/`#0284C7`). `MyHand.jsx` rewritten to fly the drawn card from the deck-count text in the top bar to its landing slot in the hand. The flying clone is rendered into `document.body` via `createPortal` (`position: fixed`, `z-index: 9999`, `pointer-events: none`) so it isn't clipped by the phone-frame's `overflow: hidden`. Flight: 420 ms with separate easing on x and y for an arc; the card is face-down for the first 210 ms, then a 3D `rotateY` 0→180° flip swaps a back face for the front face (using `backfaceVisibility: hidden` on two stacked children — back at `rotateY(0)`, front at `rotateY(180deg)`). On landing, the flying clone unmounts and the real card slot animates with a slight overshoot-then-settle (`scale: [1.08, 1]`, `y: [-6, 0]`, 320 ms cubic-bezier) plus the existing newest-card glow. While a card is in flight, the destination slot in the hand is rendered with `opacity: 0` so there's no flash behind the clone, and the Hit button is disabled. Detection is local: `MyHand` watches `localDrawAt` and infers the landing slot (number row vs modifier row vs second-chance) from which display field grew. GameBoard adds `data-deck-count` to the deck-count `<span>` for `getBoundingClientRect` measurement and tracks `animatedDrawAt` to gate the bust shake/modal, Flip 7 confetti/modal, and newest-card glow until the flight has landed — so bust and Flip 7 reactions never fire while the card is still mid-flight.
- **Session 12** — press feedback + UI sounds. New `PressableButton.jsx` (drop-in `<button>` replacement using Framer Motion `whileTap`/`whileHover` variants) and `useUiSound.js` (Web Audio API click sounds + mute toggle). Every `<button>` in the app replaced. Press mechanic: `whileTap` translates Y by `shadowDepth` and collapses the button's drop-shadow to 0, creating a physical compression effect; spring `stiffness: 600 / damping: 30`. Per-button customisation via props — `shadowDepth`, `shadowColor`, `pressScale`, `ripple`/`rippleColor` (contained radial burst), `shake` (post-release x oscillation `[0,-2,2,-1,1,0]`), `releaseFlash` (`{ color, durationMs }` overlay). Hover lifts the button 1 px and deepens the shadow on non-touch devices only (`(hover: none)` MQ detected via `useEffect`). `prefers-reduced-motion` disables all translate/scale/ripple. Tuning per button: Hit = depth 4, scale 0.96, ripple, shake, 1000→500 hz sound; Stay = depth 4, scale 0.97, mint reward flash, 600→300 hz; primary blue buttons = depth 5, scale 0.96, ripple, brightness pulse; Copy = depth 3, scale 0.95, animated label swap (`copy ↗ ↔ copied ✓` via `AnimatePresence`); Back/Leave = depth 2, scale 0.97; modal Continue buttons = depth 4, color-matched release flash. Mute toggle (🔊/🔇) added to the GameBoard top bar, persists preference to `localStorage` under `flip7-ui-muted` and is shared across all buttons via a singleton module-level state with subscriber pattern.

## Current state
- Engine module complete and tested — pure functions, no React/Supabase dependencies, fully immutable (56 Jest tests passing).
- Supabase schema applied and working against a live project. `.env.local` populated, anonymous sign-in enabled.
- Full lobby flow live and tested in the browser (two-client verified).
- Full game screen live: round-robin Hit/Stay, initial deal phase, scoring, leaderboard, bust + second-chance + Flip-7 + freeze modals, confetti, action cards with targeting, card-draw flight animation.
- Visual polish: per-value watercolor number cards, foil-style modifier cards, face-down `CardBack` for the flight, adaptive hand sizing across screen heights.
- UI feel: physical press feedback on every button via `PressableButton`, per-button ripple/shake/flash effects, Web Audio click sounds (mutable, persisted), hover lift on desktop.
- Mobile-friendly: `100dvh` layout, `viewport-fit=cover`, safe-area padding, `overscroll-behavior: none`, dev server bound to `0.0.0.0` for LAN device testing.
- **Next: game-end screen polish, action-card visual polish (Freeze / Flip Three remain plain compared to modifiers).**

## Key files
- `src/game/engine.js` — pure game logic (deck, scoring, card application, win conditions)
- `src/game/engine.test.js` — Jest unit tests (56 passing)
- `src/game/round.js` — multiplayer orchestration: turn order, `hitDeferred`/`flushPostDraw`/`wouldEndRound`, action targeting, `selectTargetDeferred` (freeze deferral), round-end/game-end, `lastFreeze` event
- `src/game/supabase.js` — room lifecycle + realtime subscription helpers (`createRoom`, `joinRoom`, `getGameState`, `updateGameState`, `subscribeToRoom`)
- `src/lib/supabase.js` — Supabase client singleton (reads VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY)
- `src/hooks/useRoomSession.js` — single-channel realtime hook returning `{ room, players, loading, error }`
- `src/hooks/useGame.js` — game action hook: `hit` (with deferred-bust/flip-7 logic), `stay`, `selectTarget` (with deferred self-freeze logic), `cancelPending`, `flushPendingRoundEnd`; exposes `{ gameState, pending, pendingRoundEnd, error }`
- `src/hooks/useAdaptiveLayout.js` — `useAdaptiveLayout` (other-player overlap fans) and `useDynamicHandLayout` (height-first sizing for the local hand) plus `getCardDetailLevel(width)`
- `src/hooks/useCurrentUserId.js` — returns the current anonymous Supabase user id
- `src/App.jsx` — screen state machine: `lobby → waiting → game`; wraps all screens in `ErrorBoundary`
- `src/components/lobby/Lobby.jsx` — name input, create / join room, card fan decoration
- `src/components/lobby/WaitingRoom.jsx` — room code + copy, live player list, tip box, host start / guest wait
- `src/components/lobby/CardFan.jsx` — fanned-card decoration (responsive sizing for short screens)
- `src/components/game/GameBoard.jsx` — top-level game screen: header (with `data-deck-count` deck pill), other-player panel, leaderboard panel, MyHand, modals; gates `lastDrawn`-driven side-effects on `animatedDrawAt` so bust/flip-7/glow wait for the flight to land
- `src/components/game/MyHand.jsx` — local player's hand: dynamic-sized cards, Hit/Stay buttons, bust state, busting-card red glow, shake animation, freeze-flash pulse, Flip 7 reveal, portal-rendered flying-card draw animation with 3D flip + bounce on landing
- `src/components/game/CardBack.jsx` — face-down card design (blue palette, diagonal stripes, F7 logo) used by the draw animation
- `src/components/game/Card.jsx` — dispatcher; `NumberCard` is the per-value watercolor design (washes, blobs, dashed inner frame, corner pips, suit glyph, big center number); delegates plus/x2/secondChance to `ModifierCard` and freeze/flipThree to `ActionCard`
- `src/components/game/ModifierCard.jsx` — foil-style modifier card (gradient, sheen, sparkles, gradient-clipped value text, frosted label strip); `MODIFIER_COLORS` palette + `modifierTypeFor(card)` mapping shared with `MiniModifierCard`
- `src/components/game/MiniCard.jsx` — compact card used in other-player rows / leaderboard; numbers use the watercolor palette, modifiers/secondChance use `MiniModifierCard`
- `src/components/game/MiniModifierCard.jsx` — mini foil version of a modifier (uses `miniA`/`miniB` from `MODIFIER_COLORS`)
- `src/components/game/cardColors.js` — `CARD_COLORS[0..12]` watercolor palette per number value, plus `paletteForValue` and `playerColor` helpers
- `src/components/game/OtherPlayerRow.jsx` — compact row showing another player's status, card count, score, mini-card hand
- `src/components/game/LeaderboardRow.jsx` — rank + name + total score row
- `src/components/game/BustModal.jsx` — full-screen animated bust overlay with card shake + Continue button
- `src/components/game/SecondChanceModal.jsx` — auto-dismiss (2 s) second-chance save notification
- `src/components/game/TargetPickerModal.jsx` — action-card target selection (freeze / flip-three / reassign second chance)
- `src/components/game/Flip7Modal.jsx` — full-screen Flip 7 celebration: all 7 cards displayed, animated score count-up, Continue button
- `src/components/game/Flip7Toast.jsx` — slide-in toast (3 s auto-dismiss) shown to other clients when a player achieves Flip 7
- `src/components/game/FreezeModal.jsx` — target-side freeze overlay (self-freeze vs other-targeted variants, animated points count-up, end-of-round indicator)
- `src/components/game/FreezeToast.jsx` — slide-in toast (2.5 s auto-dismiss) shown to the freezer when their target ≠ self
- `src/components/game/Confetti.jsx` — canvas-based confetti burst, fires on Flip 7
- `src/components/ui/PressableButton.jsx` — drop-in `<button>` replacement with Framer Motion press/hover/ripple/shake/flash feedback; props: `shadowDepth`, `shadowColor`, `pressScale`, `ripple`, `rippleColor`, `shake`, `releaseFlash`, `soundProfile`; respects `prefers-reduced-motion` and `(hover: none)`
- `src/hooks/useUiSound.js` — singleton Web Audio click sound system; `playClickSound(profile)`, `setUiMuted(bool)`, `useUiMuted()` hook; mute state persisted to `localStorage`
- `src/components/ui/PhoneFrame.jsx` — phone-shaped container (safe-area-aware bottom padding)
- `src/components/ui/Backdrop.jsx` — pastel circles, confetti, sparkles, SVG swirls
- `src/components/ui/Logo.jsx` — "Flip 7" logotype with dual text-shadow
- `src/components/ui/ErrorBoundary.jsx` — catches render errors, shows them on-screen
- `src/index.css` — global resets, `.screen-container` with `100dvh`, `overflow: hidden` body lock, short-screen media query
- `supabase/migrations/20260422000000_initial_schema.sql` — tables, RLS policies, RPCs, realtime publication
- `jest.config.js` — Jest config, native ESM
- `vite.config.js` — React + Tailwind plugins, `server.host: '0.0.0.0'` for LAN access
- `.env.local` — Supabase URL + anon key (gitignored)

## Data model
- `rooms(id, code, host_id, status, game_state jsonb, created_at, updated_at)` — one row per game room. `game_state` holds the whole serialized engine state (deck, discard, per-player round state, current turn, etc.). `status` ∈ {`lobby`, `playing`, `finished`}. `code` is a 4-char uppercase alphanumeric, unique. Key `game_state` fields: `round`, `phase` (`'initialDeal'`|`'play'`), `initialDealtIds` (string[] tracking who's received their initial card this round), `turnIndex`, `playerOrder`, `players`, `deck`, `discard`, `pendingAction`, `lastDrawn` (`{ playerId, card, at, result }`), `lastFreeze` (`{ targetId, fromPlayerId, pointsBanked, at }`), `status`, `winner`.
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
- `npm run dev` — start dev server (http://localhost:5173, also reachable on LAN via `0.0.0.0`)
- `npm run build` — production build into `dist/`
- `npm test` — run Jest tests
- `npm run lint` — ESLint
