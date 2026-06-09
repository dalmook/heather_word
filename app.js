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
const DAILY_MISSION_TARGETS = Object.freeze({
  cardViews: 5,
  gameCorrect: 5,
  writingAttempts: 3
});
const DAILY_MISSION_REWARD = Object.freeze({
  coin: 20,
  xp: 1000
});
const DAISO_VOUCHER_COOKIE_COST = 5000;
const DEFAULT_AVATAR = Object.freeze({
  body: "body_basic_01",
  face: "face_round_01",
  hair: "hair_basic_01",
  outfit: "outfit_basic_01",
  accessory: ""
});
const DEFAULT_OWNED_AVATAR_ITEMS = Object.freeze({
  body_basic_01: true,
  face_round_01: true,
  hair_basic_01: true,
  outfit_basic_01: true
});
const AVATAR_SLOT_LABELS = Object.freeze({
  face: "얼굴",
  hair: "머리",
  outfit: "옷",
  accessory: "악세사리"
});
const AVATAR_RARITY_LABELS = Object.freeze({
  basic: "BASIC",
  rare: "RARE",
  epic: "EPIC",
  legend: "LEGEND"
});
const AVATAR_ITEMS = Object.freeze([
  { id: "body_basic_01", slot: "body", name: "기본 바디", cost: 0, rarity: "basic", src: "./assets/avatar/body/body01.svg" },
  { id: "face_round_01", slot: "face", name: "방긋 얼굴", cost: 0, rarity: "basic", src: "./assets/avatar/face/face01.svg" },
  { id: "face_smile_02", slot: "face", name: "반짝 미소", cost: 180, rarity: "basic", src: "./assets/avatar/face/face02.svg" },
  { id: "face_wink_03", slot: "face", name: "윙크 얼굴", cost: 260, rarity: "rare", src: "./assets/avatar/face/face03.svg" },
  { id: "face_shy_04", slot: "face", name: "수줍은 볼", cost: 360, rarity: "rare", src: "./assets/avatar/face/face04.svg" },
  { id: "face_sparkle_05", slot: "face", name: "프린세스 눈빛", cost: 520, rarity: "epic", src: "./assets/avatar/face/face05.svg" },
  { id: "hair_basic_01", slot: "hair", name: "동글 앞머리", cost: 0, rarity: "basic", src: "./assets/avatar/hair/hair01.svg" },
  { id: "hair_bob_02", slot: "hair", name: "보송 단발", cost: 220, rarity: "basic", src: "./assets/avatar/hair/hair02.svg" },
  { id: "hair_twintail_03", slot: "hair", name: "리본 트윈테일", cost: 320, rarity: "rare", src: "./assets/avatar/hair/hair03.svg" },
  { id: "hair_star_04", slot: "hair", name: "별빛 블루", cost: 420, rarity: "rare", src: "./assets/avatar/hair/hair04.svg" },
  { id: "hair_curl_05", slot: "hair", name: "몽글 웨이브", cost: 520, rarity: "epic", src: "./assets/avatar/hair/hair05.svg" },
  { id: "hair_princess_06", slot: "hair", name: "프린세스 롱", cost: 680, rarity: "epic", src: "./assets/avatar/hair/hair06.svg" },
  { id: "hair_mint_07", slot: "hair", name: "민트 포니", cost: 760, rarity: "epic", src: "./assets/avatar/hair/hair07.svg" },
  { id: "hair_rainbow_08", slot: "hair", name: "무지개 헤어", cost: 980, rarity: "legend", src: "./assets/avatar/hair/hair08.svg" },
  { id: "outfit_basic_01", slot: "outfit", name: "기본 티셔츠", cost: 0, rarity: "basic", src: "./assets/avatar/outfit/outfit01.svg" },
  { id: "outfit_school_02", slot: "outfit", name: "학교 조끼", cost: 260, rarity: "basic", src: "./assets/avatar/outfit/outfit02.svg" },
  { id: "outfit_cookie_03", slot: "outfit", name: "쿠키 후드", cost: 360, rarity: "rare", src: "./assets/avatar/outfit/outfit03.svg" },
  { id: "outfit_rainbow_04", slot: "outfit", name: "무지개 원피스", cost: 460, rarity: "rare", src: "./assets/avatar/outfit/outfit04.svg" },
  { id: "outfit_hero_05", slot: "outfit", name: "용감 망토", cost: 620, rarity: "epic", src: "./assets/avatar/outfit/outfit05.svg" },
  { id: "outfit_princess_06", slot: "outfit", name: "핑크 드레스", cost: 760, rarity: "epic", src: "./assets/avatar/outfit/outfit06.svg" },
  { id: "outfit_magic_07", slot: "outfit", name: "마법학교 로브", cost: 840, rarity: "epic", src: "./assets/avatar/outfit/outfit07.svg" },
  { id: "outfit_ballet_08", slot: "outfit", name: "발레 리본", cost: 920, rarity: "epic", src: "./assets/avatar/outfit/outfit08.svg" },
  { id: "outfit_star_09", slot: "outfit", name: "별무대 의상", cost: 1060, rarity: "legend", src: "./assets/avatar/outfit/outfit09.svg" },
  { id: "outfit_queen_10", slot: "outfit", name: "여왕 드레스", cost: 1280, rarity: "legend", src: "./assets/avatar/outfit/outfit10.svg" },
  { id: "accessory_ribbon_01", slot: "accessory", name: "딸기 리본", cost: 150, rarity: "basic", src: "./assets/avatar/accessory/ribbon01.svg" },
  { id: "accessory_glasses_02", slot: "accessory", name: "동글 안경", cost: 180, rarity: "basic", src: "./assets/avatar/accessory/glasses01.svg" },
  { id: "accessory_star_03", slot: "accessory", name: "별 머리핀", cost: 210, rarity: "rare", src: "./assets/avatar/accessory/star01.svg" },
  { id: "accessory_crown_04", slot: "accessory", name: "작은 왕관", cost: 300, rarity: "rare", src: "./assets/avatar/accessory/crown01.svg" },
  { id: "accessory_bag_05", slot: "accessory", name: "하트 가방", cost: 340, rarity: "rare", src: "./assets/avatar/accessory/bag01.svg" },
  { id: "accessory_headset_06", slot: "accessory", name: "리듬 헤드셋", cost: 420, rarity: "rare", src: "./assets/avatar/accessory/headset01.svg" },
  { id: "accessory_wings_07", slot: "accessory", name: "구름 날개", cost: 520, rarity: "epic", src: "./assets/avatar/accessory/wings01.svg" },
  { id: "accessory_magic_08", slot: "accessory", name: "마법 지팡이", cost: 680, rarity: "epic", src: "./assets/avatar/accessory/magic01.svg" },
  { id: "accessory_tiara_09", slot: "accessory", name: "진주 티아라", cost: 760, rarity: "epic", src: "./assets/avatar/accessory/tiara01.svg" },
  { id: "accessory_cape_10", slot: "accessory", name: "별빛 케이프", cost: 840, rarity: "epic", src: "./assets/avatar/accessory/cape01.svg" },
  { id: "accessory_aura_11", slot: "accessory", name: "반짝 오라", cost: 980, rarity: "legend", src: "./assets/avatar/accessory/aura01.svg" },
  { id: "accessory_royal_12", slot: "accessory", name: "로열 세트", cost: 1180, rarity: "legend", src: "./assets/avatar/accessory/royal01.svg" }
]);
const AVATAR_ITEM_MAP = Object.freeze(Object.fromEntries(AVATAR_ITEMS.map((item) => [item.id, item])));
const SHOP_ITEMS = Object.freeze([
  { id: "ribbon", emoji: "🎀", name: "리본", cost: 120 },
  { id: "star_pin", emoji: "⭐", name: "별핀", cost: 150 },
  { id: "flower_crown", emoji: "🌼", name: "꽃왕관", cost: 180 },
  { id: "heart_pin", emoji: "💖", name: "하트핀", cost: 220 },
  { id: "sunglasses", emoji: "😎", name: "선글라스", cost: 260 },
  { id: "magic_hat", emoji: "🎩", name: "마법모자", cost: 320 },
  { id: "party_hat", emoji: "🥳", name: "파티모자", cost: 360 },
  { id: "headphones", emoji: "🎧", name: "헤드폰", cost: 420 },
  { id: "school_bag", emoji: "🎒", name: "책가방", cost: 480 },
  { id: "medal", emoji: "🏅", name: "금메달", cost: 540 },
  { id: "crown", emoji: "👑", name: "왕관", cost: 620 },
  { id: "wings", emoji: "🪽", name: "날개", cost: 700 },
  { id: "crystal", emoji: "💎", name: "반짝보석", cost: 780 },
  { id: "rainbow_aura", emoji: "🌈", name: "무지개오라", cost: 860 },
  { id: "rocket_pack", emoji: "🚀", name: "로켓팩", cost: 960 },
  { id: "moon_charm", emoji: "🌙", name: "달빛참", cost: 1040 },
  { id: "trophy", emoji: "🏆", name: "챔피언컵", cost: 1120 },
  { id: "legend_crown", emoji: "✨", name: "전설왕관", cost: 1250 }
]);
const SHOP_THEMES = Object.freeze([
  { id: "night", emoji: "🌙", name: "밤하늘 배경", cost: 300, className: "theme-night" },
  { id: "beach", emoji: "🏖️", name: "바다 배경", cost: 320, className: "theme-beach" },
  { id: "forest", emoji: "🌿", name: "숲 배경", cost: 340, className: "theme-forest" },
  { id: "cherry", emoji: "🌸", name: "벚꽃 배경", cost: 380, className: "theme-cherry" },
  { id: "candy", emoji: "🍬", name: "캔디 배경", cost: 420, className: "theme-candy" },
  { id: "classroom", emoji: "📚", name: "교실 배경", cost: 460, className: "theme-classroom" },
  { id: "sunset", emoji: "🌇", name: "노을 배경", cost: 520, className: "theme-sunset" },
  { id: "rainbow", emoji: "🌈", name: "무지개 배경", cost: 580, className: "theme-rainbow" },
  { id: "snow", emoji: "❄️", name: "눈꽃 배경", cost: 640, className: "theme-snow" },
  { id: "garden", emoji: "🌷", name: "정원 배경", cost: 700, className: "theme-garden" },
  { id: "library", emoji: "📖", name: "도서관 배경", cost: 760, className: "theme-library" },
  { id: "space", emoji: "🚀", name: "우주 배경", cost: 840, className: "theme-space" },
  { id: "palace", emoji: "🏰", name: "궁전 배경", cost: 920, className: "theme-palace" },
  { id: "aurora", emoji: "🌌", name: "오로라 배경", cost: 1040, className: "theme-aurora" },
  { id: "crystal", emoji: "💎", name: "보석 배경", cost: 1160, className: "theme-crystal" },
  { id: "legend", emoji: "✨", name: "전설 배경", cost: 1300, className: "theme-legend" }
]);
const SHOP_PETS = Object.freeze([
  { id: "cookie_puppy", emoji: "🐶", name: "쿠키강아지", cost: 900, trait: "기분 보너스" },
  { id: "mellow_cat", emoji: "🐱", name: "마시멜로냥", cost: 980, trait: "포만감 보너스" },
  { id: "star_bunny", emoji: "🐰", name: "별토끼", cost: 1100, trait: "성장 보너스" },
  { id: "cloud_penguin", emoji: "🐧", name: "구름펭귄", cost: 1250, trait: "간식 보너스" },
  { id: "jelly_dragon", emoji: "🐲", name: "젤리드래곤", cost: 1500, trait: "전설 펫" }
]);
const SHOP_FOODS = Object.freeze([
  { id: "milk", emoji: "🥛", name: "튼튼 우유", cost: 80, xp: 18, hunger: 18, mood: 6 },
  { id: "cookie", emoji: "🍪", name: "쿠키 간식", cost: 120, xp: 26, hunger: 24, mood: 10 },
  { id: "berry", emoji: "🍓", name: "딸기 컵", cost: 160, xp: 34, hunger: 20, mood: 18 },
  { id: "cake", emoji: "🍰", name: "축하 케이크", cost: 240, xp: 54, hunger: 34, mood: 24 },
  { id: "star_meal", emoji: "🌟", name: "별빛 정식", cost: 360, xp: 86, hunger: 48, mood: 34 }
]);
const DIRECT_PET_SNACK_COST = 60;
const PET_MAX_LEVEL = 50;
const PET_LEVEL_XP_BASE = 120;
const PET_LEVEL_XP_GROWTH = 35;
const DAISO_VOUCHER_LABEL = "다이소 3천원 상품권";
const MANAGE_PASSWORD = "3341";
const LEGACY_MONSTER_COUNT = 100;
const LEGACY_MONSTER_XP_STEP = 250;
const MONSTER_CATALOG_SIZE = 1000;
const EXPANDED_MONSTER_START_GAP = 1500;
const EXPANDED_MONSTER_TIER_SIZE = 20;
const EXPANDED_MONSTER_GAP_INCREASE = 500;
const MODE_ROUNDS = Object.freeze({
  choice: { count: 10, label: "뜻", bonus: 10 },
  block: { count: 10, label: "블록", bonus: 100 },
  blank: { count: 10, label: "빈칸", bonus: 200 },
  type: { count: 10, label: "쓰기", bonus: 500 }
});
const MODE_GUIDES = Object.freeze({
  choice: "뜻에 맞는 영어 단어를 고르세요.",
  block: "알파벳 블록을 순서대로 눌러 단어를 완성하세요.",
  blank: "보이는 힌트를 보고 빈칸까지 포함해 전체 단어를 입력하세요.",
  type: "발음을 듣고 영어 단어 전체를 직접 써 보세요."
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
  const tierCycle = Math.floor(tier / MONSTER_TIERS.length);
  const tierName = `${MONSTER_TIERS[tier % MONSTER_TIERS.length]}${tierCycle ? ` ${tierCycle + 1}` : ""}`;
  return {
    id: `monster_${String(index + 1).padStart(3, "0")}`,
    number: index + 1,
    min: getMonsterRequiredXp(index),
    emoji: MONSTER_EMOJIS[index % MONSTER_EMOJIS.length],
    name: `${tierName} ${MONSTER_BASE_NAMES[index % MONSTER_BASE_NAMES.length]}`,
    message: MONSTER_MESSAGES[tier % MONSTER_MESSAGES.length],
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
    pet: $("#petScreen"),
    shop: $("#shopScreen"),
    manage: $("#manageScreen")
  },
  syncStatus: $("#syncStatus"),
  scorePill: $("#scorePill"),
  coinPill: $("#coinPill"),
  comboPill: $("#comboPill"),
  petEmoji: $("#petEmoji"),
  avatarPreview: $("#avatarPreview"),
  equippedAccessory: $("#equippedAccessory"),
  petName: $("#petName"),
  petMsg: $("#petMsg"),
  xpFill: $("#xpFill"),
  levelText: $("#levelText"),
  nextXpText: $("#nextXpText"),
  homeMonsterCount: $("#homeMonsterCount"),
  homeWordCount: $("#homeWordCount"),
  homeKnownCount: $("#homeKnownCount"),
  homeBestCombo: $("#homeBestCombo"),
  cardProgress: $("#cardProgress"),
  claimMissionBtn: $("#claimMissionBtn"),
  missionCardText: $("#missionCardText"),
  missionCorrectText: $("#missionCorrectText"),
  missionWritingText: $("#missionWritingText"),
  missionCardFill: $("#missionCardFill"),
  missionCorrectFill: $("#missionCorrectFill"),
  missionWritingFill: $("#missionWritingFill"),
  missionRewardText: $("#missionRewardText"),
  missionSummary: $("#missionSummary"),
  shopCookieCount: $("#shopCookieCount"),
  shopItemGrid: $("#shopItemGrid"),
  shopThemeGrid: $("#shopThemeGrid"),
  shopPetGrid: $("#shopPetGrid"),
  shopFoodGrid: $("#shopFoodGrid"),
  shopAvatarPreview: $("#shopAvatarPreview"),
  shopAvatarTabs: $("#shopAvatarTabs"),
  shopAvatarGrid: $("#shopAvatarGrid"),
  shopAvatarParts: $("#shopAvatarParts"),
  petCareEmoji: $("#petCareEmoji"),
  petCareName: $("#petCareName"),
  petCareLevel: $("#petCareLevel"),
  petCareMessage: $("#petCareMessage"),
  petCareXpFill: $("#petCareXpFill"),
  petCareMoodFill: $("#petCareMoodFill"),
  petCareHungerFill: $("#petCareHungerFill"),
  petCareXpText: $("#petCareXpText"),
  petCareMoodText: $("#petCareMoodText"),
  petCareHungerText: $("#petCareHungerText"),
  petFoodList: $("#petFoodList"),
  petFeedCookieBtn: $("#petFeedCookieBtn"),
  petPlayBtn: $("#petPlayBtn"),
  petShopBtn: $("#petShopBtn"),
  requestDaisoVoucherBtn: $("#requestDaisoVoucherBtn"),
  shopVoucherList: $("#shopVoucherList"),
  manageRewardList: $("#manageRewardList"),
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
  manageSearch: $("#manageSearch"),
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
    knownCards: {},
    questionHistory: {},
    dailyMission: makeDailyMission(),
    ownedItems: {},
    equippedItem: "",
    ownedAvatarItems: { ...DEFAULT_OWNED_AVATAR_ITEMS },
    equippedAvatar: { ...DEFAULT_AVATAR },
    ownedThemes: {},
    equippedTheme: "",
    ownedPets: {},
    equippedPet: "",
    petCare: makePetCare(),
    rewardClaims: []
  },
  rewardAdminClaims: [],
  rewardAdminPlayers: [],
  rewardAdminLoaded: false,
  selectedCategoryId: "all",
  manageSearch: "",
  shopAvatarSlot: "face",
  avatarPreviewDraft: null,
  screen: "home",
  cardIndex: 0,
  cardLocked: false,
  cardAwardedIds: new Set(),
  lastMissionCardViewToken: "",
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
  ensureDailyMission();
  saveLocal();
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
  if (state.cardAwardedIds?.size) {
    state.player.knownCards = {
      ...(state.player.knownCards || {}),
      ...Object.fromEntries([...state.cardAwardedIds].map((id) => [id, true]))
    };
  }

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
    dailyMission: ensureDailyMission(),
    ownedItems: state.player.ownedItems || {},
    equippedItem: state.player.equippedItem || "",
    ownedAvatarItems: state.player.ownedAvatarItems || { ...DEFAULT_OWNED_AVATAR_ITEMS },
    equippedAvatar: state.player.equippedAvatar || { ...DEFAULT_AVATAR },
    ownedThemes: state.player.ownedThemes || {},
    equippedTheme: state.player.equippedTheme || "",
    ownedPets: state.player.ownedPets || {},
    equippedPet: state.player.equippedPet || "",
    petCare: normalizePetCare(state.player.petCare),
    rewardClaims: normalizeRewardClaims(state.player.rewardClaims),
    updatedAt: serverTimestamp()
  }, { merge: true }).catch(markSyncFailure);
}

