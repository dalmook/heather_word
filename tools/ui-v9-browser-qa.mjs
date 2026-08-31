import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4173";
const outputDir = resolve(process.env.UI_QA_OUTPUT || "audit/after");
const port = Number(process.env.CHROME_DEBUG_PORT || 9333);
const errors = [];
const consoleErrors = [];
const networkErrors = [];

const fixture = {
  selectedCategoryId: "fruit",
  categories: [
    { id: "all", name: "전체", emoji: "" },
    { id: "fruit", name: "과일과 간식", emoji: "" },
    { id: "family", name: "우리 가족과 아주 긴 카테고리 이름", emoji: "" },
    { id: "school", name: "학교", emoji: "" },
    { id: "custom", name: "직접 추가", emoji: "" }
  ],
  words: [
    { id: "apple", word: "apple", meaning: "사과", categoryId: "fruit", emoji: "🍎" },
    { id: "banana", word: "banana", meaning: "바나나", categoryId: "fruit", emoji: "🍌" },
    { id: "cookie", word: "cookie", meaning: "쿠키", categoryId: "fruit", emoji: "🍪" },
    { id: "mother", word: "mother", meaning: "엄마", categoryId: "family", emoji: "" },
    { id: "father", word: "father", meaning: "아빠", categoryId: "family", emoji: "" },
    { id: "classroom", word: "classroom", meaning: "교실", categoryId: "school", emoji: "" },
    { id: "pneumo", word: "pneumonoultramicroscopicsilicovolcanoconiosis", meaning: "매우 긴 영어 단어", categoryId: "custom", emoji: "" }
  ],
  player: {
    name: "Heather의 아주 긴 사용자 이름",
    score: 30976,
    coin: 10000,
    xp: 321000,
    combo: 2,
    bestCombo: 48,
    sound: false,
    progress: {
      apple: { correct: 7, wrong: 2, skip: 1 },
      banana: { correct: 1, wrong: 3, skip: 0 },
      __season2: {
        schemaVersion: 8,
        revision: 18,
        partnerId: "s2_cookie_crumb_bear_1",
        discoveryPoints: 44,
        evolutionMaterials: 3,
        season2Collection: { s2_cookie_crumb_bear_1: true },
        wordMastery: {
          apple: { level: 5, wrong: 2, correct: 7, nextReviewAt: "2026-08-30T00:00:00.000Z" },
          banana: { level: 1, wrong: 3, correct: 1, nextReviewAt: "2026-09-03T00:00:00.000Z" }
        },
        studyStreak: { current: 5, best: 12, protectedDays: 1 },
        dailyAdventure: { date: "2026-08-31", stageIndex: 2, stars: [3, 2, 0, 0], completed: false, rewardTokens: [], session: { id: "qa" } },
        weeklyProgress: { weekKey: "2026-08-31", activeDays: ["2026-08-27", "2026-08-28"], adventures: 2, bosses: 1 },
        incubatingEgg: { worldId: "cookie", progress: 68, hatchCount: 0 },
        settings: { ageBand: "challenge", reducedMotion: false, autoTts: false, timerEnabled: false },
        monsterAffinity: {}, achievements: {}, titles: {}, endgameProgress: { masteryStars: 1, completedWorlds: [] }, worldProgress: {}, honorCollection: {}, activityLog: [], answerTokens: []
      }
    },
    knownCards: { apple: true },
    questionHistory: {},
    dailyMission: { date: "2026-08-31", cardViews: 5, gameCorrect: 3, writingAttempts: 1, rewarded: false },
    ownedItems: {},
    equippedItem: "",
    ownedAvatarItems: { body01: true, face01: true, hair01: true, outfit01: true },
    equippedAvatar: { body: "body01", face: "face01", hair: "hair01", outfit: "outfit01", accessory: "" },
    ownedThemes: {}, equippedTheme: "",
    ownedPets: { pet_panda: true }, equippedPet: "pet_panda",
    petCare: { xp: 50, mood: 70, hunger: 40, foods: {} },
    rewardClaims: []
  }
};

function commandExists(name) {
  return spawnSync("bash", ["-lc", `command -v ${name}`], { encoding: "utf8" }).stdout.trim();
}

