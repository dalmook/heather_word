export const SEASON2_SCHEMA_VERSION = 8;
export const DAY_MS = 24 * 60 * 60 * 1000;
export const LEGACY_MONSTER_COUNT = 1000;
export const LEGACY_MONSTER_XP_STEP = 250;
export const LEGACY_EXPANDED_START_GAP = 1500;
export const LEGACY_EXPANDED_TIER_SIZE = 20;
export const LEGACY_EXPANDED_GAP_INCREASE = 500;
export const MODE_WEIGHTS = Object.freeze({ card: 0.5, choice: 1, block: 2, blank: 3, type: 4, boss: 4 });
export const REVIEW_INTERVAL_HOURS = Object.freeze([0, 4, 24, 72, 168, 336]);

export function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function safeInt(value, fallback = 0, max = Number.MAX_SAFE_INTEGER) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(max, Math.floor(number)));
}

export function clamp(value, min, max) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : min;
}

export function todayKey(input = new Date()) {
  const date = input instanceof Date ? input : new Date(input);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function weekKey(input = new Date()) {
  const date = input instanceof Date ? new Date(input) : new Date(input);
  const day = date.getDay() || 7;
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - day + 1);
  return todayKey(date);
}

export function legacyMonsterRequiredXp(index) {
  if (index < 0) return 0;
  if (index < 100) return index * LEGACY_MONSTER_XP_STEP;
  let xp = 99 * LEGACY_MONSTER_XP_STEP;
  for (let current = 100; current <= index; current += 1) {
    const tier = Math.floor((current - 100) / LEGACY_EXPANDED_TIER_SIZE);
    xp += LEGACY_EXPANDED_START_GAP + (tier * LEGACY_EXPANDED_GAP_INCREASE);
  }
  return xp;
}

export const LEGACY_COLLECTION_COMPLETE_XP = legacyMonsterRequiredXp(LEGACY_MONSTER_COUNT - 1);

function cleanBooleanMap(value, maxEntries = 5000) {
  if (!isPlainObject(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item === true).slice(0, maxEntries));
}

function cleanNumberMap(value, maxEntries = 5000, maxValue = 1_000_000) {
  if (!isPlainObject(value)) return {};
  return Object.fromEntries(Object.entries(value)
    .slice(0, maxEntries)
    .map(([key, item]) => [String(key).slice(0, 100), safeInt(item, 0, maxValue)]));
}

function cleanStringArray(value, maxEntries = 1000, maxLength = 100) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item || "").slice(0, maxLength)).filter(Boolean))].slice(0, maxEntries);
}

export function makeMasteryFromLegacy(legacy = {}, now = new Date()) {
  const correct = safeInt(legacy.correct, 0, 1_000_000);
  const wrong = safeInt(legacy.wrong, 0, 1_000_000);
  const skip = safeInt(legacy.skip, 0, 1_000_000);
  const total = correct + wrong + skip;
  const baseLevel = total === 0 ? 0 : correct >= 8 && correct >= (wrong + skip) * 3 ? 2 : correct >= 2 ? 1 : 0;
  return {
    correct,
    wrong,
    skip,
    streak: 0,
    lastStudiedAt: "",
    nextReviewAt: total ? now.toISOString() : "",
    level: baseLevel,
    lastMode: "",
    modeStats: {},
    sameDayAttempts: 0,
    attemptDate: "",
    lastLevelChangedAt: "",
    spacedCorrectDates: [],
    recoveredWrong: 0
  };
}

