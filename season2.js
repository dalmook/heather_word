import {renderEggSvg} from './character-companions.js';
import {showCharacterReveal,closeCharacterReveal} from './character-ui.js';
import {CHARACTER_HOOKS} from './character-personalities.js';
import {characterAcquisitionRecord} from './character-progress.js';
import {
  SEASON2_SCHEMA_VERSION,
  migratePlayer,
  normalizeSeason2,
  selectAdaptiveWords,
  recordWordResult,
  computeStars,
  applyStageReward,
  claimStarter,
  hatchCharacter,
  evolveCharacter,
  evolutionRequirement,
  weeklyQuestState,
  claimWeeklyReward,
  buildLearningReport,
  safeInt,
  todayKey
} from "./season2-core.js?v=8.0.0";
import {
  SEASON2_WORLDS,
  SEASON2_CATALOG,
  SEASON2_STARTERS,
  getSeason2World,
  getSeason2Character,
  getSpeciesStages,
  getStageOneCharacters,
  renderMonsterSvg
} from "./monster-catalog-season2.js?v=13.0.0";
let getApps;
let initializeApp;
let getAuth;
let signInAnonymously;
let onAuthStateChanged;
let getFirestore;
let collection;
let doc;
let getDoc;
let getDocs;
let updateDoc;
let serverTimestamp;
let season2FirebaseRuntimePromise = null;

async function loadSeason2FirebaseRuntime() {
  if (season2FirebaseRuntimePromise) return season2FirebaseRuntimePromise;
  season2FirebaseRuntimePromise = Promise.all([
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js")
  ]).then(([appModule, authModule, firestoreModule]) => {
    ({ getApps, initializeApp } = appModule);
    ({ getAuth, signInAnonymously, onAuthStateChanged } = authModule);
    ({ getFirestore, collection, doc, getDoc, getDocs, updateDoc, serverTimestamp } = firestoreModule);
  });
  return season2FirebaseRuntimePromise;
}

const LOCAL_KEY = globalThis.HEATHER_DEMO ? "heather_word_demo_v1" : "heather_word_v3";
const SYNC_DELAY_MS = 500;
const STAGES = Object.freeze([
  {
    id: "warmup",
    title: "준비 스테이지",
    icon: "🧭",
    description: "뜻과 블록으로 오늘의 단어를 깨워요.",
    count: 5,
    easyModes: ["choice", "choice", "block"],
    challengeModes: ["choice", "block", "blank"]
  },
  {
    id: "forest",
    title: "구름 숲",
    icon: "🌲",
    description: "블록과 빈칸을 섞어 길을 찾아요.",
    count: 7,
    easyModes: ["block", "blank", "block"],
    challengeModes: ["blank", "block", "type"]
  },
  {
    id: "gate",
    title: "별빛 성문",
    icon: "🏰",
    description: "직접 떠올려 쓰며 성문을 열어요.",
    count: 5,
    easyModes: ["blank", "block", "type"],
    challengeModes: ["type", "blank", "type"]
  },
  {
    id: "boss",
    title: "오늘의 보스",
    icon: "🛡️",
    description: "다시 보면 좋은 단어로 방패를 하나씩 깨요.",
    count: 4,
    easyModes: ["boss"],
    challengeModes: ["boss"]
  }
]);

const MODE_LABELS = Object.freeze({ choice: "뜻", block: "블록", blank: "빈칸", type: "쓰기", boss: "보스" });
const RARITY_LABELS = Object.freeze({ common: "일반", rare: "희귀", hero: "영웅", legend: "전설" });

const app = {
  envelope: {},
  player: {},
  season2: null,
  words: [],
  categories: [],
  root: null,
  home: null,
  view: "adventure",
  collectionLimit: 20,
  collectionFilters: { world: "all", rarity: "all", owned: "all", stage: "all" },
  detailId: "",
  syncTimer: null,
  firebase: { app: null, auth: null, db: null, user: null, ready: false },
  lastReport: null
};

bootstrap().catch((error) => {
  console.error("Heather Word Season 2 bootstrap failed", error);
  showSafeBanner("시즌 2를 불러오지 못했어요. 기존 학습 기능은 그대로 사용할 수 있어요.");
});

async function bootstrap() {
  await waitForBaseApp();
  app.envelope = readEnvelope();
  app.words = mergeWords([], app.envelope.words || []);
  app.categories = mergeCategories([], app.envelope.categories || []);
  await loadBundledWords();
  app.player = migratePlayer(app.envelope.player || {}, app.words, new Date());
  app.season2 = app.player.season2;
  persistSeason2({ remote: false, render: false });
  mountUi();
  renderAll();
  applyAccessibilitySettings();
  await setupFirebase();
  if (app.firebase.ready) {
    await Promise.allSettled([loadRemoteWords(), loadRemoteSeason2()]);
    app.player = migratePlayer({ ...(readEnvelope().player || {}), season2: app.season2 }, app.words, new Date());
    app.season2 = app.player.season2;
    persistSeason2({ remote: false, render: false });
    renderAll();
  }
  window.HeatherWordSeason2 = Object.freeze({
    version: "8.0.0",
    schemaVersion: SEASON2_SCHEMA_VERSION,
    open: (view = "adventure") => openSeason2(view),
    close: closeSeason2,
    getState: () => JSON.parse(JSON.stringify(app.season2))
  });
}

function waitForBaseApp() {
  return new Promise((resolve) => {
    const ready = () => document.querySelector("#homeScreen .pet-card") && document.querySelector("#gameScreen");
    if (ready()) return resolve();
    const started = Date.now();
    const timer = setInterval(() => {
      if (ready() || Date.now() - started > 5000) {
        clearInterval(timer);
        resolve();
      }
    }, 50);
  });
}

function readEnvelope() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function mergeWords(current, incoming) {
  const map = new Map((Array.isArray(current) ? current : []).filter((word) => word?.id).map((word) => [word.id, word]));
  for (const raw of Array.isArray(incoming) ? incoming : []) {
    const word = String(raw?.word || "").trim().toLowerCase();
    if (!word) continue;
    const categoryId = String(raw.categoryId || "custom");
    const id = String(raw.id || `${categoryId}_${word.replace(/[^a-z0-9]+/g, "_")}`);
    map.set(id, {
      id,
      word,
      meaning: String(raw.meaning || "").slice(0, 120),
      emoji: String(raw.emoji || "📘").slice(0, 8),
      categoryId
    });
  }
  return [...map.values()].sort((a, b) => a.word.localeCompare(b.word));
}

function mergeCategories(current, incoming) {
  const map = new Map((Array.isArray(current) ? current : []).filter((item) => item?.id).map((item) => [item.id, item]));
  map.set("custom", { id: "custom", name: "직접추가", emoji: "⭐" });
  for (const raw of Array.isArray(incoming) ? incoming : []) {
    const id = String(raw?.id || "");
    if (!id || id === "all") continue;
    map.set(id, { id, name: String(raw.name || "카테고리").slice(0, 30), emoji: String(raw.emoji || "🗂️").slice(0, 8) });
  }
  return [...map.values()];
}

