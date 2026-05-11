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
const LOCAL_KEY = "heather_word_v3";
const MAX_LIST_ROWS = 9999;
const NEXT_DELAY_MS = 650;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const dom = {
  screens: {
    home: $("#homeScreen"),
    card: $("#cardScreen"),
    game: $("#gameScreen"),
    rank: $("#rankScreen"),
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
  categoryStrip: $("#categoryStrip"),
  cardCategory: $("#cardCategory"),
  gameCategory: $("#gameCategory"),
  listCategory: $("#listCategory"),
  wordCategoryInput: $("#wordCategoryInput"),
  cardEmoji: $("#cardEmoji"),
  cardWord: $("#cardWord"),
  cardMeaning: $("#cardMeaning"),
  cardCategoryName: $("#cardCategoryName"),
  gameBox: $("#gameBox"),
  feedback: $("#feedback"),
  wordList: $("#wordList"),
  rankingList: $("#rankingList"),
  myNameRank: $("#myNameRank"),
  myScoreRank: $("#myScoreRank"),
  toast: $("#toast"),
  fxLayer: $("#fxLayer"),
  soundToggle: $("#soundToggle"),
  wordDialog: $("#wordDialog"),
  catDialog: $("#catDialog"),
  profileDialog: $("#profileDialog"),
  wordInput: $("#wordInput"),
  meaningInput: $("#meaningInput"),
  emojiInput: $("#emojiInput"),
  catNameInput: $("#catNameInput"),
  catEmojiInput: $("#catEmojiInput"),
  playerNameInput: $("#playerNameInput"),
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
  answerTiles: [],
  bankTiles: [],
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
    await seedDefaultDataIfEmpty();
    subscribeFirebase();
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
  const response = await fetch("./words.json", { cache: "no-store" });
  const data = await response.json();

  state.categories = [DEFAULT_CATEGORY, ...data.categories];
  state.words = data.words.map((word, index) => ({
    id: makeWordId(word.word, word.categoryId, index),
    word: cleanWord(word.word),
    meaning: word.meaning || "",
    emoji: word.emoji || "📘",
    categoryId: word.categoryId || "day1",
    base: true
  }));
}

function loadLocalState() {
  const saved = safeJson(localStorage.getItem(LOCAL_KEY), {});
  state.player = {
    ...state.player,
    ...(saved.player || {})
  };
  state.selectedCategoryId = saved.selectedCategoryId || "all";

  const localCategories = saved.categories || [];
  const localWords = saved.words || [];

  mergeCategories(localCategories);
  mergeWords(localWords);

  if (!state.player.name || state.player.name === "Player") {
    const nick = localStorage.getItem("heather_player_name");
    if (nick) state.player.name = nick;
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
  if (!window.HEATHER_USE_FIREBASE) {
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

  const batch = writeBatch(firebase.db);

  for (const category of state.categories.filter((item) => item.id !== "all")) {
    batch.set(doc(firebase.db, "classes", firebase.classId, "categories", category.id), {
      name: category.name,
      emoji: category.emoji,
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
    if (!state.currentWord) newQuestion();
  });

  firebase.unsubCategories = onSnapshot(categoriesRef, (snapshot) => {
    const remoteCategories = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
      base: false
    }));

    state.categories = [DEFAULT_CATEGORY];
    mergeCategories(remoteCategories);
    render();
  });

  firebase.unsubPlayer = onSnapshot(playerRef, (snapshot) => {
    if (snapshot.exists()) {
      state.player = {
        ...state.player,
        ...snapshot.data()
      };
      saveLocal();
      render();
    } else {
      syncPlayer();
    }
  });

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
  }, { merge: true }).catch(console.error);
}

