import { homeView, wordResults, escapeText } from "./ui/components.js?v=10.0.0";
import {
  UI_V9_VERSION,
  LOCAL_KEY,
  PARENT_GATE_KEY,
  deriveSnapshot,
  filterWords,
  missionCta,
  normalizeTab,
  safeInt,
  safeJson,
  snapshotFingerprint,
  tabFromHash
} from "./ui-v9-core.js?v=10.0.0";
import {
  SEASON2_CATALOG,
  getSeason2Character,
  getSeason2World,
  renderMonsterSvg
} from "./monster-catalog-season2.js?v=8.0.0";

const TAB_META = Object.freeze({
  home: { label: "홈", icon: "home" },
  learn: { label: "학습", icon: "book" },
  games: { label: "게임", icon: "game" },
  collection: { label: "컬렉션", icon: "collection" },
  my: { label: "MY", icon: "user" }
});

const LEGACY_SCREENS = Object.freeze({
  card: "cardScreen",
  game: "gameScreen",
  rank: "rankScreen",
  collection: "collectionScreen",
  pet: "petScreen",
  dress: "dressScreen",
  shop: "shopScreen",
  manage: "manageScreen"
});

const GAME_META = Object.freeze([
  { mode: "choice", title: "뜻 맞히기", description: "단어의 뜻을 빠르게 확인해요", reward: "+1", level: "가볍게", icon: "choice" },
  { mode: "block", title: "철자 블록", description: "글자를 순서대로 조립해요", reward: "+15", level: "연습", icon: "blocks" },
  { mode: "blank", title: "빈칸 완성", description: "힌트를 보고 철자를 떠올려요", reward: "+40", level: "집중", icon: "blank" },
  { mode: "type", title: "직접 쓰기", description: "도움 없이 철자를 입력해요", reward: "+100", level: "도전", icon: "pencil" }
]);

const app = {
  root: null,
  main: null,
  nav: null,
  activeTab: tabFromHash(),
  snapshot: null,
  fingerprint: "",
  learnMode: "overview",
  wordQuery: "",
  wordCategory: "all",
  showAllCategories: false,
  wordLimit: 60,
  parentAction: null,
  refreshPending: false,
  lastRoute: "",
  handlingHistory: false,
  toastTimer: null,
  focusBeforeSeason2: null,
  season2WasOpen: false,
  storageTimer: null,
  pollTimer: null,
  screenObserver: null,
  dialogObserver: null,
  lastLegacyScreen: "",
  returnTab: "home",
  claims: { admin: false, guardian: false },
  destroyed: false
};

const ICON_PATHS = Object.freeze({
  home: '<path d="M3.5 10.8 12 3.7l8.5 7.1"/><path d="M5.7 9.3v10h12.6v-10"/><path d="M9.2 19.3v-5.6h5.6v5.6"/>',
  book: '<path d="M4 5.5c3.1-.9 5.5-.2 8 1.5v13c-2.5-1.7-4.9-2.4-8-1.5z"/><path d="M20 5.5c-3.1-.9-5.5-.2-8 1.5v13c2.5-1.7 4.9-2.4 8-1.5z"/>',
  game: '<path d="M7.3 8.2h9.4a4.7 4.7 0 0 1 4.5 6l-1 3.4a2.5 2.5 0 0 1-4.1 1.1l-1.8-1.5H9.7l-1.8 1.5a2.5 2.5 0 0 1-4.1-1.1l-1-3.4a4.7 4.7 0 0 1 4.5-6Z"/><path d="M7.1 12v3.6M5.3 13.8h3.6"/><path d="M16.6 12.8h.1M18.8 15h.1"/>',
  collection: '<path d="M5 3.8h11.8A2.2 2.2 0 0 1 19 6v14.2H7.2A2.2 2.2 0 0 1 5 18z"/><path d="M5 18a2.2 2.2 0 0 0 2.2 2.2"/><path d="M9 8h6M9 12h6"/>',
  user: '<circle cx="12" cy="8" r="3.6"/><path d="M4.8 20c.5-4.2 3-6.3 7.2-6.3s6.7 2.1 7.2 6.3"/>',
  play: '<path d="m9 6 9 6-9 6z"/>',
  arrow: '<path d="M5 12h14M14 7l5 5-5 5"/>',
  back: '<path d="M19 12H5M10 7l-5 5 5 5"/>',
  star: '<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  flame: '<path d="M12.2 21c4.1 0 7-2.8 7-6.8 0-3.3-2.1-6.6-6.1-10.1.2 3.1-1.3 4.9-2.8 6.1-.2-1.7-1.1-3-2.5-4.1-2 2.4-3 5.1-3 8.1 0 4 3.1 6.8 7.4 6.8Z"/><path d="M9.2 17.7c0-1.6.9-3.1 2.8-4.6 1.9 1.5 2.8 3 2.8 4.6"/>',
  cookie: '<circle cx="12" cy="12" r="8.6"/><circle cx="9" cy="8.6" r=".8" fill="currentColor" stroke="none"/><circle cx="15.4" cy="10.1" r=".9" fill="currentColor" stroke="none"/><circle cx="10.1" cy="15.2" r=".9" fill="currentColor" stroke="none"/><circle cx="15.7" cy="16" r=".7" fill="currentColor" stroke="none"/>',
  volume: '<path d="M4 10h3l4-3.5v11L7 14H4z"/><path d="M14.5 9.2a4.4 4.4 0 0 1 0 5.6M17.3 6.5a8.2 8.2 0 0 1 0 11"/>',
  mute: '<path d="M4 10h3l4-3.5v11L7 14H4z"/><path d="m15 9 5 5M20 9l-5 5"/>',
  cloud: '<path d="M6.3 18.2h11.4a3.8 3.8 0 0 0 .4-7.5A6.3 6.3 0 0 0 6.2 9.4a4.5 4.5 0 0 0 .1 8.8Z"/>',
  choice: '<circle cx="7" cy="7" r="2"/><circle cx="7" cy="17" r="2"/><path d="M11 7h9M11 17h9"/>',
  blocks: '<rect x="3.5" y="4" width="7" height="7" rx="1.5"/><rect x="13.5" y="4" width="7" height="7" rx="1.5"/><rect x="8.5" y="14" width="7" height="7" rx="1.5"/>',
  blank: '<path d="M4 7h6M14 7h6M4 17h4M16 17h4"/><path d="M10.5 17h3" stroke-dasharray="1.5 1.5"/>',
  pencil: '<path d="m5 19 1-4L16.7 4.3a1.8 1.8 0 0 1 2.6 0l.4.4a1.8 1.8 0 0 1 0 2.6L9 18z"/><path d="m14.5 6.5 3 3M6 15l3 3"/>',
  monster: '<path d="M5 19v-7a7 7 0 0 1 14 0v7"/><path d="M5 19c1.5 0 2.2-1.5 3.5-1.5S10.5 19 12 19s2.2-1.5 3.5-1.5S17.5 19 19 19"/><circle cx="9" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="11" r="1" fill="currentColor" stroke="none"/>',
  pet: '<path d="M8.5 13.5c-2.8 1.1-4.2 3-4 5.5 2.5.7 4.3.1 5.5-1.8 1.2 1.9 2.9 2.5 5 1.8 1.2 1 2.8 1 4.5 0 .2-2.5-1.2-4.4-4-5.5"/><circle cx="8" cy="8" r="2"/><circle cx="16" cy="8" r="2"/><circle cx="12" cy="5" r="2"/>',
  shirt: '<path d="m8 4-5 3 2 4 3-1v10h8V10l3 1 2-4-5-3c-.5 1.4-1.8 2.2-4 2.2S8.5 5.4 8 4Z"/>',
  trophy: '<path d="M8 4h8v4c0 3-1.3 5.2-4 6.5C9.3 13.2 8 11 8 8z"/><path d="M8 6H4v1.5c0 2 1.3 3.2 4 3.5M16 6h4v1.5c0 2-1.3 3.2-4 3.5M12 14.5V18M8.5 20h7"/>',
  shop: '<path d="M4 9h16l-1.3-4H5.3z"/><path d="M5 9v11h14V9M9 20v-6h6v6"/><path d="M4 9c0 1.5 1 2.5 2.5 2.5S9 10.5 9 9c0 1.5 1 2.5 3 2.5s3-1 3-2.5c0 1.5 1 2.5 2.5 2.5S20 10.5 20 9"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21h-4v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3.1 14H3v-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.5V3h4v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1v4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2.5"/>',
  sync: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 8.5A7 7 0 0 1 18.5 7L20 12M4 12l1.5 5A7 7 0 0 0 18 15.5"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  search: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  sparkles: '<path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2zM5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8zM19 14l.7 1.8 1.8.7-1.8.7L19 19l-.7-1.8-1.8-.7 1.8-.7z"/>',
  shield: '<path d="M12 3 19 6v5c0 4.5-2.3 7.7-7 10-4.7-2.3-7-5.5-7-10V6z"/><path d="m9 12 2 2 4-5"/>',
  offline: '<path d="M3 9a13 13 0 0 1 18 0M6 12a9 9 0 0 1 12 0M9.5 15.5a4 4 0 0 1 5 0M3 3l18 18"/>',
  report: '<path d="M5 20V10M10 20V5M15 20v-8M20 20V8"/>',
  category: '<path d="M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v5H4zM14 15h6v5h-6z"/>',
  feed: '<path d="M5 8h14l-1 10H6z"/><path d="M8 8c0-2 1.3-3 4-3s4 1 4 3"/>',
  avatar: '<circle cx="12" cy="8" r="3"/><path d="M5 20c.6-4 3-6 7-6s6.4 2 7 6"/><path d="M8 4 6 2M16 4l2-2"/>',
  data: '<path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  close: '<path d="m5 5 14 14M19 5 5 19"/>'
});

