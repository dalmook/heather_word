import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDocs,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const DEFAULT_CATEGORY = { id: "all", name: "전체", emoji: "🌈" };
const CUSTOM_CATEGORY = { id: "custom", name: "직접추가", emoji: "⭐", base: true };
const LOCAL_KEY = "heather_word_v3";
const MAX_LIST_ROWS = 9999;
const NEXT_DELAY_MS = 650;
const MAX_WORD_LENGTH = 60;
const MAX_MEANING_LENGTH = 120;
const MAX_CATEGORY_NAME_LENGTH = 30;
const MAX_PLAYER_NAME_LENGTH = 20;
const MAX_IMPORT_CATEGORIES = 500;
const MAX_IMPORT_WORDS = 10000;
const SCORE_REWARDS = Object.freeze({
  card: 1,
  choice: 1,
  block: 15,
  blank: 40,
  type: 100
});
const MANAGE_PASSWORD = "3341";
const LEGACY_MONSTER_COUNT = 100;
const LEGACY_MONSTER_XP_STEP = 250;
const MONSTER_CATALOG_SIZE = 300;
const EXPANDED_MONSTER_START_GAP = 1500;
const EXPANDED_MONSTER_TIER_SIZE = 20;
const EXPANDED_MONSTER_GAP_INCREASE = 500;
const MODE_ROUNDS = Object.freeze({
  choice: { count: 10, label: "뜻", bonus: 10 },
  block: { count: 10, label: "블록", bonus: 100 },
  blank: { count: 5, label: "빈칸", bonus: 200 },
  type: { count: 5, label: "쓰기", bonus: 500 }
});
const MONSTER_BASE_NAMES = [
  "알몬", "삐약몬", "솜구름몬", "토끼몬", "판다몬",
  "여우몬", "유니콘몬", "드래곤몬", "피닉스몬", "스타몬",
  "고래몬", "나비몬", "호랑몬", "문어몬", "개구리몬",
  "사자몬", "펭귄몬", "공룡몬", "곰몬", "왕관몬"
];
const MONSTER_EMOJIS = [
  "🥚", "🐣", "☁️", "🐰", "🐼", "🦊", "🦄", "🐲", "🦅", "🌟",
  "🐳", "🦋", "🐯", "🐙", "🐸", "🦁", "🐧", "🦖", "🐻", "👑"
];
const MONSTER_TIERS = [
  "새싹", "반짝", "달빛", "무지개", "레전드",
  "오로라", "별자리", "보석", "천공", "신화",
  "은하", "태양", "우주", "영원", "마스터"
];
const MONSTER_MESSAGES = [
  "새 단어를 기다리고 있어요", "조금씩 힘이 생기고 있어요", "오늘도 단어를 먹고 자라요",
  "도감이 반짝반짝 채워져요", "쓰기 문제에도 자신 있어요", "긴 여정의 시작이에요",
  "희귀한 친구들을 만나고 있어요", "보석처럼 소중한 단어 실력!", "하늘 높이 모험 중이에요",
  "전설 너머의 몬스터예요", "은하만큼 단어가 넓어졌어요", "빛나는 실력이 뜨거워요",
  "우주 끝까지 수집해요", "끝없는 도전을 이어가요", "도감의 진짜 주인이에요"
];
const MONSTER_CATALOG = Array.from({ length: MONSTER_CATALOG_SIZE }, (_, index) => {
  const tier = Math.floor(index / MONSTER_BASE_NAMES.length);
  return {
    id: `monster_${String(index + 1).padStart(3, "0")}`,
    number: index + 1,
    min: getMonsterRequiredXp(index),
    emoji: MONSTER_EMOJIS[index % MONSTER_EMOJIS.length],
    name: `${MONSTER_TIERS[tier]} ${MONSTER_BASE_NAMES[index % MONSTER_BASE_NAMES.length]}`,
    message: MONSTER_MESSAGES[tier],
    tone: `tone-${(tier % 5) + 1}`
  };
});

function getMonsterRequiredXp(index) {
  if (index < LEGACY_MONSTER_COUNT) return index * LEGACY_MONSTER_XP_STEP;

  let xp = (LEGACY_MONSTER_COUNT - 1) * LEGACY_MONSTER_XP_STEP;
  for (let current = LEGACY_MONSTER_COUNT; current <= index; current += 1) {
    const expandedTier = Math.floor((current - LEGACY_MONSTER_COUNT) / EXPANDED_MONSTER_TIER_SIZE);
    xp += EXPANDED_MONSTER_START_GAP + (expandedTier * EXPANDED_MONSTER_GAP_INCREASE);
  }
  return xp;
}

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const dom = {
  screens: {
    home: $("#homeScreen"),
    card: $("#cardScreen"),
    game: $("#gameScreen"),
    rank: $("#rankScreen"),
    collection: $("#collectionScreen"),
    manage: $("#manageScreen")
  },
  syncStatus: $("#syncStatus"),
  scorePill: $("#scorePill"),
  coinPill: $("#coinPill"),
  comboPill: $("#comboPill"),
  petEmoji: $("#petEmoji"),
  petName: $("#petName"),
  petMsg: $("#petMsg"),
  xpFill: $("#xpFill"),
  levelText: $("#levelText"),
  nextXpText: $("#nextXpText"),
  homeMonsterCount: $("#homeMonsterCount"),
  monsterCount: $("#monsterCount"),
  collectionHero: $("#collectionHero"),
  monsterGrid: $("#monsterGrid"),
  categoryStrip: $("#categoryStrip"),
  cardCategory: $("#cardCategory"),
  gameCategory: $("#gameCategory"),
  listCategory: $("#listCategory"),
  wordCategoryInput: $("#wordCategoryInput"),
  bulkCategoryInput: $("#bulkCategoryInput"),
  bulkTextInput: $("#bulkTextInput"),
  cardEmoji: $("#cardEmoji"),
  cardWord: $("#cardWord"),
  cardMeaning: $("#cardMeaning"),
  cardCategoryName: $("#cardCategoryName"),
  gameBox: $("#gameBox"),
  feedback: $("#feedback"),
  roundProgress: $("#roundProgress"),
  roundCorrect: $("#roundCorrect"),
  roundBonus: $("#roundBonus"),
  wordList: $("#wordList"),
  rankingList: $("#rankingList"),
  myNameRank: $("#myNameRank"),
  myScoreRank: $("#myScoreRank"),
  toast: $("#toast"),
  fxLayer: $("#fxLayer"),
  soundToggle: $("#soundToggle"),
  profileBtn: $("#profileBtn"),
  wordDialog: $("#wordDialog"),
  bulkDialog: $("#bulkDialog"),
  catDialog: $("#catDialog"),
  profileDialog: $("#profileDialog"),
  manageLockDialog: $("#manageLockDialog"),
  wordInput: $("#wordInput"),
  meaningInput: $("#meaningInput"),
  emojiInput: $("#emojiInput"),
  catNameInput: $("#catNameInput"),
  catEmojiInput: $("#catEmojiInput"),
  playerNameInput: $("#playerNameInput"),
  managePasswordInput: $("#managePasswordInput"),
  managePasswordError: $("#managePasswordError"),
  importFile: $("#importFile")
};

let state = {
  categories: [],
  words: [],
  player: {
    name: "Player",
    score: 0,
    coin: 0,
    xp: 0,
    combo: 0,
    bestCombo: 0,
    sound: true,
    progress: {},
    knownCards: {}
  },
  selectedCategoryId: "all",
  screen: "home",
  cardIndex: 0,
  cardLocked: false,
  gameMode: "choice",
  currentWord: null,
  questionLocked: false,
  answerTiles: [],
  bankTiles: [],
  manageUnlocked: false,
  round: {
    active: false,
    completed: false,
    index: 0,
    correct: 0,
    questions: []
  },
  firebaseReady: false,
  firebaseUser: null
};

let firebase = {
  app: null,
  auth: null,
  db: null,
  classId: window.HEATHER_CLASS_ID || "heather-main",
  unsubWords: null,
  unsubCategories: null,
  unsubPlayer: null
};

let audioContext = null;
let nextTimer = null;

