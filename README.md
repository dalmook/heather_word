# Heather Word 12 — 작은 단어, 커다란 세상

7~10세 어린이를 위한 영어 단어·철자 학습 앱입니다. 숲속 도서관 원화와 네 단계의 탐험 길, 카드·철자 놀이, 실제 기록을 보는 보호자 공간을 제공합니다. 기존 학습 알고리즘과 점수·보상·단어장 데이터를 유지합니다.

운영 주소: `https://dalmook.github.io/heather_word/`

무료 체험: `https://dalmook.github.io/heather_word/?mode=local&demo=1#/home`

## 이번 변경
- 원화: 숲속 도서관과 세 탐험 친구의 최적화된 WebP, 숲 색상과 반응형 화면.
- 첫 방문: 가입 없이 6개 주제·60개 기본 단어로 무료 체험. 기존 데이터와 별도 저장.
- 보호자 공간: PIN 확인 후 최근 7일 학습, 숙련도, 복습 단어, 인쇄/PDF·요약 복사.
- 이용 안내: 현재 무료 범위와 준비 중인 가족 멤버십을 명확히 구분.
- 홈: 실제 파트너와 큰 시작 버튼, 실제 모험 진도, 오늘의 작은 미션.
- 단어: 카드·복습·카테고리·검색 가능한 전체 단어장.
- 놀이: 뜻/블록/빈칸/쓰기, 각 방식에 맞는 그림과 짧은 안내.
- 친구: 두 도감, 펫, 파트너와 내 모습 꾸미기.
- 나: 기록·상점·설정·보호자 도구. 기존 PIN과 관리자 권한 경계를 유지.

정적 앱으로 빌드 없이 GitHub Pages main/root에서 실행됩니다. hash 라우팅과 상대 자산 경로를 사용합니다. 서버·결제·추적 SDK를 추가하지 않았습니다.

## 실행
프로젝트 상위 폴더에서:

```bash
python -m http.server 4173
```

Windows에서는 `python` 대신 `py`를 사용할 수 있습니다.
브라우저에서 `http://localhost:4173/heather_word/?mode=local#/home`을 엽니다. ES modules를 쓰므로 HTML을 더블클릭하지 말고 HTTP로 실행합니다. 검토 중 운영 Firebase 쓰기를 피하려면 `mode=local`을 유지하세요.

Node.js22에서 프로젝트 폴더로 이동하여:

```bash
npm run check
```

단위 검사에 추가 npm 의존성 설치는 필요하지 않습니다. 실제 브라우저 검사는 Chrome과 HTTP 서버가 필요합니다. CI는 원본 소스, 테스트 로그, 스크린샷과 Lighthouse JSON을 아티팩트로 저장합니다.

## 코드와 문서
`app.js`와 `season2-core.js`는 학습 로직, `ui-v9.js`와 `ui-v9-core.js`는 화면 연결 및 비파괴 표시 상태입니다. 파일명은 호환을 위해 유지합니다. `ui/components.js`, `ui/tokens.css`, `ui/components.css`, `ui/layout.css`, `ui/legacy.css`는 공통 표시·디자인 시스템·기존 화면 호환 경계입니다.

[KIDS_UX_RELEASE.md](KIDS_UX_RELEASE.md): v11 대상·설계·검증·배포 경계.
[CURRENT_APP_AUDIT.md](CURRENT_APP_AUDIT.md), [REDESIGN_PLAN.md](REDESIGN_PLAN.md), [FEATURE_REGRESSION_CHECKLIST.md](FEATURE_REGRESSION_CHECKLIST.md), [QUALITY_REPORT.md](QUALITY_REPORT.md): v10 전면 개편 당시의 40개 기능군과 기준 기록. 이전 릴리스 기록의 수치/배포 상태를 현재 상태로 혼동하지 마세요.

`heather_word_v3`, 기존 player 필드, 시즌2 schema8 및 `player.progress.__season2` 경로를 유지합니다. 명시적 demo=1 체험만 `heather_word_demo_v1`을 사용하고 LOCAL 모드를 강제합니다. 체험 PIN·세션도 별도로 보관합니다. 보호자 PIN은 기기 화면 잠금이지 서버 관리자 인증이나 결제 보안이 아닙니다. Firebase 설정과 Firestore 규칙 배포는 별도 운영 관리입니다.

## 배포와 롤백
검증한 PR을 main에 병합한 뒤 Pages 빌드 및 실제 자산/모바일·PC 메뉴 smoke 결과를 확인합니다. v12 구현 범위와 검증은 [docs/explorers-release.md](docs/explorers-release.md)에 기록합니다. v11 직전 운영 코드는 `backup/pre-kids-ux-20260905`에 보존했습니다. 롤백 시 코드 커밋을 되돌리며 사용자 학습 기록을 삭제하지 않습니다.

실기기 키보드·음성, Firebase 다중 기기 충돌·권한·상품권 운영 흐름은 별도 확인 대상입니다. 완전한 콜드 오프라인 실행용 서비스워커는 추가하지 않았습니다.

실제 유료 결제는 아직 활성화하지 않았습니다. 준비 중인 가족 멤버십은 예정 기능이며, 구매 권한/결제 서버 및 운영 계정 연동 후 판매할 수 있습니다.