async function loadBundledWords() {
  try {
    const response = await fetch("./words.json", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    app.words = mergeWords(app.words, data.words);
    app.categories = mergeCategories(app.categories, data.categories);
  } catch (error) {
    console.info("Season 2 bundled words unavailable", error);
  }
}

async function setupFirebase() {
  if (!window.HEATHER_USE_FIREBASE || new URLSearchParams(location.search).get("mode") === "local") return;
  try {
    await loadSeason2FirebaseRuntime();
    app.firebase.app = getApps()[0] || initializeApp(window.HEATHER_FIREBASE_CONFIG, "heather-season2");
    app.firebase.auth = getAuth(app.firebase.app);
    app.firebase.db = getFirestore(app.firebase.app);
    if (!app.firebase.auth.currentUser) {
      try {
        await signInAnonymously(app.firebase.auth);
      } catch {
        // The base app may already be completing the same sign-in.
      }
    }
    app.firebase.user = app.firebase.auth.currentUser || await waitForFirebaseUser(app.firebase.auth, 5000);
    app.firebase.ready = Boolean(app.firebase.user);
  } catch (error) {
    console.info("Season 2 Firebase fallback to local", error);
    app.firebase.ready = false;
  }
}

function waitForFirebaseUser(auth, timeoutMs) {
  return new Promise((resolve) => {
    let completed = false;
    const stop = onAuthStateChanged(auth, (user) => {
      if (!user || completed) return;
      completed = true;
      stop();
      resolve(user);
    });
    setTimeout(() => {
      if (completed) return;
      completed = true;
      stop();
      resolve(null);
    }, timeoutMs);
  });
}

async function loadRemoteWords() {
  if (!app.firebase.ready) return;
  try {
    const classId = window.HEATHER_CLASS_ID || "heather-main";
    const snapshot = await getDocs(collection(app.firebase.db, "classes", classId, "words"));
    const remoteWords = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    app.words = mergeWords(app.words, remoteWords);
    const categoryIds = new Set(app.categories.map((category) => category.id));
    for (const word of app.words) {
      if (!categoryIds.has(word.categoryId)) {
        app.categories.push({ id: word.categoryId, name: word.categoryId, emoji: "📚" });
        categoryIds.add(word.categoryId);
      }
    }
  } catch (error) {
    console.info("Season 2 remote words unavailable", error);
  }
}

async function loadRemoteSeason2() {
  if (!app.firebase.ready) return;
  try {
    const classId = window.HEATHER_CLASS_ID || "heather-main";
    const ref = doc(app.firebase.db, "classes", classId, "players", app.firebase.user.uid);
    const snapshot = await getDoc(ref);
    const remote = snapshot.data()?.progress?.__season2;
    if (remote && safeInt(remote.revision) > safeInt(app.season2.revision)) {
      app.season2 = normalizeSeason2(remote, readEnvelope().player || {}, app.words, new Date());
      persistSeason2({ remote: false, render: false });
    }
  } catch (error) {
    console.info("Season 2 remote progress unavailable", error);
  }
}

function touchSeason2() {
  app.season2.revision = safeInt(app.season2.revision) + 1;
  app.season2.updatedAt = new Date().toISOString();
}

function persistSeason2(options = {}) {
  const envelope = readEnvelope();
  const player = envelope.player && typeof envelope.player === "object" ? { ...envelope.player } : {};
  const progress = player.progress && typeof player.progress === "object" && !Array.isArray(player.progress) ? { ...player.progress } : {};
  player.season2 = app.season2;
  player.progress = { ...progress, __season2: app.season2 };
  envelope.player = player;
  localStorage.setItem(LOCAL_KEY, JSON.stringify(envelope));
  app.envelope = envelope;
  app.player = player;
  if (options.render !== false) renderAll();
  if (options.remote !== false) scheduleRemoteSync();
}

function scheduleRemoteSync() {
  clearTimeout(app.syncTimer);
  app.syncTimer = setTimeout(syncSeason2Remote, SYNC_DELAY_MS);
}

async function syncSeason2Remote() {
  if (!app.firebase.ready) return;
  try {
    const classId = window.HEATHER_CLASS_ID || "heather-main";
    const ref = doc(app.firebase.db, "classes", classId, "players", app.firebase.user.uid);
    const clean = JSON.parse(JSON.stringify(app.season2));
    await updateDoc(ref, {
      "progress.__season2": clean,
      updatedAt: serverTimestamp()
    });
    setSyncBadge("☁️ 동기화됨");
  } catch (error) {
    console.info("Season 2 remote sync deferred", error);
    setSyncBadge("📱 기기에 저장됨");
  }
}

function setSyncBadge(text) {
  const badge = app.home?.querySelector("[data-s2-sync]");
  if (badge) badge.textContent = text;
}

function mountUi() {
  mountHomePanel();
  mountOverlay();
  document.addEventListener("click", handleClick);
  document.addEventListener("change", handleChange);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && app.root && !app.root.hidden && !document.querySelector("dialog[open]")) closeSeason2();
    if (event.key === "Enter" && app.root && !app.root.hidden) {
      const active = document.activeElement;
      if (active?.matches("[data-s2-answer-input]")) submitTypedAnswer(active.value);
    }
  });
}

function mountHomePanel() {
  const petCard = document.querySelector("#homeScreen .pet-card");
  if (!petCard || document.querySelector("#season2HomePanel")) return;
  const panel = document.createElement("section");
  panel.id = "season2HomePanel";
  panel.className = "s2-home-panel";
  panel.setAttribute("aria-label", "스펠링 월드 시즌 2");
  const mission = petCard.querySelector(".mission-card");
  petCard.insertBefore(panel, mission || petCard.firstChild);
  app.home = panel;
}

function mountOverlay() {
  if (document.querySelector("#season2Overlay")) {
    app.root = document.querySelector("#season2Overlay");
    return;
  }
  const root = document.createElement("div");
  root.id = "season2Overlay";
  root.className = "s2-overlay";
  root.hidden = true;
  root.innerHTML = `
    <div class="s2-app" role="dialog" aria-modal="true" aria-labelledby="s2ViewTitle">
      <header class="s2-topbar">
        <button class="s2-icon-btn" data-s2-action="close" aria-label="기존 화면으로 돌아가기">←</button>
        <div><small>SPELLING WORLD · SEASON 2</small><h2 id="s2ViewTitle">오늘의 모험</h2></div>
        <div class="s2-resources"><span data-s2-points>🔎 0</span><span data-s2-materials>💎 0</span></div>
      </header>
      <nav class="s2-nav" aria-label="시즌 2 메뉴">
        <button data-s2-view="adventure">🗺️ 모험</button>
        <button data-s2-view="collection">📖 도감</button>
        <button data-s2-view="weekly">📅 주간</button>
        <button data-s2-view="settings">⚙️ 설정</button>
      </nav>
      <main id="s2Content" class="s2-content" tabindex="-1"></main>
    </div>`;
  document.body.appendChild(root);
  app.root = root;
}

function renderAll() {
  if (!app.season2) return;
  renderHomePanel();
  renderOverlayHeader();
  if (app.root && !app.root.hidden) renderView();
  applyAccessibilitySettings();
}

function renderHomePanel() {
  if (!app.home) return;
  const partner = getSeason2Character(app.season2.partnerId);
  const egg = app.season2.incubatingEgg;
  const eggWorld = getSeason2World(egg.worldId);
  const completed = app.season2.dailyAdventure.completed;
  const title = app.season2.titles.legacyCollectionMaster
    ? "🏅 도감 마스터"
    : app.season2.titles.weeklyExplorer
      ? "🧭 주간 탐험가"
      : "새로운 모험가";
  app.home.innerHTML = `
    <div class="s2-home-heading">
      <div><span>NEW ADVENTURE</span><strong>스펠링 월드 시즌 2</strong><small>${escapeHtml(title)} · 숙련 별 ${app.season2.endgameProgress.masteryStars}</small></div>
      <span class="s2-sync" data-s2-sync>${app.firebase.ready ? "☁️ 연결됨" : "📱 기기에 저장"}</span>
    </div>
    <button class="s2-primary-start" data-s2-action="start-adventure">
      <span>${completed ? "✅" : "🗺️"}</span>
      <div><strong>${completed ? "오늘의 모험 다시 보기" : "오늘의 모험 시작"}</strong><small>${completed ? "별과 보상을 확인해요" : "약 5~10분 · 중간에 닫아도 이어서"}</small></div>
      <b>→</b>
    </button>
    <div class="s2-home-mini-grid">
      <button class="s2-mini-card" data-s2-view="collection">
        <div class="s2-mini-art">${partner ? renderMonsterSvg(partner) : renderEggSvg()}</div>
        <div><small>현재 파트너</small><strong>${escapeHtml(partner?.name || "스타터를 골라요")}</strong><span>친밀도 ${safeInt(app.season2.monsterAffinity[partner?.id]?.points)}</span></div>
      </button>
      <button class="s2-mini-card" data-s2-action="open-egg">
        <div class="s2-egg-icon">${eggWorld.icon}</div>
        <div><small>${escapeHtml(eggWorld.name)} 알</small><strong>${egg.progress}% 부화</strong><i><em style="width:${egg.progress}%"></em></i></div>
      </button>
    </div>
    <div class="s2-home-links">
      <button data-s2-view="weekly">📅 주간 퀘스트</button>
      <button data-s2-action="open-report">📊 학습 리포트</button>
      <button data-s2-view="settings">⚙️ 난이도·모션</button>
    </div>`;
}

