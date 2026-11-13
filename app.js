(() => {
  const $ = (id) => document.getElementById(id);
  const setupEl = $("setup"), punchEl = $("punchline"), primaryBtn = $("primaryBtn");
  const saveBtn = $("saveBtn"), copyBtn = $("copyBtn"), shareBtn = $("shareBtn");
  const counterEl = $("counter"), ratingEl = $("rating"), toastEl = $("toast");
  const drawer = $("drawer"), favToggle = $("favToggle"), favList = $("favList");
  const favEmpty = $("favEmpty"), favCount = $("favCount");

  const store = {
    get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };

  let favs = store.get("dad.favs", []);
  let ratings = store.get("dad.ratings", {});
  let count = store.get("dad.count", 0);
  let current = null;
  let revealed = false;
  let deck = [];
  const seen = new Set();
  let online = true; // turned off after the first failed fetch

  const keyOf = (j) => (j.setup + "|" + j.punch).toLowerCase();

  function shuffledLocal() {
    const arr = window.LOCAL_JOKES.map(([setup, punch]) => ({ setup, punch }));
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
    if (!deck.length) deck = shuffledLocal();
    return deck.pop();
  }

  async function getJoke() {
    // Alternate between online and local for variety; fall back silently.
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

  function setPrimary(label) { primaryBtn.textContent = label; }

  async function loadJoke() {
    primaryBtn.disabled = true;
    punchEl.classList.remove("show");
    const j = await getJoke();
    seen.add(keyOf(j));
    current = j;
    count++; store.set("dad.count", count);
    counterEl.textContent = "No. " + String(count).padStart(3, "0");

    setupEl.classList.remove("enter"); void setupEl.offsetWidth;
    setupEl.textContent = j.setup;
    setupEl.classList.add("enter");
    punchEl.textContent = j.punch;

    revealed = !j.punch;
    if (revealed) punchEl.classList.add("show");
    setPrimary(revealed ? "Another one" : "Reveal punchline");
    syncSave(); syncRating();
    primaryBtn.disabled = false;
  }

  function reveal() {
    revealed = true;
    punchEl.classList.add("show");
    setPrimary("Another one");
  }

  const jokeText = () => current ? [current.setup, current.punch].filter(Boolean).join(" ") : "";

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toast.t);
    toast.t = setTimeout(() => toastEl.classList.remove("show"), 1600);
  }

  // Favourites
  const isFav = () => current && favs.some((f) => keyOf(f) === keyOf(current));
  function syncSave() {
    const on = isFav();
    saveBtn.classList.toggle("on", !!on);
    saveBtn.textContent = on ? "★" : "☆";
  }
  function toggleSave() {
    if (!current) return;
    if (isFav()) { favs = favs.filter((f) => keyOf(f) !== keyOf(current)); toast("Removed"); }
    else { favs.unshift({ setup: current.setup, punch: current.punch }); toast("Saved"); }
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
  function setDrawer(open) {
    drawer.classList.toggle("open", open);
    drawer.setAttribute("aria-hidden", String(!open));
    favToggle.setAttribute("aria-expanded", String(open));
  }

  // Rating
  function syncRating() {
    const v = current ? ratings[keyOf(current)] || 0 : 0;
    [...ratingEl.children].forEach((b) => b.classList.toggle("lit", +b.dataset.v <= v));
  }
  ratingEl.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b || !current) return;
    ratings[keyOf(current)] = +b.dataset.v; store.set("dad.ratings", ratings); syncRating();
    toast(["Mild chuckle", "Eye roll", "Solid groan", "Painful", "Peak dad"][b.dataset.v - 1]);
  });

  // Wiring
  primaryBtn.addEventListener("click", () => (revealed ? loadJoke() : reveal()));
  saveBtn.addEventListener("click", toggleSave);
  copyBtn.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(jokeText()); toast("Copied"); }
    catch { toast("Copy unavailable"); }
  });
  shareBtn.addEventListener("click", async () => {
    try { await navigator.share({ text: jokeText() }); return; }
    catch (e) { if (e && e.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(jokeText()); toast("Copied to share"); }
    catch { toast("Share unavailable"); }
  });
  favToggle.addEventListener("click", () => setDrawer(!drawer.classList.contains("open")));
  $("closeDrawer").addEventListener("click", () => setDrawer(false));

  document.addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea")) return;
    if (e.code === "Space") { e.preventDefault(); if (!primaryBtn.disabled) primaryBtn.click(); }
    else if (e.key.toLowerCase() === "s") toggleSave();
    else if (e.key === "Escape") setDrawer(false);
  });

  renderFavs();
  loadJoke();
})();