init();

async function init() {
  setupViewport();
  bindEvents();

  await loadDefaultWords();
  loadLocalState();
  render();

  await initFirebaseIfEnabled();

  if (state.firebaseReady) {
    try {
      await seedDefaultDataIfEmpty();
      subscribeFirebase();
    } catch (error) {
      markSyncFailure(error);
      state.firebaseReady = false;
    }
  }

  newQuestion();
}

function setupViewport() {
  const setVh = () => {
    const height = window.visualViewport?.height || window.innerHeight;
    document.documentElement.style.setProperty("--vh", `${height}px`);
  };

  setVh();

  window.visualViewport?.addEventListener("resize", setVh);
  window.addEventListener("resize", setVh);

  document.addEventListener("focusin", (event) => {
    if (event.target.matches("input, textarea")) {
      document.body.classList.add("keyboard-open");
      setTimeout(() => event.target.scrollIntoView({ block: "center", behavior: "smooth" }), 80);
    }
  });

  document.addEventListener("focusout", () => {
    setTimeout(() => document.body.classList.remove("keyboard-open"), 120);
  });
}

async function loadDefaultWords() {
  state.categories = [DEFAULT_CATEGORY, CUSTOM_CATEGORY];
  state.words = [];

  try {
    const response = await fetch("./words.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`words.json: ${response.status}`);
    const data = await response.json();
    const categories = Array.isArray(data.categories) ? data.categories : [];
    const words = Array.isArray(data.words) ? data.words : [];

    mergeCategories(categories.map((category) => ({ ...category, base: true })));
    mergeWords(words.map((word, index) => ({
      id: makeWordId(word.word, word.categoryId, index),
      word: word.word,
      meaning: word.meaning,
      emoji: word.emoji,
      categoryId: word.categoryId || CUSTOM_CATEGORY.id,
      base: true
    })));
  } catch (error) {
    console.error("기본 단어장을 불러오지 못했습니다.", error);
  }
}

function loadLocalState() {
  const saved = safeJson(localStorage.getItem(LOCAL_KEY), {}) || {};
  state.player = normalizePlayer({ ...state.player, ...(saved.player || {}) });
  state.selectedCategoryId = saved.selectedCategoryId || "all";

  const localCategories = Array.isArray(saved.categories) ? saved.categories : [];
  const localWords = Array.isArray(saved.words) ? saved.words : [];

  mergeCategories(localCategories);
  mergeWords(localWords);

  if (!state.player.name || state.player.name === "Player") {
    const nick = localStorage.getItem("heather_player_name");
    if (nick) state.player.name = limitText(nick, MAX_PLAYER_NAME_LENGTH) || "Player";
  }
}

function saveLocal() {
  localStorage.setItem(LOCAL_KEY, JSON.stringify({
    player: state.player,
    selectedCategoryId: state.selectedCategoryId,
    categories: state.categories.filter((category) => !category.base && category.id !== "all"),
    words: state.words.filter((word) => !word.base)
  }));
}

async function initFirebaseIfEnabled() {
  const localModeRequested = new URLSearchParams(window.location.search).get("mode") === "local";

  if (!window.HEATHER_USE_FIREBASE || localModeRequested) {
    dom.syncStatus.textContent = "LOCAL 모드";
    return;
  }

  try {
    firebase.app = initializeApp(window.HEATHER_FIREBASE_CONFIG);
    firebase.auth = getAuth(firebase.app);
    firebase.db = getFirestore(firebase.app);

    await signInAnonymously(firebase.auth);

    await new Promise((resolve) => {
      onAuthStateChanged(firebase.auth, (user) => {
        if (user) {
          state.firebaseUser = user;
          state.firebaseReady = true;
          resolve();
        }
      });
    });

    dom.syncStatus.textContent = "Firebase 연결됨";
  } catch (error) {
    console.error(error);
    dom.syncStatus.textContent = "Firebase 실패 · LOCAL";
    state.firebaseReady = false;
  }
}

async function seedDefaultDataIfEmpty() {
  const wordsRef = collection(firebase.db, "classes", firebase.classId, "words");
  const snap = await getDocs(query(wordsRef, limit(1)));

  if (!snap.empty) return;
  if (!state.words.length) return;

  const batch = writeBatch(firebase.db);

  for (const category of state.categories.filter((item) => item.id !== "all")) {
    batch.set(doc(firebase.db, "classes", firebase.classId, "categories", category.id), {
      name: category.name,
      emoji: category.emoji,
      base: Boolean(category.base),
      createdAt: serverTimestamp()
    });
  }

  for (const word of state.words) {
    batch.set(doc(firebase.db, "classes", firebase.classId, "words", word.id), {
      word: word.word,
      meaning: word.meaning,
      emoji: word.emoji,
      categoryId: word.categoryId,
      createdAt: serverTimestamp(),
      createdBy: state.firebaseUser.uid
    });
  }

  await batch.commit();
}

function subscribeFirebase() {
  const wordsRef = collection(firebase.db, "classes", firebase.classId, "words");
  const categoriesRef = collection(firebase.db, "classes", firebase.classId, "categories");
  const playerRef = doc(firebase.db, "classes", firebase.classId, "players", state.firebaseUser.uid);

  firebase.unsubWords = onSnapshot(wordsRef, (snapshot) => {
    const remoteWords = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
      base: false
    }));

    state.words = [];
    mergeWords(remoteWords);
    render();
    if (state.screen === "game") startRound();
    else if (!state.currentWord) newQuestion();
  }, markSyncFailure);

  firebase.unsubCategories = onSnapshot(categoriesRef, (snapshot) => {
    const remoteCategories = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data()
    }));

    state.categories = [DEFAULT_CATEGORY, CUSTOM_CATEGORY];
    mergeCategories(remoteCategories);
    render();
  }, markSyncFailure);

  firebase.unsubPlayer = onSnapshot(playerRef, (snapshot) => {
    if (snapshot.exists()) {
      state.player = normalizePlayer({ ...state.player, ...snapshot.data() });
      saveLocal();
      render();
    } else {
      syncPlayer();
    }
  }, markSyncFailure);

  syncPlayer();
  loadRanking();
}

function syncPlayer() {
  saveLocal();

  if (!state.firebaseReady) return;

  const ref = doc(firebase.db, "classes", firebase.classId, "players", state.firebaseUser.uid);
  setDoc(ref, {
    name: state.player.name || "Player",
    score: Number(state.player.score || 0),
    coin: Number(state.player.coin || 0),
    xp: Number(state.player.xp || 0),
    combo: Number(state.player.combo || 0),
    bestCombo: Number(state.player.bestCombo || 0),
    knownCards: state.player.knownCards || {},
    updatedAt: serverTimestamp()
  }, { merge: true }).catch(markSyncFailure);
}

function markSyncFailure(error) {
  console.error(error);
  dom.syncStatus.textContent = "동기화 실패 · 기기 저장됨";
}

