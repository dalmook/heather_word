const POLISH_VERSION = "8.1.0";
const READY_CLASS = "s2-market-home";

let installTimer = null;
let installAttempts = 0;
let bodyObserver = null;
let missionObserver = null;

function createUtilityBar() {
  const utility = document.createElement("section");
  utility.id = "s2HomeUtility";
  utility.className = "s2-market-utility";
  utility.setAttribute("aria-label", "학습 설정과 사용자 프로필");
  utility.innerHTML = `
    <div class="s2-market-utility-copy">
      <span>DAILY LEARNING</span>
      <strong>오늘도 5분이면 충분해요</strong>
    </div>
    <div class="s2-market-utility-actions"></div>
  `;
  return utility;
}

function createSectionHeading(kicker, title, description) {
  const heading = document.createElement("div");
  heading.className = "s2-market-section-heading";
  heading.innerHTML = `
    <div><span>${kicker}</span><strong>${title}</strong></div>
    <small>${description}</small>
  `;
  return heading;
}

function enhanceCollectionPanel(panel) {
  if (!panel || panel.dataset.s2MarketEnhanced === "true") return;
  panel.dataset.s2MarketEnhanced = "true";
  panel.classList.add("s2-market-section", "s2-market-library");

  const title = panel.querySelector(".section-title");
  if (title) {
    title.classList.add("s2-market-native-heading");
    const strong = title.querySelector("strong");
    if (strong) strong.textContent = "내 단어장";
    if (!title.querySelector(".s2-market-heading-copy")) {
      const copy = document.createElement("span");
      copy.className = "s2-market-heading-copy";
      copy.textContent = "카테고리를 골라 바로 학습해요";
      title.insertBefore(copy, title.querySelector("button"));
    }
  }
}

function enhanceLaunchPanel(panel) {
  if (!panel || panel.dataset.s2MarketEnhanced === "true") return;
  panel.dataset.s2MarketEnhanced = "true";
  panel.classList.add("s2-market-section", "s2-market-practice");

  const actions = panel.querySelector(".main-actions");
  if (actions && !panel.querySelector(".s2-market-section-heading")) {
    panel.insertBefore(
      createSectionHeading("FREE PRACTICE", "자유 학습", "원하는 방식으로 편하게 연습해요"),
      actions
    );
  }

  panel.querySelectorAll(".big-action").forEach((button) => {
    button.classList.add("s2-market-action");
    const label = button.querySelector("b")?.textContent?.trim();
    if (label) button.setAttribute("aria-label", `${label} 열기`);
  });
}

function moveBaseControls(home, petCard, panel) {
  let utility = home.querySelector("#s2HomeUtility");
  if (!utility) utility = createUtilityBar();

  const actionSlot = utility.querySelector(".s2-market-utility-actions");
  const sound = document.querySelector("#soundToggle");
  const profile = document.querySelector("#profileBtn");
  if (sound && sound.parentElement !== actionSlot) actionSlot.appendChild(sound);
  if (profile && profile.parentElement !== actionSlot) actionSlot.appendChild(profile);

  if (utility.parentElement !== home) home.insertBefore(utility, home.firstChild);
  if (panel.parentElement !== home) home.insertBefore(panel, petCard);
  if (utility.nextElementSibling !== panel) utility.after(panel);

  const mission = petCard.querySelector(".mission-card") || home.querySelector(".mission-card");
  if (mission) {
    mission.classList.add("s2-market-mission");
    mission.dataset.s2Relocated = "mission";
    if (panel.nextElementSibling !== mission) panel.after(mission);
    watchMission(mission);
  }
}

function watchMission(mission) {
  if (missionObserver) return;
  missionObserver = new MutationObserver(() => {
    mission.classList.toggle("is-ready", Boolean(mission.querySelector(".mission-claim.ready")));
  });
  missionObserver.observe(mission, { subtree: true, childList: true, attributes: true, characterData: true });
}

function installHomePolish() {
  const home = document.querySelector("#homeScreen");
  const petCard = home?.querySelector(".pet-card");
  const panel = document.querySelector("#season2HomePanel");
  if (!home || !petCard || !panel) return false;

  document.body.dataset.homePolishVersion = POLISH_VERSION;
  document.body.classList.add("s2-market-ready");
  home.dataset.homePolishVersion = POLISH_VERSION;
  home.classList.add(READY_CLASS);

  panel.classList.add("s2-market-hero");
  panel.dataset.s2Relocated = "hero";
  moveBaseControls(home, petCard, panel);

  petCard.hidden = true;
  petCard.dataset.s2LegacyHero = "hidden";
  petCard.setAttribute("aria-hidden", "true");

  enhanceCollectionPanel(home.querySelector(".collection-panel"));
  enhanceLaunchPanel(home.querySelector(".launch-panel"));

  return true;
}

function scheduleInstall() {
  if (installAttempts >= 200) return;
  installAttempts += 1;
  clearTimeout(installTimer);
  installTimer = setTimeout(() => {
    if (!installHomePolish()) scheduleInstall();
  }, 60);
}

function boot() {
  installAttempts = 0;
  if (installHomePolish()) {
    bodyObserver = new MutationObserver(() => {
      const home = document.querySelector("#homeScreen");
      if (!home?.classList.contains(READY_CLASS) || document.querySelector("#season2HomePanel")?.parentElement !== home) {
        scheduleInstall();
      }
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true });
  } else {
    scheduleInstall();
  }

  window.HeatherWordHomePolish = Object.freeze({
    version: POLISH_VERSION,
    refresh: installHomePolish
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
