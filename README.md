# DAD. — Jokes on Demand

A bold, premium-feeling dad joke generator. Dark editorial design, gold accents, big serif type.

## Features
- Setup first, punchline revealed on tap (or `Space`)
- Pulls fresh jokes from [icanhazdadjoke.com](https://icanhazdadjoke.com) with a built-in offline library as fallback
- Save favourites (`S`), rate the groan level, copy or share
- Saved jokes and ratings persist in your browser

## Run it
No build step. Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

## Adding jokes
Write new jokes one per line as `setup|punchline` in a text file, then run:

```sh
node scripts/add_jokes.js new-jokes.txt
```

Duplicates (same setup or same punchline) are skipped automatically. A weekly
scheduled task adds 15 new jokes this way and republishes the hosted page.