function bindEvents() {
  $$("[data-nav]").forEach((button) => {
    button.addEventListener("click", () => navigate(button.dataset.nav));
  });

  $("#gameBackBtn").addEventListener("click", handleGameBack);

  $$(".mode-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.gameMode = button.dataset.mode;
      startRound(state.gameMode);
    });
  });

  $("#newQuestionBtn").addEventListener("click", startRound);
  $("#cardSpeakBtn").addEventListener("click", () => speak(currentCardWord()?.word));
  $("#prevCardBtn").addEventListener("click", () => moveCard(-1));
  $("#nextCardBtn").addEventListener("click", () => moveCard(1));
  $("#knowBtn").addEventListener("click", awardCurrentCard);
  $("#hardBtn").addEventListener("click", markCurrentCardHard);

  dom.cardCategory.addEventListener("change", () => selectCategory(dom.cardCategory.value));
  dom.gameCategory.addEventListener("change", () => {
    selectCategory(dom.gameCategory.value);
    startRound();
  });
  dom.listCategory.addEventListener("change", () => selectCategory(dom.listCategory.value));

  $("#addWordBtn").addEventListener("click", () => openWordDialog());
  $("#bulkAddBtn").addEventListener("click", openBulkDialog);
  $("#addCatBtn").addEventListener("click", () => dom.catDialog.showModal());
  $("#deleteCatBtn").addEventListener("click", deleteSelectedCategory);
  $("#closeWordDialog").addEventListener("click", () => dom.wordDialog.close());
  $("#closeBulkDialog").addEventListener("click", () => dom.bulkDialog.close());
  $("#closeCatDialog").addEventListener("click", () => dom.catDialog.close());
  $("#saveWordBtn").addEventListener("click", saveWordFromDialog);
  $("#saveBulkBtn").addEventListener("click", saveBulkWordsFromDialog);
  $("#saveCatBtn").addEventListener("click", saveCategoryFromDialog);

  dom.profileBtn.addEventListener("click", () => {
    dom.playerNameInput.value = state.player.name || "";
    dom.profileDialog.showModal();
    setTimeout(() => dom.playerNameInput.focus(), 80);
  });
  $("#closeProfileDialog").addEventListener("click", () => dom.profileDialog.close());
  $("#saveProfileBtn").addEventListener("click", saveProfile);
  $("#closeManageLockDialog").addEventListener("click", () => dom.manageLockDialog.close());
  $("#unlockManageBtn").addEventListener("click", unlockManageScreen);
  dom.managePasswordInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") unlockManageScreen();
  });

  $("#exportBtn").addEventListener("click", exportData);
  $("#importBtn").addEventListener("click", () => dom.importFile.click());
  dom.importFile.addEventListener("change", importData);

  $("#syncBtn").addEventListener("click", () => {
    syncPlayer();
    loadRanking();
    showToast("동기화", state.firebaseReady ? "Firebase에 저장했어요" : "LOCAL 모드예요");
  });

  $("#refreshRankBtn").addEventListener("click", loadRanking);

  dom.soundToggle.addEventListener("click", () => {
    state.player.sound = !state.player.sound;
    render();
    syncPlayer();
  });

  dom.petEmoji.addEventListener("click", petReaction);

  document.addEventListener("click", (event) => {
    if (event.target.closest("button")) playSfx("click");
  }, { capture: true });
}

function handleGameBack() {
  navigate("home");
}

function navigate(screen) {
  if (screen === "manage" && !state.manageUnlocked) {
    openManageLock();
    return;
  }

  state.screen = screen;
  Object.entries(dom.screens).forEach(([key, el]) => {
    el.classList.toggle("active", key === screen);
  });

  updateTypingModeClass();

  if (screen === "rank") loadRanking();
  if (screen === "game") startRound(state.gameMode);
  render();
}

function openManageLock() {
  dom.managePasswordInput.value = "";
  dom.managePasswordError.textContent = "";
  dom.manageLockDialog.showModal();
  setTimeout(() => dom.managePasswordInput.focus(), 80);
}

function unlockManageScreen() {
  if (dom.managePasswordInput.value !== MANAGE_PASSWORD) {
    dom.managePasswordError.textContent = "비밀번호가 맞지 않아요.";
    dom.managePasswordInput.value = "";
    dom.managePasswordInput.focus();
    playSfx("bad");
    return;
  }

  state.manageUnlocked = true;
  dom.manageLockDialog.close();
  showToast("관리 잠금 해제", "이 기기의 현재 탭에서 편집할 수 있어요");
  navigate("manage");
}

function selectCategory(categoryId) {
  state.selectedCategoryId = categoryId;
  state.cardIndex = 0;
  saveLocal();
  render();
}

function mergeCategories(categories) {
  const map = new Map(state.categories.map((category) => [category.id, category]));
  const merged = [];
  for (const category of categories) {
    const id = String(category?.id || "");
    if (!id || id === "all" || id.includes("/")) continue;
    const normalized = {
      id,
      name: limitText(category.name, MAX_CATEGORY_NAME_LENGTH) || "새 카테고리",
      emoji: limitText(category.emoji, 4) || "🗂️",
      base: id === CUSTOM_CATEGORY.id || Boolean(category.base)
    };
    map.set(id, normalized);
    merged.push(normalized);
  }
  state.categories = [...map.values()];
  return merged;
}

function mergeWords(words) {
  const map = new Map(state.words.map((word) => [word.id, word]));
  const merged = [];
  for (const word of words) {
    const cleaned = cleanWord(word?.word);
    if (!cleaned) continue;
    const requestedCategoryId = String(word.categoryId || "");
    const categoryId = requestedCategoryId && !requestedCategoryId.includes("/")
      ? requestedCategoryId
      : CUSTOM_CATEGORY.id;
    const requestedId = String(word.id || "");
    const id = requestedId && !requestedId.includes("/")
      ? requestedId
      : makeWordId(cleaned, categoryId);
    const normalized = {
      id,
      word: cleaned,
      meaning: limitText(word.meaning, MAX_MEANING_LENGTH),
      emoji: limitText(word.emoji, 4) || "📘",
      categoryId,
      base: Boolean(word.base)
    };
    map.set(id, normalized);
    merged.push(normalized);
  }
  state.words = [...map.values()].sort((a, b) => a.word.localeCompare(b.word));
  return merged;
}

function categoryOptions(includeAll = true) {
  return state.categories
    .filter((category) => includeAll || category.id !== "all")
    .map((category) => `<option value="${escapeHtml(category.id)}">${escapeHtml(category.emoji)} ${escapeHtml(category.name)}</option>`)
    .join("");
}

function render() {
  if (!state.categories.some((category) => category.id === state.selectedCategoryId)) {
    state.selectedCategoryId = "all";
  }

  dom.scorePill.textContent = `⭐ ${state.player.score || 0}`;
  dom.coinPill.textContent = `🍪 ${state.player.coin || 0}`;
  dom.comboPill.textContent = `🔥 ${state.player.combo || 0}`;
  dom.soundToggle.textContent = state.player.sound ? "🔊 ON" : "🔇 OFF";
  renderProfileButton();

  const pet = getCurrentMonster();
  dom.petEmoji.textContent = pet.emoji;
  dom.petName.textContent = pet.name;
  dom.petMsg.textContent = pet.message;
  dom.xpFill.style.width = `${pet.percent}%`;
  dom.levelText.textContent = `수집 ${pet.unlockedCount} / ${MONSTER_CATALOG.length}`;
  dom.nextXpText.textContent = pet.complete ? "도감 완성!" : `다음까지 ${pet.remaining}XP`;
  dom.homeMonsterCount.textContent = `${pet.unlockedCount} / ${MONSTER_CATALOG.length}`;

  renderCategories();
  renderSelects();
  renderCard();
  renderWordList();
  renderCollection();
  renderRoundProgress();
}

function renderProfileButton() {
  if (!dom.profileBtn) return;

  const name = String(state.player.name || "").trim();
  const hasName = name && name !== "Player";

  dom.profileBtn.classList.toggle("need-name", !hasName);
  dom.profileBtn.textContent = hasName ? `👤 ${name}` : "👤 이름 입력!";
  dom.profileBtn.title = hasName ? `현재 이름: ${name}` : "랭킹에 표시할 이름을 입력해 주세요";
}

function renderCategories() {
  dom.categoryStrip.innerHTML = state.categories.map((category) => {
    const count = category.id === "all"
      ? state.words.length
      : state.words.filter((word) => word.categoryId === category.id).length;

    return `
      <button class="cat-btn ${state.selectedCategoryId === category.id ? "active" : ""}" data-cat="${escapeHtml(category.id)}">
        ${escapeHtml(category.emoji)} ${escapeHtml(category.name)} ${count}
      </button>
    `;
  }).join("");

  dom.categoryStrip.querySelectorAll("[data-cat]").forEach((button) => {
    button.addEventListener("click", () => {
      selectCategory(button.dataset.cat);
      if (state.screen === "game") startRound();
    });
  });
}

function renderSelects() {
  const includeAll = categoryOptions(true);
  const noAll = categoryOptions(false);

  [dom.cardCategory, dom.gameCategory, dom.listCategory].forEach((select) => {
    select.innerHTML = includeAll;
    select.value = state.selectedCategoryId;
  });

  dom.wordCategoryInput.innerHTML = noAll;
  dom.bulkCategoryInput.innerHTML = noAll;
  if (!dom.wordCategoryInput.value) dom.wordCategoryInput.value = CUSTOM_CATEGORY.id;
  if (!dom.bulkCategoryInput.value) dom.bulkCategoryInput.value = CUSTOM_CATEGORY.id;
}