function markSyncFailure(error) {
  console.error(error);
  dom.syncStatus.textContent = isFirebasePermissionError(error)
    ? "Firebase 규칙 배포 필요 · 기기 저장됨"
    : "동기화 실패 · 기기 저장됨";
}

function isFirebasePermissionError(error) {
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();
  return code.includes("permission-denied")
    || message.includes("permission-denied")
    || message.includes("missing or insufficient permissions");
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
  dom.claimMissionBtn.addEventListener("click", claimDailyMissionReward);
  dom.shopItemGrid.addEventListener("click", handleShopItemClick);
  dom.shopThemeGrid.addEventListener("click", handleShopThemeClick);
  dom.shopPetGrid.addEventListener("click", handleShopPetClick);
  dom.shopFoodGrid.addEventListener("click", handleShopFoodClick);
  dom.shopAvatarTabs?.addEventListener("click", handleAvatarTabClick);
  dom.shopAvatarGrid?.addEventListener("click", handleAvatarShopClick);
  dom.petFoodList.addEventListener("click", handlePetFoodClick);
  dom.petFeedCookieBtn.addEventListener("click", feedPetWithCookies);
  dom.petPlayBtn.addEventListener("click", playWithCarePet);
  dom.petShopBtn.addEventListener("click", () => navigate("shop"));
  dom.requestDaisoVoucherBtn.addEventListener("click", requestDaisoVoucher);
  dom.manageRewardList.addEventListener("click", handleRewardAdminClick);

  dom.cardCategory.addEventListener("change", () => selectCategory(dom.cardCategory.value));
  dom.gameCategory.addEventListener("change", () => {
    selectCategory(dom.gameCategory.value);
    startRound();
  });
  dom.listCategory.addEventListener("change", () => selectCategory(dom.listCategory.value));
  dom.manageSearch.addEventListener("input", () => {
    state.manageSearch = dom.manageSearch.value;
    renderWordList();
  });

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

  (dom.avatarPreview || dom.petEmoji).addEventListener("click", petReaction);

  document.addEventListener("click", (event) => {
    if (event.target.closest("button")) playSfx("click");
  }, { capture: true });
}

