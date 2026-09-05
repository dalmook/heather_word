# 어린이 UX 리뉴얼 — 7~10세 / v11

## 요청과 기준
2026-09-05 사용자 피드백: 기존 화면이 너무 밋밋하므로 7~10세 어린이 대상으로 수정하고 즉시 배포.
기준 운영 커밋: `9619c674ce71e3959661fdc09172e24c843a80f2`.
기존 40개 기능군과 저장 키는 유지한다. 기존 화면의 작은 파트너 그림과 긴 대시보드 설명을 큰 캐릭터, 짧은 지시와 실제 학습 단계로 바꾼다.

## 구현
홈의 숲 풍경·말풍선·실제 파트너, 첫 화면의 56px 시작 버튼, 실제 진도 기반 4단계 탐험 길을 구현했다. 신규 사용자의 안내 캐릭터는 소유품으로 표시하거나 보상으로 지급하지 않는다.

상위 메뉴는 홈/단어/놀이/친구/나로 바꿨다. 네 게임에 고유 SVG 그림과 색상, 짧은 설명을 제공하고 실제 학습 화면에 모드별 지시문과 큰 선택지/글자 블록을 적용했다. 빈칸 모드는 기존 판정에 맞게 **단어 전체**를 쓰도록 명시한다. 예정된 복습이 없다는 이유만으로 복습을 완료했다고 표시하지 않는다.

카드5·정답5·쓰기3과 모험5/7/5/4문제, 점수·보상 계산은 변경하지 않는다. PIN·기록·도감·상점·펫·관리·백업 경로를 유지한다. PR22의 빈 카테고리 표시/실제 게임 시작 대상 불일치는 실제 dropdown 값과 순수 fallback 함수로 해결했다.

디자인은 기존 ui/tokens.css, components.css, layout.css, legacy.css의 소유 경계 안에서 정리했다. 무한 애니메이션·강제 타이머·자동 음성·새 결제/추적 SDK는 추가하지 않았다. 시스템 및 사용자 모션 줄이기를 존중한다.

## 검증 증거
앱 구현 `243c2f94aac5c2c04b60fb3cacd54d8056323d4f` 기준:
https://github.com/dalmook/heather_word/actions/runs/33949460483

- 단위·계약·기존 엔진 해시 검사 49개 통과, SVG60개 구조 검사 통과.
- 기존 확장 학습/검색/모바일 확인 69개 통과.
- 어린이 추가 확인 9개: 360/390/430/768/1440px 첫 화면 시작 버튼과 실제 4단계, 그림 4개, 빈 카테고리에서 실제 전체 문제 시작, 지시문, reduced motion.
- 별도 레이아웃/실제 포인터 확인 27개 통과.
- 총 PNG65개 확보. 실제 렌더링한 신규/기존/완료 홈, 놀이, 집중 학습 화면을 시각 점검했다.
- 수집된 JS 예외/console error/HTTP 4xx·5xx는 0. 학습 회귀에 Chromium 소프트웨어 WebGL fallback deprecation 경고 1개가 있다. 보안 수준을 낮추는 플래그를 넣어 경고를 감추지 않았다.
- LOCAL 모바일 Lighthouse12.2.1 단일 측정: Performance88 / Accessibility100 / Best Practices100 / SEO100. 실서비스망·실기기 전체 성능이나 WCAG 인증이 아니다.

`63864e80503383f9862528de94d2d5a1c9c78b3f`는 테스트 실행 상한만 보강했고 PR의 네 워크플로 모두 통과했다. 이후 빈칸/복습 문구 수정에는 회귀 테스트 2개를 추가했다. 최종 병합 커밋과 배포 검증 결과는 PR23의 릴리스 댓글을 참조한다.

## 데이터 보존과 경계
`app.js`, `season2.js`, `season2-core.js`, `monster-catalog-season2.js`, `avatar-phaser.js`, `firestore.rules`, `words.json`은 v10 기준 바이트 동일성을 검사한다. 운영 Firebase 데이터는 수정하지 않고 격리된 LOCAL 브라우저에만 테스트 fixture를 넣었다.

실제 어린이 사용성 연구, 물리 iOS/Android 키보드·발음, Firebase 다중 기기/권한·실제 상품권 처리를 수행했다고 주장하지 않는다. 해당 운영 검증 경계는 기존 QUALITY_REPORT.md와 동일하다.

## 배포/롤백
사용자가 즉시 배포를 승인했다. PR23에서 최종 검사가 통과한 커밋만 기존 main/root Pages로 병합하고, 실제 Pages 자산과 화면 검사를 확인한다. 이전 버전은 `backup/pre-kids-ux-20260905`에 보존했다. 코드 롤백 시 사용자 저장소는 삭제하지 않는다.

## 설계 참고
https://www.nngroup.com/articles/children-ux-physical-development/
https://www.nngroup.com/videos/designing-children/
https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html