function renderCard() {
  const word = currentCardWord();
  [$("#cardSpeakBtn"), $("#prevCardBtn"), $("#nextCardBtn"), $("#knowBtn"), $("#hardBtn")].forEach((button) => {
    if (button) button.disabled = !word;
  });

  if (!word) {
    dom.cardEmoji.textContent = "📭";
    dom.cardWord.textContent = "단어 없음";
    dom.cardWord.style.fontSize = "";
    dom.cardWord.classList.remove("long-word");
    dom.cardMeaning.textContent = "관리 화면에서 단어를 추가해 주세요";
    dom.cardCategoryName.textContent = getCategoryLabel(state.selectedCategoryId);
    return;
  }

  dom.cardEmoji.textContent = word.emoji || "📘";
  dom.cardWord.textContent = word.word;
  dom.cardWord.style.fontSize = getWordFontSize(word.word, 68, 24);
  dom.cardWord.classList.toggle("long-word", word.word.length >= 11);
  dom.cardMeaning.textContent = word.meaning || "뜻 입력";
  dom.cardCategoryName.textContent = getCategoryLabel(word.categoryId);

  const alreadyKnown = Boolean(state.player.knownCards?.[word.id]);
  const knowButton = $("#knowBtn");
  if (knowButton) {
    knowButton.textContent = alreadyKnown ? "✅ 완료 · 다음" : `알아요 +${SCORE_REWARDS.card}`;
    knowButton.classList.toggle("good", !alreadyKnown);
  }
}

function renderWordList() {
  const list = filteredWords().slice(0, MAX_LIST_ROWS); // 관리 화면은 CSS 내부 스크롤로 전체 관리

  if (!list.length) {
    dom.wordList.innerHTML = `<div class="hint">이 카테고리에 단어가 없어요.</div>`;
    return;
  }

  dom.wordList.innerHTML = list.map((word) => `
    <div class="word-row">
      <div style="font-size:30px">${escapeHtml(word.emoji || "📘")}</div>
      <div>
        <b>${escapeHtml(word.word)}</b>
        <small>${escapeHtml(word.meaning || "뜻 입력")} · ${escapeHtml(getCategoryLabel(word.categoryId))}</small>
      </div>
      <button class="delete-btn" data-delete="${escapeHtml(word.id)}">삭제</button>
    </div>
  `).join("");

  dom.wordList.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => deleteWord(button.dataset.delete));
  });
}

function filteredWords() {
  if (state.selectedCategoryId === "all") return state.words;
  return state.words.filter((word) => word.categoryId === state.selectedCategoryId);
}

function currentCardWord() {
  const list = filteredWords();
  if (!list.length) return null;
  return list[state.cardIndex % list.length];
}

function moveCard(delta) {
  const list = filteredWords();
  if (!list.length) return;
  state.cardIndex = (state.cardIndex + delta + list.length) % list.length;
  renderCard();
}

function newQuestion() {
  clearTimeout(nextTimer);
  updateTypingModeClass();
  dom.feedback.textContent = "";
  dom.feedback.className = "feedback";
  dom.gameBox.className = `game-box ${isTypingMode() ? "typing-game" : ""}`;

  if (state.round.active) {
    const question = state.round.questions[state.round.index];
    state.gameMode = question.mode;
    state.currentWord = question.word;
  } else {
    state.currentWord = pickQuestionWord();
  }
  state.questionLocked = false;
  state.answerTiles = [];
  state.bankTiles = [];
  updateTypingModeClass();
  dom.gameBox.className = `game-box ${isTypingMode() ? "typing-game" : ""}`;
  renderRoundProgress();

  if (!state.currentWord) {
    renderEmptyGame();
    return;
  }

  state.bankTiles = shuffle(spellingLetters(state.currentWord.word).split("").map((char, index) => ({ char, index })));

  if (state.gameMode === "choice") renderChoiceGame();
  if (state.gameMode === "block") renderBlockGame();
  if (state.gameMode === "blank") renderBlankGame();
  if (state.gameMode === "type") renderTypeGame();
}

function startRound(mode = state.gameMode) {
  clearTimeout(nextTimer);
  const source = filteredWords();
  const roundMode = MODE_ROUNDS[mode] ? mode : "choice";
  const config = MODE_ROUNDS[roundMode];

  state.round = {
    active: source.length > 0,
    completed: false,
    index: 0,
    correct: 0,
    questions: source.length ? buildRoundQuestions(source, roundMode) : []
  };
  state.gameMode = roundMode;
  state.currentWord = null;
  state.questionLocked = false;
  updateTypingModeClass();

  if (!source.length) {
    dom.feedback.textContent = "";
    renderRoundProgress();
    renderEmptyGame();
    return;
  }

  showToast(`${config.label} 도전`, `${config.count}문제 · 완주 보너스 +${config.bonus}`);
  newQuestion();
}

function buildRoundQuestions(source, mode) {
  const count = MODE_ROUNDS[mode].count;
  let pool = [];
  return Array.from({ length: count }, () => {
    if (!pool.length) pool = shuffle([...source]);
    return { mode, word: pool.pop() };
  });
}

function advanceRound() {
  if (!state.round.active) {
    newQuestion();
    return;
  }

  state.round.index += 1;
  if (state.round.index >= state.round.questions.length) {
    completeRound();
    return;
  }

  newQuestion();
}

function completeRound() {
  clearTimeout(nextTimer);
  const config = MODE_ROUNDS[state.gameMode];
  state.round.active = false;
  state.round.completed = true;
  state.currentWord = null;
  state.questionLocked = true;
  updateTypingModeClass();

  state.player.score += config.bonus;
  state.player.coin += Math.ceil(config.bonus / 5);
  state.player.xp += config.bonus;
  successFx(config.bonus);
  syncPlayer();
  render();

  dom.feedback.textContent = `${config.label} 완주 보너스 +${config.bonus} 획득!`;
  dom.feedback.className = "feedback good";
  dom.gameBox.className = "game-box";
  dom.gameBox.innerHTML = `
    <div class="round-complete">
      <span>🏅</span>
      <h3>${config.label} 완주!</h3>
      <p>정답 ${state.round.correct} / ${config.count}</p>
      <strong>보너스 +${config.bonus} XP</strong>
      <button id="restartRoundBtn" class="soft-btn good">${config.label} 다시 도전</button>
    </div>
  `;
  $("#restartRoundBtn").addEventListener("click", startRound);
}

function renderRoundProgress() {
  if (!dom.roundProgress) return;

  const config = MODE_ROUNDS[state.gameMode];
  const answered = state.round.completed ? config.count : state.round.index;
  const current = state.round.active ? Math.min(config.count, state.round.index + 1) : 0;
  dom.roundProgress.textContent = state.round.completed
    ? `${config.label} COMPLETE`
    : state.round.active
      ? `${config.label} ${current} / ${config.count}`
      : `${config.label} 0 / ${config.count}`;
  dom.roundCorrect.textContent = `정답 ${state.round.correct || 0}`;
  dom.roundBonus.textContent = `완주 +${config.bonus}`;

  Object.entries(MODE_ROUNDS).forEach(([mode, stage]) => {
    const selected = mode === state.gameMode;
    const done = selected ? answered : 0;
    const element = $(`#modeProgress${mode[0].toUpperCase()}${mode.slice(1)}`);
    if (element) element.textContent = `${done}/${stage.count} · +${SCORE_REWARDS[mode]}`;
    const button = $(`.mode-btn[data-mode="${mode}"]`);
    if (button) {
      button.classList.toggle("active", selected);
      button.classList.toggle("done", selected && state.round.completed);
    }
  });
}

function pickQuestionWord() {
  const source = filteredWords();
  if (!source.length) return null;
  return source[Math.floor(Math.random() * source.length)];
}

