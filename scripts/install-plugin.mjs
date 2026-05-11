import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const vaultPath = process.argv[2];
if (!vaultPath) {
  console.error("Usage: node scripts/install-plugin.mjs <vault-path>");
  process.exit(1);
}

const root = resolve(import.meta.dirname, "..");
const pluginDir = resolve(vaultPath, ".obsidian/plugins/note-mastery");

await mkdir(pluginDir, { recursive: true });

for (const file of ["manifest.json", "main.js", "styles.css"]) {
  await copyFile(resolve(root, file), resolve(pluginDir, file));
}

console.log(`Installed Note Mastery to ${pluginDir}`);