function bindEvents() {
  $$("[data-nav]").forEach((button) => {
    button.addEventListener("click", () => navigate(button.dataset.nav));
  });

  $("#gameBackBtn").addEventListener("click", handleGameBack);

  $$(".mode-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.gameMode = button.dataset.mode;
      $$(".mode-btn").forEach((item) => item.classList.toggle("active", item === button));
      updateTypingModeClass();
      newQuestion();
    });
  });

  $("#newQuestionBtn").addEventListener("click", newQuestion);
  $("#cardSpeakBtn").addEventListener("click", () => speak(currentCardWord()?.word));
  $("#prevCardBtn").addEventListener("click", () => moveCard(-1));
  $("#nextCardBtn").addEventListener("click", () => moveCard(1));
  $("#knowBtn").addEventListener("click", awardCurrentCard);
  $("#hardBtn").addEventListener("click", markCurrentCardHard);

  dom.cardCategory.addEventListener("change", () => selectCategory(dom.cardCategory.value));
  dom.gameCategory.addEventListener("change", () => {
    selectCategory(dom.gameCategory.value);
    newQuestion();
  });
  dom.listCategory.addEventListener("change", () => selectCategory(dom.listCategory.value));

  $("#addWordBtn").addEventListener("click", () => openWordDialog());
  $("#addCatBtn").addEventListener("click", () => dom.catDialog.showModal());
  $("#deleteCatBtn").addEventListener("click", deleteSelectedCategory);
  $("#closeWordDialog").addEventListener("click", () => dom.wordDialog.close());
  $("#closeCatDialog").addEventListener("click", () => dom.catDialog.close());
  $("#saveWordBtn").addEventListener("click", saveWordFromDialog);
  $("#saveCatBtn").addEventListener("click", saveCategoryFromDialog);

  $("#profileBtn").addEventListener("click", () => {
    dom.playerNameInput.value = state.player.name || "";
    dom.profileDialog.showModal();
    setTimeout(() => dom.playerNameInput.focus(), 80);
  });
  $("#closeProfileDialog").addEventListener("click", () => dom.profileDialog.close());
  $("#saveProfileBtn").addEventListener("click", saveProfile);

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
  // 쓰기/빈칸 모드는 화면 확보를 위해 모드 탭을 숨긴다.
  // 이때 뒤로가기는 홈이 아니라 게임 선택이 가능한 "뜻" 모드로 돌아간다.
  if (state.gameMode === "blank" || state.gameMode === "type") {
    state.gameMode = "choice";
    $$(".mode-btn").forEach((button) => {
      button.classList.toggle("active", button.dataset.mode === "choice");
    });
    updateTypingModeClass();
    newQuestion();
    showToast("게임 선택", "다른 게임을 고를 수 있어요");
    return;
  }

  navigate("home");
}

function navigate(screen) {
  state.screen = screen;
  Object.entries(dom.screens).forEach(([key, el]) => {
    el.classList.toggle("active", key === screen);
  });

  updateTypingModeClass();

  if (screen === "rank") loadRanking();
  render();
}

function selectCategory(categoryId) {
  state.selectedCategoryId = categoryId;
  state.cardIndex = 0;
  saveLocal();
  render();
}

function mergeCategories(categories) {
  const map = new Map(state.categories.map((category) => [category.id, category]));
  for (const category of categories) {
    if (!category.id || category.id === "all") continue;
    map.set(category.id, {
      id: category.id,
      name: category.name || "새 카테고리",
      emoji: category.emoji || "🗂️",
      base: Boolean(category.base)
    });
  }
  state.categories = [...map.values()];
}

function mergeWords(words) {
  const map = new Map(state.words.map((word) => [word.id, word]));
  for (const word of words) {
    const cleaned = cleanWord(word.word);
    if (!cleaned) continue;
    const id = word.id || makeWordId(cleaned, word.categoryId || "custom");
    map.set(id, {
      id,
      word: cleaned,
      meaning: word.meaning || "",
      emoji: word.emoji || "📘",
      categoryId: word.categoryId || "custom",
      base: Boolean(word.base)
    });
  }
  state.words = [...map.values()].sort((a, b) => a.word.localeCompare(b.word));
}

function categoryOptions(includeAll = true) {
  return state.categories
    .filter((category) => includeAll || category.id !== "all")
    .map((category) => `<option value="${escapeHtml(category.id)}">${category.emoji} ${escapeHtml(category.name)}</option>`)
    .join("");
}

function render() {
  dom.scorePill.textContent = `⭐ ${state.player.score || 0}`;
  dom.coinPill.textContent = `🍪 ${state.player.coin || 0}`;
  dom.comboPill.textContent = `🔥 ${state.player.combo || 0}`;
  dom.soundToggle.textContent = state.player.sound ? "🔊 ON" : "🔇 OFF";

  const pet = getPetStage();
  dom.petEmoji.textContent = pet.emoji;
  dom.petName.textContent = pet.name;
  dom.petMsg.textContent = pet.message;
  dom.xpFill.style.width = `${pet.percent}%`;
  dom.levelText.textContent = `Lv.${Math.floor((state.player.xp || 0) / 100) + 1}`;
  dom.nextXpText.textContent = `${pet.next - (state.player.xp || 0)}XP 남음`;

  renderCategories();
  renderSelects();
  renderCard();
  renderWordList();
}

