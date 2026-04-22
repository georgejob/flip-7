// Pure game logic for Flip 7. No React, no Supabase, no I/O.
// Every function treats its inputs as immutable and returns new state.

// ============================================================
// Constants
// ============================================================

export const DECK_SIZE = 94;
export const FLIP_7_SIZE = 7;
export const FLIP_7_BONUS = 15;
export const FLIP_THREE_DRAWS = 3;
export const WIN_THRESHOLD = 200;

export const CARD_TYPE = Object.freeze({
  NUMBER: 'number',
  MODIFIER: 'modifier',
  ACTION: 'action',
});

export const MODIFIER_TYPE = Object.freeze({
  PLUS: 'plus',
  X2: 'x2',
});

export const ACTION_TYPE = Object.freeze({
  FREEZE: 'freeze',
  FLIP_THREE: 'flipThree',
  SECOND_CHANCE: 'secondChance',
});

export const PLAYER_STATUS = Object.freeze({
  ACTIVE: 'active',
  BUSTED: 'busted',
  STAYED: 'stayed',
  FROZEN: 'frozen',
});

export const NUMBER_RESULT = Object.freeze({
  ADDED: 'added',
  BUSTED: 'busted',
  SAVED: 'saved',
  FLIP_7: 'flip7',
});

export const SECOND_CHANCE_RESULT = Object.freeze({
  KEPT: 'kept',
  MUST_REASSIGN: 'mustReassign',
});

// Number cards: N copies of the card with value N, plus one 0.
export const NUMBER_CARD_COUNTS = Object.freeze({
  0: 1, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6,
  7: 7, 8: 8, 9: 9, 10: 10, 11: 11, 12: 12,
});

export const MODIFIER_CARDS = Object.freeze([
  { type: CARD_TYPE.MODIFIER, modifier: MODIFIER_TYPE.PLUS, value: 2 },
  { type: CARD_TYPE.MODIFIER, modifier: MODIFIER_TYPE.PLUS, value: 4 },
  { type: CARD_TYPE.MODIFIER, modifier: MODIFIER_TYPE.PLUS, value: 6 },
  { type: CARD_TYPE.MODIFIER, modifier: MODIFIER_TYPE.PLUS, value: 8 },
  { type: CARD_TYPE.MODIFIER, modifier: MODIFIER_TYPE.PLUS, value: 10 },
  { type: CARD_TYPE.MODIFIER, modifier: MODIFIER_TYPE.X2 },
]);

export const ACTION_CARD_COUNTS = Object.freeze({
  [ACTION_TYPE.FREEZE]: 3,
  [ACTION_TYPE.FLIP_THREE]: 3,
  [ACTION_TYPE.SECOND_CHANCE]: 3,
});

// ============================================================
// Deck
// ============================================================

export function buildDeck() {
  const deck = [];
  for (const [valueStr, count] of Object.entries(NUMBER_CARD_COUNTS)) {
    const value = Number(valueStr);
    for (let i = 0; i < count; i++) {
      deck.push({ type: CARD_TYPE.NUMBER, value });
    }
  }
  for (const mod of MODIFIER_CARDS) {
    deck.push({ ...mod });
  }
  for (const [action, count] of Object.entries(ACTION_CARD_COUNTS)) {
    for (let i = 0; i < count; i++) {
      deck.push({ type: CARD_TYPE.ACTION, action });
    }
  }
  return deck;
}