function isTypingMode() {
  return state.screen === "game" && state.round.active && (state.gameMode === "blank" || state.gameMode === "type");
}

function updateTypingModeClass() {
  document.body.classList.toggle("typing-mode", isTypingMode());
}

function questionHeader(showWord = false) {
  const word = state.currentWord;
  return `
    <div class="question-top">
      <div class="question-emoji">${escapeHtml(word.emoji || "📘")}</div>
      <div class="question-meaning">${escapeHtml(word.meaning || "뜻 입력")}</div>
      ${showWord ? `<div class="question-word">${escapeHtml(word.word)}</div>` : ""}
      <div class="tag">${escapeHtml(getCategoryLabel(word.categoryId))}</div>
    </div>
  `;
}

function renderEmptyGame() {
  dom.gameBox.innerHTML = `
    <div class="empty-game">
      <strong>이 카테고리에 단어가 없어요</strong>
      <span>단어를 추가하면 바로 게임을 시작할 수 있어요.</span>
      <button id="emptyAddWordBtn" class="soft-btn good">단어 추가하기</button>
    </div>
  `;

  $("#emptyAddWordBtn").addEventListener("click", () => {
    navigate("manage");
  });
}

function renderChoiceGame() {
  const distractors = uniqueWordsBySpelling(
    state.words.filter((word) => word.word !== state.currentWord.word)
  );
  const options = shuffle([
    state.currentWord,
    ...shuffle(distractors).slice(0, 3)
  ]);

  dom.gameBox.innerHTML = `
    ${questionHeader()}
    <div class="choices">
      ${options.map((word) => `<button class="choice" data-word-id="${escapeHtml(word.id)}">${escapeHtml(word.word)}</button>`).join("")}
    </div>
    <button id="skipQuestionBtn" class="soft-btn skip">몰라요 · 다음 →</button>
  `;

  dom.gameBox.querySelectorAll("[data-word-id]").forEach((button) => {
    button.addEventListener("click", () => checkAnswer(button.dataset.wordId === state.currentWord.id, SCORE_REWARDS.choice));
  });

  $("#skipQuestionBtn").addEventListener("click", skipQuestion);
}

function renderBlockGame() {
  dom.gameBox.innerHTML = `
    ${questionHeader()}
    <div id="answerBank" class="bank answer-bank"></div>
    <div id="letterBank" class="bank"></div>
    <div class="screen-row game-actions">
      <button id="clearTilesBtn" class="soft-btn">지우기</button>
      <button id="skipQuestionBtn" class="soft-btn skip">몰라요 · 다음</button>
      <button id="checkTilesBtn" class="soft-btn good">확인 +${SCORE_REWARDS.block}</button>
    </div>
  `;

  drawTiles();

  $("#clearTilesBtn").addEventListener("click", () => {
    state.answerTiles = [];
    state.bankTiles = shuffle(spellingLetters(state.currentWord.word).split("").map((char, index) => ({ char, index })));
    drawTiles();
  });

  $("#skipQuestionBtn").addEventListener("click", skipQuestion);

  $("#checkTilesBtn").addEventListener("click", () => {
    const answer = state.answerTiles.map((tile) => tile.char).join("");
    checkAnswer(answer === spellingLetters(state.currentWord.word), SCORE_REWARDS.block);
  });
}

function drawTiles() {
  $("#answerBank").innerHTML = state.answerTiles
    .map((tile, index) => `<button class="tile" data-answer-index="${index}">${tile.char}</button>`)
    .join("");

  $("#letterBank").innerHTML = state.bankTiles
    .map((tile, index) => `<button class="tile" data-bank-index="${index}">${tile.char}</button>`)
    .join("");

  $$("[data-bank-index]").forEach((button) => {
    button.addEventListener("click", () => {
      state.answerTiles.push(state.bankTiles.splice(Number(button.dataset.bankIndex), 1)[0]);
      drawTiles();
    });
  });

  $$("[data-answer-index]").forEach((button) => {
    button.addEventListener("click", () => {
      state.bankTiles.push(state.answerTiles.splice(Number(button.dataset.answerIndex), 1)[0]);
      drawTiles();
    });
  });
}

function renderBlankGame() {
  const target = spellingLetters(state.currentWord.word);
  const masked = target
    .split("")
    .map((char, index) => (index % 2 === 0 ? char : "_"))
    .join(" ");

  dom.gameBox.innerHTML = `
    <div class="question-top compact-question">
      <div class="question-meaning">${escapeHtml(state.currentWord.meaning || "뜻 입력")} ${escapeHtml(state.currentWord.emoji || "")}</div>
      <div class="tag">${escapeHtml(getCategoryLabel(state.currentWord.categoryId))}</div>
    </div>
    <div class="question-word long-fit" style="font-size:${getWordFontSize(state.currentWord.word, 56, 24)}">${masked}</div>
    <input id="answerInput" class="type-input" aria-label="정답 입력" maxlength="${MAX_WORD_LENGTH}" placeholder="영어 단어" autocomplete="off" autocapitalize="none" spellcheck="false" inputmode="text" lang="en" />
    <div class="screen-row game-actions">
      <button id="skipQuestionBtn" class="soft-btn skip">몰라요 · 다음</button>
      <button id="checkInputBtn" class="soft-btn good">확인 +${SCORE_REWARDS.blank}</button>
    </div>
  `;

  const input = $("#answerInput");
  const check = () => checkAnswer(normalizeAnswer(input.value) === normalizeAnswer(state.currentWord.word), SCORE_REWARDS.blank);
  $("#skipQuestionBtn").addEventListener("click", skipQuestion);
  $("#checkInputBtn").addEventListener("click", check);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") check();
  });
  input.addEventListener("focus", () => document.body.classList.add("keyboard-open"));
  input.addEventListener("blur", () => setTimeout(() => document.body.classList.remove("keyboard-open"), 120));
}

function renderTypeGame() {
  dom.gameBox.innerHTML = `
    <div class="question-top compact-question">
      <button id="speakQuestionBtn" class="soft-btn">🔊 다시 듣기</button>
      <div class="question-meaning">${escapeHtml(state.currentWord.meaning || "")} ${escapeHtml(state.currentWord.emoji || "")}</div>
      <div class="tag">${escapeHtml(getCategoryLabel(state.currentWord.categoryId))}</div>
    </div>
    <input id="answerInput" class="type-input" aria-label="정답 입력" maxlength="${MAX_WORD_LENGTH}" placeholder="영어 단어" autocomplete="off" autocapitalize="none" spellcheck="false" inputmode="text" lang="en" />
    <div class="screen-row game-actions">
      <button id="skipQuestionBtn" class="soft-btn skip">몰라요 · 다음</button>
      <button id="checkInputBtn" class="soft-btn good">확인 +${SCORE_REWARDS.type}</button>
    </div>
  `;

  $("#speakQuestionBtn").addEventListener("click", () => speak(state.currentWord.word));

  const input = $("#answerInput");
  const check = () => checkAnswer(normalizeAnswer(input.value) === normalizeAnswer(state.currentWord.word), SCORE_REWARDS.type);
  $("#skipQuestionBtn").addEventListener("click", skipQuestion);
  $("#checkInputBtn").addEventListener("click", check);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") check();
  });
  input.addEventListener("focus", () => document.body.classList.add("keyboard-open"));
  input.addEventListener("blur", () => setTimeout(() => document.body.classList.remove("keyboard-open"), 120));

  setTimeout(() => {
    speak(state.currentWord.word);
  }, 120);
}

function skipQuestion() {
  if (state.questionLocked) return;

  if (!state.currentWord) {
    newQuestion();
    return;
  }

  state.questionLocked = true;
  clearTimeout(nextTimer);
  state.player.combo = 0;

  const progress = state.player.progress[state.currentWord.id] || { correct: 0, wrong: 0, skip: 0 };
  progress.skip = (progress.skip || 0) + 1;
  state.player.progress[state.currentWord.id] = progress;

  playSfx("click");
  showToast("다음 문제", `정답은 ${state.currentWord.word}`);
  dom.feedback.textContent = `정답은 ${state.currentWord.word}`;
  dom.feedback.className = "feedback bad";
  syncPlayer();

  nextTimer = setTimeout(() => {
    advanceRound();
  }, 520);
}

