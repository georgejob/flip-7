// Orchestration layer on top of engine.js.
// Holds the whole multiplayer game state and knows about turn order,
// round-end, action-card targeting, and inter-round transitions.
//
// game_state shape (stored in rooms.game_state jsonb):
// {
//   round: number,
//   phase: 'initialDeal' | 'play',         // initial-deal phase auto-deals one
//                                          // card to each player before Hit/Stay
//   initialDealtIds: string[],             // ids dealt their initial card (this round)
//   turnIndex: number,                     // index into playerOrder
//   playerOrder: string[],                 // user_ids in seat order
//   players: { [user_id]: PlayerState },   // engine-shaped players keyed by user_id
//   deck: Card[],
//   discard: Card[],
//   pendingAction: null | { card, fromPlayerId },
//   lastDrawn: null | { playerId, card, at }, // at = ms timestamp for glow
//   status: 'playing' | 'finished',
//   winner: null | string,                 // user_id
// }

import {
  CARD_TYPE,
  ACTION_TYPE,
  PLAYER_STATUS,
  NUMBER_RESULT,
  SECOND_CHANCE_RESULT,
  buildDeck,
  shuffle,
  drawCard,
  createPlayer,
  resetPlayerForRound,
  applyNumberCard,
  applyModifierCard,
  applyFreeze,
  applySecondChance,
  calcRoundScore,
  stay as engineStay,
  getWinner,
} from './engine.js'

const FLIP_THREE_DRAWS = 3

// ----------------------------------------------------------------------------
// init / queries
// ----------------------------------------------------------------------------

// Build the initial state from the membership list (rows from `players`).
// Each membership row: { user_id, name, seat }.
export function initGameState(membership) {
  const ordered = [...membership].sort((a, b) => a.seat - b.seat)
  const players = {}
  const playerOrder = []
  for (const m of ordered) {
    players[m.user_id] = createPlayer(m.name, m.user_id)
    playerOrder.push(m.user_id)
  }
  return {
    round: 1,
    phase: 'initialDeal',
    initialDealtIds: [],
    turnIndex: 0,
    playerOrder,
    players,
    deck: shuffle(buildDeck()),
    discard: [],
    pendingAction: null,
    lastDrawn: null,
    lastFreeze: null,
    status: 'playing',
    winner: null,
  }
}

export function getCurrentPlayerId(state) {
  if (!state || !state.playerOrder?.length) return null
  return state.playerOrder[state.turnIndex] ?? null
}

export function isMyTurn(state, userId) {
  return getCurrentPlayerId(state) === userId
}

export function activePlayers(state) {
  return state.playerOrder
    .map((id) => state.players[id])
    .filter((p) => p?.status === PLAYER_STATUS.ACTIVE)
}

// ----------------------------------------------------------------------------
// turn / round flow
// ----------------------------------------------------------------------------

function withDrawnCard(state, playerId, card, result = null) {
  return {
    ...state,
    lastDrawn: { playerId, card, at: Date.now(), result },
  }
}

function setLastDrawnResult(state, result) {
  if (!state.lastDrawn) return state
  return { ...state, lastDrawn: { ...state.lastDrawn, result } }
}

function setPlayer(state, playerId, player) {
  return {
    ...state,
    players: { ...state.players, [playerId]: player },
  }
}

function appendDiscard(state, cards) {
  if (!cards || cards.length === 0) return state
  return { ...state, discard: [...state.discard, ...cards] }
}

// Given a state where the current player just finished their action,
// figure out what comes next: either advance to the next active player,
// or end the round.
function passTurnOrEndRound(state) {
  const actives = activePlayers(state)
  if (actives.length === 0) return endRound(state)

  const order = state.playerOrder
  let next = state.turnIndex
  for (let i = 0; i < order.length; i++) {
    next = (next + 1) % order.length
    if (state.players[order[next]].status === PLAYER_STATUS.ACTIVE) {
      return { ...state, turnIndex: next }
    }
  }
  return endRound(state)
}

