#!/usr/bin/env node
// Renders App Store screenshots (iPhone 6.9" and iPad 13") from the web app.
// Usage: (cd www && python3 -m http.server 8123) & node scripts/app_store_screenshots.js appstore/screenshots
const { chromium } = require("playwright");
const out = process.argv[2];
const devices = {
  iphone: { viewport: { width: 440, height: 956 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  ipad: { viewport: { width: 1032, height: 1376 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
const scenes = [
  { name: "1-setup", setup: "I'm reading a book about anti-gravity.", punch: "It's impossible to put down." },
  { name: "2-punchline", setup: "What do you call a fake noodle?", punch: "An impasta.", reveal: true, rate: 5 },
  { name: "3-pg13", pg13: true, setup: "I've been on a whisky diet.", punch: "I've lost three days already.", reveal: true, rate: 4 },
  { name: "4-daily", setup: "How does a penguin build its house?", punch: "Igloos it together.", panel: "#settingsToggle", daily: true },
  { name: "5-saved", setup: "Why don't eggs tell jokes?", punch: "They'd crack each other up.", panel: "#favToggle", favs: true },
];
(async () => {
  const b = await chromium.launch();
  for (const [dev, opts] of Object.entries(devices)) {
    for (const sc of scenes) {
      const ctx = await b.newContext(opts);
      const p = await ctx.newPage();
      await p.route(/icanhazdadjoke/, (r) => r.abort());
      await p.addInitScript(({ pg13, favs }) => {
        window.Capacitor = { isNativePlatform: () => true, registerPlugin: () => new Proxy({}, { get: () => async () => ({ notifications: [], display: "granted" }) }) };
        localStorage.setItem("dad.mode", JSON.stringify(pg13 ? "pg13" : "clean"));
        if (favs) localStorage.setItem("dad.favs", JSON.stringify([
          { setup: "Why don't skeletons fight each other?", punch: "They don't have the guts." },
          { setup: "What do you call a bear with no teeth?", punch: "A gummy bear." },
          { setup: "Did you hear about the restaurant on the moon?", punch: "Great food, no atmosphere." },
          { setup: "Why couldn't the bicycle stand up by itself?", punch: "It was two tired." },
          { setup: "What do you call a sad cup of coffee?", punch: "Depresso." },
        ]));
      }, sc);
      await p.goto("http://localhost:8123/");
      await p.evaluate(() => document.fonts.ready);
      await p.waitForTimeout(900);
      await p.evaluate(({ setup, punch }) => {
        document.getElementById("setup").textContent = setup;
        document.getElementById("punchline").textContent = punch;
      }, sc);
      if (sc.reveal) { await p.click("#primaryBtn"); await p.waitForTimeout(1200); }
      if (sc.rate) { await p.click(`#rating button[data-v="${sc.rate}"]`); await p.waitForTimeout(600); }
      if (sc.panel) {
        await p.click(sc.panel); await p.waitForTimeout(700);
        if (sc.daily) { await p.click("#dailyOn"); await p.waitForTimeout(500); }
      }
      await p.screenshot({ path: `${out}/${dev}-${sc.name}.png` });
      await ctx.close();
    }
  }
  await b.close();
})();