export function normalizeMastery(value, legacy = {}, now = new Date()) {
  const base = makeMasteryFromLegacy(legacy, now);
  const source = isPlainObject(value) ? value : {};
  const modeStats = isPlainObject(source.modeStats)
    ? Object.fromEntries(Object.entries(source.modeStats).slice(0, 8).map(([mode, stats]) => [mode, {
      correct: safeInt(stats?.correct, 0, 1_000_000),
      wrong: safeInt(stats?.wrong, 0, 1_000_000),
      skip: safeInt(stats?.skip, 0, 1_000_000)
    }]))
    : {};
  return {
    correct: Math.max(base.correct, safeInt(source.correct, 0, 1_000_000)),
    wrong: Math.max(base.wrong, safeInt(source.wrong, 0, 1_000_000)),
    skip: Math.max(base.skip, safeInt(source.skip, 0, 1_000_000)),
    streak: safeInt(source.streak, 0, 1000),
    lastStudiedAt: String(source.lastStudiedAt || "").slice(0, 40),
    nextReviewAt: String(source.nextReviewAt || base.nextReviewAt || "").slice(0, 40),
    level: safeInt(source.level, base.level, 5),
    lastMode: String(source.lastMode || "").slice(0, 20),
    modeStats,
    sameDayAttempts: safeInt(source.sameDayAttempts, 0, 1000),
    attemptDate: String(source.attemptDate || "").slice(0, 10),
    lastLevelChangedAt: String(source.lastLevelChangedAt || "").slice(0, 40),
    spacedCorrectDates: cleanStringArray(source.spacedCorrectDates, 10, 10),
    recoveredWrong: safeInt(source.recoveredWrong, 0, 100000)
  };
}

export function makeDailyAdventure(now = new Date()) {
  return {
    date: todayKey(now),
    stageIndex: 0,
    stars: [0, 0, 0, 0],
    completed: false,
    rewardTokens: [],
    session: null
  };
}

export function normalizeDailyAdventure(value, now = new Date()) {
  const today = todayKey(now);
  if (!isPlainObject(value) || value.date !== today) return makeDailyAdventure(now);
  const stars = Array.isArray(value.stars)
    ? [0, 1, 2, 3].map((index) => safeInt(value.stars[index], 0, 3))
    : [0, 0, 0, 0];
  return {
    date: today,
    stageIndex: safeInt(value.stageIndex, 0, 4),
    stars,
    completed: value.completed === true,
    rewardTokens: cleanStringArray(value.rewardTokens, 20, 80),
    session: isPlainObject(value.session) ? value.session : null
  };
}

export function makeWeeklyProgress(now = new Date()) {
  return {
    weekKey: weekKey(now),
    activeDays: [],
    reviewed: 0,
    hardRecovered: 0,
    writingCorrect: 0,
    modes: [],
    adventures: 0,
    bosses: 0,
    hatchProgress: 0,
    rewarded: false
  };
}

export function normalizeWeeklyProgress(value, now = new Date()) {
  const key = weekKey(now);
  if (!isPlainObject(value) || value.weekKey !== key) return makeWeeklyProgress(now);
  return {
    weekKey: key,
    activeDays: cleanStringArray(value.activeDays, 7, 10),
    reviewed: safeInt(value.reviewed, 0, 100000),
    hardRecovered: safeInt(value.hardRecovered, 0, 100000),
    writingCorrect: safeInt(value.writingCorrect, 0, 100000),
    modes: cleanStringArray(value.modes, 8, 20),
    adventures: safeInt(value.adventures, 0, 1000),
    bosses: safeInt(value.bosses, 0, 1000),
    hatchProgress: safeInt(value.hatchProgress, 0, 100000),
    rewarded: value.rewarded === true
  };
}

function defaultStudyStreak() {
  return { current: 0, best: 0, lastDate: "", protectedDays: 0 };
}

export function normalizeStudyStreak(value) {
  const source = isPlainObject(value) ? value : {};
  return {
    current: safeInt(source.current, 0, 100000),
    best: safeInt(source.best, 0, 100000),
    lastDate: String(source.lastDate || "").slice(0, 10),
    protectedDays: safeInt(source.protectedDays, 0, 100)
  };
}

export function recordActiveDay(streakValue, weeklyValue, now = new Date()) {
  const streak = normalizeStudyStreak(streakValue);
  const weekly = normalizeWeeklyProgress(weeklyValue, now);
  const today = todayKey(now);
  if (!weekly.activeDays.includes(today)) weekly.activeDays.push(today);
  if (streak.lastDate !== today) {
    const previous = streak.lastDate ? new Date(`${streak.lastDate}T12:00:00`) : null;
    const current = new Date(`${today}T12:00:00`);
    const gap = previous ? Math.round((current - previous) / DAY_MS) : null;
    if (gap === null || gap <= 2) streak.current += 1;
    else streak.current = 1;
    streak.best = Math.max(streak.best, streak.current);
    streak.lastDate = today;
  }
  return { streak, weekly };
}