function handleGameBack() {
  if (state.gameMode === "blank" || state.gameMode === "type") {
    startRound("choice");
    showToast("게임 선택", "다른 게임 모드를 선택할 수 있어요");
    return;
  }

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
  if (screen === "manage") loadRewardAdminClaims();
  if (screen === "game") startRound("choice");
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
  applyEquippedTheme();

  const pet = getCurrentMonster();
  renderAvatar(dom.avatarPreview, state.player.equippedAvatar);
  renderEquippedAccessory();
  dom.petName.textContent = pet.name;
  dom.petMsg.textContent = pet.message;
  dom.xpFill.style.width = `${pet.percent}%`;
  dom.levelText.textContent = `수집 ${pet.unlockedCount} / ${MONSTER_CATALOG.length}`;
  dom.nextXpText.textContent = pet.complete ? "도감 완성!" : `다음까지 ${pet.remaining}XP`;
  dom.homeMonsterCount.textContent = `${pet.unlockedCount} / ${MONSTER_CATALOG.length}`;
  dom.homeWordCount.textContent = state.words.length;
  dom.homeKnownCount.textContent = knownCardCount();
  dom.homeBestCombo.textContent = state.player.bestCombo || 0;

  renderCategories();
  renderSelects();
  renderCard();
  renderWordList();
  renderCollection();
  renderDailyMission();
  renderShop();
  renderPetCare();
  renderRewardClaims();
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
      <button class="cat-btn ${state.selectedCategoryId === category.id ? "active" : ""}" data-cat="${escapeHtml(category.id)}" title="${escapeHtml(category.name)} 단어 ${count}개">
        <span>${escapeHtml(category.emoji)} ${escapeHtml(category.name)}</span><b>${count}</b>
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
  const list = filteredWords();
  if (dom.cardProgress) {
    dom.cardProgress.textContent = list.length ? `카드 ${state.cardIndex + 1} / ${list.length}` : "카드 0 / 0";
  }
  [$("#cardSpeakBtn"), $("#prevCardBtn"), $("#nextCardBtn"), $("#knowBtn"), $("#hardBtn")].forEach((button) => {
    if (button) button.disabled = !word || state.cardLocked;
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

  recordCardMissionView(word);

  dom.cardEmoji.textContent = word.emoji || "📘";
  dom.cardWord.textContent = word.word;
  dom.cardWord.style.fontSize = getWordFontSize(word.word, 68, 24);
  dom.cardWord.classList.toggle("long-word", word.word.length >= 11);
  dom.cardMeaning.textContent = word.meaning || "뜻 입력";
  dom.cardCategoryName.textContent = getCategoryLabel(word.categoryId);

  const alreadyKnown = isKnownCard(word);
  const knowButton = $("#knowBtn");
  if (knowButton) {
    knowButton.textContent = alreadyKnown ? "✅ 완료 · 다음" : `알아요 +${SCORE_REWARDS.card}`;
    knowButton.classList.toggle("good", !alreadyKnown);
  }
}

function renderWordList() {
  const list = manageFilteredWords().slice(0, MAX_LIST_ROWS); // 관리 화면은 CSS 내부 스크롤로 전체 관리
  const total = filteredWords().length;
  const keyword = normalizedSearchTerm();

  if (dom.manageSearch && dom.manageSearch.value !== state.manageSearch) {
    dom.manageSearch.value = state.manageSearch;
  }

  if (!list.length) {
    dom.wordList.innerHTML = `<div class="empty-list"><strong>${keyword ? "검색 결과가 없어요" : "이 카테고리에 단어가 없어요"}</strong><span>${keyword ? "다른 단어나 뜻으로 검색해 보세요." : "위의 추가 버튼으로 단어를 넣어 주세요."}</span></div>`;
    return;
  }

  dom.wordList.innerHTML = `
    <div class="list-summary">${keyword ? `검색 ${list.length}개 / ` : ""}총 ${total}개 단어</div>
    ${list.map((word) => `
    <div class="word-row">
      <div style="font-size:30px">${escapeHtml(word.emoji || "📘")}</div>
      <div>
        <b>${escapeHtml(word.word)}</b>
        <small>${escapeHtml(word.meaning || "뜻 입력")} · ${escapeHtml(getCategoryLabel(word.categoryId))}</small>
      </div>
      <button class="delete-btn" data-delete="${escapeHtml(word.id)}">삭제</button>
    </div>
  `).join("")}
  `;

  dom.wordList.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => deleteWord(button.dataset.delete));
  });
}

function filteredWords() {
  if (state.selectedCategoryId === "all") return state.words;
  return state.words.filter((word) => word.categoryId === state.selectedCategoryId);
}

function normalizedSearchTerm() {
  return String(state.manageSearch || "").trim().toLowerCase();
}

function manageFilteredWords() {
  const keyword = normalizedSearchTerm();
  const list = filteredWords();
  if (!keyword) return list;

  return list.filter((word) => [word.word, word.meaning, getCategoryLabel(word.categoryId)]
    .some((value) => String(value || "").toLowerCase().includes(keyword)));
}

function knownCardCount() {
  return state.words.reduce((count, word) => count + (isKnownCard(word) ? 1 : 0), 0);
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
  if (state.round.active) rememberQuestionWord(state.currentWord, state.gameMode);
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

  showToast(`${config.label} 도전`, `${config.count}문제 · 최대 보너스 +${config.bonus}`);
  newQuestion();
}

function buildRoundQuestions(source, mode) {
  const count = MODE_ROUNDS[mode].count;
  const words = takeRoundWords(source, mode, count);
  return words.map((word) => ({ mode, word }));
}

function takeRoundWords(source, mode, count) {
  const usable = source.filter((word) => word?.id);
  if (!usable.length) return [];

  const allIds = new Set(usable.map((word) => word.id));
  const history = normalizeQuestionHistory(state.player.questionHistory);
  const key = questionHistoryKey(mode);
  let used = Array.isArray(history[key])
    ? history[key].filter((id) => allIds.has(id))
    : [];
  let usedSet = new Set(used);
  const selected = [];
  const selectedSet = new Set();

  while (selected.length < count) {
    let candidates = usable.filter((word) => !usedSet.has(word.id) && !selectedSet.has(word.id));
    if (!candidates.length) candidates = usable.filter((word) => !usedSet.has(word.id));
    if (!candidates.length) {
      used = [];
      usedSet = new Set();
      candidates = usable.filter((word) => !selectedSet.has(word.id));
    }
    if (!candidates.length) candidates = usable;

    const word = shuffle(candidates)[0];
    selected.push(word);
    selectedSet.add(word.id);

    if (!usedSet.has(word.id)) {
      used.push(word.id);
      usedSet.add(word.id);
    }

    if (usedSet.size >= allIds.size) {
      used = [];
      usedSet = new Set();
    }
  }

  return selected;
}

function questionHistoryKey(mode) {
  return `${state.selectedCategoryId || "all"}:${mode}`;
}

