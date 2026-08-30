import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const polishJs = await readFile(new URL("../season2-polish.js", import.meta.url), "utf8");
const polishCss = await readFile(new URL("../season2-polish.css", import.meta.url), "utf8");
const loader = await readFile(new URL("../firebase-config.js", import.meta.url), "utf8");

test("market home relocates Season 2 outside the fixed legacy hero", () => {
  assert.match(polishJs, /panel\.parentElement !== home/);
  assert.match(polishJs, /petCard\.hidden = true/);
  assert.match(polishJs, /s2LegacyHero = "hidden"/);
  assert.match(polishJs, /s2HomeUtility/);
  assert.match(polishJs, /s2-market-mission/);
});

test("market home replaces fixed-height layout with one scroll surface", () => {
  assert.match(polishCss, /#homeScreen\.s2-market-home\.active[\s\S]*display:\s*flex\s*!important/);
  assert.match(polishCss, /overflow-y:\s*auto\s*!important/);
  assert.match(polishCss, /\.pet-card\[data-s2-legacy-hero="hidden"\][\s\S]*display:\s*none\s*!important/);
  assert.match(polishCss, /> \.s2-market-mission[\s\S]*position:\s*relative\s*!important/);
});

test("interactive controls keep launch-size touch targets and visible focus", () => {
  assert.match(polishCss, /min-height:\s*44px/);
  assert.match(polishCss, /:focus-visible/);
  assert.match(polishCss, /outline:\s*3px/);
});

test("8.1 loader appends polish after the compatibility layer", () => {
  assert.match(loader, /RELEASE = "8\.1\.0"/);
  assert.match(loader, /season2-polish\.css/);
  assert.match(loader, /season2-polish\.js/);
});
