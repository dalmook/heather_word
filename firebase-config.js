// firebase-config.js
// Firebase를 아직 안 쓸 때는 이 파일을 그대로 두면 LOCAL 모드로 동작합니다.
// Firebase Console에서 Web app 설정값을 만든 뒤 아래 USE_FIREBASE를 true로 바꾸세요.

window.HEATHER_USE_FIREBASE = true;

// 같은 단어장을 공유할 그룹 ID입니다.
// 가족끼리 쓰면 "family-main", 반별로 쓰면 "class-1a"처럼 바꿔도 됩니다.
window.HEATHER_CLASS_ID = "heather-main";

window.HEATHER_FIREBASE_CONFIG = {
    apiKey: "AIzaSyDnNpNcZTPFaaSVDy2nK5w3JhAgP7IzwmQ",
    authDomain: "heather-d6112.firebaseapp.com",
    projectId: "heather-d6112",
    storageBucket: "heather-d6112.firebasestorage.app",
    messagingSenderId: "337773788613",
    appId: "1:337773788613:web:b508f3413977095c6b9fac",
};

// Season 2 is loaded as an additive layer so the existing app, LOCAL mode,
// Firebase mode, legacy data, and Phaser fallback remain intact.
(function installHeatherSeason2Loader() {
  const LOCAL_KEY = "heather_word_v3";
  const RELEASE = "8.0.0";

  // The legacy app keeps its own in-memory player object. Preserve a newer
  // Season 2 revision if the legacy save routine writes an older snapshot.
  if (!window.__HEATHER_SEASON2_STORAGE_GUARD__) {
    window.__HEATHER_SEASON2_STORAGE_GUARD__ = true;
    const nativeSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function guardedSetItem(key, value) {
      if (this === window.localStorage && key === LOCAL_KEY) {
        try {
          const current = JSON.parse(nativeSetItem === Storage.prototype.setItem
            ? "{}"
            : window.localStorage.getItem(LOCAL_KEY) || "{}");
          const incoming = JSON.parse(String(value));
          const currentPlayer = current?.player && typeof current.player === "object" ? current.player : {};
          const incomingPlayer = incoming?.player && typeof incoming.player === "object" ? incoming.player : {};
          const currentSeason2 = currentPlayer.season2 || currentPlayer.progress?.__season2;
          const incomingSeason2 = incomingPlayer.season2 || incomingPlayer.progress?.__season2;
          const currentRevision = Number(currentSeason2?.revision || 0);
          const incomingRevision = Number(incomingSeason2?.revision || 0);
          if (currentSeason2 && currentRevision > incomingRevision) {
            incoming.player = {
              ...incomingPlayer,
              season2: currentSeason2,
              progress: {
                ...(incomingPlayer.progress && typeof incomingPlayer.progress === "object" ? incomingPlayer.progress : {}),
                __season2: currentSeason2
              }
            };
            value = JSON.stringify(incoming);
          }
        } catch {
          // Invalid legacy data is handled by the idempotent migration layer.
        }
      }
      return nativeSetItem.call(this, key, value);
    };
  }

  function loadSeason2() {
    if (document.querySelector("script[data-heather-season2]")) return;

    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.href = `./season2.css?v=${RELEASE}`;
    style.dataset.heatherSeason2 = RELEASE;
    document.head.appendChild(style);

    const script = document.createElement("script");
    script.type = "module";
    script.src = `./season2.js?v=${RELEASE}`;
    script.dataset.heatherSeason2 = RELEASE;
    document.body.appendChild(script);
  }

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", () => setTimeout(loadSeason2, 0), { once: true });
  } else {
    setTimeout(loadSeason2, 0);
  }
})();