function renderOverlayHeader() {
  if (!app.root) return;
  const titleMap = { adventure: "오늘의 모험", collection: "시즌 2 도감", weekly: "주간 퀘스트", settings: "설정", starter: "스타터 선택", egg: "몬스터 알", report: "학습 리포트", stage: "학습 스테이지", detail: "캐릭터 상세" };
  const title = app.root.querySelector("#s2ViewTitle");
  if (title) title.textContent = titleMap[app.view] || "스펠링 월드";
  const points = app.root.querySelector("[data-s2-points]");
  const materials = app.root.querySelector("[data-s2-materials]");
  if (points) points.textContent = `🔎 ${app.season2.discoveryPoints}`;
  if (materials) materials.textContent = `💎 ${app.season2.evolutionMaterials}`;
  app.root.querySelectorAll("[data-s2-view]").forEach((button) => button.classList.toggle("active", button.dataset.s2View === app.view));
}

function openSeason2(view = "adventure") {
  closeCharacterReveal();
  if (!app.root) return;
  if(view === "report" && window.HEATHER_PARENT_GATE_GRANTED !== true) {openReport();return;}
  app.view = view;
  app.root.hidden = false;
  document.body.classList.add("s2-open");
  window.dispatchEvent(new CustomEvent("heather:season2-open",{detail:{view}}));
  renderAll();
  setTimeout(() => app.root.querySelector("#s2Content")?.focus(), 0);
}

function closeSeason2() {
  closeCharacterReveal();
  if (!app.root) return;
  app.root.hidden = true;
  document.body.classList.remove("s2-open");
  window.dispatchEvent(new CustomEvent("heather:season2-close"));
  renderHomePanel();
}

function renderView() {
  const content = app.root?.querySelector("#s2Content");
  if (!content) return;
  renderOverlayHeader();
  if (app.view === "adventure") content.innerHTML = renderAdventureView();
  else if (app.view === "starter") content.innerHTML = renderStarterView();
  else if (app.view === "egg") content.innerHTML = renderEggView();
  else if (app.view === "collection") content.innerHTML = renderCollectionView();
  else if (app.view === "detail") content.innerHTML = renderCharacterDetail();
  else if (app.view === "weekly") content.innerHTML = renderWeeklyView();
  else if (app.view === "settings") content.innerHTML = renderSettingsView();
  else if (app.view === "report") content.innerHTML = renderReportView();
  else if (app.view === "stage") content.innerHTML = renderStageView();
}

function renderAdventureView() {
  const daily = app.season2.dailyAdventure;
  const partner = getSeason2Character(app.season2.partnerId);
  const totalStars = daily.stars.reduce((sum, value) => sum + value, 0);
  return `
    <section class="s2-adventure-hero">
      <div class="s2-partner-stage">${partner ? renderMonsterSvg(partner) : renderEggSvg()}</div>
      <div><span>${escapeHtml(todayKey())}</span><h3>${daily.completed ? "오늘의 모험 완주!" : "단어 길을 함께 걸어요"}</h3><p>${daily.completed ? `별 ${totalStars}/12개를 모았어요. 틀린 단어도 모두 학습 기록에 남았어요.` : "오답 때문에 길이 막히지 않아요. 끝까지 도전한 것도 별로 인정해요."}</p></div>
    </section>
    ${!app.season2.starterClaimed ? `<button class="s2-starter-callout" data-s2-view="starter"><strong>🎁 첫 파트너를 골라요</strong><span>한 번 선택하면 바로 함께 모험할 수 있어요.</span></button>` : ""}
    <div class="s2-map" aria-label="오늘의 모험 지도">
      ${STAGES.map((stage, index) => {
        const unlocked = index <= daily.stageIndex || daily.completed;
        const done = daily.stars[index] > 0;
        const resume = daily.session?.stageIndex === index;
        return `<button class="s2-stage-card ${unlocked ? "unlocked" : "locked"} ${done ? "done" : ""}" data-s2-action="start-stage" data-stage-index="${index}" ${unlocked ? "" : "disabled"}>
          <span class="s2-stage-number">${done ? "✓" : index + 1}</span>
          <div><small>${stage.icon} ${index === 3 ? "BOSS" : `STAGE ${index + 1}`}</small><strong>${escapeHtml(stage.title)}</strong><p>${escapeHtml(stage.description)}</p><em>${done ? "★".repeat(daily.stars[index]) + "☆".repeat(3 - daily.stars[index]) : resume ? "이어하기" : unlocked ? `${stage.count}문제` : "앞 스테이지 완료 후"}</em></div>
          <b>${unlocked ? "→" : "🔒"}</b>
        </button>`;
      }).join("")}
    </div>
    <section class="s2-adventure-footer">
      <button data-s2-action="open-egg">🥚 알 ${app.season2.incubatingEgg.progress}%</button>
      <button data-s2-view="collection">📖 수집 ${Object.keys(app.season2.season2Collection).length}/60</button>
      <button data-s2-view="weekly">📅 이번 주 ${app.season2.weeklyProgress.activeDays.length}/5일</button>
    </section>`;
}

function renderStarterView() {
  if (app.season2.starterClaimed) {
    const starter = getSeason2Character(app.season2.selectedStarter);
    return `<div class="s2-empty"><div>${starter ? renderMonsterSvg(starter) : ""}</div><h3>스타터 선택 완료</h3><p>${escapeHtml(starter?.name || "파트너")}와 모험 중이에요.</p><button class="s2-primary" data-s2-view="adventure">모험 지도로</button></div>`;
  }
  return `<section class="s2-section-intro"><span>ONE-TIME CHOICE</span><h3>첫 파트너를 선택해요</h3><p>능력 차이는 없어요. 마음에 드는 친구를 골라 함께 공부하면 친밀도가 올라요.</p></section>
    <div class="s2-starter-grid">${SEASON2_STARTERS.map((id) => {
      const character = getSeason2Character(id);
      const world = getSeason2World(character.worldId);
      return `<article class="s2-starter-card"><div>${renderMonsterSvg(character)}</div><small>${world.icon} ${escapeHtml(world.name)}</small><h3>${escapeHtml(character.name)}</h3><p>${escapeHtml(character.personality)}</p><button class="s2-primary" data-s2-action="choose-starter" data-character-id="${id}">이 친구와 시작</button></article>`;
    }).join("")}</div>`;
}

function renderEggView() {
  const egg = app.season2.incubatingEgg;
  const world = getSeason2World(egg.worldId);
  const ready = egg.progress >= 100;
  return `<section class="s2-egg-hero">
      <div class="s2-egg-visual ${ready ? "ready" : ""}"><span>${world.icon}</span><b>${renderEggSvg({ariaLabel:world.name+"의 알"})}</b></div>
      <div><small>선택한 세계</small><h3>${escapeHtml(world.name)}의 알</h3><p>${ready ? "부화 결과를 만날 준비가 됐어요." : "실제 단어 학습과 모험 완주로 게이지가 올라요. 쉬어도 줄지 않아요."}</p></div>
    </section>
    <div class="s2-gauge"><div><span>부화 진행도</span><strong>${egg.progress}%</strong></div><i><em style="width:${egg.progress}%"></em></i></div>
    <label class="s2-field">다음에 만날 세계<select data-s2-egg-world>${SEASON2_WORLDS.map((item) => `<option value="${item.id}" ${item.id === egg.worldId ? "selected" : ""}>${item.icon} ${escapeHtml(item.name)}</option>`).join("")}</select></label>
    <div class="s2-info-box"><strong>중복 없는 부화</strong><p>선택한 세계에서 아직 없는 1단계 캐릭터를 먼저 확정 획득합니다. 그 세계를 모두 모았다면 친밀도 재료로 바뀝니다.</p></div>
    <button class="s2-primary s2-wide" data-s2-action="hatch" ${ready ? "" : "disabled"}>${ready ? `${world.icon} 알 부화하기` : `앞으로 ${100 - egg.progress}%`}</button>`;
}

