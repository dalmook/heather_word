# Heather Word 9.0

어린이가 즐겁게 반복 학습하고, 보호자가 봐도 정돈된 **모바일 우선 영어 단어·철자 학습 게임**입니다. 빌드 도구 없이 GitHub Pages에서 실행되며 기존 LOCAL/Firebase 데이터와 기능을 그대로 이어서 사용합니다.

운영 주소: `https://dalmook.github.io/heather_word/`

## 9.0 정보구조

상위 내비게이션은 다섯 곳으로 제한했습니다.

- **홈**: 파트너, 오늘 진행도, `이어서 학습하기`, 오늘 목표, 연속 학습
- **학습**: 카드 학습, 오늘 복습, 카테고리, 내 단어장
- **게임**: 뜻, 블록, 빈칸, 쓰기
- **컬렉션**: 시즌 2 파트너, 몬스터 도감, 펫, 아바타·드레스룸
- **MY**: 프로필, 기록, 쿠키샵, 설정, 보호자 도구

기존 카드·게임·도감·펫·드레스룸·상점·랭킹·관리 화면은 `HeatherWordLegacyBridge`를 통해 새 앱 셸 안에서 독립적인 집중 화면으로 열립니다. 브라우저 뒤로가기와 `#/home`, `#/learn`, `#/games`, `#/collection`, `#/my` 상태를 지원합니다.

## 데이터 호환성

기존 저장 구조를 교체하지 않습니다.

- localStorage 키: `heather_word_v3`
- 기존 player 필드: 점수, XP, 쿠키, 콤보, 단어 진도, 일일 미션, 몬스터, 펫, 아바타, 테마, 상품권 신청
- 시즌 2 데이터: `player.progress.__season2` 호환 경로 유지
- Firebase player 문서: 기존 구조를 그대로 읽고 저장

`ui-v9-core.js`는 저장 데이터를 수정하지 않고 새 화면에 필요한 표시 상태만 계산합니다. 손상되거나 일부 필드가 없는 데이터도 안전한 기본값으로 표시합니다.

## 주요 파일

```text
index.html                  기존 기능 DOM과 정적 진입점
style.css                   기존 기능 스타일
app.js                      기존 학습·상점·펫·아바타·관리 로직
ui-v9-core.js               비파괴 데이터 어댑터
ui-v9.js                    5탭 앱 셸, History API, 보호자 게이트
ui-v9.css                   9.0 디자인 토큰과 반응형 시스템
season2-core.js             숙련도·모험·보상 계산
season2.js / season2.css    시즌 2 화면
monster-catalog-season2.js  시즌 2 캐릭터 카탈로그
avatar-phaser.js            Phaser 아바타와 DOM 폴백
firestore.rules             Firestore 보안 규칙
```

## 디자인 시스템

`ui-v9.css`에 색상, 표면, 텍스트, 반경, 간격, 타이포그래피, 그림자 토큰을 정의했습니다. 주요 아이콘은 인라인 SVG 시스템을 사용하고, 캐릭터 그림만 콘텐츠의 중심에 둡니다.

- 8px 기반 간격 체계
- 44~48px 이상의 주요 터치 영역
- safe-area, 화면 회전, 긴 이름·카테고리·단어 대응
- `visualViewport` 기반 모바일 키보드 대응 유지
- 키보드 포커스, aria-label, aria-live, reduced motion 지원
- 모바일 360px부터 태블릿·데스크톱 920px 앱 셸까지 대응

## 보호자·관리자 보안

공개 JavaScript에 있던 고정 관리 비밀번호는 제거했습니다.

- 일반 보호자 도구: 기기에서 처음 설정하는 4~8자리 PIN을 salt와 SHA-256 hash 형태로 localStorage에 저장합니다. 이 PIN은 **해당 기기 화면 잠금**이며 서버 관리자 인증이 아닙니다.
- Firebase 관리자 기능: `admin: true` custom claim이 있는 사용자만 다른 사용자의 상품권 상태를 변경할 수 있도록 `firestore.rules`를 강화했습니다.
- Firestore 규칙 파일을 GitHub에 올리는 것만으로 Firebase 프로젝트에 자동 배포되지는 않습니다. Firebase 관리자 인증으로 별도 게시해야 합니다.

```bash
firebase deploy --only firestore:rules --project heather-d6112
```

익명 사용자가 자신의 점수를 클라이언트에서 기록하는 현재 구조는 서버 검증 랭킹이 아닙니다. 공개 경쟁 기능은 참고 기록으로 취급하며, 신뢰 가능한 대회 랭킹에는 Cloud Functions 등 서버 측 점수 이벤트 검증이 추가로 필요합니다.

## LOCAL / Firebase

- 기본 Firebase 설정: `firebase-config.js`
- 강제 LOCAL 점검: 운영 주소 뒤에 `?mode=local` 추가
- Firebase·Phaser·시즌 2 모듈 중 하나가 실패해도 기존 학습 앱이 가능한 범위에서 계속 동작하도록 폴백을 유지합니다.

## 테스트

```bash
npm run check
```

실행 항목:

- JavaScript 구문 검사
- 기존 player·시즌 2 마이그레이션과 데이터 보존
- 적응형 숙련도·보상·부화·진화 테스트
- 5탭 정보구조·보안·접근성 계약 테스트
- 시즌 2 SVG 60개 구조 중복 검사

`.github/workflows/ui-v9-audit.yml`은 실제 Chromium에서 다음을 검증합니다.

- 360×800, 375×812, 390×844, 412×915, 430×932, 768×1024, 1440×1000
- 신규 사용자와 기존 사용자
- 카드 학습
- 뜻·블록·빈칸·쓰기 게임
- 정답·오답·10문제 완주·점수 증가
- 컬렉션·펫·드레스룸·상점·랭킹·보호자 화면
- 단어 추가·일괄 추가·새로고침 후 데이터 보존
- JavaScript 예외, console error, HTTP 4xx/5xx
- Lighthouse 성능·접근성·Best Practices

## GitHub Pages 배포

Settings → Pages → Deploy from a branch → `main` / `/root`

운영 배포 뒤 `.github/workflows/live-pages-smoke.yml`이 실제 Pages 자산과 모바일·데스크톱 DOM을 다시 확인하고 스크린샷을 아티팩트로 남깁니다.

## 롤백

9.0 전 운영 상태는 다음 브랜치에 보존되어 있습니다.

```text
backup/pre-commercial-ui-20260830
```

문제가 생기면 해당 브랜치의 커밋으로 `main`을 되돌릴 수 있습니다. 9.0은 기존 `heather_word_v3` 필드를 삭제하지 않으므로 롤백 시 기존 점수·단어·아이템을 다시 초기화하지 않습니다.

## 남은 기술 부채

- 공개 경쟁 랭킹의 서버 검증
- 공유 단어장 쓰기 권한을 교사·관리자 claim으로 분리
- Firebase custom claims 발급용 안전한 관리자 도구 또는 Cloud Function
- Phaser CDN 의존성을 자체 호스팅 자산으로 전환하는 선택지 검토
