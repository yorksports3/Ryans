#!/usr/bin/env node
// Copy the variable fonts from node_modules into www/fonts so the app works
// offline (no Google Fonts request). Fonts are SIL Open Font License.
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const out = path.join(root, "www", "fonts");
fs.mkdirSync(out, { recursive: true });
const files = [
  ["@fontsource-variable/fraunces/files/fraunces-latin-opsz-normal.woff2", "fraunces.woff2"],
  ["@fontsource-variable/fraunces/files/fraunces-latin-opsz-italic.woff2", "fraunces-italic.woff2"],
  ["@fontsource-variable/inter/files/inter-latin-wght-normal.woff2", "inter.woff2"],
];
for (const [src, dst] of files) fs.copyFileSync(path.join(root, "node_modules", src), path.join(out, dst));
fs.copyFileSync(path.join(root, "node_modules/@fontsource-variable/fraunces/LICENSE"), path.join(out, "LICENSE-Fraunces.txt"));
fs.copyFileSync(path.join(root, "node_modules/@fontsource-variable/inter/LICENSE"), path.join(out, "LICENSE-Inter.txt"));
console.log("Fonts copied to www/fonts");