function rememberQuestionWord(word, mode = state.gameMode) {
  if (!word?.id) return;

  const allIds = new Set(filteredWords().map((item) => item.id));
  if (!allIds.has(word.id)) return;

  const history = normalizeQuestionHistory(state.player.questionHistory);
  const key = questionHistoryKey(mode);
  const used = Array.isArray(history[key])
    ? history[key].filter((id) => allIds.has(id))
    : [];

  if (!used.includes(word.id)) used.push(word.id);
  history[key] = used.length >= allIds.size ? [] : used;
  state.player.questionHistory = history;
  saveLocal();
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
  const earnedBonus = roundBonusEarned(config);
  state.round.active = false;
  state.round.completed = true;
  state.currentWord = null;
  state.questionLocked = true;
  updateTypingModeClass();

  state.player.score += earnedBonus;
  state.player.coin += Math.ceil(earnedBonus / 5);
  state.player.xp += earnedBonus;
  if (earnedBonus > 0) successFx(earnedBonus);
  syncPlayer();
  render();

  dom.feedback.textContent = `${config.label} 완주 보너스 +${earnedBonus} 획득!`;
  dom.feedback.className = earnedBonus > 0 ? "feedback good" : "feedback";
  dom.gameBox.className = "game-box";
  dom.gameBox.innerHTML = `
    <div class="round-complete">
      <span>🏅</span>
      <h3>${config.label} 완주!</h3>
      <p>정답 ${state.round.correct} / ${config.count}</p>
      <strong>보너스 +${earnedBonus} / ${config.bonus} XP</strong>
      <button id="restartRoundBtn" class="soft-btn good">${config.label} 다시 도전</button>
    </div>
  `;
  $("#restartRoundBtn").addEventListener("click", () => startRound(state.gameMode));
}

function roundBonusEarned(config) {
  if (!config?.count) return 0;
  const correct = Math.max(0, Math.min(config.count, state.round.correct || 0));
  return Math.round(config.bonus * (correct / config.count));
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
  dom.roundBonus.textContent = `최대 +${config.bonus}`;
  if (dom.modeGuide) dom.modeGuide.textContent = MODE_GUIDES[state.gameMode] || "10문제를 풀고 완주 보너스를 받아요.";

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
    <button id="skipQuestionBtn" class="soft-btn skip">몰라요</button>
  `;

  dom.gameBox.querySelectorAll("[data-word-id]").forEach((button) => {
    button.addEventListener("click", () => {
      checkAnswer(button.dataset.wordId === state.currentWord.id, SCORE_REWARDS.choice, button.textContent);
    });
  });

  $("#skipQuestionBtn").addEventListener("click", skipQuestion);
}

function renderBlockGame() {
  dom.gameBox.classList.add("block-game");
  dom.gameBox.innerHTML = `
    ${questionHeader()}
    <div id="answerBank" class="bank answer-bank"></div>
    <div id="letterBank" class="bank"></div>
    <div class="screen-row game-actions">
      <button id="clearTilesBtn" class="soft-btn">지우기</button>
      <button id="skipQuestionBtn" class="soft-btn skip">몰라요</button>
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
    checkAnswer(answer === spellingLetters(state.currentWord.word), SCORE_REWARDS.block, answer);
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
      <div class="question-meaning">${escapeHtml(state.currentWord.meaning || "뜻 입력")}</div>
      <div class="tag">${escapeHtml(getCategoryLabel(state.currentWord.categoryId))}</div>
    </div>
    <div class="question-word long-fit" style="font-size:${getWordFontSize(state.currentWord.word, 56, 24)}">${masked}</div>
    <input id="answerInput" class="type-input" aria-label="정답 입력" maxlength="${MAX_WORD_LENGTH}" placeholder="영어 단어" autocomplete="off" autocapitalize="none" spellcheck="false" inputmode="text" lang="en" />
    <div class="screen-row game-actions">
      <button id="skipQuestionBtn" class="soft-btn skip">몰라요</button>
      <button id="checkInputBtn" class="soft-btn good">확인 +${SCORE_REWARDS.blank}</button>
    </div>
  `;

  const input = $("#answerInput");
  const check = () => checkAnswer(
    normalizeAnswer(input.value) === normalizeAnswer(state.currentWord.word),
    SCORE_REWARDS.blank,
    input.value
  );
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
      <div class="question-meaning">${escapeHtml(state.currentWord.meaning || "")}</div>
      <div class="tag">${escapeHtml(getCategoryLabel(state.currentWord.categoryId))}</div>
    </div>
    <input id="answerInput" class="type-input" aria-label="정답 입력" maxlength="${MAX_WORD_LENGTH}" placeholder="영어 단어" autocomplete="off" autocapitalize="none" spellcheck="false" inputmode="text" lang="en" />
    <div class="screen-row game-actions">
      <button id="skipQuestionBtn" class="soft-btn skip">몰라요</button>
      <button id="checkInputBtn" class="soft-btn good">확인 +${SCORE_REWARDS.type}</button>
    </div>
  `;

  $("#speakQuestionBtn").addEventListener("click", () => speak(state.currentWord.word));

  const input = $("#answerInput");
  const check = () => checkAnswer(
    normalizeAnswer(input.value) === normalizeAnswer(state.currentWord.word),
    SCORE_REWARDS.type,
    input.value
  );
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
  if (state.gameMode === "type") {
    recordDailyMission("writingAttempts");
  }
  clearTimeout(nextTimer);
  state.player.combo = 0;

  const progress = state.player.progress[state.currentWord.id] || { correct: 0, wrong: 0, skip: 0 };
  progress.skip = (progress.skip || 0) + 1;
  state.player.progress[state.currentWord.id] = progress;

  playSfx("click");
  syncPlayer();
  renderAnswerReview("skip");
}

function checkAnswer(isCorrect, points, submittedAnswer = "") {
  if (state.questionLocked || !state.currentWord) return;

  state.questionLocked = true;

  if (state.gameMode === "type") {
    recordDailyMission("writingAttempts");
  }

  if (isCorrect) {
    recordDailyMission("gameCorrect");
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

  markWrong(state.currentWord, false);
  clearTimeout(nextTimer);
  renderAnswerReview("wrong", submittedAnswer);
}

function renderAnswerReview(reason, submittedAnswer = "") {
  const word = state.currentWord;
  if (!word) return;

  clearTimeout(nextTimer);
  const isSkip = reason === "skip";
  const title = isSkip ? "정답 확인" : "다시 볼 문제";
  const message = isSkip
    ? "몰랐던 단어를 확인하고 다음 문제로 넘어가세요."
    : "틀린 답을 정답과 비교하고 다음 문제로 넘어가세요.";
  const cleanedSubmitted = limitText(submittedAnswer, MAX_WORD_LENGTH) || "입력 없음";

  dom.feedback.textContent = message;
  dom.feedback.className = "feedback bad";
  dom.gameBox.className = "game-box answer-review-mode";
  dom.gameBox.innerHTML = `
    <div class="answer-review">
      <span class="review-label">${title}</span>
      <strong class="review-word">${escapeHtml(word.word)}</strong>
      <p class="review-meaning">${escapeHtml(word.meaning || "뜻 입력")}</p>
      <dl class="review-details">
        ${isSkip ? "" : `<div><dt>내 답</dt><dd>${escapeHtml(cleanedSubmitted)}</dd></div>`}
        <div><dt>철자</dt><dd>${escapeHtml(formatSpelling(word.word))}</dd></div>
        <div><dt>분류</dt><dd>${escapeHtml(getCategoryLabel(word.categoryId))}</dd></div>
      </dl>
      <div class="screen-row game-actions review-actions">
        <button id="speakAnswerBtn" class="soft-btn">🔊 듣기</button>
        <button id="nextReviewBtn" class="soft-btn good">다음 문제</button>
      </div>
    </div>
  `;

  let advanced = false;
  $("#speakAnswerBtn").addEventListener("click", () => speak(word.word));
  $("#nextReviewBtn").addEventListener("click", () => {
    if (advanced) return;
    advanced = true;
    $("#nextReviewBtn").disabled = true;
    clearTimeout(nextTimer);
    advanceRound();
  });
  speak(word.word);
}

function getShopItem(itemId) {
  return SHOP_ITEMS.find((item) => item.id === itemId);
}

function getAvatarItemsBySlot(slot) {
  return AVATAR_ITEMS.filter((item) => item.slot === slot);
}

function getAvatarItem(itemId) {
  return AVATAR_ITEM_MAP[itemId] || null;
}

function renderAvatar(targetElement, equippedAvatar = state.player.equippedAvatar, options = {}) {
  if (!targetElement) {
    if (dom.petEmoji) dom.petEmoji.textContent = getCurrentMonster().emoji;
    return;
  }

  const avatarSource = {
    ...(equippedAvatar || {}),
    ...(options.draftAvatar || {})
  };
  const avatar = normalizeEquippedAvatar(avatarSource, state.player.ownedAvatarItems, {
    allowUnowned: Boolean(options.draftAvatar) || Boolean(options.allowUnowned)
  });
  const layerOrder = ["body", "outfit", "face", "hair", "accessory"];
  const layers = layerOrder
    .map((slot) => avatar[slot])
    .filter(Boolean)
    .map((itemId) => getAvatarItem(itemId))
    .filter(Boolean);

  targetElement.classList.add("avatar-preview");
  if (options.compact) targetElement.classList.add("compact");
  targetElement.classList.toggle("drafting", Boolean(options.draftAvatar));
  targetElement.innerHTML = layers.map((item) => (
    `<img class="avatar-layer avatar-layer-${escapeHtml(item.slot)}" src="${escapeHtml(item.src)}" alt="">`
  )).join("");
}

function getShopTheme(themeId) {
  return SHOP_THEMES.find((theme) => theme.id === themeId);
}

function getShopPet(petId) {
  return SHOP_PETS.find((pet) => pet.id === petId);
}

function getShopFood(foodId) {
  return SHOP_FOODS.find((food) => food.id === foodId);
}

function makePetCare() {
  return {
    xp: 0,
    mood: 70,
    hunger: 45,
    foods: {}
  };
}

function normalizePetCare(care) {
  const raw = care && typeof care === "object" && !Array.isArray(care) ? care : {};
  const foods = raw.foods && typeof raw.foods === "object" && !Array.isArray(raw.foods)
    ? Object.fromEntries(
      Object.entries(raw.foods)
        .map(([key, value]) => [key, safeCounter(value)])
        .filter(([, value]) => value > 0)
    )
    : {};

  return {
    xp: safeCounter(raw.xp),
    mood: clampStat(raw.mood, 70),
    hunger: clampStat(raw.hunger, 45),
    foods
  };
}

function clampStat(value, fallback = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(100, Math.floor(number)));
}

