import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [app, loader, ui, css, rules, index] = await Promise.all([
  read("app.js"),
  read("firebase-config.js"),
  read("ui-v9.js"),
  Promise.all(["ui-v9.css","ui/tokens.css","ui/components.css","ui/layout.css","ui/legacy.css"].map(read)).then(parts=>parts.join("\n")),
  read("firestore.rules"),
  read("index.html")
]);

test("removes the public admin password and delegates to the parent gate", () => {
  assert.doesNotMatch(app, /MANAGE_PASSWORD|["']3341["']/);
  assert.match(app, /HeatherWordLegacyBridge/);
  assert.match(app, /heather:parent-gate-request/);
  assert.match(ui, /PARENT_GATE_KEY/);
  assert.match(ui, /crypto\.subtle\.digest/);
});

test("loads one commercial shell instead of the old layered home patch", () => {
  assert.match(loader, /RELEASE = "13\.0\.0"/);
  assert.match(loader, /ui-v9\.css/);
  assert.match(loader, /ui-v9\.js/);
  assert.doesNotMatch(loader, /season2-polish/);
  assert.match(index, /firebase-config\.js\?v=13\.0\.0/);
});

test("defines the five top-level destinations and History API navigation", () => {
  for (const tab of ["home", "learn", "games", "collection", "my"]) {
    assert.match(ui, new RegExp(`${tab}: \\{ label:`));
  }
  assert.match(ui, /history\.pushState/);
  assert.match(ui, /popstate/);
  assert.match(ui, /hashchange/);
  assert.match(ui, /interceptLegacyBack/);
});

test("uses an SVG icon system and accessibility states", () => {
  assert.match(ui, /<svg[^>]+viewBox=/);
  assert.match(ui, /aria-current/);
  assert.match(ui, /aria-live/);
  assert.match(ui, /aria-label/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /min-height:\s*48px/);
});

test("exposes a token-based premium kids design system", () => {
  for (const token of [
    "--color-primary", "--color-primary-soft", "--color-accent",
    "--color-bg", "--color-surface", "--color-text-primary",
    "--radius-sm", "--radius-md", "--radius-lg", "--radius-xl",
    "--space-1", "--space-2", "--space-3", "--space-4"
  ]) {
    assert.match(css, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(css, /@media\s*\(min-width:\s*(?:900|980)px\)/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(`${app}\n${ui}\n${css}`, /visualViewport|keyboard-open|hw9-keyboard-open/);
});

test("requires an admin custom claim for cross-user reward updates", () => {
  assert.match(rules, /function isAdmin/);
  assert.match(rules, /isAdmin\(\) && rewardClaimAdminUpdate\(\)/);
  assert.doesNotMatch(rules, /request\.auth\.uid == uid \|\| rewardClaimAdminUpdate\(\)/);
});