// Initial-deal advancement: mark the current player as dealt, then move to
// the next active player who hasn't been dealt yet. When every currently-
// active player has had their initial card, transition to 'play' phase.
function advanceInitialDeal(state) {
  const currentId = state.playerOrder[state.turnIndex]
  const dealtIds = state.initialDealtIds.includes(currentId)
    ? state.initialDealtIds
    : [...state.initialDealtIds, currentId]

  const order = state.playerOrder
  let next = state.turnIndex
  for (let i = 0; i < order.length; i++) {
    next = (next + 1) % order.length
    const p = state.players[order[next]]
    if (p.status === PLAYER_STATUS.ACTIVE && !dealtIds.includes(order[next])) {
      return { ...state, initialDealtIds: dealtIds, turnIndex: next }
    }
  }

  // Every active player has been dealt — switch to play phase, starting
  // with the first active player in seat order.
  const firstActive = order.findIndex(
    (id) => state.players[id].status === PLAYER_STATUS.ACTIVE,
  )
  if (firstActive === -1) return endRound({ ...state, initialDealtIds: dealtIds })
  return {
    ...state,
    phase: 'play',
    initialDealtIds: dealtIds,
    turnIndex: firstActive,
  }
}

// Single dispatcher for "the active player just finished a turn-consuming
// action". Routes to initial-deal or normal play advancement based on phase.
function advanceAfterAction(state) {
  if (state.pendingAction) return state
  if (state.status === 'finished') return state
  if (state.phase === 'initialDeal') return advanceInitialDeal(state)
  return passTurnOrEndRound(state)
}

// End the round. Active players bank what's in their hand.
// Stayed/frozen already banked. Then either declare a winner or start next round.
function endRound(state) {
  const newPlayers = { ...state.players }
  const newDiscard = [...state.discard]

  for (const id of state.playerOrder) {
    const p = newPlayers[id]
    if (p.status === PLAYER_STATUS.ACTIVE) {
      const score = calcRoundScore(p)
      newPlayers[id] = { ...p, totalScore: p.totalScore + score }
      newDiscard.push(...p.numbers, ...p.modifiers)
      if (p.secondChance) newDiscard.push(p.secondChance)
    }
  }

  const playerArr = state.playerOrder.map((id) => newPlayers[id])
  const winner = getWinner(playerArr)
  if (winner) {
    return {
      ...state,
      players: newPlayers,
      discard: newDiscard,
      status: 'finished',
      winner: winner.id,
      pendingAction: null,
    }
  }

  // Reset everyone for the next round. The deck persists across rounds —
  // it is only reshuffled (from the discard pile) when drawCard finds it
  // empty mid-game.
  const resetPlayers = {}
  for (const id of state.playerOrder) {
    resetPlayers[id] = resetPlayerForRound(newPlayers[id])
  }
  return {
    ...state,
    players: resetPlayers,
    round: state.round + 1,
    phase: 'initialDeal',
    initialDealtIds: [],
    turnIndex: 0,
    discard: newDiscard,
    pendingAction: null,
    lastDrawn: null,
    lastFreeze: null,
    status: 'playing',
  }
}

// ----------------------------------------------------------------------------
// hit / stay
// ----------------------------------------------------------------------------

// Full draw: applies the drawn card AND any post-draw transitions
// (turn advance / round end). Use this for the standard call site.
export function hit(state) {
  const intermediate = hitDeferred(state)
  if (intermediate === state) return state
  return flushPostDraw(intermediate)
}

// Deferred variant: applies the drawn card and updates the player, but does
// NOT advance the turn or end the round. Caller must invoke `flushPostDraw`
// to commit the post-draw transitions. Used by the UI to hold onto a busted
// state long enough to show the bust modal before the round ends.
export function hitDeferred(state) {
  if (state.pendingAction) return state
  const playerId = getCurrentPlayerId(state)
  if (!playerId) return state
  const player = state.players[playerId]
  if (player.status !== PLAYER_STATUS.ACTIVE) return state

  const { card, deck, discard } = drawCard(state.deck, state.discard)
  if (!card) {
    // Deck and discard both empty — forced stay for the drawing player.
    if (player.numbers.length === 0 && player.modifiers.length === 0) {
      // Nothing to bank; just pass the turn (or end round if no one else is active).
      return advanceAfterAction(state)
    }
    const { player: np, discard: dc } = engineStay(player)
    let s = setPlayer(state, playerId, np)
    s = appendDiscard(s, dc)
    return advanceAfterAction(s)
  }

  let newState = { ...state, deck, discard }
  newState = withDrawnCard(newState, playerId, card)

  if (card.type === CARD_TYPE.NUMBER) {
    return resolveNumberCardDeferred(newState, playerId, card)
  }
  if (card.type === CARD_TYPE.MODIFIER) {
    const { player: np } = applyModifierCard(player, card)
    return setPlayer(newState, playerId, np)
  }
  if (card.type === CARD_TYPE.ACTION) {
    return resolveActionCard(newState, playerId, card)
  }
  return newState
}

