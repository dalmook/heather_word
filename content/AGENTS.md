# Vocabulary/photo updates for Heather Word

Read ../WORD_STUDIO_GUIDE.md before changing content. The user primarily uses ChatGPT to maintain vocabulary and images in this GitHub repository.

- Only modify the requested vocabulary/media and its content/index.json registration. Preserve other packs and stable word IDs.
- Never rewrite root words.json, existing categories, legacy localStorage, Firebase settings, scores, wardrobe, collections or learning records for a content-only update.
- Store permitted images in content/images/ and optional recordings in content/audio/. JSON image/audio paths are repository-root relative, not GitHub blob-page URLs.
- Use schemaVersion: 1. Pack IDs are lowercase ASCII letters/numbers/hyphens/underscores. Word IDs must be globally unique across packs. A correction keeps its existing ID.
- Never put GitHub tokens, secrets, children's names, faces, school details or other private personal information in this public content folder. Confirm the user has permission for supplied media. Do not invent or assume an uploaded file exists.
- JSON fields: id, word, meaning, category, emoji, image, audio, example, exampleMeaning. word/meaning/id are required. Use correct age-appropriate English/Korean and accurate image associations. Empty image/audio is allowed.
- If importing an app-generated ZIP, merge content/index.json against the current branch, preserving packs added after ZIP creation. Check actual referenced image files exist.
- Run node tools/validate-word-studio.mjs and node --test tests/*.test.mjs. Report the exact commit, checks and deployment state without claiming unrun tests passed.
- Device edits override the matching GitHub word in the new playground. A user can revert device edits from the word editor. Content-only updates do not synchronize browser learning progress.