function checkAnswer(isCorrect, points) {
  if (state.questionLocked || !state.currentWord) return;

  state.questionLocked = true;

  if (isCorrect) {
    if (state.round.active) state.round.correct += 1;
    award(points, state.currentWord);
    dom.feedback.textContent = `정답! ${state.currentWord.word} 🎉`;
    dom.feedback.className = "feedback good";

    clearTimeout(nextTimer);
    nextTimer = setTimeout(() => {
      advanceRound();
    }, NEXT_DELAY_MS);
    return;
  }

  markWrong(state.currentWord);
  dom.feedback.textContent = `아깝다! 정답은 ${state.currentWord.word}`;
  dom.feedback.className = "feedback bad";

  clearTimeout(nextTimer);
  nextTimer = setTimeout(() => {
    advanceRound();
  }, 950);
}

function award(points, word) {
  const bonus = (state.player.combo + 1) % 3 === 0 ? Math.max(1, Math.round(points * 0.2)) : 0;
  const total = points + bonus;

  state.player.combo += 1;
  state.player.bestCombo = Math.max(state.player.bestCombo || 0, state.player.combo);
  state.player.score += total;
  state.player.coin += Math.ceil(points / 5) + bonus;
  state.player.xp += total;

  if (word) {
    const progress = state.player.progress[word.id] || { correct: 0, wrong: 0 };
    progress.correct += 1;
    state.player.progress[word.id] = progress;
  }

  successFx(total, word);
  syncPlayer();
  render();
}

function markWrong(word) {
  state.player.combo = 0;

  if (word) {
    const progress = state.player.progress[word.id] || { correct: 0, wrong: 0 };
    progress.wrong += 1;
    state.player.progress[word.id] = progress;
  }

  playSfx("bad");
  speak(word.word);
  syncPlayer();
}

function getCurrentMonster() {
  const xp = Number(state.player.xp || 0);
  const unlockedCount = MONSTER_CATALOG.reduce(
    (count, monster) => (xp >= monster.min ? count + 1 : count),
    0
  );
  const monster = MONSTER_CATALOG[unlockedCount - 1];
  const next = MONSTER_CATALOG[unlockedCount];
  const percent = next
    ? Math.max(5, Math.min(100, ((xp - monster.min) / (next.min - monster.min)) * 100))
    : 100;

  return {
    ...monster,
    unlockedCount,
    percent,
    remaining: next ? Math.max(0, next.min - xp) : 0,
    complete: !next
  };
}

function renderCollection() {
  if (!dom.monsterGrid) return;

  const current = getCurrentMonster();
  dom.monsterCount.textContent = `${current.unlockedCount}/${MONSTER_CATALOG.length}`;
  dom.collectionHero.innerHTML = `
    <span class="collection-emoji">${escapeHtml(current.emoji)}</span>
    <div>
      <small>현재 파트너 · #${String(current.number).padStart(3, "0")}</small>
      <strong>${escapeHtml(current.name)}</strong>
      <p>${current.complete ? "도감 완성! 최고의 수집가예요." : `다음 몬스터까지 ${current.remaining} XP`}</p>
    </div>
  `;
  dom.monsterGrid.innerHTML = MONSTER_CATALOG.map((monster, index) => {
    const unlocked = index < current.unlockedCount;
    return `
      <article class="monster-tile ${unlocked ? `unlocked ${monster.tone}` : "locked"}">
        <span>${unlocked ? escapeHtml(monster.emoji) : "?"}</span>
        <b>#${String(monster.number).padStart(3, "0")}</b>
        <small>${unlocked ? escapeHtml(monster.name) : `${monster.min} XP`}</small>
      </article>
    `;
  }).join("");
}


function awardCurrentCard() {
  if (state.cardLocked) return;

  const word = currentCardWord();
  if (!word) return;

  state.cardLocked = true;
  state.player.knownCards ||= {};

  if (state.player.knownCards[word.id]) {
    showToast("이미 완료", "이 단어는 점수를 이미 받았어요");
    playSfx("click");

    setTimeout(() => {
      moveCard(1);
      state.cardLocked = false;
      renderCard();
    }, 360);
    return;
  }

  state.player.knownCards[word.id] = true;
  award(SCORE_REWARDS.card, word);

  setTimeout(() => {
    moveCard(1);
    state.cardLocked = false;
    renderCard();
  }, 420);
}

function markCurrentCardHard() {
  if (state.cardLocked) return;

  const word = currentCardWord();
  if (!word) return;

  state.cardLocked = true;
  markWrong(word);

  setTimeout(() => {
    moveCard(1);
    state.cardLocked = false;
  }, 420);
}

async function saveWordFromDialog() {
  const word = cleanWord(dom.wordInput.value);
  const meaning = limitText(dom.meaningInput.value, MAX_MEANING_LENGTH);
  const emoji = limitText(dom.emojiInput.value, 4) || "📘";
  const categoryId = selectedEditableCategory(dom.wordCategoryInput.value);

  if (!word) {
    showToast("단어 확인", "영어 단어를 입력해 주세요");
    return;
  }

  const existingWord = findWordInCategory(word, categoryId);
  const wordItem = {
    id: existingWord?.id || makeWordId(word, categoryId),
    word,
    meaning,
    emoji,
    categoryId,
    base: false
  };

  mergeWords([wordItem]);
  clearWordDialog();
  dom.wordDialog.close();

  await saveWordRemote(wordItem);
  syncPlayer();
  showToast(existingWord ? "단어 수정" : "단어 추가", `${word} 저장 완료`);
  render();
}

async function saveCategoryFromDialog() {
  const name = limitText(dom.catNameInput.value, MAX_CATEGORY_NAME_LENGTH);
  const emoji = limitText(dom.catEmojiInput.value, 4) || "🗂️";

  if (!name) {
    showToast("카테고리 확인", "이름을 입력해 주세요");
    return;
  }

  const category = {
    id: makeCategoryId(),
    name,
    emoji,
    base: false
  };

  mergeCategories([category]);
  state.selectedCategoryId = category.id;
  dom.catNameInput.value = "";
  dom.catEmojiInput.value = "";
  dom.catDialog.close();

  await saveCategoryRemote(category);
  showToast("카테고리 추가", `${emoji} ${name}`);
  render();
}


async function deleteSelectedCategory() {
  const categoryId = dom.listCategory.value || state.selectedCategoryId;
  const category = state.categories.find((item) => item.id === categoryId);

  if (!category || category.id === "all") {
    showToast("삭제 불가", "전체 카테고리는 삭제할 수 없어요");
    return;
  }

  if (category.base || category.id === CUSTOM_CATEGORY.id) {
    showToast("삭제 불가", "기본 카테고리는 삭제하지 않도록 했어요");
    return;
  }

  const wordsInCategory = state.words.filter((word) => word.categoryId === category.id);
  const message = wordsInCategory.length
    ? `${category.emoji} ${category.name} 삭제\n단어 ${wordsInCategory.length}개는 직접추가로 이동할까요?`
    : `${category.emoji} ${category.name} 카테고리를 삭제할까요?`;

  if (!confirm(message)) return;

  state.categories = state.categories.filter((item) => item.id !== category.id);
  state.words = state.words.map((word) => (
    word.categoryId === category.id
      ? { ...word, categoryId: "custom", base: false }
      : word
  ));

  state.selectedCategoryId = "all";
  saveLocal();

  if (state.firebaseReady) {
    try {
      await deleteDoc(doc(firebase.db, "classes", firebase.classId, "categories", category.id));

      for (const word of state.words.filter((item) => item.categoryId === "custom" && wordsInCategory.some((oldWord) => oldWord.id === item.id))) {
        await saveWordRemote(word);
      }
    } catch (error) {
      markSyncFailure(error);
    }
  }

  showToast("카테고리 삭제", "단어는 직접추가로 이동했어요");
  render();
}