function filteredCatalog() {
  const filters = app.collectionFilters;
  return SEASON2_CATALOG.filter((character) => {
    const owned = Boolean(app.season2.season2Collection[character.id]);
    return (filters.world === "all" || character.worldId === filters.world)
      && (filters.rarity === "all" || character.rarity === filters.rarity)
      && (filters.owned === "all" || (filters.owned === "owned" ? owned : !owned))
      && (filters.stage === "all" || String(character.evolutionStage) === filters.stage);
  });
}

function renderCollectionView() {
  const list = filteredCatalog();
  const visible = list.slice(0, app.collectionLimit);
  const acquired = Object.keys(app.season2.season2Collection).filter((id) => getSeason2Character(id)).length;
  return `<section class="s2-collection-summary"><div><span>수집 진행</span><strong>${acquired} / 60</strong></div><div><span>완전히 기억한 단어</span><strong>${app.season2.endgameProgress.masteryStars}</strong></div><div><span>파트너 친밀도</span><strong>${safeInt(app.season2.monsterAffinity[app.season2.partnerId]?.points)}</strong></div></section>
    <div class="s2-filters">
      <select aria-label="친구의 세계" data-s2-filter="world"><option value="all">전체 세계</option>${SEASON2_WORLDS.map((world) => `<option value="${world.id}" ${app.collectionFilters.world === world.id ? "selected" : ""}>${world.icon} ${escapeHtml(world.name)}</option>`).join("")}</select>
      <select aria-label="친구 등급" data-s2-filter="rarity"><option value="all">전체 등급</option>${Object.entries(RARITY_LABELS).map(([id, name]) => `<option value="${id}" ${app.collectionFilters.rarity === id ? "selected" : ""}>${name}</option>`).join("")}</select>
      <select aria-label="보유 상태" data-s2-filter="owned"><option value="all">획득 전체</option><option value="owned" ${app.collectionFilters.owned === "owned" ? "selected" : ""}>획득</option><option value="locked" ${app.collectionFilters.owned === "locked" ? "selected" : ""}>미획득</option></select>
      <select aria-label="진화 단계" data-s2-filter="stage"><option value="all">진화 전체</option><option value="1" ${app.collectionFilters.stage === "1" ? "selected" : ""}>1단계</option><option value="2" ${app.collectionFilters.stage === "2" ? "selected" : ""}>2단계</option><option value="3" ${app.collectionFilters.stage === "3" ? "selected" : ""}>3단계</option></select>
    </div>
    ${visible.length ? `<div class="s2-collection-grid">${visible.map(renderCollectionCard).join("")}</div>` : `<div class="s2-empty"><span>🔎</span><h3>조건에 맞는 캐릭터가 없어요</h3><p>필터를 바꿔 다시 찾아보세요.</p></div>`}
    ${visible.length < list.length ? `<button class="s2-secondary s2-wide" data-s2-action="load-more">더 보기 (${list.length - visible.length})</button>` : ""}`;
}

function renderCollectionCard(character) {
  const owned = Boolean(app.season2.season2Collection[character.id]);
  const partner = app.season2.partnerId === character.id;
  const world = getSeason2World(character.worldId);
  return `<button class="s2-character-card ${owned ? "owned" : "locked"} ${partner ? "partner" : ""}" data-s2-action="character-detail" data-character-id="${character.id}">
    <div>${renderMonsterSvg(character, { locked: !owned, ariaLabel: owned ? character.name : `${world.name} 미획득 캐릭터` })}</div>
    <small>${world.icon} ${escapeHtml(character.rarityLabel)} · ${character.evolutionStage}단계</small>
    <strong>${owned ? escapeHtml(character.name) : "???"}</strong>
    <span>${partner ? "현재 파트너" : owned ? `친밀도 ${safeInt(app.season2.monsterAffinity[character.id]?.points)}` : escapeHtml(world.hint)}</span>
  </button>`;
}

function renderCharacterDetail() {
  const character = getSeason2Character(app.detailId);
  if (!character) return `<div class="s2-empty"><p>캐릭터 정보를 찾지 못했어요.</p><button data-s2-view="collection">도감으로</button></div>`;
  const owned = Boolean(app.season2.season2Collection[character.id]);
  const world = getSeason2World(character.worldId);
  const stages = getSpeciesStages(character.speciesId);
  const next = stages.find(item => item.evolutionStage === character.evolutionStage + 1);
  const affinity = safeInt(app.season2.monsterAffinity[character.id]?.points);
  const requirement = next ? evolutionRequirement(character.evolutionStage) : null;
  const nextOwned = Boolean(next && app.season2.season2Collection[next.id]);
  const canEvolve = Boolean(next && owned && affinity >= requirement.affinity && app.season2.evolutionMaterials >= requirement.materials && !nextOwned);
  const obtained = owned ? characterAcquisitionRecord(app.season2, character.id) : null;
  const dateLabel = obtained ? new Date(obtained.at).toLocaleDateString("ko-KR") : "기록 없음";
  return `<button class="s2-text-back" data-s2-view="collection">← 친구 도감</button>
    <section class="s2-detail-hero ${owned ? "" : "locked"}" style="--character-world:${world.color}">
      <div class="s2-detail-art">${renderMonsterSvg(character, {locked:!owned})}</div>
      <div><span class="hw-character-rarity" data-rarity="${character.rarity}">${escapeHtml(character.rarityLabel)} · ${character.evolutionStage}단계</span><small>${world.icon} ${escapeHtml(world.name)}</small>
      <h3>${owned ? escapeHtml(character.name) : "아직 만나지 못한 친구"}</h3><p>${owned ? escapeHtml(character.description) : escapeHtml(world.hint)}</p>
      ${owned ? `<p class="hw-character-hook">${escapeHtml(CHARACTER_HOOKS[character.speciesId] || "")}</p>` : ""}</div></section>
    <dl class="s2-detail-list">
      <div><dt>성장</dt><dd>${character.evolutionStage}단계 · ${escapeHtml(character.stageLabel)}</dd></div>
      <div><dt>성격</dt><dd>${owned ? escapeHtml(character.personality) : "만난 뒤 알 수 있어요"}</dd></div>
      <div><dt>좋아하는 놀이</dt><dd>${owned ? escapeHtml(MODE_LABELS[character.favoriteMode] || character.favoriteMode) : "아직 비밀이에요"}</dd></div>
      <div><dt>함께 맞힌 단어</dt><dd>${safeInt(app.season2.monsterAffinity[character.id]?.wordsStudied)}개</dd></div>
      <div><dt>친밀도</dt><dd>${affinity}</dd></div>
      <div><dt>처음 만난 날</dt><dd>${owned ? escapeHtml(dateLabel) : "아직 만나기 전"}</dd></div>
    </dl>
    <section class="hw-evolution-story"><h4>우리의 성장 이야기</h4><div class="s2-evolution-line">${stages.map(stage => {
      const known = Boolean(app.season2.season2Collection[stage.id]);
      return `<button type="button" class="${known ? "owned" : "locked"} ${stage.id === character.id ? "is-current" : ""}" data-s2-action="character-detail" data-character-id="${stage.id}" aria-label="${known ? escapeAttr(stage.name) : `${stage.evolutionStage}단계 실루엣`} 보기" ${stage.id === character.id ? 'aria-current="true"' : ''}>${renderMonsterSvg(stage,{locked:!known})}<span>${known ? escapeHtml(stage.name) : `${stage.evolutionStage}단계`}</span></button>`;
    }).join('<b aria-hidden="true">→</b>')}</div></section>
    ${owned ? `<button class="s2-primary s2-wide" data-s2-action="set-partner" data-character-id="${character.id}" ${app.season2.partnerId === character.id ? "disabled" : ""}>${app.season2.partnerId === character.id ? "지금 함께하는 파트너" : "이 친구와 함께 공부하기"}</button>` : `<div class="s2-info-box"><strong>이 세계의 친구를 만나려면</strong><p>알 화면에서 ${escapeHtml(world.name)}을 골라 보세요. 아직 없는 1단계 친구부터 만날 수 있어요.</p><button class="s2-secondary" data-s2-action="open-egg">알과 세계 고르기</button></div>`}
    ${next && owned && !nextOwned ? `<section class="hw-next-evolution"><h4>다음 모습까지 한 걸음</h4><p>친밀도 ${affinity}/${requirement.affinity} · 진화 재료 ${app.season2.evolutionMaterials}/${requirement.materials}</p><div class="s2-gauge" role="progressbar" aria-label="다음 진화에 필요한 친밀도" aria-valuemin="0" aria-valuemax="${requirement.affinity}" aria-valuenow="${Math.min(affinity,requirement.affinity)}"><i><em style="width:${Math.min(100,Math.round(affinity/requirement.affinity*100))}%"></em></i></div><p>${canEvolve ? "준비가 됐어요. 새로운 모습을 만나 볼까요?" : affinity < requirement.affinity ? "파트너로 함께 공부하며 친밀도를 모아요." : "오늘의 모험을 완주하며 진화 재료를 모아요."}</p><button class="s2-secondary s2-wide" data-s2-action="evolve" data-character-id="${character.id}" data-next-id="${next.id}" data-stage="${character.evolutionStage}" ${canEvolve ? "" : "disabled"}>${canEvolve ? "새 모습으로 진화하기" : "차근차근 함께 자라요"}</button></section>` : nextOwned ? `<div class="s2-info-box">다음 모습도 도감에 있어요. 위의 성장 이야기에서 살펴보세요.</div>` : owned ? `<div class="s2-info-box">마지막 진화에 도착했어요. 이제 더 많은 단어를 함께 만나봐요.</div>` : ""}
    ${owned && app.season2.partnerId === character.id ? '<button class="s2-secondary s2-wide" data-s2-view="adventure">파트너와 모험 시작</button>' : ''}`;
}