export function makeDefaultSeason2(player = {}, words = [], now = new Date()) {
  const legacyProgress = isPlainObject(player.progress) ? player.progress : {};
  const wordMastery = {};
  for (const word of words) {
    if (!word?.id) continue;
    wordMastery[word.id] = makeMasteryFromLegacy(legacyProgress[word.id], now);
  }
  const legacyComplete = safeInt(player.xp) >= LEGACY_COLLECTION_COMPLETE_XP;
  return {
    schemaVersion: SEASON2_SCHEMA_VERSION,
    revision: 1,
    updatedAt: now.toISOString(),
    wordMastery,
    studyStreak: defaultStudyStreak(),
    dailyAdventure: makeDailyAdventure(now),
    weeklyProgress: makeWeeklyProgress(now),
    achievements: {},
    titles: legacyComplete ? { legacyCollectionMaster: true } : {},
    endgameProgress: { masteryStars: 0, completedWorlds: [] },
    settings: { ageBand: "easy", reducedMotion: false, autoTts: true, timerEnabled: false },
    season2Collection: {},
    discoveryPoints: 0,
    worldProgress: {},
    monsterAffinity: {},
    evolutionMaterials: 0,
    bossKeys: 0,
    incubatingEgg: { worldId: "cookie", progress: 0, hatchCount: 0 },
    honorCollection: legacyComplete ? { legacyMasterGranted: true, profileBorder: "legacy-master" } : {},
    starterAvailable: true,
    starterClaimed: false,
    selectedStarter: "",
    partnerId: "",
    activityLog: [],
    answerTokens: []
  };
}

export function normalizeSeason2(raw, player = {}, words = [], now = new Date()) {
  const defaults = makeDefaultSeason2(player, words, now);
  const source = isPlainObject(raw) ? raw : {};
  const legacyProgress = isPlainObject(player.progress) ? player.progress : {};
  const existingMastery = isPlainObject(source.wordMastery) ? source.wordMastery : {};
  const wordMastery = {};
  const wordIds = new Set([...words.map((word) => word?.id).filter(Boolean), ...Object.keys(existingMastery)]);
  for (const wordId of wordIds) {
    wordMastery[wordId] = normalizeMastery(existingMastery[wordId], legacyProgress[wordId], now);
  }
  const legacyComplete = safeInt(player.xp) >= LEGACY_COLLECTION_COMPLETE_XP;
  const settingsSource = isPlainObject(source.settings) ? source.settings : {};
  const eggSource = isPlainObject(source.incubatingEgg) ? source.incubatingEgg : {};
  const honorSource = isPlainObject(source.honorCollection) ? source.honorCollection : {};
  const titles = cleanBooleanMap(source.titles, 500);
  if (legacyComplete) titles.legacyCollectionMaster = true;
  const honorCollection = {
    ...honorSource,
    legacyMasterGranted: legacyComplete || honorSource.legacyMasterGranted === true,
    profileBorder: legacyComplete ? "legacy-master" : String(honorSource.profileBorder || "").slice(0, 40)
  };
  return {
    ...defaults,
    ...source,
    schemaVersion: SEASON2_SCHEMA_VERSION,
    revision: Math.max(1, safeInt(source.revision, 1, 1_000_000_000)),
    updatedAt: String(source.updatedAt || now.toISOString()).slice(0, 40),
    wordMastery,
    studyStreak: normalizeStudyStreak(source.studyStreak),
    dailyAdventure: normalizeDailyAdventure(source.dailyAdventure, now),
    weeklyProgress: normalizeWeeklyProgress(source.weeklyProgress, now),
    achievements: cleanBooleanMap(source.achievements, 500),
    titles,
    endgameProgress: {
      masteryStars: safeInt(source.endgameProgress?.masteryStars, 0, 100000),
      completedWorlds: cleanStringArray(source.endgameProgress?.completedWorlds, 20, 40)
    },
    settings: {
      ageBand: settingsSource.ageBand === "challenge" ? "challenge" : "easy",
      reducedMotion: settingsSource.reducedMotion === true,
      autoTts: settingsSource.autoTts !== false,
      timerEnabled: settingsSource.timerEnabled === true
    },
    season2Collection: cleanBooleanMap(source.season2Collection, 500),
    discoveryPoints: safeInt(source.discoveryPoints, 0, 100_000_000),
    worldProgress: isPlainObject(source.worldProgress) ? source.worldProgress : {},
    monsterAffinity: isPlainObject(source.monsterAffinity) ? source.monsterAffinity : {},
    evolutionMaterials: safeInt(source.evolutionMaterials, 0, 1_000_000),
    bossKeys: safeInt(source.bossKeys, 0, 1_000_000),
    incubatingEgg: {
      worldId: String(eggSource.worldId || "cookie").slice(0, 40),
      progress: safeInt(eggSource.progress, 0, 100),
      hatchCount: safeInt(eggSource.hatchCount, 0, 100000)
    },
    honorCollection,
    starterAvailable: source.starterClaimed === true ? false : source.starterAvailable !== false,
    starterClaimed: source.starterClaimed === true,
    selectedStarter: String(source.selectedStarter || "").slice(0, 100),
    partnerId: String(source.partnerId || "").slice(0, 100),
    activityLog: Array.isArray(source.activityLog) ? source.activityLog.slice(-500) : [],
    answerTokens: cleanStringArray(source.answerTokens, 500, 120)
  };
}

