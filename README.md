# Heather Word · 스펠링몬

초등 저학년이 휴대폰에서 영어 단어와 스펠링을 재미있게 외울 수 있도록 만든 GitHub Pages용 정적 웹앱입니다.

## 주요 기능

- 단어 카드 학습
- 영어 발음 듣기: 브라우저 Web Speech API 사용
- 뜻 맞히기 / 글자 블록 / 직접 스펠링 쓰기
- 점수, 쿠키, XP, 스펠링몬 성장 시스템
- 책/프린트 사진 또는 이미지 업로드 OCR 단어 추가
- AI/API 없이 Tesseract.js 브라우저 OCR 사용
- 단어장과 점수는 브라우저 localStorage에 저장
- JSON 백업/복원 지원

## GitHub Pages 설정

1. GitHub 저장소에서 Settings로 이동
2. Pages 메뉴 선택
3. Build and deployment에서 Source를 `Deploy from a branch`로 선택
4. Branch는 `main`, 폴더는 `/root` 선택
5. 저장 후 몇 분 뒤 `https://dalmook.github.io/heather_word/`에서 확인

## OCR 사용 팁

OCR은 AI가 아니기 때문에 사진이 흐리거나 기울어져 있으면 오타가 날 수 있습니다. 밝은 곳에서 단어가 크게 보이도록 찍으면 인식률이 좋아집니다.

뜻이 자동으로 들어가지 않는 단어는 부모 관리 화면에서 한글 뜻을 직접 입력해 주세요.