function renderWeeklyView() {
  const state = weeklyQuestState(app.season2, new Date());
  const canClaim = state.activeDays >= 5 && state.completed >= 4 && !app.season2.weeklyProgress.rewarded;
  const monday = new Date(`${app.season2.weeklyProgress.weekKey}T12:00:00`);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return { key: todayKey(date), label: ["월", "화", "수", "목", "금", "토", "일"][index] };
  });
  return `<section class="s2-week-hero"><div><span>FLEXIBLE WEEK</span><h3>이번 주 ${state.activeDays}/5일 학습</h3><p>하루 쉬어도 괜찮아요. 최고 기록은 그대로 남고, 7일 중 5일이면 충분해요.</p></div><strong>연속 ${app.season2.studyStreak.current}<small>최고 ${app.season2.studyStreak.best}</small></strong></section>
    <div class="s2-week-calendar">${days.map((day) => `<div class="${app.season2.weeklyProgress.activeDays.includes(day.key) ? "active" : ""}"><b>${day.label}</b><span>${app.season2.weeklyProgress.activeDays.includes(day.key) ? "✓" : "·"}</span></div>`).join("")}</div>
    <div class="s2-quest-list">${state.quests.map((quest) => {
      const percent = Math.min(100, Math.round(quest.value / quest.target * 100));
      return `<div class="s2-quest ${percent >= 100 ? "done" : ""}"><div><strong>${percent >= 100 ? "✓ " : ""}${escapeHtml(quest.label)}</strong><span>${Math.min(quest.value, quest.target)} / ${quest.target}</span></div><i><em style="width:${percent}%"></em></i></div>`;
    }).join("")}</div>
    <button class="s2-primary s2-wide" data-s2-action="claim-weekly" ${canClaim ? "" : "disabled"}>${app.season2.weeklyProgress.rewarded ? "이번 주 보상 완료" : canClaim ? "주간 보상 받기" : `5일 학습 + 퀘스트 4개 (${state.completed}/4)`}</button>`;
}

function renderSettingsView() {
  const settings = app.season2.settings;
  return `<section class="s2-section-intro"><span>PLAY YOUR WAY</span><h3>나이를 묻지 않고 플레이 방식을 골라요</h3><p>설정을 바꿔도 진행도와 캐릭터는 그대로 유지됩니다.</p></section>
    <div class="s2-settings-list">
      <label class="s2-setting-card"><div><strong>모험 난이도</strong><span>쉬운 모험은 도움을 빨리, 도전 모험은 직접 쓰기를 더 많이 제공해요.</span></div><select data-s2-setting="ageBand"><option value="easy" ${settings.ageBand === "easy" ? "selected" : ""}>쉬운 모험 · 7~9세 느낌</option><option value="challenge" ${settings.ageBand === "challenge" ? "selected" : ""}>도전 모험 · 10~13세 느낌</option></select></label>
      <label class="s2-setting-card"><div><strong>발음 자동 듣기</strong><span>쓰기와 보스 문제에서 영어 발음을 자동으로 들려줘요.</span></div><input type="checkbox" data-s2-setting="autoTts" ${settings.autoTts ? "checked" : ""}></label>
      <label class="s2-setting-card"><div><strong>모션 줄이기</strong><span>흔들림, 번쩍임, 큰 등장 효과를 줄여요.</span></div><input type="checkbox" data-s2-setting="reducedMotion" ${settings.reducedMotion ? "checked" : ""}></label>
      <label class="s2-setting-card"><div><strong>선택형 시간 보너스</strong><span>기본은 꺼져 있어요. 켜도 오답으로 XP가 줄지 않아요.</span></div><input type="checkbox" data-s2-setting="timerEnabled" ${settings.timerEnabled ? "checked" : ""}></label>
    </div>
    <div class="s2-info-box"><strong>개인정보 안내</strong><p>생년월일, 학교명, 위치를 수집하지 않습니다. Firebase 공개 랭킹 점수는 클라이언트 기록이라 서버 검증 점수로 보지 않습니다.</p></div>`;
}

function renderReportView() {
  const report = app.lastReport || buildLearningReport(app.season2, app.words, app.categories, new Date());
  app.lastReport = report;
  const modeRows = Object.entries(report.modeAccuracy);
  return `<section class="s2-report-hero"><div><span>LEARNING SNAPSHOT</span><h3>다시 보면 좋은 단어를 찾았어요</h3><p>점수표가 아니라 다음 학습을 편하게 고르는 안내판이에요.</p></div><button class="s2-secondary" data-s2-action="export-report-json">JSON</button><button class="s2-secondary" data-s2-action="export-report-csv">CSV</button></section>
    <div class="s2-report-stats"><div><strong>${report.sessions.today}</strong><span>오늘 풀이</span></div><div><strong>${report.sessions.days7}</strong><span>최근 7일</span></div><div><strong>${report.sessions.days30}</strong><span>최근 30일</span></div><div><strong>${report.adventures}</strong><span>모험 완주</span></div></div>
    <section class="s2-report-section"><h3>모드별 정답률</h3>${modeRows.length ? `<div class="s2-report-rows">${modeRows.map(([mode, item]) => `<div><span>${escapeHtml(MODE_LABELS[mode] || mode)}</span><strong>${item.accuracy}%</strong><small>${item.correct}/${item.total}</small></div>`).join("")}</div>` : `<p class="s2-muted">아직 학습 기록이 없어요.</p>`}</section>
    <section class="s2-report-section"><h3>다시 보면 좋은 단어</h3>${report.hardWords.length ? `<div class="s2-word-chips">${report.hardWords.map((item) => `<span><b>${escapeHtml(item.word)}</b>${escapeHtml(item.meaning)} · 숙련 ${item.level}</span>`).join("")}</div>` : `<p class="s2-muted">현재 표시할 단어가 없어요.</p>`}</section>
    <section class="s2-report-section"><h3>복습 예정 단어</h3>${report.dueWords.length ? `<div class="s2-word-chips">${report.dueWords.slice(0, 10).map((item) => `<span><b>${escapeHtml(item.word)}</b>${escapeHtml(item.meaning)}</span>`).join("")}</div>` : `<p class="s2-muted">지금 바로 복습할 단어가 없어요.</p>`}</section>
    <section class="s2-report-section"><h3>카테고리별 숙련</h3>${report.categoryMastery.length ? `<div class="s2-category-report">${report.categoryMastery.map((item) => `<div><span>${escapeHtml(item.name)}</span><i><em style="width:${item.percent}%"></em></i><strong>${item.percent}%</strong></div>`).join("")}</div>` : `<p class="s2-muted">카테고리 데이터가 없어요.</p>`}</section>`;
}

function currentSession() {
  const session = app.season2.dailyAdventure.session;
  return session && session.date === todayKey() ? session : null;
}

