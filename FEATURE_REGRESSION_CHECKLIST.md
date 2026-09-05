# FEATURE_REGRESSION_CHECKLIST

기준 main `41ccac96`, 작성 2026-09-05. 앱 소스 변경 전 작성. 기존 기능은 모두 유지한다.

상태: **기준**=변경 전 소스에서 확인. **자동**=해당 자동 시나리오만 실제 통과. **수동 필요**=클라우드·실기기·운영 영향 등 이 작업에서 실행하지 않은 항목. 행 전체가 자동 검증됐다고 표시하지 않는다. 최종 결과는 `QUALITY_REPORT.md`에 실행 범위/증거와 함께 기록한다.

|ID|기능명|현재 동작|관련 파일|관련 데이터|리뉴얼 이후 테스트 방법|
|---|---|---|---|---|---|
|F01|초기 실행 / LOCAL·Firebase 전환|기존 데이터 로드, mode=local 강제 실행, 연결 실패 폴백|app.js, firebase-config.js|heather_word_v3 / Firebase player|빈 저장소·기존 저장소·통신 실패로 실행|
|F02|프로필 / 이름 / 소리|프로필 변경, TTS·효과음 설정 저장|app.js|player.name / sound|수정 후 새로고침·TTS 수동 확인|
|F03|카테고리 선택|전체·사용자 카테고리 선택을 카드와 게임에 반영|app.js|categories / selectedCategoryId|두 카테고리를 번갈아 선택|
|F04|카드 학습|단어·뜻·그림·발음·이전/다음·현재 순서 표시|app.js|words / cardIndex|카드 앞뒤 이동·발음·긴 단어|
|F05|알아요 / 어려워요|기존 중복 보상 방지 및 알고 있는 카드 상태 유지|app.js|knownCards / score / dailyMission|알아요 반복·어려워요·새로고침|
|F06|뜻 맞히기|선택지 정오답, 문제당 +1, 10문제 라운드|app.js|progress / score / questionHistory|정답·오답·건너뛰기·10문제 완료|
|F07|철자 블록|블록 배치·취소·힌트·정답, 문제당 +15|app.js|동일 player 필드|블록으로 정답·취소·다음 문제|
|F08|빈칸 완성|제시 철자와 빈칸 입력, 문제당 +40|app.js|동일 player 필드|정답·오답·Enter·모바일 입력|
|F09|직접 쓰기|영어 철자 입력, 문제당 +100|app.js|동일 player 필드|오답 피드백·정답·키보드|
|F10|오답·건너뛰기 복습|정답·뜻·철자·발음·다음으로 이동|app.js|questionHistory / progress|review 화면 내용·다음 버튼|
|F11|라운드 종료 / 재시작|10문제 결과, 정답 수에 따른 기존 보너스|app.js|round / score / coin|완료 점수·중복 보상 방지·재시작|
|F12|일일 미션 / 보상|카드5·게임정답5·쓰기3, 일자별 초기화·보상|app.js|dailyMission|3항목 달성·한 번만 수령|
|F13|XP / 쿠키 / 콤보|기존 산정·최고 콤보·성장 표시 유지|app.js|xp / coin / combo / bestCombo|변경 전후 동일 입력 비교|
|F14|단어장 검색|단어·뜻 검색과 카테고리 필터|app.js, ui-v9.js|words|한글 조합·검색 포커스·120개 초과|
|F15|단어 추가 / 삭제|입력 검증·중복 처리·삭제 확인|app.js|words / Firebase words|추가·삭제 취소·확정·재로드|
|F16|단어 일괄 추가|기존 구분자·한글 별칭 파서 유지|app.js|words|여러 입력 형식·중복·잘못된 행|
|F17|카테고리 관리|카테고리 추가·삭제와 기존 연결 처리|app.js|categories / words|추가·삭제 취소·삭제 후 필터|
|F18|JSON 백업 / 복원|기존 내보내기와 가져오기 구조 유지|app.js|local envelope|내보내기·복원·손상 JSON|
|F19|LOCAL / 클라우드 랭킹|기기 기록·Firebase 참고 순위·새로고침|app.js|player.score / Firebase|LOCAL 표시·클라우드 권한 별도 검증|
|F20|기존 몬스터 도감|XP 기반 1,000종 잠금·해금 기록|app.js|xp|수량·현재 몬스터·전체 항목 접근|
|F21|쿠키 상점 / 테마|구매·이미 소유·잔액 부족·장착|app.js|coin / ownedItems / ownedThemes|구매·재구매 방지·장착·재로드|
|F22|펫 구입 / 선택|기존 소유 목록·선택·상점 연결|app.js|ownedPets / equippedPet|구매·선택·잔액·재로드|
|F23|펫 돌보기|먹이·놀이·기분·포만감·성장|app.js|petCare / coin|먹이·놀이·수치 변화·저장|
|F24|드레스룸|슬롯별 미리보기·구입·저장·장착·초기화|app.js, avatar-phaser.js|ownedAvatarItems / equippedAvatar|각 슬롯·저장·재로드·CDN 실패|
|F25|아바타 이미지 다운로드|Phaser 캡처와 DOM 폴백|app.js, avatar-phaser.js|avatar assets|다운로드·Phaser 실패 폴백|
|F26|상품권 신청 / 관리|기존 신청 기록·관리자 상태 변경|app.js, firestore.rules|rewardClaims / admin claim|취소·기록 표시; 실제 신청은 실행하지 않음|
|F27|보호자 PIN|기기별 salted SHA-256 PIN·세션 잠금|ui-v9.js|heather_parent_gate_v1 / sessionStorage|설정·틀린 PIN·취소·다시 잠금|
|F28|Firebase 관리자 권한|custom claim과 Firestore 규칙 유지|app.js, firestore.rules|admin / guardian claims|운영 권한·서버 규칙 별도 검증|
|F29|시즌2 데이터 호환|schema8 마이그레이션·레거시 경로·리비전 병합|season2-core.js, firebase-config.js|player.season2 / progress.__season2|기존 core 28개 테스트·데이터 보존|
|F30|오늘의 모험 / 4단계|워밍업5·숲7·관문5·보스4, 잠금·별·보상|season2.js, season2-core.js|dailyAdventure|순차 진행·정오답·단계 완료|
|F31|적응형 출제 / 복습|숙련도·오답·복습 시점에 따른 기존 선택|season2-core.js|wordMastery|기존 알고리즘 테스트 그대로 실행|
|F32|모험 이어하기|진행 중 세션 저장 및 재진입|season2.js|dailyAdventure.session|답변·닫기·재로드·동일 문제 복귀|
|F33|보스 힌트 / 재도전|기존 도움 단계·정답 판정·보상|season2.js, season2-core.js|dailyAdventure / wordMastery|오답·힌트·정답·중복 보상|
|F34|스타터 / 파트너|스타터 1회 선택, 소유 캐릭터 파트너 선택|season2.js, season2-core.js|starterId / partnerId / collection|선택·재선택 방지·파트너 표시|
|F35|시즌2 도감 60종|세계·희귀도·소유·진화단계 필터·더보기·상세|season2.js, monster-catalog-season2.js|season2Collection|필터·전체 접근·상세·SVG 60개|
|F36|알 / 부화 / 진화|기존 진행도·재료·친밀도 조건 유지|season2-core.js, season2.js|egg / materials / friendship|조건 부족·성공·중복 방지 core tests|
|F37|주간 목표 / 칭호|학습일·퀘스트·보상·칭호|season2.js, season2-core.js|weekly / titles / streak|목표 계산·보상 한 번|
|F38|학습 설정|쉬움·도전·자동발음·동작줄이기·타이머|season2.js|settings|변경·새로고침·접근성 반영|
|F39|보호자 학습 리포트|모드 정확도·어려운 단어·카테고리·JSON/CSV|season2.js, season2-core.js|실제 wordMastery / report|PIN 보호·열기·내보내기|
|F40|내비게이션 / 접근성 / 호스팅|5탭·집중화면·뒤로가기·대화상자·상대경로|ui-v9.js, index.html|URL hash / UI state|모바일7크기·Tab/Escape·새로고침·하위 경로|

## 변경 전 확인
- [x] 모든 기능군 소스 경로 확인
- [x] 기존 28개 단위/계약 테스트 통과
- [x] 60개 SVG 구조 검사 통과
- [x] 기존 Chromium 스위트 하위 경로 통과 (run33935708392)
- [x] Lighthouse 네 카테고리 기준 수치 확보

## 변경 후 실행 기록
- [ ] 기존 단위/계약 + 신규 회귀 테스트
- [ ] 기존 및 확장 브라우저 시나리오
- [ ] 360/390/430/768/1440 등 반응형 캡처와 시각 검토
- [ ] 점수·알고리즘·저장 키 보존 비교
- [ ] 오류/경고 및 HTTP 실패 분리 기록
- [ ] Lighthouse 네 카테고리 실제 수치
- [ ] Pages 경로·hash·메타·404 검사
- [ ] Firebase 권한·실기기 음성/가상키보드 수동 승인 (배포 전 필요)