function getCarePet() {
  return getShopPet(state.player.equippedPet);
}

function getPetCareStats() {
  const care = normalizePetCare(state.player.petCare);
  let level = 1;
  let currentLevelXp = 0;
  let nextLevelXp = getPetLevelXpRequirement(level);

  while (level < PET_MAX_LEVEL && care.xp >= nextLevelXp) {
    level += 1;
    currentLevelXp = nextLevelXp;
    nextLevelXp += getPetLevelXpRequirement(level);
  }

  const levelSpan = Math.max(1, nextLevelXp - currentLevelXp);
  const percent = level >= PET_MAX_LEVEL
    ? 100
    : Math.min(100, Math.floor(((care.xp - currentLevelXp) / levelSpan) * 100));
  return { ...care, level, percent, next: level >= PET_MAX_LEVEL ? 0 : nextLevelXp - care.xp };
}

function getPetLevelXpRequirement(level) {
  return PET_LEVEL_XP_BASE + ((level - 1) * PET_LEVEL_XP_GROWTH);
}

function getPetGrowthStage(level) {
  if (level >= 12) return { label: "반짝 단계", size: 96 };
  if (level >= 7) return { label: "튼튼 단계", size: 90 };
  if (level >= 3) return { label: "꼬마 단계", size: 84 };
  return { label: "아기 단계", size: 76 };
}

function renderEquippedAccessory() {
  if (!dom.equippedAccessory) return;
  const item = getShopItem(state.player.equippedItem);
  dom.equippedAccessory.textContent = item ? item.emoji : "";
  dom.equippedAccessory.title = item ? `착용 중: ${item.name}` : "";
}

function applyEquippedTheme() {
  const themeClasses = SHOP_THEMES.map((theme) => theme.className);
  document.body.classList.remove(...themeClasses);
  const theme = getShopTheme(state.player.equippedTheme);
  if (theme) document.body.classList.add(theme.className);
}

function renderShop() {
  if (!dom.shopItemGrid) return;

  dom.shopCookieCount.textContent = `🍪 ${state.player.coin || 0}`;
  dom.shopItemGrid.innerHTML = SHOP_ITEMS.map((item) => renderShopProduct(item, "item")).join("");
  dom.shopThemeGrid.innerHTML = SHOP_THEMES.map((theme) => renderShopProduct(theme, "theme")).join("");
  dom.shopPetGrid.innerHTML = SHOP_PETS.map(renderPetProduct).join("");
  dom.shopFoodGrid.innerHTML = SHOP_FOODS.map(renderFoodProduct).join("");
  renderAvatarShop();
  renderVoucherList(dom.shopVoucherList, false);
}

function renderAvatarShop() {
  if (!dom.shopAvatarGrid) return;

  const draft = state.avatarPreviewDraft || null;
  const previewAvatar = {
    ...normalizeEquippedAvatar(state.player.equippedAvatar, state.player.ownedAvatarItems),
    ...(draft || {})
  };
  renderAvatar(dom.shopAvatarPreview, state.player.equippedAvatar, {
    draftAvatar: draft,
    allowUnowned: true
  });
  renderAvatarParts(previewAvatar, draft);
  dom.shopAvatarTabs.innerHTML = Object.entries(AVATAR_SLOT_LABELS).map(([slot, label]) => (
    `<button class="avatar-tab ${state.shopAvatarSlot === slot ? "active" : ""}" data-avatar-slot="${escapeHtml(slot)}">${escapeHtml(label)}</button>`
  )).join("");
  dom.shopAvatarGrid.innerHTML = getAvatarItemsBySlot(state.shopAvatarSlot)
    .map(renderAvatarProduct)
    .join("");
}

function renderAvatarParts(previewAvatar, draft) {
  if (!dom.shopAvatarParts) return;

  const slots = ["face", "hair", "outfit", "accessory"];
  dom.shopAvatarParts.innerHTML = slots.map((slot) => {
    const item = getAvatarItem(previewAvatar?.[slot]);
    const isDraft = Boolean(draft?.[slot]);
    return `
      <div class="avatar-part-pill ${isDraft ? "draft" : ""}">
        <span>${escapeHtml(AVATAR_SLOT_LABELS[slot])}</span>
        <b>${escapeHtml(item?.name || "없음")}</b>
      </div>
    `;
  }).join("");
}

function renderAvatarProduct(item) {
  const owned = Boolean(state.player.ownedAvatarItems?.[item.id]);
  const equipped = state.player.equippedAvatar?.[item.slot] === item.id;
  const previewing = state.avatarPreviewDraft?.[item.slot] === item.id;
  const canBuy = (state.player.coin || 0) >= item.cost;
  const action = owned ? "equip" : "buy";
  const label = equipped ? "착용 중" : owned ? "착용" : `${item.cost}쿠키 구매`;
  const disabled = equipped || (!owned && !canBuy) ? "disabled" : "";
  const status = equipped ? "현재 착용" : owned ? "보유 중" : canBuy ? `가격 ${item.cost}` : `쿠키 부족 ${item.cost}`;
  const rarity = item.rarity || "basic";
  const rarityLabel = AVATAR_RARITY_LABELS[rarity] || "BASIC";

  return `
    <article class="shop-product avatar-product rarity-${escapeHtml(rarity)} ${owned ? "owned" : ""} ${equipped ? "equipped" : ""} ${previewing ? "previewing" : ""}" data-avatar-preview-id="${escapeHtml(item.id)}">
      <div class="avatar-item-preview">
        <img src="${escapeHtml(item.src)}" alt="">
      </div>
      <div class="avatar-product-copy">
        <span class="rarity-badge rarity-${escapeHtml(rarity)}">${escapeHtml(rarityLabel)}</span>
        <strong>${escapeHtml(item.name)}</strong>
        <small>${escapeHtml(status)}</small>
      </div>
      <button class="soft-btn ${owned ? "" : "good"}" data-avatar-action="${action}" data-avatar-id="${escapeHtml(item.id)}" ${disabled}>${escapeHtml(label)}</button>
    </article>
  `;
}
function renderShopProduct(product, type) {
  const owned = type === "item"
    ? Boolean(state.player.ownedItems?.[product.id])
    : Boolean(state.player.ownedThemes?.[product.id]);
  const equipped = type === "item"
    ? state.player.equippedItem === product.id
    : state.player.equippedTheme === product.id;
  const action = owned ? "equip" : "buy";
  const label = equipped ? "착용중" : owned ? "착용" : `${product.cost}쿠키 구매`;
  const disabled = equipped ? "disabled" : "";

  return `
    <article class="shop-product ${owned ? "owned" : ""} ${equipped ? "equipped" : ""}">
      <div class="shop-product-emoji">${escapeHtml(product.emoji)}</div>
      <div>
        <strong>${escapeHtml(product.name)}</strong>
        <small>${owned ? "구매완료" : `🍪 ${product.cost}`}</small>
      </div>
      <button class="soft-btn ${owned ? "" : "good"}" data-shop-type="${type}" data-shop-action="${action}" data-shop-id="${escapeHtml(product.id)}" ${disabled}>${label}</button>
    </article>
  `;
}

function renderPetProduct(pet) {
  const owned = Boolean(state.player.ownedPets?.[pet.id]);
  const equipped = state.player.equippedPet === pet.id;
  const action = owned ? "equip" : "buy";
  const label = equipped ? "함께 지내는 중" : owned ? "함께 지내기" : `${pet.cost}쿠키 입양`;

  return `
    <article class="shop-product pet-product ${owned ? "owned" : ""} ${equipped ? "equipped" : ""}">
      <div class="shop-product-emoji">${escapeHtml(pet.emoji)}</div>
      <div>
        <strong>${escapeHtml(pet.name)}</strong>
        <small>${owned ? pet.trait : `🍪 ${pet.cost} · ${pet.trait}`}</small>
      </div>
      <button class="soft-btn ${owned ? "" : "good"}" data-pet-action="${action}" data-pet-id="${escapeHtml(pet.id)}" ${equipped ? "disabled" : ""}>${label}</button>
    </article>
  `;
}

function renderFoodProduct(food) {
  const count = safeCounter(state.player.petCare?.foods?.[food.id]);
  return `
    <article class="shop-product food-product">
      <div class="shop-product-emoji">${escapeHtml(food.emoji)}</div>
      <div>
        <strong>${escapeHtml(food.name)}</strong>
        <small>보유 ${count}개 · 성장 +${food.xp}</small>
      </div>
      <button class="soft-btn good" data-food-id="${escapeHtml(food.id)}">🍪 ${food.cost} 구매</button>
    </article>
  `;
}

