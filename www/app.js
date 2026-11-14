(() => {
  const $ = (id) => document.getElementById(id);
  const setupEl = $("setup"), punchEl = $("punchline"), primaryBtn = $("primaryBtn");
  const saveBtn = $("saveBtn"), copyBtn = $("copyBtn"), shareBtn = $("shareBtn");
  const ratingEl = $("rating"), toastEl = $("toast"), scrim = $("scrim");
  const drawer = $("drawer"), favToggle = $("favToggle"), favList = $("favList");
  const favEmpty = $("favEmpty"), favCount = $("favCount");
  const settings = $("settings"), dailyOn = $("dailyOn"), dailyTime = $("dailyTime"), dailyNote = $("dailyNote");

  // ---------- Native bridge (iOS app via Capacitor). No-ops on the web. ----------
  const Cap = window.Capacitor;
  const isNative = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
  const plugin = (name) => (isNative && Cap.registerPlugin ? Cap.registerPlugin(name) : null);
  const Haptics = plugin("Haptics");
  const Share = plugin("Share");
  const Notifs = plugin("LocalNotifications");
  if (isNative) document.documentElement.classList.add("is-native");

  const haptic = (style) => { if (Haptics) Haptics.impact({ style }).catch(() => {}); };

  const store = {
    get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };

  let favs = store.get("dad.favs", []);
  let ratings = store.get("dad.ratings", {});
  let current = null;
  let revealed = false;
  let deck = [];
  const seen = new Set();
  let online = true; // turned off after the first failed fetch

  const keyOf = (j) => (j.setup + "|" + j.punch).toLowerCase();
  const allLocal = () => window.LOCAL_JOKES.map(([setup, punch]) => ({ setup, punch }));

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const r = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[r]] = [arr[r], arr[i]];
    }
    return arr;
  }

  // Split a one-liner from the API into setup + punchline.
  function splitJoke(text) {
    const t = text.replace(/\s+/g, " ").trim();
    const q = t.indexOf("? ");
    if (q > 0) return { setup: t.slice(0, q + 1), punch: t.slice(q + 2) };
    const m = t.match(/^(.+?[.!,…])\s+(.+)$/);
    if (m && m[2].length > 3) return { setup: m[1], punch: m[2] };
    return { setup: t, punch: "" };
  }

  async function fetchOnline() {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2500);
    try {
      const res = await fetch("https://icanhazdadjoke.com/", {
        headers: { Accept: "application/json" }, signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      return splitJoke(data.joke);
    } finally { clearTimeout(timer); }
  }

  function nextLocal() {
    if (!deck.length) deck = shuffle(allLocal());
    return deck.pop();
  }

  async function getJoke() {
    // Mix online and local jokes for variety; fall back silently.
    if (online && Math.random() < 0.6) {
      for (let i = 0; i < 2; i++) {
        try {
          const j = await fetchOnline();
          if (!seen.has(keyOf(j))) return j;
        } catch { online = false; break; }
      }
    }
    return nextLocal();
  }

  const setPrimary = (label) => { primaryBtn.textContent = label; };

  function showJoke(j) {
    seen.add(keyOf(j));
    current = j;
    punchEl.classList.remove("show");
    setupEl.classList.remove("enter"); void setupEl.offsetWidth;
    setupEl.textContent = j.setup;
    setupEl.classList.add("enter");
    punchEl.textContent = j.punch;
    revealed = !j.punch;
    if (revealed) punchEl.classList.add("show");
    setPrimary(revealed ? "Another one" : "Reveal punchline");
    syncSave(); syncRating();
  }

  async function loadJoke() {
    primaryBtn.disabled = true;
    punchEl.classList.remove("show");
    showJoke(await getJoke());
    primaryBtn.disabled = false;
  }

  function reveal() {
    revealed = true;
    punchEl.classList.add("show");
    setPrimary("Another one");
    haptic("MEDIUM");
  }

  const jokeText = () => current ? [current.setup, current.punch].filter(Boolean).join(" ") : "";

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toast.t);
    toast.t = setTimeout(() => toastEl.classList.remove("show"), 1600);
  }

  // ---------- Favourites ----------
  const isFav = () => current && favs.some((f) => keyOf(f) === keyOf(current));
  function syncSave() {
    const on = isFav();
    saveBtn.classList.toggle("on", !!on);
    saveBtn.textContent = on ? "★" : "☆";
  }
  function toggleSave() {
    if (!current) return;
    if (isFav()) { favs = favs.filter((f) => keyOf(f) !== keyOf(current)); toast("Removed"); }
    else { favs.unshift({ setup: current.setup, punch: current.punch }); toast("Saved"); haptic("LIGHT"); }
    store.set("dad.favs", favs); syncSave(); renderFavs();
  }
  function renderFavs() {
    favCount.textContent = favs.length;
    favEmpty.style.display = favs.length ? "none" : "block";
    favList.innerHTML = "";
    favs.forEach((f, i) => {
      const li = document.createElement("li");
      const q = document.createElement("p"); q.className = "q"; q.textContent = f.setup;
      const a = document.createElement("p"); a.className = "a"; a.textContent = f.punch;
      const rm = document.createElement("button"); rm.className = "rm"; rm.textContent = "✕";
      rm.setAttribute("aria-label", "Remove");
      rm.onclick = () => { favs.splice(i, 1); store.set("dad.favs", favs); renderFavs(); syncSave(); };
      li.append(q, a, rm); favList.append(li);
    });
  }

  // ---------- Panels ----------
  function setPanel(panel, open) {
    for (const p of [drawer, settings]) {
      const on = open && p === panel;
      p.classList.toggle("open", on);
      p.setAttribute("aria-hidden", String(!on));
    }
    favToggle.setAttribute("aria-expanded", String(open && panel === drawer));
    scrim.classList.toggle("show", open);
  }
  const closePanels = () => setPanel(null, false);

  // ---------- Rating ----------
  function syncRating() {
    const v = current ? ratings[keyOf(current)] || 0 : 0;
    [...ratingEl.children].forEach((b) => b.classList.toggle("lit", +b.dataset.v <= v));
  }
  ratingEl.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b || !current) return;
    ratings[keyOf(current)] = +b.dataset.v; store.set("dad.ratings", ratings); syncRating();
    haptic("LIGHT");
    toast(["Mild chuckle", "Eye roll", "Solid groan", "Painful", "Peak dad"][b.dataset.v - 1]);
  });

  // ---------- Daily notification (iOS app only) ----------
  // iOS repeats a notification with identical text, so instead we schedule one
  // notification per day for the next DAYS days, each with a different joke,
  // and top the queue back up every time the app is opened.
  const DAYS = 30, BASE_ID = 1000;
  const daily = store.get("dad.daily", { on: false, time: "08:00" });

  async function cancelDaily() {
    const pending = await Notifs.getPending();
    const ids = pending.notifications.filter((n) => n.id >= BASE_ID && n.id < BASE_ID + DAYS).map((n) => ({ id: n.id }));
    if (ids.length) await Notifs.cancel({ notifications: ids });
  }

  async function scheduleDaily() {
    await cancelDaily();
    const [h, m] = daily.time.split(":").map(Number);
    const jokes = shuffle(allLocal().filter((j) => j.punch));
    const first = new Date(); first.setHours(h, m, 0, 0);
    if (first <= new Date()) first.setDate(first.getDate() + 1);
    const notifications = [];
    for (let i = 0; i < DAYS; i++) {
      const at = new Date(first); at.setDate(first.getDate() + i);
      const j = jokes[i % jokes.length];
      notifications.push({
        id: BASE_ID + i, title: "Today's dad joke", body: j.setup,
        schedule: { at, allowWhileIdle: true }, extra: { setup: j.setup, punch: j.punch },
      });
    }
    await Notifs.schedule({ notifications });
  }

  function syncDailyUI(note = "") {
    dailyOn.checked = daily.on;
    dailyTime.value = daily.time;
    dailyTime.disabled = !daily.on;
    const [h, m] = daily.time.split(":").map(Number);
    const label = new Date(2000, 0, 1, h, m).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    dailyNote.textContent = note || (daily.on ? `Every day at ${label}.` : "");
  }

  async function applyDaily() {
    if (!Notifs) return;
    try {
      if (daily.on) {
        let perm = await Notifs.checkPermissions();
        if (perm.display !== "granted") perm = await Notifs.requestPermissions();
        if (perm.display !== "granted") {
          daily.on = false; store.set("dad.daily", daily);
          syncDailyUI("Notifications are off for DAD. Turn them on in iPhone Settings › Notifications.");
          return;
        }
        await scheduleDaily();
      } else {
        await cancelDaily();
      }
      syncDailyUI();
    } catch {
      syncDailyUI("Couldn't update notifications. Please try again.");
    }
  }

  if (Notifs) {
    dailyOn.addEventListener("change", () => { daily.on = dailyOn.checked; store.set("dad.daily", daily); applyDaily(); });
    dailyTime.addEventListener("change", () => { if (!dailyTime.value) return; daily.time = dailyTime.value; store.set("dad.daily", daily); applyDaily(); });
    // Tapping a notification opens the app on that joke, punchline hidden.
    Notifs.addListener("localNotificationActionPerformed", ({ notification }) => {
      const x = notification && notification.extra;
      if (x && x.setup) { closePanels(); showJoke({ setup: x.setup, punch: x.punch || "" }); }
    });
    syncDailyUI();
    if (daily.on) applyDaily(); // top up the queue on every launch
  }

  // ---------- Wiring ----------
  primaryBtn.addEventListener("click", () => (revealed ? loadJoke() : reveal()));
  saveBtn.addEventListener("click", toggleSave);
  copyBtn.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(jokeText()); toast("Copied"); haptic("LIGHT"); }
    catch { toast("Copy unavailable"); }
  });
  shareBtn.addEventListener("click", async () => {
    const text = jokeText();
    if (Share) { try { await Share.share({ text, dialogTitle: "Share this joke" }); } catch {} return; }
    try { await navigator.share({ text }); return; }
    catch (e) { if (e && e.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(text); toast("Copied to share"); }
    catch { toast("Share unavailable"); }
  });
  favToggle.addEventListener("click", () => setPanel(drawer, !drawer.classList.contains("open")));
  $("settingsToggle").addEventListener("click", () => setPanel(settings, !settings.classList.contains("open")));
  $("closeDrawer").addEventListener("click", closePanels);
  $("closeSettings").addEventListener("click", closePanels);
  scrim.addEventListener("click", closePanels);

  document.addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea")) return;
    if (e.code === "Space") { e.preventDefault(); if (!primaryBtn.disabled) primaryBtn.click(); }
    else if (e.key.toLowerCase() === "s") toggleSave();
    else if (e.key === "Escape") closePanels();
  });

  renderFavs();
  loadJoke();
})();