async function deleteWord(wordId) {
  state.words = state.words.filter((word) => word.id !== wordId);
  saveLocal();

  if (state.firebaseReady) {
    try {
      await deleteDoc(doc(firebase.db, "classes", firebase.classId, "words", wordId));
    } catch (error) {
      markSyncFailure(error);
    }
  }

  showToast("삭제 완료", "단어를 삭제했어요");
  render();
  if (state.screen === "game") startRound();
}

async function saveWordRemote(word) {
  saveLocal();

  if (!state.firebaseReady) return;

  try {
    await setDoc(doc(firebase.db, "classes", firebase.classId, "words", word.id), {
      word: word.word,
      meaning: word.meaning,
      emoji: word.emoji,
      categoryId: word.categoryId,
      updatedAt: serverTimestamp(),
      updatedBy: state.firebaseUser.uid
    }, { merge: true });
  } catch (error) {
    markSyncFailure(error);
  }
}

async function saveCategoryRemote(category) {
  saveLocal();

  if (!state.firebaseReady) return;

  try {
    await setDoc(doc(firebase.db, "classes", firebase.classId, "categories", category.id), {
      name: category.name,
      emoji: category.emoji,
      base: Boolean(category.base),
      updatedAt: serverTimestamp(),
      updatedBy: state.firebaseUser.uid
    }, { merge: true });
  } catch (error) {
    markSyncFailure(error);
  }
}

function openBulkDialog() {
  dom.bulkTextInput.value = "";
  dom.bulkCategoryInput.value = selectedEditableCategory(state.selectedCategoryId);
  dom.bulkDialog.showModal();
}

async function saveBulkWordsFromDialog() {
  const categoryId = selectedEditableCategory(dom.bulkCategoryInput.value);
  const text = dom.bulkTextInput.value || "";
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    showToast("입력 확인", "추가할 단어를 붙여넣어 주세요");
    return;
  }

  const parsedRows = parseBulkWordText(lines);
  const parsed = [];
  const skipped = [];

  for (const row of parsedRows) {
    const words = splitWordAliases(row.word);
    const meaning = limitText(row.meaning, MAX_MEANING_LENGTH);

    if (!words.length || !meaning) {
      skipped.push(row.raw || `${row.word} / ${row.meaning}`);
      continue;
    }

    for (const word of words) {
      const wordItem = {
        id: makeWordId(word, categoryId),
        word,
        meaning,
        emoji: "📘",
        categoryId,
        base: false
      };

      const alreadyExists = Boolean(findWordInCategory(word, categoryId));
      const alreadyParsed = Boolean(findWordInCategory(word, categoryId, parsed));

      if (alreadyExists || alreadyParsed) {
        skipped.push(row.raw || `${word} / ${meaning}`);
        continue;
      }

      parsed.push(wordItem);
    }
  }

  if (!parsed.length) {
    showToast("추가 실패", "단어 줄 다음에 뜻 줄을 넣거나, 단어 / 뜻 형식으로 입력해 주세요");
    return;
  }

  mergeWords(parsed);
  saveLocal();

  if (state.firebaseReady) {
    for (const word of parsed) {
      await saveWordRemote(word);
    }
  }

  dom.bulkDialog.close();
  dom.bulkTextInput.value = "";
  showToast("일괄 추가 완료", `${parsed.length}개 추가 · ${skipped.length}개 제외`);
  render();
}

function parseBulkWordText(lines) {
  const rows = [];
  let i = 0;

  while (i < lines.length) {
    const current = lines[i].trim();
    const next = lines[i + 1]?.trim() || "";

    // 1) 한 줄 형식: apple / 사과, aunt / 이모 / 고모
    const slashRow = parseSlashRow(current);
    if (slashRow) {
      rows.push(slashRow);
      i += 1;
      continue;
    }

    // 2) 두 줄 형식:
    // grandparents
    // 조부모님
    if (looksLikeEnglishWordLine(current) && next && looksLikeMeaningLine(next)) {
      rows.push({
        word: current,
        meaning: next,
        raw: `${current} / ${next}`
      });
      i += 2;
      continue;
    }

    // 3) 탭/쉼표/콜론 형식도 허용: apple\t사과, apple,사과
    const looseRow = parseLooseRow(current);
    if (looseRow) {
      rows.push(looseRow);
      i += 1;
      continue;
    }

    i += 1;
  }

  return rows;
}

function parseSlashRow(line) {
  if (!line.includes("/")) return null;

  const parts = line.split("/").map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return null;

  const first = parts[0];
  const rest = parts.slice(1).join(" / ");

  // 오른쪽에 한글이 있는 경우에만 "단어 / 뜻"으로 본다.
  // mother / mom 처럼 영어만 있으면 다음 줄의 뜻과 묶는다.
  if (looksLikeEnglishWordLine(first) && hasKorean(rest)) {
    return {
      word: first,
      meaning: rest,
      raw: line
    };
  }

  return null;
}

function parseLooseRow(line) {
  const separators = ["\t", ",", "：", ":"];
  for (const sep of separators) {
    if (!line.includes(sep)) continue;

    const [left, ...rightParts] = line.split(sep);
    const right = rightParts.join(sep).trim();

    if (looksLikeEnglishWordLine(left) && looksLikeMeaningLine(right)) {
      return {
        word: left.trim(),
        meaning: right,
        raw: line
      };
    }
  }

  return null;
}

function splitWordAliases(rawWord) {
  return String(rawWord || "")
    .split("/")
    .map((word) => cleanWord(word))
    .filter(Boolean);
}

function hasKorean(value) {
  return /[가-힣]/.test(String(value || ""));
}

function looksLikeMeaningLine(value) {
  const text = String(value || "").trim();
  if (!text) return false;
  return hasKorean(text) || /[^\x00-\x7F]/.test(text);
}

function looksLikeEnglishWordLine(value) {
  const text = String(value || "").trim();
  if (!text) return false;
  // mother / mom, in-laws, class schedule 같은 영어 줄 허용
  return /^[A-Za-z][A-Za-z\s/'’.-]*$/.test(text);
}

function openWordDialog() {
  clearWordDialog();
  dom.wordCategoryInput.value = selectedEditableCategory(state.selectedCategoryId);
  dom.wordDialog.showModal();
}

function clearWordDialog() {
  dom.wordInput.value = "";
  dom.meaningInput.value = "";
  dom.emojiInput.value = "";
}

function saveProfile() {
  const name = limitText(dom.playerNameInput.value, MAX_PLAYER_NAME_LENGTH);
  if (!name) {
    showToast("이름 확인", "랭킹에 표시할 이름을 입력해 주세요");
    return;
  }
  state.player.name = name;
  localStorage.setItem("heather_player_name", name);
  dom.profileDialog.close();
  syncPlayer();
  showToast("이름 저장", name);
  render();
}

async function loadRanking() {
  dom.myNameRank.textContent = state.player.name || "Player";
  dom.myScoreRank.textContent = `${state.player.score || 0}점`;

  if (!state.firebaseReady) {
    dom.rankingList.innerHTML = `<div class="hint">Firebase를 연결하면 여러 휴대폰 랭킹이 표시돼요.</div>`;
    return;
  }

  const playersRef = collection(firebase.db, "classes", firebase.classId, "players");
  let snap;

  try {
    snap = await getDocs(query(playersRef, orderBy("score", "desc"), limit(10)));
  } catch (error) {
    markSyncFailure(error);
    dom.rankingList.innerHTML = `<div class="hint">랭킹을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</div>`;
    return;
  }

  dom.rankingList.innerHTML = snap.docs.map((item, index) => {
    const player = item.data();
    const name = limitText(player.name, MAX_PLAYER_NAME_LENGTH) || "Player";
    const score = safeCounter(player.score);
    const bestCombo = safeCounter(player.bestCombo);
    return `
      <div class="rank-row">
        <div style="font-size:28px">${index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "⭐"}</div>
        <div>
          <b>${escapeHtml(name)}</b>
          <small>베스트 콤보 ${bestCombo}</small>
        </div>
        <strong>${score}</strong>
      </div>
    `;
  }).join("");
}


function petReaction() {
  const reactions = [
    ["쓰담쓰담!", "스펠링몬이 기분 좋아졌어요 💜"],
    ["까르르!", "한 번 더 단어를 맞혀볼까요?"],
    ["반짝!", "오늘도 영어 에너지 충전 ✨"],
    ["냠냠!", "쿠키 생각이 나는 표정이에요 🍪"],
    ["파이팅!", "틀려도 다시 하면 강해져요 💪"]
  ];

  const [title, message] = reactions[Math.floor(Math.random() * reactions.length)];

  playSfx("level");
  showToast(title, message);
  document.body.classList.add("pet-reacting");
  heartBurst();

  setTimeout(() => {
    document.body.classList.remove("pet-reacting");
  }, 900);
}

function heartBurst() {
  const marks = ["💜", "⭐", "✨", "🍪", "🎈"];
  for (let i = 0; i < 14; i += 1) {
    const item = document.createElement("div");
    item.className = "pet-heart";
    item.textContent = marks[i % marks.length];
    item.style.left = `${42 + Math.random() * 16}vw`;
    item.style.top = `${28 + Math.random() * 12}vh`;
    item.style.animationDelay = `${Math.random() * 0.12}s`;
    dom.fxLayer.appendChild(item);
    setTimeout(() => item.remove(), 1100);
  }
}

function exportData() {
  const data = {
    categories: state.categories.filter((item) => item.id !== "all"),
    words: state.words,
    player: state.player
  };

  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  link.download = "heather-word-backup.json";
  link.click();
}

async function importData(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const data = safeJson(await file.text(), null);
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    showToast("복원 실패", "JSON 파일을 확인해 주세요");
    return;
  }

  const categories = Array.isArray(data.categories)
    ? data.categories.slice(0, MAX_IMPORT_CATEGORIES)
    : [];
  const words = Array.isArray(data.words)
    ? data.words.slice(0, MAX_IMPORT_WORDS)
    : [];

  const importedCategories = mergeCategories(categories);
  const importedWords = mergeWords(words);
  state.player = normalizePlayer({ ...state.player, ...(data.player || {}) });

  saveLocal();

  if (state.firebaseReady) {
    for (const category of importedCategories) await saveCategoryRemote(category);
    for (const word of importedWords) await saveWordRemote(word);
    syncPlayer();
  }

  dom.importFile.value = "";
  showToast("복원 완료", "백업을 불러왔어요");
  render();
  if (state.screen === "game") startRound();
}