function handleShopItemClick(event) {
  const button = event.target.closest("[data-shop-id]");
  if (!button) return;

  const item = getShopItem(button.dataset.shopId);
  if (!item) return;
  if (button.dataset.shopAction === "buy") buyShopItem(item);
  else equipShopItem(item.id);
}

function handleShopThemeClick(event) {
  const button = event.target.closest("[data-shop-id]");
  if (!button) return;

  const theme = getShopTheme(button.dataset.shopId);
  if (!theme) return;
  if (button.dataset.shopAction === "buy") buyShopTheme(theme);
  else equipShopTheme(theme.id);
}

function handleShopPetClick(event) {
  const button = event.target.closest("[data-pet-id]");
  if (!button) return;

  const pet = getShopPet(button.dataset.petId);
  if (!pet) return;
  if (button.dataset.petAction === "buy") buyShopPet(pet);
  else equipShopPet(pet.id);
}

function handleShopFoodClick(event) {
  const button = event.target.closest("[data-food-id]");
  if (!button) return;

  const food = getShopFood(button.dataset.foodId);
  if (!food) return;
  buyPetFood(food);
}

function handleAvatarTabClick(event) {
  const button = event.target.closest("[data-avatar-slot]");
  if (!button) return;

  state.shopAvatarSlot = button.dataset.avatarSlot || "face";
  state.avatarPreviewDraft = null;
  renderAvatarShop();
}

function handleAvatarShopClick(event) {
  const button = event.target.closest("[data-avatar-id]");
  const card = event.target.closest("[data-avatar-preview-id]");
  const item = getAvatarItem(button?.dataset.avatarId || card?.dataset.avatarPreviewId);
  if (!item) return;

  state.avatarPreviewDraft = { [item.slot]: item.id };

  if (!button) {
    renderAvatarShop();
    return;
  }

  if (button.dataset.avatarAction === "buy") buyAvatarItem(item);
  else equipAvatarItem(item.id);
}

function spendCookies(cost) {
  if ((state.player.coin || 0) < cost) {
    showToast("쿠키가 부족해요", `필요 쿠키 ${cost}개`);
    playSfx("bad");
    return false;
  }

  state.player.coin -= cost;
  return true;
}

function buyShopItem(item) {
  state.player.ownedItems ||= {};
  if (state.player.ownedItems[item.id]) {
    equipShopItem(item.id);
    return;
  }
  if (!spendCookies(item.cost)) return;

  state.player.ownedItems[item.id] = true;
  state.player.equippedItem = item.id;
  syncPlayer();
  render();
  showToast("구매 완료", `${item.emoji} ${item.name} 착용!`);
}

function buyAvatarItem(item) {
  state.player.ownedAvatarItems ||= { ...DEFAULT_OWNED_AVATAR_ITEMS };
  if (state.player.ownedAvatarItems[item.id]) {
    equipAvatarItem(item.id);
    return;
  }
  if (!spendCookies(item.cost)) return;

  state.player.ownedAvatarItems[item.id] = true;
  equipAvatarItem(item.id, false);
  state.avatarPreviewDraft = null;
  syncPlayer();
  render();
  pulseAvatarRoom("sparkle");
  showToast("구매 완료", `${item.name} 착용!`);
}

function equipAvatarItem(itemId, shouldSync = true) {
  const item = getAvatarItem(itemId);
  if (!item || !state.player.ownedAvatarItems?.[itemId]) return;

  state.player.equippedAvatar = {
    ...normalizeEquippedAvatar(state.player.equippedAvatar, state.player.ownedAvatarItems),
    [item.slot]: item.id
  };
  state.avatarPreviewDraft = null;

  if (shouldSync) {
    syncPlayer();
    render();
    pulseAvatarRoom("equip");
    showToast("착용 완료", item.name);
  }
}

function pulseAvatarRoom(type = "equip") {
  const target = dom.shopAvatarPreview?.closest(".avatar-room") || dom.shopAvatarPreview || dom.avatarPreview;
  if (!target) return;

  target.classList.remove("avatar-sparkle", "avatar-equipped-pop");
  void target.offsetWidth;
  target.classList.add(type === "sparkle" ? "avatar-sparkle" : "avatar-equipped-pop");
  setTimeout(() => {
    target.classList.remove("avatar-sparkle", "avatar-equipped-pop");
  }, 850);
}
function equipShopItem(itemId) {
  if (!state.player.ownedItems?.[itemId]) return;
  state.player.equippedItem = itemId;
  syncPlayer();
  render();
  showToast("착용 완료", getShopItem(itemId)?.name || "아이템");
}

function buyShopTheme(theme) {
  state.player.ownedThemes ||= {};
  if (state.player.ownedThemes[theme.id]) {
    equipShopTheme(theme.id);
    return;
  }
  if (!spendCookies(theme.cost)) return;

  state.player.ownedThemes[theme.id] = true;
  state.player.equippedTheme = theme.id;
  syncPlayer();
  render();
  showToast("배경 구매", `${theme.emoji} ${theme.name}`);
}

function equipShopTheme(themeId) {
  if (!state.player.ownedThemes?.[themeId]) return;
  state.player.equippedTheme = themeId;
  syncPlayer();
  render();
  showToast("배경 적용", getShopTheme(themeId)?.name || "배경");
}

function buyShopPet(pet) {
  state.player.ownedPets ||= {};
  if (state.player.ownedPets[pet.id]) {
    equipShopPet(pet.id);
    return;
  }
  if (!spendCookies(pet.cost)) return;

  state.player.ownedPets[pet.id] = true;
  state.player.equippedPet = pet.id;
  state.player.petCare = normalizePetCare(state.player.petCare);
  state.player.petCare.mood = Math.max(state.player.petCare.mood, 80);
  state.player.petCare.hunger = Math.max(state.player.petCare.hunger, 55);
  syncPlayer();
  render();
  showToast("펫 입양!", `${pet.emoji} ${pet.name}와 함께해요`);
}

function equipShopPet(petId) {
  if (!state.player.ownedPets?.[petId]) return;
  state.player.equippedPet = petId;
  syncPlayer();
  render();
  showToast("펫 변경", getShopPet(petId)?.name || "펫");
}

function buyPetFood(food) {
  if (!spendCookies(food.cost)) return;

  state.player.petCare = normalizePetCare(state.player.petCare);
  state.player.petCare.foods[food.id] = safeCounter(state.player.petCare.foods[food.id]) + 1;
  syncPlayer();
  render();
  showToast("먹이 구매", `${food.emoji} ${food.name} 보관함에 넣었어요`);
}

function renderPetCare() {
  if (!dom.petCareEmoji) return;

  const pet = getCarePet();
  const stats = getPetCareStats();
  const hasPet = Boolean(pet);
  const stage = getPetGrowthStage(stats.level);
  const face = hasPet ? pet.emoji : "🥚";

  dom.petCareEmoji.textContent = face;
  dom.petCareEmoji.style.setProperty("--pet-size", `${hasPet ? stage.size : 76}px`);
  dom.petCareEmoji.classList.toggle("sleepy", hasPet && stats.hunger < 25);
  dom.petCareName.textContent = hasPet ? pet.name : "아직 펫이 없어요";
  dom.petCareLevel.textContent = hasPet ? `Lv.${stats.level} · ${stage.label}` : "입양 대기";
  dom.petCareMessage.textContent = hasPet
    ? getPetCareMessage(stats)
    : "쿠키샵에서 마음에 드는 펫을 입양해 주세요.";
  dom.petCareXpFill.style.width = `${hasPet ? stats.percent : 0}%`;
  dom.petCareMoodFill.style.width = `${hasPet ? stats.mood : 0}%`;
  dom.petCareHungerFill.style.width = `${hasPet ? stats.hunger : 0}%`;
  dom.petCareXpText.textContent = hasPet ? `성장 ${stats.percent}% · 다음까지 ${stats.next}XP` : "펫 입양 필요";
  dom.petCareMoodText.textContent = hasPet ? `기분 ${stats.mood}` : "-";
  dom.petCareHungerText.textContent = hasPet ? `포만감 ${stats.hunger}` : "-";
  dom.petFeedCookieBtn.disabled = !hasPet;
  dom.petPlayBtn.disabled = !hasPet;

  dom.petFoodList.innerHTML = hasPet
    ? SHOP_FOODS.map(renderCareFood).join("")
    : `<div class="empty-pet-food">쿠키샵에서 펫과 먹이를 살 수 있어요.</div>`;
}

function renderCareFood(food) {
  const count = safeCounter(state.player.petCare?.foods?.[food.id]);
  return `
    <button class="pet-food-btn" data-care-food-id="${escapeHtml(food.id)}" ${count ? "" : "disabled"}>
      <span>${escapeHtml(food.emoji)}</span>
      <b>${escapeHtml(food.name)}</b>
      <small>${count}개 · +${food.xp}XP</small>
    </button>
  `;
}

function getPetCareMessage(stats) {
  if (stats.hunger < 25) return "배가 고파서 간식을 기다리고 있어요.";
  if (stats.mood < 30) return "조금 심심해 보여요. 쓰다듬어 주세요.";
  if (stats.percent >= 85) return "곧 한 단계 더 자랄 것 같아요!";
  if (stats.level >= 10) return "많이 자라서 반짝반짝 자신감이 넘쳐요.";
  return "오늘도 쿠키 에너지로 쑥쑥 자라고 있어요.";
}

function handlePetFoodClick(event) {
  const button = event.target.closest("[data-care-food-id]");
  if (!button) return;

  const food = getShopFood(button.dataset.careFoodId);
  if (food) feedPet(food);
}