// Apply post-draw transitions: round-end on Flip 7, otherwise advance the
// turn. A draw that triggered a pending action (freeze/flipThree/reassign
// secondChance) holds the turn open until selectTarget runs.
export function flushPostDraw(state) {
  if (state.pendingAction) return state
  if (state.lastDrawn?.result === NUMBER_RESULT.FLIP_7) return endRound(state)
  return advanceAfterAction(state)
}

// Returns true when the *current* state would end the round if flushed.
// Used by the UI to decide whether to defer the round-end transition behind
// the bust / freeze / flip-7 modal acknowledgment.
export function wouldEndRound(state) {
  if (state.pendingAction) return false
  const r = state.lastDrawn?.result
  if (r === NUMBER_RESULT.FLIP_7) return true
  return activePlayers(state).length === 0
}

function resolveNumberCardDeferred(state, playerId, card) {
  const player = state.players[playerId]
  const { player: np, result, discard: dc } = applyNumberCard(player, card)
  let s = setPlayer(state, playerId, np)
  s = appendDiscard(s, dc)
  s = setLastDrawnResult(s, result)

  // Flip 7 banks the +15 bonus immediately on the player so the leaderboard
  // updates, but the actual round-end transition is deferred to flushPostDraw.
  if (result === NUMBER_RESULT.FLIP_7) {
    const score = calcRoundScore(np)
    const cardsBack = [...np.numbers, ...np.modifiers]
    if (np.secondChance) cardsBack.push(np.secondChance)
    s = setPlayer(s, playerId, {
      ...np,
      numbers: [],
      modifiers: [],
      secondChance: null,
      status: PLAYER_STATUS.STAYED,
      totalScore: np.totalScore + score,
    })
    s = appendDiscard(s, cardsBack)
  }
  return s
}

function resolveActionCard(state, playerId, card) {
  if (card.action === ACTION_TYPE.SECOND_CHANCE) {
    const player = state.players[playerId]
    const { player: np, result } = applySecondChance(player, card)
    if (result === SECOND_CHANCE_RESULT.KEPT) {
      return setPlayer(state, playerId, np)
    }
    // Already had one — must reassign. UI will pick a target via selectTarget.
    return { ...state, pendingAction: { card, fromPlayerId: playerId, kind: 'reassignSecondChance' } }
  }
  if (card.action === ACTION_TYPE.FREEZE) {
    return { ...state, pendingAction: { card, fromPlayerId: playerId, kind: 'freeze' } }
  }
  if (card.action === ACTION_TYPE.FLIP_THREE) {
    return { ...state, pendingAction: { card, fromPlayerId: playerId, kind: 'flipThree' } }
  }
  return state
}

// Current player voluntarily ends their turn.
export function stay(state) {
  if (state.pendingAction) return state
  if (state.phase === 'initialDeal') return state
  const playerId = getCurrentPlayerId(state)
  const player = state.players[playerId]
  if (player.status !== PLAYER_STATUS.ACTIVE) return state
  if (player.numbers.length === 0 && player.modifiers.length === 0) return state

  const { player: np, discard: dc } = engineStay(player)
  let s = setPlayer(state, playerId, np)
  s = appendDiscard(s, dc)
  return advanceAfterAction(s)
}

// ----------------------------------------------------------------------------
// action-card targeting
// ----------------------------------------------------------------------------