function icon(name, extraClass = "") {
  const paths = ICON_PATHS[name] || ICON_PATHS.sparkles;
  return `<svg class="hw9-icon ${extraClass}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatNumber(value) {
  return new Intl.NumberFormat("ko-KR").format(safeInt(value));
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "좋은 아침이에요";
  if (hour < 17) return "오늘도 반가워요";
  return "차분히 마무리해요";
}

function readEnvelope() {
  return safeJson(localStorage.getItem(LOCAL_KEY), {});
}

function connectionState() {
  const text = document.querySelector("#syncStatus")?.textContent || "";
  if (!navigator.onLine) return { state: "offline", label: "오프라인 저장" };
  if (/실패|규칙|권한/.test(text)) return { state: "warning", label: "기기에 저장" };
  if (/동기화 완료|동기화됨|연결됨/.test(text)) return { state: "online", label: "클라우드 연결" };
  if (/연결 중|동기화 중/.test(text)) return { state: "local", label: "연결 확인 중" };
  return { state: "local", label: "기기 저장" };
}

function legacyBridge() {
  return window.HeatherWordLegacyBridge || null;
}

function installStorageSignal() {
  if (window.__HW9_STORAGE_SIGNAL__) return;
  window.__HW9_STORAGE_SIGNAL__ = true;
  const previous = Storage.prototype.setItem;
  Storage.prototype.setItem = function hw9SetItem(key, value) {
    const result = previous.call(this, key, value);
    if (this === window.localStorage && key === LOCAL_KEY) {
      window.dispatchEvent(new CustomEvent("heather:state-change"));
    }
    return result;
  };
}

function waitForBaseApp(timeout = 12000) {
  const started = Date.now();
  return new Promise((resolve) => {
    const tick = () => {
      if (window.HeatherWordLegacyBridge && document.querySelector("#homeScreen") && document.querySelector("#cardScreen") && document.querySelector("#gameScreen")) {
        resolve(true);
        return;
      }
      if (Date.now() - started > timeout) {
        resolve(false);
        return;
      }
      setTimeout(tick, 40);
    };
    tick();
  });
}

function shellTemplate() {
  return `
    <a class="hw9-skip" href="#hw9Content">본문으로 건너뛰기</a>
    <header class="hw9-header">
      <button class="hw9-profile-button" type="button" data-hw9-action="profile" aria-label="사용자 프로필">
        <span class="hw9-profile-avatar" data-hw9-profile-avatar>${icon("user")}</span>
        <span class="hw9-profile-copy"><small data-hw9-greeting>오늘도 반가워요</small><strong data-hw9-name>Player</strong></span>
      </button>
      <div class="hw9-header-actions">
        <button class="hw9-resource" type="button" data-hw9-tab-jump="my" aria-label="보유 쿠키 확인">
          ${icon("cookie")}<strong data-hw9-coin>0</strong>
        </button>
        <span class="hw9-connection" data-hw9-connection="local"><i></i><span>기기 저장</span></span>
      </div>
    </header>
    <main class="hw9-content" id="hw9Content" tabindex="-1"></main>
    <nav class="hw9-tabbar" aria-label="주요 메뉴">
      <div class="hw9-brand" aria-label="Heather Word"><span aria-hidden="true">h.</span><div>Heather Word<small>조금씩, 매일 성장해요</small></div></div>
      ${Object.entries(TAB_META).map(([id, item]) => `
        <button type="button" data-hw9-tab="${id}" aria-label="${item.label}" aria-current="false">
          <span>${icon(item.icon)}</span><b>${item.label}</b>
        </button>`).join("")}
    </nav>
    <dialog class="hw9-parent-dialog" id="hw9ParentDialog" aria-labelledby="hw9ParentTitle">
      <form method="dialog" class="hw9-parent-sheet" data-hw9-parent-form>
        <button class="hw9-sheet-close" type="button" data-hw9-action="close-parent" aria-label="닫기">${icon("close")}</button>
        <div class="hw9-sheet-icon">${icon("shield")}</div>
        <p class="hw9-eyebrow">보호자 도구</p>
        <h2 id="hw9ParentTitle">보호자 PIN 확인</h2>
        <p data-hw9-parent-description>단어장 편집과 데이터 관리 화면을 열어요.</p>
        <label class="hw9-field">
          <span>PIN</span>
          <input data-hw9-parent-pin type="password" inputmode="numeric" pattern="[0-9]*" minlength="4" maxlength="8" autocomplete="off" placeholder="숫자 4~8자리" />
        </label>
        <label class="hw9-field" data-hw9-parent-confirm-wrap hidden>
          <span>PIN 다시 입력</span>
          <input data-hw9-parent-confirm type="password" inputmode="numeric" pattern="[0-9]*" minlength="4" maxlength="8" autocomplete="off" placeholder="한 번 더 입력" />
        </label>
        <p class="hw9-field-error" data-hw9-parent-error role="alert"></p>
        <button class="hw9-button hw9-button-primary hw9-button-wide" type="submit" data-hw9-parent-submit>확인</button>
        <small class="hw9-security-note">이 PIN은 현재 기기의 보호자 화면 잠금입니다. 상품권 처리 같은 운영 관리자 권한은 Firebase custom claims가 별도로 필요합니다.</small>
      </form>
    </dialog>
    <div class="hw9-live-region" aria-live="polite" aria-atomic="true" data-hw9-live></div>
    <div class="hw9-toast" data-hw9-toast hidden></div>
  `;
}

function mountShell() {
  if (document.querySelector("#hw9App")) return document.querySelector("#hw9App");
  const root = document.createElement("div");
  root.id = "hw9App";
  root.className = "hw9-app";
  root.dataset.version = UI_V9_VERSION;
  root.innerHTML = shellTemplate();
  document.body.appendChild(root);
  return root;
}

function partnerMarkup(snapshot, size = "large") {
  const partner = getSeason2Character(snapshot.partnerId);
  if (partner) {
    return `<div class="hw9-partner-art is-${size}" role="img" aria-label="현재 파트너 ${escapeHtml(partner.name)}">${renderMonsterSvg(partner)}</div>`;
  }
  const latestLegacy = document.querySelector("#avatarPreview")?.innerHTML?.trim();
  if (latestLegacy && latestLegacy.includes("svg")) {
    return `<div class="hw9-partner-art is-${size}" role="img" aria-label="현재 캐릭터">${latestLegacy}</div>`;
  }
  return `<div class="hw9-partner-art is-${size} hw9-partner-empty" role="img" aria-label="파트너 선택 전">${icon("monster")}</div>`;
}

function renderHeader() {
  if (!app.root || !app.snapshot) return;
  const connection = connectionState();
  const partner = getSeason2Character(app.snapshot.partnerId);
  app.root.querySelector("[data-hw9-greeting]").textContent = greeting();
  app.root.querySelector("[data-hw9-name]").textContent = app.snapshot.name;
  app.root.querySelector(".hw9-profile-button").setAttribute("aria-label", `${greeting()} ${app.snapshot.name} 사용자 프로필`);
  app.root.querySelector(".hw9-resource").setAttribute("aria-label", `보유 쿠키 ${formatNumber(app.snapshot.coin)}개 확인`);
  app.root.querySelector("[data-hw9-coin]").textContent = formatNumber(app.snapshot.coin);
  const avatar = app.root.querySelector("[data-hw9-profile-avatar]");
  avatar.innerHTML = partner ? renderMonsterSvg(partner) : icon("user");
  const status = app.root.querySelector("[data-hw9-connection]");
  status.dataset.hw9Connection = connection.state;
  status.querySelector("span").textContent = connection.label;
}

function progressBar(percent, label = "") {
  return `<div class="hw9-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(percent)}"${label ? ` aria-label="${escapeHtml(label)}"` : ""}><i style="--progress:${Math.max(0, Math.min(100, percent))}%"></i></div>`;
}

function renderHome() {
  return homeView(app.snapshot, { icon, partnerMarkup, missionCta });
}

function categoryRows(snapshot) {
  const categories = snapshot.categories.filter((category) => category.id !== "all" && category.count > 0);
  const visible = app.showAllCategories ? categories : categories.slice(0, 6);
  if (!visible.length) {
    return `<div class="hw9-empty-state">${icon("book")}<h3>아직 단어가 없어요</h3><p>보호자 도구에서 첫 단어를 추가하면 바로 학습할 수 있어요.</p><button class="hw9-button hw9-button-secondary" type="button" data-hw9-action="parent">단어 추가하기</button></div>`;
  }
  return `
    <div class="hw9-category-list">
      ${visible.map((category, index) => `
        <button type="button" class="hw9-category-row" data-hw9-category="${escapeHtml(category.id)}">
          <span class="hw9-category-index">${String(index + 1).padStart(2, "0")}</span>
          <span><strong>${escapeHtml(category.name)}</strong><small>${category.count}개 단어</small></span>
          ${icon("play")}
        </button>`).join("")}
    </div>
    ${categories.length > 6 ? `<button type="button" class="hw9-text-button" data-hw9-action="toggle-categories">${app.showAllCategories ? "간단히 보기" : `카테고리 전체 ${categories.length}개 보기`} ${icon("chevron")}</button>` : ""}`;
}

function renderWordLibrary(snapshot) {
  return `<section class="hw9-view hw9-library-view" aria-labelledby="hw9LibraryTitle">
    <div class="hw9-view-heading with-back">
      <button type="button" class="hw9-icon-button" data-hw9-action="learn-overview" aria-label="학습 화면으로 돌아가기">${icon("back")}</button>
      <div><span class="hw9-kicker">내 단어장</span><h1 id="hw9LibraryTitle">${snapshot.wordCount}개 단어</h1></div>
    </div>
    <div class="hw9-library-tools">
      <label class="hw9-search-field">${icon("search")}<input type="search" data-hw9-word-search value="${escapeHtml(app.wordQuery)}" aria-label="단어 또는 뜻 검색" placeholder="단어 또는 뜻 검색" autocomplete="off" /></label>
      <select data-hw9-word-category aria-label="카테고리 필터">${snapshot.categories.filter(c=>c.id==="all"||c.count>0).map(c=>`<option value="${escapeHtml(c.id)}" ${c.id===app.wordCategory?'selected':''}>${escapeHtml(c.name)} · ${c.count}</option>`).join('')}</select>
    </div>
    <div data-hw9-results>${renderWordResults(snapshot)}</div>
    <button class="hw9-button hw9-button-secondary hw9-button-wide" type="button" data-hw9-action="parent">${icon("lock")} 보호자 단어 관리</button>
  </section>`;
}

function renderWordResults(snapshot) {
  const result=wordResults(snapshot.words, app.wordQuery, app.wordCategory, app.wordLimit);
  return `<p class="hw9-result-count" role="status">검색 결과 ${result.total}개 · ${result.items.length}개 표시</p><div class="hw9-word-list">${result.items.length?result.items.map(word=>`
    <article class="hw9-word-row"><div><strong>${escapeText(word.word)}</strong><span>${escapeText(word.meaning||'뜻이 아직 없어요')}</span></div><button type="button" class="hw9-icon-button subtle" data-hw9-speak="${escapeText(word.word)}" aria-label="${escapeText(word.word)} 발음 듣기">${icon("volume")}</button></article>`).join(''):
    `<div class="hw9-empty-state">${icon("search")}<h3>찾는 단어가 없어요</h3><p>검색어나 카테고리를 바꿔 보세요.</p><button type="button" class="hw9-text-button" data-hw9-action="clear-search">검색 초기화</button></div>`}</div>
    ${result.hasMore?`<button type="button" class="hw9-text-button hw9-button-wide" data-hw9-action="more-words">다음 단어 더 보기 (${result.items.length}/${result.total})</button>`:''}`;
}

function refreshWordResults() {
  const target=app.main?.querySelector('[data-hw9-results]');
  if(target) target.innerHTML=renderWordResults(app.snapshot);
}

function renderLearn() {
  const s = app.snapshot;
  if (app.learnMode === "library") return renderWordLibrary(s);
  return `
    <section class="hw9-view hw9-learn-view" aria-labelledby="hw9LearnTitle">
      <div class="hw9-view-heading">
        <div><span class="hw9-kicker">학습</span><h1 id="hw9LearnTitle">내 단어를 오래 기억해요</h1><p>복습과 카드 학습을 원하는 순서로 시작할 수 있어요.</p></div>
      </div>

      <article class="hw9-review-feature ${s.mastery.due ? "has-due" : ""}">
        <div class="hw9-review-icon">${icon("clock")}</div>
        <div><span class="hw9-kicker">오늘 복습</span><h2>${s.mastery.due ? `${s.mastery.due}개가 기다려요` : "지금은 예정된 복습이 없어요"}</h2><p>${s.mastery.difficult ? `모험에서 우선 연습해요 · 어려운 단어 ${s.mastery.difficult}개` : "새 단어를 가볍게 만나도 좋아요"}</p></div>
        <button type="button" class="hw9-button hw9-button-primary" data-hw9-action="adventure" ${s.wordCount ? "" : "disabled"}>${s.mastery.due ? "모험에서 복습하기" : "새 단어 학습하기"}</button>
      </article>

      <div class="hw9-learn-actions">
        <button type="button" class="hw9-learn-action" data-hw9-action="card" ${s.wordCount ? "" : "disabled"}>
          <span>${icon("book")}</span><div><strong>카드 학습</strong><small>보고 듣고, 어려운 단어를 표시해요</small></div>${icon("chevron")}
        </button>
        <button type="button" class="hw9-learn-action" data-hw9-action="library">
          <span>${icon("data")}</span><div><strong>내 단어장</strong><small>${s.wordCount}개 단어를 검색하고 확인해요</small></div>${icon("chevron")}
        </button>
      </div>

      <section class="hw9-section-block">
        <div class="hw9-section-title"><div><span class="hw9-kicker">카테고리</span><h2>골라서 학습하기</h2></div><span>${s.categories.filter((item) => item.count > 0 && item.id !== "all").length}개</span></div>
        ${categoryRows(s)}
      </section>
    </section>`;
}

function renderGames() {
  const s = app.snapshot;
  return `
    <section class="hw9-view hw9-games-view" aria-labelledby="hw9GamesTitle">
      <div class="hw9-view-heading">
        <div><span class="hw9-kicker">게임</span><h1 id="hw9GamesTitle">어떤 방식으로 기억해 볼까요?</h1><p>${s.settings.ageBand === "challenge" ? "도전 모드 · 힌트가 조금 늦게 나와요" : "쉬운 모드 · 차근차근 도움을 받아요"}</p></div>
      </div>

      <button type="button" class="hw9-adventure-banner" data-hw9-action="adventure" ${s.wordCount ? "" : "disabled"}>
        <span>${icon("sparkles")}</span>
        <div><strong>오늘의 모험</strong><small>4단계 · 총 21문제 · 진행 상황 저장</small></div>
        <em>${s.adventure.completed ? "완료" : `${s.adventure.stageIndex}/4`}</em>
        ${icon("chevron")}
      </button>

      <label class="hw9-field hw9-game-category"><span>게임에서 학습할 단어</span><select data-hw9-game-category aria-label="게임 카테고리">${s.categories.filter(c=>c.id==="all"||c.count>0).map(c=>`<option value="${escapeHtml(c.id)}" ${c.id===s.selectedCategoryId?'selected':''}>${escapeHtml(c.name)} · ${c.count}개</option>`).join('')}</select></label>
      <div class="hw9-game-grid">
        ${GAME_META.map((game) => `
          <button type="button" class="hw9-game-card mode-${game.mode}" data-hw9-game="${game.mode}" ${s.wordCount ? "" : "disabled"}>
            <span class="hw9-game-icon">${icon(game.icon)}</span>
            <span class="hw9-game-level">${game.level}</span>
            <strong>${game.title}</strong>
            <p>${game.description}</p>
            <small>10문제 · 정답당 ${game.reward}점</small>
          </button>`).join("")}
      </div>
      ${!s.wordCount ? `<div class="hw9-inline-notice">${icon("offline")}<span>학습할 단어가 없어서 게임을 시작할 수 없어요.</span><button type="button" data-hw9-action="parent">단어 추가</button></div>` : ""}
    </section>`;
}

function ownedPreview(snapshot) {
  const owned = SEASON2_CATALOG.filter((character) => snapshot.season2.season2Collection?.[character.id]).slice(-4).reverse();
  if (!owned.length) {
    return `<div class="hw9-collection-empty">${icon("monster")}<span>모험을 완료하면 새로운 친구가 이곳에 나타나요.</span></div>`;
  }
  return `<div class="hw9-owned-preview">${owned.map((character) => `<div role="img" aria-label="${escapeHtml(character.name)}">${renderMonsterSvg(character)}<span>${escapeHtml(character.name)}</span></div>`).join("")}</div>`;
}

function renderCollection() {
  const s = app.snapshot;
  const partner = getSeason2Character(s.partnerId);
  const world = getSeason2World(partner?.worldId || s.egg.worldId);
  const legacyCount = String(document.querySelector("#homeMonsterCount")?.textContent || "0 / 1000").split("/")[0].trim();
  return `
    <section class="hw9-view hw9-collection-view" aria-labelledby="hw9CollectionTitle">
      <div class="hw9-view-heading">
        <div><span class="hw9-kicker">컬렉션</span><h1 id="hw9CollectionTitle">함께 성장하는 나의 세계</h1><p>몬스터, 펫, 아바타를 한곳에서 만나고 꾸며요.</p></div>
      </div>

      <article class="hw9-partner-feature">
        <div class="hw9-partner-scene">${partnerMarkup(s)}<i></i></div>
        <div class="hw9-partner-copy"><span class="hw9-kicker">현재 파트너</span><h2>${escapeHtml(partner?.name || "파트너를 선택해 주세요")}</h2><p>${escapeHtml(partner?.personality || `${world?.name || "스펠링 월드"}에서 첫 친구를 기다리고 있어요`)}</p><button type="button" class="hw9-button hw9-button-secondary" data-hw9-action="season2-collection">파트너와 도감 보기</button></div>
      </article>

      <section class="hw9-section-block">
        <div class="hw9-section-title"><div><span class="hw9-kicker">최근 친구</span><h2>시즌 2 도감</h2></div><span>${s.ownedSeason2}/60</span></div>
        ${progressBar((s.ownedSeason2 / 60) * 100, "시즌 2 수집률")}
        ${ownedPreview(s)}
      </section>

      <div class="hw9-world-menu">
        <button type="button" data-hw9-action="season2-collection"><span>${icon("monster")}</span><div><strong>스펠링 월드 도감</strong><small>진화 · 친밀도 · 세계 완성률</small></div><em>${s.ownedSeason2}/60</em>${icon("chevron")}</button>
        <button type="button" data-hw9-legacy="collection"><span>${icon("collection")}</span><div><strong>기존 몬스터 도감</strong><small>오랫동안 모아 온 1,000종 기록</small></div><em>${escapeHtml(legacyCount)}/1000</em>${icon("chevron")}</button>
        <button type="button" data-hw9-legacy="pet"><span>${icon("pet")}</span><div><strong>펫 돌보기</strong><small>먹이, 기분, 포만감과 성장</small></div>${icon("chevron")}</button>
        <button type="button" data-hw9-legacy="dress"><span>${icon("shirt")}</span><div><strong>아바타 드레스룸</strong><small>내 모습과 배경을 꾸며요</small></div>${icon("chevron")}</button>
      </div>
    </section>`;
}

function settingRow(iconName, title, description, action, trailing = "") {
  return `<button type="button" class="hw9-setting-row" ${action}>
    <span class="hw9-setting-icon">${icon(iconName)}</span>
    <span><strong>${title}</strong><small>${description}</small></span>
    ${trailing ? `<em>${trailing}</em>` : ""}${icon("chevron")}
  </button>`;
}

function renderMy() {
  const s = app.snapshot;
  const connection = connectionState();
  return `
    <section class="hw9-view hw9-my-view" aria-labelledby="hw9MyTitle">
      <div class="hw9-view-heading">
        <div><span class="hw9-kicker">MY</span><h1 id="hw9MyTitle">${escapeHtml(s.name)}의 기록</h1><p>학습 기록과 꾸미기, 설정을 관리해요.</p></div>
      </div>

      <article class="hw9-profile-card">
        <div class="hw9-profile-visual">${partnerMarkup(s, "medium")}</div>
        <div><h2>${escapeHtml(s.name)}</h2><p>${connection.label} · ${s.settings.ageBand === "challenge" ? "도전 모드" : "쉬운 모드"}</p><button type="button" class="hw9-text-button" data-hw9-action="profile">이름 바꾸기 ${icon("chevron")}</button></div>
      </article>

      <div class="hw9-stat-strip">
        <div><span>${icon("star")}</span><strong>${formatNumber(s.score)}</strong><small>점수</small></div>
        <div><span>${icon("cookie")}</span><strong>${formatNumber(s.coin)}</strong><small>쿠키</small></div>
        <div><span>${icon("flame")}</span><strong>${s.bestCombo}</strong><small>최고 콤보</small></div>
      </div>

      <section class="hw9-settings-group">
        <h2>기록과 꾸미기</h2>
        ${settingRow("trophy", "나의 기록", "클라이언트 점수 기반의 참고 기록", 'data-hw9-legacy="rank"')}
        ${settingRow("shop", "쿠키샵", "아바타, 펫, 배경 아이템", 'data-hw9-legacy="shop"', `${formatNumber(s.coin)}개`)}
        ${settingRow("report", "학습 리포트", "복습 예정 단어와 최근 학습", 'data-hw9-action="report"')}
      </section>

      <section class="hw9-settings-group">
        <h2>앱 설정</h2>
        ${settingRow(s.sound ? "volume" : "mute", "소리", s.sound ? "효과음과 발음이 켜져 있어요" : "소리가 꺼져 있어요", 'data-hw9-action="toggle-sound"', s.sound ? "켜짐" : "꺼짐")}
        ${settingRow("settings", "난이도와 모션", "쉬운/도전 모드, 자동 발음, 모션 줄이기", 'data-hw9-action="season2-settings"')}
        ${settingRow("sync", "데이터 동기화", connection.label, 'data-hw9-action="sync"')}
      </section>

      <section class="hw9-settings-group hw9-parent-entry">
        <h2>보호자</h2>
        ${settingRow("shield", "보호자 도구", "단어 추가, 백업, 복원과 관리", 'data-hw9-action="parent"')}
        ${settingRow("lock", "보호자 화면 다시 잠그기", "이 브라우저의 보호자 확인을 종료해요", 'data-hw9-action="lock-parent"')}
      </section>

      <p class="hw9-integrity-note">랭킹 점수는 현재 클라이언트가 기록하므로 공개 경쟁의 공식 기록으로 사용하지 않습니다. 운영 경쟁 기능에는 서버 검증이 필요합니다.</p>
    </section>`;
}

function renderActiveView({ force = false, preserveScroll = false } = {}) {
  const previousScroll = app.main?.scrollTop || 0;
  if (!app.main || !app.snapshot) return;
  const renderers = { home: renderHome, learn: renderLearn, games: renderGames, collection: renderCollection, my: renderMy };
  app.main.innerHTML = renderers[app.activeTab]();
  app.main.scrollTop = preserveScroll ? previousScroll : 0;
  app.root.dataset.tab = app.activeTab;
  app.nav.querySelectorAll("[data-hw9-tab]").forEach((button) => {
    const active = button.dataset.hw9Tab === app.activeTab;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-current", active ? "page" : "false");
  });
  if (force) app.main.focus({ preventScroll: true });
}

function refreshSnapshot({ force = false } = {}) {
  if (app.destroyed) return;
  const next=deriveSnapshot(readEnvelope());
  const fingerprint=snapshotFingerprint(next);
  const changed=fingerprint!==app.fingerprint;
  app.snapshot=next;
  renderHeader();
  if(changed||force) {
    app.fingerprint=fingerprint;
    if(app.activeTab==='learn'&&app.learnMode==='library'&&app.main.querySelector('[data-hw9-results]')) {
      refreshWordResults();
      const title=app.main.querySelector('#hw9LibraryTitle');
      if(title) title.textContent=`${next.wordCount}개 단어`;
    } else if(!app.root.hidden && !document.querySelector('dialog[open]') && !document.body.classList.contains('hw9-season2-open')) {
      renderActiveView({preserveScroll:true});
    }
  }
  applySettings();
}

function scheduleRefresh() {
  if(app.refreshPending) return;
  app.refreshPending=true;
  requestAnimationFrame(()=>{app.refreshPending=false;refreshSnapshot();});
}

function applySettings() {
  if (!app.snapshot) return;
  const reduced = app.snapshot.settings.reducedMotion || matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.toggle("hw9-reduced-motion", reduced);
  document.body.dataset.hw9AgeBand = app.snapshot.settings.ageBand;
}

function announce(message) {
  const region=app.root?.querySelector('[data-hw9-live]');
  if(region) region.textContent=message;
  const toast=app.root?.querySelector('[data-hw9-toast]');
  if(!toast) return;
  toast.textContent=message;
  toast.hidden=false;
  clearTimeout(app.toastTimer);
  app.toastTimer=setTimeout(()=>{toast.hidden=true;},3600);
}

function setTab(tab, { history = true, focus = true } = {}) {
  if(activeLegacyScreen()) {legacyBridge()?.navigate('home');syncLegacyVisibility();}
  if(document.querySelector('#season2Overlay')?.hidden===false) {
    const previous=app.handlingHistory; app.handlingHistory=true;
    window.HeatherWordSeason2?.close?.(); app.handlingHistory=previous;
  }
  const next = normalizeTab(tab);
  app.activeTab = next;
  app.learnMode = next === "learn" ? app.learnMode : "overview";
  if (history) {
    const hash = `#/${next}`;
    if (location.hash !== hash) historyPush({ hw9: true, tab: next }, hash);
  }
  renderActiveView({ force: focus });
}

