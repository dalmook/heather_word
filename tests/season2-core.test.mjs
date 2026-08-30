import test from "node:test";
import assert from "node:assert/strict";
import {
  LEGACY_COLLECTION_COMPLETE_XP,
  migratePlayer,
  selectAdaptiveWords,
  recordWordResult,
  applyStageReward,
  claimStarter,
  hatchCharacter,
  evolveCharacter,
  weeklyQuestState,
  claimWeeklyReward,
  buildLearningReport
} from "../season2-core.js";
import {
  SEASON2_WORLDS,
  SEASON2_SPECIES,
  SEASON2_CATALOG,
  SEASON2_STARTERS,
  getStageOneCharacters,
  renderMonsterSvg
} from "../monster-catalog-season2.js";

const NOW = new Date("2026-08-30T12:00:00+09:00");
const words = Array.from({ length: 20 }, (_, index) => ({
  id: `w${index}`,
  word: `word${index}`,
  meaning: `뜻${index}`,
  categoryId: index < 10 ? "a" : "b"
}));

function migrate(player = {}, at = NOW) {
  return migratePlayer(player, words, at).season2;
}

test("legacy player migration preserves balances, items and progress", () => {
  const player = {
    score: 12345,
    coin: 678,
    xp: 9000,
    ownedItems: { crown: true },
    equippedItem: "crown",
    progress: { w0: { correct: 8, wrong: 1, skip: 2 } }
  };
  const migratedPlayer = migratePlayer(player, words, NOW);
  assert.equal(migratedPlayer.score, 12345);
  assert.equal(migratedPlayer.coin, 678);
  assert.equal(migratedPlayer.ownedItems.crown, true);
  assert.equal(migratedPlayer.progress.w0.correct, 8);
  assert.equal(migratedPlayer.season2.wordMastery.w0.correct, 8);
  assert.equal(migratedPlayer.progress.__season2.schemaVersion, 8);
});

test("migration is idempotent", () => {
  const first = migratePlayer({ xp: 1234, progress: { w1: { correct: 3, wrong: 1 } } }, words, NOW);
  const second = migratePlayer(first, words, NOW);
  assert.deepEqual(second.season2, first.season2);
  assert.equal(second.progress.w1.correct, 3);
});

test("legacy collection master receives honor but not automatic Season 2 unlocks", () => {
  const s2 = migrate({ xp: LEGACY_COLLECTION_COMPLETE_XP });
  assert.equal(s2.titles.legacyCollectionMaster, true);
  assert.equal(s2.honorCollection.legacyMasterGranted, true);
  assert.equal(Object.keys(s2.season2Collection).length, 0);
  assert.equal(s2.starterAvailable, true);
});

test("adaptive selection uses 60/25/15 mix when pools are sufficient", () => {
  const s2 = migrate();
  for (let index = 0; index < 6; index += 1) {
    s2.wordMastery[`w${index}`].wrong = 3;
    s2.wordMastery[`w${index}`].nextReviewAt = NOW.toISOString();
  }
  for (let index = 6; index < 9; index += 1) {
    s2.wordMastery[`w${index}`].correct = 0;
    s2.wordMastery[`w${index}`].level = 0;
  }
  for (let index = 9; index < 20; index += 1) {
    s2.wordMastery[`w${index}`].correct = 10;
    s2.wordMastery[`w${index}`].level = 4;
    s2.wordMastery[`w${index}`].nextReviewAt = "2026-09-30T00:00:00.000Z";
  }
  const selected = selectAdaptiveWords(words, s2.wordMastery, 10, { now: NOW, random: () => 0 });
  const ids = selected.map((word) => Number(word.id.slice(1)));
  assert.equal(ids.filter((id) => id < 6).length, 6);
  assert.equal(ids.filter((id) => id >= 6 && id < 9).length, 3);
  assert.equal(ids.filter((id) => id >= 9).length, 1);
});

test("adaptive selection handles empty and tiny word sets without loops", () => {
  assert.deepEqual(selectAdaptiveWords([], {}, 10), []);
  const selected = selectAdaptiveWords(words.slice(0, 2), {}, 7, { random: () => 0 });
  assert.equal(selected.length, 7);
  assert.ok(selected.every((word) => ["w0", "w1"].includes(word.id)));
});

test("choice-only practice cannot exceed mastery 2", () => {
  let s2 = migrate();
  for (let attempt = 0; attempt < 12; attempt += 1) {
    s2 = recordWordResult(s2, "w0", "choice", "correct", {
      now: new Date(NOW.getTime() + attempt * 60000),
      token: `choice-${attempt}`
    });
  }
  assert.equal(s2.wordMastery.w0.level, 2);
});

test("spaced recall can reach mastery 5 while same-day grinding cannot", () => {
  let sameDay = migrate();
  for (let attempt = 0; attempt < 20; attempt += 1) {
    sameDay = recordWordResult(sameDay, "w0", "type", "correct", {
      now: new Date(NOW.getTime() + attempt * 60000), token: `same-${attempt}`
    });
  }
  assert.ok(sameDay.wordMastery.w0.level < 5);

  let spaced = migrate();
  for (let day = 0; day < 4; day += 1) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      spaced = recordWordResult(spaced, "w0", "type", "correct", {
        now: new Date(NOW.getTime() + day * 86400000 + attempt * 60000),
        token: `spaced-${day}-${attempt}`
      });
    }
  }
  assert.equal(spaced.wordMastery.w0.level, 5);
});

