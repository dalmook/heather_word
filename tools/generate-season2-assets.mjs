import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SEASON2_CATALOG, renderMonsterSvg } from "../monster-catalog-season2.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const character of SEASON2_CATALOG) {
  const output = resolve(root, character.image.replace(/^\.\//, ""));
  await mkdir(dirname(output), { recursive: true });
  const svg = renderMonsterSvg(character)
    .replace(' class="s2-monster-svg"', "")
    .replace(` data-character-id="${character.id}"`, "");
  await writeFile(output, `${svg}\n`, "utf8");
}
console.log(`Generated ${SEASON2_CATALOG.length} Season 2 SVG assets.`);
