// firebase-config.example.js
// 1) Firebase Console > Project settings > Your apps > Web app에서 받은 firebaseConfig를 아래에 붙여 넣으세요.
// 2) 파일 이름을 firebase-config.js 로 바꾸거나, firebase.html 안의 설정 패널에 그대로 붙여 넣어도 됩니다.
// 3) Firebase web config는 비밀번호가 아닙니다. 다만 Firebase 보안 규칙과 도메인 제한은 꼭 설정하세요.

window.HEATHER_FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// 같은 단어장을 공유할 그룹 ID입니다. 가족/반/친구그룹 단위로 바꿀 수 있습니다.
window.HEATHER_CLASS_ID = "heather-main";
