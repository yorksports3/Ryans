# Getting DAD. onto the App Store

The iPhone app is in `ios/`. It's the same design as the web app, plus four
iPhone-only features:

- **Daily joke notification:** the setup arrives at a time you pick, and tapping it opens the app on that joke.
- **Haptics:** a tap when the punchline is revealed and when you save or rate.
- **Native share sheet:** share to Messages, WhatsApp and so on.
- **Home Screen and Lock Screen widget:** a different joke every day.

Two GitHub Actions workflows run on Macs in the cloud, so **you don't need a Mac**:

- **iOS build** runs on every push. It compiles the app and widget and opens the app in the iPhone Simulator.
- **Upload to TestFlight** runs only when you press *Run workflow*. It signs the app and uploads it to App Store Connect.

---

## Step 1. Join the Apple Developer Program (you)
- Sign up at <https://developer.apple.com/programs/>. It costs $99/year.
- Enroll as an **Individual** unless you have a registered company. A company needs a D-U-N-S number and takes longer.
- Apple verifies your identity, which can take up to a couple of days. You can't do the next steps until it's approved.

## Step 2. Create the app in App Store Connect (you, about 5 minutes)
1. At <https://developer.apple.com/account/resources/identifiers/list>, click **+ → App IDs → App** and register:
   - **Bundle ID (explicit):** `com.yorksports3.dadjokes`, with **Description** *DAD. Jokes*. No extra capabilities are needed.
   - The upload workflow registers the widget's ID (`com.yorksports3.dadjokes.widget`) automatically. You can also add it here by hand.
2. At <https://appstoreconnect.apple.com> → **Apps → + → New App**:
   - **Platform:** iOS
   - **Name:** must be unique on the store. "DAD." is probably taken. Try *DAD. Jokes*, *DAD. — Daily Dad Jokes* or *Groan: Dad Jokes*.
   - **Primary language:** English (U.S.)
   - **Bundle ID:** pick `com.yorksports3.dadjokes`
   - **SKU:** anything, e.g. `dadjokes001`
   - **User access:** Full Access

## Step 3. Give GitHub permission to upload (you, about 5 minutes)
**Create an API key**
1. Go to App Store Connect → **Users and Access → Integrations → App Store Connect API → Team Keys**. You may need to click *Request Access* first.
2. Click **+**. Name it *GitHub upload* and give it **Admin** access. Admin is needed so the workflow can create signing certificates for you.
3. **Download** the `.p8` file. Apple only lets you download it once.
4. Note the **Key ID** next to the key, and the **Issuer ID** shown above the list.
5. Find your **Team ID** at <https://developer.apple.com/account> → *Membership details*.

**Add four secrets to GitHub**
Go to <https://github.com/yorksports3/Ryans/settings/secrets/actions> → **New repository secret**:

| Name | Value |
|---|---|
| `APPLE_TEAM_ID` | your Team ID |
| `ASC_KEY_ID` | the Key ID |
| `ASC_ISSUER_ID` | the Issuer ID |
| `ASC_KEY_P8` | open the `.p8` file in a text editor and paste **everything**, including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines |

> Never paste the key into a chat or commit it to the repo. GitHub secrets are encrypted and hidden from logs.

## Step 4. Upload a build (one click)
1. Go to <https://github.com/yorksports3/Ryans/actions/workflows/testflight.yml>.
2. Click **Run workflow**. Leave the version at `1.0` for the first release, then click **Run workflow**.
3. It takes about 10–20 minutes. When it's green, the build appears in App Store Connect → your app → **TestFlight** after Apple processes it (another 15–30 minutes).
4. Install **TestFlight** from the App Store on your iPhone and add yourself as an internal tester to try the real app: notifications, widget, haptics and share.

The workflow gives every upload a new build number automatically. If a run fails, ask Claude to read its logs.

## Step 5. Fill in the listing
Draft text you can paste:

**Subtitle (30 chars):** `Daily groaners, beautifully.`

**Promotional text:** `A fresh dad joke on your Lock Screen every morning. Open for the punchline.`

**Description:**
```
DAD. is the dad joke app that takes its terrible jokes very seriously.

Big, bold type. A gold punchline that arrives on your tap. Hundreds of hand-picked groaners, with new ones added every week.

• Setup first, punchline on tap. Timing is everything.
• Rate every joke on the Groan Meter, from Meh to Peak Dad.
• Daily joke notification at the time you choose.
• Home Screen and Lock Screen widget with a new joke every day.
• Save your favourites for the next family dinner.
• Share jokes to Messages, WhatsApp and more.
• Optional PG-13 mode for cheekier after-hours jokes. Off by default.
• Works offline. No accounts, no ads, no tracking.
```

**Keywords (100 chars):** `dad jokes,jokes,puns,funny,humor,daily joke,widget,pun,laugh,family,clean jokes,one liners`

**Category:** Entertainment

**Age rating:** because of the optional PG-13 mode, answer **"Infrequent/Mild"** for *Mature or Suggestive Themes*, *Profanity or Crude Humor* and *Alcohol, Tobacco, or Drug Use or References*, and "None" for everything else. Apple will likely rate the app **13+** (older questionnaires show 12+). If you'd rather keep a 4+ rating for a wider audience, ask Claude to leave PG-13 mode out of the App Store build.

**Privacy:**
- *App Privacy* → **Data Not Collected**.
- *Privacy Policy URL:* <https://yorksports3.github.io/Ryans/privacy.html>

**Support URL:** <https://yorksports3.github.io/Ryans/>

**Screenshots** are ready in [`appstore/screenshots/`](appstore/screenshots/). Upload them in this order:

| Device size in App Store Connect | Files |
|---|---|
| **iPhone 6.9"** (1320 × 2868) | `iphone-1-setup.png` … `iphone-5-saved.png` |
| **iPad 13"** (2064 × 2752) | `ipad-1-setup.png` … `ipad-5-saved.png` |

They show a setup, a punchline with the Groan Meter, PG-13 mode, the daily-joke settings and saved jokes. If you take your own in TestFlight, a widget shot is a great addition.

**App Review notes** (paste into *App Review Information → Notes*):
```
DAD. is a native iPhone app, not a website. It works fully offline with a bundled library of 300+ jokes that is updated weekly. iOS features:
• Local daily notifications (Daily button, bell icon in the header) with a user-chosen time; tapping one opens that joke.
• A WidgetKit widget for the Home Screen (small, medium, large) and Lock Screen.
• Haptic feedback on reveal, save and Groan Meter ratings.
• The native share sheet.
PG-13 mode is optional and off by default (PG | PG-13 switch in the header). Notifications and the widget always use the family-friendly list.
No account or login is needed.
```

## Step 6. Submit for review
In the app's page:
1. Under the version, click **Add Build** and pick your TestFlight build.
2. Answer the export-compliance question. The app already declares "no non-exempt encryption".
3. Click **Submit for Review**.

Reviews usually take 1–3 days. If Apple rejects it, for example under 4.2 "minimum functionality" or 4.3 "spam", which they're strict about for joke apps, share the message with Claude to help with fixes or a reply.

---

## Updating the app later
- **New jokes** reach the web page and GitHub Pages weekly on their own. The App Store version only changes when you upload a new build: run **Upload to TestFlight** again, then submit the new build.
- **New version:** enter a higher version (e.g. `1.1`) when you run the workflow. Build numbers increase automatically.
- **With a Mac instead:** `npm ci && npm run sync`, open `ios/App/App.xcodeproj`, set your Team on the **App** and **DadJokesWidget** targets, then **Product → Archive → Distribute App**.
