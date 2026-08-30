import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SEASON2_CATALOG } from "../monster-catalog-season2.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ids = new Set();
const names = new Set();
const paths = new Set();
const geometryHashes = new Set();
for (const character of SEASON2_CATALOG) {
  if (ids.has(character.id)) throw new Error(`Duplicate id: ${character.id}`);
  if (names.has(character.name)) throw new Error(`Duplicate name: ${character.name}`);
  if (paths.has(character.image)) throw new Error(`Duplicate asset path: ${character.image}`);
  ids.add(character.id);
  names.add(character.name);
  paths.add(character.image);
  const file = resolve(root, character.image.replace(/^\.\//, ""));
  const svg = await readFile(file, "utf8");
  if (!svg.includes("<svg") || !svg.includes("viewBox=\"0 0 240 240\"")) throw new Error(`Invalid SVG: ${character.image}`);
  const geometry = svg
    .replace(/id="[^"]+"/g, "")
    .replace(/aria-label="[^"]+"/g, "")
    .replace(/#[0-9a-fA-F]{3,8}/g, "#COLOR")
    .replace(/url\(#[^)]+\)/g, "url(#ID)")
    .replace(/\s+/g, " ");
  const hash = createHash("sha256").update(geometry).digest("hex");
  if (geometryHashes.has(hash)) throw new Error(`Color-only or duplicate geometry: ${character.image}`);
  geometryHashes.add(hash);
}
if (SEASON2_CATALOG.length !== 60 || ids.size !== 60 || geometryHashes.size !== 60) {
  throw new Error(`Catalog validation failed: ${SEASON2_CATALOG.length}/${ids.size}/${geometryHashes.size}`);
}
console.log(`Validated 60 SVG files with 60 unique geometry hashes.`);