function renderStageView() {
  const session = currentSession();
  if (!session) return `<div class="s2-empty"><span>🧭</span><h3>진행 중인 스테이지가 없어요</h3><button class="s2-primary" data-s2-view="adventure">모험 지도</button></div>`;
  if (session.completed) return renderStageComplete(session);
  const question = session.questions[session.index];
  const word = app.words.find((item) => item.id === question?.wordId);
  if (!question || !word) return `<div class="s2-empty"><p>문제를 불러오지 못했어요.</p><button class="s2-primary" data-s2-action="abandon-session">지도에서 다시 시작</button></div>`;
  const stage = STAGES[session.stageIndex];
  const progress = `${session.index + 1}/${session.questions.length}`;
  const bossShield = session.stageIndex === 3 ? session.questions.length - session.correct : 0;
  return `<div class="s2-stage-progress"><button class="s2-text-back" data-s2-view="adventure">← 지도</button><div><span>${stage.icon} ${escapeHtml(stage.title)}</span><strong>${progress}</strong></div><i><em style="width:${Math.round(session.index / session.questions.length * 100)}%"></em></i></div>
    ${session.stageIndex === 3 ? `<section class="s2-boss-bar"><div>${renderBossMonster()}</div><div><small>보스 방패</small><strong>${"🛡️".repeat(Math.max(0, bossShield))}${"·".repeat(Math.max(0, session.questions.length - bossShield))}</strong><p>틀려도 체력은 줄지 않아요. 대신 힌트가 한 단계씩 열려요.</p></div></section>` : ""}
    <section class="s2-question-card ${session.stageIndex === 3 ? "boss" : ""}">
      <div class="s2-question-top"><span>${escapeHtml(word.emoji || "📘")}</span><div><small>${escapeHtml(MODE_LABELS[question.mode] || question.mode)} 문제</small><h3>${escapeHtml(word.meaning || "뜻을 확인해요")}</h3></div><button data-s2-action="speak" data-text="${escapeAttr(word.word)}" aria-label="발음 듣기">🔊</button></div>
      ${renderQuestionBody(session, question, word)}
      ${session.feedback ? renderQuestionFeedback(session.feedback, word) : ""}
    </section>${renderStudyPartner(session.feedback?.type)}`;
}

function renderBossMonster() {
  const candidates = SEASON2_CATALOG.filter((item) => item.evolutionStage === 3);
  const index = new Date().getDate() % candidates.length;
  return renderMonsterSvg(candidates[index], { ariaLabel: "오늘의 보스" });
}

function renderQuestionBody(session, question, word) {
  const override = session.retryMode || (question.mode === "boss" && safeInt(session.bossHints?.[session.index]) >= 3 ? "block" : question.mode);
  if (override === "choice") {
    const options = buildChoiceOptions(word, session);
    return `<div class="s2-choice-grid">${options.map((item) => `<button data-s2-action="answer-choice" data-word-id="${item.id}">${escapeHtml(item.word)}</button>`).join("")}</div><button class="s2-skip" data-s2-action="skip-question">몰라요 · 정답 확인</button>`;
  }
  if (override === "block") {
    const letters = normalizedLetters(word.word).split("");
    const selected = Array.isArray(session.blockAnswer) ? session.blockAnswer : [];
    const available = letters.map((letter, index) => ({ letter, index })).filter((item) => !selected.includes(item.index));
    const shuffled = deterministicShuffle(available, `${session.date}:${session.stageIndex}:${session.index}`);
    return `${question.mode === "boss" ? renderBossHint(session, word) : ""}<div class="s2-block-answer">${selected.map((index, position) => `<button data-s2-action="remove-block" data-position="${position}">${escapeHtml(letters[index])}</button>`).join("") || "<span>글자를 순서대로 눌러요</span>"}</div><div class="s2-letter-bank">${shuffled.map((item) => `<button data-s2-action="add-block" data-letter-index="${item.index}">${escapeHtml(item.letter)}</button>`).join("")}</div><div class="s2-answer-actions"><button class="s2-secondary" data-s2-action="clear-block">지우기</button><button class="s2-primary" data-s2-action="check-block">확인</button></div>`;
  }
  const hint = override === "blank" ? maskWord(word.word, app.season2.settings.ageBand === "easy" ? 2 : 3) : "";
  return `${question.mode === "boss" ? renderBossHint(session, word) : ""}${hint ? `<div class="s2-word-hint">${escapeHtml(hint)}</div>` : ""}<input class="s2-answer-input" data-s2-answer-input aria-label="영어 단어 정답" placeholder="영어 단어 입력" autocomplete="off" autocapitalize="none" spellcheck="false" inputmode="text" maxlength="60"><div class="s2-answer-actions"><button class="s2-skip" data-s2-action="skip-question">몰라요</button><button class="s2-primary" data-s2-action="submit-input">확인</button></div>`;
}

function renderBossHint(session, word) {
  const level = safeInt(session.bossHints?.[session.index], 0, 3);
  if (!level) return `<p class="s2-boss-hint">첫 도전이에요. 천천히 떠올려 보세요.</p>`;
  if (level === 1) return `<p class="s2-boss-hint">힌트 1 · 알파벳 ${normalizedLetters(word.word).length}글자예요.</p>`;
  if (level === 2) return `<p class="s2-boss-hint">힌트 2 · ${escapeHtml(revealPartial(word.word))}</p>`;
  return `<p class="s2-boss-hint">힌트 3 · 글자 블록으로 직접 완성해요.</p>`;
}

function renderQuestionFeedback(feedback, word) {
  const good = feedback.type === "correct";
  return `<div class="s2-feedback ${good ? "good" : "review"}" role="status"><strong>${good ? "정답!" : "다시 보면 좋은 단어"}</strong><p>${escapeHtml(feedback.message)}</p>${good ? "" : `<div><b>${escapeHtml(word.word)}</b><span>${escapeHtml(word.meaning)} · ${escapeHtml(formatLetters(word.word))}</span></div><button class="s2-primary" data-s2-action="retry-question">정답을 다시 써보기</button>`}</div>`;
}

function renderStageComplete(session) {
  const stage = STAGES[session.stageIndex];
  const next = STAGES[session.stageIndex + 1];
  const eggReady = app.season2.incubatingEgg.progress >= 100;
  return `<section class="s2-stage-complete"><div class="hw-stage-friend">${renderStudyPartner("correct", true)}</div><h3>${escapeHtml(stage.title)} 완료!</h3><div class="s2-stars">${"★".repeat(session.stars)}${"☆".repeat(3 - session.stars)}</div><p>정답 ${session.correct}/${session.questions.length} · 끝까지 완주한 것도 별에 포함했어요.</p><div class="s2-reward-row"><span>🔎 발견 포인트</span><span>💎 진화 재료</span><span>🥚 부화 ${app.season2.incubatingEgg.progress}%</span></div>${eggReady ? `<button class="s2-primary s2-wide" data-s2-action="open-egg">🥚 알이 부화할 준비가 됐어요</button>` : ""}<button class="s2-secondary s2-wide" data-s2-action="finish-stage">${next ? `${next.icon} 다음 스테이지` : "🗺️ 모험 지도로"}</button></section>`;
}

function startStage(stageIndex) {
  if (!app.season2.starterClaimed) {
    openSeason2("starter");
    return;
  }
  const daily = app.season2.dailyAdventure;
  if (stageIndex > daily.stageIndex && !daily.completed) return;
  const existing = currentSession();
  if (existing && existing.stageIndex === stageIndex && !existing.completed) {
    app.view = "stage";
    renderAll();
    autoSpeakCurrent();
    return;
  }
  if (!app.words.length) {
    showToast("단어장이 비어 있어요", "기존 관리 화면에서 단어를 추가하면 모험을 시작할 수 있어요.");
    return;
  }
  const stage = STAGES[stageIndex];
  const selected = selectAdaptiveWords(app.words, app.season2.wordMastery, stage.count, { now: new Date() });
  const modes = app.season2.settings.ageBand === "challenge" ? stage.challengeModes : stage.easyModes;
  const questions = selected.map((word, index) => ({ wordId: word.id, mode: modes[index % modes.length] }));
  daily.session = {
    date: todayKey(),
    stageIndex,
    index: 0,
    correct: 0,
    attempts: 0,
    questions,
    feedback: null,
    retryMode: "",
    blockAnswer: [],
    bossHints: {},
    completed: false,
    stars: 0,
    startedAt: new Date().toISOString()
  };
  touchSeason2();
  persistSeason2({ render: false });
  app.view = "stage";
  renderAll();
  autoSpeakCurrent();
}