export function migratePlayer(playerValue, words = [], now = new Date()) {
  const player = isPlainObject(playerValue) ? { ...playerValue } : {};
  const progress = isPlainObject(player.progress) ? { ...player.progress } : {};
  const embedded = isPlainObject(progress.__season2) ? progress.__season2 : null;
  const source = isPlainObject(player.season2) && (!embedded || safeInt(player.season2.revision) >= safeInt(embedded.revision))
    ? player.season2
    : embedded;
  const season2 = normalizeSeason2(source, player, words, now);
  player.season2 = season2;
  player.progress = { ...progress, __season2: season2 };
  return player;
}

function randomPick(list, random) {
  if (!list.length) return null;
  return list[Math.floor(random() * list.length) % list.length];
}

function sortByPriority(list, masteryMap, nowMs) {
  return [...list].sort((a, b) => {
    const ma = masteryMap[a.id] || makeMasteryFromLegacy({}, new Date(nowMs));
    const mb = masteryMap[b.id] || makeMasteryFromLegacy({}, new Date(nowMs));
    const da = ma.nextReviewAt ? new Date(ma.nextReviewAt).getTime() : 0;
    const db = mb.nextReviewAt ? new Date(mb.nextReviewAt).getTime() : 0;
    const pressureA = (ma.wrong * 3) + (ma.skip * 2) - ma.correct - Math.max(0, (da - nowMs) / DAY_MS);
    const pressureB = (mb.wrong * 3) + (mb.skip * 2) - mb.correct - Math.max(0, (db - nowMs) / DAY_MS);
    return pressureB - pressureA;
  });
}

export function selectAdaptiveWords(wordsValue, masteryMapValue, count, options = {}) {
  const words = Array.isArray(wordsValue) ? wordsValue.filter((word) => word?.id) : [];
  if (!words.length || count <= 0) return [];
  const masteryMap = isPlainObject(masteryMapValue) ? masteryMapValue : {};
  const random = typeof options.random === "function" ? options.random : Math.random;
  const now = options.now instanceof Date ? options.now : new Date(options.now || Date.now());
  const nowMs = now.getTime();
  const due = [];
  const fresh = [];
  const maintenance = [];
  for (const word of words) {
    const mastery = masteryMap[word.id] || makeMasteryFromLegacy({}, now);
    const dueAt = mastery.nextReviewAt ? new Date(mastery.nextReviewAt).getTime() : 0;
    const hard = (mastery.wrong + mastery.skip) > mastery.correct || (dueAt && dueAt <= nowMs);
    if (hard) due.push(word);
    else if ((mastery.correct + mastery.wrong + mastery.skip) === 0 || mastery.level <= 1) fresh.push(word);
    else maintenance.push(word);
  }
  const target = {
    due: Math.round(count * 0.60),
    fresh: Math.round(count * 0.25)
  };
  target.maintenance = Math.max(0, count - target.due - target.fresh);
  const pools = {
    due: sortByPriority(due, masteryMap, nowMs),
    fresh: [...fresh],
    maintenance: [...maintenance]
  };
  const selected = [];
  const used = new Set();
  const take = (name, amount) => {
    for (let index = 0; index < amount; index += 1) {
      const candidates = pools[name].filter((word) => !used.has(word.id));
      const word = randomPick(candidates, random);
      if (!word) break;
      selected.push(word);
      used.add(word.id);
    }
  };
  take("due", target.due);
  take("fresh", target.fresh);
  take("maintenance", target.maintenance);
  while (selected.length < Math.min(count, words.length)) {
    const candidates = words.filter((word) => !used.has(word.id));
    const word = randomPick(candidates, random);
    if (!word) break;
    selected.push(word);
    used.add(word.id);
  }
  while (selected.length < count) {
    const word = randomPick(words, random);
    if (!word) break;
    selected.push(word);
  }
  return selected;
}