function renderCategories() {
  dom.categoryStrip.innerHTML = state.categories.map((category) => {
    const count = category.id === "all"
      ? state.words.length
      : state.words.filter((word) => word.categoryId === category.id).length;

    return `
      <button class="cat-btn ${state.selectedCategoryId === category.id ? "active" : ""}" data-cat="${escapeHtml(category.id)}">
        ${category.emoji} ${escapeHtml(category.name)} ${count}
      </button>
    `;
  }).join("");

  dom.categoryStrip.querySelectorAll("[data-cat]").forEach((button) => {
    button.addEventListener("click", () => {
      selectCategory(button.dataset.cat);
      if (state.screen === "game") newQuestion();
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
  if (!dom.wordCategoryInput.value) dom.wordCategoryInput.value = "day1";
}

function renderCard() {
  const word = currentCardWord();
  if (!word) return;

  dom.cardEmoji.textContent = word.emoji || "📘";
  dom.cardWord.textContent = word.word;
  dom.cardWord.style.fontSize = getWordFontSize(word.word, 68, 24);
  dom.cardWord.classList.toggle("long-word", word.word.length >= 11);
  dom.cardMeaning.textContent = word.meaning || "뜻 입력";
  dom.cardCategoryName.textContent = getCategoryLabel(word.categoryId);

  const alreadyKnown = Boolean(state.player.knownCards?.[word.id]);
  const knowButton = $("#knowBtn");
  if (knowButton) {
    knowButton.textContent = alreadyKnown ? "✅ 완료 · 다음" : "알아요 +5";
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
      <div style="font-size:30px">${word.emoji || "📘"}</div>
      <div>
        <b>${escapeHtml(word.word)}</b>
        <small>${escapeHtml(word.meaning || "뜻 입력")} · ${getCategoryLabel(word.categoryId)}</small>
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
  if (!list.length) return state.words[0];
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

  state.currentWord = pickQuestionWord();
  state.answerTiles = [];
  state.bankTiles = shuffle(state.currentWord.word.split("").map((char, index) => ({ char, index })));

  if (state.gameMode === "choice") renderChoiceGame();
  if (state.gameMode === "block") renderBlockGame();
  if (state.gameMode === "blank") renderBlankGame();
  if (state.gameMode === "type") renderTypeGame();
}

function pickQuestionWord() {
  const list = filteredWords();
  const source = list.length ? list : state.words;
  return source[Math.floor(Math.random() * source.length)];
}

function isTypingMode() {
  return state.screen === "game" && (state.gameMode === "blank" || state.gameMode === "type");
}

function updateTypingModeClass() {
  document.body.classList.toggle("typing-mode", isTypingMode());
}

function questionHeader(showWord = false) {
  const word = state.currentWord;
  return `
    <div class="question-top">
      <div class="question-emoji">${word.emoji || "📘"}</div>
      <div class="question-meaning">${escapeHtml(word.meaning || "뜻 입력")}</div>
      ${showWord ? `<div class="question-word">${escapeHtml(word.word)}</div>` : ""}
      <div class="tag">${getCategoryLabel(word.categoryId)}</div>
    </div>
  `;
}

function renderChoiceGame() {
  const options = shuffle([
    state.currentWord,
    ...shuffle(state.words.filter((word) => word.id !== state.currentWord.id)).slice(0, 3)
  ]);

  dom.gameBox.innerHTML = `
    ${questionHeader()}
    <div class="choices">
      ${options.map((word) => `<button class="choice" data-word-id="${word.id}">${escapeHtml(word.word)}</button>`).join("")}
    </div>
    <button id="skipQuestionBtn" class="soft-btn skip">몰라요 · 다음 →</button>
  `;

  dom.gameBox.querySelectorAll("[data-word-id]").forEach((button) => {
    button.addEventListener("click", () => checkAnswer(button.dataset.wordId === state.currentWord.id, 5));
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
      <button id="checkTilesBtn" class="soft-btn good">확인 +10</button>
    </div>
  `;

  drawTiles();

  $("#clearTilesBtn").addEventListener("click", () => {
    state.answerTiles = [];
    state.bankTiles = shuffle(state.currentWord.word.split("").map((char, index) => ({ char, index })));
    drawTiles();
  });

  $("#skipQuestionBtn").addEventListener("click", skipQuestion);

  $("#checkTilesBtn").addEventListener("click", () => {
    const answer = state.answerTiles.map((tile) => tile.char).join("");
    checkAnswer(answer === state.currentWord.word, 10);
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
  const masked = state.currentWord.word
    .split("")
    .map((char, index) => (index % 2 === 0 ? char : "_"))
    .join(" ");

  dom.gameBox.innerHTML = `
    <div class="question-top compact-question">
      <div class="question-meaning">${escapeHtml(state.currentWord.meaning || "뜻 입력")} ${state.currentWord.emoji || ""}</div>
      <div class="tag">${getCategoryLabel(state.currentWord.categoryId)}</div>
    </div>
    <div class="question-word long-fit" style="font-size:${getWordFontSize(state.currentWord.word, 56, 24)}">${masked}</div>
    <input id="answerInput" class="type-input" placeholder="영어 단어" autocomplete="off" autocapitalize="none" spellcheck="false" inputmode="text" lang="en" />
    <div class="screen-row game-actions">
      <button id="skipQuestionBtn" class="soft-btn skip">몰라요 · 다음</button>
      <button id="checkInputBtn" class="soft-btn good">확인 +15</button>
    </div>
  `;

  const input = $("#answerInput");
  const check = () => checkAnswer(cleanWord(input.value) === state.currentWord.word, 15);
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
      <div class="question-meaning">${escapeHtml(state.currentWord.meaning || "")} ${state.currentWord.emoji || ""}</div>
      <div class="tag">${getCategoryLabel(state.currentWord.categoryId)}</div>
    </div>
    <input id="answerInput" class="type-input" placeholder="영어 단어" autocomplete="off" autocapitalize="none" spellcheck="false" inputmode="text" lang="en" />
    <div class="screen-row game-actions">
      <button id="skipQuestionBtn" class="soft-btn skip">몰라요 · 다음</button>
      <button id="checkInputBtn" class="soft-btn good">확인 +20</button>
    </div>
  `;

  $("#speakQuestionBtn").addEventListener("click", () => speak(state.currentWord.word));

  const input = $("#answerInput");
  const check = () => checkAnswer(cleanWord(input.value) === state.currentWord.word, 20);
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
  if (!state.currentWord) {
    newQuestion();
    return;
  }

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
    newQuestion();
  }, 520);
}

function checkAnswer(isCorrect, points) {
  if (isCorrect) {
    award(points, state.currentWord, true);
    dom.feedback.textContent = `정답! ${state.currentWord.word} 🎉`;
    dom.feedback.className = "feedback good";

    clearTimeout(nextTimer);
    nextTimer = setTimeout(() => {
      newQuestion();
    }, NEXT_DELAY_MS);
    return;
  }

  markWrong(state.currentWord);
  dom.feedback.textContent = `아깝다! 정답은 ${state.currentWord.word}`;
  dom.feedback.className = "feedback bad";
}

function award(points, word, shouldMoveNext) {
  const bonus = (state.player.combo + 1) % 3 === 0 ? 5 : 0;
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

  if (!shouldMoveNext) render();
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

function getPetStage() {
  const xp = state.player.xp || 0;
  const stages = [
    { min: 0, next: 300, emoji: "🥚", name: "알 스펠링몬", message: "천천히 알을 깨워요" },
    { min: 300, next: 800, emoji: "🐣", name: "아기 병아리몬", message: "처음 단어를 먹기 시작했어요" },
    { min: 800, next: 1500, emoji: "🐹", name: "햄스터몬", message: "쿠키를 모으며 자라요" },
    { min: 1500, next: 3000, emoji: "🐰", name: "토끼몬", message: "짧은 단어는 자신 있어요" },
    { min: 3000, next: 5000, emoji: "🐼", name: "판다몬", message: "카테고리별 단어를 모아요" },
    { min: 5000, next: 8000, emoji: "🦊", name: "여우몬", message: "스펠링 감각이 좋아졌어요" },
    { min: 8000, next: 12000, emoji: "🦄", name: "유니콘몬", message: "쓰기 문제도 멋지게 풀어요" },
    { min: 12000, next: 18000, emoji: "🐲", name: "드래곤몬", message: "어려운 단어를 먹고 강해져요" },
    { min: 18000, next: 26000, emoji: "🦅", name: "피닉스몬", message: "틀려도 다시 살아나는 힘!" },
    { min: 26000, next: 36000, emoji: "🌟", name: "스타몬", message: "반짝반짝 단어 마스터" },
    { min: 36000, next: 50000, emoji: "👑", name: "레전드 스펠링몬", message: "진짜 영어 챔피언!" }
  ];

  const stage = [...stages].reverse().find((item) => xp >= item.min) || stages[0];
  const range = stage.next - stage.min;
  const percent = Math.max(5, Math.min(100, ((xp - stage.min) / range) * 100));

  return { ...stage, percent };
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
  award(5, word, false);

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
  const meaning = dom.meaningInput.value.trim();
  const emoji = dom.emojiInput.value.trim() || "📘";
  const categoryId = dom.wordCategoryInput.value || "day1";

  if (!word) {
    showToast("단어 확인", "영어 단어를 입력해 주세요");
    return;
  }

  const wordItem = {
    id: makeWordId(word, categoryId),
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
  showToast("단어 추가", `${word} 저장 완료`);
  render();
}

async function saveCategoryFromDialog() {
  const name = dom.catNameInput.value.trim();
  const emoji = dom.catEmojiInput.value.trim() || "🗂️";

  if (!name) {
    showToast("카테고리 확인", "이름을 입력해 주세요");
    return;
  }

  const category = {
    id: `cat_${Date.now()}`,
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

  if (category.base) {
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
    await deleteDoc(doc(firebase.db, "classes", firebase.classId, "categories", category.id));

    for (const word of state.words.filter((item) => item.categoryId === "custom" && wordsInCategory.some((oldWord) => oldWord.id === item.id))) {
      await saveWordRemote(word);
    }
  }

  showToast("카테고리 삭제", "단어는 직접추가로 이동했어요");
  render();
}

async function deleteWord(wordId) {
  state.words = state.words.filter((word) => word.id !== wordId);
  saveLocal();

  if (state.firebaseReady) {
    await deleteDoc(doc(firebase.db, "classes", firebase.classId, "words", wordId));
  }

  showToast("삭제 완료", "단어를 삭제했어요");
  render();
}

async function saveWordRemote(word) {
  saveLocal();

  if (!state.firebaseReady) return;

  await setDoc(doc(firebase.db, "classes", firebase.classId, "words", word.id), {
    word: word.word,
    meaning: word.meaning,
    emoji: word.emoji,
    categoryId: word.categoryId,
    updatedAt: serverTimestamp(),
    updatedBy: state.firebaseUser.uid
  }, { merge: true });
}

async function saveCategoryRemote(category) {
  saveLocal();

  if (!state.firebaseReady) return;

  await setDoc(doc(firebase.db, "classes", firebase.classId, "categories", category.id), {
    name: category.name,
    emoji: category.emoji,
    updatedAt: serverTimestamp(),
    updatedBy: state.firebaseUser.uid
  }, { merge: true });
}

function openWordDialog() {
  clearWordDialog();
  dom.wordCategoryInput.value = state.selectedCategoryId === "all" ? "day1" : state.selectedCategoryId;
  dom.wordDialog.showModal();
}

function clearWordDialog() {
  dom.wordInput.value = "";
  dom.meaningInput.value = "";
  dom.emojiInput.value = "";
}

function saveProfile() {
  const name = dom.playerNameInput.value.trim() || "Player";
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
  const snap = await getDocs(query(playersRef, orderBy("score", "desc"), limit(10)));

  dom.rankingList.innerHTML = snap.docs.map((item, index) => {
    const player = item.data();
    return `
      <div class="rank-row">
        <div style="font-size:28px">${index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "⭐"}</div>
        <div>
          <b>${escapeHtml(player.name || "Player")}</b>
          <small>베스트 콤보 ${player.bestCombo || 0}</small>
        </div>
        <strong>${player.score || 0}</strong>
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
  if (!data) {
    showToast("복원 실패", "JSON 파일을 확인해 주세요");
    return;
  }

  mergeCategories(data.categories || []);
  mergeWords(data.words || []);
  state.player = { ...state.player, ...(data.player || {}) };

  saveLocal();

  if (state.firebaseReady) {
    for (const category of data.categories || []) await saveCategoryRemote(category);
    for (const word of data.words || []) await saveWordRemote(word);
    syncPlayer();
  }

  showToast("복원 완료", "백업을 불러왔어요");
  render();
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

function makeWordId(word, categoryId = "word", index = "") {
  return `${categoryId}_${cleanWord(word)}_${index}`.replace(/_$/, "");
}

function cleanWord(value) {
  return String(value || "").toLowerCase().replace(/[^a-z]/g, "");
}

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
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
