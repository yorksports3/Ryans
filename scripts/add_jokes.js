#!/usr/bin/env node
// Merge new jokes into a joke list, skipping duplicates.
//
//   node scripts/add_jokes.js new-jokes.txt          -> clean list (www/jokes.js)
//   node scripts/add_jokes.js --pg13 new-jokes.txt   -> PG-13 list (www/jokes-pg13.js)
//
// Input: one joke per line as "setup|punchline" (punchline may be empty).
// A joke is a duplicate if its setup OR its punchline already exists in
// EITHER list (case-insensitive, ignoring punctuation).
const fs = require("fs");
const path = require("path");

const LISTS = {
  clean: { file: "jokes.js", global: "LOCAL_JOKES", label: "Curated clean joke library (default list)." },
  pg13: { file: "jokes-pg13.js", global: "PG13_JOKES", label: "PG-13 joke list, shown only when the user turns on PG-13 mode.\n// Cheeky, not filthy: mild innuendo, bathroom humour, drinking and marriage jokes,\n// the odd mild swear. Nothing explicit, nothing punching down." },
};

const args = process.argv.slice(2);
const which = args.includes("--pg13") ? "pg13" : "clean";
const input = args.find((a) => !a.startsWith("--"));
if (!input) { console.error("Usage: node scripts/add_jokes.js [--pg13] new-jokes.txt"); process.exit(1); }

const www = path.join(__dirname, "..", "www");
function load(name) {
  const f = path.join(www, LISTS[name].file);
  if (!fs.existsSync(f)) return [];
  const window = {};
  new Function("window", fs.readFileSync(f, "utf8"))(window);
  return window[LISTS[name].global] || [];
}

const lists = { clean: load("clean"), pg13: load("pg13") };
const jokes = lists[which];

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
const all = [...lists.clean, ...lists.pg13];
const setups = new Set(all.map((j) => norm(j[0])));
const punches = new Set(all.filter((j) => j[1]).map((j) => norm(j[1])));

const lines = fs.readFileSync(input, "utf8").split("\n").map((l) => l.trim()).filter(Boolean);
const added = [], skipped = [];
for (const line of lines) {
  const i = line.indexOf("|");
  const setup = (i < 0 ? line : line.slice(0, i)).trim();
  const punch = (i < 0 ? "" : line.slice(i + 1)).trim();
  if (!setup || setups.has(norm(setup)) || (punch && punches.has(norm(punch)))) { skipped.push(setup); continue; }
  setups.add(norm(setup)); if (punch) punches.add(norm(punch));
  jokes.push([setup, punch]); added.push(setup);
}

const { file, global, label } = LISTS[which];
const body = jokes.map((j) => "  " + JSON.stringify(j)).join(",\n");
fs.writeFileSync(path.join(www, file),
  `// ${label}\n` +
  "// Format: [setup, punchline] (punchline may be empty for one-liners).\n" +
  `// Add jokes with: node scripts/add_jokes.js${which === "pg13" ? " --pg13" : ""} new-jokes.txt\n` +
  `window.${global} = [\n${body},\n];\n`);

console.log(`[${which}] Added ${added.length}, skipped ${skipped.length} duplicates. Total: ${jokes.length}`);
if (skipped.length) console.log("Skipped:\n  " + skipped.join("\n  "));
