#!/usr/bin/env node
// Merge new jokes into jokes.js, skipping duplicates.
// Usage: node scripts/add_jokes.js new-jokes.txt
// Input: one joke per line as "setup|punchline" (punchline may be empty).
// A joke is a duplicate if its setup OR its punchline already exists
// (case-insensitive, ignoring punctuation).
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "jokes.js");
const window = {};
new Function("window", fs.readFileSync(file, "utf8"))(window);
const jokes = window.LOCAL_JOKES;

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
const setups = new Set(jokes.map((j) => norm(j[0])));
const punches = new Set(jokes.filter((j) => j[1]).map((j) => norm(j[1])));

const lines = fs.readFileSync(process.argv[2], "utf8").split("\n").map((l) => l.trim()).filter(Boolean);
const added = [], skipped = [];
for (const line of lines) {
  const i = line.indexOf("|");
  const setup = (i < 0 ? line : line.slice(0, i)).trim();
  const punch = (i < 0 ? "" : line.slice(i + 1)).trim();
  if (!setup || setups.has(norm(setup)) || (punch && punches.has(norm(punch)))) { skipped.push(setup); continue; }
  setups.add(norm(setup)); if (punch) punches.add(norm(punch));
  jokes.push([setup, punch]); added.push(setup);
}

const body = jokes.map((j) => "  " + JSON.stringify(j)).join(",\n");
fs.writeFileSync(file,
  "// Curated offline joke library. Used when the online source is unavailable,\n" +
  "// and mixed in for variety. Format: [setup, punchline] (punchline may be empty\n" +
  "// for one-liners). Add jokes with: node scripts/add_jokes.js new-jokes.txt\n" +
  "window.LOCAL_JOKES = [\n" + body + ",\n];\n");

console.log(`Added ${added.length}, skipped ${skipped.length} duplicates. Total: ${jokes.length}`);
if (skipped.length) console.log("Skipped:\n  " + skipped.join("\n  "));