// The list of valid target user_ids for the current pendingAction.
// Used by the UI to populate its target picker.
export function targetableForPending(state) {
  if (!state.pendingAction) return []
  const { kind, fromPlayerId } = state.pendingAction
  return state.playerOrder.filter((id) => {
    const p = state.players[id]
    if (kind === 'freeze') {
      // Can target any active player including yourself
      return p.status === PLAYER_STATUS.ACTIVE
    }
    if (kind === 'flipThree') {
      return p.status === PLAYER_STATUS.ACTIVE
    }
    if (kind === 'reassignSecondChance') {
      return id !== fromPlayerId && p.status === PLAYER_STATUS.ACTIVE && !p.secondChance
    }
    return false
  })
}

// Resolve the pending action against a chosen target without advancing
// the turn. Used by the UI so a freeze that ends the round can be paused
// behind the freeze modal before the round-end transition fires.
// For non-freeze actions, this is identical to `selectTarget` minus the
// final advance step.
export function selectTargetDeferred(state, targetId) {
  const action = state.pendingAction
  if (!action) return state
  const { kind, card, fromPlayerId } = action

  if (kind === 'freeze') {
    const target = state.players[targetId]
    const { player: np, discard: dc, pointsBanked } = applyFreeze(target, card)
    let s = { ...state, pendingAction: null }
    s = setPlayer(s, targetId, np)
    s = appendDiscard(s, dc)
    s = {
      ...s,
      lastFreeze: { targetId, fromPlayerId, pointsBanked, at: Date.now() },
    }
    return s
  }
  // Non-freeze actions don't need a deferred path — fall through to the
  // immediate variant.
  return selectTarget(state, targetId)
}

// Resolve the pending action against a chosen target.
export function selectTarget(state, targetId) {
  const action = state.pendingAction
  if (!action) return state
  const { kind, card, fromPlayerId } = action

  if (kind === 'freeze') {
    const target = state.players[targetId]
    const { player: np, discard: dc, pointsBanked } = applyFreeze(target, card)
    let s = { ...state, pendingAction: null }
    s = setPlayer(s, targetId, np)
    s = appendDiscard(s, dc)
    s = {
      ...s,
      lastFreeze: { targetId, fromPlayerId, pointsBanked, at: Date.now() },
    }
    // Action card was the drawer's single turn-action; advance regardless
    // of whether the drawer is still active.
    return advanceAfterAction(s)
  }

  if (kind === 'reassignSecondChance') {
    const target = state.players[targetId]
    const { player: np } = applySecondChance(target, card)
    const s = {
      ...state,
      players: { ...state.players, [targetId]: np },
      pendingAction: null,
    }
    return advanceAfterAction(s)
  }

  if (kind === 'flipThree') {
    // Discard the flip-three card itself, then have target draw 3.
    let s = { ...state, pendingAction: null, discard: [...state.discard, card] }
    for (let i = 0; i < FLIP_THREE_DRAWS; i++) {
      const target = s.players[targetId]
      if (!target || target.status !== PLAYER_STATUS.ACTIVE) break
      const { card: drawn, deck, discard } = drawCard(s.deck, s.discard)
      if (!drawn) break
      s = { ...s, deck, discard }
      s = withDrawnCard(s, targetId, drawn)
      if (drawn.type === CARD_TYPE.NUMBER) {
        s = resolveNumberCardDeferred(s, targetId, drawn)
        // Flip 7 inside a Flip Three ends the round immediately.
        if (s.lastDrawn?.result === NUMBER_RESULT.FLIP_7) return endRound(s)
        // Bust inside Flip Three stops the cascade but does NOT advance
        // the turn yet — the outer advanceAfterAction below handles that.
        if (s.players[targetId].status !== PLAYER_STATUS.ACTIVE) break
      } else if (drawn.type === CARD_TYPE.MODIFIER) {
        const { player: np } = applyModifierCard(target, drawn)
        s = setPlayer(s, targetId, np)
      } else if (drawn.type === CARD_TYPE.ACTION) {
        // Nested action cards during Flip Three: per simplified rules, just discard.
        s = appendDiscard(s, [drawn])
      }
    }
    return advanceAfterAction(s)
  }

  return state
}

// Cancel a pending action — discard the card and advance the turn (the
// drawer's single turn-action has been consumed even if no target is chosen).
export function cancelPending(state) {
  if (!state.pendingAction) return state
  const card = state.pendingAction.card
  const s = {
    ...state,
    pendingAction: null,
    discard: [...state.discard, card],
  }
  return advanceAfterAction(s)
}
