import test from "node:test";
import assert from "node:assert/strict";
import {
  LOCAL_KEY,
  TABS,
  deriveSnapshot,
  filterWords,
  missionCta,
  normalizeDailyMission,
  normalizeEnvelope,
  normalizeTab,
  snapshotFingerprint,
  tabFromHash
} from "../ui-v9-core.js";

const NOW = new Date("2026-08-31T09:00:00+09:00");

function legacyEnvelope() {
  return {
    player: {
      name: "Heather",
      score: 30976,
      coin: 179,
      xp: 321000,
      combo: 2,
      bestCombo: 48,
      sound: true,
      progress: {
        apple: { correct: 7, wrong: 2, skip: 1 },
        __season2: {
          schemaVersion: 8,
          partnerId: "s2_cookie_crumb_bear_1",
          discoveryPoints: 44,
          evolutionMaterials: 3,
          season2Collection: { s2_cookie_crumb_bear_1: true },
          wordMastery: {
            apple: { level: 5, wrong: 2, correct: 7, nextReviewAt: "2026-08-30T00:00:00.000Z" },
            banana: { level: 1, wrong: 3, correct: 1, nextReviewAt: "2026-09-03T00:00:00.000Z" }
          },
          studyStreak: { current: 5, best: 12, protectedDays: 1 },
          dailyAdventure: { stageIndex: 2, stars: [3, 2, 0, 0], completed: false, session: { id: "x" } },
          weeklyProgress: { activeDays: ["2026-08-27", "2026-08-28"], adventures: 2, bosses: 1 },
          incubatingEgg: { worldId: "cookie", progress: 68 },
          settings: { ageBand: "challenge", reducedMotion: true, autoTts: false, timerEnabled: false }
        }
      },
      dailyMission: {
        date: "2026-08-31",
        cardViews: 5,
        gameCorrect: 3,
        writingAttempts: 1,
        rewarded: false
      },
      knownCards: { apple: true },
      ownedPets: { pet_panda: true },
      equippedPet: "pet_panda",
      ownedAvatarItems: { outfit_basic_01: true },
      equippedAvatar: { outfit: "outfit_basic_01" }
    },
    selectedCategoryId: "fruit",
    categories: [
      { id: "fruit", name: "과일", emoji: "🍎" },
      { id: "family", name: "가족", emoji: "👨‍👩‍👧" }
    ],
    words: [
      { id: "apple", word: "apple", meaning: "사과", categoryId: "fruit", emoji: "🍎" },
      { id: "banana", word: "banana", meaning: "바나나", categoryId: "fruit", emoji: "🍌" },
      { id: "mother", word: "mother", meaning: "엄마", categoryId: "family", emoji: "" }
    ]
  };
}

test("keeps the production localStorage key and five-tab IA contract", () => {
  assert.equal(LOCAL_KEY, "heather_word_v3");
  assert.deepEqual(TABS, ["home", "learn", "games", "collection", "my"]);
  assert.equal(normalizeTab("games"), "games");
  assert.equal(normalizeTab("admin"), "home");
  assert.equal(tabFromHash("#/collection"), "collection");
  assert.equal(tabFromHash("#/not-real"), "home");
});

test("normalizes corrupt envelopes without deleting unknown legacy data", () => {
  const source = { player: "bad", words: null, categories: 4, selectedCategoryId: 99, untouched: { keep: true } };
  const result = normalizeEnvelope(source);
  assert.deepEqual(result.player, {});
  assert.deepEqual(result.words, []);
  assert.deepEqual(result.categories, []);
  assert.equal(result.selectedCategoryId, "99");
  assert.deepEqual(result.untouched, { keep: true });
});

test("derives the commercial shell snapshot without mutating legacy balances or ownership", () => {
  const input = legacyEnvelope();
  const before = JSON.stringify(input);
  const snapshot = deriveSnapshot(input, { now: NOW });

  assert.equal(snapshot.name, "Heather");
  assert.equal(snapshot.score, 30976);
  assert.equal(snapshot.coin, 179);
  assert.equal(snapshot.xp, 321000);
  assert.equal(snapshot.wordCount, 3);
  assert.equal(snapshot.knownCount, 1);
  assert.equal(snapshot.ownedSeason2, 1);
  assert.equal(snapshot.partnerId, "s2_cookie_crumb_bear_1");
  assert.equal(snapshot.streak.current, 5);
  assert.equal(snapshot.adventure.stageIndex, 2);
  assert.equal(snapshot.adventure.stars, 5);
  assert.equal(snapshot.adventure.hasSession, true);
  assert.equal(snapshot.mastery.mastered, 1);
  assert.equal(snapshot.mastery.difficult, 1);
  assert.equal(snapshot.settings.ageBand, "challenge");
  assert.equal(snapshot.settings.reducedMotion, true);
  assert.equal(JSON.stringify(input), before);
});

test("compresses the legacy three-part mission into one deterministic progress model", () => {
  const mission = normalizeDailyMission(legacyEnvelope().player.dailyMission, NOW);
  assert.equal(mission.total, 9);
  assert.equal(mission.target, 13);
  assert.equal(mission.percent, 69);
  assert.equal(mission.complete, false);

  const snapshot = deriveSnapshot(legacyEnvelope(), { now: NOW });
  const cta = missionCta(snapshot);
  assert.match(cta.label, /이어서 학습/);
  assert.match(cta.note, /3번째 단계/);
});

test("daily mission resets visually on a new day without rewriting stored data", () => {
  const old = legacyEnvelope().player.dailyMission;
  const mission = normalizeDailyMission(old, new Date("2026-09-01T09:00:00+09:00"));
  assert.equal(mission.cardViews, 0);
  assert.equal(mission.gameCorrect, 0);
  assert.equal(mission.writingAttempts, 0);
  assert.equal(old.cardViews, 5);
});

test("word library search supports Korean, English, category and long values", () => {
  const words = [
    ...legacyEnvelope().words,
    { id: "long", word: "pneumonoultramicroscopicsilicovolcanoconiosis", meaning: "매우 긴 단어", categoryId: "custom" }
  ];
  assert.deepEqual(filterWords(words, "BAN", "all").map((item) => item.id), ["banana"]);
  assert.deepEqual(filterWords(words, "엄마", "all").map((item) => item.id), ["mother"]);
  assert.deepEqual(filterWords(words, "", "fruit").map((item) => item.id), ["apple", "banana"]);
  assert.equal(filterWords(words, "pneumo", "all")[0].word.length > 40, true);
});

test("snapshot fingerprint changes only for user-visible state inputs", () => {
  const base = deriveSnapshot(legacyEnvelope(), { now: NOW });
  const same = deriveSnapshot(structuredClone(legacyEnvelope()), { now: NOW });
  assert.equal(snapshotFingerprint(base), snapshotFingerprint(same));

  const changedEnvelope = legacyEnvelope();
  changedEnvelope.player.coin += 1;
  const changed = deriveSnapshot(changedEnvelope, { now: NOW });
  assert.notEqual(snapshotFingerprint(base), snapshotFingerprint(changed));
});
