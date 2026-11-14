# DAD. — Jokes on Demand

A bold, premium-feeling dad joke generator. Dark editorial design, gold accents, big serif type.

## Features
- Setup first, punchline revealed on tap (or `Space`)
- Pulls fresh jokes from [icanhazdadjoke.com](https://icanhazdadjoke.com) with a built-in offline library as fallback
- Save favourites (`S`), rate the groan level, copy or share
- Optional **PG-13** mode (header toggle) with its own cheekier joke list in `www/jokes-pg13.js`; notifications and the widget always stay clean
- Saved jokes and ratings persist in your browser

## Run it
**Web:** no build step. Open `www/index.html` in a browser, or serve the folder:

```sh
cd www && python3 -m http.server 8000
```

**iPhone app:** built with [Capacitor](https://capacitorjs.com). The Xcode
project is in `ios/`. See [APP_STORE.md](APP_STORE.md) for building, the
iPhone-only features and publishing to the App Store.

```sh
npm ci && npm run sync    # then open ios/App/App.xcodeproj in Xcode
```

## Adding jokes
Jokes live in `www/jokes.js`. Write new jokes one per line as `setup|punchline` in a text file, then run:

```sh
node scripts/add_jokes.js new-jokes.txt          # clean list
node scripts/add_jokes.js --pg13 new-jokes.txt   # PG-13 list
```

Duplicates (same setup or same punchline) are skipped automatically. A weekly
scheduled task adds 15 clean and 5 PG-13 jokes this way and republishes the hosted page.
