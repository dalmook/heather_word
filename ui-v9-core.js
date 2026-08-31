export const UI_V9_VERSION = "9.0.0";
export const LOCAL_KEY = "heather_word_v3";
export const PARENT_GATE_KEY = "heather_parent_gate_v1";
export const TABS = Object.freeze(["home", "learn", "games", "collection", "my"]);

export function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function safeJson(value, fallback = {}) {
  try {
    const parsed = JSON.parse(String(value ?? ""));
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function safeInt(value, fallback = 0, max = Number.MAX_SAFE_INTEGER) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(max, Math.floor(number)));
}

export function clamp(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, number));
}

export function todayKey(input = new Date()) {
  const date = input instanceof Date ? input : new Date(input);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function normalizeTab(value) {
  return TABS.includes(value) ? value : "home";
}

export function tabFromHash(hash = globalThis.location?.hash || "") {
  const match = String(hash).match(/^#\/(home|learn|games|collection|my)$/);
  return normalizeTab(match?.[1]);
}

export function normalizeEnvelope(raw) {
  const source = isPlainObject(raw) ? raw : {};
  return {
    ...source,
    player: isPlainObject(source.player) ? source.player : {},
    categories: Array.isArray(source.categories) ? source.categories : [],
    words: Array.isArray(source.words) ? source.words : [],
    selectedCategoryId: String(source.selectedCategoryId || "all")
  };
}

export function getSeason2(player = {}) {
  if (isPlainObject(player.season2)) return player.season2;
  if (isPlainObject(player.progress?.__season2)) return player.progress.__season2;
  return {};
}

export function normalizeDailyMission(value, now = new Date()) {
  const source = isPlainObject(value) && value.date === todayKey(now) ? value : {};
  const cardViews = safeInt(source.cardViews, 0, 5);
  const gameCorrect = safeInt(source.gameCorrect, 0, 5);
  const writingAttempts = safeInt(source.writingAttempts, 0, 3);
  const total = cardViews + gameCorrect + writingAttempts;
  const target = 13;
  return {
    date: todayKey(now),
    cardViews,
    gameCorrect,
    writingAttempts,
    rewarded: source.rewarded === true,
    total,
    target,
    percent: Math.round((total / target) * 100),
    complete: cardViews >= 5 && gameCorrect >= 5 && writingAttempts >= 3
  };
}

function normalizeCategories(envelope) {
  const map = new Map();
  map.set("all", { id: "all", name: "전체", emoji: "", count: 0 });
  map.set("custom", { id: "custom", name: "직접 추가", emoji: "", count: 0 });
  for (const category of envelope.categories) {
    const id = String(category?.id || "").trim();
    if (!id || id === "all") continue;
    map.set(id, {
      id,
      name: String(category?.name || id).slice(0, 30),
      emoji: String(category?.emoji || "").slice(0, 8),
      count: 0
    });
  }
  for (const word of envelope.words) {
    const categoryId = String(word?.categoryId || "custom");
    if (!map.has(categoryId)) {
      map.set(categoryId, { id: categoryId, name: categoryId, emoji: "", count: 0 });
    }
    map.get(categoryId).count += 1;
    map.get("all").count += 1;
  }
  return [...map.values()];
}

function deriveMastery(season2, words, now) {
  const mastery = isPlainObject(season2.wordMastery) ? season2.wordMastery : {};
  const timestamp = now.getTime();
  let due = 0;
  let mastered = 0;
  let learning = 0;
  let difficult = 0;
  for (const word of words) {
    const item = isPlainObject(mastery[word?.id]) ? mastery[word.id] : {};
    const level = safeInt(item.level, 0, 5);
    if (level >= 5) mastered += 1;
    else if (level > 0) learning += 1;
    const next = Date.parse(String(item.nextReviewAt || ""));
    if ((Number.isFinite(next) && next <= timestamp) || safeInt(item.wrong) > safeInt(item.correct)) due += 1;
    if (safeInt(item.wrong) + safeInt(item.skip) > safeInt(item.correct)) difficult += 1;
  }
  return { due, mastered, learning, difficult };
}

function deriveAdventure(season2) {
  const daily = isPlainObject(season2.dailyAdventure) ? season2.dailyAdventure : {};
  const stageIndex = clamp(safeInt(daily.stageIndex, 0, 4), 0, 4);
  const stars = Array.isArray(daily.stars)
    ? daily.stars.slice(0, 4).reduce((sum, value) => sum + safeInt(value, 0, 3), 0)
    : 0;
  const completed = daily.completed === true;
  return {
    stageIndex: completed ? 4 : stageIndex,
    completed,
    stars,
    percent: completed ? 100 : Math.round((stageIndex / 4) * 100),
    hasSession: isPlainObject(daily.session)
  };
}

function normalizeWords(words) {
  return words
    .filter((word) => word && String(word.word || "").trim())
    .map((word, index) => ({
      id: String(word.id || `${word.categoryId || "custom"}:${word.word || index}`),
      word: String(word.word || "").slice(0, 60),
      meaning: String(word.meaning || "").slice(0, 120),
      categoryId: String(word.categoryId || "custom"),
      emoji: String(word.emoji || "").slice(0, 8)
    }));
}

export function deriveSnapshot(rawEnvelope, options = {}) {
  const now = options.now instanceof Date ? options.now : new Date(options.now || Date.now());
  const envelope = normalizeEnvelope(rawEnvelope);
  const player = envelope.player;
  const season2 = getSeason2(player);
  const words = normalizeWords(envelope.words);
  const categories = normalizeCategories({ ...envelope, words });
  const mission = normalizeDailyMission(player.dailyMission, now);
  const adventure = deriveAdventure(season2);
  const mastery = deriveMastery(season2, words, now);
  const collection = isPlainObject(season2.season2Collection) ? season2.season2Collection : {};
  const ownedSeason2 = Object.values(collection).filter(Boolean).length;
  const knownCards = isPlainObject(player.knownCards) ? player.knownCards : {};
  const knownCount = Object.values(knownCards).filter(Boolean).length;
  const streak = isPlainObject(season2.studyStreak) ? season2.studyStreak : {};
  const weekly = isPlainObject(season2.weeklyProgress) ? season2.weeklyProgress : {};
  const egg = isPlainObject(season2.incubatingEgg) ? season2.incubatingEgg : {};
  const settings = isPlainObject(season2.settings) ? season2.settings : {};

  return {
    envelope,
    player,
    season2,
    words,
    categories,
    mission,
    adventure,
    mastery,
    name: String(player.name || "Player").slice(0, 20),
    score: safeInt(player.score, 0, 100_000_000),
    coin: safeInt(player.coin, 0, 100_000_000),
    xp: safeInt(player.xp, 0, 100_000_000),
    combo: safeInt(player.combo, 0, 1_000_000),
    bestCombo: safeInt(player.bestCombo, 0, 1_000_000),
    sound: player.sound !== false,
    wordCount: words.length,
    knownCount,
    selectedCategoryId: envelope.selectedCategoryId,
    ownedSeason2,
    partnerId: String(season2.partnerId || ""),
    discoveryPoints: safeInt(season2.discoveryPoints, 0, 100_000_000),
    materials: safeInt(season2.evolutionMaterials, 0, 1_000_000),
    streak: {
      current: safeInt(streak.current, 0, 100_000),
      best: safeInt(streak.best, 0, 100_000),
      protectedDays: safeInt(streak.protectedDays, 0, 100)
    },
    weekly: {
      activeDays: Array.isArray(weekly.activeDays) ? weekly.activeDays.length : 0,
      adventures: safeInt(weekly.adventures, 0, 1_000),
      bosses: safeInt(weekly.bosses, 0, 1_000)
    },
    egg: {
      worldId: String(egg.worldId || "cookie"),
      progress: clamp(safeInt(egg.progress, 0, 100), 0, 100)
    },
    settings: {
      ageBand: settings.ageBand === "challenge" ? "challenge" : "easy",
      reducedMotion: settings.reducedMotion === true,
      autoTts: settings.autoTts !== false,
      timerEnabled: settings.timerEnabled === true
    }
  };
}

export function snapshotFingerprint(snapshot) {
  const compact = {
    name: snapshot.name,
    score: snapshot.score,
    coin: snapshot.coin,
    xp: snapshot.xp,
    combo: snapshot.combo,
    bestCombo: snapshot.bestCombo,
    sound: snapshot.sound,
    wordCount: snapshot.wordCount,
    knownCount: snapshot.knownCount,
    categories: snapshot.categories.map(({ id, name, count }) => [id, name, count]),
    mission: snapshot.mission,
    adventure: snapshot.adventure,
    mastery: snapshot.mastery,
    ownedSeason2: snapshot.ownedSeason2,
    partnerId: snapshot.partnerId,
    discoveryPoints: snapshot.discoveryPoints,
    streak: snapshot.streak,
    weekly: snapshot.weekly,
    egg: snapshot.egg,
    settings: snapshot.settings
  };
  return JSON.stringify(compact);
}

export function filterWords(words, query = "", categoryId = "all") {
  const needle = String(query || "").trim().toLowerCase();
  return words.filter((word) => {
    if (categoryId !== "all" && word.categoryId !== categoryId) return false;
    if (!needle) return true;
    return word.word.toLowerCase().includes(needle)
      || word.meaning.toLowerCase().includes(needle);
  });
}

export function missionCta(snapshot) {
  if (snapshot.adventure.completed) return { label: "오늘 기록 보기", note: `별 ${snapshot.adventure.stars}개를 모았어요` };
  if (snapshot.adventure.hasSession || snapshot.adventure.stageIndex > 0) {
    return { label: "이어서 학습하기", note: `${snapshot.adventure.stageIndex + 1}번째 단계부터 계속해요` };
  }
  return { label: "오늘 학습 시작하기", note: "약 5분 · 중간에 멈춰도 저장돼요" };
}
