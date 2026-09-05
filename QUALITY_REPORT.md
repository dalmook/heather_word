# QUALITY_REPORT — Heather Word 10.0

검증일: 2026-09-05. 상태: **리뉴얼 구현 및 아래 자동 검증 통과, 운영 병합/유료 출시 승인 전**.

## 기준과 실행 증거

- 변경 전 main: `41ccac96d04d32a114879dbbb43e2f726a94385f`.
- 최종 앱 검증: `c4e39d23b9f665759eb8176cbe5af795580f4b9d`.
- 기준 실행: [Actions 33935708392](https://github.com/dalmook/heather_word/actions/runs/33935708392).
- 최종 실행: [Actions 33938178871](https://github.com/dalmook/heather_word/actions/runs/33938178871).
- 실행 소스·원본 로그·JSON·PNG: 각 실행의 `heather-commercial-review-source` 아티팩트. 보관 기간 14일이므로 장기 보관용으로 다운로드한다.

테스트는 Linux Chromium, Node.js 22, `http://127.0.0.1:4173/heather_word/` 하위 경로와 `?mode=local`에서 수행했다. 운영 Firebase 데이터는 테스트 픽스처로 쓰거나 수정하지 않았다. 이후 README/이 보고서/체크리스트 정리는 실행 파일 변경이 아니다.

## 결과

|항목|결과|원본 증거|
|---|---|---|
|단위·계약·보존·CSS 검사|44 / 44 통과|audit/check.txt|
|캐릭터 SVG|60개, 기하 해시 60개 고유|audit/check.txt|
|기존 브라우저 회귀|통과|audit/qa-report.json|
|추가 학습·검색·모바일 확인|69개 통과|audit/commercial-checks.json|
|안정된 화면·포인터 확인|27개 통과|audit/visual-qa.json|
|스크린샷 산출|56 PNG|audit/*.png|
|JS 예외 / console error / HTTP 4xx·5xx|학습 회귀 수집 범위에서 0 / 0 / 0|audit/qa-report.json|
|console warning / error|추가 시각 검사 수집 범위에서 0 / 0|audit/visual-qa.json|

기존 qa-report.json의 screenshots 값 22는 예전 스위트의 고정 집계다. 확장된 전체 PNG 파일을 직접 센 56개를 사용한다. 원본 증거를 임의로 수정하지 않았다. 기존 학습 스위트는 warning 이벤트를 수집하지 않으므로 앱 모든 상황의 경고가 0이라고 확대 해석하지 않는다.

## Lighthouse

동일한 Lighthouse 12.2.1 / LOCAL 모바일 프로필 / 프로젝트 하위 경로의 단일 측정이다. 실제 인터넷·Firebase·실기기 성능 보증이나 장기 평균은 아니다.

|카테고리|변경 전|최종|
|---|---:|---:|
|Performance|70|86|
|Accessibility|91|100|
|Best Practices|96|100|
|SEO|100|100|

최종 FCP 3.0초, LCP 3.4초, TBT 10ms, CLS 0.015. 초기 CSS/JS 로딩과 호환 스타일에는 추가 최적화 여지가 남아 있다. 숫자를 맞추기 위해 기존 학습/아바타 코드를 제거하지 않았다.

접근성 점수 100은 완전한 WCAG 적합성이나 모든 화면 검증을 뜻하지 않는다. 원본 결과의 `label-content-name-mismatch`에 프로필 버튼 표시 문구/접근성 이름 진단이 남아 있다. 보조기기·음성 제어를 포함한 수동 검토 대상으로 남긴다.

## 기능 보존

`tests/fixtures/commercial-baseline.json`의 원본 해시와 대조한다. `app.js`에서 UI render/navigate를 제외한 **기존 함수 194개**가 바이트 단위로 동일하다. `season2-core.js`, `monster-catalog-season2.js`, `avatar-phaser.js`, `firestore.rules`, `words.json`도 바이트 동일하다. 데이터 키·기존 점수와 아이템·시즌2 스키마를 교체하지 않았다.

40개 기능군은 `FEATURE_REGRESSION_CHECKLIST.md`에 현재 동작·파일·데이터·테스트 방법을 기록했다. 화면 재배치와 기능 삭제를 구분했으며 카드, 네 게임, 두 도감, 펫, 드레스룸, 상점, 랭킹, 상품권/관리 도구, 시즌2를 유지했다. 이 보존 검사가 모든 기능의 모든 조합을 E2E로 실행했다는 뜻은 아니다.

## 실제 실행한 주요 흐름

카드 진입/알아요, 뜻·블록·빈칸·쓰기 각 10문제 완료, 쓰기 오답→복습 피드백→다음→정답, 결과 화면, 카테고리 선택 후 게임, 게임 모드 새로고침, 21문제 4단계 모험 완료와 세션 재로드를 실행했다.

단어 추가/일괄 추가/재로드, 151개 목록 더보기, 검색창 DOM 및 포커스 유지, 한글 composition, PIN 최초 설정·오입력·재잠금·리포트 접근, JSON/CSV 컨트롤, 모션 줄이기, 오프라인 안내, Tab 포커스 격리, 실제 포인터 좌표를 통한 메뉴 클릭을 확인했다.

초기 홈은 360/375/390/412/430/768/1440px에서 캡처했다. 5탭 전체는 360/390/430/768/1440px에서 가로 넘침과 제목 색상을 검사했다. 모험 화면의 콘텐츠/하단 메뉴 배치도 실측했다. 첫 시각 점검에서 발견한 제목 색상 충돌과 시즌2 grid 행 배치를 수정하고 재검증했다.

## 운영 및 출시 경계

main·실제 Pages 배포·Firebase 규칙 배포는 하지 않았다. 별도 브랜치와 PR로 검토한다. 정적 파일·상대 자산·manifest·hash 라우팅·404 안내를 유지하며 새 백엔드/서비스워커/결제 SDK를 넣지 않았다. 새로 연 콜드 오프라인 환경까지 실행된다고 보장하지 않는다.

다음은 출시 전 별도 승인 대상이다.

- 실제 iOS/Android 키보드, safe-area, 화면 회전, TTS/음성, Safari/Firefox와 보조기기.
- Firebase guardian/admin 권한, 공유 단어장, 다중 기기 충돌, 실제 백업/복원 및 운영 상품권 처리. 실제 신청·승인은 테스트하지 않았다.
- 상점/장착/먹이/이미지 저장 및 각 게임의 모든 오답·힌트·날짜 경계 조합. 관련 기존 코드는 보존했지만 모든 UI 분기를 실행하지 않았다.
- 개인정보·콘텐츠 사용 권한·운영 정책과 실제 유료 모델. 기기 PIN은 서버 관리자 인증이나 결제 보안이 아니다.

## 배포/롤백

PR 검토와 위 승인을 마친 뒤 기존 main/root Pages 경로로 병합한다. 배포 후 실제 운영 URL과 기존 live-pages-smoke 실행을 확인한다. 문제 시 병합 커밋을 revert해 이전 코드로 돌아가며 사용자 저장소를 삭제하지 않는다. 학습 데이터 보존 정책을 코드 롤백과 별도로 유지한다.