function chromePath() {
  return process.env.CHROME_BIN || commandExists("google-chrome") || commandExists("chromium") || commandExists("chromium-browser");
}

function delay(ms) { return new Promise((resolvePromise) => setTimeout(resolvePromise, ms)); }

async function waitFor(predicate, message, timeout = 15000, interval = 80) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await predicate()) return;
    await delay(interval);
  }
  throw new Error(`Timeout: ${message}`);
}

class Cdp {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Map();
  }
  async connect() {
    this.ws = new WebSocket(this.url);
    await new Promise((resolvePromise, reject) => {
      this.ws.addEventListener("open", resolvePromise, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
    this.ws.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result || {});
        return;
      }
      for (const listener of this.listeners.get(message.method) || []) listener(message.params || {});
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolvePromise, reject) => {
      this.pending.set(id, { resolve: resolvePromise, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  on(method, listener) {
    const list = this.listeners.get(method) || [];
    list.push(listener);
    this.listeners.set(method, list);
  }
  close() { this.ws?.close(); }
}

async function jsonFetch(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

async function evaluate(cdp, expression, awaitPromise = true) {
  const result = await cdp.send("Runtime.evaluate", { expression, awaitPromise, returnByValue: true, userGesture: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Runtime exception");
  return result.result?.value;
}

async function screenshot(cdp, filename) {
  const result = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: false });
  await writeFile(join(outputDir, filename), Buffer.from(result.data, "base64"));
}

async function setViewport(cdp, width, height) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width, height, deviceScaleFactor: 1, mobile: width < 800,
    screenWidth: width, screenHeight: height
  });
  await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: width < 800, maxTouchPoints: 5 });
}

async function click(cdp, selector) {
  return evaluate(cdp, `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; el.click(); return true; })()`);
}

async function load(cdp, url) {
  await cdp.send("Page.navigate", { url });
  await waitFor(async () => (await evaluate(cdp, "document.readyState")) === "complete", `document load ${url}`);
  await waitFor(async () => await evaluate(cdp, "document.body?.dataset?.hw9Version === '9.0.0'"), "UI v9 ready", 20000);
  await waitFor(async () => await evaluate(cdp, "Boolean(window.HeatherWordUI && window.HeatherWordLegacyBridge)"), "public UI bridges", 20000);
}

async function setTab(cdp, tab) {
  await evaluate(cdp, `window.HeatherWordUI.setTab(${JSON.stringify(tab)})`);
  await waitFor(async () => await evaluate(cdp, `document.querySelector('[data-hw9-tab="${tab}"]')?.getAttribute('aria-current') === 'page'`), `tab ${tab}`);
}

function answerForMeaning(meaning) {
  return fixture.words.find((word) => word.meaning === meaning)?.word || "";
}

async function answerCurrentChoice(cdp) {
  const meaning = await evaluate(cdp, "document.querySelector('.question-meaning')?.textContent.trim() || ''");
  const answer = answerForMeaning(meaning);
  if (!answer) throw new Error(`No answer for meaning ${meaning}`);
  const ok = await evaluate(cdp, `(() => { const answer=${JSON.stringify(answer)}; const button=[...document.querySelectorAll('[data-word-id]')].find((item)=>item.textContent.trim()===answer); button?.click(); return Boolean(button); })()`);
  if (!ok) throw new Error(`Choice not found for ${answer}`);
}

async function answerCurrentText(cdp, answer, correct = true) {
  const value = correct ? answer : "definitelywrong";
  const ok = await evaluate(cdp, `(() => { const input=document.querySelector('#answerInput'); if(!input) return false; input.value=${JSON.stringify(value)}; input.dispatchEvent(new Event('input',{bubbles:true})); document.querySelector('#checkInputBtn')?.click(); return true; })()`);
  if (!ok) throw new Error("Text input missing");
}

async function answerCurrentBlock(cdp) {
  const meaning = await evaluate(cdp, "document.querySelector('.question-meaning')?.textContent.trim() || ''");
  const answer = answerForMeaning(meaning).replace(/[^a-z]/gi, "").toUpperCase();
  if (!answer) throw new Error(`No block answer for ${meaning}`);
  const ok = await evaluate(cdp, `(() => { const answer=${JSON.stringify(answer)}; for (const char of answer) { const button=[...document.querySelectorAll('[data-bank-index]')].find((item)=>item.textContent.trim().toUpperCase()===char); if(!button) return false; button.click(); } document.querySelector('#checkTilesBtn')?.click(); return true; })()`);
  if (!ok) throw new Error(`Unable to build block answer ${answer}`);
}

