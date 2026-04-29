import {
  DECK_SIZE,
  FLIP_7_SIZE,
  FLIP_7_BONUS,
  WIN_THRESHOLD,
  CARD_TYPE,
  MODIFIER_TYPE,
  ACTION_TYPE,
  PLAYER_STATUS,
  NUMBER_RESULT,
  SECOND_CHANCE_RESULT,
  NUMBER_CARD_COUNTS,
  buildDeck,
  shuffle,
  drawCard,
  createPlayer,
  isActive,
  hasDuplicateNumber,
  hasFlip7,
  resetPlayerForRound,
  calcRoundScore,
  applyNumberCard,
  applyModifierCard,
  applyFreeze,
  applySecondChance,
  stay,
  hasWinner,
  getWinner,
} from './engine.js';

// Deterministic rng for tests (mulberry32).
function seedRng(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const numCard = (v) => ({ type: CARD_TYPE.NUMBER, value: v });
const plusCard = (v) => ({ type: CARD_TYPE.MODIFIER, modifier: MODIFIER_TYPE.PLUS, value: v });
const x2Card = () => ({ type: CARD_TYPE.MODIFIER, modifier: MODIFIER_TYPE.X2 });
const freezeCard = () => ({ type: CARD_TYPE.ACTION, action: ACTION_TYPE.FREEZE });
const flipThreeCard = () => ({ type: CARD_TYPE.ACTION, action: ACTION_TYPE.FLIP_THREE });
const secondChanceCard = () => ({ type: CARD_TYPE.ACTION, action: ACTION_TYPE.SECOND_CHANCE });

// ============================================================
// buildDeck
// ============================================================

describe('buildDeck', () => {
  const deck = buildDeck();

  test('has exactly 94 cards', () => {
    expect(deck).toHaveLength(DECK_SIZE);
  });

  test('has N copies of each number card N (plus one 0)', () => {
    for (let v = 0; v <= 12; v++) {
      const count = deck.filter((c) => c.type === CARD_TYPE.NUMBER && c.value === v).length;
      expect(count).toBe(NUMBER_CARD_COUNTS[v]);
    }
  });

  test('has 79 number cards total', () => {
    expect(deck.filter((c) => c.type === CARD_TYPE.NUMBER)).toHaveLength(79);
  });

  test('has one of each modifier card', () => {
    const mods = deck.filter((c) => c.type === CARD_TYPE.MODIFIER);
    expect(mods).toHaveLength(6);
    for (const v of [2, 4, 6, 8, 10]) {
      expect(
        mods.filter((m) => m.modifier === MODIFIER_TYPE.PLUS && m.value === v),
      ).toHaveLength(1);
    }
    expect(mods.filter((m) => m.modifier === MODIFIER_TYPE.X2)).toHaveLength(1);
  });

  test('has 3 of each action card', () => {
    const actions = deck.filter((c) => c.type === CARD_TYPE.ACTION);
    expect(actions).toHaveLength(9);
    expect(actions.filter((a) => a.action === ACTION_TYPE.FREEZE)).toHaveLength(3);
    expect(actions.filter((a) => a.action === ACTION_TYPE.FLIP_THREE)).toHaveLength(3);
    expect(actions.filter((a) => a.action === ACTION_TYPE.SECOND_CHANCE)).toHaveLength(3);
  });
});

// ============================================================
// shuffle
// ============================================================

describe('shuffle', () => {
  test('returns an array of the same length', () => {
    const deck = buildDeck();
    expect(shuffle(deck)).toHaveLength(deck.length);
  });

  test('preserves every card (same multiset)', () => {
    const deck = buildDeck();
    const shuffled = shuffle(deck);
    const key = (c) => JSON.stringify(c);
    expect(shuffled.map(key).sort()).toEqual(deck.map(key).sort());
  });

  test('does not mutate the input', () => {
    const deck = [1, 2, 3, 4, 5];
    const snapshot = [...deck];
    shuffle(deck, seedRng(42));
    expect(deck).toEqual(snapshot);
  });

  test('is deterministic with a seeded RNG', () => {
    const deck = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(shuffle(deck, seedRng(42))).toEqual(shuffle(deck, seedRng(42)));
  });

  test('actually reorders (with a non-trivial deck)', () => {
    const deck = Array.from({ length: 20 }, (_, i) => i);
    const shuffled = shuffle(deck, seedRng(1));
    expect(shuffled).not.toEqual(deck);
  });
});

// ============================================================
// drawCard
// ============================================================

describe('drawCard', () => {
  test('removes the top card from the deck', () => {
    const deck = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const result = drawCard(deck, []);
    expect(result.card).toEqual({ id: 3 });
    expect(result.deck).toEqual([{ id: 1 }, { id: 2 }]);
    expect(result.discard).toEqual([]);
  });

  test('does not mutate the input deck', () => {
    const deck = [{ id: 1 }, { id: 2 }];
    const snapshot = [...deck];
    drawCard(deck, []);
    expect(deck).toEqual(snapshot);
  });

  test('reshuffles the discard pile into the deck when the deck is empty', () => {
    const discard = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const result = drawCard([], discard, seedRng(1));
    expect(result.card).not.toBeNull();
    expect(result.deck.length + 1).toBe(discard.length);
    expect(result.discard).toEqual([]);
  });

  test('returns card: null when both piles are empty', () => {
    expect(drawCard([], []).card).toBeNull();
  });
});

// ============================================================
// Player helpers
// ============================================================

describe('createPlayer', () => {
  test('initializes a fresh, active player', () => {
    const p = createPlayer('Alice');
    expect(p.name).toBe('Alice');
    expect(p.totalScore).toBe(0);
    expect(p.numbers).toEqual([]);
    expect(p.modifiers).toEqual([]);
    expect(p.secondChance).toBeNull();
    expect(p.status).toBe(PLAYER_STATUS.ACTIVE);
  });
});

describe('isActive', () => {
  test.each([
    [PLAYER_STATUS.ACTIVE, true],
    [PLAYER_STATUS.BUSTED, false],
    [PLAYER_STATUS.STAYED, false],
    [PLAYER_STATUS.FROZEN, false],
  ])('returns %s → %s', (status, expected) => {
    expect(isActive({ ...createPlayer('P'), status })).toBe(expected);
  });
});

describe('hasDuplicateNumber', () => {
  test('returns true when the player already holds that number', () => {
    const p = { ...createPlayer('P'), numbers: [numCard(5)] };
    expect(hasDuplicateNumber(p, numCard(5))).toBe(true);
  });

  test('returns false for a new number', () => {
    const p = { ...createPlayer('P'), numbers: [numCard(5)] };
    expect(hasDuplicateNumber(p, numCard(6))).toBe(false);
  });

  test('returns false for non-number cards', () => {
    const p = { ...createPlayer('P'), numbers: [numCard(5)] };
    expect(hasDuplicateNumber(p, plusCard(4))).toBe(false);
    expect(hasDuplicateNumber(p, freezeCard())).toBe(false);
  });
});

describe('hasFlip7', () => {
  test('true only with exactly 7 number cards', () => {
    const make = (n) => ({
      ...createPlayer('P'),
      numbers: Array.from({ length: n }, (_, i) => numCard(i)),
    });
    expect(hasFlip7(make(6))).toBe(false);
    expect(hasFlip7(make(7))).toBe(true);
  });
});

describe('resetPlayerForRound', () => {
  test('clears cards and status but preserves totalScore', () => {
    const p = {
      ...createPlayer('P'),
      totalScore: 123,
      numbers: [numCard(5)],
      modifiers: [plusCard(4)],
      secondChance: secondChanceCard(),
      status: PLAYER_STATUS.BUSTED,
    };
    const reset = resetPlayerForRound(p);
    expect(reset.totalScore).toBe(123);
    expect(reset.numbers).toEqual([]);
    expect(reset.modifiers).toEqual([]);
    expect(reset.secondChance).toBeNull();
    expect(reset.status).toBe(PLAYER_STATUS.ACTIVE);
  });
});

// ============================================================
// calcRoundScore
// ============================================================

describe('calcRoundScore', () => {
  test('sums number cards with no modifiers', () => {
    const p = { ...createPlayer('P'), numbers: [numCard(3), numCard(11), numCard(5)] };
    expect(calcRoundScore(p)).toBe(19);
  });

  test('adds flat modifier bonuses', () => {
    const p = {
      ...createPlayer('P'),
      numbers: [numCard(3), numCard(5)],
      modifiers: [plusCard(4)],
    };
    expect(calcRoundScore(p)).toBe(12);
  });

  test('applies x2 before adding flat bonuses (per rules)', () => {
    // (11+5+12) = 28, ×2 = 56, +4 = 60
    const p = {
      ...createPlayer('P'),
      numbers: [numCard(11), numCard(5), numCard(12)],
      modifiers: [x2Card(), plusCard(4)],
    };
    expect(calcRoundScore(p)).toBe(60);
  });

  test('adds 15-point Flip 7 bonus for exactly 7 unique numbers', () => {
    const numbers = [0, 1, 2, 3, 4, 5, 6].map(numCard);
    const p = { ...createPlayer('P'), numbers };
    // sum = 21, + 15 = 36
    expect(calcRoundScore(p)).toBe(36);
  });

  test('combines x2, flat bonus, and Flip 7 in the right order', () => {
    // (1+2+3+4+5+6+7) = 28, ×2 = 56, +4+10 = 70, +15 = 85
    const numbers = [1, 2, 3, 4, 5, 6, 7].map(numCard);
    const p = {
      ...createPlayer('P'),
      numbers,
      modifiers: [x2Card(), plusCard(4), plusCard(10)],
    };
    expect(calcRoundScore(p)).toBe(85);
  });

  test('busted players always score 0', () => {
    const p = {
      ...createPlayer('P'),
      numbers: [numCard(12)],
      modifiers: [plusCard(10)],
      status: PLAYER_STATUS.BUSTED,
    };
    expect(calcRoundScore(p)).toBe(0);
  });

  test('x2 with no numbers scores 0 (0 × 2 = 0)', () => {
    const p = { ...createPlayer('P'), modifiers: [x2Card()] };
    expect(calcRoundScore(p)).toBe(0);
  });

  test('a plus modifier with no numbers still scores', () => {
    const p = { ...createPlayer('P'), modifiers: [plusCard(4)] };
    expect(calcRoundScore(p)).toBe(4);
  });
});

// ============================================================
// applyNumberCard
// ============================================================

describe('applyNumberCard', () => {
  test('adds a new number card', () => {
    const p = createPlayer('P');
    const r = applyNumberCard(p, numCard(7));
    expect(r.result).toBe(NUMBER_RESULT.ADDED);
    expect(r.player.numbers).toEqual([numCard(7)]);
    expect(r.discard).toEqual([]);
  });

  test('busts on a duplicate number, clearing all cards', () => {
    const p = {
      ...createPlayer('P'),
      numbers: [numCard(7), numCard(3)],
      modifiers: [plusCard(4)],
    };
    const r = applyNumberCard(p, numCard(7));
    expect(r.result).toBe(NUMBER_RESULT.BUSTED);
    expect(r.player.status).toBe(PLAYER_STATUS.BUSTED);
    expect(r.player.numbers).toEqual([]);
    expect(r.player.modifiers).toEqual([]);
    // discard should contain everything the player had + the bust card
    expect(r.discard).toHaveLength(4);
    expect(r.discard).toEqual(
      expect.arrayContaining([numCard(7), numCard(3), plusCard(4), numCard(7)]),
    );
  });

  test('Second Chance saves the player from a duplicate', () => {
    const sc = secondChanceCard();
    const p = {
      ...createPlayer('P'),
      numbers: [numCard(7)],
      secondChance: sc,
    };
    const dup = numCard(7);
    const r = applyNumberCard(p, dup);
    expect(r.result).toBe(NUMBER_RESULT.SAVED);
    expect(r.player.secondChance).toBeNull();
    expect(r.player.numbers).toEqual([numCard(7)]);
    expect(r.player.status).toBe(PLAYER_STATUS.ACTIVE);
    expect(r.discard).toEqual([sc, dup]);
  });

  test('returns FLIP_7 when the 7th unique number lands', () => {
    const numbers = [0, 1, 2, 3, 4, 5].map(numCard);
    const p = { ...createPlayer('P'), numbers };
    const r = applyNumberCard(p, numCard(6));
    expect(r.result).toBe(NUMBER_RESULT.FLIP_7);
    expect(r.player.numbers).toHaveLength(7);
    expect(r.player.status).toBe(PLAYER_STATUS.ACTIVE);
  });

  test('does not mutate the input player', () => {
    const p = createPlayer('P');
    const snapshot = JSON.parse(JSON.stringify(p));
    applyNumberCard(p, numCard(7));
    expect(p).toEqual(snapshot);
  });

  test('throws when given a non-number card', () => {
    expect(() => applyNumberCard(createPlayer('P'), plusCard(4))).toThrow();
  });
});

// ============================================================
// applyModifierCard
// ============================================================

describe('applyModifierCard', () => {
  test('adds the modifier to the player', () => {
    const p = createPlayer('P');
    const r = applyModifierCard(p, plusCard(6));
    expect(r.player.modifiers).toEqual([plusCard(6)]);
  });

  test('throws when given a non-modifier card', () => {
    expect(() => applyModifierCard(createPlayer('P'), numCard(5))).toThrow();
  });
});

// ============================================================
// applyFreeze
// ============================================================

describe('applyFreeze', () => {
  test('banks the target’s points and sets them to FROZEN', () => {
    const target = {
      ...createPlayer('P'),
      totalScore: 50,
      numbers: [numCard(5), numCard(3)],
      modifiers: [plusCard(4)],
    };
    const card = freezeCard();
    const r = applyFreeze(target, card);
    expect(r.pointsBanked).toBe(12);
    expect(r.player.totalScore).toBe(62);
    expect(r.player.status).toBe(PLAYER_STATUS.FROZEN);
    expect(r.player.numbers).toEqual([]);
    expect(r.player.modifiers).toEqual([]);
    expect(r.discard).toEqual(expect.arrayContaining([numCard(5), numCard(3), plusCard(4), card]));
  });

  test('discards the target’s Second Chance if they had one', () => {
    const sc = secondChanceCard();
    const target = {
      ...createPlayer('P'),
      numbers: [numCard(5)],
      secondChance: sc,
    };
    const card = freezeCard();
    const r = applyFreeze(target, card);
    expect(r.player.secondChance).toBeNull();
    expect(r.discard).toEqual(expect.arrayContaining([sc]));
  });

  test('throws when given a non-freeze card', () => {
    expect(() => applyFreeze(createPlayer('P'), flipThreeCard())).toThrow();
  });
});

// ============================================================
// applySecondChance
// ============================================================

describe('applySecondChance', () => {
  test('target keeps the card when they don’t already hold one', () => {
    const p = createPlayer('P');
    const card = secondChanceCard();
    const r = applySecondChance(p, card);
    expect(r.result).toBe(SECOND_CHANCE_RESULT.KEPT);
    expect(r.player.secondChance).toBe(card);
  });

  test('returns MUST_REASSIGN when the target already has one', () => {
    const p = { ...createPlayer('P'), secondChance: secondChanceCard() };
    const r = applySecondChance(p, secondChanceCard());
    expect(r.result).toBe(SECOND_CHANCE_RESULT.MUST_REASSIGN);
    expect(r.player).toBe(p);
  });

  test('throws when given a non-secondChance card', () => {
    expect(() => applySecondChance(createPlayer('P'), freezeCard())).toThrow();
  });
});

// ============================================================
// stay
// ============================================================

describe('stay', () => {
  test('banks points, clears cards, sets status to STAYED', () => {
    const p = {
      ...createPlayer('P'),
      totalScore: 10,
      numbers: [numCard(5), numCard(3)],
      modifiers: [plusCard(4)],
    };
    const r = stay(p);
    expect(r.pointsBanked).toBe(12);
    expect(r.player.totalScore).toBe(22);
    expect(r.player.status).toBe(PLAYER_STATUS.STAYED);
    expect(r.player.numbers).toEqual([]);
    expect(r.player.modifiers).toEqual([]);
    expect(r.discard).toHaveLength(3);
  });

  test('throws when the player has no cards', () => {
    expect(() => stay(createPlayer('P'))).toThrow();
  });
});

// ============================================================
// Win conditions
// ============================================================

describe('hasWinner / getWinner', () => {
  test('hasWinner is false when nobody has reached the threshold', () => {
    const players = [
      { ...createPlayer('A'), totalScore: 150 },
      { ...createPlayer('B'), totalScore: 199 },
    ];
    expect(hasWinner(players)).toBe(false);
    expect(getWinner(players)).toBeNull();
  });

  test('hasWinner is true once any player reaches the threshold', () => {
    const players = [
      { ...createPlayer('A'), totalScore: 199 },
      { ...createPlayer('B'), totalScore: WIN_THRESHOLD },
    ];
    expect(hasWinner(players)).toBe(true);
  });

  test('getWinner returns the highest-scoring player', () => {
    const players = [
      { ...createPlayer('A'), totalScore: 210 },
      { ...createPlayer('B'), totalScore: 205 },
      { ...createPlayer('C'), totalScore: 220 },
    ];
    expect(getWinner(players).name).toBe('C');
  });

  test('getWinner breaks ties by earliest index', () => {
    const players = [
      { ...createPlayer('A'), totalScore: 220 },
      { ...createPlayer('B'), totalScore: 220 },
    ];
    expect(getWinner(players).name).toBe('A');
  });

  test('respects a custom threshold', () => {
    const players = [{ ...createPlayer('A'), totalScore: 50 }];
    expect(hasWinner(players, 40)).toBe(true);
    expect(getWinner(players, 40).name).toBe('A');
  });
});

// ============================================================
// Scoring example from the rules PDF
// ============================================================

describe('rules-PDF scoring examples', () => {
  test('example: 11 + 5 + 12 + (+4) = 32', () => {
    const p = {
      ...createPlayer('P'),
      numbers: [numCard(11), numCard(5), numCard(12)],
      modifiers: [plusCard(4)],
    };
    expect(calcRoundScore(p)).toBe(32);
  });

  test('example: (3+11+5+7+10) = 36, ×2 = 72', () => {
    const p = {
      ...createPlayer('P'),
      numbers: [numCard(3), numCard(11), numCard(5), numCard(7), numCard(10)],
      modifiers: [x2Card()],
    };
    expect(calcRoundScore(p)).toBe(72);
  });

  test('example: Flip 7 with bonus — (3+11+5+7+10+8+4) = 48, +15 = 63... plus the rules show +1 too', () => {
    // Rules show final score of 64 on page with: 3+11+5+7+10+8+4+(+1-unclear modifier) = 64
    // Simpler check: sum is 48, +15 for flip7 = 63
    const numbers = [3, 11, 5, 7, 10, 8, 4].map(numCard);
    const p = { ...createPlayer('P'), numbers };
    expect(p.numbers).toHaveLength(FLIP_7_SIZE);
    expect(calcRoundScore(p)).toBe(48 + FLIP_7_BONUS);
  });
});
