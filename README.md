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


## v3.1 수정 내용

- 카드 화면에서 `알아요 +5`를 같은 단어에서 무한 클릭해 점수가 계속 오르던 문제 수정
- `알아요` 또는 `어려워요` 클릭 시 자동으로 다음 카드 이동
- 빈칸/쓰기 화면에서 자동 포커스를 제거해 키보드가 갑자기 올라오지 않도록 수정
- 키보드가 올라오면 상단바와 모드탭을 숨겨 입력창이 가려지지 않도록 수정
- 입력창 placeholder를 `전체 단어 쓰기`에서 `영어 단어`로 짧게 변경


## v3.2 수정 내용

- 빈칸/쓰기 모드에 들어가면 상단바와 모드 탭을 숨기는 `typing-mode` 적용
- 키보드를 쓰는 게임은 큰 이미지/헤더를 줄이고 뜻 + 입력창 중심으로 재구성
- `알아요 +5`는 단어별 1회만 점수 지급
- 이미 완료한 카드가 다시 돌아오면 `✅ 완료 · 다음`으로 표시하고 점수 미지급
- 캐릭터 성장 단계를 11단계로 확장
- 성장 필요 XP를 크게 증가시킴: 300 → 800 → 1500 → 3000 → 5000 → 8000 → 12000 → 18000 → 26000 → 36000 → 50000


## v3.3 수정 내용

- 관리 화면에서 단어가 6개만 보이던 제한 수정
- 단어 목록을 전체 표시하도록 변경
- 게임 화면은 한 화면 유지
- 관리 화면의 단어 목록 영역만 내부 스크롤 가능하게 변경


## v3.4 수정 내용

- 관리 화면에 `🗑️ 카테고리 삭제` 버튼 추가
- 사용자가 추가한 카테고리 삭제 가능
- 기본 카테고리와 전체 카테고리는 삭제 방지
- 삭제한 카테고리에 있던 단어는 `직접추가` 카테고리로 이동
- 단어 추가 팝업 자동 포커스 제거
- 키보드가 올라와도 팝업 하단 저장 버튼이 보이도록 dialog 위치/높이 수정