function feedPet(food) {
  const pet = getCarePet();
  if (!pet) {
    showToast("펫이 없어요", "쿠키샵에서 먼저 입양해 주세요");
    return;
  }

  state.player.petCare = normalizePetCare(state.player.petCare);
  const count = safeCounter(state.player.petCare.foods[food.id]);
  if (!count) {
    showToast("먹이가 없어요", "쿠키샵에서 먹이를 구매해 주세요");
    return;
  }

  state.player.petCare.foods[food.id] = count - 1;
  if (state.player.petCare.foods[food.id] <= 0) delete state.player.petCare.foods[food.id];
  growPet(food);
  showToast("냠냠!", `${food.emoji} ${food.name} · 성장 +${food.xp}`);
}

function feedPetWithCookies() {
  const pet = getCarePet();
  if (!pet) {
    showToast("펫이 없어요", "쿠키샵에서 먼저 입양해 주세요");
    return;
  }
  if (!spendCookies(DIRECT_PET_SNACK_COST)) return;

  growPet({ xp: 12, hunger: 10, mood: 8 });
  showToast("쿠키 간식", `🍪 ${DIRECT_PET_SNACK_COST}개로 바로 먹였어요`);
}

function growPet(food) {
  state.player.petCare = normalizePetCare(state.player.petCare);
  state.player.petCare.xp += safeCounter(food.xp);
  state.player.petCare.hunger = clampStat(state.player.petCare.hunger + safeCounter(food.hunger));
  state.player.petCare.mood = clampStat(state.player.petCare.mood + safeCounter(food.mood));
  syncPlayer();
  render();
  petCareBurst();
}

function playWithCarePet() {
  const pet = getCarePet();
  if (!pet) {
    showToast("펫이 없어요", "쿠키샵에서 먼저 입양해 주세요");
    return;
  }

  state.player.petCare = normalizePetCare(state.player.petCare);
  state.player.petCare.mood = clampStat(state.player.petCare.mood + 14);
  state.player.petCare.hunger = clampStat(state.player.petCare.hunger - 5);
  syncPlayer();
  render();
  showToast("쓰담쓰담", `${pet.emoji} ${pet.name} 기분이 좋아졌어요`);
  petCareBurst();
}

function petCareBurst() {
  if (!dom.petCareEmoji) return;
  dom.petCareEmoji.classList.add("happy");
  setTimeout(() => dom.petCareEmoji.classList.remove("happy"), 700);
  heartBurst();
}

function requestDaisoVoucher() {
  if (!spendCookies(DAISO_VOUCHER_COOKIE_COST)) return;

  state.player.rewardClaims = normalizeRewardClaims(state.player.rewardClaims);
  state.player.rewardClaims.unshift({
    id: makeRewardClaimId(),
    type: "daiso_3000",
    label: DAISO_VOUCHER_LABEL,
    cost: DAISO_VOUCHER_COOKIE_COST,
    status: "requested",
    requestedAt: new Date().toISOString(),
    requestedBy: state.player.name || "Player",
    requestedByUid: state.firebaseUser?.uid || "local",
    usedAt: "",
    usedBy: ""
  });
  state.player.rewardClaims = state.player.rewardClaims.slice(0, 200);

  syncPlayer();
  render();
  showToast("상품권 신청", "관리자 확인을 기다려 주세요");
  if (state.screen === "manage") loadRewardAdminClaims();
}