function nextReviewIso(level, now) {
  const hours = REVIEW_INTERVAL_HOURS[Math.max(0, Math.min(5, level))] || 4;
  return new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();
}

export function recordWordResult(season2Value, wordId, mode, result, options = {}) {
  const now = options.now instanceof Date ? options.now : new Date(options.now || Date.now());
  const token = String(options.token || "").slice(0, 120);
  const season2 = normalizeSeason2(season2Value, {}, [], now);
  if (token && season2.answerTokens.includes(token)) return season2;
  const mastery = normalizeMastery(season2.wordMastery[wordId], {}, now);
  const today = todayKey(now);
  if (mastery.attemptDate !== today) {
    mastery.attemptDate = today;
    mastery.sameDayAttempts = 0;
  }
  mastery.sameDayAttempts += 1;
  mastery.lastStudiedAt = now.toISOString();
  mastery.lastMode = mode;
  mastery.modeStats[mode] ||= { correct: 0, wrong: 0, skip: 0 };
  const previousLevel = mastery.level;
  const priorMistakes = mastery.wrong + mastery.skip;
  if (result === "correct") {
    mastery.correct += 1;
    mastery.streak += 1;
    mastery.modeStats[mode].correct += 1;
    const weight = MODE_WEIGHTS[mode] || 1;
    const dates = new Set(mastery.spacedCorrectDates);
    dates.add(today);
    mastery.spacedCorrectDates = [...dates].slice(-10);
    let candidate = mastery.level;
    if (weight >= 1 && mastery.streak >= 2) candidate = Math.max(candidate, 1);
    if (weight >= 1 && mastery.streak >= 5) candidate = Math.max(candidate, 2);
    if (weight >= 2 && mastery.streak >= 2) candidate = Math.max(candidate, 2);
    if (weight >= 3 && mastery.streak >= 2 && mastery.sameDayAttempts <= 5) candidate = Math.max(candidate, 3);
    if (weight >= 4 && mastery.streak >= 2 && mastery.spacedCorrectDates.length >= 2) candidate = Math.max(candidate, 4);
    if (weight >= 4 && mastery.streak >= 3 && mastery.spacedCorrectDates.length >= 3 && mastery.sameDayAttempts <= 5) candidate = 5;
    if (mode === "choice") candidate = Math.min(candidate, 2);
    if (mode === "block") candidate = Math.min(candidate, 3);
    if (mode === "blank") candidate = Math.min(candidate, 4);
    mastery.level = Math.max(mastery.level, candidate);
    if (priorMistakes > 0) mastery.recoveredWrong += 1;
    mastery.nextReviewAt = nextReviewIso(mastery.level, now);
  } else {
    const key = result === "skip" ? "skip" : "wrong";
    mastery[key] += 1;
    mastery.streak = 0;
    mastery.modeStats[mode][key] += 1;
    if (mastery.level >= 2) mastery.level -= 1;
    mastery.nextReviewAt = new Date(now.getTime() + 5 * 60 * 1000).toISOString();
  }
  if (mastery.level !== previousLevel) mastery.lastLevelChangedAt = now.toISOString();
  season2.wordMastery[wordId] = mastery;
  const active = recordActiveDay(season2.studyStreak, season2.weeklyProgress, now);
  season2.studyStreak = active.streak;
  season2.weeklyProgress = active.weekly;
  season2.weeklyProgress.reviewed += 1;
  if (result === "correct" && priorMistakes > 0) season2.weeklyProgress.hardRecovered += 1;
  if (result === "correct" && (mode === "type" || mode === "boss")) season2.weeklyProgress.writingCorrect += 1;
  if (!season2.weeklyProgress.modes.includes(mode)) season2.weeklyProgress.modes.push(mode);
  if (season2.partnerId && result === "correct") {
    const affinity = isPlainObject(season2.monsterAffinity[season2.partnerId]) ? season2.monsterAffinity[season2.partnerId] : {};
    season2.monsterAffinity[season2.partnerId] = {
      points: safeInt(affinity.points, 0, 1_000_000) + 1,
      wordsStudied: safeInt(affinity.wordsStudied, 0, 1_000_000) + 1,
      lastStudiedAt: now.toISOString()
    };
  }
  season2.activityLog.push({ at: now.toISOString(), type: "answer", wordId, mode, result, level: mastery.level });
  season2.activityLog = season2.activityLog.slice(-500);
  if (token) season2.answerTokens = [...season2.answerTokens, token].slice(-500);
  season2.endgameProgress.masteryStars = Object.values(season2.wordMastery).filter((entry) => entry.level >= 5).length;
  season2.revision += 1;
  season2.updatedAt = now.toISOString();
  return season2;
}

