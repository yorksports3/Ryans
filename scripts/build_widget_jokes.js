#!/usr/bin/env node
// Export the joke library to JSON for the iOS Home Screen widget, which bundles
// its own copy (widgets can't run the app's JavaScript).
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const window = {};
new Function("window", fs.readFileSync(path.join(root, "www", "jokes.js"), "utf8"))(window);
// The widget shows setup + punchline, so skip one-liners without a punchline.
const jokes = window.LOCAL_JOKES.filter(([, p]) => p).map(([setup, punch]) => ({ setup, punch }));
fs.writeFileSync(path.join(root, "ios", "App", "DadJokesWidget", "jokes.json"), JSON.stringify(jokes, null, 1) + "\n");
console.log(`Widget jokes: ${jokes.length}`);