function makeRewardClaimId() {
  return `reward_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function renderVoucherList(target, admin = false, claimsOverride = null) {
  if (!target) return;

  const claims = Array.isArray(claimsOverride)
    ? claimsOverride
    : normalizeRewardClaims(state.player.rewardClaims).map((claim) => ({
      ...claim,
      ownerId: state.firebaseUser?.uid || "local",
      ownerName: state.player.name || "Player"
    }));
  if (!claims.length) {
    target.innerHTML = `<div class="hint">상품권 신청 내역이 없어요.</div>`;
    return;
  }

  target.innerHTML = claims.map((claim) => {
    const used = claim.status === "used";
    const buyer = claim.requestedBy || claim.ownerName || "Player";
    const ownerId = claim.ownerId || state.firebaseUser?.uid || "local";
    const canUse = !used && (!state.firebaseReady || !admin || ownerId);
    return `
      <div class="voucher-row ${used ? "used" : "requested"}">
        <div>
          <b>${escapeHtml(claim.label)}</b>
          <small><span class="voucher-buyer">신청자 ${escapeHtml(buyer)}</span> · ${formatDateTime(claim.requestedAt)} · 쿠키 ${safeCounter(claim.cost) || DAISO_VOUCHER_COOKIE_COST}개${used && claim.usedBy ? ` · 처리 ${escapeHtml(claim.usedBy)}` : ""}</small>
        </div>
        <strong>${used ? "사용완료" : "신청됨"}</strong>
        ${admin ? `<button class="soft-btn good" data-use-reward="${escapeHtml(claim.id)}" data-reward-owner="${escapeHtml(ownerId)}" ${canUse ? "" : "disabled"}>사용완료</button>` : ""}
      </div>
    `;
  }).join("");
}

function renderRewardClaims() {
  if (state.screen === "manage" && state.firebaseReady) {
    if (!state.rewardAdminLoaded) {
      dom.manageRewardList.innerHTML = `<div class="hint">상품권 신청 내역을 불러오는 중이에요.</div>`;
      return;
    }
    renderVoucherList(dom.manageRewardList, true, state.rewardAdminClaims);
    return;
  }

  renderVoucherList(dom.manageRewardList, true);
}

async function loadRewardAdminClaims() {
  if (!dom.manageRewardList) return;

  if (!state.firebaseReady) {
    state.rewardAdminLoaded = true;
    state.rewardAdminPlayers = [{ id: "local", data: state.player }];
    state.rewardAdminClaims = normalizeRewardClaims(state.player.rewardClaims).map((claim) => ({
      ...claim,
      ownerId: "local",
      ownerName: state.player.name || "Player"
    }));
    renderRewardClaims();
    return;
  }

  state.rewardAdminLoaded = false;
  renderRewardClaims();

  try {
    const playersRef = collection(firebase.db, "classes", firebase.classId, "players");
    const snap = await getDocs(playersRef);
    state.rewardAdminPlayers = snap.docs.map((item) => ({ id: item.id, data: item.data() }));
    state.rewardAdminClaims = state.rewardAdminPlayers.flatMap((playerEntry) => {
      const player = playerEntry.data || {};
      const ownerName = limitText(player.name, MAX_PLAYER_NAME_LENGTH) || "Player";
      return normalizeRewardClaims(player.rewardClaims).map((claim) => ({
        ...claim,
        ownerId: playerEntry.id,
        ownerName,
        requestedBy: claim.requestedBy || ownerName,
        requestedByUid: claim.requestedByUid || playerEntry.id
      }));
    }).sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
    state.rewardAdminLoaded = true;
    renderRewardClaims();
  } catch (error) {
    markSyncFailure(error);
    state.rewardAdminLoaded = true;
    dom.manageRewardList.innerHTML = `<div class="hint">상품권 신청 내역을 불러오지 못했어요.</div>`;
  }
}

function handleRewardAdminClick(event) {
  const button = event.target.closest("[data-use-reward]");
  if (!button) return;
  markRewardClaimUsed(button.dataset.useReward, button.dataset.rewardOwner);
}

async function markRewardClaimUsed(claimId, ownerId = state.firebaseUser?.uid || "local") {
  const ownerEntry = state.rewardAdminPlayers.find((item) => item.id === ownerId);
  const sourcePlayer = ownerEntry?.data || state.player;
  const claims = normalizeRewardClaims(sourcePlayer.rewardClaims);
  const claim = claims.find((item) => item.id === claimId);
  if (!claim || claim.status === "used") return;

  claim.status = "used";
  claim.usedAt = new Date().toISOString();
  claim.usedBy = state.player.name || "관리자";

  if (state.firebaseReady && ownerId && ownerId !== "local") {
    try {
      await setDoc(doc(firebase.db, "classes", firebase.classId, "players", ownerId), {
        rewardClaims: claims,
        updatedAt: serverTimestamp()
      }, { merge: true });
      if (ownerId === state.firebaseUser?.uid) state.player.rewardClaims = claims;
      await loadRewardAdminClaims();
    } catch (error) {
      markSyncFailure(error);
      showToast("처리 실패", "상품권 사용완료 저장에 실패했어요");
      return;
    }
  } else {
    state.player.rewardClaims = claims;
    syncPlayer();
    renderRewardClaims();
  }

  renderShop();
  showToast("사용완료", `${claim.label} · ${claim.requestedBy || claim.ownerName || "Player"}`);
}

function normalizeRewardClaims(claims) {
  if (!Array.isArray(claims)) return [];
  return claims.slice(0, 200).map((claim) => ({
    id: limitText(claim?.id, 80) || makeRewardClaimId(),
    type: claim?.type === "daiso_3000" ? "daiso_3000" : "daiso_3000",
    label: limitText(claim?.label, 40) || DAISO_VOUCHER_LABEL,
    cost: safeCounter(claim?.cost) || DAISO_VOUCHER_COOKIE_COST,
    status: claim?.status === "used" ? "used" : "requested",
    requestedAt: limitText(claim?.requestedAt, 40),
    requestedBy: limitText(claim?.requestedBy, MAX_PLAYER_NAME_LENGTH),
    requestedByUid: limitText(claim?.requestedByUid, 80),
    usedAt: limitText(claim?.usedAt, 40),
    usedBy: limitText(claim?.usedBy, MAX_PLAYER_NAME_LENGTH)
  }));
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "날짜 없음";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function getTodayKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function makeDailyMission() {
  return {
    date: getTodayKey(),
    cardViews: 0,
    gameCorrect: 0,
    writingAttempts: 0,
    rewarded: false
  };
}

function normalizeDailyMission(mission) {
  const today = getTodayKey();
  if (!mission || typeof mission !== "object" || Array.isArray(mission) || mission.date !== today) {
    return makeDailyMission();
  }

  return {
    date: today,
    cardViews: Math.min(DAILY_MISSION_TARGETS.cardViews, safeCounter(mission.cardViews)),
    gameCorrect: Math.min(DAILY_MISSION_TARGETS.gameCorrect, safeCounter(mission.gameCorrect)),
    writingAttempts: Math.min(DAILY_MISSION_TARGETS.writingAttempts, safeCounter(mission.writingAttempts)),
    rewarded: mission.rewarded === true
  };
}

function ensureDailyMission() {
  state.player.dailyMission = normalizeDailyMission(state.player.dailyMission);
  return state.player.dailyMission;
}

function isDailyMissionComplete(mission = ensureDailyMission()) {
  return mission.cardViews >= DAILY_MISSION_TARGETS.cardViews
    && mission.gameCorrect >= DAILY_MISSION_TARGETS.gameCorrect
    && mission.writingAttempts >= DAILY_MISSION_TARGETS.writingAttempts;
}

function recordCardMissionView(word) {
  if (state.screen !== "card" || !word?.id) return;

  const mission = ensureDailyMission();
  const token = `${mission.date}:${word.id}:${state.cardIndex}`;
  if (state.lastMissionCardViewToken === token) return;

  state.lastMissionCardViewToken = token;
  recordDailyMission("cardViews");
}

function recordDailyMission(field) {
  if (!Object.prototype.hasOwnProperty.call(DAILY_MISSION_TARGETS, field)) return;

  const mission = ensureDailyMission();
  const beforeComplete = isDailyMissionComplete(mission);
  const target = DAILY_MISSION_TARGETS[field];
  const current = safeCounter(mission[field]);
  if (current >= target) return;

  mission[field] = Math.min(target, current + 1);
  const afterComplete = isDailyMissionComplete(mission);

  syncPlayer();
  renderDailyMission();

  if (!beforeComplete && afterComplete && !mission.rewarded) {
    showToast("미션 완료!", "홈에서 보상을 받아요");
    playSfx("level");
  }
}

function renderDailyMission() {
  if (!dom.claimMissionBtn) return;

  const mission = ensureDailyMission();
  const complete = isDailyMissionComplete(mission);
  const rows = [
    ["cardViews", dom.missionCardText, dom.missionCardFill],
    ["gameCorrect", dom.missionCorrectText, dom.missionCorrectFill],
    ["writingAttempts", dom.missionWritingText, dom.missionWritingFill]
  ];

  const missionProgress = {};
  rows.forEach(([field, textEl, fillEl]) => {
    const target = DAILY_MISSION_TARGETS[field];
    const value = Math.min(target, safeCounter(mission[field]));
    missionProgress[field] = `${value}/${target}`;
    if (textEl) textEl.textContent = missionProgress[field];
    if (fillEl) fillEl.style.width = `${Math.round((value / target) * 100)}%`;
  });

  if (dom.missionSummary) {
    dom.missionSummary.textContent = `카드${missionProgress.cardViews} · 게임${missionProgress.gameCorrect} · 쓰기${missionProgress.writingAttempts}`;
  }

  dom.claimMissionBtn.disabled = !complete || mission.rewarded;
  dom.claimMissionBtn.textContent = mission.rewarded ? "보상 완료" : "보상 받기";
  dom.claimMissionBtn.classList.toggle("ready", complete && !mission.rewarded);
  if (dom.missionRewardText) {
    dom.missionRewardText.textContent = mission.rewarded
      ? "오늘 보상을 받았어요. 내일 다시 도전해요!"
      : `완료 보상: 🍪 ${DAILY_MISSION_REWARD.coin} · XP ${DAILY_MISSION_REWARD.xp}`;
  }
}

function claimDailyMissionReward() {
  const mission = ensureDailyMission();
  if (mission.rewarded) {
    showToast("보상 완료", "오늘 보상은 이미 받았어요");
    return;
  }

  if (!isDailyMissionComplete(mission)) {
    showToast("미션 진행 중", "세 가지 미션을 모두 완료해 주세요");
    return;
  }

  mission.rewarded = true;
  state.player.coin += DAILY_MISSION_REWARD.coin;
  state.player.xp += DAILY_MISSION_REWARD.xp;

  syncPlayer();
  render();
  playSfx("level");
  showToast("미션 보상!", `🍪 +${DAILY_MISSION_REWARD.coin} · XP +${DAILY_MISSION_REWARD.xp}`);
  confetti();
  floatScore(`+${DAILY_MISSION_REWARD.xp}XP`);
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

function markWrong(word, shouldSpeak = true) {
  state.player.combo = 0;

  if (word) {
    const progress = state.player.progress[word.id] || { correct: 0, wrong: 0 };
    progress.wrong += 1;
    state.player.progress[word.id] = progress;
  }

  playSfx("bad");
  if (shouldSpeak) speak(word.word);
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
  const knowButton = $("#knowBtn");
  if (knowButton) knowButton.disabled = true;

  if (isKnownCard(word)) {
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
  state.cardAwardedIds.add(word.id);
  awardCard(word);

  setTimeout(() => {
    moveCard(1);
    state.cardLocked = false;
    renderCard();
  }, 420);
}

function isKnownCard(word) {
  return Boolean(word?.id && (state.cardAwardedIds.has(word.id) || state.player.knownCards?.[word.id]));
}

function awardCard(word) {
  const points = SCORE_REWARDS.card;
  state.player.score += points;
  state.player.coin += Math.ceil(points / 5);
  state.player.xp += points;

  successFx(points, word);
  syncPlayer();
  render();
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

function formatSpelling(value) {
  return spellingLetters(value).toUpperCase().split("").join(" · ");
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

function normalizeOwnedAvatarItems(items) {
  const owned = items && typeof items === "object" && !Array.isArray(items)
    ? Object.fromEntries(
      Object.entries(items)
        .filter(([id, value]) => value === true && Boolean(getAvatarItem(id)))
        .map(([id]) => [id, true])
    )
    : {};

  return { ...DEFAULT_OWNED_AVATAR_ITEMS, ...owned };
}

function normalizeEquippedAvatar(avatar, ownedItems = DEFAULT_OWNED_AVATAR_ITEMS, options = {}) {
  const source = avatar && typeof avatar === "object" && !Array.isArray(avatar) ? avatar : {};
  const normalized = { ...DEFAULT_AVATAR };

  for (const slot of Object.keys(DEFAULT_AVATAR)) {
    const itemId = String(source[slot] || "");
    const item = getAvatarItem(itemId);
    if (item && item.slot === slot && (ownedItems[itemId] || options.allowUnowned)) normalized[slot] = itemId;
  }

  if (source.accessory === "") normalized.accessory = "";
  if (normalized.accessory && !ownedItems[normalized.accessory] && !options.allowUnowned) normalized.accessory = "";
  return normalized;
}

function normalizePlayer(player) {
  const progress = player.progress && typeof player.progress === "object" && !Array.isArray(player.progress)
    ? player.progress
    : {};
  const knownCards = player.knownCards && typeof player.knownCards === "object" && !Array.isArray(player.knownCards)
    ? player.knownCards
    : {};
  const questionHistory = normalizeQuestionHistory(player.questionHistory);
  const dailyMission = normalizeDailyMission(player.dailyMission);
  const ownedItems = player.ownedItems && typeof player.ownedItems === "object" && !Array.isArray(player.ownedItems)
    ? player.ownedItems
    : {};
  const ownedThemes = player.ownedThemes && typeof player.ownedThemes === "object" && !Array.isArray(player.ownedThemes)
    ? player.ownedThemes
    : {};
  const ownedPets = player.ownedPets && typeof player.ownedPets === "object" && !Array.isArray(player.ownedPets)
    ? player.ownedPets
    : {};
  const ownedAvatarItems = normalizeOwnedAvatarItems(player.ownedAvatarItems);
  const equippedAvatar = normalizeEquippedAvatar(player.equippedAvatar, ownedAvatarItems);
  const petCare = normalizePetCare(player.petCare);
  const rewardClaims = normalizeRewardClaims(player.rewardClaims);

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
    knownCards,
    questionHistory,
    dailyMission,
    ownedItems,
    equippedItem: ownedItems[player.equippedItem] && getShopItem(player.equippedItem) ? player.equippedItem : "",
    ownedAvatarItems,
    equippedAvatar,
    ownedThemes,
    equippedTheme: ownedThemes[player.equippedTheme] && getShopTheme(player.equippedTheme) ? player.equippedTheme : "",
    ownedPets,
    equippedPet: ownedPets[player.equippedPet] && getShopPet(player.equippedPet) ? player.equippedPet : "",
    petCare,
    rewardClaims
  };
}

function normalizeQuestionHistory(history) {
  if (!history || typeof history !== "object" || Array.isArray(history)) return {};

  return Object.fromEntries(
    Object.entries(history)
      .filter(([, value]) => Array.isArray(value))
      .map(([key, value]) => [key, value.map((id) => String(id)).filter(Boolean)])
  );
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



