# Getting DAD. onto the App Store

The iPhone app is in `ios/`. It's the same design as the web app, plus four
iPhone-only features:

- **Daily joke notification:** the setup arrives at a time you pick, and tapping it opens the app on that joke.
- **Haptics:** a tap when the punchline is revealed and when you save or rate.
- **Native share sheet:** share to Messages, WhatsApp and so on.
- **Home Screen and Lock Screen widget:** a different joke every day.

Every push that changes the app runs **GitHub Actions → "iOS build"**. It
compiles the app and widget on a Mac in the cloud, opens the app in the iPhone
Simulator and saves a screenshot under the run's *Artifacts*.

---

## 1. Join the Apple Developer Program
- Sign up at <https://developer.apple.com/programs/>. It costs $99/year.
- Enroll as an **Individual** unless you have a registered company. A company needs a D-U-N-S number and takes longer.
- Apple verifies your identity, which can take up to a couple of days.

## 2. Pick how you'll build and upload
Apple only accepts uploads built with Xcode on a Mac. Options:

| Option | Cost | Notes |
|---|---|---|
| **Any Mac with Xcode** (yours, borrowed, or a Mac mini) | Free if you have one | Simplest. Follow step 4 below. |
| **GitHub Actions** (already set up for test builds) | Uses GitHub's macOS minutes | Ask Claude to extend the workflow to sign and upload to TestFlight. You'll add an App Store Connect API key as a GitHub secret. |
| **Codemagic / Bitrise** | Free tiers available | Cloud Mac build services with guided signing setup. |

## 3. Create the app in App Store Connect
At <https://appstoreconnect.apple.com> → **Apps → +**:

- **Platform:** iOS
- **Name:** must be unique on the store. "DAD." may be taken; alternatives: *DAD. Jokes*, *DAD. — Daily Dad Jokes*, *Groan: Dad Jokes*.
- **Bundle ID:** `com.yorksports3.dadjokes`. Register it first under *Certificates, Identifiers & Profiles → Identifiers*, plus `com.yorksports3.dadjokes.widget` for the widget. To use a different ID, change `appId` in `capacitor.config.json` and both `PRODUCT_BUNDLE_IDENTIFIER`s in Xcode.
- **SKU:** anything, e.g. `dadjokes001`

## 4. Build and upload from a Mac
```sh
git clone https://github.com/yorksports3/Ryans.git && cd Ryans
git checkout claude/relaxed-gauss-88xww2
npm ci
npm run sync          # copies the web app + jokes into the iOS project
open ios/App/App.xcodeproj
```
In Xcode:
1. Select the **App** target → *Signing & Capabilities* → tick *Automatically manage signing* and choose your Team. Do the same for the **DadJokesWidget** target.
2. Choose *Any iOS Device (arm64)* as the destination, then **Product → Archive**.
3. In the Organizer: **Distribute App → App Store Connect → Upload**.
4. The build appears in App Store Connect → **TestFlight** after processing (about 15–30 min). Install it on your iPhone with the TestFlight app and try everything.

## 5. Fill in the listing
Draft text you can paste:

**Subtitle (30 chars):** `Daily groaners, beautifully.`

**Promotional text:** `A fresh dad joke on your Lock Screen every morning. Open for the punchline.`

**Description:**
```
DAD. is the dad joke app that takes its terrible jokes very seriously.

Big, bold type. A gold punchline that arrives on your tap. Hundreds of hand-picked groaners, with new ones added every week.

• Setup first, punchline on tap. Timing is everything.
• Daily joke notification at the time you choose.
• Home Screen and Lock Screen widget with a new joke every day.
• Save your favourites for the next family dinner.
• Rate every joke on the Groan Meter, from Mild Chuckle to Peak Dad.
• Share jokes to Messages, WhatsApp and more.
• Works offline. No accounts, no ads, no tracking.
```

**Keywords (100 chars):** `dad jokes,jokes,puns,funny,humor,daily joke,widget,pun,laugh,family,clean jokes,one liners`

**Category:** Entertainment · **Age rating:** 4+ (answer "None" to every content question)

**Privacy:**
- *App Privacy* → **Data Not Collected**.
- *Privacy Policy URL* must be a public web address. The policy is in `www/privacy.html`. It is hosted on GitHub Pages at <https://yorksports3.github.io/Ryans/privacy.html>. Paste that link.

**Support URL:** <https://yorksports3.github.io/Ryans/> works, or any contact page you control.

**Screenshots:**
- Required: **6.9-inch iPhone** (1320 × 2868).
- The app currently also runs on iPad, so Apple will ask for **13-inch iPad** screenshots too. To skip iPad, ask Claude to make it iPhone-only.
- Take them in TestFlight on a large iPhone, or in Xcode's Simulator (iPhone 17 Pro Max), with **File → Save Screen**. Good shots: a setup, a revealed punchline, the widget, the daily-joke settings.

## 6. Submit for review
In the app's page, pick your build, answer the export question (already set to "no encryption" in `Info.plist`) and **Submit for Review**. Reviews usually take 1–3 days.

**If it's rejected for "minimum functionality" (4.2) or "spam" (4.3):** Apple is strict with joke apps and simple web wrappers. In your review notes, mention the native features: notifications, widget, haptics, share sheet and offline library. Claude can help write an appeal or add more native features.

---

## Updating the app later
- **New jokes:** run `node scripts/add_jokes.js new-jokes.txt`, then `npm run sync` and upload a new build with a higher *Build* number. The weekly scheduled task updates the web page and `www/jokes.js`. The App Store version only changes when you upload a new build.
- **Version numbers:** bump *Version* (1.0 → 1.1) for each release in Xcode → App target → General. Use the same values on the widget target.
