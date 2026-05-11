// firebase-config.js
// Firebase를 아직 안 쓸 때는 이 파일을 그대로 두면 LOCAL 모드로 동작합니다.
// Firebase Console에서 Web app 설정값을 만든 뒤 아래 USE_FIREBASE를 true로 바꾸세요.

window.HEATHER_USE_FIREBASE = false;

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
