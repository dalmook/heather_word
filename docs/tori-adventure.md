# 토리 단어 모험 — v14 presentation layer

## 실행
기존과 동일한 정적 웹 앱입니다. 별도의 빌드나 서버 API 변경은 없습니다.

```sh
npm run check
python3 -m http.server 8765
# 다른 터미널 (브라우저 테스트 의존성은 로컬 개발용)
npm install --no-save --package-lock=false playwright@1.51.1
npx playwright install chromium
node tests/bunny-browser.mjs
```

실제 데이터 없는 체험: `http://localhost:8765/?demo=1&mode=local#/home`.
개인 브라우저의 실제 학습 저장소를 테스트로 덮어쓰지 마세요.

## 구조
- `bunny-art.js`: 독자 제작 흰 토끼 SVG 리그, 섬 배경, 순수 설정 정규화.
- `bunny-adventure.css`: 반응형 장면, 6가지 상태, 타이핑/완주 화면, 동작 줄이기.
- `bunny-audio.js`: 외부 음원 없는 오리지널 Web Audio 선율. 명시적 활성화 이후 재생, 발음 중 감소, 화면 비활성 시 중지.
- `bunny-adventure.js`: 기존 화면과 읽기 전용 상태를 관찰해 연출만 적용. 게임 엔진은 기존 판정·보상을 단독 소유합니다.
- `ui/components.js`: 실제 저장 상태를 읽는 홈. 기존 친구 수집, 옷장, 펫과 상점은 유지됩니다.

새 저장 키는 `heather_bunny_preferences_v1`, 체험은 `heather_bunny_demo_preferences_v1`뿐입니다. 단어/점수/쿠키/Firebase/부모 잠금/수집 ID를 변경하거나 초기화하지 않습니다. 캐릭터를 클릭해도 학습 보상이 지급되지 않습니다.

정답 수에 따라 음악 레이어와 연출이 커집니다. 정답 수는 해당 라운드의 기존 집계이며 추가 통화가 아닙니다. 3연속 정답 보너스 등 기존 보상 규칙은 그대로입니다.

Dopa Drill은 상호작용 방향의 참고 자료입니다. 해당 프로젝트의 캐릭터, 브랜드, 그림, 음악, 소스 코드를 복제하지 않았습니다.

## 검수 범위
단위 테스트 79개와 실제 Chromium 브라우저 테스트를 사용합니다. GitHub Actions가 작은 휴대폰/태블릿/데스크톱, 기존 4종 게임, 21문제 모험, 정오답·완주, 실제 오디오 활성화, 저장 격리, 옷장/진화/부화, 부모 잠금과 보고서 기능을 검사합니다. 결과와 화면은 각 워크플로 아티팩트에 남습니다. 브라우저 에뮬레이션은 실제 iOS/Safari/Android 기기 테스트를 대체하지 않습니다.

기존 시각 검사 중 녹색 제목 고정값과 인간 아바타 DOM 선택자만 새 팔레트/토끼에 맞게 변경했습니다. 텍스트 겹침 금지, 56px 이상 시작 버튼, 모든 모드의 원래 보상과 저장 보호 검사는 유지합니다.