function historyPush(state, hash) {
  try {
    history.pushState(state, "", hash);
  } catch {
    location.hash = hash;
  }
}

function handleHistory() {
  const hash=location.hash;
  if(app.lastRoute===hash) return;
  app.lastRoute=hash;
  const season=hash.match(/^#\/season2\/(adventure|starter|collection|weekly|settings|egg|report)$/);
  if(season) {
    if(activeLegacyScreen()) {legacyBridge()?.navigate('home');syncLegacyVisibility();}
    app.handlingHistory=true;
    if(window.HeatherWordSeason2) {
      window.HeatherWordSeason2.open(season[1]);
      app.handlingHistory=false;
    } else {
      app.handlingHistory=false;
      app.lastRoute='';
      setTimeout(handleHistory,100);
    }
    return;
  }
  const focus=hash.match(/^#\/focus\/(card|game|rank|collection|pet|dress|shop|manage)(?:\?(.*))?$/);
  if(focus) {
    const params=new URLSearchParams(focus[2]||'');
    if(activeLegacyScreen()!==focus[1]) openLegacy(focus[1],{mode:params.get('mode')||'choice',categoryId:params.get('category')||app.snapshot.selectedCategoryId,history:false});
    return;
  }
  if(document.querySelector('#season2Overlay')?.hidden===false) {app.handlingHistory=true;window.HeatherWordSeason2?.close?.();app.handlingHistory=false;}
  if(activeLegacyScreen()) {
    legacyBridge()?.navigate('home');
    syncLegacyVisibility();
  }
  setTab(tabFromHash(),{history:false,focus:false});
}

function openAdventure() {
  const button = document.querySelector('#season2HomePanel [data-s2-action="start-adventure"]');
  if (button) {
    button.click();
    announce("오늘의 모험을 열었어요");
    return;
  }
  openLegacy("card");
}

function openSeason2View(view) {
  const button = document.querySelector(`#season2HomePanel [data-s2-view="${view}"]`) || document.querySelector(`#season2Overlay [data-s2-view="${view}"]`);
  if (button) {
    button.click();
    return true;
  }
  openAdventure();
  setTimeout(() => document.querySelector(`#season2Overlay [data-s2-view="${view}"]`)?.click(), 60);
  return false;
}

function openReport() {
  const button = document.querySelector('#season2HomePanel [data-s2-action="open-report"]');
  if (button) button.click();
  else openSeason2View("weekly");
}

function openLegacy(screen, options = {}) {
  if (!(screen in LEGACY_SCREENS)) return;
  if (screen === "manage" && window.HEATHER_PARENT_GATE_GRANTED !== true) {
    openParentGate();
    return;
  }
  app.returnTab = options.history === false ? (history.state?.returnTab || ({card:'learn',game:'games',collection:'collection',pet:'collection',dress:'collection'}[screen]||'my')) : app.activeTab;
  const bridge = legacyBridge();
  if (screen === "game" && options.mode && bridge?.startGame) {
    bridge.startGame(options.mode, options.categoryId || app.snapshot.selectedCategoryId);
  } else if (screen === "card" && bridge?.startCard) {
    bridge.startCard(options.categoryId || app.snapshot.selectedCategoryId);
  } else if (bridge?.navigate) {
    bridge.navigate(screen);
  } else {
    const trigger = document.querySelector(`[data-nav="${screen}"]`);
    if (options.categoryId) {
      const select = screen === "card" ? document.querySelector("#cardCategory") : document.querySelector("#gameCategory");
      if (select) {
        select.value = options.categoryId;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
    trigger?.click();
    if (screen === "game" && options.mode) {
      setTimeout(() => document.querySelector(`.mode-btn[data-mode="${options.mode}"]`)?.click(), 80);
    }
  }
  if(options.history !== false) {
    const query=screen==='game'?`?mode=${encodeURIComponent(options.mode||'choice')}&category=${encodeURIComponent(options.categoryId||app.snapshot.selectedCategoryId)}`:'';
    historyPush({hw9:true,focus:screen,returnTab:app.returnTab},`#/focus/${screen}${query}`);
    app.lastRoute=location.hash;
  }
  setTimeout(syncLegacyVisibility, 0);
}

function goHomeFromLegacy({ history = true } = {}) {
  const bridge = legacyBridge();
  if (bridge?.navigate) bridge.navigate("home");
  else document.querySelector('[data-nav="home"]')?.click();
  document.body.classList.remove("hw9-legacy-active");
  app.root.hidden = false;
  if (history) historyPush({ hw9: true, tab: app.returnTab }, `#/${app.returnTab}`);
  setTab(app.returnTab, { history: false, focus: false });
}

function activeLegacyScreen() {
  for (const [name, id] of Object.entries(LEGACY_SCREENS)) {
    if (document.getElementById(id)?.classList.contains("active")) return name;
  }
  return "";
}

function syncLegacyVisibility() {
  const active = activeLegacyScreen();
  const season2Open = document.querySelector("#season2Overlay")?.hidden === false;
  if (active) {
    app.lastLegacyScreen = active;
    document.body.classList.add("hw9-legacy-active");
    document.body.dataset.hw9LegacyScreen = active;
    app.root.hidden = true;
    enhanceLegacyChrome(active);
  } else {
    document.body.classList.remove("hw9-legacy-active");
    delete document.body.dataset.hw9LegacyScreen;
    if (!season2Open) app.root.hidden = false;
  }
  document.body.classList.toggle("hw9-season2-open", season2Open);
  app.main.inert=season2Open;
  app.nav.inert=season2Open;
  app.root.querySelector('.hw9-header').inert=season2Open;
  const legacyShell=document.querySelector('body > .app-shell');
  if(legacyShell) legacyShell.inert=season2Open;
  if(season2Open&&!app.season2WasOpen) app.focusBeforeSeason2=document.activeElement;
  if(!season2Open&&app.season2WasOpen) {
    app.focusBeforeSeason2?.focus?.({preventScroll:true});
    refreshSnapshot({force:true});
  }
  app.season2WasOpen=season2Open;
}

function enhanceLegacyChrome(screen) {
  const root = document.getElementById(LEGACY_SCREENS[screen]);
  if (!root || root.dataset.hw9Enhanced === "true") return;
  root.dataset.hw9Enhanced = "true";
  root.querySelectorAll(".back-btn").forEach((button) => { button.innerHTML = icon("back"); });
  const titleMap = { rank: "나의 기록", collection: "몬스터 도감", pet: "펫 돌보기", dress: "드레스룸", shop: "쿠키샵", manage: "보호자 도구" };
  const heading = root.querySelector(".screen-head h2");
  if (heading && titleMap[screen]) heading.textContent = titleMap[screen];
  const iconMap = { cardSpeakBtn: "volume", newQuestionBtn: "sync", refreshRankBtn: "sync", petShopBtn: "shop", syncBtn: "sync" };
  Object.entries(iconMap).forEach(([id, name]) => {
    const button = document.getElementById(id);
    if (button) button.innerHTML = icon(name);
  });
  if (screen === "manage") {
    document.querySelector("#manageScreen .reward-admin-panel")?.classList.toggle("hw9-admin-allowed", app.claims.admin);
  }
}

function watchScreens() {
  const targets = [...document.querySelectorAll(".screen"), document.querySelector("#season2Overlay")].filter(Boolean);
  app.screenObserver = new MutationObserver(syncLegacyVisibility);
  targets.forEach((target) => app.screenObserver.observe(target, { attributes: true, attributeFilter: ["class", "hidden"] }));
  syncLegacyVisibility();
}

function watchDialogs() {
  app.dialogObserver = new MutationObserver(() => {
    const hasOpen = Boolean(document.querySelector("dialog[open]"));
    document.body.classList.toggle("hw9-dialog-open", hasOpen);
  });
  document.querySelectorAll("dialog").forEach((dialog) => app.dialogObserver.observe(dialog, { attributes: true, attributeFilter: ["open"] }));
}

function speakWord(word) {
  const text = String(word || "").trim();
  if (!text || !("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.82;
  speechSynthesis.speak(utterance);
}

function toggleSound() {
  document.querySelector("#soundToggle")?.click();
  setTimeout(() => refreshSnapshot({ force: true }), 80);
}

function claimMission() {
  const button = document.querySelector("#claimMissionBtn");
  if (button && !button.disabled) {
    button.click();
    announce("오늘 목표 보상을 받았어요");
  }
}

function syncData() {
  document.querySelector("#syncBtn")?.click();
  announce("데이터 동기화를 요청했어요");
  setTimeout(() => refreshSnapshot({ force: true }), 300);
}

function openProfile() {
  document.querySelector("#profileBtn")?.click();
}

function handleRootClick(event) {
  if(event.target.closest('.hw9-skip')) {event.preventDefault();app.main.focus();return;}
  const tab = event.target.closest("[data-hw9-tab]")?.dataset.hw9Tab;
  if (tab) {
    setTab(tab);
    return;
  }
  const jump = event.target.closest("[data-hw9-tab-jump]")?.dataset.hw9TabJump;
  if (jump) {
    setTab(jump);
    return;
  }
  const legacy = event.target.closest("[data-hw9-legacy]")?.dataset.hw9Legacy;
  if (legacy) {
    openLegacy(legacy);
    return;
  }
  const game = event.target.closest("[data-hw9-game]")?.dataset.hw9Game;
  if (game) {
    openLegacy("game", { mode: game });
    return;
  }
  const category = event.target.closest("[data-hw9-category]")?.dataset.hw9Category;
  if (category) {
    openLegacy("card", { categoryId: category });
    return;
  }
  const speak = event.target.closest("[data-hw9-speak]")?.dataset.hw9Speak;
  if (speak) {
    speakWord(speak);
    return;
  }
  const action = event.target.closest("[data-hw9-action]")?.dataset.hw9Action;
  if (!action) return;
  const actions = {
    adventure: openAdventure,
    card: () => openLegacy("card"),
    library: () => { app.learnMode = "library"; renderActiveView({ force: true }); },
    "learn-overview": () => { app.learnMode = "overview"; renderActiveView({ force: true }); },
    "toggle-categories": () => { app.showAllCategories = !app.showAllCategories; renderActiveView(); },
    "season2-collection": () => openSeason2View("collection"),
    "season2-settings": () => openSeason2View("settings"),
    report: openReport,
    profile: openProfile,
    "toggle-sound": toggleSound,
    sync: syncData,
    parent: () => openParentGate(),
    "lock-parent": () => {
      sessionStorage.removeItem('heather_parent_unlocked');
      window.HEATHER_PARENT_GATE_GRANTED=false;
      legacyBridge()?.setManageGranted?.(false);
      announce('보호자 화면을 다시 잠갔어요');
    },
    "more-words": () => { app.wordLimit+=60; refreshWordResults(); },
    "clear-search": () => {
      app.wordQuery=''; app.wordCategory='all'; app.wordLimit=60;
      const input=app.main.querySelector('[data-hw9-word-search]');
      const select=app.main.querySelector('[data-hw9-word-category]');
      if(input) { input.value=''; input.focus(); } if(select) select.value='all';
      refreshWordResults();
    },
    "claim-mission": claimMission,
    "close-parent": closeParentGate
  };
  actions[action]?.();
}

function handleRootInput(event) {
  if(event.target.matches('[data-hw9-word-search]')) {
    app.wordQuery=event.target.value;
    app.wordLimit=60;
    if(!event.isComposing) refreshWordResults();
  }
}

function handleRootChange(event) {
  if(event.target.matches('[data-hw9-word-category]')) {
    app.wordCategory=event.target.value;
    app.wordLimit=60;
    refreshWordResults();
  }
  if(event.target.matches('[data-hw9-game-category]')) {
    legacyBridge()?.selectCategory?.(event.target.value);
  }
}

function parentRecord() {
  return safeJson(localStorage.getItem(PARENT_GATE_KEY), null);
}

function randomSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}

async function hashPin(pin, salt) {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)));
}

function openParentGate(onGranted) {
  app.parentAction=typeof onGranted==='function'?onGranted:null;
  if (app.claims.admin || app.claims.guardian || sessionStorage.getItem("heather_parent_unlocked") === "1") {
    grantParentAccess();
    return;
  }
  const dialog = app.root.querySelector("#hw9ParentDialog");
  const record = parentRecord();
  const setup = !record?.salt || !record?.hash;
  dialog.dataset.mode = setup ? "setup" : "verify";
  dialog.querySelector("#hw9ParentTitle").textContent = setup ? "보호자 PIN 만들기" : "보호자 PIN 확인";
  dialog.querySelector("[data-hw9-parent-description]").textContent = setup
    ? "이 기기에서 보호자 도구를 열 때 사용할 숫자 PIN을 만들어 주세요."
    : "단어장 편집과 데이터 관리 화면을 열어요.";
  dialog.querySelector("[data-hw9-parent-confirm-wrap]").hidden = !setup;
  dialog.querySelector("[data-hw9-parent-pin]").value = "";
  dialog.querySelector("[data-hw9-parent-confirm]").value = "";
  dialog.querySelector("[data-hw9-parent-error]").textContent = "";
  dialog.showModal();
  setTimeout(() => dialog.querySelector("[data-hw9-parent-pin]").focus(), 60);
}

function closeParentGate() {
  app.parentAction=null;
  app.root.querySelector("#hw9ParentDialog")?.close();
}

async function handleParentSubmit(event) {
  event.preventDefault();
  const dialog = app.root.querySelector("#hw9ParentDialog");
  const pin = dialog.querySelector("[data-hw9-parent-pin]").value.trim();
  const confirm = dialog.querySelector("[data-hw9-parent-confirm]").value.trim();
  const error = dialog.querySelector("[data-hw9-parent-error]");
  if (!/^\d{4,8}$/.test(pin)) {
    error.textContent = "숫자 4~8자리로 입력해 주세요.";
    return;
  }
  const submit=dialog.querySelector('[data-hw9-parent-submit]');
  if(submit.disabled) return;
  submit.disabled=true;
  try {
  if (dialog.dataset.mode === "setup") {
    if (pin !== confirm) {
      error.textContent = "두 PIN이 서로 달라요.";
      return;
    }
    const salt = randomSalt();
    const hash = await hashPin(pin, salt);
    localStorage.setItem(PARENT_GATE_KEY, JSON.stringify({ version: 1, salt, hash, createdAt: new Date().toISOString() }));
  } else {
    const record = parentRecord();
    const hash = await hashPin(pin, record.salt);
    if (hash !== record.hash) {
      error.textContent = "PIN이 맞지 않아요.";
      return;
    }
  }
  sessionStorage.setItem("heather_parent_unlocked", "1");
  dialog.close();
  grantParentAccess();
  } catch {
    error.textContent='PIN을 확인하지 못했어요. 저장소 접근과 HTTPS 연결을 확인해 주세요.';
  } finally { submit.disabled=false; }
}

function grantParentAccess() {
  window.HEATHER_PARENT_GATE_GRANTED = true;
  legacyBridge()?.setManageGranted?.(true);
  const continuation=app.parentAction;
  app.parentAction=null;
  if(continuation) continuation(); else openLegacy("manage");
}

async function detectClaims() {
  if (!window.HEATHER_USE_FIREBASE || new URLSearchParams(location.search).get("mode") === "local") return;
  try {
    const [{ getApps }, { getAuth, getIdTokenResult }] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js")
    ]);
    const instance = getApps()[0];
    if (!instance) return;
    const auth = getAuth(instance);
    for (let attempt = 0; attempt < 40 && !auth.currentUser; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (!auth.currentUser) return;
    const token = await getIdTokenResult(auth.currentUser, false);
    app.claims.admin = token.claims.admin === true;
    app.claims.guardian = token.claims.guardian === true || app.claims.admin;
    window.HEATHER_FIREBASE_ADMIN = app.claims.admin;
    window.HEATHER_FIREBASE_GUARDIAN = app.claims.guardian;
    document.body.classList.toggle("hw9-admin-claim", app.claims.admin);
  } catch (error) {
    console.info("Heather Word role check unavailable", error);
  }
}

function interceptLegacyManage(event) {
  const manage = event.target.closest?.('[data-nav="manage"]');
  if (!manage || window.HEATHER_PARENT_GATE_GRANTED === true) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  openParentGate();
}

    function interceptLegacyBack(event) {
      const back = event.target.closest?.(".back-btn, #gameBackBtn");
      if (!back || !document.body.classList.contains("hw9-legacy-active")) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      goHomeFromLegacy();
    }

function enhanceSeason2Overlay() {
  const root = document.querySelector("#season2Overlay");
  if (!root || root.dataset.hw9Enhanced === "true") return;
  root.dataset.hw9Enhanced = "true";
  const close = root.querySelector('[data-s2-action="close"]');
  if (close) close.innerHTML = icon("back");
  const nav = { adventure: ["sparkles", "모험"], collection: ["collection", "도감"], weekly: ["report", "주간"], settings: ["settings", "설정"] };
  Object.entries(nav).forEach(([view, [iconName, label]]) => {
    const button = root.querySelector(`[data-s2-view="${view}"]`);
    if (button) button.innerHTML = `<span>${icon(iconName)}</span><b>${label}</b>`;
  });
}

function trapSeasonFocus(event) {
  const overlay=document.querySelector('#season2Overlay');
  if(event.key!=='Tab'||!overlay||overlay.hidden||document.querySelector('dialog[open]')) return;
  const nodes=[...overlay.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),a[href],[tabindex="0"]')].filter(el=>el.getClientRects().length>0&&!el.closest('[hidden]'));
  if(!nodes.length) {event.preventDefault();return;}
  const first=nodes[0],last=nodes[nodes.length-1],active=document.activeElement;
  if(event.shiftKey&&(active===first||!nodes.includes(active))) {event.preventDefault();last.focus();}
  else if(!event.shiftKey&&(active===last||!nodes.includes(active))) {event.preventDefault();first.focus();}
}

function bindEvents() {
  app.root.addEventListener("click", handleRootClick);
  app.root.addEventListener("input", handleRootInput);
  app.root.addEventListener("compositionend", handleRootInput);
  app.root.querySelector("#hw9ParentDialog").addEventListener("cancel",()=>{app.parentAction=null;});
  document.addEventListener("keydown",trapSeasonFocus,true);
  app.root.addEventListener("change", handleRootChange);
  app.root.querySelector("[data-hw9-parent-form]").addEventListener("submit", handleParentSubmit);
  window.addEventListener("heather:state-change", scheduleRefresh);
  window.addEventListener("heather:legacy-render", scheduleRefresh);
  window.addEventListener("heather:legacy-ready",scheduleRefresh);
  window.addEventListener("storage", (event) => { if (event.key === LOCAL_KEY) refreshSnapshot({ force: true }); });
  window.addEventListener("online", () => refreshSnapshot({ force: true }));
  window.addEventListener("offline", () => refreshSnapshot({ force: true }));
  window.addEventListener('heather:season2-open', event => {
    if(app.handlingHistory) return;
    const view=event.detail?.view||'adventure';
    const hash=`#/season2/${view}`;
    if(location.hash.startsWith('#/season2/')) history.replaceState({hw9:true,season2:true,returnTab:app.returnTab},'',hash);
    else {app.returnTab=app.activeTab;historyPush({hw9:true,season2:true,returnTab:app.returnTab},hash);}
    app.lastRoute=hash;
  });
  window.addEventListener('heather:season2-close', () => {
    if(app.handlingHistory) return;
    const tab=history.state?.returnTab||app.returnTab;
    history.replaceState({hw9:true,tab},'',`#/${tab}`);
    app.lastRoute=location.hash;
    setTab(tab,{history:false,focus:false});
  });
  window.addEventListener("popstate", handleHistory);
  window.addEventListener("hashchange", handleHistory);
  window.addEventListener("heather:parent-gate-request", openParentGate);
  document.addEventListener("click", interceptLegacyManage, true);
  document.addEventListener("click", interceptLegacyBack, true);
  document.addEventListener("click", () => setTimeout(enhanceSeason2Overlay, 0), true);
}

function installGlobalApi() {
  window.HeatherWordUI = Object.freeze({
    version: UI_V9_VERSION,
    setTab,
    refresh: () => refreshSnapshot({ force: true }),
    openLegacy,
    openAdventure,
    requestParentAccess: openParentGate,
    backToShell: () => goHomeFromLegacy(),
    getSnapshot: () => typeof structuredClone === "function" ? structuredClone(app.snapshot) : JSON.parse(JSON.stringify(app.snapshot))
  });
}

async function boot() {
  const ready = await waitForBaseApp();
  if (!ready) {
    console.error("Heather Word base app did not become ready");
    return;
  }
  installStorageSignal();
  app.root = mountShell();
  app.main = app.root.querySelector("#hw9Content");
  app.nav = app.root.querySelector(".hw9-tabbar");
  document.documentElement.classList.add("hw9-ready");
  document.body.classList.add("hw9-shell-ready");
  document.body.dataset.hw9Version = UI_V9_VERSION;
  bindEvents();
  watchScreens();
  watchDialogs();
  enhanceSeason2Overlay();
  refreshSnapshot({ force: true });
  installGlobalApi();
  detectClaims();
  app.pollTimer = setInterval(() => {if(!document.hidden) scheduleRefresh();},30000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden) scheduleRefresh();});
  document.querySelector('#hwBoot')?.remove();
  document.querySelector('#hwBootStyle')?.remove();
  handleHistory();
  if (!location.hash || !location.hash.startsWith("#/")) {
    history.replaceState({ hw9: true, tab: app.activeTab }, "", `#/${app.activeTab}`);
  }
  window.dispatchEvent(new CustomEvent("heather:ui-v9-ready", { detail: { version: UI_V9_VERSION } }));
}

boot().catch((error) => {
  console.error("Heather Word UI v9 failed", error);
  document.querySelector("#hwBoot")?.classList.add("has-error");
});
