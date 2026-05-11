# Heather Word v3 · Firebase 버전

초등학교 1학년용 영어 단어/스펠링 학습 앱입니다.

## 이번 버전의 방향

- `index.html`, `style.css`, `app.js`, `words.json`으로 분리
- 스캔/OCR 제거
- 한 화면 앱 구조
- 정답 시 자동 다음 문제 이동
- 키보드가 올라와도 입력창이 보이도록 `visualViewport` 대응
- 기본은 LOCAL 모드
- Firebase 설정을 넣으면 여러 기기에서 단어/카테고리 공유
- 익명 로그인 기반 사용자별 점수/랭킹 지원

## 파일 구조

```text
heather_word/
├─ index.html
├─ style.css
├─ app.js
├─ words.json
├─ firebase-config.js
├─ firestore.rules
└─ README.md
```

## Firebase 연결 방법

1. Firebase Console에서 프로젝트 생성
2. Authentication > Sign-in method > Anonymous 사용 설정
3. Firestore Database 생성
4. `firestore.rules` 내용을 Firestore Rules에 붙여넣고 Publish
5. Project settings > Your apps > Web app 생성
6. 받은 설정값을 `firebase-config.js`에 입력
7. `window.HEATHER_USE_FIREBASE = true;` 로 변경

## GitHub Pages

Settings > Pages > Deploy from a branch > `main` / `/root`

## 기존 index.html에서 바로 고칠 핵심

### 1. 맞히면 다음 문제로 넘어가기

찾기용:

```js
setTimeout(newGame,950)
```

교체용:

```js
clearTimeout(nextTimer);
nextTimer = setTimeout(() => {
  newQuestion();
}, 650);
```

### 2. 스캔 제거

찾기용:

```html
<button class="tab" data-p="scan">📷스캔</button>
```

교체용:

```html
<!-- 스캔 탭 제거 -->
```

그리고 `scan` 섹션 전체와 `Tesseract.js` script를 제거하세요.

### 3. 한 화면 고정

찾기용:

```css
body{margin:0;
```

교체용:

```css
html, body {
  width: 100%;
  height: var(--vh);
  margin: 0;
  overflow: hidden;
  overscroll-behavior: none;
}
```

### 4. 키보드 대응

찾기용:

```js
render();newGame();
```

교체용:

```js
setupViewport();
render();
newQuestion();
```

그리고 `app.js`의 `setupViewport()` 함수를 추가하세요.