function handleClick(event) {
  const viewButton = event.target.closest("[data-s2-view]");
  if (viewButton) {
    event.preventDefault();
    openSeason2(viewButton.dataset.s2View);
    return;
  }
  const button = event.target.closest("[data-s2-action]");
  if (!button) return;
  event.preventDefault();
  const action = button.dataset.s2Action;
  if (action === "close") closeSeason2();
  else if (action === "start-adventure") openSeason2(app.season2.starterClaimed ? "adventure" : "starter");
  else if (action === "start-stage") startStage(Number(button.dataset.stageIndex));
  else if (action === "choose-starter") chooseStarter(button.dataset.characterId);
  else if (action === "open-egg") openSeason2("egg");
  else if (action === "hatch") hatchEgg();
  else if (action === "load-more") { app.collectionLimit += 20; renderView(); }
  else if (action === "character-detail") { app.detailId = button.dataset.characterId; app.view = "detail"; renderAll(); }
  else if (action === "set-partner") setPartner(button.dataset.characterId);
  else if (action === "evolve") evolve(button.dataset.characterId, button.dataset.nextId, Number(button.dataset.stage));
  else if (action === "claim-weekly") claimWeekly();
  else if (action === "open-report") openReport();
  else if (action === "export-report-json") exportReport("json");
  else if (action === "export-report-csv") exportReport("csv");
  else if (action === "answer-choice") answerChoice(button.dataset.wordId);
  else if (action === "submit-input") submitTypedAnswer(app.root.querySelector("[data-s2-answer-input]")?.value || "");
  else if (action === "skip-question") skipQuestion();
  else if (action === "retry-question") retryQuestion();
  else if (action === "add-block") addBlock(Number(button.dataset.letterIndex));
  else if (action === "remove-block") removeBlock(Number(button.dataset.position));
  else if (action === "clear-block") clearBlock();
  else if (action === "check-block") checkBlock();
  else if (action === "finish-stage") finishStage();
  else if (action === "abandon-session") abandonSession();
  else if (action === "speak") speak(button.dataset.text || "");
}

function handleChange(event) {
  const filter = event.target.closest("[data-s2-filter]");
  if (filter) {
    app.collectionFilters[filter.dataset.s2Filter] = filter.value;
    app.collectionLimit = 20;
    renderView();
    return;
  }
  if (event.target.matches("[data-s2-egg-world]")) {
    app.season2.incubatingEgg.worldId = event.target.value;
    touchSeason2();
    persistSeason2();
    return;
  }
  const setting = event.target.closest("[data-s2-setting]");
  if (setting) {
    const key = setting.dataset.s2Setting;
    app.season2.settings[key] = setting.type === "checkbox" ? setting.checked : setting.value;
    touchSeason2();
    persistSeason2();
    showToast("설정 저장", "진행도는 그대로 유지돼요.");
  }
}

function chooseStarter(characterId) {
  const previouslyClaimed = app.season2.starterClaimed;
  app.season2 = claimStarter(app.season2, characterId, SEASON2_STARTERS, new Date());
  persistSeason2();
  const character = getSeason2Character(characterId);
  showToast("첫 파트너!", `${character?.name || "새 친구"}와 함께 모험을 시작해요.`);
  app.view = "adventure";
  renderAll();
  if (!previouslyClaimed && app.season2.season2Collection[characterId]) showCharacterReveal(character);
}

function hatchEgg() {
  const worldId = app.season2.incubatingEgg.worldId;
  const stageOne = getStageOneCharacters(worldId).map((item) => item.id);
  const result = hatchCharacter(app.season2, worldId, stageOne, new Date());
  if (!result.characterId) {
    showToast("아직 준비 중", "부화 게이지를 100% 채워 주세요.");
    return;
  }
  app.season2 = result.season2;
  persistSeason2();
  const character = getSeason2Character(result.characterId);
  showToast(result.duplicate ? "친밀도 재료 획득" : "새 캐릭터 발견!", result.duplicate ? `${character?.name} 친밀도 +10` : `${character?.name}이 도감에 들어왔어요.`);
  app.detailId = result.characterId;
  app.view = "detail";
  renderAll();
  if (!result.duplicate) showCharacterReveal(character);
}

function setPartner(characterId) {
  if (!app.season2.season2Collection[characterId]) return;
  app.season2.partnerId = characterId;
  touchSeason2();
  persistSeason2();
  showToast("파트너 변경", `${getSeason2Character(characterId)?.name || "캐릭터"}와 함께 공부해요.`);
}

function evolve(characterId, nextId, stage) {
  const result = evolveCharacter(app.season2, characterId, nextId, stage, new Date());
  if (!result.evolved) {
    showToast("진화 조건 확인", "친밀도와 진화 재료를 더 모아 주세요.");
    return;
  }
  app.season2 = result.season2;
  persistSeason2();
  app.detailId = nextId;
  showToast("진화 성공!", `${getSeason2Character(nextId)?.name || "새 모습"}으로 진화했어요.`);
  renderAll();
  showCharacterReveal(getSeason2Character(nextId), {kind:"evolution", previous:getSeason2Character(characterId)});
}

function claimWeekly() {
  const result = claimWeeklyReward(app.season2, new Date());
  if (!result.claimed) {
    showToast("주간 목표 진행 중", "5일 학습과 퀘스트 4개를 채우면 받을 수 있어요.");
    return;
  }
  app.season2 = result.season2;
  persistSeason2();
  showToast("주간 보상!", "진화 재료 10개와 알 진행도 35%를 받았어요.");
}

function openReport() {
  const showReport=()=>{
    app.lastReport=buildLearningReport(app.season2,app.words,app.categories,new Date());
    openSeason2("report");
  };
  if(window.HeatherWordUI?.requestParentAccess) window.HeatherWordUI.requestParentAccess(showReport);
  else showToast("보호자 확인 필요", "앱을 새로고침한 뒤 보호자 PIN으로 열어 주세요.");
}

function exportReport(type) {
  const report = app.lastReport || buildLearningReport(app.season2, app.words, app.categories, new Date());
  if (type === "json") {
    downloadText(`heather-word-report-${todayKey()}.json`, JSON.stringify(report, null, 2), "application/json");
    return;
  }
  const rows = [["구분", "단어", "뜻", "값"]];
  report.hardWords.forEach((item) => rows.push(["다시 보면 좋은 단어", item.word, item.meaning, `숙련 ${item.level}`]));
  report.dueWords.forEach((item) => rows.push(["복습 예정", item.word, item.meaning, item.dueAt]));
  report.masteredWords.forEach((item) => rows.push(["완전히 기억한 단어", item.word, item.meaning, "숙련 5"]));
  report.categoryMastery.forEach((item) => rows.push(["카테고리 숙련", item.name, "", `${item.percent}%`]));
  const csv = `\ufeff${rows.map((row) => row.map(csvCell).join(",")).join("\n")}`;
  downloadText(`heather-word-report-${todayKey()}.csv`, csv, "text/csv;charset=utf-8");
}

function buildChoiceOptions(word, session) {
  const distractors = app.words.filter((item) => item.id !== word.id && item.word !== word.word);
  const seed = `${session.date}:${session.stageIndex}:${session.index}`;
  return deterministicShuffle([word, ...deterministicShuffle(distractors, seed).slice(0, 3)], `${seed}:options`);
}

function answerChoice(selectedWordId) {
  const session = currentSession();
  if (!session || session.feedback) return;
  const question = session.questions[session.index];
  processAnswer(selectedWordId === question.wordId, selectedWordId);
}

function submitTypedAnswer(value) {
  const session = currentSession();
  if (!session || session.feedback) return;
  const question = session.questions[session.index];
  const word = app.words.find((item) => item.id === question.wordId);
  if (!word) return;
  const answer = normalizedLetters(value);
  if (!answer) {
    showToast("정답 입력", "영어 단어를 입력해 주세요.");
    return;
  }
  processAnswer(answer === normalizedLetters(word.word), value);
}