function speak(text) {
  if (!text) return;
  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.78;
  utterance.pitch = 1.04;

  speechSynthesis.speak(utterance);
}

function audio() {
  if (!state.player.sound) return null;
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  return audioContext;
}

function tone(frequency, duration = 0.1, type = "sine", gain = 0.08, delay = 0) {
  const ctx = audio();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const volume = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  volume.gain.setValueAtTime(0, ctx.currentTime + delay);
  volume.gain.linearRampToValueAtTime(gain, ctx.currentTime + delay + 0.015);
  volume.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

  oscillator.connect(volume);
  volume.connect(ctx.destination);
  oscillator.start(ctx.currentTime + delay);
  oscillator.stop(ctx.currentTime + delay + duration + 0.02);
}

function playSfx(kind) {
  if (kind === "click") tone(700, 0.04, "square", 0.025);

  if (kind === "ok") {
    [523, 659, 784, 1046].forEach((frequency, index) => {
      tone(frequency, 0.13, "triangle", 0.08, index * 0.055);
    });
    tone(1568, 0.2, "sine", 0.045, 0.18);
  }

  if (kind === "bad") {
    tone(180, 0.2, "sawtooth", 0.06);
    tone(120, 0.25, "sine", 0.045, 0.12);
  }

  if (kind === "level") {
    [392, 523, 659, 784, 1046, 1318].forEach((frequency, index) => {
      tone(frequency, 0.16, "triangle", 0.08, index * 0.07);
    });
  }
}

function successFx(points, word) {
  playSfx("ok");
  document.body.classList.add("celebrate");
  setTimeout(() => document.body.classList.remove("celebrate"), 900);
  showToast("PERFECT!", `+${points}XP · ${word?.word || ""}`);
  confetti();
  floatScore(`+${points}`);
}

function showToast(title, message = "") {
  dom.toast.innerHTML = `<b>${escapeHtml(title)}</b>${message ? `<span>${escapeHtml(message)}</span>` : ""}`;
  dom.toast.classList.add("show");
  setTimeout(() => dom.toast.classList.remove("show"), 950);
}

function confetti() {
  const colors = ["#f97316", "#7c3aed", "#22c55e", "#ec4899", "#06b6d4", "#facc15"];

  for (let i = 0; i < 42; i += 1) {
    const item = document.createElement("i");
    item.className = "conf";
    item.style.left = `${Math.random() * 100}vw`;
    item.style.top = `${-20 - Math.random() * 90}px`;
    item.style.background = colors[i % colors.length];
    item.style.animationDelay = `${Math.random() * 0.16}s`;
    dom.fxLayer.appendChild(item);
    setTimeout(() => item.remove(), 1500);
  }
}

function floatScore(text) {
  const item = document.createElement("div");
  item.className = "float-score";
  item.textContent = text;
  item.style.left = "50vw";
  item.style.top = "42vh";
  dom.fxLayer.appendChild(item);
  setTimeout(() => item.remove(), 1000);
}

function uniqueWordsBySpelling(words) {
  const seen = new Set();
  return words.filter((word) => {
    if (seen.has(word.word)) return false;
    seen.add(word.word);
    return true;
  });
}

function findWordInCategory(word, categoryId, words = state.words) {
  return words.find((item) => item.word === word && item.categoryId === categoryId);
}

function selectedEditableCategory(categoryId) {
  const category = state.categories.find((item) => item.id === categoryId && item.id !== "all");
  return category?.id || CUSTOM_CATEGORY.id;
}

function makeCategoryId() {
  const token = globalThis.crypto?.randomUUID?.()
    || `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return `cat_${token}`;
}

function getCategoryLabel(categoryId) {
  const category = state.categories.find((item) => item.id === categoryId);
  return category ? `${category.emoji} ${category.name}` : "⭐ 직접추가";
}

function getWordFontSize(word, max = 68, min = 24) {
  const length = Math.max(1, String(word || "").length);
  // 한글/이모지/버튼 영역을 고려해 휴대폰 폭에서 잘리지 않도록 길수록 폰트를 줄입니다.
  const size = Math.floor(345 / (Math.max(6, length) * 0.58));
  return `${Math.max(min, Math.min(max, size))}px`;
}

function normalizeAnswer(value) {
  // 채점용: middle school, middle-school, middleschool 모두 같은 답으로 인정
  return String(value || "").toLowerCase().replace(/[^a-z]/g, "");
}

function spellingLetters(value) {
  // 블록/빈칸 게임용: 공백/하이픈은 타일로 만들지 않음
  return normalizeAnswer(value);
}

function makeWordId(word, categoryId = "word", index = "") {
  const safeWord = cleanWord(word)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return `${categoryId}_${safeWord}_${index}`.replace(/_$/, "");
}

function cleanWord(value) {
  // 저장/표시용: middle school처럼 띄어쓰기는 유지
  // in-laws, father's 같은 기본 부호도 유지
  return String(value || "")
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[^a-z\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_WORD_LENGTH);
}

function limitText(value, maxLength) {
  return Array.from(String(value ?? "").trim()).slice(0, maxLength).join("");
}

function safeCounter(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0;
}

function normalizePlayer(player) {
  const progress = player.progress && typeof player.progress === "object" && !Array.isArray(player.progress)
    ? player.progress
    : {};
  const knownCards = player.knownCards && typeof player.knownCards === "object" && !Array.isArray(player.knownCards)
    ? player.knownCards
    : {};

  return {
    ...player,
    name: limitText(player.name, MAX_PLAYER_NAME_LENGTH) || "Player",
    score: safeCounter(player.score),
    coin: safeCounter(player.coin),
    xp: safeCounter(player.xp),
    combo: safeCounter(player.combo),
    bestCombo: safeCounter(player.bestCombo),
    sound: player.sound !== false,
    progress,
    knownCards
  };
}

function shuffle(array) {
  const shuffled = [...array];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function safeJson(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
