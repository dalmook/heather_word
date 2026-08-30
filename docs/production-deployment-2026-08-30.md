# Production deployment — 2026-08-30

Heather Word Season 2 was materialized on `main` from the checksum-verified release bundle and validated from a fresh clone.

Verification performed before this marker commit:

- `npm run check`
- Node test suite: 14/14 passed
- Season 2 catalog: 60 characters, 20 species, 12 worlds
- SVG validation: 61 files including fallback, 60 unique geometry hashes
- Staging chunks and the one-shot bootstrap workflow removed
- GitHub Pages HTTP checks passed for the home page, Season 2 loader, Season 2 JavaScript, and a character SVG
- Headless Chromium mobile smoke passed at 390×844 in LOCAL mode

The existing `heather_word_v3` storage key and legacy player fields remain intact. Firebase rules are checked into the repository; deploying those rules to the Firebase project remains a separate authenticated administrator operation.