test("wrong answers reduce high mastery and schedule near-term review without XP loss", () => {
  let s2 = migrate();
  s2.wordMastery.w0.level = 4;
  s2 = recordWordResult(s2, "w0", "type", "wrong", { now: NOW, token: "wrong-once" });
  assert.equal(s2.wordMastery.w0.level, 3);
  assert.equal(s2.wordMastery.w0.wrong, 1);
  assert.ok(new Date(s2.wordMastery.w0.nextReviewAt) > NOW);
  assert.ok(new Date(s2.wordMastery.w0.nextReviewAt) - NOW <= 5 * 60 * 1000);
});

test("stage rewards are idempotent", () => {
  let s2 = migrate();
  s2 = applyStageReward(s2, 0, 3, NOW);
  const points = s2.discoveryPoints;
  const materials = s2.evolutionMaterials;
  s2 = applyStageReward(s2, 0, 3, NOW);
  assert.equal(s2.discoveryPoints, points);
  assert.equal(s2.evolutionMaterials, materials);
});

test("starter is granted only once and existing XP stays separate", () => {
  let s2 = migrate({ xp: 99999999 });
  s2 = claimStarter(s2, SEASON2_STARTERS[0], SEASON2_STARTERS, NOW);
  const once = Object.keys(s2.season2Collection).length;
  s2 = claimStarter(s2, SEASON2_STARTERS[1], SEASON2_STARTERS, NOW);
  assert.equal(Object.keys(s2.season2Collection).length, once);
  assert.equal(s2.selectedStarter, SEASON2_STARTERS[0]);
  assert.equal(s2.discoveryPoints, 0);
});

test("egg prioritizes an unowned character and prevents duplicate reward loops", () => {
  let s2 = migrate();
  s2.incubatingEgg.progress = 100;
  const ocean = getStageOneCharacters("ocean").map((item) => item.id);
  const first = hatchCharacter(s2, "ocean", ocean, NOW);
  assert.ok(first.characterId);
  assert.equal(first.duplicate, false);
  assert.equal(first.season2.incubatingEgg.progress, 0);
  assert.equal(first.season2.season2Collection[first.characterId], true);
});

test("evolution preserves the previous form", () => {
  let s2 = migrate();
  const stages = SEASON2_CATALOG.filter((item) => item.speciesId === "crumb_bear");
  s2.season2Collection[stages[0].id] = true;
  s2.monsterAffinity[stages[0].id] = { points: 40, wordsStudied: 40 };
  s2.evolutionMaterials = 5;
  const result = evolveCharacter(s2, stages[0].id, stages[1].id, 1, NOW);
  assert.equal(result.evolved, true);
  assert.equal(result.season2.season2Collection[stages[0].id], true);
  assert.equal(result.season2.season2Collection[stages[1].id], true);
});

test("weekly reward requires five active days and four quests and cannot repeat", () => {
  let s2 = migrate();
  s2.weeklyProgress.activeDays = ["2026-08-24", "2026-08-25", "2026-08-26", "2026-08-27", "2026-08-28"];
  s2.weeklyProgress.reviewed = 50;
  s2.weeklyProgress.hardRecovered = 10;
  s2.weeklyProgress.writingCorrect = 20;
  s2.weeklyProgress.modes = ["choice", "block", "blank", "type"];
  const state = weeklyQuestState(s2, NOW);
  assert.equal(state.completed, 4);
  const first = claimWeeklyReward(s2, NOW);
  assert.equal(first.claimed, true);
  const second = claimWeeklyReward(first.season2, NOW);
  assert.equal(second.claimed, false);
});

test("report works with no data and with learning history", () => {
  let s2 = migrate();
  const emptyReport = buildLearningReport(s2, [], [], NOW);
  assert.equal(emptyReport.sessions.today, 0);
  s2 = recordWordResult(s2, "w0", "type", "correct", { now: NOW, token: "report-1" });
  const report = buildLearningReport(s2, words, [{ id: "a", name: "A" }, { id: "b", name: "B" }], NOW);
  assert.equal(report.sessions.today, 1);
  assert.equal(report.modeAccuracy.type.accuracy, 100);
});

test("catalog has 12 worlds, 20 species and 60 distinct SVG geometries", () => {
  assert.equal(SEASON2_WORLDS.length, 12);
  assert.equal(SEASON2_SPECIES.length, 20);
  assert.equal(SEASON2_CATALOG.length, 60);
  const names = new Set(SEASON2_CATALOG.map((item) => item.name));
  assert.equal(names.size, 60);
  const normalizeGeometry = (svg) => svg
    .replace(/id="[^"]+"/g, "")
    .replace(/data-character-id="[^"]+"/g, "")
    .replace(/aria-label="[^"]+"/g, "")
    .replace(/#[0-9a-fA-F]{3,8}/g, "#COLOR")
    .replace(/url\(#[^)]+\)/g, "url(#ID)")
    .replace(/\s+/g, " ");
  const geometries = new Set(SEASON2_CATALOG.map((item) => normalizeGeometry(renderMonsterSvg(item))));
  assert.equal(geometries.size, 60);
});
