# Heather Word 10.0

카드·철자 게임·4단계 모험을 제공하는 모바일 우선 영어 학습 앱입니다. 기존 학습·보상·컬렉션 로직을 유지하면서 홈, 콘텐츠 선택, 단어장, 내비게이션과 공통 디자인 시스템을 재설계했습니다. 빌드 없이 GitHub Pages에서 실행됩니다.

운영 주소: `https://dalmook.github.io/heather_word/`

이 리뉴얼은 `redesign/commercial-20260905`에서 검토합니다. main 병합 전 운영 화면은 바뀌지 않습니다. UI 구현·자동 검증과 실제 유료 출시 승인은 구분합니다. 실행 결과와 미검증 항목은 [QUALITY_REPORT.md](QUALITY_REPORT.md)를 먼저 확인하세요.

## 사용자 흐름

홈은 다음 학습 행동, 모험 4단계 진행도, 오늘의 미션을 구분합니다. 첫 실행에는 비활성 시작 버튼 대신 단어장을 준비하는 경로를 제공합니다. 학습 탭은 복습·카드·검색 가능한 전체 단어장·카테고리, 게임 탭은 카테고리 선택 후 뜻/블록/빈칸/쓰기 4가지 방식으로 연결합니다.

컬렉션에는 시즌2 60종과 기존 1,000종 도감·펫·드레스룸을 모두 유지합니다. MY에서 기록, 상점, 설정, 보호자 단어 관리와 리포트를 엽니다. 모바일은 하단 5탭, 넓은 화면은 사이드 내비게이션을 사용합니다.

## 구조와 문서

|파일|역할|
|---|---|
|CURRENT_APP_AUDIT.md|변경 전 구조·기능·문제·기준 측정|
|REDESIGN_PLAN.md|구현 전 UX·정보 구조·디자인 시스템 계획|
|FEATURE_REGRESSION_CHECKLIST.md|40개 기능군의 원래 동작·파일·데이터·재검증 방법|
|QUALITY_REPORT.md|실행 증거·보존 범위·출시 전 남은 검증|
|app.js / style.css|기존 학습·상점·펫·아바타·관리 로직과 호환 스타일|
|ui-v9.js / ui-v9-core.js|내비게이션·PIN·이벤트·비파괴 표시 어댑터; 호환을 위해 파일명 유지|
|ui/components.js|공통 표시 함수·홈·전체 단어장 페이지 처리|
|ui-v9.css|디자인 스타일 모듈의 단일 진입점|
|ui/tokens.css|색·타입·4px 기반 간격·반경·모션·safe-area 토큰|
|ui/components.css / ui/layout.css|공통 컨트롤 및 반응형 화면 구조|
|ui/legacy.css|기존 집중 학습 화면과 시즌2의 UI 호환 경계|
|season2-core.js / season2.js|기존 적응형 계산 및 모험 화면|
|monster-catalog-season2.js / avatar-phaser.js|기존 캐릭터와 아바타|
|manifest.webmanifest / 404.html|상대 경로 앱 메타데이터와 오류 안내|

## 데이터와 권한

`heather_word_v3`, `heather_parent_gate_v1`, 기존 player 필드, 시즌2 schema8과 `player.progress.__season2` 호환 경로를 유지합니다. `words.json`에 시연용 단어를 넣지 않았습니다. 테스트용 단어는 CI의 격리된 LOCAL 브라우저 안에서만 생성합니다.

보호자 PIN은 현재 기기의 화면 잠금입니다. 서버 인증, 결제 권한, 데이터 암호화가 아닙니다. 시즌2 리포트도 같은 PIN 경로를 사용합니다. Firestore 규칙과 Firebase 프로젝트 설정은 이번 작업에서 변경·배포하지 않았습니다. 실제 guardian/admin custom claim과 공유 단어장 권한은 출시 전에 별도 계정으로 검증해야 합니다. 클라이언트 기록 랭킹을 서버 검증 순위로 간주하지 마세요.

## 로컬 실행

ZIP의 `heather_word` 폴더가 있는 상위 폴더에서 실행합니다. Windows에서는 `python` 대신 `py`를 사용할 수 있습니다.

```bash
python -m http.server 4173
```

브라우저: `http://localhost:4173/heather_word/?mode=local#/home`

검토에는 `?mode=local`을 사용해 운영 Firebase 쓰기와 분리하세요. ES modules를 사용하므로 index.html을 파일로 더블클릭하지 말고 HTTP 서버로 열어야 합니다.

## 검증

Node.js 22 환경에서 프로젝트 폴더로 이동해 실행합니다. 단위 검사에는 추가 npm 의존성 설치가 필요하지 않습니다.

```bash
npm run check
```

`.github/workflows/commercial-review.yml`은 읽기 전용 권한으로 단위/보존 검사, 60종 SVG 검사, 실제 Chromium 학습 흐름, 모바일 레이아웃·입력·키보드·포인터 검사, 콘솔 경고 진단, Lighthouse를 실행합니다. 소스·로그·JSON·스크린샷은 `heather-commercial-review-source` 아티팩트에 함께 저장됩니다. 브라우저 스크립트는 실행 가능한 Chrome과 HTTP 서버가 필요합니다.

앱 아이콘 재생성이 필요한 개발 환경에서만 `tools/build-brand-assets.py`를 사용합니다. Pillow/CairoSVG와 시스템 한글 폰트가 필요하며 앱 실행에는 필요하지 않습니다. 폰트 파일은 저장소나 배포물에 포함하지 않습니다.

## Pages 배포와 롤백

기존 main/root 정적 호스팅과 hash 라우팅을 유지합니다. PR 검토 및 실기기·Firebase 검증 후 기존 배포 경로로 병합하세요. 이 작업은 main 병합, Firebase 규칙 게시, 결제 기능 추가를 수행하지 않았습니다.

배포 후 기존 `live-pages-smoke.yml` 결과와 실제 주소를 확인합니다. 문제가 있으면 리뉴얼 병합 커밋을 revert하여 이전 코드로 복원합니다. 기준 코드는 `41ccac96d04d32a114879dbbb43e2f726a94385f`입니다. 사용자 학습 기록을 지우거나 localStorage를 초기화하는 방식으로 롤백하지 않습니다.

## 출시 전 확인

실제 iOS/Android 키보드·발음, 클라우드 다중 기기 동기화·권한, 백업/복원과 상품권 운영 흐름, 접근성 보조기기, 개인정보·콘텐츠 사용 권한을 확인해야 합니다. 완전한 콜드 오프라인 실행을 제공하는 서비스워커나 구독·결제 백엔드는 새로 추가하지 않았습니다.