export function computeStars(correct, total) {
  if (!total) return 1;
  const accuracy = correct / total;
  if (accuracy >= 0.8) return 3;
  if (accuracy >= 0.5) return 2;
  return 1;
}

export function applyStageReward(season2Value, stageIndex, stars, now = new Date()) {
  const season2 = normalizeSeason2(season2Value, {}, [], now);
  const token = `${todayKey(now)}:stage:${stageIndex}`;
  if (season2.dailyAdventure.rewardTokens.includes(token)) return season2;
  const stageReward = [10, 18, 25, 45][stageIndex] || 10;
  const eggGain = [12, 16, 20, 30][stageIndex] || 10;
  season2.discoveryPoints += stageReward + stars * 2;
  season2.evolutionMaterials += Math.max(1, stars);
  const before = season2.incubatingEgg.progress;
  season2.incubatingEgg.progress = Math.min(100, before + eggGain + stars * 2);
  season2.weeklyProgress.hatchProgress += season2.incubatingEgg.progress - before;
  season2.dailyAdventure.rewardTokens.push(token);
  season2.dailyAdventure.stars[stageIndex] = Math.max(season2.dailyAdventure.stars[stageIndex] || 0, stars);
  season2.dailyAdventure.stageIndex = Math.max(season2.dailyAdventure.stageIndex, Math.min(4, stageIndex + 1));
  if (stageIndex === 3) {
    season2.dailyAdventure.completed = true;
    season2.weeklyProgress.adventures += 1;
    season2.weeklyProgress.bosses += 1;
    season2.bossKeys += 1;
    season2.achievements.firstAdventure = true;
  }
  season2.activityLog.push({ at: now.toISOString(), type: "stage", stageIndex, stars });
  season2.activityLog = season2.activityLog.slice(-500);
  season2.revision += 1;
  season2.updatedAt = now.toISOString();
  return season2;
}

export function claimStarter(season2Value, characterId, validStarterIds, now = new Date()) {
  const season2 = normalizeSeason2(season2Value, {}, [], now);
  if (season2.starterClaimed || !validStarterIds.includes(characterId)) return season2;
  season2.season2Collection[characterId] = true;
  season2.starterClaimed = true;
  season2.starterAvailable = false;
  season2.selectedStarter = characterId;
  season2.partnerId = characterId;
  season2.monsterAffinity[characterId] = { points: 0, wordsStudied: 0, lastStudiedAt: "" };
  season2.activityLog.push({ at: now.toISOString(), type: "starter", characterId });
  season2.revision += 1;
  season2.updatedAt = now.toISOString();
  return season2;
}