async function openGame(cdp, mode) {
  await evaluate(cdp, `window.HeatherWordUI.openLegacy('game',{mode:${JSON.stringify(mode)},categoryId:'all'})`);
  await waitFor(async () => await evaluate(cdp, `document.body.classList.contains('hw9-legacy-active') && document.querySelector('#gameScreen')?.classList.contains('active') && document.querySelector('.mode-btn[data-mode="${mode}"]')?.classList.contains('active')`), `game ${mode}`);
}

async function backToShell(cdp) {
  await evaluate(cdp, "window.HeatherWordUI.backToShell()" );
  await waitFor(async () => await evaluate(cdp, "!document.body.classList.contains('hw9-legacy-active') && !document.querySelector('#heatherCommercialApp')?.hidden"), "return shell");
}

async function run() {
  await mkdir(outputDir, { recursive: true });
  const browser = chromePath();
  if (!browser) throw new Error("Chrome/Chromium not found");
  const userDir = await mkdtemp(join(tmpdir(), "heather-ui-v9-"));
  const chrome = spawn(browser, [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--hide-scrollbars",
    `--remote-debugging-port=${port}`, `--user-data-dir=${userDir}`, "--no-first-run", "--no-default-browser-check", "about:blank"
  ], { stdio: ["ignore", "pipe", "pipe"] });
  chrome.stderr.on("data", () => {});
  try {
    await waitFor(async () => {
      try { await jsonFetch(`http://127.0.0.1:${port}/json/version`); return true; } catch { return false; }
    }, "Chrome debug port", 10000);
    const target = await jsonFetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" });
    const cdp = new Cdp(target.webSocketDebuggerUrl);
    await cdp.connect();
    await Promise.all([cdp.send("Page.enable"), cdp.send("Runtime.enable"), cdp.send("Log.enable"), cdp.send("Network.enable")]);
    cdp.on("Runtime.exceptionThrown", ({ exceptionDetails }) => errors.push(exceptionDetails?.text || "exception"));
    cdp.on("Log.entryAdded", ({ entry }) => { if (entry?.level === "error") consoleErrors.push(entry.text); });
    cdp.on("Runtime.consoleAPICalled", ({ type, args }) => {
      if (type === "error") consoleErrors.push(args?.map((arg) => arg.value || arg.description).join(" ") || "console.error");
    });
    cdp.on("Network.responseReceived", ({ response }) => {
      if (Number(response?.status) >= 400) networkErrors.push(`${response.status} ${response.url}`);
    });

    const fixtureScript = `(() => { if (location.origin === ${JSON.stringify(new URL(baseUrl).origin)} && sessionStorage.getItem('__hw9_fixture_seeded') !== '1') { localStorage.setItem('heather_word_v3', ${JSON.stringify(JSON.stringify(fixture))}); localStorage.removeItem('heather_parent_gate_v1'); sessionStorage.setItem('__hw9_fixture_seeded', '1'); } })();`;
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: fixtureScript });
    await setViewport(cdp, 390, 844);
    await load(cdp, `${baseUrl}/?mode=local&qa=existing#/home`);

    const viewports = [[360,800],[375,812],[390,844],[412,915],[430,932],[768,1024],[1440,1000]];
    for (const [width, height] of viewports) {
      await setViewport(cdp, width, height);
      await setTab(cdp, "home");
      await delay(120);
      await screenshot(cdp, `home-${width}x${height}.png`);
    }

    await setViewport(cdp, 390, 844);
    for (const tab of ["home", "learn", "games", "collection", "my"]) {
      await setTab(cdp, tab);
      await delay(100);
      await screenshot(cdp, `tab-${tab}-390x844.png`);
    }

    await setTab(cdp, "home");
    await evaluate(cdp, "window.HeatherWordUI.openLegacy('card',{categoryId:'fruit'})");
    await waitFor(async () => await evaluate(cdp, "document.querySelector('#cardScreen')?.classList.contains('active')"), "card screen");
    await screenshot(cdp, "focus-card-390x844.png");
    const scoreBeforeCard = await evaluate(cdp, "window.HeatherWordLegacyBridge.getSnapshot().player.score");
    await click(cdp, "#knowBtn");
    await waitFor(async () => (await evaluate(cdp, "window.HeatherWordLegacyBridge.getSnapshot().player.score")) >= scoreBeforeCard, "card result");
    await backToShell(cdp);

    await openGame(cdp, "choice");
    const scoreBeforeRound = await evaluate(cdp, "window.HeatherWordLegacyBridge.getSnapshot().player.score");
    for (let index = 0; index < 10; index += 1) {
      await waitFor(async () => await evaluate(cdp, "Boolean(document.querySelector('[data-word-id]'))"), `choice question ${index + 1}`);
      await answerCurrentChoice(cdp);
      if (index < 9) await waitFor(async () => await evaluate(cdp, "!document.querySelector('#gameBox')?.classList.contains('answer-review-mode') && Boolean(document.querySelector('[data-word-id]')) && !document.querySelector('[data-word-id]')?.disabled"), `choice advance ${index + 1}`, 3000);
      await delay(720);
    }
    await waitFor(async () => await evaluate(cdp, "Boolean(document.querySelector('.round-complete'))"), "choice round completion", 5000);
    const scoreAfterRound = await evaluate(cdp, "window.HeatherWordLegacyBridge.getSnapshot().player.score");
    if (scoreAfterRound <= scoreBeforeRound) throw new Error("Choice round did not increase score");
    await screenshot(cdp, "focus-game-complete-390x844.png");
    await backToShell(cdp);

    await openGame(cdp, "block");
    await waitFor(async () => await evaluate(cdp, "Boolean(document.querySelector('[data-bank-index]'))"), "block bank");
    await answerCurrentBlock(cdp);
    await waitFor(async () => await evaluate(cdp, "document.querySelector('#feedback')?.classList.contains('good')"), "block correct");
    await backToShell(cdp);

    await openGame(cdp, "blank");
    await waitFor(async () => await evaluate(cdp, "Boolean(document.querySelector('#answerInput'))"), "blank input");
    let meaning = await evaluate(cdp, "document.querySelector('.question-meaning')?.textContent.trim() || ''");
    await answerCurrentText(cdp, answerForMeaning(meaning), true);
    await waitFor(async () => await evaluate(cdp, "document.querySelector('#feedback')?.classList.contains('good')"), "blank correct");
    await screenshot(cdp, "focus-game-blank-390x844.png");
    await backToShell(cdp);

    await openGame(cdp, "type");
    await waitFor(async () => await evaluate(cdp, "Boolean(document.querySelector('#answerInput'))"), "type input");
    meaning = await evaluate(cdp, "document.querySelector('.question-meaning')?.textContent.trim() || ''");
    await answerCurrentText(cdp, answerForMeaning(meaning), false);
    await waitFor(async () => await evaluate(cdp, "Boolean(document.querySelector('.answer-review'))"), "wrong answer review");
    await screenshot(cdp, "focus-game-wrong-390x844.png");
    await click(cdp, "#nextReviewBtn");
    await waitFor(async () => await evaluate(cdp, "Boolean(document.querySelector('#answerInput'))"), "next type input");
    meaning = await evaluate(cdp, "document.querySelector('.question-meaning')?.textContent.trim() || ''");
    await answerCurrentText(cdp, answerForMeaning(meaning), true);
    await waitFor(async () => await evaluate(cdp, "document.querySelector('#feedback')?.classList.contains('good')"), "type correct");
    await backToShell(cdp);

    for (const screen of ["collection", "pet", "dress", "shop", "rank"]) {
      await evaluate(cdp, `window.HeatherWordUI.openLegacy(${JSON.stringify(screen)})`);
      await waitFor(async () => await evaluate(cdp, `document.querySelector(${JSON.stringify(`#${screen === "rank" ? "rank" : screen}Screen`)})?.classList.contains('active')`), `${screen} screen`);
      await screenshot(cdp, `focus-${screen}-390x844.png`);
      await backToShell(cdp);
    }

    await setTab(cdp, "my");
    await click(cdp, "[data-hw9-action='parent']");
    await waitFor(async () => await evaluate(cdp, "document.querySelector('#hw9ParentDialog')?.open === true"), "parent gate");
    await evaluate(cdp, `(() => { const d=document.querySelector('#hw9ParentDialog'); d.querySelector('[data-hw9-parent-pin]').value='2580'; d.querySelector('[data-hw9-parent-confirm]').value='2580'; d.querySelector('[data-hw9-parent-form]').requestSubmit(); })()`);
    await waitFor(async () => await evaluate(cdp, "document.querySelector('#manageScreen')?.classList.contains('active')"), "parent management");
    await screenshot(cdp, "focus-parent-manage-390x844.png");

    const originalWords = await evaluate(cdp, "window.HeatherWordLegacyBridge.getSnapshot().words.length");
    await click(cdp, "#addWordBtn");
    await waitFor(async () => await evaluate(cdp, "document.querySelector('#wordDialog')?.open === true"), "word dialog");
    await evaluate(cdp, `(() => { document.querySelector('#wordInput').value='rocket'; document.querySelector('#meaningInput').value='로켓'; document.querySelector('#emojiInput').value=''; document.querySelector('#wordCategoryInput').value='custom'; document.querySelector('#saveWordBtn').click(); })()`);
    await waitFor(async () => (await evaluate(cdp, "window.HeatherWordLegacyBridge.getSnapshot().words.length")) > originalWords, "word add");

    await click(cdp, "#bulkAddBtn");
    await waitFor(async () => await evaluate(cdp, "document.querySelector('#bulkDialog')?.open === true"), "bulk dialog");
    await evaluate(cdp, `(() => { document.querySelector('#bulkCategoryInput').value='custom'; document.querySelector('#bulkTextInput').value='moon / 달\\nstar / 별'; document.querySelector('#saveBulkBtn').click(); })()`);
    await waitFor(async () => (await evaluate(cdp, "window.HeatherWordLegacyBridge.getSnapshot().words.length")) >= originalWords + 3, "bulk add");

    const beforeReload = await evaluate(cdp, "localStorage.getItem('heather_word_v3')");
    await cdp.send("Page.reload", { ignoreCache: true });
    await waitFor(async () => await evaluate(cdp, "document.body?.dataset?.hw9Version === '9.0.0'"), "reload ready", 20000);
    const afterReload = await evaluate(cdp, "localStorage.getItem('heather_word_v3')");
    if (!beforeReload || !afterReload) throw new Error("Local state missing after reload");

    await setTab(cdp, "learn");
    await evaluate(cdp, "localStorage.setItem('heather_word_v3', JSON.stringify({player:{name:'New learner',score:0,coin:0,xp:0,knownCards:{},progress:{},dailyMission:{date:'2026-08-31',cardViews:0,gameCorrect:0,writingAttempts:0,rewarded:false}},categories:[],words:[],selectedCategoryId:'all'})); window.dispatchEvent(new CustomEvent('heather:state-change'));" );
    await delay(250);
    await screenshot(cdp, "state-empty-new-user-390x844.png");
    const emptyVisible = await evaluate(cdp, "document.querySelector('.hw9-empty-state')?.textContent.includes('단어가 없어요') === true");
    if (!emptyVisible) throw new Error("New-user empty state missing");

    const report = {
      version: await evaluate(cdp, "document.body.dataset.hw9Version"),
      screenshots: viewports.length + 5 + 10,
      consoleErrors,
      networkErrors,
      exceptions: errors,
      preservedLocalKey: await evaluate(cdp, "typeof localStorage.getItem('heather_word_v3') === 'string'"),
      generatedAt: new Date().toISOString()
    };
    await writeFile(join(outputDir, "qa-report.json"), JSON.stringify(report, null, 2));
    if (errors.length || consoleErrors.length || networkErrors.length) {
      throw new Error(`Browser errors: ${JSON.stringify({ errors, consoleErrors, networkErrors })}`);
    }
    cdp.close();
  } finally {
    chrome.kill("SIGTERM");
  }
}

run().catch(async (error) => {
  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, "qa-failure.txt"), `${error.stack || error}\n`);
  console.error(error);
  process.exitCode = 1;
});