function addBlock(index) {
  const session = currentSession();
  if (!session || session.feedback) return;
  session.blockAnswer ||= [];
  if (!session.blockAnswer.includes(index)) session.blockAnswer.push(index);
  persistSessionAndRender();
}

function removeBlock(position) {
  const session = currentSession();
  if (!session || session.feedback) return;
  session.blockAnswer ||= [];
  session.blockAnswer.splice(position, 1);
  persistSessionAndRender();
}

function clearBlock() {
  const session = currentSession();
  if (!session) return;
  session.blockAnswer = [];
  persistSessionAndRender();
}

function checkBlock() {
  const session = currentSession();
  if (!session || session.feedback) return;
  const question = session.questions[session.index];
  const word = app.words.find((item) => item.id === question.wordId);
  if (!word) return;
  const letters = normalizedLetters(word.word).split("");
  const answer = (session.blockAnswer || []).map((index) => letters[index]).join("");
  processAnswer(answer === normalizedLetters(word.word), answer);
}

function processAnswer(correct, submitted) {
  const session = currentSession();
  if (!session) return;
  const question = session.questions[session.index];
  const word = app.words.find((item) => item.id === question.wordId);
  if (!word) return;
  session.attempts += 1;
  const token = `${session.date}:${session.stageIndex}:${session.index}:${session.attempts}:${correct ? "c" : "w"}`;
  app.season2 = recordWordResult(app.season2, word.id, question.mode, correct ? "correct" : "wrong", { now: new Date(), token });
  const activeSession = app.season2.dailyAdventure.session = session;
  if (correct) {
    activeSession.correct += 1;
    activeSession.feedback = { type: "correct", message: `${word.word} · 잘 기억했어요!` };
    activeSession.retryMode = "";
    activeSession.blockAnswer = [];
    persistSeason2({ render: false });
    renderAll();
    setTimeout(advanceQuestion, app.season2.settings.reducedMotion ? 250 : 700);
    return;
  }
  if (session.stageIndex === 3) {
    session.bossHints ||= {};
    session.bossHints[session.index] = Math.min(3, safeInt(session.bossHints[session.index]) + 1);
    session.feedback = null;
    session.blockAnswer = [];
    persistSeason2({ render: false });
    renderAll();
    showToast("힌트가 열렸어요", session.bossHints[session.index] >= 3 ? "글자 블록으로 직접 완성해요." : "다시 천천히 도전해요.");
    autoSpeakCurrent();
    return;
  }
  session.feedback = { type: "review", message: submitted ? `입력한 답: ${String(submitted).slice(0, 60)}` : "정답을 확인하고 직접 한 번 완성해요." };
  persistSeason2({ render: false });
  renderAll();
  speak(word.word);
}

function skipQuestion() {
  const session = currentSession();
  if (!session || session.feedback) return;
  const question = session.questions[session.index];
  const word = app.words.find((item) => item.id === question.wordId);
  if (!word) return;
  session.attempts += 1;
  const token = `${session.date}:${session.stageIndex}:${session.index}:${session.attempts}:skip`;
  app.season2 = recordWordResult(app.season2, word.id, question.mode, "skip", { now: new Date(), token });
  app.season2.dailyAdventure.session = session;
  session.feedback = { type: "review", message: "몰라도 괜찮아요. 정답을 보고 직접 한 번 완성하면 다음으로 넘어가요." };
  persistSeason2({ render: false });
  renderAll();
  speak(word.word);
}

function retryQuestion() {
  const session = currentSession();
  if (!session) return;
  session.feedback = null;
  session.retryMode = "type";
  session.blockAnswer = [];
  persistSessionAndRender();
  autoSpeakCurrent();
}

function advanceQuestion() {
  const session = currentSession();
  if (!session) return;
  session.index += 1;
  session.feedback = null;
  session.retryMode = "";
  session.blockAnswer = [];
  if (session.index >= session.questions.length) {
    session.completed = true;
    session.stars = computeStars(session.correct, session.questions.length);
    app.season2.dailyAdventure.session = null;
    app.season2 = applyStageReward(app.season2, session.stageIndex, session.stars, new Date());
    const worldId = app.season2.incubatingEgg.worldId;
    const current = app.season2.worldProgress[worldId] || { stars: 0, stages: 0 };
    app.season2.worldProgress[worldId] = { stars: safeInt(current.stars) + session.stars, stages: safeInt(current.stages) + 1 };
    app.season2.dailyAdventure.session = session;
  } else {
    app.season2.dailyAdventure.session = session;
    touchSeason2();
  }
  persistSeason2({ render: false });
  renderAll();
  autoSpeakCurrent();
}

function finishStage() {
  const session = currentSession();
  if (!session?.completed) return;
  const nextStage = session.stageIndex + 1;
  app.season2.dailyAdventure.session = null;
  touchSeason2();
  persistSeason2({ render: false });
  if (nextStage < STAGES.length && !app.season2.dailyAdventure.completed) {
    startStage(nextStage);
  } else {
    app.view = "adventure";
    renderAll();
  }
}

function abandonSession() {
  app.season2.dailyAdventure.session = null;
  touchSeason2();
  persistSeason2({ render: false });
  app.view = "adventure";
  renderAll();
}

function persistSessionAndRender() {
  touchSeason2();
  persistSeason2({ render: false });
  renderAll();
}

function autoSpeakCurrent() {
  if (!app.season2.settings.autoTts) return;
  const session = currentSession();
  const question = session?.questions?.[session.index];
  if (!question || !["type", "boss"].includes(question.mode)) return;
  const word = app.words.find((item) => item.id === question.wordId);
  if (word) setTimeout(() => speak(word.word), 120);
}

function speak(text) {
  if (!text || !("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = app.season2.settings.ageBand === "easy" ? 0.76 : 0.88;
  speechSynthesis.speak(utterance);
}

function applyAccessibilitySettings() {
  document.body.classList.toggle("s2-reduced-motion", app.season2?.settings?.reducedMotion === true);
}

function showSafeBanner(message) {
  const banner = document.createElement("div");
  banner.className = "s2-safe-banner";
  banner.textContent = message;
  document.body.appendChild(banner);
}

function showToast(title, message = "") {
  const existing = document.querySelector("#s2Toast");
  existing?.remove();
  const toast = document.createElement("div");
  toast.id = "s2Toast";
  toast.className = "s2-toast";
  toast.innerHTML = `<strong>${escapeHtml(title)}</strong>${message ? `<span>${escapeHtml(message)}</span>` : ""}`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 250);
  }, 1800);
}

function downloadText(filename, content, type) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([content], { type }));
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function normalizedLetters(value) {
  return String(value || "").toLowerCase().replace(/[^a-z]/g, "");
}

function maskWord(value, every = 2) {
  const letters = normalizedLetters(value).split("");
  return letters.map((letter, index) => index % every === 0 ? letter.toUpperCase() : "_").join(" ");
}

function revealPartial(value) {
  return normalizedLetters(value).split("").map((letter, index) => index % 2 === 0 ? letter.toUpperCase() : "_").join(" ");
}

function formatLetters(value) {
  return normalizedLetters(value).toUpperCase().split("").join(" · ");
}

function deterministicShuffle(items, seedText) {
  const output = [...items];
  let seed = [...String(seedText)].reduce((sum, char) => ((sum * 31) + char.charCodeAt(0)) >>> 0, 2166136261);
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let index = output.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [output[index], output[swap]] = [output[swap], output[index]];
  }
  return output;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function renderStudyPartner(reaction = "idle", large = false) {
  const partner = getSeason2Character(app.season2.partnerId);
  return `<aside class="s2-study-partner ${large ? "is-large" : ""}" data-reaction="${reaction === "correct" ? "correct" : reaction === "idle" ? "idle" : "review"}"><div>${partner ? renderMonsterSvg(partner,{mood:reaction === "correct" ? "happy" : "idle"}) : renderEggSvg()}</div><p>${reaction === "correct" ? "같이 해냈어!" : reaction === "idle" ? "천천히 생각해도 괜찮아." : "괜찮아. 한 번 더 같이 해보자."}</p></aside>`;
}