export function hatchCharacter(season2Value, worldId, stageOneCharacterIds, now = new Date()) {
  const season2 = normalizeSeason2(season2Value, {}, [], now);
  if (season2.incubatingEgg.progress < 100) return { season2, characterId: "", duplicate: false };
  const missing = stageOneCharacterIds.filter((id) => !season2.season2Collection[id]);
  const characterId = missing[0] || stageOneCharacterIds[season2.incubatingEgg.hatchCount % Math.max(1, stageOneCharacterIds.length)] || "";
  const duplicate = Boolean(characterId && season2.season2Collection[characterId]);
  if (characterId) {
    if (duplicate) {
      const affinity = isPlainObject(season2.monsterAffinity[characterId]) ? season2.monsterAffinity[characterId] : {};
      season2.monsterAffinity[characterId] = { ...affinity, points: safeInt(affinity.points) + 10 };
    } else {
      season2.season2Collection[characterId] = true;
      season2.monsterAffinity[characterId] = { points: 0, wordsStudied: 0, lastStudiedAt: "" };
      if (!season2.partnerId) season2.partnerId = characterId;
    }
  }
  season2.incubatingEgg = { worldId, progress: 0, hatchCount: season2.incubatingEgg.hatchCount + 1 };
  season2.activityLog.push({ at: now.toISOString(), type: "hatch", characterId, duplicate, worldId });
  season2.revision += 1;
  season2.updatedAt = now.toISOString();
  return { season2, characterId, duplicate };
}

export function evolutionRequirement(stage) {
  return stage === 1 ? { affinity: 30, materials: 3 } : { affinity: 80, materials: 8 };
}

export function evolveCharacter(season2Value, currentId, nextId, stage, now = new Date()) {
  const season2 = normalizeSeason2(season2Value, {}, [], now);
  if (!season2.season2Collection[currentId] || season2.season2Collection[nextId]) return { season2, evolved: false };
  const requirement = evolutionRequirement(stage);
  const affinity = safeInt(season2.monsterAffinity[currentId]?.points);
  if (affinity < requirement.affinity || season2.evolutionMaterials < requirement.materials) return { season2, evolved: false };
  season2.evolutionMaterials -= requirement.materials;
  season2.season2Collection[nextId] = true;
  season2.monsterAffinity[nextId] = {
    points: affinity,
    wordsStudied: safeInt(season2.monsterAffinity[currentId]?.wordsStudied),
    lastStudiedAt: String(season2.monsterAffinity[currentId]?.lastStudiedAt || "")
  };
  if (season2.partnerId === currentId) season2.partnerId = nextId;
  season2.activityLog.push({ at: now.toISOString(), type: "evolve", from: currentId, to: nextId });
  season2.achievements.firstEvolution = true;
  season2.revision += 1;
  season2.updatedAt = now.toISOString();
  return { season2, evolved: true };
}

export function weeklyQuestState(season2Value, now = new Date()) {
  const season2 = normalizeSeason2(season2Value, {}, [], now);
  const weekly = season2.weeklyProgress;
  const quests = [
    { id: "reviewed", label: "단어 50개 복습", value: weekly.reviewed, target: 50 },
    { id: "hardRecovered", label: "다시 보면 좋은 단어 10개 극복", value: weekly.hardRecovered, target: 10 },
    { id: "writingCorrect", label: "쓰기 문제 20개 정답", value: weekly.writingCorrect, target: 20 },
    { id: "modes", label: "서로 다른 모드 4개 플레이", value: weekly.modes.length, target: 4 },
    { id: "adventures", label: "오늘의 모험 3회 완주", value: weekly.adventures, target: 3 },
    { id: "bosses", label: "보스전 2회 완료", value: weekly.bosses, target: 2 },
    { id: "hatchProgress", label: "알 부화 진행도 100% 모으기", value: weekly.hatchProgress, target: 100 }
  ];
  return { quests, completed: quests.filter((quest) => quest.value >= quest.target).length, activeDays: weekly.activeDays.length };
}

