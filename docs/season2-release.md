# Heather Word Season 2 — compatibility-first release

This release is an additive static layer loaded by `firebase-config.js`. It does not replace the existing `index.html`, `app.js`, `style.css`, avatar, shop, pet, word management, ranking, voucher, TTS, LOCAL mode, or Phaser fallback.

## Included in this release

- Idempotent schema 8 migration under the existing `heather_word_v3` player data
- Legacy `progress[wordId]` conversion to mastery 0–5 without deleting legacy counters
- Adaptive selection targeting due/hard 60%, new 25%, maintenance 15%
- Four-stage daily adventure with resumable progress and a no-health-loss boss
- 12 worlds, 20 distinct species and 3 evolutions each (60 standalone SVG files)
- One-time starter, deterministic no-duplicate-first hatching, affinity, partner and evolution
- Flexible weekly goals, streak best record, achievements/titles and mastery-star endgame
- Easy/challenge settings, auto TTS, reduced motion and optional timer setting (off by default)
- Locked learning report with JSON/CSV export

## Data compatibility

The legacy balances, XP, score, cookie count, known cards, 1,000-monster XP collection, avatar items, equipped items, themes, pets, pet care, reward claims, words and categories are not reset or reduced. Season 2 progress is mirrored at `player.progress.__season2` so the currently deployed Firestore rule set accepts it without requiring an immediate rules deployment. The original client does not write `progress`, so it does not erase the nested Season 2 value.

A storage guard keeps the newest Season 2 revision when the legacy in-memory app saves an older snapshot during the same page session.

## Security boundary

The existing four-digit management password remains only a client-side screen lock. It is not administrator authentication. Public administration requires Firebase custom claims or another trusted backend. Existing Firebase rankings remain client-submitted and are not described as server-verified scores.

## Verification

Run:

```bash
npm run check
```

This performs syntax checks, 15 core tests, and verifies all 60 SVG files have unique IDs, names, paths, and color-stripped geometry hashes.