// Fisher-Yates. Pass a seeded rng() for deterministic tests.
export function shuffle(deck, rng = Math.random) {
  const out = [...deck];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Draws the top card. If the deck is empty, reshuffles the discard pile
// into the deck first. Returns { card, deck, discard }; card is null only
// if both piles are empty.
export function drawCard(deck, discard, rng = Math.random) {
  let d = deck;
  let disc = discard;
  if (d.length === 0) {
    if (disc.length === 0) return { card: null, deck: d, discard: disc };
    d = shuffle(disc, rng);
    disc = [];
  }
  const card = d[d.length - 1];
  return { card, deck: d.slice(0, -1), discard: disc };
}

// ============================================================
// Player
// ============================================================

export function createPlayer(name, id = name) {
  return {
    id,
    name,
    totalScore: 0,
    numbers: [],
    modifiers: [],
    secondChance: null,
    status: PLAYER_STATUS.ACTIVE,
  };
}

export function isActive(player) {
  return player.status === PLAYER_STATUS.ACTIVE;
}

export function hasDuplicateNumber(player, card) {
  if (card.type !== CARD_TYPE.NUMBER) return false;
  return player.numbers.some((n) => n.value === card.value);
}

export function hasFlip7(player) {
  return player.numbers.length === FLIP_7_SIZE;
}

// Reset a player between rounds. Preserves totalScore.
export function resetPlayerForRound(player) {
  return {
    ...player,
    numbers: [],
    modifiers: [],
    secondChance: null,
    status: PLAYER_STATUS.ACTIVE,
  };
}

// ============================================================
// Scoring — sum → x2 → flat bonuses → Flip 7 bonus
// ============================================================

export function calcRoundScore(player) {
  if (player.status === PLAYER_STATUS.BUSTED) return 0;

  const numberSum = player.numbers.reduce((s, c) => s + c.value, 0);
  const hasX2 = player.modifiers.some((m) => m.modifier === MODIFIER_TYPE.X2);
  const flatBonus = player.modifiers
    .filter((m) => m.modifier === MODIFIER_TYPE.PLUS)
    .reduce((s, m) => s + m.value, 0);

  let score = hasX2 ? numberSum * 2 : numberSum;
  score += flatBonus;
  if (player.numbers.length === FLIP_7_SIZE) score += FLIP_7_BONUS;
  return score;
}

// ============================================================
// Applying cards — every function returns new state
// ============================================================

// Apply a number card. Returns { player, result, discard }, where:
//   result is one of NUMBER_RESULT,
//   discard holds any cards that should move to the discard pile.
export function applyNumberCard(player, card) {
  if (card.type !== CARD_TYPE.NUMBER) {
    throw new Error(`Expected number card, got ${card.type}`);
  }

  if (hasDuplicateNumber(player, card)) {
    if (player.secondChance) {
      return {
        player: { ...player, secondChance: null },
        result: NUMBER_RESULT.SAVED,
        discard: [player.secondChance, card],
      };
    }
    const discard = [...player.numbers, ...player.modifiers, card];
    return {
      player: {
        ...player,
        numbers: [],
        modifiers: [],
        secondChance: null,
        status: PLAYER_STATUS.BUSTED,
      },
      result: NUMBER_RESULT.BUSTED,
      discard,
    };
  }

  const numbers = [...player.numbers, card];
  const result = numbers.length === FLIP_7_SIZE ? NUMBER_RESULT.FLIP_7 : NUMBER_RESULT.ADDED;
  return {
    player: { ...player, numbers },
    result,
    discard: [],
  };
}

export function applyModifierCard(player, card) {
  if (card.type !== CARD_TYPE.MODIFIER) {
    throw new Error(`Expected modifier card, got ${card.type}`);
  }
  return {
    player: { ...player, modifiers: [...player.modifiers, card] },
  };
}

// Freeze: target banks points and is out of the round.
// Caller passes the freeze card itself so it can be included in the discard pile.
export function applyFreeze(target, card) {
  if (card.type !== CARD_TYPE.ACTION || card.action !== ACTION_TYPE.FREEZE) {
    throw new Error('Expected freeze card');
  }
  const pointsBanked = calcRoundScore(target);
  const discard = [...target.numbers, ...target.modifiers, card];
  if (target.secondChance) discard.push(target.secondChance);
  return {
    player: {
      ...target,
      status: PLAYER_STATUS.FROZEN,
      numbers: [],
      modifiers: [],
      secondChance: null,
      totalScore: target.totalScore + pointsBanked,
    },
    pointsBanked,
    discard,
  };
}

// Second Chance: if the target already holds one, the caller must reassign
// it to another eligible player (or discard it). Otherwise the target keeps it.
export function applySecondChance(target, card) {
  if (card.type !== CARD_TYPE.ACTION || card.action !== ACTION_TYPE.SECOND_CHANCE) {
    throw new Error('Expected secondChance card');
  }
  if (target.secondChance) {
    return { player: target, result: SECOND_CHANCE_RESULT.MUST_REASSIGN };
  }
  return {
    player: { ...target, secondChance: card },
    result: SECOND_CHANCE_RESULT.KEPT,
  };
}

// Stay: player voluntarily ends their round and banks their points.
// Throws if the player has no cards (per rules: must have at least one card to stay).
export function stay(player) {
  if (player.numbers.length === 0 && player.modifiers.length === 0) {
    throw new Error('Cannot stay without any cards');
  }
  const pointsBanked = calcRoundScore(player);
  const discard = [...player.numbers, ...player.modifiers];
  if (player.secondChance) discard.push(player.secondChance);
  return {
    player: {
      ...player,
      status: PLAYER_STATUS.STAYED,
      numbers: [],
      modifiers: [],
      secondChance: null,
      totalScore: player.totalScore + pointsBanked,
    },
    pointsBanked,
    discard,
  };
}

// ============================================================
// Win conditions
// ============================================================

export function hasWinner(players, threshold = WIN_THRESHOLD) {
  return players.some((p) => p.totalScore >= threshold);
}

// Highest-scoring player, but only once someone has crossed the threshold.
// Ties break on lowest index (earliest added).
export function getWinner(players, threshold = WIN_THRESHOLD) {
  if (!hasWinner(players, threshold)) return null;
  return players.reduce((best, p) => (p.totalScore > best.totalScore ? p : best));
}