export function claimWeeklyReward(season2Value, now = new Date()) {
  const season2 = normalizeSeason2(season2Value, {}, [], now);
  const state = weeklyQuestState(season2, now);
  if (season2.weeklyProgress.rewarded || state.activeDays < 5 || state.completed < 4) return { season2, claimed: false };
  season2.weeklyProgress.rewarded = true;
  season2.evolutionMaterials += 10;
  const before = season2.incubatingEgg.progress;
  season2.incubatingEgg.progress = Math.min(100, before + 35);
  season2.titles.weeklyExplorer = true;
  season2.activityLog.push({ at: now.toISOString(), type: "weeklyReward" });
  season2.revision += 1;
  season2.updatedAt = now.toISOString();
  return { season2, claimed: true };
}

export function buildLearningReport(season2Value, wordsValue, categoriesValue, now = new Date()) {
  const season2 = normalizeSeason2(season2Value, {}, wordsValue, now);
  const words = Array.isArray(wordsValue) ? wordsValue : [];
  const categories = Array.isArray(categoriesValue) ? categoriesValue : [];
  const wordMap = Object.fromEntries(words.map((word) => [word.id, word]));
  const cutoff7 = now.getTime() - 7 * DAY_MS;
  const cutoff30 = now.getTime() - 30 * DAY_MS;
  const answerEvents = season2.activityLog.filter((event) => event.type === "answer");
  const within = (event, cutoff) => new Date(event.at).getTime() >= cutoff;
  const byMode = {};
  for (const event of answerEvents.filter((item) => within(item, cutoff30))) {
    byMode[event.mode] ||= { correct: 0, total: 0 };
    byMode[event.mode].total += 1;
    if (event.result === "correct") byMode[event.mode].correct += 1;
  }
  const masteryEntries = Object.entries(season2.wordMastery).map(([wordId, mastery]) => ({ wordId, mastery, word: wordMap[wordId] }));
  const hardWords = masteryEntries
    .sort((a, b) => ((b.mastery.wrong + b.mastery.skip) - b.mastery.correct) - ((a.mastery.wrong + a.mastery.skip) - a.mastery.correct))
    .slice(0, 10)
    .map((entry) => ({ id: entry.wordId, word: entry.word?.word || entry.wordId, meaning: entry.word?.meaning || "", level: entry.mastery.level }));
  const dueWords = masteryEntries.filter((entry) => entry.mastery.nextReviewAt && new Date(entry.mastery.nextReviewAt) <= now)
    .slice(0, 20)
    .map((entry) => ({ id: entry.wordId, word: entry.word?.word || entry.wordId, meaning: entry.word?.meaning || "", dueAt: entry.mastery.nextReviewAt }));
  const masteredWords = masteryEntries.filter((entry) => entry.mastery.level >= 5)
    .sort((a, b) => String(b.mastery.lastLevelChangedAt).localeCompare(String(a.mastery.lastLevelChangedAt)))
    .slice(0, 20)
    .map((entry) => ({ id: entry.wordId, word: entry.word?.word || entry.wordId, meaning: entry.word?.meaning || "" }));
  const categoryMastery = categories.map((category) => {
    const items = words.filter((word) => word.categoryId === category.id);
    const mastered = items.filter((word) => season2.wordMastery[word.id]?.level >= 4).length;
    return { id: category.id, name: category.name, total: items.length, mastered, percent: items.length ? Math.round(mastered / items.length * 100) : 0 };
  });
  return {
    generatedAt: now.toISOString(),
    sessions: {
      today: answerEvents.filter((event) => event.at?.startsWith(todayKey(now))).length,
      days7: answerEvents.filter((event) => within(event, cutoff7)).length,
      days30: answerEvents.filter((event) => within(event, cutoff30)).length
    },
    modeAccuracy: Object.fromEntries(Object.entries(byMode).map(([mode, value]) => [mode, {
      ...value,
      accuracy: value.total ? Math.round(value.correct / value.total * 100) : 0
    }])),
    hardWords,
    dueWords,
    masteredWords,
    categoryMastery,
    activeDates: [...new Set(answerEvents.map((event) => event.at?.slice(0, 10)).filter(Boolean))].sort(),
    adventures: season2.activityLog.filter((event) => event.type === "stage" && event.stageIndex === 3).length,
    bosses: season2.weeklyProgress.bosses,
    acquired: season2.activityLog.filter((event) => ["starter", "hatch"].includes(event.type)),
    evolved: season2.activityLog.filter((event) => event.type === "evolve")
  };
}
